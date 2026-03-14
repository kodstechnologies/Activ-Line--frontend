// api/frenchise/customer.js

import api from "../axios";

export const getCustomers = async (page = 1, limit = 10, filters = {}) => {
  const params = new URLSearchParams({
    page,
    limit
  });
  
  // Add filters if they exist
  if (filters.search) {
    params.append('search', filters.search);
  }
  
  if (filters.plan) {
    params.append('plan', filters.plan);
  }
  
  if (filters.status) {
    params.append('status', filters.status);
  }
  
  const response = await api.get(`/api/customer/customers?${params.toString()}`);
  return response.data;
};

export const editCustomer = async (customerId, payload) => {
  const response = await api.patch(
    `/api/customer/customers/${customerId}/franchise-edit`,
    payload
  );
  return response.data;
};

export const deleteCustomer = async (customerId) => {
  const res = await api.delete(
    `/api/customer/customers/${customerId}/franchise-delete`
  );
  return res.data;
};