import axios from "axios";

const API_BASE =
  import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8000";

const API = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── 1. Get all franchises ──────────────────────────────────────────────────────
export const fetchFranchiseList = async () => {
  const response = await API.get("/franchise");
  return response.data; // { success, message, data: [...] }
};

// ── 2. Get group details filtered by accountId ────────────────────────────────
export const fetchGroupDetails = async (accountId) => {
  const response = await API.get("/franchise/group-details", {
    params: { accountId }, // ?accountId=franchisetest
  });
  return response.data; // { success, data: { status, errorCode, data: [...] } }
};

// ── 3. Get full profile + billing details ─────────────────────────────────────
export const fetchProfileDetails = async (accountId, profileId) => {
  const response = await API.get(`/franchise/${accountId}/profile-details/${profileId}`);
  return response.data; // { success, data: { status, errorCode, message: { profileDetails, billingDetails } } }
};

export default API;
