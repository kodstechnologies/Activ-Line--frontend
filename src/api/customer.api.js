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
