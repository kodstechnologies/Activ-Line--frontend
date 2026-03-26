import React, { useEffect, useState } from "react";
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
  Zap,
  CreditCard,
  Calendar,
  User,
  Hash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import {
  getOpenTickets,
  getInProgressTickets,
  getTodayResolvedTickets,
  getTotalCustomers,
  getRecentTickets,
  getRecentPayments,
} from "../../../api/admindashboard.api";
import Lottie from "lottie-react";
import telecomAnimation from "../../../animations/Activline-Dashboard.json";
import { preloadTickets } from "../../../routes/routePrefetch";

// ================= CONSTANTS & CONFIG =================
const STATUS_CONFIG = {
  OPEN: { icon: AlertCircle, color: 'yellow', label: 'Open' },
  ASSIGNED: { icon: Clock, color: 'blue', label: 'In Progress' },
  RESOLVED: { icon: CheckCircle, color: 'green', label: 'Resolved' },
  PENDING: { icon: Clock, color: 'amber', label: 'Pending' },
  SUCCESS: { icon: CheckCircle, color: 'green', label: 'Success' },
  PAID: { icon: CheckCircle, color: 'green', label: 'Paid' },
  FAILED: { icon: AlertCircle, color: 'red', label: 'Failed' },
};

const PAYMENT_STATUS_CONFIG = {
  SUCCESS: { color: 'green', label: 'Success' },
  PAID: { color: 'green', label: 'Paid' },
  PENDING: { color: 'amber', label: 'Pending' },
  FAILED: { color: 'red', label: 'Failed' },
};

// ================= UTILITY FUNCTIONS =================
const formatCurrency = (amount, currency = "INR") => {
  const value = Number(amount || 0);
  if (isNaN(value)) return "--";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return "--";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "--";
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getStatusClass = (status, isDark) => {
  const statusStr = String(status || "").toUpperCase();
  const config = STATUS_CONFIG[statusStr] || { color: 'gray' };
  
  const colorClasses = {
    green: isDark 
      ? "bg-green-500/20 text-green-300 border-green-500/30" 
      : "bg-green-50 text-green-700 border-green-200",
    blue: isDark 
      ? "bg-blue-500/20 text-blue-300 border-blue-500/30" 
      : "bg-blue-50 text-blue-700 border-blue-200",
    yellow: isDark 
      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" 
      : "bg-yellow-50 text-yellow-700 border-yellow-200",
    amber: isDark 
      ? "bg-amber-500/20 text-amber-300 border-amber-500/30" 
      : "bg-amber-50 text-amber-700 border-amber-200",
    red: isDark 
      ? "bg-red-500/20 text-red-300 border-red-500/30" 
      : "bg-red-50 text-red-700 border-red-200",
    gray: isDark 
      ? "bg-gray-500/20 text-gray-300 border-gray-500/30" 
      : "bg-gray-50 text-gray-700 border-gray-200",
  };
  
  return colorClasses[config.color] || colorClasses.gray;
};

const StatusBadge = ({ status, isDark }) => {
  const statusStr = String(status || "").toUpperCase();
  const config = STATUS_CONFIG[statusStr] || { icon: AlertCircle, label: status || 'Unknown' };
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${getStatusClass(status, isDark)}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{config.label}</span>
    </span>
  );
};

