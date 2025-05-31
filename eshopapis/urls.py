from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register('products', views.ProductViewSet, basename='products')
router.register('store', views.StoreDetailViewSet, basename='store')
router.register('users', views.UserViewSet, basename='users')
router.register('product', views.ProductDetailViewSet, basename='product')
router.register('verification_seller', views.VerificationSellerViewSet, basename='verification_seller')
router.register('action_verification', views.ActionVerificationViewSet, basename='action_verification')
router.register('create_product', views.ProductCreateViewSet, basename='create_product')
router.register('orders',views.OrderViewSet,basename='order')
router.register('cart-detail', views.CartDetailViewSet, basename='cart-detail')
router.register('update_order_detail', views.OrderDetailUpdateViewSet, basename='update-order-detail-status')
router.register('comments', views.CommentUserViewSet,basename='comments')
router.register('seller_comments',views.CommentSellerViewSet,basename='seller_comments')

urlpatterns = [
    path('', include(router.urls)),
    # path('comments/<int:pk>/', views.CommentDetailAPIView.as_view()),
    # path('comments/', views.CommentCreateAPIView.as_view())
    path('user/orders/', views.userpurchase_list),
    path('portal/store/orders/',views.storeorder_list),
    path('cart/basic-info/', views.get_products_in_cart),
    path('cart/',views.get_products_detail_in_cart),
    path('add_to_cart/', views.create_mul_cartdetail),
    path('checkout/',views.checkout),
    path('update_like_comments/',views.updateLikeComments),
    path('callbackMoMo/',views.callbackMoMo),
    path('create_rating_store/', views.create_store_rating),
]
