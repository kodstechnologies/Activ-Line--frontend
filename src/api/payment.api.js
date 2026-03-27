import api from "./axios";

const cleanPayload = (payload = {}) => {
  const out = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = value;
    }
  });
  return out;
};

export const verifyPlanPayment = async (payload) => {
  const body = cleanPayload(payload);
  const res = await api.post("/api/payment/plan/verify-payment", body);
  return res.data;
};

/**
 * Verifies a Razorpay plan payment, then fetches customer/profile details so the UI
 * can show customer info even if the verify endpoint doesn't include it.
 *
 * `customerDetails` is best-effort: if the follow-up call fails, it will be `null`.
 */
export const verifyPlanPaymentWithCustomerDetails = async (payload) => {
  const verifyRes = await verifyPlanPayment(payload);

  const accountId =
    payload?.accountId ||
    verifyRes?.data?.accountId ||
    verifyRes?.accountId ||
    "";
  const profileId =
    payload?.profileId ||
    verifyRes?.data?.profileId ||
    verifyRes?.profileId ||
    "";

  let customerDetails = null;
  if (accountId && profileId) {
    try {
      const profileRes = await api.get(
        `/api/franchise/${encodeURIComponent(accountId)}/profile-details/${encodeURIComponent(profileId)}`
      );
      customerDetails = profileRes?.data?.data ?? profileRes?.data ?? null;
    } catch {
      customerDetails = null;
    }
  }

  return { ...verifyRes, customerDetails };
};

export const getLatestPlan = async ({ accountId, groupId } = {}) => {
  const params = cleanPayload({ accountId, groupId });
  const res = await api.get("/api/payment/plan/latest", { params });
  return res.data;
};

