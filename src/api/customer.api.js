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
  return api.post(`/api/customer/create`, formData);
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
