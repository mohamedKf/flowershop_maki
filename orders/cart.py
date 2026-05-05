"""
Cart helpers — resolve the active cart for a request.

Each cart belongs to ONE shop. If a user switches shops, they get a separate
cart (we don't auto-merge across shops since prices differ).
"""
from orders.models import Cart


def get_or_create_cart(request, shop):
    """Return the active cart for this user/session in the given shop."""
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user, shop=shop)
        return cart

    # Guest: use session
    if not request.session.session_key:
        request.session.create()
    cart, _ = Cart.objects.get_or_create(
        session_key=request.session.session_key,
        user=None,
        shop=shop,
    )
    return cart


def merge_session_cart_into_user(request, user):
    """When a guest logs in, move their session cart into their account."""
    session_key = request.session.session_key
    if not session_key:
        return
    Cart.objects.filter(session_key=session_key, user=None).update(
        session_key='', user=user,
    )
