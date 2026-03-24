import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  getAllCustomersPaymentHistory,
  getFranchiseList,
  getPaymentHistoryDetails,
} from '../../api/paymnethistoyapi';

const statusFilterToApi = {
  All: '',
  Paid: 'SUCCESS',
  'Pending Dues': 'PENDING',
};

const statusToUi = {
  SUCCESS: 'Paid',
  PENDING: 'Pending',
  FAILED: 'Failed',
};

const formatAmount = (value, currency = 'INR') => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isNaN(amount) ? 0 : amount);
};

const formatDateTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const addDays = (value, days) => {
  if (!value || !Number.isFinite(Number(days))) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days));
  return next;
};

const getDetailPairs = (details) => {
  if (!details || typeof details !== 'object') return [];
  const keys = ['profile Details', 'billing Details'];
  const merged = keys.flatMap((key) => (Array.isArray(details[key]) ? details[key] : []));
  return merged;
};

const getCustomerName = (customer, fallback) => {
  if (customer && typeof customer === 'object') {
    return (
      customer.name ||
      customer.userName ||
      customer.username ||
      customer.email ||
      customer.phoneNumber ||
      fallback ||
      '--'
    );
  }
  return fallback || '--';
};

const BillingPage = () => {
  const { isDark } = useTheme();

  const [filter, setFilter] = useState('All');
  const [accountIdFilter, setAccountIdFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [franchiseOptions, setFranchiseOptions] = useState([]);
  const [franchiseError, setFranchiseError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [transactions, setTransactions] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [viewLoadingId, setViewLoadingId] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const statusParam = useMemo(() => statusFilterToApi[filter] || '', [filter]);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getAllCustomersPaymentHistory({
        page: currentPage,
        limit: itemsPerPage,
        status: statusParam,
        accountId: accountIdFilter.trim() || undefined,
        search: debouncedSearch.trim() || undefined,
      });

      const rows = Array.isArray(res?.data) ? res.data : [];
      setTransactions(rows);
      setTotalItems(Number(res?.total || 0));
      setTotalPages(Number(res?.totalPages || 0));
    } catch (err) {
      setTransactions([]);
      setTotalItems(0);
      setTotalPages(0);
      setError(err?.response?.data?.message || err?.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusParam, accountIdFilter, debouncedSearch]);

  const loadFranchises = useCallback(async () => {
    try {
      setFranchiseError('');
      const res = await getFranchiseList();
      const rows = Array.isArray(res?.data) ? res.data : [];
      setFranchiseOptions(rows);
    } catch (err) {
      setFranchiseOptions([]);
      setFranchiseError(err?.response?.data?.message || err?.message || 'Failed to load franchises');
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    loadFranchises();
  }, [loadFranchises]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, accountIdFilter]);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const paginationData = useMemo(() => {
    const safeTotalItems = totalItems;
    const safeCurrentPage = currentPage;
    const safeItemsPerPage = itemsPerPage;
    const startIndex = safeTotalItems === 0 ? 0 : (safeCurrentPage - 1) * safeItemsPerPage + 1;
    const endIndex = safeTotalItems === 0 ? 0 : Math.min(safeCurrentPage * safeItemsPerPage, safeTotalItems);

    return {
      paginatedTransactions: transactions,
      totalPages,
      totalItems: safeTotalItems,
      startIndex,
      endIndex,
    };
  }, [transactions, totalPages, totalItems, currentPage, itemsPerPage]);

  const uiRows = useMemo(() => {
    return paginationData.paginatedTransactions.map((tx) => {
      const status = statusToUi[tx.status] || tx.status || 'Pending';
      const rawDate = tx.paidAt || tx.createdAt;
      const planEndDate = tx.planEndDate || tx?.plan?.planEndDate || addDays(rawDate, tx.planPeriodDays || tx?.plan?.planPeriodDays);

        return {
          id: tx.paymentId || tx._id || '--',
          user: getCustomerName(tx.customer, tx.userName || tx.profileId || '--'),
          plan: tx.planName || tx?.plan?.planName || '--',
          amount: formatAmount(tx.amount ?? tx.planAmount, tx.currency || 'INR'),
          status,
          date: formatDateTime(rawDate),
          endDate: formatDateTime(planEndDate),
          franchise: tx.accountId || tx.groupId || '--',
          paymentId: tx.paymentId || tx._id,
        };
      });
  }, [paginationData.paginatedTransactions]);

  const handlePageChange = (page) => {
    if (page < 1 || (paginationData.totalPages > 0 && page > paginationData.totalPages)) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilter('All');
    setAccountIdFilter('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleViewDetails = async (paymentId) => {
    if (!paymentId) return;

    try {
      setViewLoadingId(paymentId);
      const res = await getPaymentHistoryDetails(paymentId);
      const details = res?.data || res?.payment || res;
      setSelectedPayment(details || null);
      setIsViewModalOpen(true);
    } catch (err) {
      setSelectedPayment({
        error: err?.response?.data?.message || err?.message || 'Failed to load payment details',
      });
      setIsViewModalOpen(true);
    } finally {
      setViewLoadingId('');
    }
  };

  const closeModal = () => {
    setIsViewModalOpen(false);
    setSelectedPayment(null);
  };

  return (
    <div className="space-y-6 text-[15px]">
      <div className={`rounded-xl shadow-sm border flex flex-col h-full ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className={`p-6 border-b flex flex-col gap-4 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between gap-3">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Transactions</h1>
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full pl-3 pr-3 py-2 border rounded-lg text-base outline-none
                  focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
              <div className="relative">
              <button
                onClick={() => setShowFilter((prev) => !prev)}
                className={`flex items-center justify-center px-3 py-2 border rounded-lg whitespace-nowrap text-base ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>

              {showFilter && (
                <div className={`absolute right-0 top-12 w-80 p-4 rounded-xl shadow-2xl border z-50 animate-in fade-in zoom-in duration-150 ${
                  isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Filters</h4>
                    <button
                      onClick={clearFilters}
                      className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      Clear
                    </button>
                  </div>

                  <label className={`text-base font-semibold ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Status</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className={`w-full mt-1 mb-3 p-2 border rounded-lg text-base ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="All">All Transactions</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending Dues">Pending Dues</option>
                  </select>

                  <label className={`text-base font-semibold ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Franchise</label>
                  <select
                    value={accountIdFilter}
                    onChange={(e) => setAccountIdFilter(e.target.value)}
                    className={`w-full mt-1 p-2 border rounded-lg text-base ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">All Franchises</option>
                    {franchiseOptions.map((franchise) => (
                      <option key={franchise._id || franchise.accountId} value={franchise.accountId || ''}>
                        {franchise.accountName || franchise.companyName || franchise.accountId || 'Unknown'}
                      </option>
                    ))}
                  </select>

                  {franchiseError && (
                    <div className={`mt-3 text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                      {franchiseError}
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 p-6">
          {error && (
            <div className={`mb-4 rounded-lg px-4 py-2 text-base border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-hidden">
            <div className={`rounded-lg border overflow-hidden h-full ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <div className="overflow-auto h-full">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`${isDark ? 'bg-slate-800/50 border-b border-slate-800' : 'bg-gray-50 border-b border-gray-200'}`}>
                      <th className={`py-4 px-6 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Payment ID</th>
                      <th className={`py-4 px-6 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Customer</th>
                      <th className={`py-4 px-6 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Plan</th>
                      <th className={`py-4 px-6 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Amount</th>
                      <th className={`py-4 px-6 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Status</th>
                      <th className={`py-4 px-6 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Date</th>
                      <th className={`py-4 px-6 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>End Date</th>
                      <th className={`py-4 px-6 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Franchise</th>
                      <th className={`py-4 px-6 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-200'}`}>
                    {loading ? (
                      <tr>
                        <td colSpan="9" className={`py-12 text-center text-base ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading transactions...
                          </span>
                        </td>
                      </tr>
                    ) : uiRows.length > 0 ? (
                      uiRows.map((tx) => (
                        <tr key={tx.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50 bg-slate-900/30' : 'hover:bg-gray-50 bg-white'}`}>
                          <td className={`py-4 px-6 font-mono text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{tx.id}</td>
                          <td className={`py-4 px-6 font-medium text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{tx.user}</td>
                          <td className={`py-4 px-6 font-medium text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{tx.plan}</td>
                          <td className={`py-4 px-6 font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{tx.amount}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`text-sm font-semibold px-3 py-1 rounded-full ${tx.status === 'Paid'
                                ? isDark
                                  ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                                  : 'bg-green-50 text-green-700 border border-green-200'
                                : tx.status === 'Failed'
                                  ? isDark
                                    ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                  : isDark
                                    ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20'
                                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                }`}
                            >
                              {tx.status === 'Paid' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 inline-block"></span>}
                              {tx.status}
                            </span>
                          </td>
                          <td className={`py-4 px-6 text-base ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{tx.date}</td>
                          <td className={`py-4 px-6 text-base ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{tx.endDate}</td>
                          <td className={`py-4 px-6 text-base ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{tx.franchise}</td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleViewDetails(tx.paymentId)}
                              disabled={viewLoadingId === tx.paymentId}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                isDark
                                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                              }`}
                            >
                              {viewLoadingId === tx.paymentId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className={`py-12 text-center text-base ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          No transactions found matching your filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className={`mt-6 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`text-base ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className={`px-3 py-1.5 border rounded-lg text-base outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className={`text-base ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>entries</span>
              </div>
              <div className={`text-base ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Showing <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{paginationData.startIndex}</span> to{' '}
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{paginationData.endIndex}</span> of{' '}
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{paginationData.totalItems}</span> entries
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className={`px-3 py-2 rounded-lg text-base font-medium transition-all ${currentPage === 1 || loading
                  ? isDark
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (page === 1 || page === paginationData.totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <span className={`px-2 text-base ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          disabled={loading}
                          className={`min-w-[36px] px-3 py-2 rounded-lg text-base font-medium transition-all ${currentPage === page
                            ? 'bg-blue-600 text-white'
                            : isDark
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={loading || currentPage === paginationData.totalPages || paginationData.totalPages === 0}
                className={`px-3 py-2 rounded-lg text-base font-medium transition-all ${loading || currentPage === paginationData.totalPages || paginationData.totalPages === 0
                  ? isDark
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeModal}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl rounded-xl border shadow-xl ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
          >
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment Details</h3>
              <button
                onClick={closeModal}
                className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
              {selectedPayment?.error ? (
                <p className={`text-base ${isDark ? 'text-red-300' : 'text-red-700'}`}>{selectedPayment.error}</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-base">
                    <p><span className="font-semibold">Payment ID:</span> {selectedPayment?.paymentId || selectedPayment?._id || '--'}</p>
                    <p><span className="font-semibold">Order ID:</span> {selectedPayment?.orderId || selectedPayment?.razorpayOrderId || '--'}</p>
                    <p><span className="font-semibold">Razorpay Payment ID:</span> {selectedPayment?.razorpayPaymentId || '--'}</p>
                    <p><span className="font-semibold">Status:</span> {statusToUi[selectedPayment?.status] || selectedPayment?.status || '--'}</p>
                    <p><span className="font-semibold">Amount:</span> {formatAmount(selectedPayment?.amount ?? selectedPayment?.planAmount ?? selectedPayment?.plan?.planAmount, selectedPayment?.currency || 'INR')}</p>
                    <p><span className="font-semibold">Plan:</span> {selectedPayment?.planName || selectedPayment?.plan?.planName || '--'}</p>
                    <p><span className="font-semibold">Customer Name:</span> {getCustomerName(selectedPayment?.customer, '--')}</p>
                    <p><span className="font-semibold">Customer Email:</span> {selectedPayment?.customer?.email || '--'}</p>
                    <p><span className="font-semibold">Customer Phone:</span> {selectedPayment?.customer?.phoneNumber || '--'}</p>
                    <p><span className="font-semibold">Profile ID:</span> {selectedPayment?.profileId || selectedPayment?.plan?.profileId || '--'}</p>
                    <p><span className="font-semibold">Group ID:</span> {selectedPayment?.groupId || '--'}</p>
                    <p><span className="font-semibold">Account ID:</span> {selectedPayment?.accountId || '--'}</p>
                    <p><span className="font-semibold">Paid At:</span> {formatDateTime(selectedPayment?.paidAt)}</p>
                    <p>
                      <span className="font-semibold">Plan End Date:</span>{' '}
                      {formatDateTime(
                        selectedPayment?.planEndDate ||
                          selectedPayment?.plan?.planEndDate ||
                          addDays(
                            selectedPayment?.paidAt || selectedPayment?.createdAt,
                            selectedPayment?.planPeriodDays || selectedPayment?.plan?.planPeriodDays
                          )
                      )}
                    </p>
                    <p><span className="font-semibold">Created At:</span> {formatDateTime(selectedPayment?.createdAt)}</p>
                    <p><span className="font-semibold">Updated At:</span> {formatDateTime(selectedPayment?.updatedAt)}</p>
                  </div>

                  {getDetailPairs(selectedPayment?.plan?.details || selectedPayment?.planDetails).length > 0 && (
                    <div>
                      <h4 className={`text-base font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>Plan Details</h4>
                      <div className={`rounded-lg border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                        {getDetailPairs(selectedPayment?.plan?.details || selectedPayment?.planDetails).map((item, idx) => (
                          <div
                            key={`${item?.property}-${idx}`}
                            className={`flex items-start justify-between gap-3 px-3 py-2 text-base border-b last:border-b-0 ${isDark ? 'border-slate-700' : 'border-gray-100'}`}
                          >
                            <span className={`${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{item?.property || '--'}</span>
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{String(item?.value ?? '--')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