// ================= MAIN COMPONENT =================
const DashboardPage = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [
          openRes,
          inProgressRes,
          todayResolvedRes,
          totalCustomersRes,
          ticketsRes,
          paymentsRes,
        ] = await Promise.all([
          getOpenTickets(),
          getInProgressTickets(),
          getTodayResolvedTickets(),
          getTotalCustomers(),
          getRecentTickets(5),
          getRecentPayments(5),
        ]);

        setStats({
          openTickets: openRes.openTickets,
          inProgressTickets: inProgressRes.inProgressTickets,
          todayResolvedTickets: todayResolvedRes.todayResolvedTickets,
          totalCustomers: totalCustomersRes.totalCustomers,
        });

        setRecentTickets(ticketsRes);
        setRecentPayments(Array.isArray(paymentsRes) ? paymentsRes : []);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setRecentPayments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const getStatValue = (title) => {
    if (!stats) return 0;
    switch(title) {
      case "Open Tickets": return stats.openTickets || 0;
      case "Tickets In-Progress": return stats.inProgressTickets || 0;
      case "Resolved Today": return stats.todayResolvedTickets || 0;
      case "Total Customers": return stats.totalCustomers || 0;
      default: return 0;
    }
  };

  const cardStats = [
    { id: 1, title: "Open Tickets", icon: MessageSquare, color: "from-yellow-500 to-amber-500", bgColor: "bg-yellow-500/10", textColor: "text-yellow-500" },
    { id: 2, title: "Tickets In-Progress", icon: Clock, color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-500/10", textColor: "text-blue-500" },
    { id: 3, title: "Resolved Today", icon: TrendingUp, color: "from-green-500 to-emerald-500", bgColor: "bg-green-500/10", textColor: "text-green-500" },
    { id: 4, title: "Total Customers", icon: Users, color: "from-purple-500 to-violet-500", bgColor: "bg-purple-500/10", textColor: "text-purple-500" },
  ];

  return (
    <div className={`min-h-screen p-4 md:p-6 transition-all duration-500 ${
      isDark ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200"
    }`}>
      
      {/* Header */}
      <div className="mb-8 animate-slideDown">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <DashboardHeaderAnimation isDark={isDark} />
            <div>
              <h1 className={`text-3xl font-bold bg-gradient-to-r ${
                isDark ? "from-blue-400 to-cyan-300" : "from-blue-600 to-cyan-500"
              } bg-clip-text text-transparent`}>
                Dashboard
              </h1>
              <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Welcome back! Here's what's happening today.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className={`p-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 ${
              isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white" : "bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 shadow-sm"
            }`}
          >
            <RefreshCw className="h-5 w-5" />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        {loading ? <SkeletonCards /> : cardStats.map((card, index) => (
          <DashboardCard
            key={card.id}
            index={index}
            title={card.title}
            value={getStatValue(card.title)}
            icon={<card.icon className="h-7 w-7" />}
            color={card.color}
            bgColor={card.bgColor}
            textColor={card.textColor}
            isDark={isDark}
            isHovered={hoveredCard === card.id}
            onHover={setHoveredCard}
          />
        ))}
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Recent Tickets */}
        <SectionCard title="Recent Tickets" icon={<MessageSquare className="h-5 w-5" />} isDark={isDark}>
          {loading ? (
            <SkeletonTable isDark={isDark} />
          ) : recentTickets.length === 0 ? (
            <EmptyState icon={MessageSquare} message="No recent tickets" isDark={isDark} />
          ) : (
            <DataTable
              headers={["ID", "Customer", "Subject", "Status", "Created"]}
              data={recentTickets}
              renderRow={(ticket) => (
                <>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                        <Hash className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className={`font-mono text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                        #{ticket.ticketId?.slice(-6)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {ticket.customer || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="max-w-[150px] truncate text-sm" title={ticket.subject}>
                      {ticket.subject}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={ticket.status} isDark={isDark} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {formatDate(ticket.createdAt)}
                      </span>
                    </div>
                  </td>
                </>
              )}
              onViewAll={() => navigate("/tickets")}
              onViewAllPrefetch={preloadTickets}
              onRowAction={() => navigate("/tickets")}
              isDark={isDark}
            />
          )}
        </SectionCard>

        {/* Recent Payments */}
        <SectionCard title="Recent Payments" icon={<CreditCard className="h-5 w-5" />} isDark={isDark}>
          {loading ? (
            <SkeletonTable isDark={isDark} />
          ) : recentPayments.length === 0 ? (
            <EmptyState icon={CreditCard} message="No recent payments" isDark={isDark} />
          ) : (
            <DataTable
              headers={["User", "Plan", "Amount", "Status", "Date"]}
              data={recentPayments}
              renderRow={(payment) => (
                <>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {payment.userName ||
                          payment.customer?.name ||
                          payment.customer?.userName ||
                          payment.customer?.username ||
                          payment.customer?.email ||
                          "--"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                        {payment.planName || payment?.plan?.planName || "--"}
                      </span>
                      {payment.profileId && (
                        <span className="text-xs text-gray-500">{payment.profileId}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {formatCurrency(payment.amount ?? payment.planAmount, payment.currency)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={payment.status} isDark={isDark} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </span>
                    </div>
                  </td>
                </>
              )}
              onViewAll={() => navigate("/payments")}
              onRowAction={() => navigate("/payments")}
              isDark={isDark}
            />
          )}
        </SectionCard>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-700/30">
        <div className="text-center">
          <span className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            Last updated: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
};

// ================= SUB-COMPONENTS =================

const DashboardHeaderAnimation = ({ isDark }) => (
  <div className={`flex items-center justify-center rounded-xl p-2 transition-all duration-300 ${
    isDark ? "bg-gradient-to-br from-blue-500/10 to-cyan-500/10" : "bg-gradient-to-br from-blue-100 to-cyan-100"
  }`}>
    <Lottie animationData={telecomAnimation} loop autoplay className="w-20 h-20 md:w-24 md:h-24" />
  </div>
);

const DashboardCard = ({ index, title, value, icon, color, bgColor, textColor, isDark, isHovered, onHover }) => {
  const progressPercentage = Math.min((value / 100) * 100, 100) || 0;

  return (
    <div
      className={`relative rounded-2xl p-6 transition-all duration-500 animate-slideUp overflow-hidden group cursor-pointer ${
        isDark ? "bg-gray-800/70 hover:bg-gray-800" : "bg-white hover:bg-gray-50 shadow-sm"
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => onHover?.(title)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`absolute rounded-full bg-gradient-to-r ${color} opacity-0 group-hover:opacity-20 animate-float`}
            style={{
              width: `${Math.random() * 40 + 20}px`,
              height: `${Math.random() * 40 + 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <div className={textColor}>{icon}</div>
          </div>
        </div>

        <h2 className={`text-3xl font-bold mb-2 transition-all duration-300 ${
          isHovered ? "scale-105" : "scale-100"
        } ${isDark ? "text-white" : "text-gray-900"}`}>
          {value}
        </h2>

        <p className={`text-sm transition-colors duration-300 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          {title}
        </p>

        <div className={`mt-4 h-1 rounded-full overflow-hidden ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
          <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000`} style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>
    </div>
  );
};

const SectionCard = ({ title, icon, children, isDark }) => (
  <div className={`rounded-2xl overflow-hidden transition-all duration-500 animate-slideUp ${
    isDark ? "bg-gray-800/70 shadow-lg" : "bg-white shadow-lg"
  }`}>
    <div className={`px-6 py-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
          {icon}
        </div>
        <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h2>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const DataTable = ({ headers, data, renderRow, onViewAll, onViewAllPrefetch, onRowAction, isDark }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
          {headers.map((header, idx) => (
            <th key={idx} className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.slice(0, 5).map((item, idx) => (
          <tr
            key={item.ticketId || item.paymentId || item.razorpayPaymentId || idx}
            className={`group transition-all duration-200 hover:bg-opacity-50 ${
              isDark ? "hover:bg-gray-700/50 border-b border-gray-700/50" : "hover:bg-gray-50 border-b border-gray-100"
            }`}
          >
            {renderRow(item)}
            <td className="py-3 px-4 text-right">
              <button
                onClick={() => onRowAction?.(item)}
                className={`p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                isDark ? "hover:bg-gray-700 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    
    <div className={`mt-4 pt-4 text-center border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
      <button
        onClick={onViewAll}
        onMouseEnter={onViewAllPrefetch}
        onFocus={onViewAllPrefetch}
        onTouchStart={onViewAllPrefetch}
        className={`inline-flex items-center gap-1 text-sm font-medium transition-all duration-200 hover:gap-2 ${
          isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"
        }`}
      >
        View All
        <ArrowUpRight className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, message, isDark }) => (
  <div className={`py-12 text-center rounded-xl ${isDark ? "bg-gray-700/30" : "bg-gray-50"}`}>
    <Icon className={`h-12 w-12 mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
    <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>{message}</p>
  </div>
);

const SkeletonCards = () => (
  <>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-40 rounded-2xl bg-gradient-to-br from-gray-200/40 to-gray-300/20 dark:from-gray-700/40 dark:to-gray-800/30 animate-pulse" />
    ))}
  </>
);

const SkeletonTable = ({ isDark }) => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className={`h-12 rounded ${isDark ? "bg-gray-700/40" : "bg-gray-100"}`} />
    ))}
  </div>
);

// Styles
const styles = `
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-10px) translateX(10px); }
}
.animate-slideUp { animation: slideUp 0.6s ease-out forwards; }
.animate-slideDown { animation: slideDown 0.6s ease-out forwards; }
.animate-float { animation: float 3s ease-in-out infinite; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default DashboardPage;
