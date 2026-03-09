import api from "../axios";

export const getCustomers = async (page = 1, limit = 10) => {
  const response = await api.get(`/api/customer/customers?page=${page}&limit=${limit}`);
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