import axios from "axios";

const api = axios.create({
    baseURL: "http://30.30.30.90:3001/api",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;