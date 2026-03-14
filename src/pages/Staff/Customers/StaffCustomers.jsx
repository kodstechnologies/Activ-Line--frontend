import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import Lottie from "lottie-react";
import fadeSlideAnimation from "../../../animations/Profile Avatar of Young Boy.json";
import {
  getAssignedCustomers,
} from '../../../api/staff/assigdcustomer.api';

// ── Reusable Form Field ──────────────────────────────────────────
const Field = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

const inputCls = (isDark) =>
  `w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
    isDark
      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

// ── Empty Form Defaults ──────────────────────────────────────────
const emptyCustomer = {
  userGroupId: '',
  accountId: '',
  userName: '',
  password: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  emailId: '',
  userType: 'business',
  activationDate: 'now',
  customActivationDate: '',
  customExpirationDate: '',
  installation_address_line2: '',
  installation_address_city: '',
  installation_address_pin: '',
  installation_address_state: '',
  installation_address_country: 'IN',
  caf_num: '',
  createBilling: true,
  notifyUserSms: true,
};

const emptyFiles = {
  idFile: null,
  addressFile: null,
  cafFile: null,
  reportFile: null,
  signFile: null,
  profilePicFile: null,
};

// ── Customer Form Modal ──────────────────────────────────────────
const CustomerFormModal = ({
  isDark,
  title,
  formData,
  setFormData,
  files,
  setFiles,
  onSubmit,
  onClose,
  submitLabel = 'Save',
  showStatus = false,
}) => {
  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFile = (e) => {
    const { name, files: fl } = e.target;
    if (fl?.length > 0) setFiles((prev) => ({ ...prev, [name]: fl[0] }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-gray-200'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
          }`}
        >
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <section>
            <h4 className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Basic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name">
                <input name="firstName" value={formData.firstName} onChange={handleInput} className={inputCls(isDark)} placeholder="John" />
              </Field>
              <Field label="Last Name">
                <input name="lastName" value={formData.lastName} onChange={handleInput} className={inputCls(isDark)} placeholder="Doe" />
              </Field>
              <Field label="Username">
                <input name="userName" value={formData.userName} onChange={handleInput} className={inputCls(isDark)} placeholder="johndoe" />
              </Field>
              {!showStatus && (
                <Field label="Password">
                  <input type="password" name="password" value={formData.password} onChange={handleInput} className={inputCls(isDark)} placeholder="••••••••" />
                </Field>
              )}
              <Field label="Email">
                <input type="email" name="emailId" value={formData.emailId} onChange={handleInput} className={inputCls(isDark)} placeholder="john@example.com" />
              </Field>
              <Field label="Phone Number">
                <input name="phoneNumber" value={formData.phoneNumber} onChange={handleInput} className={inputCls(isDark)} placeholder="+91 9876543210" />
              </Field>
              <Field label="User Group ID">
                <input name="userGroupId" value={formData.userGroupId} onChange={handleInput} className={inputCls(isDark)} placeholder="Group ID" />
              </Field>
              <Field label="Account ID">
                <input name="accountId" value={formData.accountId} onChange={handleInput} className={inputCls(isDark)} placeholder="Account ID" />
              </Field>
              <Field label="User Type">
                <select name="userType" value={formData.userType} onChange={handleInput} className={inputCls(isDark)}>
                  <option value="business">Business</option>
                  <option value="home">Home</option>
                </select>
              </Field>
              {showStatus && (
                <Field label="Status">
                  <select name="status" value={formData.status || 'ACTIVE'} onChange={handleInput} className={inputCls(isDark)}>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </Field>
              )}
              <Field label="CAF Number">
                <input name="caf_num" value={formData.caf_num} onChange={handleInput} className={inputCls(isDark)} placeholder="CAF Number" />
              </Field>
            </div>
          </section>

          {/* Activation */}
          <section>
            <h4 className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Activation</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Activation Date">
                <select name="activationDate" value={formData.activationDate} onChange={handleInput} className={inputCls(isDark)}>
                  <option value="now">Now</option>
                  <option value="custom">Custom</option>
                </select>
              </Field>
              {formData.activationDate === 'custom' && (
                <Field label="Custom Activation">
                  <input type="datetime-local" name="customActivationDate" value={formData.customActivationDate} onChange={handleInput} className={inputCls(isDark)} />
                </Field>
              )}
              <Field label="Expiration Date">
                <input type="datetime-local" name="customExpirationDate" value={formData.customExpirationDate} onChange={handleInput} className={inputCls(isDark)} />
              </Field>
            </div>
          </section>

          {/* Address */}
          <section>
            <h4 className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Installation Address
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Address Line 2" className="sm:col-span-2">
                <input name="installation_address_line2" value={formData.installation_address_line2} onChange={handleInput} className={inputCls(isDark)} placeholder="Street / Area" />
              </Field>
              <Field label="City">
                <input name="installation_address_city" value={formData.installation_address_city} onChange={handleInput} className={inputCls(isDark)} placeholder="City" />
              </Field>
              <Field label="PIN Code">
                <input name="installation_address_pin" value={formData.installation_address_pin} onChange={handleInput} className={inputCls(isDark)} placeholder="PIN" />
              </Field>
              <Field label="State">
                <input name="installation_address_state" value={formData.installation_address_state} onChange={handleInput} className={inputCls(isDark)} placeholder="State" />
              </Field>
              <Field label="Country">
                <input name="installation_address_country" value={formData.installation_address_country} onChange={handleInput} className={inputCls(isDark)} placeholder="IN" />
              </Field>
            </div>
          </section>

          {/* Documents */}
          <section>
            <h4 className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Documents</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'idFile', label: 'ID Proof' },
                { name: 'addressFile', label: 'Address Proof' },
                { name: 'cafFile', label: 'CAF File' },
                { name: 'reportFile', label: 'Report File' },
                { name: 'signFile', label: 'Signature' },
                { name: 'profilePicFile', label: 'Profile Picture' },
              ].map(({ name, label }) => (
                <Field key={name} label={label}>
                  <input
                    type="file"
                    name={name}
                    onChange={handleFile}
                    className={`w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium cursor-pointer ${
                      isDark
                        ? 'text-slate-400 file:bg-slate-700 file:text-slate-300'
                        : 'text-gray-500 file:bg-gray-100 file:text-gray-700'
                    }`}
                  />
                  {files[name] && (
                    <p className="text-xs text-green-500 mt-1">{files[name].name}</p>
                  )}
                </Field>
              ))}
            </div>
          </section>

          {/* Toggles */}
          <section className="flex flex-wrap gap-6">
            {[
              { name: 'createBilling', label: 'Create Billing' },
              { name: 'notifyUserSms', label: 'Notify via SMS' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name={name}
                  checked={!!formData[name]}
                  onChange={handleInput}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{label}</span>
              </label>
            ))}
          </section>
        </div>

        {/* Footer */}
        <div
          className={`sticky bottom-0 flex justify-end gap-3 px-6 py-4 border-t ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-lg text-sm font-medium border ${
              isDark
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────
const StaffCustomer = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // ── Helpers ────────────────────────────────────────────────────
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})\s(\d{2}):(\d{2})$/);
    if (match) return `${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}`;
    return dateStr;
  };

  // ── API ────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async (page = currentPage, limit = itemsPerPage) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: searchTerm.trim() || undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        plan: selectedPlan !== 'All' ? selectedPlan : undefined,
      };

      const res = await getAssignedCustomers(params);
      const payload = res.data ?? {};
      const customers = payload.data ?? [];
      const pagination = payload.pagination ?? payload.meta?.pagination ?? payload.meta ?? {};

      setTotalItems(Number(pagination.total ?? pagination.totalItems ?? customers.length ?? 0));
      setTotalPages(Math.max(1, Number(pagination.totalPages ?? pagination.pages ?? 1)));

      setSubscribers(
        customers.map((c) => ({
          ...c,
          _id: c._id,
          id: c._id || c.activlineUserId,
          name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed',
          mobile: c.phoneNumber,
          email: c.emailId,
          location: c.installationAddress?.city || c.address?.city || 'N/A',
          plan: c.userType || 'N/A',
          tech: 'Fiber',
          status: (c.status || 'ACTIVE').toUpperCase(),
        }))
      );
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      alert('Could not load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedStatus, selectedPlan, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ── Pagination ─────────────────────────────────────────────────
  const paginationInfo = useMemo(() => ({
    start: totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1,
    end: Math.min(currentPage * itemsPerPage, totalItems),
  }), [currentPage, itemsPerPage, totalItems]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Status badge ───────────────────────────────────────────────
  const statusBadge = (status) => {
    if (status === 'ACTIVE')
      return isDark
        ? 'bg-green-900/30 text-green-400 border-green-700/40'
        : 'bg-green-100 text-green-800 border-green-200';
    if (status === 'SUSPENDED')
      return isDark
        ? 'bg-red-900/30 text-red-400 border-red-700/40'
        : 'bg-red-100 text-red-800 border-red-200';
    return isDark
      ? 'bg-slate-800 text-slate-300 border-slate-700'
      : 'bg-gray-100 text-gray-600 border-gray-300';
  };

  return (
    <div
      className={`rounded-xl shadow-sm border flex flex-col h-full ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
      }`}
    >
      {/* ── Header ── */}
      <div
        className={`p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative ${
          isDark ? 'border-slate-800' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-20 h-16">
            <Lottie animationData={fadeSlideAnimation} loop />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Customers</h2>
            <p className={`text-base ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Manage users & activations
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:flex-none min-w-[240px]">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDark ? 'text-slate-400' : 'text-gray-400'
              }`}
            />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} /> Filter
          </button>

          {/* Filter panel */}
          {showFilter && (
            <div
              className={`absolute right-6 top-20 w-80 p-5 rounded-xl shadow-2xl border z-50 ${
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
              }`}
            >
              <h4 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Filters</h4>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Plan
                  </label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => { setSelectedPlan(e.target.value); setCurrentPage(1); }}
                    className={`w-full p-2.5 border rounded-lg ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="All">All Plans</option>
                    <option value="business">Business</option>
                    <option value="home">Home</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                    className={`w-full p-2.5 border rounded-lg ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="All">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlan('All');
                    setSelectedStatus('All');
                    setSearchTerm('');
                    setCurrentPage(1);
                    setShowFilter(false);
                  }}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 flex flex-col min-h-0 p-6">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>Loading customers...</p>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`rounded-lg border overflow-hidden flex-1 ${
                isDark ? 'border-slate-800' : 'border-gray-200'
              }`}
            >
              <div className="overflow-x-auto h-full">
                <table className="w-full text-left min-w-max">
                  <thead>
                    <tr
                      className={`${
                        isDark
                          ? 'bg-slate-800/60 border-b border-slate-700'
                          : 'bg-gray-50 border-b border-gray-200'
                      }`}
                    >
                      {['Customer', 'Contact', 'Plan', 'Status', 'Actions'].map((h) => (
                        <th
                          key={h}
                          className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                            h === 'Actions' ? 'text-right' : ''
                          } ${isDark ? 'text-slate-400' : 'text-gray-600'}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-200'}`}>
                    {subscribers.length > 0 ? (
                      subscribers.map((sub) => (
                        <tr
                          key={sub._id}
                          className={`group ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center font-semibold text-blue-500 flex-shrink-0 ${
                                  isDark ? 'ring-1 ring-blue-500/30' : 'ring-1 ring-blue-200'
                                }`}
                              >
                                {sub.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {sub.name}
                                </div>
                                <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                  {sub.id?.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                              {sub.mobile || '—'}
                            </div>
                            <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                              {sub.email || '—'}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                              {sub.plan}
                            </div>
                            <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                              {sub.tech}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusBadge(
                                sub.status
                              )}`}
                            >
                              {sub.status === 'ACTIVE' && (
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                              )}
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => navigate(`/staff-customer/${sub._id}`)}
                                className={`p-2 rounded-lg ${
                                  isDark
                                    ? 'hover:bg-slate-800 text-slate-400 hover:text-blue-400'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-blue-600'
                                }`}
                                title="View details"
                              >
                                <Eye size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className={`py-16 text-center text-base ${isDark ? 'text-slate-400' : 'text-gray-500'}`}
                        >
                          No customers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
              <div
                className={`mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t ${
                  isDark ? 'border-slate-800' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4 text-sm">
                  <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className={`px-3 py-1.5 border rounded-md text-sm ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    {[5, 10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>entries</span>
                  <div className={`ml-6 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                    Showing <span className="font-semibold">{paginationInfo.start}</span> to{' '}
                    <span className="font-semibold">{paginationInfo.end}</span> of{' '}
                    <span className="font-semibold">{totalItems}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''} ${
                      isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
                    }`}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .map((page, idx, arr) => {
                      const showEllipsis = idx > 0 && arr[idx - 1] !== page - 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className={`px-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium min-w-[36px] ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : isDark
                                ? 'text-slate-300 hover:bg-slate-800'
                                : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${
                      currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                    } ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Add Modal ── */}
    </div>
  );
};

export default StaffCustomer;
