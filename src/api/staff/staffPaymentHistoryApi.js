import api from "../axios";

const cleanParams = (params = {}) => {
  const out = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = value;
    }
  });
  return out;
};

export const getAssignedPaymentHistory = async ({
  page = 1,
  limit = 10,
  status,
  planName,
  date,
  fromDate,
  toDate,
  profileId,
  customerId,
} = {}) => {
  const params = cleanParams({
    page,
    limit,
    status,
    planName,
    date,
    fromDate,
    toDate,
    profileId,
    customerId,
  });

  const response = await api.get(
    "/api/staff/admin-staff/assigned-payment-history",
    { params }
  );

  return response.data;
};

export const getAssignedPaymentHistoryDetails = async (paymentId) => {
  if (!paymentId) {
    throw new Error("paymentId is required to fetch payment details");
  }

  const response = await api.get(
    `/api/staff/admin-staff/assigned-payment-history/${encodeURIComponent(paymentId)}`
  );

  return response.data;
};

export const downloadPaymentHistoryExcel = async ({
  paymentIds,
  status,
  accountId,
  groupId,
  fromDate,
  toDate,
  search,
  planName,
  page,
  limit,
} = {}) => {
  const formattedPaymentIds = Array.isArray(paymentIds)
    ? paymentIds.join(",")
    : paymentIds;

  const params = cleanParams({
    paymentIds: formattedPaymentIds,
    status,
    accountId,
    groupId,
    fromDate,
    toDate,
    search,
    planName,
    page,
    limit,
  });

  const response = await api.get(`/api/payment/history/download/excel`, {
    params,
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  const fileName = `staff_payment_history_${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

