export const LIVE_RAZORPAY_KEY_ID = "rzp_live_TP8cWDoOKHBgIs";

/**
 * Returns the active Razorpay key — works with both test (rzp_test_*) and live (rzp_live_*) keys.
 * Priority:
 *   1. VITE_RAZORPAY_KEY_ID from frontend .env (test or live)
 *   2. key returned by backend API response
 *   3. Hardcoded live key as last resort fallback
 */
export const getLiveRazorpayKey = (backendKey) => {
  // 1. Use whatever key is set in frontend .env (test OR live)
  const envKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (typeof envKey === "string" && envKey.trim().startsWith("rzp_")) {
    return envKey.trim();
  }

  // 2. Accept backend key if it is a valid Razorpay key (test or live)
  if (typeof backendKey === "string" && backendKey.trim().startsWith("rzp_")) {
    return backendKey.trim();
  }

  // 3. Fallback to hardcoded live key (production safety net)
  return LIVE_RAZORPAY_KEY_ID;
};
