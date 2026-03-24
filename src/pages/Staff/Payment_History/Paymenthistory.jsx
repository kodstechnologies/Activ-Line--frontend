import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  X,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import {
  getAssignedPaymentHistory,
  getAssignedPaymentHistoryDetails,
} from '../../../api/staff/staffPaymentHistoryApi';

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

const toDisplayText = (value) => {
  if (value === null || value === undefined) return '--';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    return (
      value.name ||
      value.fullName ||
      value.email ||
      value.phoneNumber ||
      value._id ||
      '--'
    );
  }
  return '--';
};

const getDetailPairs = (details) => {
  if (!details || typeof details !== 'object') return [];
  const keys = ['profile Details', 'billing Details'];
  const merged = keys.flatMap((key) => (Array.isArray(details[key]) ? details[key] : []));
  return merged;
};

const BillingPage = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilter, setShowFilter] = useState(false);
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

  const resolvedProfileId = useMemo(
    () => user?.profileId || user?.ProfileId || '',
    [user]
  );

  const statusParam = useMemo(() => statusFilterToApi[filter] || '', [filter]);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const trimmedSearch = searchTerm.trim();
      const isProfileSearch = /^\d+$/.test(trimmedSearch);

      const res = await getAssignedPaymentHistory({
        page: currentPage,
        limit: itemsPerPage,
        status: statusParam,
        planName: !isProfileSearch ? trimmedSearch || undefined : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        profileId: isProfileSearch ? trimmedSearch : resolvedProfileId || undefined,
      });

      const payload = Array.isArray(res) ? { data: res } : (res || {});
      const rows =
        payload?.data ||
        payload?.payments ||
        payload?.items ||
        payload?.history ||
        [];
      setTransactions(rows);
      const meta = payload?.meta || {};
      const total = Number(meta?.total ?? payload?.total ?? payload?.totalItems ?? payload?.count ?? 0);
      const pages =
        Number(meta?.totalPages ?? payload?.totalPages ?? payload?.pages ?? 0) ||
        (itemsPerPage > 0 ? Math.ceil(total / itemsPerPage) : 0);
      setTotalItems(total);
      setTotalPages(pages);
    } catch (err) {
      setTransactions([]);
      setTotalItems(0);
      setTotalPages(0);
      setError(err?.response?.data?.message || err?.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, [
    resolvedProfileId,
    currentPage,
    itemsPerPage,
    statusParam,
    searchTerm,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, fromDate, toDate]);

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
        user: toDisplayText(tx.customer) || tx.profileId || '--',
        plan: toDisplayText(tx.planName || tx?.plan?.planName || tx?.plan),
        amount: formatAmount(tx.amount ?? tx.planAmount, tx.currency || 'INR'),
        status,
        date: formatDateTime(rawDate),
        endDate: formatDateTime(planEndDate),
        type: 'Plan Payment',
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

  const handleViewDetails = async (paymentId) => {
    if (!paymentId) return;

    try {
      setViewLoadingId(paymentId);
      const res = await getAssignedPaymentHistoryDetails(paymentId);
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
    <div className="space-y-6">
      <div className={`rounded-xl shadow-sm border flex flex-col h-full ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className={`p-6 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <div>
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment History</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Track assigned customer payments</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none min-w-[260px]">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by plan name or profile ID"
                className={`w-full border text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
            </div>
            <button
              onClick={() => setShowFilter((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={16} />
              Filters
            </button>

            {showFilter && (
              <div
                className={`absolute right-6 top-20 w-[360px] max-w-full p-5 rounded-xl shadow-2xl border z-50 ${
                  isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Filters</h4>
                  <button
                    onClick={() => setShowFilter(false)}
                    className={`p-1.5 rounded-md ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className={`w-full border text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none pr-8 cursor-pointer transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'}`}
                      >
                        <option value="All">All Transactions</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending Dues">Pending Dues</option>
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        From Date
                      </label>
                      <input
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        type="date"
                        className={`w-full border text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        To Date
                      </label>
                      <input
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        type="date"
                        className={`w-full border text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setFilter('All');
                      setSearchTerm('');
                      setFromDate('');
                      setToDate('');
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

        <div className="flex-1 flex flex-col min-h-0 p-6">
          {error && (
            <div className={`mb-4 rounded-lg px-4 py-2 text-sm border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-hidden">
            <div className={`rounded-lg border overflow-hidden h-full ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <div className="overflow-auto h-full">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`${isDark ? 'bg-slate-800/50 border-b border-slate-800' : 'bg-gray-50 border-b border-gray-200'}`}>
                      <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Payment ID</th>
                      <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Customer</th>
                      <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Plan</th>
                      <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Amount</th>
                      <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Status</th>
                      <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Date</th>
                      <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>End Date</th>
                      <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Type</th>
                      <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-200'}`}>
                    {loading ? (
                      <tr>
                        <td colSpan="9" className={`py-12 text-center ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading transactions...
                          </span>
                        </td>
                      </tr>
                    ) : uiRows.length > 0 ? (
                      uiRows.map((tx) => (
                        <tr key={tx.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50 bg-slate-900/30' : 'hover:bg-gray-50 bg-white'}`}>
                          <td className={`py-4 px-6 font-mono text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{tx.id}</td>
                          <td className={`py-4 px-6 font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{tx.user}</td>
                          <td className={`py-4 px-6 font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{tx.plan}</td>
                          <td className={`py-4 px-6 font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{tx.amount}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`text-xs font-semibold px-3 py-1 rounded-full ${tx.status === 'Paid'
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
                          <td className={`py-4 px-6 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{tx.date}</td>
                          <td className={`py-4 px-6 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{tx.endDate}</td>
                          <td className={`py-4 px-6 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{tx.type}</td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleViewDetails(tx.paymentId)}
                              disabled={viewLoadingId === tx.paymentId}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
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
                        <td colSpan="9" className={`py-12 text-center ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
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
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className={`px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>entries</span>
              </div>
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Showing <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{paginationData.startIndex}</span> to{' '}
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{paginationData.endIndex}</span> of{' '}
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{paginationData.totalItems}</span> entries
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === 1 || loading
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
                          <span className={`px-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          disabled={loading}
                          className={`min-w-[36px] px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === page
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
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${loading || currentPage === paginationData.totalPages || paginationData.totalPages === 0
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
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment Details</h3>
              <button
                onClick={closeModal}
                className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
              {selectedPayment?.error ? (
                <p className={`${isDark ? 'text-red-300' : 'text-red-700'}`}>{selectedPayment.error}</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <p><span className="font-semibold">Payment ID:</span> {selectedPayment?.paymentId || selectedPayment?._id || '--'}</p>
                    <p><span className="font-semibold">Order ID:</span> {selectedPayment?.orderId || selectedPayment?.razorpayOrderId || '--'}</p>
                    <p><span className="font-semibold">Razorpay Payment ID:</span> {selectedPayment?.razorpayPaymentId || '--'}</p>
                    <p><span className="font-semibold">Status:</span> {statusToUi[selectedPayment?.status] || selectedPayment?.status || '--'}</p>
                    <p><span className="font-semibold">Amount:</span> {formatAmount(selectedPayment?.amount ?? selectedPayment?.planAmount ?? selectedPayment?.plan?.planAmount, selectedPayment?.currency || 'INR')}</p>
                    <p><span className="font-semibold">Plan:</span> {selectedPayment?.planName || selectedPayment?.plan?.planName || '--'}</p>
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
                      <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>Plan Details</h4>
                      <div className={`rounded-lg border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                        {getDetailPairs(selectedPayment?.plan?.details || selectedPayment?.planDetails).map((item, idx) => (
                          <div
                            key={`${item?.property}-${idx}`}
                            className={`flex items-start justify-between gap-3 px-3 py-2 text-sm border-b last:border-b-0 ${isDark ? 'border-slate-700' : 'border-gray-100'}`}
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
