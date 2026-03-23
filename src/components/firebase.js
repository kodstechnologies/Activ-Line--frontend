import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  throw new Error("Firebase apiKey missing. Check .env");
}

const app = initializeApp(firebaseConfig);
let messagingInstance = null;

const getMessagingIfSupported = async () => {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (!supported) return null;
  messagingInstance = getMessaging(app);
  return messagingInstance;
};

const registerMessagingServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const swUrl = new URL("/firebase-messaging-sw.js", window.location.origin);
    swUrl.searchParams.set("apiKey", import.meta.env.VITE_FIREBASE_API_KEY);
    swUrl.searchParams.set("authDomain", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
    swUrl.searchParams.set("projectId", import.meta.env.VITE_FIREBASE_PROJECT_ID);
    swUrl.searchParams.set("storageBucket", import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
    swUrl.searchParams.set("messagingSenderId", import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
    swUrl.searchParams.set("appId", import.meta.env.VITE_FIREBASE_APP_ID);

    return await navigator.serviceWorker.register(swUrl.toString());
  } catch (err) {
    console.warn("FCM service worker registration failed:", err);
    return null;
  }
};

export const getFcmToken = async () => {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("FCM VAPID key missing. Set VITE_FIREBASE_VAPID_KEY.");
    return null;
  }

  const serviceWorkerRegistration = await registerMessagingServiceWorker();
  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: serviceWorkerRegistration || undefined,
    });
    if (!token) {
      console.warn("FCM token not available (permission or VAPID issue).");
    }
    return token || null;
  } catch (err) {
    console.warn("FCM getToken failed:", err);
    return null;
  }
};

export const listenToMessages = (handler) => {
  let unsubscribe = null;

  getMessagingIfSupported().then((messaging) => {
    if (!messaging) return;
    unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message:", payload);
      if (typeof handler === "function") {
        handler(payload);
      }
    });
  });

  return () => {
    if (typeof unsubscribe === "function") {
      unsubscribe();
    }
  };
};
