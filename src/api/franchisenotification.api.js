import api from "./axios";

// GET /api/franchise/notifications
export const getFranchiseNotifications = async () => {
  const res = await api.get("/api/franchise/notifications");
  return res.data.data;
};

// PATCH /api/franchise/notifications/:id/read
export const markFranchiseNotificationRead = async (id) => {
  const res = await api.patch(`/api/franchise/notifications/${id}/read`);
  return res.data;
};

// PATCH /api/franchise/notifications/read-all
export const markAllFranchiseNotificationsRead = async () => {
  const res = await api.patch("/api/franchise/notifications/read-all");
  return res.data;
};

// DELETE /api/franchise/notifications/:id
export const deleteFranchiseNotification = async (id) => {
  const res = await api.delete(`/api/franchise/notifications/${id}`);
  return res.data;
};

// DELETE /api/franchise/notifications
export const deleteAllFranchiseNotifications = async () => {
  const res = await api.delete("/api/franchise/notifications");
  return res.data;
};

// GET /api/franchise/notifications/unread-count
export const getFranchiseUnreadCount = async () => {
  const res = await api.get("/api/franchise/notifications/unread-count");
  return res.data.data.unreadCount;
};
