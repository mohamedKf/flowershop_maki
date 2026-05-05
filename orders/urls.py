from django.urls import path, include
from rest_framework.routers import DefaultRouter

from orders import views

router = DefaultRouter()
router.register('orders', views.OrderViewSet, basename='order')

app_name = 'orders'

urlpatterns = [
    # Cart
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/items/', views.add_cart_item, name='cart-add'),
    path('cart/items/<int:pk>/', views.cart_item_detail, name='cart-item'),

    # Custom bouquet builder
    path('custom-bouquet/quote/', views.custom_bouquet_quote, name='custom-quote'),
    path('custom-bouquet/add/', views.add_custom_bouquet, name='custom-add'),

    # Checkout
    path('checkout/', views.checkout, name='checkout'),

    # Payment
    path('orders/<str:number>/pay/', views.start_payment, name='pay'),
    path('orders/<str:number>/invoice/', views.order_invoice, name='invoice'),
    path('payment/return/', views.payment_return, name='payment-return'),
    path('payment/fail/', views.payment_fail, name='payment-fail'),

    # Dashboard (managers)
    path('dashboard/overview/', views.DashboardOverview.as_view(), name='dash-overview'),
    path('dashboard/orders/', views.dashboard_orders, name='dash-orders'),
    path('dashboard/orders/<str:number>/status/',
         views.dashboard_update_order_status, name='dash-order-status'),
    path('dashboard/customers/', views.dashboard_customers, name='dash-customers'),

    # Order list/detail (must come last to not clash with /orders/return etc.)
    path('', include(router.urls)),
]
