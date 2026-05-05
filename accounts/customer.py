"""
Customer profile — extends User with shipping addresses, preferences,
and cached metrics shown on the dashboard customers page.

Lifetime metrics are computed from the orders table, but cached here
so the customers list page doesn't need to do an aggregation query
for every row.
"""
from decimal import Decimal
from django.conf import settings
from django.db import models


class CustomerAddress(models.Model):
    """A saved delivery address for a customer."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='addresses',
    )
    label = models.CharField(
        max_length=100, blank=True,
        help_text='User-friendly name, e.g. "Home", "Office".'
    )
    recipient_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30)
    address_line = models.CharField(max_length=500)
    apartment = models.CharField(max_length=50, blank=True)
    entrance = models.CharField(max_length=50, blank=True)
    floor = models.CharField(max_length=20, blank=True)
    intercom = models.CharField(max_length=50, blank=True)
    note = models.CharField(max_length=300, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f'{self.label or "Адрес"} — {self.address_line}'


class CustomerProfile(models.Model):
    """
    One-to-one with User. Holds non-auth fields and CACHED metrics that
    the dashboard reads. Updated by signals when orders change status.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='customer_profile',
    )

    # Personal
    birthday = models.DateField(
        null=True, blank=True,
        help_text='For automated birthday discount campaigns.'
    )
    notes = models.TextField(blank=True, help_text='Internal notes for staff.')

    # Marketing consent
    accepts_marketing = models.BooleanField(default=False)
    accepts_sms = models.BooleanField(default=False)

    # Cached metrics — refreshed via signals on order status change
    total_orders = models.PositiveIntegerField(default=0)
    total_spent = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    average_order_value = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    last_order_at = models.DateTimeField(null=True, blank=True)
    first_order_at = models.DateTimeField(null=True, blank=True)

    # Loyalty bucket — managers filter customers by tier
    class Tier(models.TextChoices):
        NEW = 'new', 'New'
        REGULAR = 'regular', 'Regular'
        VIP = 'vip', 'VIP'
        DORMANT = 'dormant', 'Dormant'

    tier = models.CharField(max_length=20, choices=Tier.choices, default=Tier.NEW)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-total_spent']

    def __str__(self):
        return f'Profile of {self.user.username}'

    def recompute_metrics(self):
        """Recalculate cached metrics from the orders table."""
        from orders.models import Order

        paid_orders = self.user.orders.filter(
            status__in=[
                Order.Status.PAID,
                Order.Status.PROCESSING,
                Order.Status.READY,
                Order.Status.DELIVERED,
            ]
        )
        agg = paid_orders.aggregate(
            count=models.Count('id'),
            total=models.Sum('total'),
            first=models.Min('created_at'),
            last=models.Max('created_at'),
        )
        self.total_orders = agg['count'] or 0
        self.total_spent = agg['total'] or Decimal('0')
        self.first_order_at = agg['first']
        self.last_order_at = agg['last']
        self.average_order_value = (
            (self.total_spent / self.total_orders)
            if self.total_orders else Decimal('0')
        )
        self.tier = self._compute_tier()
        self.save()

    def _compute_tier(self):
        """Simple tier rules — manager can override later via settings."""
        if self.total_orders == 0:
            return self.Tier.NEW
        if self.total_spent >= Decimal('50000'):
            return self.Tier.VIP
        if self.total_orders >= 3:
            return self.Tier.REGULAR
        return self.Tier.NEW
