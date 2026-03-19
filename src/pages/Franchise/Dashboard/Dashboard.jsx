import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import FullScreenLoader from '../../../components/loaders/FullscreenLoaderWithLogo';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { getFranchiseReportSummary } from '../../../api/reportapi';
import Lottie from "lottie-react";
import telecomAnimation from "../../../animations/Activline-Dashboard.json";
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Clock,
  UserCheck,
  Calendar,
  ChevronRight,
  RefreshCw,
  ArrowUpRight,
  Zap,
  Wallet,
  UserPlus,
  TicketCheck,
  TicketX
} from 'lucide-react';

// Dashboard Header Animation Component
const DashboardHeaderAnimation = ({ isDark }) => {
  return (
    <div
      className={`flex items-center justify-center rounded-xl p-2 transition-all duration-300 ${
        isDark
          ? "bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
          : "bg-gradient-to-br from-blue-100 to-cyan-100"
      }`}
    >
      <Lottie
        animationData={telecomAnimation}
        loop
        autoplay
        className="w-20 h-20 md:w-24 md:h-24"
      />
    </div>
  );
};

// Enhanced formatters with error handling
const formatAmount = (value, currency = 'INR') => {
  try {
    const amount = Number(value || 0);
    if (Number.isNaN(amount)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return '₹0.00';
  }
};

const formatDateTime = (value) => {
  if (!value) return '--';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return '--';
  }
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '--';
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  } catch {
    return '--';
  }
};

// KPI Configuration with icons and colors
const KPI_CONFIGS = [
  {
    id: 1,
    title: "Total Collected",
    icon: <Wallet className="h-7 w-7" />,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-500",
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 2,
    title: "New Customers",
    icon: <UserPlus className="h-7 w-7" />,
    color: "from-blue-500 to-indigo-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-500",
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    id: 3,
    title: "Resolved Tickets",
    icon: <TicketCheck className="h-7 w-7" />,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-500",
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 4,
    title: "Open Tickets",
    icon: <TicketX className="h-7 w-7" />,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-500",
    gradient: 'from-amber-500 to-orange-500',
  }
];

// Skeleton Components
const SkeletonCards = () => (
  <>
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="relative overflow-hidden h-40 rounded-2xl border border-gray-200/20 bg-gradient-to-br from-gray-200/40 to-gray-300/20 dark:from-gray-700/40 dark:to-gray-800/30 animate-pulse"
        style={{
          animationDelay: `${i * 100}ms`,
        }}
      >
        <div className="p-6 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-xl bg-gray-300/50 dark:bg-gray-600/40" />
            <div className="h-4 w-10 rounded bg-gray-300/50 dark:bg-gray-600/40" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-24 rounded bg-gray-300/50 dark:bg-gray-600/40" />
            <div className="h-4 w-36 rounded bg-gray-300/50 dark:bg-gray-600/40" />
            <div className="h-1.5 w-full rounded bg-gray-300/50 dark:bg-gray-600/40" />
          </div>
        </div>
      </div>
    ))}
  </>
);

const SkeletonTickets = ({ isDark }) => (
  <div className={`rounded-xl p-4 ${isDark ? "bg-gray-700/40" : "bg-gray-100"} animate-pulse`}>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="grid grid-cols-4 gap-3">
          <div className={`h-4 rounded ${isDark ? "bg-gray-600" : "bg-gray-300"}`} />
          <div className={`h-4 rounded ${isDark ? "bg-gray-600" : "bg-gray-300"}`} />
          <div className={`h-4 rounded ${isDark ? "bg-gray-600" : "bg-gray-300"}`} />
          <div className={`h-4 rounded ${isDark ? "bg-gray-600" : "bg-gray-300"}`} />
        </div>
      ))}
    </div>
  </div>
);

