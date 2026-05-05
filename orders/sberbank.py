"""
Sberbank payment integration.

Flow (standard 2-step):
    1. Server: SberbankClient(shop).register_order(order)
       → Sberbank returns formUrl + orderId
       → we save it on the Payment, redirect customer to formUrl
    2. Customer pays on Sberbank's hosted page
    3. Sberbank redirects to our SBERBANK_RETURN_URL with ?orderId=...
    4. Server: SberbankClient(shop).get_order_status(payment)
       → confirms success → marks order paid, decrements stock, generates invoice

Refund flow:
    SberbankClient(shop).refund(payment, amount_kopecks)

API docs: https://securepayments.sberbank.ru/wiki/doku.php
"""
from decimal import Decimal
import logging

import requests
from django.utils import timezone

from orders.payment_config import get_sberbank_credentials

logger = logging.getLogger(__name__)


class SberbankError(Exception):
    """Raised when Sberbank API returns an error."""
    def __init__(self, code, message):
        self.code = code
        self.message = message
        super().__init__(f'Sberbank error {code}: {message}')


class SberbankClient:
    """Wraps Sberbank's REST API. One client per shop (creds differ)."""

    def __init__(self, shop):
        self.shop = shop
        self.creds = get_sberbank_credentials(shop)
        if not self.creds.is_configured:
            raise RuntimeError(
                f'Sberbank not configured for shop "{shop.name}". '
                f'Set credentials in dashboard or platform fallback env vars.'
            )

    # ------------------------------------------------------------------
    # Low-level
    # ------------------------------------------------------------------
    def _post(self, endpoint, params):
        """POST to Sberbank with auth params injected."""
        url = f'{self.creds.api_url}/{endpoint}.do'
        full_params = {
            'userName': self.creds.username,
            'password': self.creds.password,
            **params,
        }
        try:
            response = requests.post(url, data=full_params, timeout=30)
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as exc:
            logger.exception('Sberbank request failed: %s', endpoint)
            raise SberbankError(-1, f'Network error: {exc}')

        # Sberbank uses both errorCode (string) and ErrorCode (camel-case) in different endpoints
        error_code = data.get('errorCode') or data.get('ErrorCode') or '0'
        if str(error_code) != '0':
            error_message = data.get('errorMessage') or data.get('ErrorMessage') or 'Unknown'
            raise SberbankError(error_code, error_message)
        return data

    # ------------------------------------------------------------------
    # 1. Register an order — returns payment URL the customer visits
    # ------------------------------------------------------------------
    def register_order(self, order, payment, return_url=None, fail_url=None):
        """
        Create an order in Sberbank and return (form_url, sberbank_order_id).
        Amount must be in KOPECKS (rubles × 100). Order number must be unique.
        """
        # Sberbank rejects duplicate orderNumber, so include payment id
        order_number = f'{order.number}-p{payment.id}'
        amount_kopecks = int(Decimal(payment.amount) * 100)

        params = {
            'orderNumber': order_number,
            'amount': amount_kopecks,
            'currency': 810,  # RUB
            'returnUrl': return_url or self.creds.return_url,
            'failUrl': fail_url or self.creds.fail_url,
            'description': f'Заказ {order.number} — {self.shop.name}',
            'language': 'ru',
            # Cart contents can be passed for fiscalization (54-ФЗ) — add later if needed
        }
        if order.customer_email:
            params['email'] = order.customer_email

        data = self._post('register', params)
        return data['formUrl'], data['orderId'], data

    # ------------------------------------------------------------------
    # 2. Check status after customer returns from payment page
    # ------------------------------------------------------------------
    def get_order_status(self, payment):
        """
        Check the status of a payment. Returns the raw response dict.
        Status codes:
            0 = order registered but not paid
            1 = order amount blocked (pre-auth)
            2 = order paid (full deposit)
            3 = order cancelled
            4 = refunded
            5 = 3DS authorization initiated
            6 = order rejected
        """
        if not payment.provider_order_id:
            raise SberbankError(-1, 'Payment has no Sberbank orderId yet')

        data = self._post('getOrderStatusExtended', {
            'orderId': payment.provider_order_id,
        })
        return data

    @staticmethod
    def is_status_paid(status_response):
        """Returns True if the response indicates a successfully paid order."""
        return status_response.get('orderStatus') == 2

    # ------------------------------------------------------------------
    # 3. Refund (full or partial)
    # ------------------------------------------------------------------
    def refund(self, payment, amount=None):
        """Refund a payment. amount in rubles (Decimal); None = full refund."""
        amount_to_refund = amount if amount is not None else payment.amount
        amount_kopecks = int(Decimal(amount_to_refund) * 100)

        return self._post('refund', {
            'orderId': payment.provider_order_id,
            'amount': amount_kopecks,
        })


# ---------------------------------------------------------------------------
# Convenience functions used by views
# ---------------------------------------------------------------------------

def start_sberbank_payment(order):
    """
    Create a Payment row + register with Sberbank + return the redirect URL.
    Call this from the checkout view after the customer chose Sberbank.
    """
    from orders.models import Payment

    payment = Payment.objects.create(
        order=order,
        provider=Payment.Provider.SBERBANK,
        status=Payment.Status.CREATED,
        amount=order.total,
        currency='RUB',
    )

    client = SberbankClient(order.shop)
    form_url, sber_order_id, raw = client.register_order(order, payment)

    payment.provider_order_id = sber_order_id
    payment.payment_url = form_url
    payment.status = Payment.Status.PENDING
    payment.raw_response = raw
    payment.save()
    return payment


def confirm_sberbank_payment(payment):
    """
    After the customer returns from the payment page, call this to verify.
    Marks payment + order as paid, decrements stock, creates invoice.
    Returns True if payment succeeded.
    """
    from django.db import transaction
    from orders.models import Order, Payment, Invoice
    from catalog.models import StockMovement

    client = SberbankClient(payment.order.shop)
    status_data = client.get_order_status(payment)
    payment.raw_response = status_data

    if not client.is_status_paid(status_data):
        payment.status = Payment.Status.FAILED
        payment.save()
        return False

    # Atomic: mark paid + decrement stock + create invoice
    with transaction.atomic():
        payment.status = Payment.Status.SUCCEEDED
        payment.save()

        order = payment.order
        if order.status == Order.Status.PENDING:
            order.status = Order.Status.PAID
            order.paid_at = timezone.now()
            order.save(update_fields=['status', 'paid_at'])

            # Decrement stock per item
            for item in order.items.all():
                if item.flower_id is None:
                    continue  # flower deleted; skip
                flower = item.flower
                flower.stock = max(0, flower.stock - item.stems)
                flower.save(update_fields=['stock'])
                StockMovement.objects.create(
                    flower=flower,
                    delta=-item.stems,
                    reason=StockMovement.Reason.SALE,
                    stock_after=flower.stock,
                    related_order=order,
                )

            # Generate invoice
            invoice_settings = getattr(order.shop, 'invoice_settings', None)
            Invoice.objects.create(
                order=order,
                seller_name=(
                    invoice_settings.legal_name if invoice_settings else order.shop.name
                ),
                seller_address=(
                    invoice_settings.legal_address if invoice_settings else order.shop.address
                ),
                seller_inn=invoice_settings.inn if invoice_settings else '',
            )

            # Refresh customer profile metrics
            if order.user_id:
                profile = getattr(order.user, 'customer_profile', None)
                if profile:
                    profile.recompute_metrics()

    return True
