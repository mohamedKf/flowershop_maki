import uuid
from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models, transaction

from accounts.models import Shop
from catalog.models import Flower, FlowerSize, quantize_money


# ---------------------------------------------------------------------------
# Cart
# ---------------------------------------------------------------------------

class Cart(models.Model):
    """
    A shopping cart. Either tied to a logged-in user OR a session key for guests.
    A cart belongs to one shop (you can't mix flowers from different shops).
    """
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='carts')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='carts',
    )
    session_key = models.CharField(max_length=64, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        owner = self.user.username if self.user else f'guest:{self.session_key[:8]}'
        return f'Cart #{self.pk} ({owner})'

    @property
    def total(self):
        return quantize_money(sum((item.line_total for item in self.items.all()), Decimal('0')))

    @property
    def item_count(self):
        return self.items.count()


class CartItem(models.Model):
    """
    A single line in a cart. Two flavors:
      1. Preset size: links to a FlowerSize ("Bouquet of 11 red roses")
      2. Custom: just a flower + arbitrary quantity (used for custom-designed bouquets)
    """
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    flower = models.ForeignKey(Flower, on_delete=models.PROTECT)
    size = models.ForeignKey(
        FlowerSize, on_delete=models.PROTECT,
        null=True, blank=True,
        help_text='Set when picking a preset size; null for custom bouquets.'
    )
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text='Number of stems for custom items, or number of bouquets for preset sizes.'
    )
    # If part of a custom bouquet, group items by this id so we can render them together
    custom_bouquet_id = models.UUIDField(null=True, blank=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    @property
    def is_custom(self):
        return self.size is None

    @property
    def stems(self):
        """Total stems represented by this line."""
        if self.size:
            return self.size.quantity * self.quantity
        return self.quantity

    @property
    def line_total(self):
        """Calculate using the flower's discount tiers based on stems."""
        if self.size:
            # Preset bouquet: price per bouquet × quantity of bouquets
            unit = self.flower.price_for_quantity(self.size.quantity)
            return quantize_money(unit * self.quantity)
        return self.flower.price_for_quantity(self.quantity)


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

class Order(models.Model):
    """A completed (or in-progress) customer order."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending payment'
        PAID = 'paid', 'Paid'
        PROCESSING = 'processing', 'Processing'
        READY = 'ready', 'Ready for delivery'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'
        REFUNDED = 'refunded', 'Refunded'

    class DeliveryMethod(models.TextChoices):
        DELIVERY = 'delivery', 'Delivery'
        PICKUP = 'pickup', 'Self pickup'

    # Public reference number, e.g. "FL-2026-000123" (set in save())
    number = models.CharField(max_length=30, unique=True, db_index=True, blank=True)

    shop = models.ForeignKey(Shop, on_delete=models.PROTECT, related_name='orders')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='orders',
    )

    # Snapshot of customer info — survives even if account is deleted
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=30)
    customer_email = models.EmailField(blank=True)

    # Delivery
    delivery_method = models.CharField(
        max_length=20, choices=DeliveryMethod.choices, default=DeliveryMethod.DELIVERY
    )
    delivery_address = models.CharField(max_length=500, blank=True)
    delivery_date = models.DateField(null=True, blank=True)
    delivery_time = models.CharField(max_length=50, blank=True)
    delivery_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    note = models.TextField(blank=True)

    # Money
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Snapshot of promotion applied at checkout. SET_NULL so deleting a promo
    # doesn't break historical orders.
    promotion = models.ForeignKey(
        'catalog.Promotion',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='orders',
    )
    promo_code_used = models.CharField(max_length=50, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    # Optional staff member who processed this order
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='handled_orders',
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.number or f'Order #{self.pk}'

    def save(self, *args, **kwargs):
        if not self.number:
            # Set after first save so we have a primary key
            super().save(*args, **kwargs)
            self.number = f'FL-{self.created_at.year}-{self.pk:06d}'
            kwargs['force_insert'] = False
            return super().save(update_fields=['number'])
        super().save(*args, **kwargs)

    def recalculate_totals(self):
        """Recompute subtotal/discount/total from items + delivery cost."""
        self.subtotal = quantize_money(
            sum((item.line_total for item in self.items.all()), Decimal('0'))
        )

        # Apply promotion discount on top of quantity-based prices
        discount = Decimal('0')
        if self.promotion and self.promotion.is_running:
            if self.subtotal >= self.promotion.min_order_amount:
                discounted = self.promotion.apply_to_amount(self.subtotal)
                discount = self.subtotal - discounted
        self.discount_amount = quantize_money(discount)

        self.total = quantize_money(
            self.subtotal - self.discount_amount + Decimal(self.delivery_cost or 0)
        )
        self.save(update_fields=['subtotal', 'discount_amount', 'total'])


class OrderItem(models.Model):
    """
    A line in an order. Stores price snapshots so historical orders are unaffected
    by future price/discount changes.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')

    # Soft references — we keep the order even if the flower is later deleted
    flower = models.ForeignKey(Flower, on_delete=models.SET_NULL, null=True)
    size = models.ForeignKey(FlowerSize, on_delete=models.SET_NULL, null=True, blank=True)

    # Snapshot fields (so deleting a flower doesn't break old orders)
    flower_name = models.CharField(max_length=200)
    size_label = models.CharField(max_length=100, blank=True)
    custom_bouquet_id = models.UUIDField(null=True, blank=True, db_index=True)

    # Numbers
    stems = models.PositiveIntegerField(help_text='Total stems in this line.')
    quantity = models.PositiveIntegerField(default=1, help_text='Number of bouquets or units.')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.flower_name} × {self.quantity}'


