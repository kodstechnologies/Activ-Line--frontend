import { io } from "socket.io-client";

const rawSocketBase =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_BACKEND_API_URL ||
  "http://localhost:8000";

const resolveSocketBase = () => {
  try {
    const url = new URL(rawSocketBase, window.location.origin);

    // Avoid mixed-content websocket failures when the frontend is served over HTTPS.
    if (window.location.protocol === "https:" && url.protocol === "http:") {
      url.protocol = "https:";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return rawSocketBase;
  }
};

const SOCKET_BASE = resolveSocketBase();

export const socket = io(SOCKET_BASE, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  upgrade: true,
});
