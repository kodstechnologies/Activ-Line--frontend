/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js");

const params = new URL(self.location).searchParams;
const firebaseConfig = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

if (!firebaseConfig.apiKey) {
  console.warn("Firebase config missing in service worker.");
} else {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    if (payload?.notification) return;
    const title =
      payload?.data?.title ||
      "New notification";
    const body =
      payload?.data?.body ||
      payload?.data?.message ||
      "";
    const icon = payload?.notification?.icon || payload?.data?.icon;
    const url = payload?.data?.link || payload?.data?.url || "/";

    self.registration.showNotification(title, {
      body,
      icon,
      data: { url },
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
