import React, { useEffect, useMemo, useState } from "react";
import { LineChart } from "recharts/es6/chart/LineChart";
import { BarChart } from "recharts/es6/chart/BarChart";
import { Line } from "recharts/es6/cartesian/Line";
import { Bar } from "recharts/es6/cartesian/Bar";
import { XAxis } from "recharts/es6/cartesian/XAxis";
import { YAxis } from "recharts/es6/cartesian/YAxis";
import { CartesianGrid } from "recharts/es6/cartesian/CartesianGrid";
import { Tooltip } from "recharts/es6/component/Tooltip";
import { ResponsiveContainer } from "recharts/es6/component/ResponsiveContainer";
import { Legend } from "recharts/es6/component/Legend";
import { Cell } from "recharts/es6/component/Cell";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { getFranchiseReportSummary } from "../../api/reportapi";

const MONTH_OPTIONS = [
  { value: 3, label: "Last 3 months" },
  { value: 6, label: "Last 6 months" },
  { value: 12, label: "Last 12 months" },
  { value: 24, label: "Last 24 months" },
];

const formatMonthLabel = (value) => {
  if (!value || typeof value !== "string") return "—";
  const [year, month] = value.split("-").map(Number);
  if (!year || month < 1 || month > 12) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(
    new Date(year, month - 1, 1)
  );
};

// Custom colors for staff bars
const STAFF_COLORS = [
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#06b6d4", // cyan
  "#a855f7", // light purple
  "#ef4444", // red
  "#10b981", // emerald
];

