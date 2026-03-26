import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  Filter,
  RefreshCcw,
  Search,
  User,
  Clock,
  FileText,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  getAllLogs,
  getMyLogs,
} from "../../api/AvtiveLogs.api";
import Lottie from "lottie-react";
import activityAnimation from "../../animations/time tracker.json";

const ITEMS_PER_PAGE = 10;
const ROLE_OPTIONS = ["ALL", "ADMIN", "ADMIN_STAFF", "FRANCHISE_ADMIN"];

// Shimmer Effect Component
const RowShimmer = ({ isDark, cols = 4 }) => (
  <tr className="animate-pulse">
    {[...Array(cols)].map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className={`h-4 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded`}></div>
      </td>
    ))}
  </tr>
);

const Logs = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("desc");

  /* ---------------- FETCH LOGS ---------------- */
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const isAdmin = ["ADMIN", "SUPER_ADMIN", "ADMIN_STAFF"].includes(user?.role);
      const res = isAdmin ? await getAllLogs() : await getMyLogs();
      setLogs(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /* ---------------- FILTER + SEARCH + SORT ---------------- */
  const filteredLogs = useMemo(() => {
    let result = logs.filter((log) => {
      const matchRole = roleFilter === "ALL" || log.actorRole === roleFilter;
      const matchSearch =
        log.actorName?.toLowerCase().includes(search.toLowerCase()) ||
        log.description?.toLowerCase().includes(search.toLowerCase()) ||
        log.module?.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    });

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [logs, search, roleFilter, sortOrder]);

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, sortOrder]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Section */}
      <div
        className={`rounded-2xl border backdrop-blur-sm
          ${isDark
            ? "bg-slate-900/50 border-slate-800/50"
            : "bg-white/80 border-gray-200/80 shadow-lg"
          }`}
      >
        <div className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: Animation + Title */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 md:w-24 md:h-24">
                <Lottie
                  animationData={activityAnimation}
                  loop
                  className="w-full h-full"
                />
              </div>
              
              <div className="space-y-2">
                <h1
                  className={`text-3xl md:text-4xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Activity Logs
                </h1>
                <p className={`text-sm flex items-center gap-2 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                  <Activity className="w-4 h-4" />
                  System activity & audit trail
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-3 w-full lg:w-auto">
              
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className={`rounded-xl border p-4
        ${isDark
          ? "bg-slate-900/30 border-slate-800/50"
          : "bg-white/50 border-gray-200"
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, action, or module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all duration-200 text-sm
                ${isDark
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-slate-600"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-400"
                } focus:ring-1 focus:ring-opacity-50 ${isDark ? "focus:ring-slate-600" : "focus:ring-gray-400"}`}
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`pl-10 pr-8 py-2.5 rounded-xl border outline-none transition-all duration-200 cursor-pointer text-sm
                ${isDark
                  ? "bg-slate-800 border-slate-700 text-white focus:border-slate-600"
                  : "bg-white border-gray-300 text-gray-900 focus:border-gray-400"
                } focus:ring-1 focus:ring-opacity-50 ${isDark ? "focus:ring-slate-600" : "focus:ring-gray-400"}`}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role === "ALL" ? "All Roles" : role.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Button */}
          <button
            onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm
              ${isDark
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchLogs}
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
        </div>
      </div>

      {/* Table Section */}
      <div className={`rounded-2xl border overflow-hidden shadow-lg
        ${isDark 
          ? "bg-slate-900 border-slate-800/50" 
          : "bg-white border-gray-200"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDark ? "bg-slate-800/60" : "bg-gray-50"}`}>
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Time</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>User</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  <span>Role</span>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Action</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-gray-100"}`}>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <RowShimmer key={i} isDark={isDark} cols={4} />
                ))
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Activity className={`w-12 h-12 ${isDark ? "text-slate-600" : "text-gray-400"}`} />
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                        No logs found matching your criteria
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => (
                  <tr 
                    key={log._id} 
                    className={`transition-all duration-200 ${
                      isDark 
                        ? "hover:bg-slate-800/40" 
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
                        <span className="text-sm">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isDark ? "bg-slate-700" : "bg-gray-100"
                        }`}>
                          <span className="text-sm font-medium">
                            {log.actorName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{log.actorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        isDark 
                          ? "bg-slate-700 text-slate-300" 
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {log.actorRole?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <Activity className={`w-4 h-4 mt-0.5 ${isDark ? "text-slate-500" : "text-gray-500"}`} />
                        <span className="text-sm">{log.description}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredLogs.length > 0 && (
          <div className={`p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4
            ${isDark ? "border-slate-800" : "border-gray-200"}`}
          >
            <div className="flex items-center gap-2">
              
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  currentPage === 1 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:scale-105 active:scale-95"
                } ${isDark
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
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
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-lg transition-all duration-200 text-sm ${
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
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  currentPage === totalPages 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:scale-105 active:scale-95"
                } ${isDark
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        tr {
          animation: fadeInUp 0.3s ease-out forwards;
          opacity: 0;
        }
        
        tr:nth-child(1) { animation-delay: 0.05s; }
        tr:nth-child(2) { animation-delay: 0.1s; }
        tr:nth-child(3) { animation-delay: 0.15s; }
        tr:nth-child(4) { animation-delay: 0.2s; }
        tr:nth-child(5) { animation-delay: 0.25s; }
      `}</style>
    </div>
  );
};

export default Logs;