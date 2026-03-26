import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  Filter,
  RefreshCcw,
  Search,
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

const Logs = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  /* ---------------- FETCH LOGS ---------------- */
  const fetchLogs = async () => {
  try {
    setLoading(true);

    const isAdmin = ["ADMIN", "SUPER_ADMIN", "ADMIN_STAFF"].includes(user?.role);

    const res = isAdmin
      ? await getAllLogs()
      : await getMyLogs();

    setLogs(res.data.data || []);
  } catch (err) {
    console.error("Failed to fetch logs", err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchLogs();
  }, [user]);

  /* ---------------- FILTER + SEARCH ---------------- */
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchRole =
        roleFilter === "ALL" || log.actorRole === roleFilter;

      const matchSearch =
        log.actorName?.toLowerCase().includes(search.toLowerCase()) ||
        log.description?.toLowerCase().includes(search.toLowerCase()) ||
        log.module?.toLowerCase().includes(search.toLowerCase());

      return matchRole && matchSearch;
    });
  }, [logs, search, roleFilter]);

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-6">

      {/* HEADER */}
    {/* ================= HEADER ================= */}
<div
  className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border
    ${isDark
      ? "bg-slate-900 border-slate-800"
      : "bg-white border-gray-200"
    }`}
>
  {/* LEFT: Animation + Logo */}
  <div className="flex items-center gap-4">
    {/* Animation */}
  <div className="w-24 h-24 md:w-28 md:h-28">
  <Lottie
    animationData={activityAnimation}
    loop
    className="w-full h-full"
  />
</div>


    {/* Logo */}
    <div className="flex flex-col">
      <h1
        className={`text-2xl font-bold tracking-tight
          ${isDark ? "text-white" : "text-gray-900"}`}
      >
        Activline Logs
      </h1>
      <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
        System activity & audit trail
      </p>
    </div>
  </div>

  {/* RIGHT: Search + Filter + Refresh */}
  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">

    {/* SEARCH */}
    <div className="relative w-full md:w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Search logs..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
        className={`w-full pl-10 pr-4 py-2 rounded-lg border outline-none transition
          ${isDark
            ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
          }`}
      />
    </div>

    {/* ROLE FILTER */}
    <div className="relative">
      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <select
        value={roleFilter}
        onChange={(e) => {
          setRoleFilter(e.target.value);
          setCurrentPage(1);
        }}
        className={`pl-10 pr-4 py-2 rounded-lg border outline-none transition
          ${isDark
            ? "bg-slate-800 border-slate-700 text-white"
            : "bg-white border-gray-300 text-gray-900"
          }`}
      >
        {ROLE_OPTIONS.map((role) => (
          <option key={role} value={role}>
            {role === "ALL" ? "All Roles" : role.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>

    {/* REFRESH */}
    <button
      onClick={fetchLogs}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition font-medium
        ${isDark
          ? "border-slate-700 text-slate-300 hover:bg-slate-800"
          : "border-gray-300 text-gray-700 hover:bg-gray-100"
        }`}
    >
      <RefreshCcw className="w-4 h-4" />
      Refresh
    </button>
  </div>
</div>


      {/* TABLE */}
      <div className={`rounded-xl border overflow-hidden
        ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}
      >
        <table className="w-full text-left">
          <thead className={isDark ? "bg-slate-800/60" : "bg-gray-50"}>
            <tr>
              <th className="px-6 py-3 text-sm font-semibold">Time</th>
              <th className="px-6 py-3 text-sm font-semibold">User</th>
              <th className="px-6 py-3 text-sm font-semibold">Role</th>
              <th className="px-6 py-3 text-sm font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className={isDark ? "divide-y divide-slate-800" : "divide-y divide-gray-100"}>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center">Loading logs...</td>
              </tr>
            ) : paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center">No logs found</td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr key={log._id} className={isDark ? "hover:bg-slate-800/40" : "hover:bg-gray-50"}>
                  <td className="px-6 py-4">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    {log.actorName}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {log.actorRole}
                  </td>
                  <td className="px-6 py-4">
                    {log.description}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className={`p-4 border-t flex justify-between items-center
          ${isDark ? "border-slate-800" : "border-gray-200"}`}
        >
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded border"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded border"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