const Reports = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [months, setMonths] = useState(6);

  const resolvedAccountId = useMemo(
    () => user?.accountId || user?.AccountId || user?.account_id || "",
    [user]
  );

  const cardBg = isDark ? "bg-slate-800/70 border-slate-700" : "bg-white border-gray-200 shadow-sm";
  const textColor = isDark ? "text-slate-100" : "text-gray-900";
  const mutedText = isDark ? "text-slate-400" : "text-gray-500";

  useEffect(() => {
    if (!resolvedAccountId) {
      setError("Cannot load reports — missing account information.");
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getFranchiseReportSummary({
          accountId: resolvedAccountId,
          months,
        });

        if (mounted) setSummary(data);
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.message || "Failed to load report data");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [resolvedAccountId, months]);

  const revenueData = useMemo(() => {
    return (summary?.monthlyRevenue ?? []).map((item) => ({
      period: formatMonthLabel(item.month),
      revenue: Number(item.totalAmount || 0),
    }));
  }, [summary]);

  const customerData = useMemo(() => {
    return (summary?.monthlyCustomers ?? []).map((item) => ({
      period: formatMonthLabel(item.month),
      customers: Number(item.totalCustomers || 0),
    }));
  }, [summary]);

  const supportData = useMemo(() => {
    return (summary?.resolvedTicketsByStaff ?? [])
      .map((item, idx) => ({
        staffId: item?._id ?? null,
        staffName: item?.staffName ?? "",
        staffEmail: item?.staffEmail ?? "",
        staffLabel:
          item?.staffName?.trim() ||
          item?.staffEmail?.trim() ||
          item?._id ||
          "Staff",
        resolved: Number(item?.resolvedCount || 0),
        color: STAFF_COLORS[idx % STAFF_COLORS.length],
      }))
      .sort((a, b) => b.resolved - a.resolved); // Sort by resolved count descending
  }, [summary]);

  const totalResolvedTickets = useMemo(() => {
    return supportData.reduce((sum, item) => sum + item.resolved, 0);
  }, [supportData]);

  const hasData = revenueData.length > 0 || customerData.length > 0 || supportData.length > 0;

  // Custom tooltip for staff chart
  const CustomStaffTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalResolvedTickets > 0 
        ? ((data.resolved / totalResolvedTickets) * 100).toFixed(1) 
        : 0;
      
          return (
        <div className={`p-3 rounded-lg border shadow-lg ${
          isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        }`}>
          <p className={`font-medium ${textColor}`}>{data.staffLabel}</p>
          {(data.staffEmail || data.staffId) && (
            <p className={`text-xs ${mutedText}`}>
              {data.staffEmail || data.staffId}
            </p>
          )}
          <p className={`text-sm ${mutedText}`}>
            Resolved: <span className="font-semibold text-purple-500">{data.resolved} tickets</span>
          </p>
          <p className={`text-xs ${mutedText}`}>
            {percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className={`text-2xl md:text-3xl font-bold ${textColor}`}>
          Reports & Analytics
        </h1>

        <div className="flex items-center gap-3">
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            disabled={loading}
            className={`px-3 py-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              isDark
                ? "bg-slate-800 border-slate-600 text-slate-200"
                : "bg-white border-gray-300 text-gray-700"
            }`}
          >
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setMonths(months)}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              loading
                ? "opacity-50 cursor-not-allowed"
                : isDark
                ? "bg-slate-700 hover:bg-slate-600 text-slate-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div
          className={`rounded-xl px-5 py-3 border ${
            isDark
              ? "bg-red-900/30 border-red-800/50 text-red-200"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className={`rounded-xl p-5 border ${cardBg}`}>
          <p className={`text-sm font-medium ${mutedText}`}>New Customers</p>
          <p className={`mt-2 text-3xl font-bold ${textColor}`}>
            {loading ? "—" : Number(summary?.customersCreatedThisMonth ?? 0).toLocaleString()}
          </p>
          <p className={`mt-1 text-xs ${mutedText}`}>This month</p>
        </div>

        <div className={`rounded-xl p-5 border ${cardBg}`}>
          <p className={`text-sm font-medium ${mutedText}`}>Resolved Tickets</p>
          <p className={`mt-2 text-3xl font-bold ${textColor}`}>
            {loading ? "—" : Number(summary?.resolvedTicketsThisMonth ?? 0).toLocaleString()}
          </p>
          <p className={`mt-1 text-xs ${mutedText}`}>This month</p>
        </div>

      

      
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`h-80 rounded-xl ${cardBg} animate-pulse`} />
          <div className={`h-80 rounded-xl ${cardBg} animate-pulse`} />
          <div className={`h-96 lg:col-span-2 rounded-xl ${cardBg} animate-pulse`} />
        </div>
      ) : !hasData && !error ? (
        <div className={`rounded-xl p-10 text-center border ${cardBg}`}>
          <p className={`text-lg font-medium ${mutedText}`}>
            No data available for the selected period.
          </p>
          <p className={`mt-2 ${mutedText}`}>Try increasing the time range or check later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Line Chart */}
          <div className={`p-5 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold text-lg ${textColor}`}>Revenue Trend</h3>
              <span className={`text-sm ${mutedText}`}>Last {months} months</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} opacity={0.5} />
                <XAxis dataKey="period" stroke={isDark ? "#94a3b8" : "#64748b"} />
                <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1e293b" : "#ffffff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    color: isDark ? "#e2e8f0" : "#1e293b",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#3b82f6" }}
                  activeDot={{ r: 6, fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
            {revenueData.length === 0 && (
              <p className={`mt-4 text-sm text-center ${mutedText}`}>No revenue data yet</p>
            )}
          </div>

          {/* Customer Bar Chart */}
          <div className={`p-5 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold text-lg ${textColor}`}>New Customers</h3>
              <span className={`text-sm ${mutedText}`}>Per month</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} opacity={0.5} />
                <XAxis dataKey="period" stroke={isDark ? "#94a3b8" : "#64748b"} />
                <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1e293b" : "#ffffff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    color: isDark ? "#e2e8f0" : "#1e293b",
                    borderRadius: "8px",
                  }}
                />
                <Bar 
                  dataKey="customers" 
                  fill="#22c55e" 
                  radius={[6, 6, 0, 0]} 
                  name="New Customers"
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
            {customerData.length === 0 && (
              <p className={`mt-4 text-sm text-center ${mutedText}`}>No customer data yet</p>
            )}
          </div>

          {/* Support Performance - Improved */}
          <div className={`p-5 rounded-xl border lg:col-span-2 ${cardBg}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold text-lg ${textColor}`}>🎯 Tickets Resolved by Staff</h3>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${mutedText}`}>
                  Total: {totalResolvedTickets} tickets
                </span>
              </div>
            </div>
            
            {supportData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={Math.max(300, supportData.length * 50)}>
                  <BarChart 
                    data={supportData} 
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={isDark ? "#334155" : "#e2e8f0"} 
                      opacity={0.5} 
                      horizontal={true}
                      vertical={false}
                    />
                    <XAxis 
                      type="number" 
                      stroke={isDark ? "#94a3b8" : "#64748b"}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="staffLabel" 
                      stroke={isDark ? "#94a3b8" : "#64748b"}
                      width={120}
                      tick={{ fontSize: 12, fill: isDark ? "#94a3b8" : "#64748b" }}
                    />
                    <Tooltip content={<CustomStaffTooltip />} />
                    <Bar 
                      dataKey="resolved" 
                      radius={[0, 6, 6, 0]}
                      maxBarSize={30}
                    >
                      {supportData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Staff Performance Summary */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {supportData.slice(0, 4).map((staff, idx) => {
                    const percentage = ((staff.resolved / totalResolvedTickets) * 100).toFixed(1);
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg border ${isDark ? "border-slate-700" : "border-gray-200"}`}
                        style={{ borderLeftWidth: "4px", borderLeftColor: staff.color }}
                      >
                        <p className={`text-sm font-medium truncate ${textColor}`}>{staff.staffLabel}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-lg font-bold ${textColor}`}>{staff.resolved}</span>
                          <span className={`text-xs ${mutedText}`}>{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {supportData.length > 4 && (
                  <p className={`mt-2 text-xs text-right ${mutedText}`}>
                    +{supportData.length - 4} more staff members
                  </p>
                )}
              </>
            ) : (
              <div className={`py-10 text-center ${mutedText}`}>
                No ticket resolution data available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
