"""
Orders API.

Customer-facing:
    GET    /api/cart/?shop=<slug>                 — view cart
    POST   /api/cart/items/                       — add item
    PATCH  /api/cart/items/<id>/                  — update qty
    DELETE /api/cart/items/<id>/                  — remove item
    DELETE /api/cart/                             — empty cart

    POST   /api/orders/checkout/                  — turn cart into order
    GET    /api/orders/                           — list my orders
    GET    /api/orders/<number>/                  — order detail

Payment:
    POST   /api/orders/<number>/pay/              — start Sberbank payment
    GET    /api/orders/return/?orderId=...        — Sberbank return callback
    GET    /api/orders/fail/?orderId=...          — Sberbank fail callback

Invoice:
    GET    /api/orders/<number>/invoice/          — invoice JSON

Dashboard (manager-only):
    GET    /api/dashboard/overview/?shop=<slug>   — KPIs
    GET    /api/dashboard/orders/?shop=<slug>     — full order list (filterable)
    PATCH  /api/dashboard/orders/<number>/status/ — change status
    GET    /api/dashboard/customers/?shop=<slug>  — customer list with metrics
"""
from decimal import Decimal
from datetime import timedelta
import uuid

from django.db import transaction
from django.db.models import Sum, Count, Q, F
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone

from rest_framework import serializers, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Shop, User, CustomerProfile
from accounts.permissions import IsManager
from catalog.models import Flower, FlowerSize, Promotion, StockMovement
from orders.cart import get_or_create_cart
from orders.models import Cart, CartItem, Order, OrderItem, Payment, Invoice
from orders.sberbank import (
    SberbankClient,
    SberbankError,
    confirm_sberbank_payment,
    start_sberbank_payment,
)


# ---------------------------------------------------------------------------
# Serializers
# ---------------------------------------------------------------------------

class CartItemSerializer(serializers.ModelSerializer):
    flower_name = serializers.CharField(source='flower.name', read_only=True)
    flower_photo = serializers.ImageField(source='flower.photo', read_only=True)
    size_label = serializers.SerializerMethodField()
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    is_custom = serializers.BooleanField(read_only=True)
    stems = serializers.IntegerField(read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id', 'flower', 'flower_name', 'flower_photo',
            'size', 'size_label', 'quantity', 'stems',
            'custom_bouquet_id', 'is_custom', 'line_total', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_size_label(self, obj):
        return str(obj.size) if obj.size else None


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    shop_slug = serializers.SlugField(source='shop.slug', read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)

    class Meta:
        model = Cart
        fields = [
            'id', 'shop', 'shop_slug', 'shop_name',
            'items', 'total', 'item_count', 'updated_at',
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'flower', 'flower_name', 'size', 'size_label',
            'custom_bouquet_id', 'stems', 'quantity', 'unit_price', 'line_total',
        ]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    shop_slug = serializers.SlugField(source='shop.slug', read_only=True)
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'number', 'shop', 'shop_name', 'shop_slug',
            'customer_name', 'customer_phone', 'customer_email',
            'delivery_method', 'delivery_address', 'delivery_date',
            'delivery_time', 'delivery_cost', 'note',
            'subtotal', 'discount_amount', 'total',
            'promotion', 'promo_code_used',
            'status', 'payment_status',
            'created_at', 'paid_at',
            'items',
        ]
        read_only_fields = [
            'id', 'number', 'subtotal', 'discount_amount', 'total',
            'status', 'created_at', 'paid_at', 'payment_status', 'items',
        ]

    def get_payment_status(self, obj):
        last_payment = obj.payments.order_by('-created_at').first()
        return last_payment.status if last_payment else None


# ---------------------------------------------------------------------------
# Cart endpoints
# ---------------------------------------------------------------------------

class CartView(APIView):
    permission_classes = [AllowAny]

    def _get_shop(self, request):
        shop_slug = request.query_params.get('shop') or request.data.get('shop')
        if not shop_slug:
            return None
        return Shop.objects.filter(slug=shop_slug, is_active=True).first()

    def get(self, request):
        shop = self._get_shop(request)
        if not shop:
            return Response({'detail': 'Параметр ?shop=<slug> обязателен.'},
                            status=status.HTTP_400_BAD_REQUEST)
        cart = get_or_create_cart(request, shop)
        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request):
        shop = self._get_shop(request)
        if not shop:
            return Response({'detail': 'shop slug required'}, status=400)
        cart = get_or_create_cart(request, shop)
        cart.items.all().delete()
        return Response(CartSerializer(cart, context={'request': request}).data)


