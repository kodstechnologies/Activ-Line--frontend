export const LIVE_RAZORPAY_KEY_ID = "rzp_live_TP8cWDoOKHBgIs";

/**
 * Returns strictly the LIVE Razorpay key.
 * Only accepts import.meta.env.VITE_RAZORPAY_KEY_ID or LIVE_RAZORPAY_KEY_ID.
 * Any other field name or test key (starting with "rzp_test") is strictly ignored.
 */
export const getLiveRazorpayKey = (backendKey) => {
  // 1. Only check the single official env variable VITE_RAZORPAY_KEY_ID
  const envKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (typeof envKey === "string" && envKey.trim().startsWith("rzp_live")) {
    return envKey.trim();
  }

  // 2. Only accept backend key if it is explicitly a live key (never rzp_test)
  if (typeof backendKey === "string" && backendKey.trim().startsWith("rzp_live")) {
    return backendKey.trim();
  }

  // 3. Fallback to verified official live key
  return LIVE_RAZORPAY_KEY_ID;
};
