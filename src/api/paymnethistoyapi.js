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
