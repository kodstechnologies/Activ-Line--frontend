import api from "./axios";

export const getFranchises = async () => {
  const res = await api.get("/api/franchise");
  return res.data;
};
