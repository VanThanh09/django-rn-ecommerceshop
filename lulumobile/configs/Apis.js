import axios from "axios";

const BASE_URL = 'https://c812-2402-800-62ec-acf8-a4dc-3bf5-78ef-850b.ngrok-free.app/';

export const endpoints = {
    'products': '/products/',
    'product': (pId) => `/product/${pId}/`,
    'register': '/users/',
    'login': '/o/token/',
    'current_user': '/users/current_user/',
    'verification_seller': '/verification_seller/',
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