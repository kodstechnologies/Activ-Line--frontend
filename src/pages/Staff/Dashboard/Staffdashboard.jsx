import React, { useEffect, useState, useCallback, memo } from "react";
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

// ── API imports (only the ones actually used) ──
import {
  getOpenTickets,
  getInProgressTickets,
  getTodayResolvedTickets,
  getTotalCustomers,
  getRecentTickets,
} from "../../../api/staff/staffdashboardapi";

// ── Reusable small components ──
const DashboardHeaderAnimation = memo(({ isDark }) => (
  <div
    className={`flex items-center justify-center rounded-xl p-2 transition-colors ${
      isDark ? "bg-blue-500/10" : "bg-blue-100"
    }`}
  >
    <Lottie
      animationData={telecomAnimation}
      loop
      autoplay
      className="w-20 h-20 md:w-24 md:h-24"
    />
  </div>
));

const StatusIcon = ({ status }) => {
  switch (status) {
    case "OPEN":     return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case "ASSIGNED": return <Clock className="h-4 w-4 text-blue-500" />;
    case "RESOLVED": return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:         return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const StatusBadge = memo(({ status, isDark }) => {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border";

  const styles = {
    OPEN:     isDark ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" : "bg-yellow-50 text-yellow-700 border-yellow-200",
    ASSIGNED: isDark ? "bg-blue-500/20 text-blue-300 border-blue-500/30"   : "bg-blue-50 text-blue-700 border-blue-200",
    RESOLVED: isDark ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-green-50 text-green-700 border-green-200",
  }[status] || (isDark ? "bg-gray-500/20 text-gray-300 border-gray-500/30" : "bg-gray-50 text-gray-700 border-gray-200");

  return (
    <span className={`${base} ${styles}`}>
      <StatusIcon status={status} />
      {status}
    </span>
  );
});

// ── Card component ──
const DashboardCard = memo(({ title, value, icon, color, bgColor, textColor, isDark, index }) => {
  const progress = Math.min(Math.round((value / 100) * 100), 100);

  return (
    <div
      className={`relative rounded-2xl p-6 bg-gradient-to-br ${isDark ? "from-gray-800/70 to-gray-800/40" : "bg-white"} shadow-sm hover:shadow-md transition-all duration-300`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 hover:opacity-5 transition-opacity duration-500 rounded-2xl`} />

      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bgColor}`}>{React.cloneElement(icon, { className: `h-7 w-7 ${textColor}` })}</div>
      </div>

      <h2 className={`text-3xl font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
        {value.toLocaleString()}
      </h2>
      <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{title}</p>

      <div className={`mt-4 h-1 rounded-full overflow-hidden ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
});

// ── Section Card Wrapper ──
const SectionCard = memo(({ title, subtitle, icon, children, isDark }) => (
  <div className={`rounded-2xl overflow-hidden ${isDark ? "bg-gray-800/70" : "bg-white"} shadow-lg`}>
    <div className={`px-6 py-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"} flex items-center gap-3`}>
      <div className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>{icon}</div>
      <div>
        <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h2>
        {subtitle && <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{subtitle}</p>}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
));

// ── Skeleton ──
const SkeletonCard = () => (
  <div className="rounded-2xl p-6 bg-gray-200/50 dark:bg-gray-800/50 animate-pulse h-40" />
);

const SkeletonTableRow = () => (
  <div className="py-2">
    <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
  </div>
);

// ── Main Dashboard ──
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
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [open, inProg, today, total, recent] = await Promise.all([
        getOpenTickets(),
        getInProgressTickets(),
        getTodayResolvedTickets(),
        getTotalCustomers(),
        getRecentTickets(5),
      ]);

      setStats({
        openTickets: open?.openTickets ?? 0,
        inProgressTickets: inProg?.inProgressTickets ?? 0,
        todayResolvedTickets: today?.todayResolvedTickets ?? 0,
        totalCustomers: total?.totalCustomers ?? 0,
      });

      setRecentTickets(recent ?? []);
    } catch (err) {
      console.error("Dashboard data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    // Optional: auto-refresh every 3–5 minutes
    // const interval = setInterval(loadDashboard, 180_000);
    // return () => clearInterval(interval);
  }, [loadDashboard]);

  const cardStats = [
    { title: "Open Tickets",        value: stats.openTickets,        icon: <MessageSquare />, color: "from-yellow-500 to-amber-500",   bgColor: "bg-yellow-500/10", textColor: "text-yellow-500" },
    { title: "Tickets In-Progress", value: stats.inProgressTickets,  icon: <Clock />,        color: "from-blue-500 to-cyan-500",     bgColor: "bg-blue-500/10",   textColor: "text-blue-500"   },
    { title: "Resolved Today",      value: stats.todayResolvedTickets, icon: <TrendingUp />,  color: "from-green-500 to-emerald-500", bgColor: "bg-green-500/10", textColor: "text-green-500"  },
    { title: "Total Customers",     value: stats.totalCustomers,     icon: <Users />,        color: "from-purple-500 to-violet-500", bgColor: "bg-purple-500/10", textColor: "text-purple-500" },
  ];

  return (
    <div className={`min-h-screen p-4 md:p-6 ${isDark ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200"} transition-colors duration-300`}>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <DashboardHeaderAnimation isDark={isDark} />
          <div>
            <h1 className={`text-3xl font-bold bg-gradient-to-r ${isDark ? "from-blue-400 to-cyan-300" : "from-blue-600 to-cyan-500"} bg-clip-text text-transparent`}>
              Dashboard
            </h1>
            <p className={`mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}> back! Here's what's happening today.</p>
          </div>
        </div>

        <button
          onClick={loadDashboard}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white" : "bg-white hover:bg-gray-100 shadow-sm text-gray-700 hover:text-gray-900"
          }`}
        >
          <RefreshCw className="h-5 w-5" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mb-10">
        {loading
          ? Array(4).fill().map((_, i) => <SkeletonCard key={i} />)
          : cardStats.map((card, i) => (
              <DashboardCard key={card.title} {...card} isDark={isDark} index={i} />
            ))}
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Recent Tickets */}
        <SectionCard title="Recent Tickets" subtitle="Latest customer support requests" icon={<MessageSquare className="h-5 w-5" />} isDark={isDark}>
          {loading ? (
            <div className="space-y-3">
              {Array(5).fill().map((_, i) => <SkeletonTableRow key={i} />)}
            </div>
          ) : recentTickets.length === 0 ? (
            <div className={`p-10 text-center rounded-xl ${isDark ? "bg-gray-800/50" : "bg-gray-100"}`}>
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">No recent tickets</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Ticket</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Subject</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Status</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Created</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTickets.map((ticket) => (
                      <tr
                        key={ticket.ticketId}
                        className={`border-b last:border-none hover:bg-opacity-50 transition-colors ${
                          isDark ? "hover:bg-gray-700/50 border-gray-700/50" : "hover:bg-gray-50 border-gray-100"
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                              <StatusIcon status={ticket.status} />
                            </div>
                            <div>
                              <div className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                                #{ticket.ticketId.slice(-6)}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">{ticket.customer || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 max-w-xs truncate text-sm" title={ticket.subject}>
                          {ticket.subject}
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={ticket.status} isDark={isDark} />
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()} <br />
                          <span className="text-xs opacity-70">
                            {new Date(ticket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button className={`p-2 rounded-lg hover:bg-opacity-20 transition ${isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}>
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={`mt-4 text-center ${isDark ? "border-t border-gray-700 pt-4" : "border-t border-gray-200 pt-4"}`}>
                <button
                  onClick={() => navigate("/tickets")}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"} transition-colors`}
                >
                  View all tickets <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </SectionCard>

        {/* Recent Payments (placeholder) */}
        <SectionCard title="Recent Payments" subtitle="Latest financial transactions" icon={<TrendingUp className="h-5 w-5" />} isDark={isDark}>
          <div className={`p-10 text-center rounded-xl ${isDark ? "bg-gray-800/50" : "bg-gray-100"}`}>
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className={`h-20 w-20 rounded-full border-4 ${isDark ? "border-gray-600" : "border-gray-300"}`} />
                <div className={`absolute inset-0 h-20 w-20 rounded-full border-4 border-t-transparent border-blue-500 animate-spin`} />
              </div>
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Payments Module</h3>
            <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Coming Soon</p>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium animate-pulse">
              <span>●</span> In Development
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-10 text-center text-sm text-gray-500">
        Last updated: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
};

export default memo(DashboardPage);
