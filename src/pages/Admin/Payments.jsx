import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  XCircle,
  Search,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  RefreshCcw,
  CreditCard,
  Building,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Shimmer Components
const TableRowShimmer = ({ isDark, cols = 9 }) => (
  <tr className="animate-pulse">
    {[...Array(cols)].map((_, i) => (
      <td key={i} className="py-4 px-6">
        <div className={`h-4 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded`}></div>
      </td>
    ))}
  </tr>
);

const StatCardShimmer = ({ isDark }) => (
  <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"}`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className={`h-3 w-20 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded mb-2`}></div>
        <div className={`h-8 w-24 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded`}></div>
      </div>
      <div className={`w-10 h-10 rounded-full ${isDark ? "bg-slate-700" : "bg-gray-200"}`}></div>
    </div>
  </div>
);

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
  const [totals, setTotals] = useState({
    totalPaymentAmount: 0,
    pendingPaymentCount: 0,
    totalCustomerCount: 0,
  });
  const [summaryCounts, setSummaryCounts] = useState({ success: 0, pending: 0 });

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

      const fallbackTotalAmount = rows.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      const fallbackPending = rows.filter((tx) => tx.status === 'PENDING').length;
      const fallbackNotPaid = rows.filter((tx) => tx.status !== 'SUCCESS').length;
      const fallbackCustomers = new Set(rows.map((tx) => tx.customer?._id || tx.profileId)).size;

      setTotals({
        totalPaymentAmount: Number(res?.totals?.totalPaymentAmount ?? fallbackTotalAmount),
        pendingPaymentCount: Number(res?.totals?.pendingPaymentCount ?? fallbackPending),
        totalCustomerCount: Number(res?.totals?.totalCustomerCount ?? fallbackCustomers),
      });
      setSummaryCounts({
        success: Number(res?.summary?.SUCCESS ?? rows.filter((tx) => tx.status === 'SUCCESS').length),
        pending: Number(res?.summary?.PENDING ?? fallbackPending),
      });
    } catch (err) {
      setTransactions([]);
      setTotalItems(0);
      setTotalPages(0);
      setTotals({
        totalPaymentAmount: 0,
        pendingPaymentCount: 0,
        totalCustomerCount: 0,
      });
      setSummaryCounts({ success: 0, pending: 0 });
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

  // Calculate stats
  const stats = useMemo(() => {
    const totalAmount = totals.totalPaymentAmount || 0;
    const pendingCount = summaryCounts.pending || totals.pendingPaymentCount || 0;
    const successCount = summaryCounts.success || 0;
    const totalCustomerCount = totals.totalCustomerCount || 0;
    
    return {
      totalAmount,
      pendingCount,
      successCount,
      totalCustomerCount,
    };
  }, [totals, summaryCounts]);

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

  const handleRefresh = () => {
    loadTransactions();
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`relative overflow-hidden rounded-2xl border ${
          isDark 
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50" 
            : "bg-gradient-to-br from-white via-gray-50 to-white border-gray-200"
        } shadow-xl`}
      >
        <div className={`absolute inset-0 opacity-5 ${
          isDark ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gradient-to-r from-purple-500 to-indigo-500"
        }`}></div>
        
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className={`text-3xl md:text-4xl font-bold ${
                isDark ? "bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent" : "text-gray-900"
              }`}>
                Payment Transactions
              </h1>
              <p className={`text-sm mt-2 flex items-center gap-2 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                <CreditCard className="w-4 h-4" />
                Track and manage all payment activities
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by payment ID, customer, plan..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all duration-200
                    ${isDark
                      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500"
                    } focus:ring-2 focus:ring-opacity-50 ${isDark ? "focus:ring-blue-500" : "focus:ring-purple-500"}`}
                />
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm
                  ${loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
                  ${isDark
                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowFilter((prev) => !prev)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm
                    ${isDark
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>

                <AnimatePresence>
                  {showFilter && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute right-0 top-12 w-80 p-5 rounded-xl shadow-2xl border z-50 ${
                        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Filters</h4>
                        <button
                          onClick={clearFilters}
                          className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                            isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Clear All
                        </button>
                      </div>

                      <label className={`text-sm font-semibold mb-2 block ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        Status
                      </label>
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className={`w-full mb-4 p-2.5 rounded-xl border text-sm ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="All">All Transactions</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending Dues">Pending Dues</option>
                      </select>

                      <label className={`text-sm font-semibold mb-2 block ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        Franchise
                      </label>
                      <select
                        value={accountIdFilter}
                        onChange={(e) => setAccountIdFilter(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border text-sm ${
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className={`p-4 rounded-xl border ${
                  isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs uppercase tracking-wider ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                      Total Revenue
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {formatAmount(stats.totalAmount)}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl ${isDark ? "bg-emerald-500/10" : "bg-emerald-100"}`}>
                    <TrendingUp className={`w-6 h-6 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className={`p-4 rounded-xl border ${
                  isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs uppercase tracking-wider ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                      Successful Payments
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {stats.successCount}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl ${isDark ? "bg-green-500/10" : "bg-green-100"}`}>
                    <CreditCard className={`w-6 h-6 ${isDark ? "text-green-400" : "text-green-600"}`} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className={`p-4 rounded-xl border ${
                  isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs uppercase tracking-wider ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                      Pending Payments
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {stats.pendingCount}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl ${isDark ? "bg-yellow-500/10" : "bg-yellow-100"}`}>
                    <Clock className={`w-6 h-6 ${isDark ? "text-yellow-400" : "text-yellow-600"}`} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className={`p-4 rounded-xl border ${
                  isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs uppercase tracking-wider ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                      Total Customers
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {stats.totalCustomerCount}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl ${isDark ? "bg-blue-500/10" : "bg-blue-100"}`}>
                    <Users className={`w-6 h-6 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`rounded-2xl border overflow-hidden shadow-lg ${
          isDark ? "bg-slate-900 border-slate-800/50" : "bg-white border-gray-200"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className={`${isDark ? "bg-slate-800/80" : "bg-gradient-to-r from-gray-50 to-gray-100"}`}>
              <tr>
                {["Payment ID", "Customer", "Plan", "Amount", "Status", "Date", "End Date", "Franchise", "Action"].map((label) => (
                  <th key={label} className="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-gray-100"}`}>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRowShimmer key={i} isDark={isDark} cols={9} />
                ))
              ) : uiRows.length > 0 ? (
                uiRows.map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ backgroundColor: isDark ? "rgba(51, 65, 85, 0.4)" : "rgba(243, 244, 246, 0.6)" }}
                    className="transition-colors duration-200"
                  >
                    <td className={`py-4 px-6 font-mono text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                      {tx.id.slice(-12)}
                    </td>
                    <td className={`py-4 px-6 font-medium text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isDark ? "bg-slate-700" : "bg-gray-100"
                        }`}>
                          <span className="text-xs font-medium">{tx.user.charAt(0).toUpperCase()}</span>
                        </div>
                        <span>{tx.user}</span>
                      </div>
                    </td>
                    <td className={`py-4 px-6 text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}>{tx.plan}</td>
                    <td className={`py-4 px-6 font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{tx.amount}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'Paid'
                          ? isDark
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-green-50 text-green-700 border border-green-200'
                          : tx.status === 'Failed'
                            ? isDark
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-red-50 text-red-700 border border-red-200'
                            : isDark
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          tx.status === 'Paid' ? 'bg-green-500' : tx.status === 'Failed' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></span>
                        {tx.status}
                      </span>
                    </td>
                    <td className={`py-4 px-6 text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {tx.date}
                      </div>
                    </td>
                    <td className={`py-4 px-6 text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>{tx.endDate}</td>
                    <td className={`py-4 px-6 text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {tx.franchise}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDetails(tx.paymentId)}
                        disabled={viewLoadingId === tx.paymentId}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isDark
                            ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                        }`}
                      >
                        {viewLoadingId === tx.paymentId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                        View
                      </motion.button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <CreditCard className={`w-16 h-16 ${isDark ? "text-slate-600" : "text-gray-400"}`} />
                      <p className={`text-lg font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                        No transactions found
                      </p>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                        Try adjusting your filters or search term
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 0 && (
          <div className={`p-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${
            isDark ? "border-slate-800 bg-slate-900/50" : "border-gray-200 bg-gray-50"
          }`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border text-sm outline-none ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300"
                  }`}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>entries</span>
              </div>
              <span className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                Showing {paginationData.startIndex} to {paginationData.endIndex} of {paginationData.totalItems} entries
              </span>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className={`p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark 
                    ? "border-slate-700 hover:bg-slate-800 text-slate-300" 
                    : "border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <motion.button
                      key={pageNum}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-9 h-9 rounded-lg transition-all text-sm ${
                        currentPage === pageNum
                          ? isDark
                            ? "bg-slate-700 text-white"
                            : "bg-gray-900 text-white"
                          : isDark
                            ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={loading || currentPage === totalPages || totalPages === 0}
                className={`p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark 
                    ? "border-slate-700 hover:bg-slate-800 text-slate-300" 
                    : "border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      {/* View Modal */}
      <AnimatePresence>
        {isViewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl ${
                isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'
              }`}
            >
              <div className={`flex items-center justify-between px-6 py-5 border-b ${
                isDark ? 'border-slate-800' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>
                    <CreditCard className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-purple-600"}`} />
                  </div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Payment Details
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal}
                  className={`p-1 rounded-full transition ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  <XCircle className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                {selectedPayment?.error ? (
                  <p className={`text-base ${isDark ? 'text-red-300' : 'text-red-700'}`}>{selectedPayment.error}</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}>
                        <p className={`text-xs uppercase mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>Payment ID</p>
                        <p className={`font-mono text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                          {selectedPayment?.paymentId || selectedPayment?._id || '--'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}>
                        <p className={`text-xs uppercase mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>Order ID</p>
                        <p className={`font-mono text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                          {selectedPayment?.orderId || selectedPayment?.razorpayOrderId || '--'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}>
                        <p className={`text-xs uppercase mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>Amount</p>
                        <p className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                          {formatAmount(selectedPayment?.amount ?? selectedPayment?.planAmount)}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}>
                        <p className={`text-xs uppercase mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>Status</p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          selectedPayment?.status === 'SUCCESS'
                            ? isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'
                            : selectedPayment?.status === 'PENDING'
                              ? isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-700'
                              : isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                        }`}>
                          {statusToUi[selectedPayment?.status] || selectedPayment?.status || '--'}
                        </span>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}>
                      <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                        <Users className="w-4 h-4" />
                        Customer Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <p><span className="font-medium">Name:</span> {getCustomerName(selectedPayment?.customer, '--')}</p>
                        <p><span className="font-medium">Email:</span> {selectedPayment?.customer?.email || '--'}</p>
                        <p><span className="font-medium">Phone:</span> {selectedPayment?.customer?.phoneNumber || '--'}</p>
                      </div>
                    </div>

                    {getDetailPairs(selectedPayment?.plan?.details || selectedPayment?.planDetails).length > 0 && (
                      <div className={`p-4 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}>
                        <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                          <DollarSign className="w-4 h-4" />
                          Plan Details
                        </h4>
                        <div className="space-y-2">
                          {getDetailPairs(selectedPayment?.plan?.details || selectedPayment?.planDetails).map((item, idx) => (
                            <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                              <span className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                                {item?.property || '--'}
                              </span>
                              <span className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                                {String(item?.value ?? '--')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BillingPage;
