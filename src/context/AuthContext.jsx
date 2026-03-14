import React, { createContext, useContext, useEffect, useState } from "react";
import { logoutApi } from "../api/auth.api";
import api from "../api/axios";
const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------- LOAD FROM STORAGE ON REFRESH ---------- */
  useEffect(() => {
    const rawStoredToken = localStorage.getItem("token");
    const storedToken =
      rawStoredToken && rawStoredToken !== "null" && rawStoredToken !== "undefined"
        ? rawStoredToken
        : null;
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        setUser(parsedUser);
        setToken(storedToken);

        // Ensure storage is in sync with what we use
        localStorage.setItem("user", JSON.stringify(parsedUser));
      } catch {
        localStorage.clear();
      }
    }

    setLoading(false);
  }, []);

  /* ---------- LOGIN ---------- */
  const login = (userData, tokenValue) => {
    if (tokenValue) {
      localStorage.setItem("token", tokenValue);
    } else {
      localStorage.removeItem("token");
    }
    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);
    setToken(tokenValue || null);
  };

  /* ---------- LOGOUT ---------- */


const logout = async () => {
  try {
    await logoutApi(); // 🔥 BACKEND LOGOUT
  } catch (err) {
    // even if API fails, continue logout
    console.error("Logout API failed", err);
  } finally {
    localStorage.clear();
    setUser(null);
    setToken(null);
  }
};

  /* ---------- PROFILE ---------- */
  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data.data);
      localStorage.setItem("user", JSON.stringify(res.data.data));
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const updateProfile = async (data) => {
    const res = await api.put("/api/auth/edit", data);
    setUser(res.data.data);
    localStorage.setItem("user", JSON.stringify(res.data.data));
    return res.data.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token, // ✅ IMPORTANT (YOU MISSED THIS)
        login,
        logout,
        loading,
        isAuthenticated: !!user,
        fetchProfile,
        updateProfile,
        isAdmin: () =>
          ["admin", "admin_staff", "super_admin"].includes(
            user?.role?.toLowerCase()
          ),
        isFranchise: () =>
          ["franchise", "franchise_admin"].includes(
            user?.role?.toLowerCase()
          ),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
