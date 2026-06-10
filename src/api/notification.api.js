import api from "./axios";

/**
 * GET paginated notifications for the logged-in admin/staff user.
 * @param {number} page  - page number (1-based)
 * @param {number} limit - items per page
 * @param {boolean|undefined} isRead - undefined = all, false = unread, true = read
 * @returns {{ data: Array, meta: { page, limit, total, totalPages, hasMore } }}
 */
export const getNotificationsApi = async (page = 1, limit = 10, isRead) => {
  const params = { page, limit };
  if (isRead !== undefined) params.isRead = isRead;
  const res = await api.get("/api/notifications", { params });
  return {
    data: res.data.data,
    meta: res.data.meta,
  };
};

export const markNotificationReadApi = async (id) => {
  return api.patch(`/api/notifications/${id}/read`);
};

// Mark ALL notifications as read (bulk — new backend endpoint)
export const markAllNotificationsReadApi = async () => {
  return api.patch("/api/notifications/mark-all-read");
};

// Delete single notification
export const deleteNotificationApi = async (id) => {
  return api.delete(`/api/notifications/${id}`);
};

// Delete all notifications (role-based)
export const deleteAllNotificationsApi = async () => {
  return api.delete("/api/notifications");
};

// GET unread count
export const getUnreadCountApi = async () => {
  const res = await api.get("/api/notifications/unread-count");
  return res.data.data.unreadCount;
};
