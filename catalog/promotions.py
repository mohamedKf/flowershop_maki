"""
Promotions — time-based marketing campaigns shown on the Sales page.

Different from DiscountTier: those are quantity-based (15+ stems = 5% off) and apply
automatically at any time. Promotions are campaigns: "Spring Sale", "Valentine's 20% off",
running from date X to date Y, optionally requiring a promo code.
"""
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from accounts.models import Shop
from catalog.models import Category, Flower


class Promotion(models.Model):
    """
    A marketing campaign. Can apply to all flowers, specific categories, or specific flowers.
    Applies on TOP of any existing quantity discounts (multiplicatively).
    """

    class DiscountType(models.TextChoices):
        PERCENT = 'percent', 'Percentage off'
        FIXED = 'fixed', 'Fixed amount off'

    class Scope(models.TextChoices):
        ALL = 'all', 'All flowers'
        CATEGORIES = 'categories', 'Selected categories'
        FLOWERS = 'flowers', 'Selected flowers'

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='promotions')

    # Display
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, blank=True)
    subtitle = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    banner_image = models.ImageField(upload_to='promotions/', blank=True, null=True)
    badge_text = models.CharField(
        max_length=50, blank=True,
        help_text='Short label shown on cards, e.g. "−20%", "Хит", "Новинка".'
    )

    # Discount math
    discount_type = models.CharField(
        max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENT
    )
    discount_value = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        help_text='If percent: 10 means 10% off. If fixed: 500 means 500 ₽ off.'
    )

    # Promo code (optional). If empty, discount is automatic.
    promo_code = models.CharField(max_length=50, blank=True, db_index=True)

    # What it applies to
    scope = models.CharField(max_length=20, choices=Scope.choices, default=Scope.ALL)
    categories = models.ManyToManyField(
        Category, blank=True, related_name='promotions',
        help_text='Used when scope = "categories".'
    )
    flowers = models.ManyToManyField(
        Flower, blank=True, related_name='promotions',
        help_text='Used when scope = "flowers".'
    )

    # Conditions
    min_order_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text='Minimum cart total before discount applies (0 = no minimum).'
    )
    max_uses = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Total times this promo can be used across all customers. Blank = unlimited.'
    )
    max_uses_per_customer = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Per-customer limit. Blank = unlimited.'
    )
    times_used = models.PositiveIntegerField(default=0, editable=False)

    # Timing
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    # Visibility
    is_featured = models.BooleanField(
        default=False,
        help_text='Show on the home page and Sales page hero.'
    )
    sort_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_featured', 'sort_order', '-starts_at']
        unique_together = [('shop', 'slug')]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)

    def clean(self):
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValidationError('End date must be after start date.')
        if self.discount_type == self.DiscountType.PERCENT and self.discount_value > 100:
            raise ValidationError('Percentage discount cannot exceed 100%.')

    @property
    def is_running(self):
        """Whether the promo is currently live."""
        if not self.is_active:
            return False
        now = timezone.now()
        if self.starts_at > now or self.ends_at < now:
            return False
        if self.max_uses is not None and self.times_used >= self.max_uses:
            return False
        return True

    @property
    def is_upcoming(self):
        return self.is_active and self.starts_at > timezone.now()

    @property
    def is_expired(self):
        return self.ends_at < timezone.now()

    def applies_to(self, flower):
        """Does this promo apply to the given flower?"""
        if self.scope == self.Scope.ALL:
            return True
        if self.scope == self.Scope.CATEGORIES:
            return self.categories.filter(pk=flower.category_id).exists()
        if self.scope == self.Scope.FLOWERS:
            return self.flowers.filter(pk=flower.pk).exists()
        return False

    def apply_to_amount(self, amount):
        """Apply this promotion's discount to a money amount."""
        amount = Decimal(amount)
        if self.discount_type == self.DiscountType.PERCENT:
            return amount * (Decimal('100') - self.discount_value) / Decimal('100')
        return max(Decimal('0'), amount - self.discount_value)


class PromotionUsage(models.Model):
    """Audit log: every time a promo is used. Drives max_uses limits."""
    promotion = models.ForeignKey(
        Promotion, on_delete=models.CASCADE, related_name='usages'
    )
    order = models.ForeignKey(
        'orders.Order', on_delete=models.CASCADE, related_name='promotion_usages'
    )
    user = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-used_at']

    def __str__(self):
        return f'{self.promotion.title} → {self.order.number}'
