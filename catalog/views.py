"""
Catalog API.

Public read endpoints (anyone can browse):
    GET /api/shops/                    — list shops
    GET /api/shops/<slug>/             — shop detail
    GET /api/shops/<slug>/categories/  — categories of a shop
    GET /api/shops/<slug>/flowers/     — flowers (filter by ?category=, ?featured=)
    GET /api/flowers/<id>/             — flower detail (sizes + tiers)
    GET /api/shops/<slug>/promotions/  — running promotions

Manager-only write endpoints:
    POST /api/categories/, PATCH/DELETE /api/categories/<id>/
    POST /api/flowers/,    PATCH/DELETE /api/flowers/<id>/
    POST /api/sizes/,      DELETE /api/sizes/<id>/
    POST /api/tiers/,      DELETE /api/tiers/<id>/
    POST /api/promotions/, PATCH/DELETE /api/promotions/<id>/

Stock management:
    POST /api/flowers/<id>/restock/   {delta, note} → manager only
    GET  /api/flowers/<id>/movements/ → recent stock changes
"""
from decimal import Decimal
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from accounts.models import Shop
from accounts.permissions import (
    IsManager,
    IsManagerOrReadOnly,
    IsManagerOfObjectShop,
)
from catalog.models import (
    Category,
    Flower,
    FlowerSize,
    DiscountTier,
    Promotion,
    StockMovement,
)


# ---------------------------------------------------------------------------
# Serializers
# ---------------------------------------------------------------------------

class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = ['id', 'name', 'slug', 'address', 'phone', 'email', 'logo', 'is_active']
        read_only_fields = ['id', 'slug', 'is_active']


class CategorySerializer(serializers.ModelSerializer):
    flower_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'shop', 'name', 'slug', 'description',
            'photo', 'is_active', 'sort_order', 'flower_count', 'created_at',
        ]
        read_only_fields = ['id', 'slug', 'flower_count', 'created_at', 'shop']

    def get_flower_count(self, obj):
        return obj.flowers.filter(is_active=True).count()

    def validate_shop(self, value):
        # Manager can only create categories in their own shop
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_manager():
            if value != request.user.shop:
                raise serializers.ValidationError(
                    'Можно создавать категории только в своём магазине.'
                )
        return value


class FlowerSizeSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = FlowerSize
        fields = ['id', 'flower', 'quantity', 'label', 'price', 'is_active']
        read_only_fields = ['id', 'price']


class DiscountTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountTier
        fields = ['id', 'flower', 'min_quantity', 'percent']
        read_only_fields = ['id']


