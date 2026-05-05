"""
Per-shop configuration that managers edit from the dashboard.

Three concerns are separated into three models so permissions/UI can differ:
    - ShopPaymentSettings  — payment provider credentials (sensitive, encrypted)
    - ShopInvoiceSettings  — seller info printed on invoices (ИНН, address, etc.)
    - ShopNotificationSettings — alert preferences (low stock, new order, etc.)
"""
from django.db import models
from django.utils.translation import gettext_lazy as _

from accounts.encryption import encrypt, decrypt
from accounts.models import Shop


# ---------------------------------------------------------------------------
# Encrypted text field — stores ciphertext, returns plaintext on access
# ---------------------------------------------------------------------------
class EncryptedTextField(models.TextField):
    """A TextField that transparently encrypts/decrypts on save/load."""

    def from_db_value(self, value, expression, connection):
        if value is None or value == '':
            return value
        return decrypt(value)

    def to_python(self, value):
        if value is None or value == '':
            return value
        # Heuristic: if it doesn't look like a Fernet token, return as-is
        # (avoids double-decrypt during model __init__ chains)
        return value

    def get_prep_value(self, value):
        if value is None or value == '':
            return value
        return encrypt(str(value))


# ---------------------------------------------------------------------------
# Payment settings — per-shop Sberbank (and future providers)
# ---------------------------------------------------------------------------
class ShopPaymentSettings(models.Model):
    """
    Each shop can configure its own payment provider credentials from the
    dashboard. If a shop hasn't configured anything, the system falls back
    to the platform-wide defaults in settings.py (useful for demo/testing).
    """

    class Mode(models.TextChoices):
        TEST = 'test', _('Test')
        LIVE = 'live', _('Live')

    shop = models.OneToOneField(
        Shop, on_delete=models.CASCADE, related_name='payment_settings'
    )

    # ---- Sberbank ----
    sberbank_enabled = models.BooleanField(default=False)
    sberbank_mode = models.CharField(
        max_length=10, choices=Mode.choices, default=Mode.TEST
    )
    sberbank_username = models.CharField(max_length=200, blank=True)
    # Encrypted at rest. Use clear_password / set_password helpers.
    sberbank_password_encrypted = EncryptedTextField(blank=True, default='')
    sberbank_token = EncryptedTextField(
        blank=True, default='',
        help_text=_('Optional API token if used instead of username/password.'),
    )
    # Where Sberbank should redirect the customer back to. Falls back to global.
    sberbank_return_url = models.URLField(blank=True)
    sberbank_fail_url = models.URLField(blank=True)

    # ---- Cash on delivery ----
    cash_on_delivery_enabled = models.BooleanField(default=True)

    # ---- Future providers (YooKassa, Tinkoff) — placeholders ----
    # Add fields here when needed. Encrypted the same way.

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Shop payment settings')
        verbose_name_plural = _('Shop payment settings')

    def __str__(self):
        return f'Payment settings for {self.shop.name}'

    # ---------- Sberbank password helpers ----------
    @property
    def sberbank_password(self):
        """Decrypted password. Empty string if unset."""
        return self.sberbank_password_encrypted or ''

    @sberbank_password.setter
    def sberbank_password(self, value):
        self.sberbank_password_encrypted = value or ''

    @property
    def sberbank_api_url(self):
        """Returns the right Sberbank base URL for the configured mode."""
        if self.sberbank_mode == self.Mode.LIVE:
            return 'https://securepayments.sberbank.ru/payment/rest'
        return 'https://3dsec.sberbank.ru/payment/rest'

    def is_sberbank_configured(self):
        return bool(
            self.sberbank_enabled
            and self.sberbank_username
            and self.sberbank_password_encrypted
        )


# ---------------------------------------------------------------------------
# Invoice settings — what gets printed on the invoice/receipt
# ---------------------------------------------------------------------------
class ShopInvoiceSettings(models.Model):
    """Seller info and invoice numbering preferences."""

    shop = models.OneToOneField(
        Shop, on_delete=models.CASCADE, related_name='invoice_settings'
    )

    # Legal entity info
    legal_name = models.CharField(
        max_length=300, blank=True,
        help_text=_('Official company name (ООО "Название").'),
    )
    inn = models.CharField(
        max_length=20, blank=True, help_text=_('ИНН — Russian tax number.')
    )
    kpp = models.CharField(max_length=20, blank=True, help_text=_('КПП'))
    ogrn = models.CharField(max_length=20, blank=True, help_text=_('ОГРН'))
    legal_address = models.CharField(max_length=500, blank=True)

    # Bank info (for B2B invoices)
    bank_name = models.CharField(max_length=300, blank=True)
    bank_bik = models.CharField(max_length=20, blank=True, help_text=_('БИК'))
    bank_account = models.CharField(max_length=30, blank=True, help_text=_('Р/С'))
    correspondent_account = models.CharField(
        max_length=30, blank=True, help_text=_('К/С')
    )

    # VAT
    vat_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text=_('VAT %. Use 0 if shop is on USN (simplified tax).'),
    )
    vat_included_in_price = models.BooleanField(default=True)

    # Numbering
    invoice_prefix = models.CharField(max_length=10, default='INV')

    # Logo for invoice header (separate from shop logo if you want)
    invoice_logo = models.ImageField(
        upload_to='invoice-logos/', blank=True, null=True
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Shop invoice settings')
        verbose_name_plural = _('Shop invoice settings')

    def __str__(self):
        return f'Invoice settings for {self.shop.name}'


# ---------------------------------------------------------------------------
# Notification settings — alerts the manager wants to receive
# ---------------------------------------------------------------------------
class ShopNotificationSettings(models.Model):
    """When and how to alert the manager about events."""

    shop = models.OneToOneField(
        Shop, on_delete=models.CASCADE, related_name='notification_settings'
    )

    # Email
    notify_email = models.EmailField(
        blank=True,
        help_text=_('Where alerts are sent. Defaults to shop email.'),
    )

    # Triggers
    notify_on_new_order = models.BooleanField(default=True)
    notify_on_paid_order = models.BooleanField(default=True)
    notify_on_low_stock = models.BooleanField(default=True)
    notify_on_failed_payment = models.BooleanField(default=True)

    # Optional Telegram bot integration (leave blank to disable)
    telegram_bot_token = EncryptedTextField(blank=True, default='')
    telegram_chat_id = models.CharField(max_length=100, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Shop notification settings')
        verbose_name_plural = _('Shop notification settings')

    def __str__(self):
        return f'Notifications for {self.shop.name}'

    def resolved_email(self):
        return self.notify_email or self.shop.email
