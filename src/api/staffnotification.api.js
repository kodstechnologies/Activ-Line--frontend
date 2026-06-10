import api from "./axios";

/**
 * GET paginated staff notifications.
 * @param {number} page
 * @param {number} limit
 * @param {boolean|undefined} isRead
 * @returns {{ data: Array, meta: { page, limit, total, totalPages, hasMore } }}
 */
export const getMyStaffNotifications = async (page = 1, limit = 10, isRead) => {
  const params = { page, limit };
  if (isRead !== undefined) params.isRead = isRead;
  const res = await api.get("/api/staff/notifications", { params });
  return {
    data: res.data.data,
    meta: res.data.meta,
  };
};

// PATCH /api/staff/notifications/:id/read
export const markStaffNotificationRead = async (id) => {
  const res = await api.patch(`/api/staff/notifications/${id}/read`);
  return res.data;
};

// DELETE /api/staff/notifications/:id
export const deleteStaffNotification = async (id) => {
  const res = await api.delete(`/api/staff/notifications/${id}`);
  return res.data;
};

// PATCH /api/staff/notifications/read-all
export const markAllStaffNotificationsRead = async () => {
  const res = await api.patch("/api/staff/notifications/read-all");
  return res.data;
};

// DELETE /api/staff/notifications
export const deleteAllStaffNotifications = async () => {
  const res = await api.delete("/api/staff/notifications");
  return res.data;
};

// GET unread count
export const getStaffUnreadCount = async () => {
  const res = await api.get("/api/staff/notifications/unread-count");
  return res.data.data.unreadCount;
};
