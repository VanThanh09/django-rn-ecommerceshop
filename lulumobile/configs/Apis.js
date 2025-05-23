import axios from "axios";

const BASE_URL = 'https://c976-115-78-235-98.ngrok-free.app/'
export const endpoints = {
    'products': '/products/',
    'product': (pId) => `/product/${pId}/`,
    'register': '/users/',
    'login': '/o/token/',
    'current_user': '/users/current_user/',
    'info_user': (uId) => `/users/${uId}/info_user/`,
    'verification_seller': '/verification_seller/',
    'categories': '/categories',
    'create_product': '/create_product/',
    'store': '/store/',
    'action_verification': (rId) => `/action_verification/${rId}/`,
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