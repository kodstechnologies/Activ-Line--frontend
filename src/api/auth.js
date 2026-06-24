import axios from "axios";
const VITE_BACKEND_LOCALHOST_API_URL = (
  import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");
const api = axios.create({
  baseURL: VITE_BACKEND_LOCALHOST_API_URL,
});

export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const checkUserExist = async (emailOrParams = "", phoneNumber = "") => {
  const params = {};
  if (emailOrParams && typeof emailOrParams === "object") {
    const data = emailOrParams.data || emailOrParams;
    if (data.emailId) params.emailId = data.emailId.trim();
    if (data.phoneNumber) params.phoneNumber = data.phoneNumber.trim();
  } else {
    if (emailOrParams) params.emailId = String(emailOrParams).trim();
    if (phoneNumber) params.phoneNumber = String(phoneNumber).trim();
  }
  return await api.get("/api/users/auth/check-exists", { params });
};
