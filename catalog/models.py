from decimal import Decimal, ROUND_HALF_UP
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify

from accounts.models import Shop


def quantize_money(value):
    """Round to 2 decimal places, banker-safe."""
    return Decimal(value).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


class Category(models.Model):
    """A category of flowers, e.g. Roses, Tulips, Wedding Bouquets."""
    shop = models.ForeignKey(
        Shop, on_delete=models.CASCADE, related_name='categories'
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220)
    description = models.TextField(blank=True)
    photo = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'name']
        unique_together = [('shop', 'slug')]
        verbose_name_plural = 'Categories'

    def __str__(self):
        return f'{self.name} ({self.shop.name})'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class Flower(models.Model):
    """
    A single flower SKU (e.g. "Red Rose", "White Tulip").
    Customers can pick a size (1/11/25/...) and the price scales with discount tiers.
    """
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name='flowers'
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220)
    description = models.TextField(blank=True)
    photo = models.ImageField(upload_to='flowers/', blank=True, null=True)

    # Price per single stem. Final price = stems * base_price * discount multiplier.
    base_price = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
    )

    # Stock tracking — number of stems available
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(
        default=10,
        help_text='Alert manager when stock drops to or below this number.'
    )

    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    # Allow customers to use this flower in custom-designed bouquets
    available_for_custom = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_featured', 'name']
        unique_together = [('category', 'slug')]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

    @property
    def shop(self):
        return self.category.shop

    @property
    def is_low_stock(self):
        return self.stock <= self.low_stock_threshold

    @property
    def is_out_of_stock(self):
        return self.stock == 0

    def discount_multiplier_for(self, quantity):
        """
        Return the price multiplier (e.g. Decimal('0.95')) for the given quantity,
        based on this flower's discount tiers. Picks the best (lowest) multiplier
        whose min_quantity is satisfied.
        """
        tier = (
            self.discount_tiers
            .filter(min_quantity__lte=quantity)
            .order_by('-min_quantity')
            .first()
        )
        if tier is None:
            return Decimal('1.00')
        return Decimal(tier.percent) / Decimal('100')

    def price_for_quantity(self, quantity):
        """Calculate final price for `quantity` stems, applying discount tiers."""
        if quantity <= 0:
            return Decimal('0.00')
        multiplier = self.discount_multiplier_for(quantity)
        raw = self.base_price * Decimal(quantity) * multiplier
        return quantize_money(raw)


class FlowerSize(models.Model):
    """
    A pre-set quantity option for a flower (1, 11, 25, 51, 75, 101 stems).
    The manager defines which sizes are available per flower.
    The label is auto-generated but can be overridden ("Single rose", "Bouquet of 11").
    """
    flower = models.ForeignKey(
        Flower, on_delete=models.CASCADE, related_name='sizes'
    )
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text='Number of stems in this option.'
    )
    label = models.CharField(
        max_length=100, blank=True,
        help_text='Display name; if empty, generated from quantity.'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['quantity']
        unique_together = [('flower', 'quantity')]

    def __str__(self):
        return self.label or f'{self.quantity} шт.'

    @property
    def price(self):
        """Final price for this size (applies discount tiers automatically)."""
        return self.flower.price_for_quantity(self.quantity)


class DiscountTier(models.Model):
    """
    Per-flower discount tier. E.g. min_quantity=15, percent=95 means
    15+ stems get charged at 95% of base price.

    The customer pays:  quantity * base_price * (percent / 100)
    """
    flower = models.ForeignKey(
        Flower, on_delete=models.CASCADE, related_name='discount_tiers'
    )
    min_quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text='Discount applies when buying at least this many stems.'
    )
    percent = models.DecimalField(
        max_digits=5, decimal_places=2,
        help_text='Percentage of base price to charge (e.g. 95 = 5% off).'
    )

    class Meta:
        ordering = ['min_quantity']
        unique_together = [('flower', 'min_quantity')]

    def __str__(self):
        return f'{self.flower.name}: {self.min_quantity}+ → {self.percent}%'


class StockMovement(models.Model):
    """
    Audit log of every stock change. Lets the manager see exactly what
    happened: sold, restocked, manual adjustment, returned.
    """

    class Reason(models.TextChoices):
        SALE = 'sale', 'Sale'
        RESTOCK = 'restock', 'Restock'
        ADJUSTMENT = 'adjustment', 'Manual adjustment'
        RETURN = 'return', 'Return'
        WASTE = 'waste', 'Waste/spoilage'

    flower = models.ForeignKey(
        Flower, on_delete=models.CASCADE, related_name='stock_movements'
    )
    # Positive = added to stock. Negative = removed.
    delta = models.IntegerField()
    reason = models.CharField(max_length=20, choices=Reason.choices)
    note = models.CharField(max_length=500, blank=True)

    # Snapshot of stock AFTER this movement
    stock_after = models.PositiveIntegerField()

    related_order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='stock_movements',
    )
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        sign = '+' if self.delta >= 0 else ''
        return f'{self.flower.name}: {sign}{self.delta} ({self.reason})'


# Promotions live in promotions.py for clarity.
from catalog.promotions import Promotion, PromotionUsage  # noqa: E402, F401
