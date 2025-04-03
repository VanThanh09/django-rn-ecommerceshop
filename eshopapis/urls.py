from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register('products', views.ProductViewSet, basename='products')
router.register('store', views.StoreDetailViewSet, basename='store')
router.register('users', views.UserViewSet, basename='users')
router.register('product', views.ProductDetailViewSet, basename='product')


urlpatterns = [
    path('', include(router.urls)),
]