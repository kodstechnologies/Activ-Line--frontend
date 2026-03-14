import api from "./axios";

/* ================= DASHBOARD STATS ================= */

export const getOpenTickets = async () => {
  const res = await api.get("/api/admin/dashboard/open-tickets");
  return res.data.data; // { openTickets }
};

export const getInProgressTickets = async () => {
  const res = await api.get("/api/admin/dashboard/in-progress-tickets");
  return res.data.data; // { inProgressTickets }
};

export const getTodayResolvedTickets = async () => {
  const res = await api.get("/api/admin/dashboard/today-resolved");
  return res.data.data; // { todayResolvedTickets }
};

export const getTotalCustomers = async () => {
  const res = await api.get("/api/admin/dashboard/total-customers");
  return res.data.data; // { totalCustomers }
};

/* ================= RECENT TICKETS ================= */

export const getRecentTickets = async (limit = 5) => {
  const res = await api.get(
    `/api/admin/dashboard/recent-tickets?limit=${limit}`
  );
  return res.data.data;
};

export const getRecentPayments = async (limit = 5) => {
  const res = await api.get(
    `/api/admin/dashboard/recent-payments?limit=${limit}`
  );
  return res.data.data;
};