# ---------------------------------------------------------------------------
# Payments — Sberbank integration
# ---------------------------------------------------------------------------

class Payment(models.Model):
    """
    A payment attempt for an order. Sberbank flow:
      1. Server calls Sberbank /register.do  → gets orderId + payment URL
      2. Customer pays on Sberbank's page
      3. Sberbank redirects back; we call /getOrderStatusExtended.do to confirm
    """

    class Provider(models.TextChoices):
        SBERBANK = 'sberbank', 'Sberbank'
        CASH = 'cash', 'Cash on delivery'

    class Status(models.TextChoices):
        CREATED = 'created', 'Created'
        PENDING = 'pending', 'Awaiting confirmation'
        SUCCEEDED = 'succeeded', 'Succeeded'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    provider = models.CharField(max_length=20, choices=Provider.choices, default=Provider.SBERBANK)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED)

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='RUB')

    # Sberbank-specific identifiers
    provider_order_id = models.CharField(max_length=100, blank=True, db_index=True)
    payment_url = models.URLField(blank=True)
    raw_response = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Payment {self.pk} for {self.order.number} ({self.status})'


# ---------------------------------------------------------------------------
# Invoices
# ---------------------------------------------------------------------------

class Invoice(models.Model):
    """
    Generated when an order is paid. The PDF is rendered on demand;
    here we just store the metadata + sequential invoice number.
    """
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='invoice')
    number = models.CharField(max_length=30, unique=True, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    # Snapshot of seller info
    seller_name = models.CharField(max_length=200)
    seller_address = models.CharField(max_length=500, blank=True)
    seller_inn = models.CharField(max_length=20, blank=True, help_text='ИНН')

    # Optional saved PDF
    pdf = models.FileField(upload_to='invoices/', blank=True, null=True)

    class Meta:
        ordering = ['-issued_at']

    def __str__(self):
        return self.number or f'Invoice for {self.order.number}'

    def save(self, *args, **kwargs):
        if not self.number:
            super().save(*args, **kwargs)
            self.number = f'INV-{self.issued_at.year}-{self.pk:06d}'
            return super().save(update_fields=['number'])
        super().save(*args, **kwargs)
