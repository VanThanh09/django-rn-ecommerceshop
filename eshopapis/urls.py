from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()

router.register('store', views.StoreDetailViewSet, basename='store')
router.register('users', views.UserViewSet, basename='users')

router.register('verification_seller', views.VerificationSellerViewSet, basename='verification_seller')
router.register('action_verification', views.ActionVerificationViewSet, basename='action_verification')

router.register('products', views.ProductViewSet, basename='products')
router.register('product', views.ProductDetailViewSet, basename='product')
router.register('create_product', views.ProductCreateViewSet, basename='create_product')
router.register('update_product', views.ProductUpdateViewSet, basename='update_product')

router.register('categories', views.CategoryViewSet, basename='categories')

router.register('orders',views.OrderViewSet,basename='order')
router.register('cart-detail', views.CartDetailViewSet, basename='cart-detail')
router.register('update_order_detail', views.OrderDetailUpdateViewSet, basename='update-order-detail-status')
router.register('comments', views.CommentUserViewSet,basename='comments')
router.register('seller_comments',views.CommentSellerViewSet,basename='seller_comments')

urlpatterns = [
    path('', include(router.urls)),
    path('user/orders/', views.user_purchase_list),
    path('portal/store/orders/',views.storeorder_list),
    path('cart/basic-info/', views.get_products_in_cart),
    path('cart/',views.get_products_detail_in_cart),
    path('add_to_cart/', views.create_mul_cartdetail),
    path('checkout/',views.checkout),
    path('checkout/quick_buy/', views.checkout_for_buynow),
    path('update_like_comments/',views.updateLikeComments),
    path('callbackMoMo/',views.callbackMoMo),
    path('create_rating_store/', views.create_store_rating),
    path('verify_isPaid_orderId/',views.verify_isPaid_orderId),
    path('patch_user_info/', views.UserUpdateGenericsView.as_view()),
    path('revenue/', views.revenue_chart_data),
    path('count_order_pending/', views.count_order_pending),
    path('revenue_of_store/', views.revenue_of_store),
]
