import React, { useEffect, useState, useCallback, memo, useMemo } from "react";
import {
  MessageSquare,
  Clock,
  Users,
  TrendingUp,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import Lottie from "lottie-react";
import telecomAnimation from "../../../animations/Activline-Dashboard.json";

// API imports
import {
  getOpenTickets,
  getInProgressTickets,
  getTodayResolvedTickets,
  getTotalCustomers,
  getRecentTickets,
  getAssignedPaymentHistory,
} from "../../../api/staff/staffdashboardapi";

// ── Constants ──
const STATUS_CONFIG = {
  OPEN: { icon: AlertCircle, color: 'yellow' },
  ASSIGNED: { icon: Clock, color: 'blue' },
  RESOLVED: { icon: CheckCircle, color: 'green' },
  PENDING: { icon: Clock, color: 'amber' },
  SUCCESS: { icon: CheckCircle, color: 'green' },
  PAID: { icon: CheckCircle, color: 'green' },
  FAILED: { icon: AlertCircle, color: 'red' }
};

const CARD_STATS = [
  { 
    title: "Open Tickets", 
    statKey: 'openTickets', 
    icon: MessageSquare, 
    color: "from-yellow-500 to-amber-500", 
    bgColor: "bg-yellow-500/10", 
    textColor: "text-yellow-500" 
  },
  { 
    title: "Tickets In-Progress", 
    statKey: 'inProgressTickets', 
    icon: Clock, 
    color: "from-blue-500 to-cyan-500", 
    bgColor: "bg-blue-500/10", 
    textColor: "text-blue-500" 
  },
  { 
    title: "Resolved Today", 
    statKey: 'todayResolvedTickets', 
    icon: TrendingUp, 
    color: "from-green-500 to-emerald-500", 
    bgColor: "bg-green-500/10", 
    textColor: "text-green-500" 
  },
  { 
    title: "Total Customers", 
    statKey: 'totalCustomers', 
    icon: Users, 
    color: "from-purple-500 to-violet-500", 
    bgColor: "bg-purple-500/10", 
    textColor: "text-purple-500" 
  },
];

// ── Utility Functions ──
const formatCurrency = (amount, currency = "INR") => {
  const value = Number(amount || 0);
  if (isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDateWithTime = (dateString) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return (
      <>
        {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        <br />
        <span className="text-xs opacity-70">
          {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </span>
      </>
    );
  } catch {
    return "—";
  }
};

const toDisplayText = (value) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    return (
      value.name ||
      value.fullName ||
      value.email ||
      value.phoneNumber ||
      value._id ||
      "—"
    );
  }
  return "—";
};

const getStatusStyle = (status, isDark) => {
  const statusKey = String(status || "").toUpperCase();
  const base = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border";
  
  const styles = {
    OPEN:     isDark ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" : "bg-yellow-50 text-yellow-800 border-yellow-200",
    ASSIGNED: isDark ? "bg-blue-500/20   text-blue-300   border-blue-500/30"   : "bg-blue-50   text-blue-800   border-blue-200",
    RESOLVED: isDark ? "bg-green-500/20  text-green-300  border-green-500/30"  : "bg-green-50  text-green-800  border-green-200",
    PENDING:  isDark ? "bg-amber-500/20  text-amber-300  border-amber-500/30"  : "bg-amber-50  text-amber-800  border-amber-200",
    SUCCESS:  isDark ? "bg-green-500/20  text-green-300  border-green-500/30"  : "bg-green-50  text-green-800  border-green-200",
    PAID:     isDark ? "bg-green-500/20  text-green-300  border-green-500/30"  : "bg-green-50  text-green-800  border-green-200",
    FAILED:   isDark ? "bg-red-500/20    text-red-300    border-red-500/30"    : "bg-red-50    text-red-800    border-red-200",
  };
  
  return `${base} ${styles[statusKey] || (isDark ? "bg-gray-600/20 text-gray-300 border-gray-500/30" : "bg-gray-100 text-gray-700 border-gray-300")}`;
};

// ── Components ──
const DashboardHeaderAnimation = memo(({ isDark }) => (
  <div className={`flex items-center justify-center rounded-xl p-2 ${isDark ? "bg-blue-500/10" : "bg-blue-50"}`}>
    <Lottie animationData={telecomAnimation} loop autoplay className="w-20 h-20 md:w-24 md:h-24" />
  </div>
));

const StatusIcon = memo(({ status }) => {
  const key = String(status || "").toUpperCase();
  const { icon: Icon, color } = STATUS_CONFIG[key] || { icon: AlertCircle, color: 'gray' };
  const colorClass = {
    yellow: "text-yellow-500",
    blue:   "text-blue-500",
    green:  "text-green-500",
    amber:  "text-amber-500",
    red:    "text-red-500",
    gray:   "text-gray-500"
  }[color] || "text-gray-500";
  return <Icon className={`h-4 w-4 ${colorClass}`} />;
});

const StatusBadge = memo(({ status, isDark }) => (
  <span className={getStatusStyle(status, isDark)}>
    <StatusIcon status={status} />
    {status?.toUpperCase() || "UNKNOWN"}
  </span>
));

const DashboardCard = memo(({ title, value, icon: Icon, color, bgColor, textColor, isDark, index }) => (
  <div
    className={`rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br ${
      isDark ? "from-gray-800/80 to-gray-800/50" : "bg-white shadow-sm"
    } hover:shadow-md transition-all duration-300`}
    style={{ animationDelay: `${index * 80}ms` }}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 hover:opacity-5 transition-opacity`} />
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon className={`h-7 w-7 ${textColor}`} />
        </div>
      </div>
      <h3 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
        {value.toLocaleString()}
      </h3>
      <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{title}</p>
    </div>
  </div>
));

const SectionCard = memo(({ title, subtitle, icon, children, isDark }) => (
  <div className={`rounded-2xl overflow-hidden ${isDark ? "bg-gray-800/70 border border-gray-700" : "bg-white shadow-md"}`}>
    <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
      <div className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>{icon}</div>
      <div>
        <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h2>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{subtitle}</p>
      </div>
    </div>
    <div className="p-5">{children}</div>
  </div>
));

const EmptyState = memo(({ type, isDark }) => {
  const Icon = type === 'tickets' ? MessageSquare : TrendingUp;
  return (
    <div className={`p-12 text-center ${isDark ? "bg-gray-800/40" : "bg-gray-50"} rounded-xl`}>
      <Icon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <p className="text-gray-500">No recent {type} found</p>
    </div>
  );
});

// ── Table Rows ──
const TicketRow = memo(({ item, isDark, navigate }) => {
  const ticketId = item.ticketId?.slice(-6) || '—';
  const customer = toDisplayText(item.customer);
  return (
    <tr className={`border-b last:border-0 hover:bg-opacity-60 transition-colors ${
      isDark ? "hover:bg-gray-700/60 border-gray-700/60" : "hover:bg-gray-50 border-gray-100"
    }`}>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
            <StatusIcon status={item.status} />
          </div>
          <div>
            <div className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>#{ticketId}</div>
            <div className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-900"}`}>{customer}</div>
          </div>
        </div>
      </td>
      <td className={`py-4 px-4 text-sm truncate max-w-xs ${isDark ? "text-gray-300" : "text-gray-900"}`} title={customer}>
        {customer}
      </td>
      <td className="py-4 px-4">
        <StatusBadge status={item.status} isDark={isDark} />
      </td>
      <td className={`py-4 px-4 text-sm ${isDark ? "text-gray-400" : "text-gray-900"}`}>
        {formatDateWithTime(item.createdAt)}
      </td>
      <td className="py-4 px-4">
        <button
          onClick={() => navigate(`/tickets/${item.ticketId}`)}
          className={`p-2 rounded-lg transition ${isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
});

const PaymentRow = memo(({ item, isDark, navigate }) => {
  const paymentId = (item.paymentId || item._id || "—").slice(-6);
  const customer =
    item?.customer?.name ||
    item?.customer?.userName ||
    item?.customer?.username ||
    item?.customer?.email ||
    item?.customer?.phoneNumber ||
    "—";
  const plan = toDisplayText(item.planName || item.plan);
  const status = item.status?.toUpperCase() || "UNKNOWN";

  return (
    <tr className={`border-b last:border-0 hover:bg-opacity-60 transition-colors ${
      isDark ? "hover:bg-gray-700/60 border-gray-700/60" : "hover:bg-gray-50 border-gray-100"
    }`}>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
            <StatusIcon status={status} />
          </div>
          <div>
            <div className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>#{paymentId}</div>
            <div className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-900"}`}>{customer}</div>
          </div>
        </div>
      </td>
      <td className={`py-4 px-4 text-sm truncate max-w-xs ${isDark ? "text-gray-300" : "text-gray-900"}`} title={plan}>
        {plan}
      </td>
      <td className="py-4 px-4 text-sm font-medium">
        {formatCurrency(item.amount)}
      </td>
      <td className="py-4 px-4">
        <StatusBadge status={status} isDark={isDark} />
      </td>
      <td className={`py-4 px-4 text-sm ${isDark ? "text-gray-400" : "text-gray-900"}`}>
        {formatDateWithTime(item.paidAt || item.createdAt)}
      </td>
      <td className="py-4 px-4">
        <button
          onClick={() => item.paymentId && navigate(`/payments/${item.paymentId}`)}
          disabled={!item.paymentId}
          className={`p-2 rounded-lg transition ${
            item.paymentId
              ? isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"
              : "opacity-40 cursor-not-allowed"
          }`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
});

const TicketsTable = memo(({ tickets, isDark, navigate }) => {
  if (!tickets?.length) return <EmptyState type="tickets" isDark={isDark} />;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Ticket</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Customer</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Status</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Created</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(item => (
              <TicketRow key={item.ticketId} item={item} isDark={isDark} navigate={navigate} />
            ))}
          </tbody>
        </table>
      </div>
      <div className={`mt-5 text-center ${isDark ? "border-t border-gray-700 pt-4" : "border-t border-gray-200 pt-4"}`}>
        <button
          onClick={() => navigate("/assigned-tickets")}
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${
            isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
          }`}
        >
          View all tickets <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
});

const PaymentsTable = memo(({ payments, isDark, navigate }) => {
  if (!payments?.length) return <EmptyState type="payments" isDark={isDark} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Payment</th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Plan</th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Amount</th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Status</th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Date</th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(item => (
            <PaymentRow key={item.paymentId || item._id} item={item} isDark={isDark} navigate={navigate} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

// ── Main Component ──
const DashboardPage = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [stats, setStats] = useState({
    openTickets: 0,
    inProgressTickets: 0,
    todayResolvedTickets: 0,
    totalCustomers: 0,
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [open, inProg, today, total, ticketsRes, paymentsRes] = await Promise.all([
        getOpenTickets(),
        getInProgressTickets(),
        getTodayResolvedTickets(),
        getTotalCustomers(),
        getRecentTickets(5),
        getAssignedPaymentHistory({ page: 1, limit: 5 }),
      ]);

      setStats({
        openTickets: open?.openTickets ?? 0,
        inProgressTickets: inProg?.inProgressTickets ?? 0,
        todayResolvedTickets: today?.todayResolvedTickets ?? 0,
        totalCustomers: total?.totalCustomers ?? 0,
      });

      setRecentTickets(ticketsRes ?? []);
      setRecentPayments(Array.isArray(paymentsRes) ? paymentsRes : paymentsRes?.data ?? []);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const cardItems = useMemo(() => 
    CARD_STATS.map((card, i) => ({
      ...card,
      value: stats[card.statKey] ?? 0,
      index: i
    })), [stats]);

  return (
    <div className={`min-h-screen p-4 md:p-6 ${
      isDark 
        ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" 
        : "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200"
    }`}>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-5">
          <DashboardHeaderAnimation isDark={isDark} />
          <div>
            <h1 className={`text-3xl font-bold bg-gradient-to-r ${
              isDark ? "from-blue-400 to-cyan-300" : "from-blue-600 to-cyan-500"
            } bg-clip-text text-transparent`}>
              Dashboard
            </h1>
            <p className={`mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Overview of support & payments • {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            isDark 
              ? "bg-gray-800 hover:bg-gray-700 text-gray-200 disabled:opacity-50" 
              : "bg-white shadow hover:bg-gray-50 text-gray-700 disabled:opacity-60"
          }`}
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mb-10">
        {loading
          ? Array(4).fill().map((_, i) => (
              <div key={i} className="rounded-2xl p-6 bg-gray-200/60 dark:bg-gray-800/50 animate-pulse h-40" />
            ))
          : cardItems.map(card => <DashboardCard key={card.title} {...card} isDark={isDark} />)}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <SectionCard
          title="Recent Tickets"
          subtitle="Latest customer support requests"
          icon={<MessageSquare className="h-5 w-5" />}
          isDark={isDark}
        >
          {loading ? (
            <div className="space-y-4 py-2">
              {Array(5).fill().map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <TicketsTable tickets={recentTickets} isDark={isDark} navigate={navigate} />
          )}
        </SectionCard>

        <SectionCard
          title="Recent Payments"
          subtitle="Latest financial transactions"
          icon={<TrendingUp className="h-5 w-5" />}
          isDark={isDark}
        >
          {loading ? (
            <div className="space-y-4 py-2">
              {Array(5).fill().map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <PaymentsTable payments={recentPayments} isDark={isDark} navigate={navigate} />
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default memo(DashboardPage);
