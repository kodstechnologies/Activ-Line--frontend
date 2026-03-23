import React, { useEffect, useRef } from "react";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Router from "./routes/Router";
import "./App.css";
import toast, { Toaster } from "react-hot-toast";
import AppLoaderGate from "./components/loaders/AppLoaderGate";
import { listenToMessages } from "./components/firebase";

function App() {
  const lastNotificationRef = useRef({ key: null, ts: 0 });

  useEffect(() => {
    const unsubscribe = listenToMessages((payload) => {
      const data = payload?.data || payload;
      const notification = payload?.notification || {};
      const title =
        notification?.title ||
        data?.title ||
        data?.notification?.title ||
        "Notification";
      const body =
        notification?.body ||
        data?.body ||
        data?.message ||
        data?.text ||
        data?.content ||
        data?.notification?.body ||
        "";
      const icon = notification?.icon || data?.icon;
      const message =
        title && body
          ? `${title}: ${body}`
          : title || body || "New notification";

      const now = Date.now();
      const messageId =
        payload?.messageId ||
        data?.messageId ||
        data?.id ||
        data?._id ||
        null;
      const dedupeKey =
        messageId || `${title}|${body}|${data?.type || ""}`.slice(0, 200);

      if (
        lastNotificationRef.current.key === dedupeKey &&
        now - lastNotificationRef.current.ts < 3000
      ) {
        return;
      }
      lastNotificationRef.current = { key: dedupeKey, ts: now };

      toast(message, {
        icon: "🔔",
        duration: 5000,
        style: { fontSize: "14px" },
      });

      const originalTitle = document.title;
      document.title = `🔔 ${title}`;
      setTimeout(() => {
        document.title = originalTitle;
      }, 3000);

      if ("Notification" in window && Notification.permission === "granted") {
        if (document.visibilityState !== "visible") {
          try {
            new Notification(title, { body, icon });
          } catch {
            // Ignore Notification errors in unsupported contexts
          }
        }
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppLoaderGate>
          <Router />
          <Toaster position="top-right" />
        </AppLoaderGate>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
