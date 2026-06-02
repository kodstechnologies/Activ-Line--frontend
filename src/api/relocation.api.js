import api from "./axios";

export const getRelocationsApi = async (params) => {
  const response = await api.get("/api/customer/relocation", { params });
  return response.data;
};

export const updateRelocationApi = async (relocationId, data) => {
  const response = await api.put(`/api/customer/relocation/${relocationId}`, data);
  return response.data;
};

export const deleteRelocationApi = async (relocationId) => {
  const response = await api.delete(`/api/customer/relocation/${relocationId}`);
  return response.data;
};
