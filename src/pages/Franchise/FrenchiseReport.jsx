import React, { useEffect, useMemo, useState } from "react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { getReportSummary } from "../../api/reportapi";

const formatMonthLabel = (value) => {
    if (!value || typeof value !== "string") return "--";
    const [yearRaw, monthRaw] = value.split("-");
    const year = Number(yearRaw);
    const monthIndex = Number(monthRaw) - 1;
    if (!year || monthIndex < 0 || monthIndex > 11) return value;
    const date = new Date(year, monthIndex, 1);
    return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
};

const Reports = () => {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const months = 3;

    const resolvedAccountId = useMemo(() => {
        if (!user) return "";
        return (
            user.accountId ||
            user.AccountId ||
            user.account_id ||
            ""
        );
    }, [user]);

    const cardStyle = isDark
        ? "bg-slate-900 border-slate-800"
        : "bg-white border-gray-200";

    const titleStyle = isDark ? "text-white" : "text-gray-900";

    useEffect(() => {
        const loadReport = async () => {
            try {
                setLoading(true);
                setError("");

                if (!resolvedAccountId) {
                    setSummary(null);
                    setError("Missing account information to load reports.");
                    return;
                }

                const data = await getReportSummary({
                    accountId: resolvedAccountId || undefined,
                    months,
                });

                setSummary(data || null);
            } catch (err) {
                setSummary(null);
                setError(err?.response?.data?.message || err?.message || "Failed to load reports");
            } finally {
                setLoading(false);
            }
        };

        loadReport();
    }, [resolvedAccountId, months]);

    const revenueData = useMemo(() => {
        const rows = Array.isArray(summary?.monthlyRevenue) ? summary.monthlyRevenue : [];
        return rows.map((item) => ({
            period: formatMonthLabel(item.month),
            revenue: Number(item.totalAmount || 0),
        }));
    }, [summary]);

    const customerData = useMemo(() => {
        const rows = Array.isArray(summary?.monthlyCustomers) ? summary.monthlyCustomers : [];
        return rows.map((item) => ({
            period: formatMonthLabel(item.month),
            customers: Number(item.totalCustomers || 0),
        }));
    }, [summary]);

    const supportData = useMemo(() => {
        const rows = Array.isArray(summary?.resolvedTicketsByStaff) ? summary.resolvedTicketsByStaff : [];
        return rows.map((item, index) => ({
            staff: item?._id || `Staff ${index + 1}`,
            resolved: Number(item?.resolvedCount || 0),
        }));
    }, [summary]);

    return (
        <div className="space-y-6">

            {/* Header */}
            <div>
                <h1 className={`text-2xl font-bold ${titleStyle}`}>Reports & Analytics</h1>

            </div>

            {error && (
                <div className={`rounded-lg px-4 py-2 text-sm border ${isDark ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-red-50 border-red-200 text-red-700"}`}>
                    {error}
                </div>
            )}

            <div className="grid grid-cols-12 gap-6">
                <div className={`col-span-12 md:col-span-6 p-4 rounded-xl border ${cardStyle}`}>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>Customers Created (This Month)</p>
                    <p className={`mt-2 text-2xl font-bold ${titleStyle}`}>
                        {Number(summary?.customersCreatedThisMonth || 0)}
                    </p>
                </div>
                <div className={`col-span-12 md:col-span-6 p-4 rounded-xl border ${cardStyle}`}>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>Resolved Tickets (This Month)</p>
                    <p className={`mt-2 text-2xl font-bold ${titleStyle}`}>
                        {Number(summary?.resolvedTicketsThisMonth || 0)}
                    </p>
                </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-12 gap-6">

                {/* Revenue Report */}
                <div className={`col-span-12 lg:col-span-6 p-4 rounded-xl border ${cardStyle}`}>
                    <h3 className={`font-semibold mb-3 ${titleStyle}`}>
                        Revenue Growth (Monthly)
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                    {!loading && revenueData.length === 0 && (
                        <p className={`mt-3 text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>No revenue data available.</p>
                    )}
                </div>

                {/* Churn Analysis */}
                <div className={`col-span-12 lg:col-span-6 p-4 rounded-xl border ${cardStyle}`}>
                    <h3 className={`font-semibold mb-3 ${titleStyle}`}>
                        Customer Growth (Monthly)
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={customerData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="customers" fill="#22c55e" name="New Customers" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    {!loading && customerData.length === 0 && (
                        <p className={`mt-3 text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>No customer data available.</p>
                    )}
                </div>

                {/* Support Performance */}
                <div className={`col-span-12 p-4 rounded-xl border ${cardStyle}`}>
                    <h3 className={`font-semibold mb-3 ${titleStyle}`}>
                        Resolved Tickets By Staff
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={supportData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="staff" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="resolved" fill="#a855f7" name="Resolved Tickets" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    {!loading && supportData.length === 0 && (
                        <p className={`mt-3 text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>No ticket data available.</p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Reports;
