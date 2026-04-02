import api from "./axios";

const readStoredUser = () => {
  const userStorageKey = import.meta.env.VITE_USER_STORAGE_KEY || "user";
  const raw =
    localStorage.getItem(userStorageKey) ||
    localStorage.getItem("user") ||
    localStorage.getItem("authUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const resolveReportSummaryPath = (scope) => {
  if (scope === "admin") return "/api/admin/dashboard/report-summary";
  if (scope === "franchise") return "/api/franchise/report-summary";
  return "/api/dashboard/report-summary";
};

const resolveFallbackPaths = (scope) => {
  if (scope === "admin") return ["/api/dashboard/report-summary"];
  if (scope === "franchise")
    return [
      "/api/franchise/dashboard/report-summary",
      "/api/dashboard/report-summary",
    ];
  return [];
};

export const getReportSummary = async ({
  accountId,
  months = 3,
  scope,
} = {}) => {
  const params = {};

  if (accountId) params.accountId = accountId;
  if (months) params.months = months;

  let effectiveScope = scope;
  if (!effectiveScope) {
    const role = readStoredUser()?.role?.toLowerCase() || "";
    effectiveScope = role.includes("franchise") ? "franchise" : "admin";
  }

  const primaryPath = resolveReportSummaryPath(effectiveScope);
  const fallbackPaths = resolveFallbackPaths(effectiveScope).filter(
    (p) => p !== primaryPath
  );

  try {
    const res = await api.get(primaryPath, { params });
    return res.data.data;
  } catch (err) {
    const status = err?.response?.status;
    if (status !== 404) throw err;

    for (const path of fallbackPaths) {
      try {
        const res = await api.get(path, { params });
        return res.data.data;
      } catch (fallbackErr) {
        if (fallbackErr?.response?.status !== 404) throw fallbackErr;
      }
    }

    throw err;
  }
};

export const getAdminReportSummary = async (args) =>
  getReportSummary({ ...args, scope: "admin" });

export const getFranchiseReportSummary = async (args) =>
  getReportSummary({ ...args, scope: "franchise" });
