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
