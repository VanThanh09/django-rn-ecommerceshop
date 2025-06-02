import axios from "axios";

const BASE_URL = 'https://6462-2402-800-62ec-c9ee-e9fa-4d9f-161b-57e1.ngrok-free.app/'
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