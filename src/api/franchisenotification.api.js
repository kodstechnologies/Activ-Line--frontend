import api from "./axios";

/**
 * GET paginated franchise notifications.
 * @param {number} page
 * @param {number} limit
 * @param {boolean|undefined} isRead
 * @returns {{ data: Array, meta: { page, limit, total, totalPages, hasMore } }}
 */
export const getFranchiseNotifications = async (page = 1, limit = 10, isRead) => {
  const params = { page, limit };
  if (isRead !== undefined) params.isRead = isRead;
  const res = await api.get("/api/franchise/notifications", { params });
  return {
    data: res.data.data,
    meta: res.data.meta,
  };
};

// PUT /api/franchise/notifications/:id/read
export const markFranchiseNotificationRead = async (id) => {
  const res = await api.put(`/api/franchise/notifications/${id}/read`);
  return res.data;
};

// PUT /api/franchise/notifications/read-all
export const markAllFranchiseNotificationsRead = async () => {
  const res = await api.put("/api/franchise/notifications/read-all");
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
