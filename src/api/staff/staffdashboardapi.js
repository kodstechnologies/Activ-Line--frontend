import api from "../axios";

const getAssignmentStatsPayload = async () => {
  const response = await api.get("/api/staff/admin-staff/assignment-stats");
  return response?.data?.data || {};
};

export const getAssignedStaffStats = async () => {
  const response = await api.get("/api/staff/admin-staff/assignment-stats");
  return response.data;
};

export const getLatestAssignedRooms = async (limit = 5) => {
  const response = await api.get(
    `/api/staff/admin-staff/latest-assigned-rooms?limit=${limit}`
  );
  return response.data;
};

// Compatibility exports used by Staffdashboard.jsx
export const getOpenTickets = async () => {
  const payload = await getAssignmentStatsPayload();
  return { openTickets: payload?.summary?.statusCounts?.open ?? 0 };
};

export const getInProgressTickets = async () => {
  const payload = await getAssignmentStatsPayload();
  const assigned = payload?.summary?.statusCounts?.assigned ?? 0;
  const inProgress = payload?.summary?.statusCounts?.inProgress ?? 0;
  // Backend uses both ASSIGNED and IN_PROGRESS states.
  return { inProgressTickets: assigned + inProgress };
};

export const getTodayResolvedTickets = async () => {
  const payload = await getAssignmentStatsPayload();
  return { todayResolvedTickets: payload?.summary?.statusCounts?.resolved ?? 0 };
};

export const getTotalCustomers = async () => {
  const payload = await getAssignmentStatsPayload();
  // New aggregated endpoint doesn't expose total customers.
  // Using assigned staff count keeps the dashboard card populated.
  return { totalCustomers: payload?.summary?.assignedStaffCount ?? 0 };
};

export const getRecentTickets = async (limit = 5) => {
  const response = await api.get(
    `/api/staff/admin-staff/latest-assigned-rooms?limit=${limit}`
  );
  const rooms = response?.data?.data?.rooms || [];

  return rooms.map((room) => ({
    ticketId: room?._id || room?.ticketId || "",
    subject: room?.subject || room?.title || "No Subject",
    status: room?.status || "OPEN",
    createdAt: room?.createdAt || room?.updatedAt || new Date().toISOString(),
    customer:
      room?.customer?.fullName ||
      room?.customer?.name ||
      room?.customer?.email ||
      "N/A",
  }));
};
