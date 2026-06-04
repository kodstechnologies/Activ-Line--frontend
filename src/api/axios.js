import axios from "axios";

const rawBaseURL = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8000";
const baseURL = rawBaseURL.replace(/\/+$/, "");

const api = axios.create({
  baseURL,
});

const refreshClient = axios.create({
  baseURL,
});

const getTokenStorageKey = () => import.meta.env.VITE_TOKEN_STORAGE_KEY || "token";

const getStoredAccessToken = () => {
  const tokenStorageKey = getTokenStorageKey();
  return (
    localStorage.getItem(tokenStorageKey) ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken")
  );
};

const setStoredAccessToken = (accessToken) => {
  const tokenStorageKey = getTokenStorageKey();
  localStorage.setItem(tokenStorageKey, accessToken);
  localStorage.setItem("token", accessToken);
  localStorage.setItem("accessToken", accessToken);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("auth:tokenRefreshed", { detail: { accessToken } })
    );
  }
};

const getStoredRefreshToken = () => localStorage.getItem("refreshToken");

api.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    if (token) {
      config.headers.Authorization = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    if (!originalRequest || status !== 401) return Promise.reject(error);

    const url = originalRequest?.url || "";
    if (
      originalRequest._retry ||
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/refresh") ||
      url.includes("/api/auth/logout")
    ) {
      return Promise.reject(error);
    }

    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return Promise.reject(error);

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post("/api/auth/refresh", { refreshToken })
          .then((res) => {
            const data = res?.data;
            const newAccessToken =
              data?.accessToken || data?.data?.accessToken || data?.token;
            if (!newAccessToken) throw new Error("Refresh succeeded without access token");
            setStoredAccessToken(newAccessToken);
            return newAccessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = newAccessToken.startsWith("Bearer ")
        ? newAccessToken
        : `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      try {
        localStorage.removeItem(getTokenStorageKey());
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      } finally {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:forceLogout"));
        }
      }

      return Promise.reject(refreshError);
    }
  }
);

export default api;
