from django.contrib import admin

from orders.models import Cart, CartItem, Order, OrderItem, Payment, Invoice


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ['line_total']
    fields = ['flower', 'size', 'quantity', 'custom_bouquet_id', 'line_total']

    def line_total(self, obj):
        return obj.line_total if obj.pk else '-'


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'shop', 'user', 'session_key', 'item_count', 'total', 'updated_at']
    list_filter = ['shop']
    search_fields = ['user__username', 'session_key']
    inlines = [CartItemInline]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['flower_name', 'size_label', 'stems', 'quantity', 'unit_price', 'line_total']
    can_delete = False


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ['provider', 'status', 'amount', 'provider_order_id', 'created_at']
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'number', 'shop', 'customer_name', 'customer_phone',
        'total', 'status', 'created_at',
    ]
    list_filter = ['shop', 'status', 'delivery_method', 'created_at']
    search_fields = ['number', 'customer_name', 'customer_phone', 'customer_email']
    readonly_fields = ['number', 'subtotal', 'discount_amount', 'total', 'created_at', 'paid_at']
    date_hierarchy = 'created_at'
    inlines = [OrderItemInline, PaymentInline]
    fieldsets = (
        (None, {
            'fields': ('number', 'shop', 'user', 'status', 'handled_by'),
        }),
        ('Customer', {
            'fields': ('customer_name', 'customer_phone', 'customer_email'),
        }),
        ('Delivery', {
            'fields': (
                'delivery_method', 'delivery_address',
                'delivery_date', 'delivery_time', 'delivery_cost', 'note',
            ),
        }),
        ('Pricing', {
            'fields': ('promotion', 'promo_code_used', 'subtotal', 'discount_amount', 'total'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'paid_at'),
        }),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'provider', 'status', 'amount', 'created_at']
    list_filter = ['provider', 'status']
    search_fields = ['order__number', 'provider_order_id']
    readonly_fields = [
        'order', 'provider', 'amount', 'currency',
        'provider_order_id', 'payment_url', 'raw_response',
        'created_at', 'updated_at',
    ]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['number', 'order', 'seller_name', 'issued_at']
    search_fields = ['number', 'order__number', 'seller_name']
    readonly_fields = ['number', 'order', 'issued_at']
