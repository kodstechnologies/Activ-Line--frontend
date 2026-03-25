import api from "./axios";

export const getFranchiseAdmins = async (page = 1, limit = 20, search = "") => {
  const res = await api.get(
    `/api/franchise/admin-credentials?page=${page}&limit=${limit}&search=${search}`
  );
  return res.data;
};

export const createFranchiseAdmin = async (payload) => {
  const res = await api.post(
    "/api/franchise/admin-credentials/create",
    payload
  );
  return res.data;
};

export const updateFranchiseAdmin = async (id, payload) => {
  const res = await api.put(
    `/api/franchise/admin-credentials/${id}`,
    payload,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data;
};

export const deleteFranchiseAdmin = async (id) => {
  const res = await api.delete(`/api/franchise/admin-credentials/${id}`);
  return res.data;
};