class FlowerListSerializer(serializers.ModelSerializer):
    """Compact serializer for flower lists."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Flower
        fields = [
            'id', 'name', 'slug', 'category', 'category_name',
            'photo', 'base_price', 'stock', 'is_low_stock', 'is_out_of_stock',
            'is_active', 'is_featured', 'available_for_custom',
        ]


class FlowerDetailSerializer(serializers.ModelSerializer):
    """Full flower with sizes + tiers nested."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    sizes = FlowerSizeSerializer(many=True, read_only=True)
    discount_tiers = DiscountTierSerializer(many=True, read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Flower
        fields = [
            'id', 'name', 'slug', 'category', 'category_name',
            'description', 'photo', 'base_price',
            'stock', 'low_stock_threshold', 'is_low_stock', 'is_out_of_stock',
            'is_active', 'is_featured', 'available_for_custom',
            'sizes', 'discount_tiers',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class PromotionSerializer(serializers.ModelSerializer):
    is_running = serializers.BooleanField(read_only=True)

    class Meta:
        model = Promotion
        fields = [
            'id', 'shop', 'title', 'slug', 'subtitle', 'description',
            'banner_image', 'badge_text',
            'discount_type', 'discount_value', 'promo_code',
            'scope', 'categories', 'flowers',
            'min_order_amount', 'max_uses', 'max_uses_per_customer', 'times_used',
            'starts_at', 'ends_at', 'is_active', 'is_featured', 'sort_order',
            'is_running',
        ]
        read_only_fields = ['id', 'slug', 'times_used', 'is_running', 'shop']


class StockMovementSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True, default=None,
    )
    order_number = serializers.CharField(
        source='related_order.number', read_only=True, default=None,
    )

    class Meta:
        model = StockMovement
        fields = [
            'id', 'flower', 'delta', 'reason', 'note',
            'stock_after', 'related_order', 'order_number',
            'created_by', 'created_by_username', 'created_at',
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# ViewSets
# ---------------------------------------------------------------------------

class ShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.filter(is_active=True)
    serializer_class = ShopSerializer
    lookup_field = 'slug'
    http_method_names = ['get', 'patch', 'head', 'options']  # no POST/DELETE — shops are
                                                              # created via Django admin only
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        # Public can read; only authenticated managers can edit (their own shop).
        if self.action in ('list', 'retrieve', 'categories', 'flowers', 'promotions'):
            return [AllowAny()]
        return [IsManager()]

    def get_object(self):
        obj = super().get_object()
        # On write: enforce manager owns this shop
        if self.request.method not in ('GET', 'HEAD', 'OPTIONS'):
            if obj != self.request.user.shop:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('Можно редактировать только свой магазин.')
        return obj

    @action(detail=False, methods=['get'], permission_classes=[IsManager])
    def mine(self, request):
        """Return the authenticated manager's own shop. Convenience for dashboard."""
        if not request.user.shop:
            return Response({'detail': 'Нет магазина.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ShopSerializer(request.user.shop, context={'request': request}).data)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def categories(self, request, slug=None):
        shop = self.get_object()
        qs = shop.categories.filter(is_active=True)
        return Response(CategorySerializer(qs, many=True, context={'request': request}).data)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def flowers(self, request, slug=None):
        shop = self.get_object()
        qs = Flower.objects.filter(category__shop=shop, is_active=True).select_related('category')

        category_id = request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)

        if request.query_params.get('featured') in ('1', 'true'):
            qs = qs.filter(is_featured=True)

        if request.query_params.get('available_for_custom') in ('1', 'true'):
            qs = qs.filter(available_for_custom=True)

        return Response(FlowerListSerializer(qs, many=True, context={'request': request}).data)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def promotions(self, request, slug=None):
        shop = self.get_object()
        now = timezone.now()
        qs = shop.promotions.filter(is_active=True, starts_at__lte=now, ends_at__gte=now)
        return Response(PromotionSerializer(qs, many=True, context={'request': request}).data)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().select_related('shop')
    serializer_class = CategorySerializer
    permission_classes = [IsManagerOrReadOnly]

    def get_queryset(self):
        qs = Category.objects.all().select_related('shop')
        # Public: only active categories. Staff: all of their shop.
        if self.request.user.is_authenticated and self.request.user.is_staff_member():
            return qs.filter(shop=self.request.user.shop)
        return qs.filter(is_active=True)

    def perform_create(self, serializer):
        # Auto-fill shop from the manager's profile so React doesn't need to
        # send it (it's always the manager's own shop anyway).
        serializer.save(shop=self.request.user.shop)


class FlowerViewSet(viewsets.ModelViewSet):
    queryset = Flower.objects.all().select_related('category', 'category__shop')
    permission_classes = [IsManagerOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return FlowerListSerializer
        return FlowerDetailSerializer

    def get_queryset(self):
        qs = Flower.objects.all().select_related('category', 'category__shop')
        if self.request.user.is_authenticated and self.request.user.is_staff_member():
            return qs.filter(category__shop=self.request.user.shop)
        return qs.filter(is_active=True)

    @action(detail=True, methods=['post'], permission_classes=[IsManager])
    def restock(self, request, pk=None):
        """Manager adds (or removes via negative delta) stems. Logs movement."""
        flower = self.get_object()
        if flower.category.shop != request.user.shop:
            return Response(
                {'detail': 'Можно управлять только своим магазином.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            delta = int(request.data.get('delta', 0))
        except (TypeError, ValueError):
            return Response({'delta': 'Должно быть целым числом.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if delta == 0:
            return Response({'delta': 'Не может быть 0.'},
                            status=status.HTTP_400_BAD_REQUEST)
        new_stock = max(0, flower.stock + delta)
        flower.stock = new_stock
        flower.save(update_fields=['stock'])

        reason = request.data.get('reason') or (
            StockMovement.Reason.RESTOCK if delta > 0 else StockMovement.Reason.ADJUSTMENT
        )
        movement = StockMovement.objects.create(
            flower=flower,
            delta=delta,
            reason=reason,
            note=request.data.get('note', ''),
            stock_after=new_stock,
            created_by=request.user,
        )
        return Response({
            'flower': FlowerListSerializer(flower).data,
            'movement': StockMovementSerializer(movement).data,
        })

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def movements(self, request, pk=None):
        flower = self.get_object()
        if (
            flower.category.shop != request.user.shop
            or not request.user.is_staff_member()
        ):
            return Response({'detail': 'Доступ запрещён.'},
                            status=status.HTTP_403_FORBIDDEN)
        movements = flower.stock_movements.all()[:100]
        return Response(StockMovementSerializer(movements, many=True).data)

    @action(detail=False, methods=['get'], permission_classes=[IsManager])
    def low_stock(self, request):
        """Flowers at or below their low-stock threshold."""
        from django.db.models import F
        qs = self.get_queryset().filter(stock__lte=F('low_stock_threshold'))
        return Response(FlowerListSerializer(qs, many=True).data)


class FlowerSizeViewSet(viewsets.ModelViewSet):
    queryset = FlowerSize.objects.all().select_related('flower', 'flower__category')
    serializer_class = FlowerSizeSerializer
    permission_classes = [IsManagerOrReadOnly]

    def get_queryset(self):
        qs = FlowerSize.objects.all().select_related('flower', 'flower__category')
        if self.request.user.is_authenticated and self.request.user.is_staff_member():
            return qs.filter(flower__category__shop=self.request.user.shop)
        return qs.filter(is_active=True, flower__is_active=True)


class DiscountTierViewSet(viewsets.ModelViewSet):
    queryset = DiscountTier.objects.all().select_related('flower', 'flower__category')
    serializer_class = DiscountTierSerializer
    permission_classes = [IsManagerOrReadOnly]

    def get_queryset(self):
        qs = DiscountTier.objects.all().select_related('flower', 'flower__category')
        if self.request.user.is_authenticated and self.request.user.is_staff_member():
            return qs.filter(flower__category__shop=self.request.user.shop)
        return qs.filter(flower__is_active=True)


class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.all().select_related('shop')
    serializer_class = PromotionSerializer
    permission_classes = [IsManagerOrReadOnly]

    def get_queryset(self):
        qs = Promotion.objects.all().select_related('shop')
        if self.request.user.is_authenticated and self.request.user.is_staff_member():
            return qs.filter(shop=self.request.user.shop)
        # Public: only running promos
        now = timezone.now()
        return qs.filter(is_active=True, starts_at__lte=now, ends_at__gte=now)

    def perform_create(self, serializer):
        serializer.save(shop=self.request.user.shop)
