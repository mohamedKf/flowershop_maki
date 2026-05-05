from django.conf import settings
from django.db.models.signals import post_save, post_migrate
from django.dispatch import receiver

from accounts.models import (
    Shop,
    ShopPaymentSettings,
    ShopInvoiceSettings,
    ShopNotificationSettings,
    CustomerProfile,
)


@receiver(post_save, sender=Shop)
def create_shop_settings(sender, instance, created, **kwargs):
    """Auto-create empty settings rows when a shop is created."""
    if not created:
        return
    ShopPaymentSettings.objects.get_or_create(shop=instance)
    ShopInvoiceSettings.objects.get_or_create(shop=instance)
    ShopNotificationSettings.objects.get_or_create(shop=instance)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_customer_profile(sender, instance, created, **kwargs):
    """Auto-create a CustomerProfile for every user (staff get one too — harmless)."""
    if not created:
        return
    CustomerProfile.objects.get_or_create(user=instance)


@receiver(post_migrate)
def auto_create_shop(sender, **kwargs):
    """
    First-run setup: create the shop from SHOP_* env vars if it doesn't exist.
    Runs after every `manage.py migrate` — but only creates if missing.

    This is a single-tenant deployment: edit SHOP_NAME, SHOP_SLUG, etc. in .env
    to customise. To deploy a second shop, use a different .env + database.
    """
    if sender.name != 'accounts':
        return  # only run once, when the accounts app finishes migrating

    slug = settings.SHOP_SLUG
    if not slug:
        return  # not configured — skip

    shop, created = Shop.objects.get_or_create(
        slug=slug,
        defaults={
            'name': settings.SHOP_NAME,
            'address': settings.SHOP_ADDRESS,
            'phone': settings.SHOP_PHONE,
            'email': settings.SHOP_EMAIL,
        },
    )
    if created:
        print(f'  Created shop "{shop.name}" (slug: {shop.slug})')
