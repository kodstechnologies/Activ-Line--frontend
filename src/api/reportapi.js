import api from "./axios";

export const getReportSummary = async ({ accountId, months = 3 } = {}) => {
  const params = {};

  if (accountId) params.accountId = accountId;
  if (months) params.months = months;

  const res = await api.get(
    "http://localhost:8001/api/dashboard/report-summary",
    { params }
  );
  return res.data.data;
};
