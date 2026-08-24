import api from "./axios";

const cleanParams = (params = {}) => {
  const out = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = value;
    }
  });
  return out;
};

export const getPaymentHistoryByGroup = async ({
  groupId,
  page = 1,
  limit = 10,
  planName,
  status,
  date,
  fromDate,
  toDate,
  accountId,
  profileId,
} = {}) => {
  const params = cleanParams({
    page,
    limit,
    planName,
    status,
    date,
    fromDate,
    toDate,
    accountId,
    profileId,
  });

  let response;

  if (groupId) {
    response = await api.get(
      `/api/customer/plans/group/${encodeURIComponent(groupId)}/payment-history`,
      { params }
    );
  } else {
    try {
      // Preferred endpoint for "all groups" history.
      response = await api.get(`/api/customer/plans/payment-history`, { params });
    } catch (error) {
      // Fallback if backend uses a path-based convention for all-groups history.
      if (error?.response?.status === 404) {
        response = await api.get(`/api/customer/plans/group/all/payment-history`, {
          params,
        });
      } else {
        throw error;
      }
    }
  }

  return response.data;
};

export const getPaymentHistoryDetails = async (paymentId) => {
  if (!paymentId) {
    throw new Error("paymentId is required to fetch payment details");
  }

  const response = await api.get(
    `/api/customer/plans/payment-history/${encodeURIComponent(paymentId)}`
  );

  return response.data;
};

export const getAllCustomersPaymentHistory = async ({
  page = 1,
  limit = 10,
  planName,
  status,
  search,
  date,
  fromDate,
  toDate,
  accountId,
  groupId,
  profileId,
  userName,
} = {}) => {
  const params = cleanParams({
    page,
    limit,
    planName,
    status,
    search,
    date,
    fromDate,
    toDate,
    accountId,
    groupId,
    profileId,
    userName,
  });

  const response = await api.get(`/api/payment/history/all-customers`, { params });
  return response.data;
};

export const getFranchiseList = async () => {
  const response = await api.get(`/api/franchise`);
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

  // Trigger browser download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  const fileName = `payment_history_${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};


