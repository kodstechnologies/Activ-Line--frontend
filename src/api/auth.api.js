import api from "./axios";
import { getFcmToken } from "../components/firebase";

export const adminLogin = async ({ email, password }) => {
  let fcmToken = null;

  try {
    // 🔔 Ask permission only if supported
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        fcmToken = await getFcmToken();
        if (!fcmToken) {
          console.warn("Permission granted, but FCM token not retrieved.");
        }
      }
    }
  } catch (err) {
    console.warn("FCM token skipped:", err);
    // ❗ Do NOT block login
  }

  const deviceId = `${navigator.platform}_${navigator.userAgent}`;

  try {
    const response = await api.post("/api/auth/login", {
      email,
      password,
      fcmToken,     // may be null → backend handles it
      deviceId,
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const logoutApi = () => {
  return api.post("/api/auth/logout");
};

export const forgotPassword = async (email) => {
  const response = await api.post("/api/auth/forgot-password", { email });
  return response.data;
};

export const resendForgotPasswordOtp = async (email) => {
  const response = await api.post("/api/auth/forgot-password/resend", { email });
  return response.data;
};

export const resetPassword = async ({ email, otp, password }) => {
  const response = await api.post("/api/auth/reset-password", {
    email,
    otp,
    password,
  });
  return response.data;
};
