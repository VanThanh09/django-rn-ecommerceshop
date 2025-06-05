import axios from "axios";

const BASE_URL = 'https://0d82-171-252-155-237.ngrok-free.app';

export const endpoints = {
    'products': '/products/',
    'getProductById' : (pId) => `products/${pId}/`,
    'product': (pId) => `/product/${pId}/`,
    'register': '/users/',
    'login': '/o/token/',
    'current_user': '/users/current_user/',
    'verification_seller': '/verification_seller/',
    'cart_basic_info': '/cart/basic-info/',
    'soldProducts': (pId) => `/product/${pId}/sold/`,
    'top5CommentsProduct': (pId) => `/product/${pId}/top5comments/`,
    'productStoreInfo': (storeId) => `/store/${storeId}/store_info/`,
    'updateLikeComment': '/update_like_comments/',
    'postProductsToCart': '/add_to_cart/',
    'cart': '/cart/',
    'cartDetailBulkDelete': "/cart-detail/bulk_delete/",
    'removeCartDetail': (cartDetailId) => `/cart-detail/${cartDetailId}/`,
    'patchCartDetail': (cartDetailId) => `/cart-detail/${cartDetailId}/`,
    'checkout': '/checkout/',
    'checkoutForBuyNow': '/checkout/quick_buy/'
};

export const authApis = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

export default axios.create({
    baseURL: BASE_URL
});