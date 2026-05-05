"""
Permission classes used across the API.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsManager(BasePermission):
    """User must be a manager."""
    message = 'Только менеджер магазина может выполнить это действие.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.is_manager()
        )


class IsManagerOrReadOnly(BasePermission):
    """Managers can write; everyone else can read."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return (
            request.user.is_authenticated
            and request.user.is_manager()
        )


class IsShopStaffOrReadOnly(BasePermission):
    """Manager OR worker can write; everyone reads."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return (
            request.user.is_authenticated
            and request.user.is_staff_member()
        )


class IsManagerOfObjectShop(BasePermission):
    """User must be the manager of the shop that owns this object."""
    def has_object_permission(self, request, view, obj):
        if not (request.user.is_authenticated and request.user.is_manager()):
            return False
        # Walk to the shop relationship
        obj_shop = getattr(obj, 'shop', None)
        if obj_shop is None and hasattr(obj, 'category'):
            obj_shop = obj.category.shop
        return obj_shop == request.user.shop
