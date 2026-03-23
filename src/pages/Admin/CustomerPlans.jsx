import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import {
  getFranchiseProfiles,
  createPlanOrder,
  verifyPlanPayment,
  getSingleCustomer
} from "../../api/customer.api";

const CustomerPlans = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const accountId = location?.state?.accountId || "";
  const userName = location?.state?.userName || "";
  const customerId = location?.state?.customerId || "";
  const selectedGroupId = location?.state?.groupId || "";
  const firstName = location?.state?.firstName || "";
  const lastName = location?.state?.lastName || "";
  const emailId = location?.state?.emailId || "";
  const phoneNumber = location?.state?.phoneNumber || "";

  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    groupId: "",
    profileId: "",
    amount: ""
  });
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [customerUserName, setCustomerUserName] = useState("");

  useEffect(() => {
    if (location?.state?.groupId || location?.state?.profileId) {
      setPaymentForm((prev) => ({
        ...prev,
        groupId: location.state.groupId || prev.groupId,
        profileId: location.state.profileId || prev.profileId
      }));
    }
  }, [location]);

  useEffect(() => {
    let active = true;
    if (!customerId) return;
    getSingleCustomer(customerId)
      .then((res) => {
        if (!active) return;
        const data = res?.data?.data || res?.data || {};
        const resolvedUserName =
          data?.userName ||
          data?.username ||
          data?.customer?.userName ||
          data?.customer?.username ||
          "";
        if (resolvedUserName) {
          setCustomerUserName(resolvedUserName);
        }
      })
      .catch(() => {
        // ignore lookup errors
      });
    return () => {
      active = false;
    };
  }, [customerId]);

  const extractProfileInfo = (profile) => {
    if (!profile) return { profileId: "", groupId: "", name: "", planName: "", amount: "" };
    const profileId =
      profile?.Profile?.id ||
      profile.profileId ||
      profile.profile_id ||
      profile.id ||
      profile._id ||
      profile?.profile?.id ||
      "";
    const groupId =
      profile?.Profile?.groupId ||
      profile.groupId ||
      profile.group_id ||
      profile.userGroupId ||
      profile?.group?.id ||
      profile?.groupId ||
      "";
    const name =
      profile?.Profile?.name ||
      profile.userName ||
      profile.username ||
      profile.name ||
      profile.fullName ||
      profile.customerName ||
      "";
    const planName =
      profile?.Profile?.name ||
      profile.planName ||
      profile.plan?.planName ||
      profile.plan?.name ||
      profile.planTitle ||
      "";
    const detailsBilling = Array.isArray(profile?.details?.["billing Details"])
      ? profile.details["billing Details"]
      : [];
    const totalPriceItem = detailsBilling.find(
      (item) => String(item?.property || "").toLowerCase().includes("total price")
    );
    const amount =
      totalPriceItem?.value ||
      profile.amount ||
      profile.planAmount ||
      profile.plan?.amount ||
      "";
    return { profileId, groupId, name, planName, amount };
  };

  const renderDetailList = (items, options = {}) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    const filterProps = options.filterProps || new Set();
    const filterValues = options.filterValues || new Set();
    const dedupeProp = options.dedupeProp || null;
    const seenProps = new Set();

    const rows = items.filter((item) => {
      const prop = String(item?.property || "").trim();
      const value = String(item?.value ?? "").trim();
      const propKey = prop.toLowerCase();
      const valueKey = value.toLowerCase();

      if (filterProps.has(propKey)) return false;
      if (filterValues.has(valueKey)) return false;
      if (dedupeProp && propKey === dedupeProp && seenProps.has(propKey)) return false;
      if (dedupeProp && propKey === dedupeProp) seenProps.add(propKey);
      return true;
    });

    if (rows.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {rows.map((item, idx) => (
          <div key={`${item?.property || "item"}-${idx}`} className="flex justify-between text-xs gap-3">
            <span className={`${isDark ? "text-slate-300" : "text-gray-700"}`}>{item?.property || "—"}</span>
            <span className={`${isDark ? "text-slate-400" : "text-gray-600"}`}>{item?.value ?? "—"}</span>
          </div>
        ))}
      </div>
    );
  };

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Razorpay can only be loaded in the browser."));
        return;
      }
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
      document.body.appendChild(script);
    });

  const handleSelectProfile = (profile) => {
    const info = extractProfileInfo(profile);
    setSelectedProfile(profile);
    setPaymentForm({
      profileId: info.profileId || "",
      groupId: info.groupId || "",
      amount: info.amount !== "" ? info.amount : ""
    });
    setPaymentVerified(false);
    setPaymentStatus(null);
  };

  const handleCreateOrder = async () => {
    const groupId = paymentForm.groupId?.toString().trim();
    const profileId = paymentForm.profileId?.toString().trim();
    const amountValue = paymentForm.amount;

    if (!accountId) {
      setPaymentStatus({ type: "error", message: "Account ID is missing." });
      return;
    }
    if (!groupId || !profileId || !amountValue) {
      setPaymentStatus({ type: "error", message: "Please select a plan first." });
      return;
    }
    const resolvedUserName = customerUserName || userName;
    setIsPaying(true);
    setPaymentStatus(null);
    setPaymentVerified(false);

    try {
      const createPayload = {
        accountId,
        groupId,
        profileId,
        amount: Number(amountValue)
      };
      if (resolvedUserName) {
        createPayload.userName = resolvedUserName;
      }

      const createRes = await createPlanOrder(createPayload);

      const createResponsePayload = createRes?.data?.data ?? createRes?.data ?? {};
      const orderId =
        createResponsePayload.orderId ||
        createResponsePayload.razorpayOrderId ||
        createResponsePayload.id ||
        createResponsePayload.order?.id;
      const currency = createResponsePayload.currency || createResponsePayload.order?.currency || "INR";
      const orderAmount = createResponsePayload.amount ?? createResponsePayload.order?.amount;

      if (!orderId) {
        throw new Error("Order ID not returned from create-order API.");
      }

      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || import.meta.env.RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error("Razorpay key not found. Please set VITE_RAZORPAY_KEY_ID in .env.");
      }

      await loadRazorpayScript();

      const amountInPaise = orderAmount ?? Math.round(Number(amountValue) * 100);

      const options = {
        key: keyId,
        amount: amountInPaise,
        currency,
        name: "Activline",
        description: "Customer plan payment",
        order_id: orderId,
        prefill: {
          name: resolvedUserName || "",
          email: emailId || "",
          contact: phoneNumber || ""
        },
        notes: {
          accountId,
          groupId,
          profileId
        },
        handler: async (response) => {
          try {
            const verifyUrl =
              import.meta.env.VITE_PAYMENT_VERIFY_URL ||
              "http://192.168.88.27:8000/api/payment/plan/verify-payment";

            await verifyPlanPayment(
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                accountId,
                groupId,
                profileId,
                ...(resolvedUserName ? { userName: resolvedUserName } : {})
              },
              verifyUrl
            );

            setPaymentStatus({ type: "success", message: "Payment verified successfully." });
            setPaymentVerified(true);
            navigate("/customers", {
              replace: true
            });
          } catch (verifyErr) {
            const msg =
              verifyErr?.response?.data?.message ||
              verifyErr?.message ||
              "Payment verification failed.";
            setPaymentStatus({ type: "error", message: msg });
            setPaymentVerified(false);
          }
        },
        theme: {
          color: "#2563eb"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (resp) => {
        const msg = resp?.error?.description || "Payment failed. Please try again.";
        setPaymentStatus({ type: "error", message: msg });
        setPaymentVerified(false);
      });
      razorpay.open();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to start payment.";
      setPaymentStatus({ type: "error", message: msg });
      setPaymentVerified(false);
    } finally {
      setIsPaying(false);
    }
  };

  const handleReturnToCustomer = () => {
    navigate("/customers", {
      state: {
        fromPlans: true,
        accountId,
        profileId: paymentForm.profileId,
        groupId: paymentForm.groupId,
        amount: paymentForm.amount,
        paymentVerified,
        firstName,
        lastName,
        emailId,
        phoneNumber
      }
    });
  };

  useEffect(() => {
    let isActive = true;
    if (!accountId) return;
    setProfilesLoading(true);
    setProfilesError("");
    getFranchiseProfiles(accountId, true)
      .then((res) => {
        if (!isActive) return;
        const rows = res?.data?.data ?? res?.data ?? [];
        setProfiles(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (!isActive) return;
        setProfiles([]);
        setProfilesError(err?.response?.data?.message || err?.message || "Failed to load profiles");
      })
      .finally(() => {
        if (!isActive) return;
        setProfilesLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [accountId]);

  useEffect(() => {
    const targetProfileId = location?.state?.profileId;
    if (!targetProfileId || profiles.length === 0) return;
    const found = profiles.find((p) => {
      const info = extractProfileInfo(p);
      return info.profileId === targetProfileId;
    });
    if (found) {
      handleSelectProfile(found);
    }
  }, [profiles, location]);

  const canPay = useMemo(() => {
    return Boolean(paymentForm.groupId && paymentForm.profileId && paymentForm.amount);
  }, [paymentForm.groupId, paymentForm.profileId, paymentForm.amount]);

  const filteredProfiles = useMemo(() => {
    if (!selectedGroupId) return profiles;
    return profiles.filter((profile) => {
      const info = extractProfileInfo(profile);
      return info.groupId === selectedGroupId;
    });
  }, [profiles, selectedGroupId]);

  if (!accountId) {
    return (
      <div className={`p-6 ${isDark ? "text-slate-200" : "text-gray-800"}`}>
        <button
          onClick={handleReturnToCustomer}
          className={`flex items-center gap-2 text-sm mb-4 ${isDark ? "text-slate-300" : "text-gray-600"}`}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Customers
        </button>
        Account ID is missing. Please go back and select an account.
      </div>
    );
  }

  return (
    <div className={`p-6 ${isDark ? "bg-slate-900 text-slate-100" : "bg-white text-gray-900"}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={handleReturnToCustomer}
            className={`flex items-center gap-2 text-sm mb-2 ${isDark ? "text-slate-300" : "text-gray-600"}`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Customers
          </button>
          <h2 className="text-2xl font-bold">Select Plan & Pay</h2>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>
            Account ID: {accountId}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className={`rounded-xl border ${isDark ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-gray-50"} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Plan Details</h3>
              {profilesLoading && (
                <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}>Loading...</span>
              )}
            </div>

            {profilesError && (
              <div className={`text-sm mb-3 ${isDark ? "text-red-300" : "text-red-600"}`}>
                {profilesError}
              </div>
            )}

            {!profilesLoading && !profilesError && filteredProfiles.length === 0 && (
              <div className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                No profiles found for this group.
              </div>
            )}

            {filteredProfiles.length > 0 && (
              <div className="grid grid-cols-1 gap-3 max-h-[70vh] overflow-y-auto">
                {filteredProfiles.map((profile, idx) => {
                  const info = extractProfileInfo(profile);
                  const profileDetails =
                    profile?.details?.["profile Details"] ||
                    profile?.details?.profileDetails ||
                    profile?.profileDetails ||
                    [];
                  const billingDetails =
                    profile?.details?.["billing Details"] ||
                    profile?.details?.billingDetails ||
                    profile?.billingDetails ||
                    [];
                  const billingFilterProps = new Set([
                    "billingplanid",
                    "type",
                    "description"
                  ]);
                  const billingFilterValues = new Set([
                    "payasyougo",
                    "cgst",
                    "sgst"
                  ]);
                  const isSelected =
                    selectedProfile &&
                    (selectedProfile._id === profile._id ||
                      selectedProfile.id === profile.id ||
                      info.profileId === paymentForm.profileId);
                  return (
                    <div
                      key={profile._id || profile.id || info.profileId || idx}
                      className={`rounded-lg border p-3 ${isSelected
                        ? isDark
                          ? "border-blue-500 bg-slate-800"
                          : "border-blue-500 bg-white"
                        : isDark
                          ? "border-slate-800 bg-slate-900"
                          : "border-gray-200 bg-white"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                            {info.name || "Profile"}
                          </div>
                          <div className={`text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                            Profile ID: {info.profileId || "—"} | Group ID: {info.groupId || "—"}
                          </div>
                          {(info.planName || info.amount) && (
                            <div className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                              {info.planName ? `Plan: ${info.planName}` : ""}
                              {info.planName && info.amount ? " • " : ""}
                              {info.amount ? `Amount: ${info.amount}` : ""}
                            </div>
                          )}
                          {renderDetailList(profileDetails)}
                          {renderDetailList(billingDetails, {
                            filterProps: billingFilterProps,
                            filterValues: billingFilterValues,
                            dedupeProp: "period"
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectProfile(profile)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isSelected
                            ? "bg-blue-600 text-white"
                            : isDark
                              ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className={`rounded-xl border p-4 ${isDark ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-white"}`}>
            <h3 className="text-lg font-semibold mb-3">Selected Plan</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className={`${isDark ? "text-slate-400" : "text-gray-600"}`}>Profile ID</div>
                <div className="font-semibold">{paymentForm.profileId || "—"}</div>
              </div>
              <div>
                <div className={`${isDark ? "text-slate-400" : "text-gray-600"}`}>Group ID</div>
                <div className="font-semibold">{paymentForm.groupId || "—"}</div>
              </div>
              <div>
                <div className={`${isDark ? "text-slate-400" : "text-gray-600"}`}>Amount</div>
                <div className="font-semibold">{paymentForm.amount || "—"}</div>
              </div>
            </div>

            {paymentStatus && (
              <div className={`mt-4 text-sm ${paymentStatus.type === "success"
                ? isDark ? "text-green-300" : "text-green-700"
                : isDark ? "text-red-300" : "text-red-600"
                }`}>
                {paymentStatus.message}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={isPaying || !canPay}
                className="w-full px-4 py-2 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPaying ? "Processing Payment..." : "Pay with Razorpay"}
              </button>
              <button
                type="button"
                onClick={handleReturnToCustomer}
                disabled={!paymentVerified}
                className="w-full px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Use This Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPlans;
