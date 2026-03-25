import api from "./axios";

export const getCompanyProfile = async () => {
  const response = await api.get("/api/company-profile/me");
  return response.data;
};

export const createCompanyProfile = async (payload) => {
  const response = await api.post("/api/company-profile/me", payload);
  return response.data;
};

export const updateCompanyProfile = async (payload) => {
  const response = await api.put("/api/company-profile/me", payload);
  return response.data;
};

export const deleteCompanyProfile = async () => {
  const response = await api.delete("/api/company-profile/me");
  return response.data;
};
