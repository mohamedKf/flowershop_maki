from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from accounts.models import (
    Shop,
    User,
    CustomerAddress,
    CustomerProfile,
    ShopPaymentSettings,
    ShopInvoiceSettings,
    ShopNotificationSettings,
)


class PaymentSettingsInline(admin.StackedInline):
    model = ShopPaymentSettings
    can_delete = False
    fieldsets = (
        ('Sberbank', {
            'fields': (
                'sberbank_enabled', 'sberbank_mode',
                'sberbank_username', 'sberbank_password_encrypted',
                'sberbank_return_url', 'sberbank_fail_url',
            ),
            'description': 'Password is stored encrypted. Type the plain password — it will be encrypted on save.',
        }),
        ('Other methods', {
            'fields': ('cash_on_delivery_enabled',),
        }),
    )


class InvoiceSettingsInline(admin.StackedInline):
    model = ShopInvoiceSettings
    can_delete = False


class NotificationSettingsInline(admin.StackedInline):
    model = ShopNotificationSettings
    can_delete = False


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'phone', 'email', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug', 'email', 'phone']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [PaymentSettingsInline, InvoiceSettingsInline, NotificationSettingsInline]


class CustomerAddressInline(admin.TabularInline):
    model = CustomerAddress
    extra = 0


class CustomerProfileInline(admin.StackedInline):
    model = CustomerProfile
    can_delete = False
    readonly_fields = [
        'total_orders', 'total_spent', 'average_order_value',
        'first_order_at', 'last_order_at', 'tier',
    ]


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'shop', 'is_active', 'date_joined']
    list_filter = ['role', 'shop', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    inlines = [CustomerProfileInline, CustomerAddressInline]
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Flower shop', {'fields': ('role', 'shop', 'phone')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Flower shop', {'fields': ('role', 'shop', 'phone', 'email')}),
    )


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'tier', 'total_orders', 'total_spent', 'last_order_at']
    list_filter = ['tier']
    search_fields = ['user__username', 'user__email']
    readonly_fields = [
        'total_orders', 'total_spent', 'average_order_value',
        'first_order_at', 'last_order_at',
    ]
    actions = ['recompute_metrics']

    @admin.action(description='Recompute metrics from orders')
    def recompute_metrics(self, request, queryset):
        for profile in queryset:
            profile.recompute_metrics()
        self.message_user(request, f'Recomputed {queryset.count()} profiles.')
