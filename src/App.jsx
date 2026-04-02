import React, { useEffect, useMemo, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { AlertCircle, BellRing, CheckCircle2 } from "lucide-react";

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

const NotificationToastCard = ({ title, body }) => (
  <div className="pointer-events-auto w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
    <div className="flex items-start gap-3 p-4">
      <div className="mt-0.5 rounded-xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
        <BellRing className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title || "New notification"}
        </p>
        <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
          {body || "You have a new update waiting."}
        </p>
      </div>
    </div>
    <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
      Activline Alert
    </div>
  </div>
);

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
  const now = Date.now();
  const dedupeKey = id || `${title}|${body}|${type}`.slice(0, 200);

  if (
    lastNotificationRef.current.key === dedupeKey &&
    now - lastNotificationRef.current.ts < POPUP_DEDUPE_WINDOW_MS
  ) {
    return;
  }

  lastNotificationRef.current = { key: dedupeKey, ts: now };

  toast.custom(() => (
    <NotificationToastCard title={title} body={body} />
  ), {
    duration: 5000,
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
          <Toaster
            position="top-right"
            gutter={12}
            containerStyle={{ top: 24, right: 24 }}
            toastOptions={{
              duration: 4000,
              className:
                "rounded-2xl border shadow-xl backdrop-blur-md px-4 py-3 text-sm",
              style: {
                background: "rgba(15, 23, 42, 0.96)",
                color: "#e2e8f0",
                borderColor: "rgba(148, 163, 184, 0.18)",
              },
              success: {
                duration: 3500,
                icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
                style: {
                  background: "linear-gradient(135deg, rgba(6, 78, 59, 0.96), rgba(15, 23, 42, 0.96))",
                  color: "#ecfdf5",
                  borderColor: "rgba(52, 211, 153, 0.24)",
                },
              },
              error: {
                duration: 5000,
                icon: <AlertCircle className="h-5 w-5 text-rose-300" />,
                style: {
                  background: "linear-gradient(135deg, rgba(127, 29, 29, 0.97), rgba(30, 41, 59, 0.96))",
                  color: "#fff1f2",
                  borderColor: "rgba(251, 113, 133, 0.22)",
                },
              },
            }}
          />
        </AppLoaderGate>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
