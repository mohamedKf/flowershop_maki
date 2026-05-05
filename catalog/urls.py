from django.urls import path, include
from rest_framework.routers import DefaultRouter

from catalog import views

router = DefaultRouter()
router.register('shops', views.ShopViewSet, basename='shop')
router.register('categories', views.CategoryViewSet, basename='category')
router.register('flowers', views.FlowerViewSet, basename='flower')
router.register('sizes', views.FlowerSizeViewSet, basename='size')
router.register('tiers', views.DiscountTierViewSet, basename='tier')
router.register('promotions', views.PromotionViewSet, basename='promotion')

app_name = 'catalog'

urlpatterns = [
    path('', include(router.urls)),
]
