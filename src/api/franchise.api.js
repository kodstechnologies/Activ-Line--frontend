import api from "./axios";

export const getFranchises = async () => {
  const res = await api.get("/api/franchise");
  return res.data;
};

export const getFranchiseAvailability = async (accountId) => {
  const res = await api.get(`/api/franchise/${accountId}/availability`);
  return res.data;
};

export const updateFranchiseAvailability = async (accountId, data) => {
  const res = await api.put(`/api/franchise/${accountId}/availability`, data);
  return res.data;
};
