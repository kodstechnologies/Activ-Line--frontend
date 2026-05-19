import api from "./axios";

const BASE = "/api/admin/settings";

/**
 * GET all banners
 */
export const getAllBanners = async () => {
  const res = await api.get(`${BASE}/banner`);
  return res.data;
};

/**
 * POST — upload a new image or video banner
 * @param {File} file
 */
export const createBanner = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.post(`${BASE}/banner/create`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/**
 * PUT — replace an existing banner's file
 * @param {string} bannerId
 * @param {File} file
 */
export const updateBanner = async (bannerId, file) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.put(`${BASE}/banner/${bannerId}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/**
 * PATCH — toggle banner active / inactive
 * @param {string} bannerId
 */
export const toggleBanner = async (bannerId) => {
  const res = await api.patch(`${BASE}/banner/${bannerId}/toggle`);
  return res.data;
};

/**
 * DELETE — permanently remove a banner
 * @param {string} bannerId
 */
export const deleteBanner = async (bannerId) => {
  const res = await api.delete(`${BASE}/banner/${bannerId}`);
  return res.data;
};
