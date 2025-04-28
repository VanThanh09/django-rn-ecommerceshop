import axios from "axios";

const BASE_URL = 'https://de04-2402-800-62ec-acf8-8c9c-d7da-1c4a-5a93.ngrok-free.app/';

export const endpoints = {
    'products': '/products/',
    'product': (pId) => `/product/${pId}/`,
    'register': '/users/',
    'login': '/o/token/',
    'current-user': '/users/current-user/',
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