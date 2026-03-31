import { io } from "socket.io-client";

const SOCKET_BASE =
  import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8000";

export const socket = io(SOCKET_BASE, {
  autoConnect: false,
  transports: ["websocket"],
});
