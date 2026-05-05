from django.contrib import admin
from django.utils.html import format_html

from catalog.models import (
    Category,
    Flower,
    FlowerSize,
    DiscountTier,
    StockMovement,
    Promotion,
    PromotionUsage,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'shop', 'is_active', 'sort_order', 'flower_count']
    list_filter = ['shop', 'is_active']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active', 'sort_order']

    @admin.display(description='Flowers')
    def flower_count(self, obj):
        return obj.flowers.count()


class FlowerSizeInline(admin.TabularInline):
    model = FlowerSize
    extra = 1
    fields = ['quantity', 'label', 'is_active']


class DiscountTierInline(admin.TabularInline):
    model = DiscountTier
    extra = 1
    fields = ['min_quantity', 'percent']


@admin.register(Flower)
class FlowerAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'base_price', 'stock', 'stock_status',
        'is_active', 'is_featured',
    ]
    list_filter = ['category__shop', 'category', 'is_active', 'is_featured', 'available_for_custom']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['base_price', 'is_active', 'is_featured']
    inlines = [FlowerSizeInline, DiscountTierInline]
    readonly_fields = ['created_at', 'updated_at']

    @admin.display(description='Stock')
    def stock_status(self, obj):
        if obj.is_out_of_stock:
            return format_html('<span style="color: red;">Out of stock</span>')
        if obj.is_low_stock:
            return format_html('<span style="color: orange;">Low ({} left)</span>', obj.stock)
        return format_html('<span style="color: green;">{} in stock</span>', obj.stock)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['flower', 'delta', 'reason', 'stock_after', 'created_by', 'created_at']
    list_filter = ['reason', 'flower__category__shop']
    search_fields = ['flower__name', 'note']
    readonly_fields = ['flower', 'delta', 'reason', 'stock_after', 'related_order', 'created_by', 'created_at']
    date_hierarchy = 'created_at'


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'shop', 'discount_type', 'discount_value',
        'starts_at', 'ends_at', 'is_active', 'is_featured', 'times_used',
    ]
    list_filter = ['shop', 'discount_type', 'is_active', 'is_featured', 'scope']
    search_fields = ['title', 'subtitle', 'promo_code']
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ['categories', 'flowers']
    readonly_fields = ['times_used', 'created_at', 'updated_at']
    fieldsets = (
        (None, {
            'fields': ('shop', 'title', 'slug', 'subtitle', 'description',
                       'banner_image', 'badge_text'),
        }),
        ('Discount', {
            'fields': ('discount_type', 'discount_value', 'promo_code'),
        }),
        ('Scope', {
            'fields': ('scope', 'categories', 'flowers'),
        }),
        ('Conditions', {
            'fields': ('min_order_amount', 'max_uses', 'max_uses_per_customer', 'times_used'),
        }),
        ('Schedule', {
            'fields': ('starts_at', 'ends_at', 'is_active', 'is_featured', 'sort_order'),
        }),
        ('Meta', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


@admin.register(PromotionUsage)
class PromotionUsageAdmin(admin.ModelAdmin):
    list_display = ['promotion', 'order', 'user', 'discount_amount', 'used_at']
    list_filter = ['promotion__shop', 'used_at']
    search_fields = ['promotion__title', 'order__number']
    readonly_fields = ['promotion', 'order', 'user', 'discount_amount', 'used_at']
