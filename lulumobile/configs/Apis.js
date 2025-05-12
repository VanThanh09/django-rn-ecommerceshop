import axios from "axios";

const BASE_URL = 'https://cf71-2402-800-62ec-a8f1-ad46-d6cb-87b5-2f03.ngrok-free.app/'
export const endpoints = {
    'products': '/products/',
    'product': (pId) => `/product/${pId}/`,
    'register': '/users/',
    'login': '/o/token/',
    'current_user': '/users/current_user/',
    'verification_seller': '/verification_seller/',
    'categories': '/categories',
    'create_product': '/create_product/'
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