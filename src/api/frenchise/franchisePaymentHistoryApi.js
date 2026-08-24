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

export const getFranchisePaymentHistoryByGroup = async ({
  groupId,
  page = 1,
  limit = 10,
  status,
  planName,
  date,
  fromDate,
  toDate,
  accountId,
  profileId,
} = {}) => {
  if (!groupId) {
    throw new Error("groupId is required to fetch franchise payment history");
  }

  const params = cleanParams({
    page,
    limit,
    status,
    planName,
    date,
    fromDate,
    toDate,
    accountId,
    profileId,
  });

  const response = await api.get(
    `/api/payment/franchise/${encodeURIComponent(groupId)}/history`,
    { params }
  );

  return response.data;
};

export const getFranchisePaymentHistoryByAccount = async ({
  accountId,
  page = 1,
  limit = 10,
  status,
  planName,
  date,
  fromDate,
  toDate,
  profileId,
} = {}) => {
  if (!accountId) {
    throw new Error("accountId is required to fetch franchise payment history");
  }

  const params = cleanParams({
    page,
    limit,
    status,
    planName,
    date,
    fromDate,
    toDate,
    profileId,
  });

  const response = await api.get(
    `/api/payment/franchise/account/${encodeURIComponent(accountId)}/history`,
    { params }
  );

  return response.data;
};

export const getFranchisePaymentHistoryDetails = async (paymentId) => {
  if (!paymentId) {
    throw new Error("paymentId is required to fetch payment details");
  }

  const response = await api.get(`/api/payment/history/${encodeURIComponent(paymentId)}`);

  return response.data;
};

export const getLatestFranchisePaymentHistory = async () => {
  const response = await api.get(`/api/payment/franchise/account/history/latest`);
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
  const fileName = `franchise_payment_history_${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