class AddCartItemSerializer(serializers.Serializer):
    shop = serializers.SlugField()
    flower_id = serializers.IntegerField()
    size_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, default=1)
    custom_bouquet_id = serializers.UUIDField(required=False, allow_null=True)


@api_view(['POST'])
@permission_classes([AllowAny])
def add_cart_item(request):
    """
    Add an item to the cart.
        Preset bouquet: pass size_id (and quantity = number of bouquets)
        Custom flower:  omit size_id, pass quantity = stems
    """
    serializer = AddCartItemSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    shop = get_object_or_404(Shop, slug=data['shop'], is_active=True)
    flower = get_object_or_404(Flower, pk=data['flower_id'], is_active=True)

    if flower.category.shop_id != shop.id:
        return Response({'detail': 'Цветок не принадлежит этому магазину.'},
                        status=status.HTTP_400_BAD_REQUEST)

    size = None
    if data.get('size_id'):
        size = get_object_or_404(FlowerSize, pk=data['size_id'], flower=flower, is_active=True)

    cart = get_or_create_cart(request, shop)

    # Stock check (sum existing line stems + new request)
    new_stems = (size.quantity if size else 1) * data['quantity']
    if size is None:
        new_stems = data['quantity']
    if new_stems > flower.stock:
        return Response(
            {'detail': f'Недостаточно цветов в наличии. Доступно: {flower.stock}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    item = CartItem.objects.create(
        cart=cart,
        flower=flower,
        size=size,
        quantity=data['quantity'],
        custom_bouquet_id=data.get('custom_bouquet_id'),
    )
    return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([AllowAny])
def cart_item_detail(request, pk):
    item = get_object_or_404(CartItem, pk=pk)
    cart = item.cart
    # Verify ownership
    if request.user.is_authenticated:
        if cart.user_id != request.user.id:
            return Response({'detail': 'Доступ запрещён.'}, status=403)
    else:
        session_key = request.session.session_key
        if cart.session_key != session_key:
            return Response({'detail': 'Доступ запрещён.'}, status=403)

    if request.method == 'DELETE':
        item.delete()
        return Response(status=204)

    qty = request.data.get('quantity')
    if qty is not None:
        try:
            qty = int(qty)
        except (TypeError, ValueError):
            return Response({'quantity': 'invalid'}, status=400)
        if qty < 1:
            return Response({'quantity': 'must be >= 1'}, status=400)
        item.quantity = qty
        item.save(update_fields=['quantity'])
    return Response(CartItemSerializer(item).data)


# ---------------------------------------------------------------------------
# Custom bouquet helper — calculate price for a draft custom bouquet
# ---------------------------------------------------------------------------

class CustomBouquetItemSerializer(serializers.Serializer):
    flower_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class CustomBouquetSerializer(serializers.Serializer):
    shop = serializers.SlugField()
    items = CustomBouquetItemSerializer(many=True)


@api_view(['POST'])
@permission_classes([AllowAny])
def custom_bouquet_quote(request):
    """
    Calculate the price of a custom bouquet draft without saving anything.
    Used by the bouquet builder UI for live price updates.
    """
    serializer = CustomBouquetSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    shop = get_object_or_404(Shop, slug=data['shop'], is_active=True)
    total = Decimal('0')
    breakdown = []
    for entry in data['items']:
        flower = get_object_or_404(
            Flower,
            pk=entry['flower_id'],
            is_active=True,
            available_for_custom=True,
            category__shop=shop,
        )
        line_price = flower.price_for_quantity(entry['quantity'])
        total += line_price
        breakdown.append({
            'flower_id': flower.id,
            'flower_name': flower.name,
            'quantity': entry['quantity'],
            'unit_price': str(flower.base_price),
            'multiplier': str(flower.discount_multiplier_for(entry['quantity'])),
            'line_total': str(line_price),
        })

    return Response({
        'total': str(total),
        'breakdown': breakdown,
        'custom_bouquet_id': str(uuid.uuid4()),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def add_custom_bouquet(request):
    """Add a complete custom bouquet (multiple flowers) to the cart in one call."""
    serializer = CustomBouquetSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    shop = get_object_or_404(Shop, slug=data['shop'], is_active=True)
    bouquet_id = uuid.uuid4()
    cart = get_or_create_cart(request, shop)

    created_items = []
    for entry in data['items']:
        flower = get_object_or_404(
            Flower,
            pk=entry['flower_id'],
            is_active=True,
            available_for_custom=True,
            category__shop=shop,
        )
        if entry['quantity'] > flower.stock:
            return Response(
                {'detail': f'Недостаточно «{flower.name}». Доступно: {flower.stock}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        item = CartItem.objects.create(
            cart=cart,
            flower=flower,
            size=None,
            quantity=entry['quantity'],
            custom_bouquet_id=bouquet_id,
        )
        created_items.append(item)

    return Response({
        'custom_bouquet_id': str(bouquet_id),
        'items': CartItemSerializer(created_items, many=True).data,
        'cart': CartSerializer(cart).data,
    }, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Checkout — turn cart into Order
# ---------------------------------------------------------------------------

class CheckoutSerializer(serializers.Serializer):
    shop = serializers.SlugField()
    customer_name = serializers.CharField(max_length=200)
    customer_phone = serializers.CharField(max_length=30)
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    delivery_method = serializers.ChoiceField(
        choices=Order.DeliveryMethod.choices,
        default=Order.DeliveryMethod.DELIVERY,
    )
    delivery_address = serializers.CharField(required=False, allow_blank=True, max_length=500)
    delivery_date = serializers.DateField(required=False, allow_null=True)
    delivery_time = serializers.CharField(required=False, allow_blank=True, max_length=50)
    delivery_cost = serializers.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('0'),
    )
    note = serializers.CharField(required=False, allow_blank=True)
    promo_code = serializers.CharField(required=False, allow_blank=True, max_length=50)


@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def checkout(request):
    """Convert the cart into a pending Order and clear the cart."""
    serializer = CheckoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    shop = get_object_or_404(Shop, slug=data['shop'], is_active=True)
    cart = get_or_create_cart(request, shop)

    if cart.item_count == 0:
        return Response({'detail': 'Корзина пуста.'},
                        status=status.HTTP_400_BAD_REQUEST)

    # Validate stock again — situations may have changed since "add to cart"
    for item in cart.items.all():
        if item.stems > item.flower.stock:
            return Response(
                {'detail': f'Недостаточно «{item.flower.name}». Доступно: {item.flower.stock}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Resolve promo code (if any)
    promotion = None
    if data.get('promo_code'):
        now = timezone.now()
        promotion = (
            shop.promotions.filter(
                promo_code__iexact=data['promo_code'],
                is_active=True,
                starts_at__lte=now,
                ends_at__gte=now,
            )
            .first()
        )
        if not promotion:
            return Response({'promo_code': 'Промокод не найден или истёк.'},
                            status=status.HTTP_400_BAD_REQUEST)

    order = Order.objects.create(
        shop=shop,
        user=request.user if request.user.is_authenticated else None,
        customer_name=data['customer_name'],
        customer_phone=data['customer_phone'],
        customer_email=data.get('customer_email', ''),
        delivery_method=data['delivery_method'],
        delivery_address=data.get('delivery_address', ''),
        delivery_date=data.get('delivery_date'),
        delivery_time=data.get('delivery_time', ''),
        delivery_cost=data.get('delivery_cost', Decimal('0')),
        note=data.get('note', ''),
        promotion=promotion,
        promo_code_used=(data.get('promo_code') or ''),
    )

    # Move cart items into order items, with price snapshot
    for item in cart.items.all():
        unit_price = (
            item.flower.price_for_quantity(item.size.quantity)
            if item.size else item.flower.price_for_quantity(item.quantity)
        )
        OrderItem.objects.create(
            order=order,
            flower=item.flower,
            size=item.size,
            flower_name=item.flower.name,
            size_label=str(item.size) if item.size else '',
            custom_bouquet_id=item.custom_bouquet_id,
            stems=item.stems,
            quantity=item.quantity,
            unit_price=unit_price,
            line_total=item.line_total,
        )

    order.recalculate_totals()
    cart.items.all().delete()

    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Order list/detail
# ---------------------------------------------------------------------------

class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'number'

    def get_queryset(self):
        user = self.request.user
        if user.is_staff_member():
            return Order.objects.filter(shop=user.shop).order_by('-created_at')
        return Order.objects.filter(user=user).order_by('-created_at')


# ---------------------------------------------------------------------------
# Payment views
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def start_payment(request, number):
    """
    Begin Sberbank payment for an order. Returns payment_url to redirect to.
    Supports both authenticated and guest checkout (guests must know order number).
    """
    order = get_object_or_404(Order, number=number)

    # Authorization: owner OR shop staff OR guest who created it (no user)
    if request.user.is_authenticated:
        if order.user_id and order.user_id != request.user.id:
            if not (request.user.is_staff_member() and request.user.shop_id == order.shop_id):
                return Response({'detail': 'Доступ запрещён.'}, status=403)
    elif order.user_id:
        return Response({'detail': 'Войдите в аккаунт для оплаты.'}, status=403)

    if order.status != Order.Status.PENDING:
        return Response({'detail': f'Заказ нельзя оплатить (статус: {order.status}).'},
                        status=status.HTTP_400_BAD_REQUEST)

    method = request.data.get('method', 'sberbank')

    if method == 'cash':
        # Cash on delivery — no Sberbank call
        if not order.shop.payment_settings.cash_on_delivery_enabled:
            return Response({'detail': 'Оплата при доставке отключена.'}, status=400)
        Payment.objects.create(
            order=order,
            provider=Payment.Provider.CASH,
            status=Payment.Status.PENDING,
            amount=order.total,
        )
        order.status = Order.Status.PROCESSING
        order.save(update_fields=['status'])
        return Response({'method': 'cash', 'order_number': order.number})

    # Sberbank
    try:
        payment = start_sberbank_payment(order)
    except SberbankError as exc:
        return Response(
            {'detail': f'Ошибка Сбербанка: {exc.message}', 'code': str(exc.code)},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except RuntimeError as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return Response({
        'payment_id': payment.id,
        'payment_url': payment.payment_url,
        'order_number': order.number,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def payment_return(request):
    """Sberbank redirects here after payment. We verify status and update order."""
    sber_order_id = request.GET.get('orderId')
    if not sber_order_id:
        return Response({'detail': 'orderId required'}, status=400)

    payment = (
        Payment.objects.filter(provider_order_id=sber_order_id)
        .select_related('order', 'order__shop')
        .first()
    )
    if not payment:
        return Response({'detail': 'Платёж не найден.'}, status=404)

    try:
        ok = confirm_sberbank_payment(payment)
    except SberbankError as exc:
        return Response({'detail': str(exc)}, status=502)

    return Response({
        'success': ok,
        'order_number': payment.order.number,
        'status': payment.status,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def payment_fail(request):
    """Sberbank redirects here if payment failed."""
    sber_order_id = request.GET.get('orderId')
    if sber_order_id:
        payment = Payment.objects.filter(provider_order_id=sber_order_id).first()
        if payment:
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=['status'])
    return Response({'success': False, 'detail': 'Оплата не прошла.'})


# ---------------------------------------------------------------------------
# Invoice
# ---------------------------------------------------------------------------

class InvoiceSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.number', read_only=True)
    customer_name = serializers.CharField(source='order.customer_name', read_only=True)
    customer_phone = serializers.CharField(source='order.customer_phone', read_only=True)
    items = OrderItemSerializer(source='order.items', many=True, read_only=True)
    subtotal = serializers.DecimalField(
        source='order.subtotal', max_digits=12, decimal_places=2, read_only=True,
    )
    discount_amount = serializers.DecimalField(
        source='order.discount_amount', max_digits=10, decimal_places=2, read_only=True,
    )
    delivery_cost = serializers.DecimalField(
        source='order.delivery_cost', max_digits=10, decimal_places=2, read_only=True,
    )
    total = serializers.DecimalField(
        source='order.total', max_digits=12, decimal_places=2, read_only=True,
    )

    class Meta:
        model = Invoice
        fields = [
            'number', 'issued_at', 'order_number',
            'seller_name', 'seller_address', 'seller_inn',
            'customer_name', 'customer_phone',
            'items',
            'subtotal', 'discount_amount', 'delivery_cost', 'total',
        ]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_invoice(request, number):
    order = get_object_or_404(Order, number=number)
    if request.user != order.user and not (
        request.user.is_staff_member() and request.user.shop_id == order.shop_id
    ):
        return Response({'detail': 'Доступ запрещён.'}, status=403)

    invoice = getattr(order, 'invoice', None)
    if not invoice:
        return Response({'detail': 'Счёт не сформирован (заказ не оплачен).'},
                        status=status.HTTP_404_NOT_FOUND)
    return Response(InvoiceSerializer(invoice).data)


# ---------------------------------------------------------------------------
# Manager dashboard
# ---------------------------------------------------------------------------

class DashboardOverview(APIView):
    permission_classes = [IsManager]

    def get(self, request):
        shop = request.user.shop
        if not shop:
            return Response({'detail': 'Менеджер не привязан к магазину.'}, status=400)

        now = timezone.now()
        today = now.date()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_30 = now - timedelta(days=30)

        all_orders = Order.objects.filter(shop=shop)
        paid_orders = all_orders.filter(
            status__in=[
                Order.Status.PAID, Order.Status.PROCESSING,
                Order.Status.READY, Order.Status.DELIVERED,
            ]
        )

        revenue_today = paid_orders.filter(created_at__date=today).aggregate(
            total=Sum('total'))['total'] or Decimal('0')
        revenue_month = paid_orders.filter(created_at__gte=month_start).aggregate(
            total=Sum('total'))['total'] or Decimal('0')
        revenue_30d = paid_orders.filter(created_at__gte=last_30).aggregate(
            total=Sum('total'))['total'] or Decimal('0')

        orders_today = all_orders.filter(created_at__date=today).count()
        orders_pending = all_orders.filter(status=Order.Status.PENDING).count()
        orders_processing = all_orders.filter(status=Order.Status.PROCESSING).count()

        flowers_qs = Flower.objects.filter(category__shop=shop)
        low_stock_count = flowers_qs.filter(stock__lte=F('low_stock_threshold')).count()
        out_of_stock_count = flowers_qs.filter(stock=0).count()

        customers = User.objects.filter(role=User.Role.CUSTOMER, orders__shop=shop).distinct()
        customer_count = customers.count()

        recent_orders = OrderSerializer(
            all_orders.order_by('-created_at')[:10], many=True
        ).data

        return Response({
            'shop': {'name': shop.name, 'slug': shop.slug},
            'revenue': {
                'today': str(revenue_today),
                'this_month': str(revenue_month),
                'last_30_days': str(revenue_30d),
            },
            'orders': {
                'today': orders_today,
                'pending_payment': orders_pending,
                'processing': orders_processing,
                'total_paid': paid_orders.count(),
            },
            'inventory': {
                'low_stock_flowers': low_stock_count,
                'out_of_stock_flowers': out_of_stock_count,
                'total_flowers': flowers_qs.count(),
            },
            'customers': {'total': customer_count},
            'recent_orders': recent_orders,
        })


@api_view(['GET'])
@permission_classes([IsManager])
def dashboard_orders(request):
    """Filterable order list for the dashboard."""
    shop = request.user.shop
    qs = Order.objects.filter(shop=shop)

    status_filter = request.GET.get('status')
    if status_filter:
        qs = qs.filter(status=status_filter)

    search = request.GET.get('q')
    if search:
        qs = qs.filter(
            Q(number__icontains=search)
            | Q(customer_name__icontains=search)
            | Q(customer_phone__icontains=search)
        )

    qs = qs.order_by('-created_at')[:200]
    return Response(OrderSerializer(qs, many=True).data)


@api_view(['PATCH'])
@permission_classes([IsManager])
def dashboard_update_order_status(request, number):
    order = get_object_or_404(Order, number=number, shop=request.user.shop)
    new_status = request.data.get('status')
    valid = {choice for choice, _ in Order.Status.choices}
    if new_status not in valid:
        return Response({'status': 'invalid choice'}, status=400)
    order.status = new_status
    order.handled_by = request.user
    order.save(update_fields=['status', 'handled_by'])
    return Response(OrderSerializer(order).data)


class CustomerListSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()
    phone = serializers.CharField(source='user.phone', read_only=True)
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)

    class Meta:
        model = CustomerProfile
        fields = [
            'user_id', 'username', 'email', 'full_name', 'phone',
            'tier', 'total_orders', 'total_spent', 'average_order_value',
            'first_order_at', 'last_order_at', 'date_joined',
        ]

    def get_full_name(self, obj):
        return f'{obj.user.first_name} {obj.user.last_name}'.strip() or obj.user.username


@api_view(['GET'])
@permission_classes([IsManager])
def dashboard_customers(request):
    """Customers who've ordered from this shop, with their cached metrics."""
    shop = request.user.shop
    profiles = (
        CustomerProfile.objects
        .filter(user__role=User.Role.CUSTOMER, user__orders__shop=shop)
        .select_related('user')
        .distinct()
    )

    tier = request.GET.get('tier')
    if tier:
        profiles = profiles.filter(tier=tier)

    search = request.GET.get('q')
    if search:
        profiles = profiles.filter(
            Q(user__username__icontains=search)
            | Q(user__email__icontains=search)
            | Q(user__phone__icontains=search)
        )

    profiles = profiles.order_by('-total_spent')[:500]
    return Response(CustomerListSerializer(profiles, many=True).data)
