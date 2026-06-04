import axios from 'axios'
const VITE_BACKEND_LOCALHOST_API_URL = (import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const api = axios.create({
    baseURL: VITE_BACKEND_LOCALHOST_API_URL,
});

export const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
}

