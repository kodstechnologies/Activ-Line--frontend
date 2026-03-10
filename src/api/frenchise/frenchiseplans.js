import api from "../axios";

export const getPlans = (accountId, params) => {
  return api.get(`/api/franchise/${accountId}/profiles`, { params });
};

export const getPlanById = (accountId, profileId) => {
  return api.get(`/api/franchise/${accountId}/profiles/${profileId}`);
};

export const getProfileDetails = (accountId, profileId) => {
  return api.get(`/api/franchise/${accountId}/profile-details/${profileId}`);
};
