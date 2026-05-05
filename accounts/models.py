from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class Shop(models.Model):
    """A flower shop. Each shop has one or more managers and workers."""
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    address = models.CharField(max_length=500, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    logo = models.ImageField(upload_to='shops/logos/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class User(AbstractUser):
    """Custom user. Customers don't need a shop — only staff do."""

    class Role(models.TextChoices):
        MANAGER = 'manager', _('Manager')
        WORKER = 'worker', _('Worker')
        CUSTOMER = 'customer', _('Customer')

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )
    # Staff (manager/worker) belong to a shop. Customers don't.
    shop = models.ForeignKey(
        Shop,
        on_delete=models.CASCADE,
        related_name='staff',
        null=True,
        blank=True,
    )
    phone = models.CharField(max_length=30, blank=True)

    def is_manager(self):
        return self.role == self.Role.MANAGER

    def is_worker(self):
        return self.role == self.Role.WORKER

    def is_staff_member(self):
        return self.role in (self.Role.MANAGER, self.Role.WORKER)


# Per-shop configuration models live in shop_settings.py for clarity.
# They're imported here so Django picks them up.
from accounts.shop_settings import (  # noqa: E402, F401
    ShopPaymentSettings,
    ShopInvoiceSettings,
    ShopNotificationSettings,
)
from accounts.customer import (  # noqa: E402, F401
    CustomerAddress,
    CustomerProfile,
)
