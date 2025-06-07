import axios from "axios";

const BASE_URL = 'https://c8e6-2402-800-62ec-c9ee-f190-7740-aff9-113d.ngrok-free.app/'
export const endpoints = {
    'products': '/products/',
    'product': (pId) => `/product/${pId}/`,
    'register': '/users/',
    'login': '/o/token/',
    'current_user': '/users/current_user/',
    'info_user': (uId) => `/users/${uId}/info_user/`,
    'verification_seller': '/verification_seller/',
    'categories': '/categories/',
    'create_product': '/create_product/',
    'store': '/store/',
    'action_verification': (rId) => `/action_verification/${rId}/`,
    'update_product': (pId) => `/update_product/${pId}/`,

    'cart_basic_info': '/cart/basic-info/',
    'soldProducts': (pId) => `/product/${pId}/sold/`,
    'top5CommentsProduct': (pId) => `/product/${pId}/top5comments/`,
    'productStoreInfo': (storeId) => `/store/${storeId}/store_info/`,
    'updateLikeComment': '/update_like_comments/',
    'postProductsToCart': '/add_to_cart/',
    'cart': '/cart/',

    'orderOfStore': (status) => `/portal/store/orders/?status=${status}`,
    'update_order_detail': (oId) => `/update_order_detail/${oId}/`,
    'cancel_order_detail': (oId) => `/update_order_detail/${oId}/cancel_order/`,
    'orderOfUser': '/user/orders/',
    'count_order_pending': '/count_order_pending/',
    'revenue_store': '/revenue_of_store/',
    'comments': '/comments/',
    'create_rating_store': '/create_rating_store/',
}

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