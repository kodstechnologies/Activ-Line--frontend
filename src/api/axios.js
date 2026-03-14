import axios from "axios";

const api = axios.create({
<<<<<<< HEAD
  baseURL: import.meta.env.VITE_BACKEND_API_URL,
=======
  baseURL: "http://localhost:8001" ,
>>>>>>> 9e115be56a74cc5d4b4d57735b87bdd862657aa6
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // IMPORTANT
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
