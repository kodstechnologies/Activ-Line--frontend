import React, { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Search,
  Filter,
  XCircle,
  Calendar,
  User,
  CreditCard,
  DollarSign,
  CheckCircle,
  XCircle as XCircleIcon,
  Clock,
  TrendingUp,
  Download,
  RefreshCw,
  CheckSquare,
  Square,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  getFranchisePaymentHistoryByAccount,
  getFranchisePaymentHistoryDetails,
  downloadPaymentHistoryExcel,
} from "../../api/frenchise/paymanehistypapi";


const statusConfig = {
  SUCCESS: {
    label: "Paid",
    icon: CheckCircle,
    color: "green",
    bgLight: "bg-green-50",
    bgDark: "bg-green-500/10",
    textLight: "text-green-700",
    textDark: "text-green-400",
    borderLight: "border-green-200",
    borderDark: "border-green-500/20",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "yellow",
    bgLight: "bg-yellow-50",
    bgDark: "bg-yellow-500/10",
    textLight: "text-yellow-700",
    textDark: "text-yellow-400",
    borderLight: "border-yellow-200",
    borderDark: "border-yellow-500/20",
  },
  FAILED: {
    label: "Failed",
    icon: XCircleIcon,
    color: "red",
    bgLight: "bg-red-50",
    bgDark: "bg-red-500/10",
    textLight: "text-red-700",
    textDark: "text-red-400",
    borderLight: "border-red-200",
    borderDark: "border-red-500/20",
  },
};

const formatAmount = (value, currency = "INR") => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isNaN(amount) ? 0 : amount);
};

const formatDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  if (!details || typeof details !== "object") return [];
  const keys = ["profile Details", "billing Details"];
  const merged = keys.flatMap((key) =>
    Array.isArray(details[key]) ? details[key] : [],
  );
  return merged;
};

