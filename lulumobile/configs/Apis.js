import axios from "axios";

const BASE_URL = 'https://aaa5-2402-800-62ec-acf8-e9b9-ac6a-8ffe-9be1.ngrok-free.app/';

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