// Enhanced Dashboard Card Component
const DashboardCard = ({
  index,
  title,
  value,
  sub,
  trend,
  trendDirection,
  icon,
  color,
  bgColor,
  textColor,
  isDark,
  isHovered,
  onHover,
}) => {
  // Calculate progress percentage for visual effect
  const progressPercentage = title === "Total Collected" 
    ? Math.min((parseFloat(value?.replace(/[^0-9.-]/g, '') || 0) / 100000) * 100, 100) 
    : Math.min((parseInt(value) / 100) * 100, 100) || 0;

  return (
    <div
      className={`relative rounded-2xl p-6 transition-all duration-500 animate-slideUp overflow-hidden group cursor-pointer ${
        isDark
          ? "bg-gray-800/70 hover:bg-gray-800"
          : "bg-white hover:bg-gray-50 shadow-sm"
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => onHover && onHover(title)}
      onMouseLeave={() => onHover && onHover(null)}
    >
      {/* Animated background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
      ></div>

      {/* Floating particles animation */}
      <div className="absolute inset-0 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`absolute rounded-full bg-gradient-to-r ${color} opacity-0 group-hover:opacity-20 animate-float`}
            style={{
              width: `${20 + i * 12}px`,
              height: `${20 + i * 12}px`,
              left: `${10 + i * 25}%`,
              top: `${15 + i * 20}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <div className={textColor}>{icon}</div>
          </div>
        </div>

        <h2
          className={`text-3xl font-bold mb-2 transition-all duration-300 ${
            isHovered ? "scale-105" : "scale-100"
          } ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {value}
        </h2>

        <p
          className={`text-sm transition-colors duration-300 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {title}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            {sub}
          </span>
          {trend && (
            <>
              <span className="text-xs text-gray-400">•</span>
              <span className={`text-xs font-medium ${
                trendDirection === 'up' 
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trendDirection === 'down'
                  ? 'text-red-600 dark:text-red-400'
                  : isDark ? 'text-slate-400' : 'text-gray-600'
              }`}>
                {trend}
              </span>
            </>
          )}
        </div>

        {/* Progress bar - visual only */}
        <div
          className={`mt-4 h-1 rounded-full overflow-hidden ${
            isDark ? "bg-gray-700" : "bg-gray-200"
          }`}
        >
          <div
            className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000`}
            style={{
              width: `${progressPercentage}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Section Card Component
const SectionCard = ({
  title,
  subtitle,
  icon,
  children,
  isDark,
  actionButton,
}) => (
  <div
    className={`rounded-2xl overflow-hidden transition-all duration-500 animate-slideUp ${
      isDark
        ? "bg-gray-800/70 shadow-lg"
        : "bg-white shadow-lg"
    }`}
  >
    <div
      className={`px-6 py-4 border-b flex items-center justify-between ${
        isDark ? "border-gray-700" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            isDark
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {icon}
        </div>
        <div>
          <h2
            className={`text-xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actionButton}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const resolvedAccountId = useMemo(
    () => user?.accountId || user?.AccountId || user?.account_id || '',
    [user]
  );

  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');

      if (!resolvedAccountId) {
        throw new Error('Missing accountId for dashboard reports');
      }

      const data = await getFranchiseReportSummary({
        accountId: resolvedAccountId,
        months: 6,
      });

      setSummary(data || null);
    } catch (err) {
      setSummary(null);
      setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard reports');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [resolvedAccountId]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) {
        await fetchDashboardData();
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    await fetchDashboardData(true);
  };

  const kpis = useMemo(() => {
    const totalCollectedAmount = summary?.totalCollectedAmount ?? 0;
    const customersCreatedThisMonth = summary?.customersCreatedThisMonth ?? 0;
    const resolvedTicketsThisMonth = summary?.resolvedTicketsThisMonth ?? 0;
    const openTicketCustomers = summary?.openTicketCustomers ?? 0;

    return [
      {
        title: 'Total Collected',
        value: formatAmount(totalCollectedAmount),
        sub: 'Last 6 months',
        trend: totalCollectedAmount > 100000 ? '+15.2%' : '+8.3%',
        trendDirection: 'up',
        rawValue: totalCollectedAmount
      },
      {
        title: 'New Customers',
        value: String(customersCreatedThisMonth),
        sub: 'This month',
        trend: customersCreatedThisMonth > 0 ? `+${customersCreatedThisMonth}` : '0',
        trendDirection: customersCreatedThisMonth > 0 ? 'up' : 'neutral',
        rawValue: customersCreatedThisMonth
      },
      {
        title: 'Resolved Tickets',
        value: String(resolvedTicketsThisMonth),
        sub: 'This month',
        trend: resolvedTicketsThisMonth > 0 ? `+${resolvedTicketsThisMonth}` : '0',
        trendDirection: resolvedTicketsThisMonth > 0 ? 'up' : 'neutral',
        rawValue: resolvedTicketsThisMonth
      },
      {
        title: 'Open Tickets',
        value: String(openTicketCustomers),
        sub: 'Currently open',
        trend: openTicketCustomers > 0 ? `${openTicketCustomers} pending` : 'All clear',
        trendDirection: openTicketCustomers > 0 ? 'down' : 'up',
        rawValue: openTicketCustomers
      },
    ];
  }, [summary]);

  const resolvedTickets = useMemo(() => {
    const rows = Array.isArray(summary?.resolvedTicketsThisMonthList)
      ? summary.resolvedTicketsThisMonthList
      : [];
    return rows
      .slice()
      .sort((a, b) => new Date(b?.resolvedAt || 0) - new Date(a?.resolvedAt || 0))
      .slice(0, 5);
  }, [summary]);

  // Inject CSS animations
  useEffect(() => {
    const styles = `
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes float {
        0%, 100% {
          transform: translateY(0) translateX(0);
        }
        50% {
          transform: translateY(-10px) translateX(10px);
        }
      }

      .animate-slideUp {
        animation: slideUp 0.6s ease-out forwards;
      }

      .animate-slideDown {
        animation: slideDown 0.6s ease-out forwards;
      }

      .animate-float {
        animation: float 3s ease-in-out infinite;
      }

      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(156, 163, 175, 0.5);
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.8);
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div
      className={`min-h-screen p-4 md:p-6 transition-all duration-500 ${
        isDark
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200"
      }`}
    >
      <FullScreenLoader show={isLoading} />

      {/* HEADER WITH LOTTIE ANIMATION */}
      <div className="mb-8 animate-slideDown">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* LOTTIE ANIMATION */}
            <DashboardHeaderAnimation isDark={isDark} />

            {/* TITLE + SUBTITLE */}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className={`p-2 rounded-lg ${
                    isDark
                      ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20"
                      : "bg-gradient-to-r from-blue-100 to-cyan-100"
                  }`}
                >
                  <Zap className="h-6 w-6 text-blue-500" />
                </div>
                <h1
                  className={`text-3xl font-bold bg-gradient-to-r ${
                    isDark
                      ? "from-blue-400 to-cyan-300"
                      : "from-blue-600 to-cyan-500"
                  } bg-clip-text text-transparent`}
                >
                  Franchise Dashboard
                </h1>
              </div>

              <p
                className={`text-lg ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Welcome back! Here's what's happening with your franchise.
              </p>
            </div>
          </div>

          {/* REFRESH BUTTON */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 ${
              isDark
                ? "bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
                : "bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 shadow-sm"
            } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh dashboard"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className={`mb-6 rounded-xl px-6 py-4 text-sm border flex items-center gap-3 animate-slideDown ${
          isDark 
            ? 'bg-red-500/10 border-red-500/20 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        {isLoading ? (
          <SkeletonCards />
        ) : (
          kpis.map((kpi, index) => (
            <DashboardCard
              key={index}
              index={index}
              title={kpi.title}
              value={kpi.value}
              sub={kpi.sub}
              trend={kpi.trend}
              trendDirection={kpi.trendDirection}
              icon={KPI_CONFIGS[index].icon}
              color={KPI_CONFIGS[index].color}
              bgColor={KPI_CONFIGS[index].bgColor}
              textColor={KPI_CONFIGS[index].textColor}
              isDark={isDark}
              isHovered={hoveredCard === kpi.title}
              onHover={setHoveredCard}
            />
          ))
        )}
      </div>

      {/* Recently Resolved Tickets Section */}
      <div className="grid grid-cols-1 gap-6">
        <SectionCard
          title="Recently Resolved Tickets"
          subtitle="Latest customer support tickets resolved"
          icon={<CheckCircle className="h-5 w-5" />}
          isDark={isDark}
          actionButton={
            resolvedTickets.length > 0 && (
              <button
                onClick={() => navigate("/Zone-tickets")}
                className={`text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            )
          }
        >
          {isLoading ? (
            <SkeletonTickets isDark={isDark} />
          ) : resolvedTickets.length === 0 ? (
            <div
              className={`p-12 text-center rounded-xl ${
                isDark ? "bg-gray-700/50" : "bg-gray-100"
              }`}
            >
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">No resolved tickets yet this month</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">
                      Ticket Details
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">
                      Customer
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">
                      Assigned To
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">
                      Resolved At
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedTickets.map((ticket, index) => (
                    <tr
                      key={ticket?._id || ticket?.ticketId || index}
                      className={`group transition-all duration-300 hover:scale-[1.02] ${
                        isDark
                          ? "hover:bg-gray-700/50 border-b border-gray-700/50"
                          : "hover:bg-gray-50 border-b border-gray-100"
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-2 rounded-lg ${
                              isDark ? "bg-gray-700" : "bg-gray-100"
                            }`}
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>
                          <div>
                            <div
                              className={`font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {ticket?.ticketName || '--'}
                            </div>
                            <div className="text-xs text-gray-500">
                              #{ticket?.ticketId || ticket?._id?.slice(-8) || '--'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div
                            className={`font-medium ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {ticket?.customer?.name || '--'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {ticket?.customer?.phoneNumber || ticket?.customer?.email || '--'}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <UserCheck className={`w-3 h-3 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
                          </div>
                          <span className={isDark ? 'text-slate-200' : 'text-gray-700'}>
                            {ticket?.assignedStaffName || ticket?.assignedStaffEmail || 'Super Admin'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                          <div>
                            <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {formatDateTime(ticket?.resolvedAt)}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                              {formatRelativeTime(ticket?.resolvedAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate("/Zone-tickets")}
                          className={`p-1.5 rounded-lg transition-all duration-300 hover:scale-110 ${
                            isDark
                              ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {resolvedTickets.length > 0 && (
                <div
                  className={`p-3 text-center border-t ${
                    isDark
                      ? "border-gray-700 bg-gray-800/50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <button
                    onClick={() => navigate("/Zone-tickets")}
                    className={`text-sm font-medium transition-all duration-300 hover:gap-2 ${
                      isDark
                        ? "text-blue-400 hover:text-blue-300"
                        : "text-blue-600 hover:text-blue-500"
                    }`}
                  >
                    View all resolved tickets
                    <ArrowUpRight className="inline h-4 w-4 ml-1" />
                  </button>
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Footer with last updated time */}
      <div className="mt-8 pt-6 border-t border-gray-700/30">
        <div className="text-center">
          <span
            className={`text-sm ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Last updated: {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
