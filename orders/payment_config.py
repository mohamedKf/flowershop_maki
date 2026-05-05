"""
Resolves Sberbank credentials for a given shop.

Priority:
    1. Shop's own ShopPaymentSettings (configured in dashboard)
    2. Platform-level fallback in settings.py (env vars on Railway)

This lets you run either:
    - Multi-tenant (each shop has its own Sberbank merchant account), OR
    - Single-tenant (all shops use the platform's Sberbank account)
"""
from dataclasses import dataclass
from django.conf import settings


@dataclass
class SberbankCredentials:
    username: str
    password: str
    api_url: str
    return_url: str
    fail_url: str
    is_test: bool

    @property
    def is_configured(self) -> bool:
        return bool(self.username and self.password)


def get_sberbank_credentials(shop) -> SberbankCredentials:
    """Resolve Sberbank creds for this shop, falling back to platform defaults."""
    payment_settings = getattr(shop, 'payment_settings', None)

    if payment_settings and payment_settings.is_sberbank_configured():
        return SberbankCredentials(
            username=payment_settings.sberbank_username,
            password=payment_settings.sberbank_password,
            api_url=payment_settings.sberbank_api_url,
            return_url=(
                payment_settings.sberbank_return_url
                or settings.SBERBANK_FALLBACK_RETURN_URL
            ),
            fail_url=(
                payment_settings.sberbank_fail_url
                or settings.SBERBANK_FALLBACK_FAIL_URL
            ),
            is_test=(payment_settings.sberbank_mode == 'test'),
        )

    # Platform fallback
    return SberbankCredentials(
        username=settings.SBERBANK_FALLBACK_USERNAME,
        password=settings.SBERBANK_FALLBACK_PASSWORD,
        api_url='https://3dsec.sberbank.ru/payment/rest',
        return_url=settings.SBERBANK_FALLBACK_RETURN_URL,
        fail_url=settings.SBERBANK_FALLBACK_FAIL_URL,
        is_test=True,
    )
