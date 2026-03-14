import api from "../axios";

const BASE_PATH = "/api/staff/admin-staff/assigned-customers";

const buildParams = ({
  page = 1,
  limit = 10,
  search = "",
  plan = "",
  userGroupId = "",
  status = "",
  staffId = "",
} = {}) => {
  const params = {};

  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (search?.trim()) params.search = search.trim();

  const normalizedPlan = String(plan || userGroupId || "").trim();
  if (normalizedPlan) params.plan = normalizedPlan;

  if (status?.trim()) params.status = status.trim();
  if (staffId?.trim()) params.staffId = staffId.trim();

  return params;
};

// GET /api/staff/admin-staff/assigned-customers
export const getAssignedCustomers = (query = {}) => {
  return api.get(BASE_PATH, { params: buildParams(query) });
};

// GET /api/staff/admin-staff/assigned-customers/:customerId
export const getAssignedCustomerById = (customerId, query = {}) => {
  return api.get(`${BASE_PATH}/${customerId}`, { params: buildParams(query) });
};

// PUT /api/staff/admin-staff/assigned-customers/:customerId
export const updateAssignedCustomer = (customerId, payload, query = {}) => {
  return api.put(`${BASE_PATH}/${customerId}`, payload, {
    params: buildParams(query),
  });
};

// DELETE /api/staff/admin-staff/assigned-customers/:customerId
export const deleteAssignedCustomer = (customerId, query = {}) => {
  return api.delete(`${BASE_PATH}/${customerId}`, {
    params: buildParams(query),
  });
};

// Optional create path if backend supports create in same module.
export const createAssignedCustomer = (payload, query = {}) => {
  return api.post(BASE_PATH, payload, {
    params: buildParams(query),
    headers:
      payload instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
  });
};
