import React, { useEffect, useMemo, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";

import "./App.css";
import { getNotificationsApi } from "./api/notification.api";
import { getFranchiseNotifications } from "./api/franchisenotification.api";
import { getMyStaffNotifications } from "./api/staffnotification.api";
import { listenToMessages } from "./components/firebase";
import AppLoaderGate from "./components/loaders/AppLoaderGate";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Router from "./routes/Router";

const POPUP_DEDUPE_WINDOW_MS = 3000;
const NOTIFICATION_POLL_INTERVAL_MS = 15000;

const normalizeNotificationPayload = (payload) => {
  const data = payload?.data || payload || {};
  const notification = payload?.notification || {};

  return {
    id: payload?.messageId || data?.messageId || data?.id || data?._id || null,
    title:
      notification?.title ||
      data?.title ||
      data?.notification?.title ||
      "Notification",
    body:
      notification?.body ||
      data?.body ||
      data?.message ||
      data?.text ||
      data?.content ||
      data?.description ||
      data?.notification?.body ||
      "",
    icon: notification?.icon || data?.icon,
    type: data?.type || data?.category || "general",
  };
};

const showIncomingNotification = (payload, lastNotificationRef) => {
  const { id, title, body, icon, type } = normalizeNotificationPayload(payload);
  const message = title && body ? `${title}: ${body}` : title || body || "New notification";
  const now = Date.now();
  const dedupeKey = id || `${title}|${body}|${type}`.slice(0, 200);

  if (
    lastNotificationRef.current.key === dedupeKey &&
    now - lastNotificationRef.current.ts < POPUP_DEDUPE_WINDOW_MS
  ) {
    return;
  }

  lastNotificationRef.current = { key: dedupeKey, ts: now };

  toast(message, {
    icon: "!",
    duration: 5000,
    style: { fontSize: "14px" },
  });

  const originalTitle = document.title;
  document.title = `[New] ${title}`;
  window.setTimeout(() => {
    document.title = originalTitle;
  }, 3000);

  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        new Notification(title, { body, icon });
      } catch {
        // Ignore Notification errors in unsupported contexts
      }
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          try {
            new Notification(title, { body, icon });
          } catch {
            // Ignore Notification errors in unsupported contexts
          }
        }
      });
    }
  }

  window.dispatchEvent(new CustomEvent("app:notification-received"));
};

function AppNotificationBridge() {
  const { user, loading, isAuthenticated } = useAuth();
  const lastNotificationRef = useRef({ key: null, ts: 0 });
  const knownNotificationIdsRef = useRef(new Set());
  const seededRoleRef = useRef(null);

  const role = user?.role?.toLowerCase() || null;

  const fetchNotifications = useMemo(() => {
    if (["staff", "admin_staff"].includes(role)) {
      return getMyStaffNotifications;
    }
    if (["franchise", "franchise_admin"].includes(role)) {
      return getFranchiseNotifications;
    }
    if (["admin", "super_admin"].includes(role)) {
      return getNotificationsApi;
    }
    return null;
  }, [role]);

  useEffect(() => {
    const ensureNotificationPermission = async () => {
      if (!("Notification" in window)) return;
      if (Notification.permission === "default") {
        try {
          await Notification.requestPermission();
        } catch {
          // ignore permission errors
        }
      }
    };

    ensureNotificationPermission();

    const unsubscribe = listenToMessages((payload) => {
      showIncomingNotification(payload, lastNotificationRef);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (seededRoleRef.current !== role) {
      knownNotificationIdsRef.current = new Set();
      seededRoleRef.current = role;
    }

    if (loading || !isAuthenticated || !fetchNotifications) return undefined;

    let cancelled = false;

    const pollNotifications = async () => {
      try {
        const notifications = await fetchNotifications();
        if (cancelled || !Array.isArray(notifications)) return;

        const nextKnownIds = new Set(
          notifications
            .map((notification) => notification?._id || notification?.id)
            .filter(Boolean)
        );

        if (knownNotificationIdsRef.current.size === 0) {
          knownNotificationIdsRef.current = nextKnownIds;
          return;
        }

        const newNotifications = notifications
          .filter((notification) => {
            const notificationId = notification?._id || notification?.id;
            return notificationId && !knownNotificationIdsRef.current.has(notificationId);
          })
          .sort(
            (a, b) =>
              new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime()
          );

        newNotifications.forEach((notification) => {
          showIncomingNotification(
            {
              data: {
                _id: notification?._id || notification?.id,
                title: notification?.title,
                message: notification?.message || notification?.body,
                description: notification?.description,
                type: notification?.type || notification?.category,
              },
            },
            lastNotificationRef
          );
        });

        knownNotificationIdsRef.current = nextKnownIds;
      } catch (error) {
        console.error("Notification polling failed", error);
      }
    };

    pollNotifications();
    const intervalId = window.setInterval(
      pollNotifications,
      NOTIFICATION_POLL_INTERVAL_MS
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [fetchNotifications, isAuthenticated, loading, role]);

  return null;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppLoaderGate>
          <AppNotificationBridge />
          <Router />
          <Toaster position="top-right" />
        </AppLoaderGate>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
