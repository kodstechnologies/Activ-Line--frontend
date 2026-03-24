import api from "./axios"; // your axios instance

// ✅ Get paginated customers
export const getCustomers = (page, limit, filters = {}) => {
  const params = new URLSearchParams({
    page,
    limit,
    ...filters,
  });

  return api.get(`/api/customer?${params.toString()}`);
};


// ✅ Get single customer
export const getSingleCustomer = (customerId) => {
  return api.get(`/api/customer/customers/${customerId}`);
};

// ✅ Create customer
export const createCustomer = (formData) => {
  const config = { headers: { "Content-Type": "multipart/form-data" } };
  return api.post(`/api/customer/create`, formData, config);
};

// ✅ Get admin customer list (paginated)
export const getAdminCustomers = (params = {}) => {
  return api.get("/api/customer/customers", { params });
};

// ✅ Get franchise list
export const getFranchises = () => {
  return api.get("/api/franchise");
};

// ✅ Get franchise profiles with details
export const getFranchiseProfiles = (accountId, includeDetails = true, type) => {
  if (!accountId) throw new Error("accountId is required");
  return api.get(`/api/franchise/${encodeURIComponent(accountId)}/profiles`, {
    params: { includeDetails, ...(type ? { type } : {}) }
  });
};

// ✅ Get franchise group details
export const getFranchiseGroupDetails = (accountId) => {
  if (!accountId) throw new Error("accountId is required");
  return api.get("/api/franchise/group-details", {
    params: { accountId }
  });
};

// ✅ Create Razorpay order for customer plan
export const createPlanOrder = (payload) => {
  return api.post("/api/payment/plan/create-order", payload);
};

// ✅ Verify Razorpay plan payment
export const verifyPlanPayment = (payload, verifyUrl) => {
  if (verifyUrl) {
    return api.post(verifyUrl, payload);
  }
  return api.post("/api/payment/plan/verify-payment", payload);
};

// ✅ Customer chat rooms (ticket status)
export const getCustomerChatRooms = () => {
  return api.get("/api/chat/user/my-rooms");
};

// ✅ Customer payment history (logged-in)
export const getMyPaymentHistory = () => {
  return api.get("/api/customer/plans/my/payment-history");
};

// ✅ Admin: payment history for a particular customer
export const getAdminCustomerPaymentHistory = (customerId, userName) => {
  if (!customerId) throw new Error("customerId is required");
  const params = userName ? { userName } : undefined;
  return api.get(`/api/admin/customers/${encodeURIComponent(customerId)}/payment-history`, { params });
};

// ✅ Admin: ticket status/details for a particular customer
export const getAdminCustomerTickets = (customerId) => {
  if (!customerId) throw new Error("customerId is required");
  return api.get(`/api/admin/customers/${encodeURIComponent(customerId)}/tickets`);
};

// ✅ Admin: payment history across all customers (paginated + filters)
export const getAdminAllCustomersPaymentHistory = (params = {}) => {
  return api.get("/api/payment/history/all-customers", { params });
};

// ✅ Maintenance dates by accountId
export const getAccountMaintenance = (accountId) => {
  if (!accountId) throw new Error("accountId is required");
  return api.get(`/api/customer/customers/account/${encodeURIComponent(accountId)}/maintenance`);
};

export const createAccountMaintenance = (accountId, payload) => {
  if (!accountId) throw new Error("accountId is required");
  return api.post(
    `/api/customer/customers/account/${encodeURIComponent(accountId)}/maintenance`,
    payload
  );
};

export const updateAccountMaintenance = (accountId, payload) => {
  if (!accountId) throw new Error("accountId is required");
  return api.patch(
    `/api/customer/customers/account/${encodeURIComponent(accountId)}/maintenance`,
    payload
  );
};

export const deleteAccountMaintenance = (accountId) => {
  if (!accountId) throw new Error("accountId is required");
  return api.delete(
    `/api/customer/customers/account/${encodeURIComponent(accountId)}/maintenance`
  );
};

// ✅ Update customer (supports multipart FormData)
export const updateCustomer = async (customerId, formData) => {
  const config = { headers: { "Content-Type": "multipart/form-data" } };

  const tryRequest = async (fn) => {
    try {
      return await fn();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 || status === 405) return null;
      throw err;
    }
  };

  const attempts = [
    () =>
      api.patch(`/api/customer/customers/${customerId}/admin-edit`, formData, config),
    () => api.patch(`/api/customer/customers/${customerId}/edit`, formData, config),
    () => api.patch(`/api/customer/customers/${customerId}`, formData, config),
    () => api.put(`/api/customer/customers/${customerId}`, formData, config),
    () => api.put(`/api/customer/update/${customerId}`, formData, config),
    () => api.patch(`/api/customer/update/${customerId}`, formData, config),
    () => api.post(`/api/customer/update/${customerId}`, formData, config),
  ];

  for (const attempt of attempts) {
    const res = await tryRequest(attempt);
    if (res) return res;
  }

  throw new Error(
    "No supported customer update endpoint found (tried admin-edit/edit/customers/:id and customer/update/:id)."
  );
};