const StatCard = ({ icon: Icon, label, value, isDark }) => (
  <div
    className={`rounded-xl border p-4 transition-all hover:shadow-md ${
      isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p
          className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-slate-400" : "text-gray-500"}`}
        >
          {label}
        </p>
        <p
          className={`mt-1 text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {value}
        </p>
      </div>
      <div
        className={`rounded-lg p-2 ${isDark ? "bg-slate-700" : "bg-gray-100"}`}
      >
        <Icon
          className={`w-5 h-5 ${isDark ? "text-slate-300" : "text-gray-600"}`}
        />
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status, isDark }) => {
  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
        isDark ? config.bgDark : config.bgLight
      } ${isDark ? config.textDark : config.textLight} border ${
        isDark ? config.borderDark : config.borderLight
      }`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const BillingPage = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const [viewLoadingId, setViewLoadingId] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);


  const resolvedAccountId = useMemo(
    () => user?.accountId || user?.AccountId || "",
    [user],
  );
  const resolvedProfileId = useMemo(
    () => user?.profileId || user?.ProfileId || "",
    [user],
  );

  const loadTransactions = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        setError("");

        if (!resolvedAccountId) {
          throw new Error(
            "Account ID is required for franchise payment history",
          );
        }

        const res = await getFranchisePaymentHistoryByAccount({
          accountId: resolvedAccountId,
          page: currentPage,
          limit: itemsPerPage,
          profileId: resolvedProfileId || undefined,
        });

        const rows = Array.isArray(res?.data) ? res.data : [];
        setTransactions(rows);
        setTotalItems(Number(res?.total || 0));
        setTotalPages(Number(res?.totalPages || 0));

        // Calculate total amount
        const total = rows.reduce(
          (sum, tx) => sum + (Number(tx.amount) || 0),
          0,
        );
        setTotalAmount(total);
      } catch (err) {
        setTransactions([]);
        setTotalItems(0);
        setTotalPages(0);
        setTotalAmount(0);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load payment history",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [resolvedAccountId, currentPage, itemsPerPage, resolvedProfileId],
  );

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, []);

  const paginationData = useMemo(() => {
    const safeTotalItems = totalItems;
    const safeCurrentPage = currentPage;
    const safeItemsPerPage = itemsPerPage;
    const startIndex =
      safeTotalItems === 0 ? 0 : (safeCurrentPage - 1) * safeItemsPerPage + 1;
    const endIndex =
      safeTotalItems === 0
        ? 0
        : Math.min(safeCurrentPage * safeItemsPerPage, safeTotalItems);

    return {
      paginatedTransactions: transactions,
      totalPages,
      totalItems: safeTotalItems,
      startIndex,
      endIndex,
    };
  }, [transactions, totalPages, totalItems, currentPage, itemsPerPage]);

  const filteredTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return paginationData.paginatedTransactions.filter((tx) => {
      if (selectedStatus !== "All" && tx.status !== selectedStatus)
        return false;
      if (!term) return true;
      const haystack = [
        tx.paymentId,
        tx._id,
        tx.orderId,
        tx.razorpayPaymentId,
        tx.userName,
        tx.profileId,
        tx.accountId,
        tx.status,
        tx.amount,
      ]
        .filter((value) => value !== undefined && value !== null)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [paginationData.paginatedTransactions, searchTerm, selectedStatus]);

  const uiRows = useMemo(() => {
    return filteredTransactions.map((tx) => {
      const rawDate = tx.paidAt || tx.createdAt;
      const endDate = addDays(
        rawDate,
        tx.planPeriodDays || tx?.plan?.planPeriodDays,
      );

      return {
        id: tx.paymentId || tx._id || "--",
        user: tx.userName || tx.profileId || "--",
        plan: tx.planName || tx?.plan?.planName || "--",
        amount: formatAmount(tx.amount ?? tx.planAmount, tx.currency || "INR"),
        status: tx.status,
        date: formatDateTime(rawDate),
        endDate: formatDateTime(endDate),
        paymentId: tx.paymentId || tx._id,
      };
    });
  }, [filteredTransactions]);

  const stats = useMemo(() => {
    const successCount = filteredTransactions.filter(
      (tx) => tx.status === "SUCCESS",
    ).length;
    const pendingCount = filteredTransactions.filter(
      (tx) => tx.status === "PENDING",
    ).length;
    const failedCount = filteredTransactions.filter(
      (tx) => tx.status === "FAILED",
    ).length;
    const total = filteredTransactions.reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0,
    );

    return {
      total,
      successCount,
      pendingCount,
      failedCount,
    };
  }, [filteredTransactions]);

  const handlePageChange = (page) => {
    if (
      page < 1 ||
      (paginationData.totalPages > 0 && page > paginationData.totalPages)
    )
      return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("All");
    setCurrentPage(1);
  };

  const currentPageIds = useMemo(() => {
    return paginationData.paginatedTransactions
      .map((tx) => tx.paymentId || tx._id)
      .filter(Boolean);
  }, [paginationData.paginatedTransactions]);

  const isAllPageSelected = useMemo(() => {
    if (!currentPageIds.length) return false;
    return currentPageIds.every((id) => selectedIds.includes(id));
  }, [currentPageIds, selectedIds]);

  const toggleSelectAll = () => {
    if (isAllPageSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const toggleSelect = (id) => {
    if (!id) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRefresh = () => {
    loadTransactions(true);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);

      if (selectedIds.length > 0) {
        // Automatically download only the selected payments
        await downloadPaymentHistoryExcel({
          paymentIds: selectedIds,
          accountId: resolvedAccountId || undefined,
        });
      } else {
        // Automatically download the current page showing with active filters
        await downloadPaymentHistoryExcel({
          status: selectedStatus !== "All" ? selectedStatus : undefined,
          accountId: resolvedAccountId || undefined,
          search: searchTerm.trim() || undefined,
          page: currentPage,
          limit: itemsPerPage,
        });
      }
    } catch (err) {
      console.error("Failed to download Excel:", err?.message);
    } finally {
      setDownloading(false);
    }
  };



  const handleViewDetails = async (paymentId) => {
    if (!paymentId) return;

    try {
      setViewLoadingId(paymentId);
      const res = await getFranchisePaymentHistoryDetails(paymentId);
      const details = res?.data || res?.payment || res;
      setSelectedPayment(details || null);
      setIsViewModalOpen(true);
    } catch (err) {
      setSelectedPayment({
        error:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load payment details",
      });
      setIsViewModalOpen(true);
    } finally {
      setViewLoadingId("");
    }
  };

  const closeModal = () => {
    setIsViewModalOpen(false);
    setSelectedPayment(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div
        className={`rounded-xl shadow-sm border flex flex-col h-full ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
        }`}
      >
        <div
          className={`p-6 border-b ${isDark ? "border-slate-800" : "border-gray-200"}`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Payment History
              </h1>
              <p
                className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}
              >
                Track and manage all your franchise payment transactions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDark
                    ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              {/* Direct Download Excel Button */}
              <button
                onClick={handleDownload}
                disabled={downloading || loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  downloading || loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                } ${
                  selectedIds.length > 0
                    ? isDark
                      ? "bg-emerald-600/20 border border-emerald-500 text-emerald-300 hover:bg-emerald-600/30"
                      : "bg-emerald-50 border border-emerald-500 text-emerald-700 hover:bg-emerald-100"
                    : isDark
                      ? "bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20"
                      : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  {downloading
                    ? "Downloading..."
                    : selectedIds.length > 0
                    ? `Download Selected (${selectedIds.length})`
                    : `Download Excel (${paginationData.paginatedTransactions.length})`}
                </span>
              </button>
            </div>


          </div>

          {/* Search and Filter Bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDark ? "text-slate-400" : "text-gray-400"
                }`}
              />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by payment ID, customer, order ID, or status..."
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                }`}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  showFilter
                    ? "bg-blue-600 text-white"
                    : isDark
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              {(searchTerm || selectedStatus !== "All") && (
                <button
                  onClick={clearFilters}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isDark
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilter && (
            <div
              className={`mt-4 rounded-xl border p-4 transition-all ${
                isDark
                  ? "bg-slate-800/50 border-slate-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label
                    className={`block text-xs font-medium mb-1.5 ${isDark ? "text-slate-400" : "text-gray-500"}`}
                  >
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
                      isDark
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="All">All Statuses</option>
                    <option value="SUCCESS">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}

        <div className="flex-1 flex flex-col min-h-0 p-6">
          {/* Selection Action Banner */}
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <div
                className={`mb-4 p-3.5 px-6 rounded-xl border flex flex-wrap items-center justify-between gap-3 shadow-md ${
                  isDark
                    ? "bg-slate-800 border-emerald-500/30 text-white"
                    : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold">
                    {selectedIds.length}
                  </span>
                  <span className="text-sm font-semibold">
                    {selectedIds.length} payment{selectedIds.length > 1 ? "s" : ""} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload("selected")}
                    disabled={downloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
                  >
                    {downloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Download Selected ({selectedIds.length})
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isDark
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-200"
                        : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          {error && (
            <div
              className={`mb-4 rounded-lg px-4 py-3 text-sm border ${
                isDark
                  ? "bg-red-500/10 border-red-500/20 text-red-300"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {error}
            </div>
          )}

          {/* Table Section */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <div
              className={`rounded-xl border overflow-hidden h-full ${
                isDark ? "border-slate-800" : "border-gray-200"
              }`}
            >
              <div className="scrollbar-hide overflow-auto h-full">
                <table className="w-full text-left">
                  <thead
                    className={`sticky top-0 z-10 ${isDark ? "bg-slate-800" : "bg-gray-50"}`}
                  >
                    <tr
                      className={`border-b ${isDark ? "border-slate-700" : "border-gray-200"}`}
                    >
                      <th className="py-4 px-4 text-center w-12">
                        <input
                          type="checkbox"
                          checked={isAllPageSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          title={isAllPageSelected ? "Deselect page" : "Select all on page"}
                        />
                      </th>
                      <th
                        className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                          isDark ? "text-slate-400" : "text-gray-600"
                        }`}
                      >
                        Payment ID
                      </th>
                      <th
                        className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                          isDark ? "text-slate-400" : "text-gray-600"
                        }`}
                      >
                        Customer
                      </th>
                      <th
                        className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                          isDark ? "text-slate-400" : "text-gray-600"
                        }`}
                      >
                        Plan
                      </th>
                      <th
                        className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                          isDark ? "text-slate-400" : "text-gray-600"
                        }`}
                      >
                        Amount
                      </th>
                      <th
                        className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                          isDark ? "text-slate-400" : "text-gray-600"
                        }`}
                      >
                        Status
                      </th>
                      <th
                        className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                          isDark ? "text-slate-400" : "text-gray-600"
                        }`}
                      >
                        Date
                      </th>
                      <th
                        className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                          isDark ? "text-slate-400" : "text-gray-600"
                        }`}
                      >
                        End Date
                      </th>
                      <th
                        className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                          isDark ? "text-slate-400" : "text-gray-600"
                        }`}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${isDark ? "divide-slate-800" : "divide-gray-200"}`}
                  >
                    {loading ? (
                      <tr>
                        <td
                          colSpan="9"
                          className={`py-12 text-center ${isDark ? "text-slate-400" : "text-gray-500"}`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-sm">Loading transactions...</p>
                          </div>
                        </td>
                      </tr>
                    ) : uiRows.length > 0 ? (
                      uiRows.map((tx) => {
                        const isRowSelected = selectedIds.includes(tx.paymentId || tx.id);
                        return (
                        <tr
                          key={tx.id}
                          className={`transition-all duration-200 ${
                            isRowSelected
                              ? isDark
                                ? "bg-emerald-950/20"
                                : "bg-emerald-50/50"
                              : isDark
                                ? "hover:bg-slate-800/50 bg-slate-900/30"
                                : "hover:bg-gray-50 bg-white"
                          }`}
                        >
                          <td className="py-4 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isRowSelected}
                              onChange={() => toggleSelect(tx.paymentId || tx.id)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                            />
                          </td>
                          <td
                            className={`py-4 px-6 font-mono text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}
                          >
                            {tx.id}
                          </td>
                          <td className={`py-4 px-6`}>
                            <div className="flex items-center gap-2">
                              <User
                                className={`w-4 h-4 ${isDark ? "text-slate-500" : "text-gray-400"}`}
                              />
                              <span
                                className={`font-medium text-sm ${isDark ? "text-white" : "text-gray-900"}`}
                              >
                                {tx.user}
                              </span>
                            </div>
                          </td>
                          <td className={`py-4 px-6`}>
                            <div className="flex items-center gap-2">
                              <CreditCard
                                className={`w-4 h-4 ${isDark ? "text-slate-500" : "text-gray-400"}`}
                              />
                              <span
                                className={`text-sm ${isDark ? "text-white" : "text-gray-900"}`}
                              >
                                {tx.plan}

                              </span>
                            </div>
                          </td>
                          <td className={`py-4 px-6`}>
                            <div className="flex items-center gap-1">
                              <TrendingUp
                                className={`w-4 h-4 ${isDark ? "text-slate-500" : "text-gray-400"}`}
                              />
                              <span
                                className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}
                              >
                                {tx.amount}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <StatusBadge status={tx.status} isDark={isDark} />
                          </td>
                          <td
                            className={`py-4 px-6 text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}
                          >
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {tx.date}
                            </div>
                          </td>
                          <td
                            className={`py-4 px-6 text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}
                          >
                            {tx.endDate}
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleViewDetails(tx.paymentId)}
                              disabled={viewLoadingId === tx.paymentId}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all transform hover:scale-105 ${
                                isDark
                                  ? "bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
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
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="9"
                          className={`py-12 text-center ${isDark ? "text-slate-400" : "text-gray-500"}`}
                        >
                          <div className="flex flex-col items-center gap-2">

                            <Search className="w-12 h-12 opacity-50" />
                            <p className="text-sm">
                              No transactions found matching your filters.
                            </p>
                            <button
                              onClick={clearFilters}
                              className={`mt-2 text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                                isDark
                                  ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              Clear Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {!loading && totalItems > 0 && (
            <div
              className={`mt-6 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t ${
                isDark ? "border-slate-800" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}
                  >
                    Show
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                    className={`px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
                      isDark
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span
                    className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}
                  >
                    entries
                  </span>
                </div>
                <div
                  className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}
                >
                  Showing{" "}
                  <span
                    className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {paginationData.startIndex}
                  </span>{" "}
                  to{" "}
                  <span
                    className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {paginationData.endIndex}
                  </span>{" "}
                  of{" "}
                  <span
                    className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {paginationData.totalItems}
                  </span>{" "}
                  entries
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPage === 1 || loading
                      ? isDark
                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : isDark
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: paginationData.totalPages },
                    (_, i) => i + 1,
                  )
                    .filter((page) => {
                      if (page === 1 || page === paginationData.totalPages)
                        return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      const showEllipsisBefore =
                        index > 0 && array[index - 1] !== page - 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && (
                            <span
                              className={`px-2 ${isDark ? "text-slate-500" : "text-gray-500"}`}
                            >
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            disabled={loading}
                            className={`min-w-[36px] px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              currentPage === page
                                ? "bg-blue-600 text-white shadow-md"
                                : isDark
                                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
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
                  disabled={
                    loading ||
                    currentPage === paginationData.totalPages ||
                    paginationData.totalPages === 0
                  }
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    loading ||
                    currentPage === paginationData.totalPages ||
                    paginationData.totalPages === 0
                      ? isDark
                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : isDark
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isViewModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={closeModal}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-2xl rounded-xl border shadow-xl transform transition-all ${
                isDark
                  ? "bg-slate-900 border-slate-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`flex items-center justify-between px-6 py-4 border-b ${
                  isDark ? "border-slate-700" : "border-gray-200"
                }`}
              >
                <div className="scrollbar-hide flex items-center gap-2">
                  <Eye
                    className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-gray-500"}`}
                  />
                  <h3
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Payment Details
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className={`transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="scrollbar-hide p-6 space-y-4 max-h-[70vh] overflow-auto">
                {selectedPayment?.error ? (
                  <div
                    className={`rounded-lg p-4 text-center ${
                      isDark
                        ? "bg-red-500/10 text-red-300"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {selectedPayment.error}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div
                        className={`rounded-lg p-3 ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}
                      >
                        <p
                          className={`text-xs font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}
                        >
                          Payment ID
                        </p>
                        <p
                          className={`font-mono text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {selectedPayment?.razorpayPaymentId ||
                            selectedPayment?._id ||
                            "--"}
                        </p>
                      </div>
                      <div
                        className={`rounded-lg p-3 ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}
                      >
                        <p
                          className={`text-xs font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}
                        >
                          Order ID
                        </p>
                        <p
                          className={`font-mono text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}
                        >
                          {selectedPayment?.orderId ||
                            selectedPayment?.razorpayOrderId ||
                            "--"}
                        </p>
                      </div>
                      <div
                        className={`rounded-lg p-3 ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}
                      >
                        <p
                          className={`text-xs font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}
                        >
                          Amount
                        </p>
                        <p
                          className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {formatAmount(
                            selectedPayment?.amount ??
                              selectedPayment?.planAmount,
                            selectedPayment?.currency || "INR",
                          )}
                        </p>
                      </div>

                      <div
                        className={`rounded-lg p-3 ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}
                      >
                        <p
                          className={`text-xs font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}
                        >
                          Plateform Fees
                        </p>
                        <p
                          className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {formatAmount(
                            selectedPayment?.plan?.planAmount -
                              selectedPayment?.plan?.totalPrice || 0,
                          )}
                        </p>
                      </div>

                      <div
                        className={`rounded-lg p-3 ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}
                      >
                        <p
                          className={`text-xs font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}
                        >
                          Status
                        </p>
                        <StatusBadge
                          status={selectedPayment?.status}
                          isDark={isDark}
                        />
                      </div>
                      <div
                        className={`rounded-lg p-3 ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}
                      >
                        <p
                          className={`text-xs font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}
                        >
                          Plan
                        </p>
                        <p
                          className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {selectedPayment?.planName ||
                            selectedPayment?.plan?.planName ||
                            "--"}
                        </p>
                      </div>
                      <div
                        className={`rounded-lg p-3 ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}
                      >
                        <p
                          className={`text-xs font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}
                        >
                          Paid At
                        </p>
                        <p
                          className={`text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}
                        >
                          {formatDateTime(selectedPayment?.paidAt)}
                        </p>
                      </div>
                    </div>

                    {getDetailPairs(
                      selectedPayment?.plan?.details ||
                        selectedPayment?.planDetails,
                    ).length > 0 && (
                      <div>
                        <h4
                          className={`text-sm font-semibold mb-3 ${isDark ? "text-slate-200" : "text-gray-900"}`}
                        >
                          Plan Details
                        </h4>
                        <div
                          className={`rounded-lg border overflow-hidden ${
                            isDark ? "border-slate-700" : "border-gray-200"
                          }`}
                        >
                          {getDetailPairs(
                            selectedPayment?.plan?.details ||
                              selectedPayment?.planDetails,
                          ).map((item, idx) => (
                            <div
                              key={`${item?.property}-${idx}`}
                              className={`flex items-center justify-between gap-3 px-4 py-3 text-sm border-b last:border-b-0 ${
                                isDark ? "border-slate-700" : "border-gray-100"
                              }`}
                            >
                              <span
                                className={`${isDark ? "text-slate-300" : "text-gray-600"}`}
                              >
                                {item?.property || "--"}
                              </span>
                              <span
                                className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                              >
                                {String(item?.value ?? "--")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default BillingPage;
