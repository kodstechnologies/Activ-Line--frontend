import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  MapPin,
  Calendar,
  X,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  getRelocationsApi,
  updateRelocationApi,
  deleteRelocationApi,
} from "../../../api/relocation.api";

// Shimmer Effect Component
const RowShimmer = ({ isDark }) => (
  <tr className="animate-pulse border-b border-transparent">
    {/* Customer Details */}
    <td className="px-4 py-3 sm:px-6 sm:py-4">
      <div className="space-y-2">
        <div className={`h-4 w-28 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded`}></div>
        <div className={`h-3 w-36 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded`}></div>
        <div className={`h-3 w-24 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded`}></div>
      </div>
    </td>

    {/* Franchise & Group */}
    <td className="px-4 py-3 sm:px-6 sm:py-4">
      <div className="space-y-2">
        <div className={`h-5 w-24 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded-full`}></div>
        <div className={`h-3 w-20 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded`}></div>
      </div>
    </td>

    {/* Relocation Location */}
    <td className="px-4 py-3 sm:px-6 sm:py-4">
      <div className="space-y-2">
        <div className={`h-4 w-32 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded`}></div>
        <div className={`h-3 w-40 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded`}></div>
        <div className="flex gap-2 pt-1">
          <div className={`h-4 w-16 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded`}></div>
          <div className={`h-4.5 w-5 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded`}></div>
          <div className={`h-4.5 w-5 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded`}></div>
        </div>
      </div>
    </td>

    {/* Shifting Date */}
    <td className="px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center gap-2">
        <div className={`w-3.5 h-3.5 rounded-full ${isDark ? "bg-slate-800" : "bg-gray-200"}`}></div>
        <div className={`h-3.5 w-16 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded`}></div>
      </div>
    </td>

    {/* Actions */}
    <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
      <div className="flex items-center justify-end gap-2.5">
        <div className={`h-8 w-20 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded-xl`}></div>
        <div className={`h-8 w-20 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded-xl`}></div>
      </div>
    </td>
  </tr>
);

const RelocationPage = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("REQUEST"); // "REQUEST", "PENDING", "COMPLETED"
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id of current item in action

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null); // for view details modal
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    subMessage: "",
    confirmText: "",
    confirmColor: "from-blue-600 to-indigo-600",
    icon: null,
    onConfirm: null,
  });

  const [copiedId, setCopiedId] = useState(null);

  const handleCopyLink = (id, lat, lng, e) => {
    if (e) e.stopPropagation();
    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    navigator.clipboard.writeText(mapUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchRelocations = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const params = {
        page: currentPage,
        limit,
        status: activeTab,
      };

      const res = await getRelocationsApi(params);
      const dataPayload = res?.data || res || {};
      const list = dataPayload.items || [];
      const meta = dataPayload.meta || {};

      setItems(list);
      setTotalItems(meta.total || list.length);
      setTotalPages(meta.totalPages || 1);
    } catch (err) {
      console.error("Failed to load relocations", err);
      setErrorMsg(
        err.response?.data?.message ||
          err.message ||
          "Failed to load relocation requests",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, activeTab]);

  useEffect(() => {
    fetchRelocations();
  }, [fetchRelocations]);

  const handleApprove = (id, e) => {
    if (e) e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: "Approve Relocation",
      message: "Are you sure you want to approve this relocation request?",
      subMessage: "The request status will be updated to Pending.",
      confirmText: "Yes, Approve",
      confirmColor: "from-emerald-600 to-teal-600",
      icon: <CheckCircle className="w-6 h-6 text-emerald-500" />,
      onConfirm: async () => {
        try {
          setActionLoading(id);
          await updateRelocationApi(id, { status: "PENDING" });
          setSelectedRequest(null);
          fetchRelocations();
        } catch (err) {
          console.error(err);
          alert(
            "Approval failed: " + (err.response?.data?.message || err.message),
          );
        } finally {
          setActionLoading(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleReject = (id, e) => {
    if (e) e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: "Reject Relocation",
      message:
        "Are you sure you want to reject and remove this relocation request?",
      subMessage: "This request will be permanently deleted from the database.",
      confirmText: "Yes, Reject Permanently",
      confirmColor: "from-red-600 to-pink-600",
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      onConfirm: async () => {
        try {
          setActionLoading(id);
          await deleteRelocationApi(id);
          setSelectedRequest(null);
          fetchRelocations();
        } catch (err) {
          console.error(err);
          alert(
            "Rejection failed: " + (err.response?.data?.message || err.message),
          );
        } finally {
          setActionLoading(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleComplete = (id, e) => {
    if (e) e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: "Complete Relocation",
      message: "Are you sure you want to mark this relocation as completed?",
      subMessage: "The request status will be updated to Completed.",
      confirmText: "Yes, Complete",
      confirmColor: "from-emerald-600 to-teal-600",
      icon: <CheckCircle className="w-6 h-6 text-emerald-500" />,
      onConfirm: async () => {
        try {
          setActionLoading(id);
          await updateRelocationApi(id, { status: "COMPLETED" });
          setSelectedRequest(null);
          fetchRelocations();
        } catch (err) {
          console.error(err);
          alert(
            "Completion failed: " +
              (err.response?.data?.message || err.message),
          );
        } finally {
          setActionLoading(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const filteredItems = items.filter((item) => {
    const custName =
      `${item.userId?.firstName || ""} ${item.userId?.lastName || ""}`.toLowerCase();
    const custEmail = (item.userId?.emailId || "").toLowerCase();
    const custPhone = (item.userId?.phoneNumber || "").toLowerCase();
    const city = (item.installation_address_city || "").toLowerCase();
    const sTerm = searchTerm.toLowerCase();

    return (
      custName.includes(sTerm) ||
      custEmail.includes(sTerm) ||
      custPhone.includes(sTerm) ||
      city.includes(sTerm)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2
            className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Relocation Requests
          </h2>
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}
          >
            Manage and track active customer home shifting and address updates
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? "text-slate-400" : "text-gray-400"
            }`}
          />
          <input
            type="text"
            placeholder="Search relocations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none transition-all duration-200
              focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
              ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              }`}
          />
        </div>
      </div>

      {/* Tabs */}
      <div
        className={`scrollbar-hide flex overflow-x-auto whitespace-nowrap hide-scrollbar border-b ${isDark ? "border-slate-800" : "border-gray-200"}`}
      >
        {[
          { key: "REQUEST", label: "Requests" },
          { key: "PENDING", label: "Pending" },
          { key: "COMPLETED", label: "Completed" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setCurrentPage(1);
            }}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all duration-300 relative flex-shrink-0
              ${
                activeTab === tab.key
                  ? isDark
                    ? "border-blue-500 text-blue-400"
                    : "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Boundary banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Main List */}
      <div
        className={`rounded-xl border overflow-hidden transition-all duration-300
          ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-gray-200"}`}
      >
        {loading || filteredItems.length > 0 ? (
          <div className="scrollbar-hide overflow-x-auto pb-4">
            <table className="w-full min-w-[1000px] text-left border-collapse">
              <thead>
                <tr
                  className={`border-b text-xs font-semibold uppercase tracking-wider
                    ${
                      isDark
                        ? "bg-slate-900/50 border-slate-800 text-slate-400"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                >
                  <th className="px-4 py-3 sm:px-6 sm:py-4">
                    Customer Details
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">
                    Franchise & Group
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">
                    Relocation Location
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">Shifting Date</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {loading ? (
                  [...Array(limit || 10)].map((_, i) => (
                    <RowShimmer key={i} isDark={isDark} />
                  ))
                ) : (
                  filteredItems.map((item) => {
                    const name =
                      `${item.userId?.firstName || ""} ${item.userId?.lastName || ""}`.trim() ||
                      item.userId?.userName ||
                      "N/A";
                    const email = item.userId?.emailId || "N/A";
                    const phone = item.userId?.phoneNumber || "N/A";

                    return (
                      <tr
                        key={item._id}
                        className={`text-sm transition-all duration-200 hover:bg-blue-500/[0.02]
                          ${isDark ? "text-slate-300 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
                      >
                        {/* Customer contact Info */}
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <div>
                            <p className="font-semibold">{name}</p>
                            <p
                              className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}
                            >
                              {email}
                            </p>
                            <p
                              className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}
                            >
                              {phone}
                            </p>
                          </div>
                        </td>

                        {/* Group and AccountId */}
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                              ${
                                isDark
                                  ? "bg-slate-800 border-slate-700 text-slate-300"
                                  : "bg-gray-50 border-gray-200 text-gray-600"
                              }`}
                          >
                            Franchise: {item.accountId}
                          </span>
                          <p
                            className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}
                          >
                            Group ID: {item.userGroupId}
                          </p>
                        </td>

                        {/* Address */}
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <p className="font-medium">
                            {item.installation_address_city}
                          </p>
                          <p
                            className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}
                          >
                            PIN: {item.installation_address_pin} •{" "}
                            {item.installation_address_state}
                          </p>
                          {item.latitude && item.longitude && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border
                                ${
                                  isDark
                                    ? "bg-slate-800/80 border-slate-700 text-slate-400"
                                    : "bg-gray-100 border-gray-200 text-gray-600"
                                }`}
                              >
                                {item.latitude.toFixed(4)},{" "}
                                {item.longitude.toFixed(4)}
                              </span>
                              <button
                                onClick={(e) =>
                                  handleCopyLink(
                                    item._id,
                                    item.latitude,
                                    item.longitude,
                                    e,
                                  )
                                }
                                title="Copy Google Maps Link"
                                className={`p-1 rounded transition-all duration-200 hover:scale-110 active:scale-90
                                  ${
                                    isDark
                                      ? "hover:bg-slate-800 hover:text-white text-slate-400"
                                      : "hover:bg-gray-100 hover:text-gray-900 text-gray-500"
                                  }`}
                              >
                                {copiedId === item._id ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <a
                                href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Open in Google Maps"
                                className={`p-1 rounded transition-all duration-200 hover:scale-110 active:scale-90
                                  ${
                                    isDark
                                      ? "hover:bg-slate-800 hover:text-white text-slate-400"
                                      : "hover:bg-gray-100 hover:text-gray-900 text-gray-500"
                                  }`}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </td>

                        {/* Shift Date */}
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span>
                              {new Date(item.sifted_date).toLocaleDateString()}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            {/* View details */}
                            <button
                              onClick={() => setSelectedRequest(item)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold shadow-sm transition-all duration-200 hover:scale-105 active:scale-95
                                ${
                                  isDark
                                    ? "bg-slate-800/80 border-slate-700 hover:bg-slate-700/80 text-blue-400 hover:text-blue-300"
                                    : "bg-white border-gray-200 hover:bg-gray-50 text-blue-600 hover:text-blue-700"
                                }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Details</span>
                            </button>

                            {/* REQUEST TAB controls */}
                            {activeTab === "REQUEST" && (
                              <>
                                <button
                                  disabled={actionLoading === item._id}
                                  onClick={(e) => handleApprove(item._id, e)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                  {actionLoading === item._id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  )}
                                  <span>Approve</span>
                                </button>

                                <button
                                  disabled={actionLoading === item._id}
                                  onClick={(e) => handleReject(item._id, e)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-rose-500/10 hover:shadow-rose-500/25 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                  {actionLoading === item._id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5" />
                                  )}
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {/* PENDING TAB controls */}
                            {activeTab === "PENDING" && (
                              <>
                                <button
                                  disabled={actionLoading === item._id}
                                  onClick={(e) => handleComplete(item._id, e)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                  {actionLoading === item._id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  )}
                                  <span>Complete</span>
                                </button>

                                <button
                                  disabled={actionLoading === item._id}
                                  onClick={(e) => handleReject(item._id, e)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-rose-500/10 hover:shadow-rose-500/25 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                  {actionLoading === item._id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5" />
                                  )}
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin
              className={`w-12 h-12 mb-3 ${isDark ? "text-slate-700" : "text-gray-300"}`}
            />
            <p
              className={`text-base font-semibold ${isDark ? "text-slate-300" : "text-gray-700"}`}
            >
              No relocation records found
            </p>
            <p
              className={`text-xs ${isDark ? "text-slate-500" : "text-gray-400"} mt-1`}
            >
              No requests are currently logged under the selected state.
            </p>
          </div>
        )}
      </div>

      {/* Pagination panel */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p
            className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}
          >
            Showing {filteredItems.length} of {totalItems} items
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border transition-all duration-200 disabled:opacity-40
                ${
                  isDark
                    ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                    : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200
                  ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : isDark
                        ? "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                        : "bg-gray-100 hover:bg-gray-250 text-gray-700"
                  }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border transition-all duration-200 disabled:opacity-40
                ${
                  isDark
                    ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                    : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* View Details Centered Modal Dialog */}
      {selectedRequest &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div
              className={`w-full max-w-4xl rounded-2xl border p-4 sm:p-6 md:p-8 overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300
              ${isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-gray-200 text-gray-900"}`}
            >
              <button
                onClick={() => setSelectedRequest(null)}
                className={`absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full border transition-all duration-200 hover:scale-115
                ${
                  isDark
                    ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-500"
                }`}
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-4 sm:mb-6 bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent pr-8">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                <span>Relocation Request Details</span>
              </h3>

              {/* Content list */}
              <div className="hide-scrollbar space-y-6 text-sm max-h-[75vh] overflow-y-auto overflow-x-hidden  pr-2 scrollbar-thin">
                {/* Customer */}
                <div
                  className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-800/80" : "bg-gray-50 border-gray-200"}`}
                >
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">
                    Customer Profile
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                    <div>
                      <span
                        className={`text-[11px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
                      >
                        Name
                      </span>
                      <p className="font-semibold text-sm">
                        {`${selectedRequest.userId?.firstName || ""} ${selectedRequest.userId?.lastName || ""}`.trim() ||
                          selectedRequest.userId?.userName ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`text-[11px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
                      >
                        Email ID
                      </span>
                      <p className="font-semibold text-xs mt-0.5">
                        {selectedRequest.userId?.emailId || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`text-[11px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
                      >
                        Phone Number
                      </span>
                      <p className="font-semibold text-xs mt-0.5">
                        {selectedRequest.userId?.phoneNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* COMPARATIVE ADDRESSES SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Existing Address */}
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? "bg-slate-800/40 border-slate-800/80" : "bg-amber-50/30 border-amber-200"}`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-3">
                        Previous / Existing Address
                      </p>
                      {selectedRequest.userId?.installationAddress ? (
                        <div className="space-y-2 text-xs">
                          <p>
                            <span
                              className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                            >
                              Line:
                            </span>
                            {selectedRequest.userId.installationAddress.line2 ||
                              "N/A"}
                          </p>
                          <p>
                            <span
                              className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                            >
                              City:
                            </span>
                            {selectedRequest.userId.installationAddress.city ||
                              "N/A"}
                          </p>
                          <p>
                            <span
                              className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                            >
                              State:
                            </span>
                            {selectedRequest.userId.installationAddress.state ||
                              "N/A"}
                          </p>
                          <p>
                            <span
                              className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                            >
                              PIN:
                            </span>
                            {selectedRequest.userId.installationAddress.pin ||
                              "N/A"}
                          </p>
                          <p>
                            <span
                              className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                            >
                              Country:
                            </span>
                            {selectedRequest.userId.installationAddress
                              .country || "IN"}
                          </p>
                        </div>
                      ) : selectedRequest.userId?.address ? (
                        <div className="space-y-2 text-xs">
                          <p>
                            <span
                              className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                            >
                              Line:
                            </span>
                            {selectedRequest.userId.address.line1 || "N/A"}
                          </p>
                          <p>
                            <span
                              className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                            >
                              City:
                            </span>
                            {selectedRequest.userId.address.city || "N/A"}
                          </p>
                          <p>
                            <span
                              className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                            >
                              State:
                            </span>
                            {selectedRequest.userId.address.state || "N/A"}
                          </p>
                          <p>
                            <span
                              className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                            >
                              PIN:
                            </span>
                            {selectedRequest.userId.address.pin || "N/A"}
                          </p>
                          <p>
                            <span
                              className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                            >
                              Country:
                            </span>
                            {selectedRequest.userId.address.country || "IN"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          No existing address found
                        </p>
                      )}
                    </div>

                    {/* Existing Address Map Actions */}
                    {(() => {
                      const lat =
                        selectedRequest.userId?.installationAddress?.latitude ||
                        selectedRequest.userId?.address?.latitude;
                      const lng =
                        selectedRequest.userId?.installationAddress
                          ?.longitude ||
                        selectedRequest.userId?.address?.longitude;
                      if (!lat || !lng) return null;
                      return (
                        <div className="mt-4 pt-3 border-t border-slate-700/30 flex flex-col gap-2">
                          <span
                            className={`text-[10px] font-mono font-semibold truncate ${isDark ? "text-slate-400" : "text-gray-500"}`}
                          >
                            Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) =>
                                handleCopyLink(
                                  selectedRequest._id + "_prev_modal",
                                  lat,
                                  lng,
                                  e,
                                )
                              }
                              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                                ${
                                  isDark
                                    ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-blue-400"
                                    : "bg-white border-gray-200 hover:bg-gray-50 text-blue-600"
                                }`}
                            >
                              {copiedId ===
                              selectedRequest._id + "_prev_modal" ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500">
                                    Copied!
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>
                            <a
                              href={`https://www.google.com/maps?q=${lat},${lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Open Map</span>
                            </a>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* New Relocated Address */}
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? "bg-slate-800/40 border-slate-800/80" : "bg-blue-50/30 border-blue-200"}`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-500 uppercase tracking-wider mb-3">
                        New Relocated Address
                      </p>
                      <div className="space-y-2 text-xs">
                        <p>
                          <span
                            className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                          >
                            Line:
                          </span>
                          {selectedRequest.installation_address_line2 || "N/A"}
                        </p>
                        <p>
                          <span
                            className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                          >
                            City:
                          </span>
                          {selectedRequest.installation_address_city || "N/A"}
                        </p>
                        <p>
                          <span
                            className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                          >
                            State:
                          </span>
                          {selectedRequest.installation_address_state || "N/A"}
                        </p>
                        <p>
                          <span
                            className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                          >
                            PIN:
                          </span>
                          {selectedRequest.installation_address_pin || "N/A"}
                        </p>
                        <p>
                          <span
                            className={`font-medium ${isDark ? "text-slate-500" : "text-gray-400"} mr-1`}
                          >
                            Country:
                          </span>
                          {selectedRequest.installation_address_country ||
                            "N/A"}
                        </p>
                        <p className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Shifting:{" "}
                            {new Date(
                              selectedRequest.sifted_date,
                            ).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* New Relocated Address Map Actions */}
                    {selectedRequest.latitude && selectedRequest.longitude && (
                      <div className="mt-4 pt-3 border-t border-slate-700/30 flex flex-col gap-2">
                        <span
                          className={`text-[10px] font-mono font-semibold truncate ${isDark ? "text-slate-400" : "text-gray-500"}`}
                        >
                          Coordinates: {selectedRequest.latitude.toFixed(4)},{" "}
                          {selectedRequest.longitude.toFixed(4)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) =>
                              handleCopyLink(
                                selectedRequest._id + "_new_modal",
                                selectedRequest.latitude,
                                selectedRequest.longitude,
                                e,
                              )
                            }
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                              ${
                                isDark
                                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-blue-400"
                                  : "bg-white border-gray-200 hover:bg-gray-50 text-blue-600"
                              }`}
                          >
                            {copiedId === selectedRequest._id + "_new_modal" ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500">
                                  Copied!
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                          <a
                            href={`https://www.google.com/maps?q=${selectedRequest.latitude},${selectedRequest.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open Map</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical properties */}
                <div
                  className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-800/80" : "bg-gray-50 border-gray-200"}`}
                >
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">
                    Technical Mapping Details
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span
                        className={`text-[11px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
                      >
                        Franchise ID
                      </span>
                      <p className="font-semibold text-xs mt-0.5">
                        {selectedRequest.accountId}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`text-[11px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
                      >
                        User Group ID
                      </span>
                      <p className="font-semibold text-xs mt-0.5">
                        {selectedRequest.userGroupId}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`text-[11px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
                      >
                        Latitude
                      </span>
                      <p className="font-semibold text-xs mt-0.5">
                        {selectedRequest.latitude || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`text-[11px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
                      >
                        Longitude
                      </span>
                      <p className="font-semibold text-xs mt-0.5">
                        {selectedRequest.longitude || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status & Actions Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-slate-800/50 mt-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}
                    >
                      Current Log Status:
                    </span>
                    <span
                      className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold uppercase border
                      ${
                        selectedRequest.status === "COMPLETED"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : selectedRequest.status === "PENDING"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      }`}
                    >
                      {selectedRequest.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 justify-end">
                    {selectedRequest.status === "REQUEST" && (
                      <>
                        <button
                          disabled={actionLoading === selectedRequest._id}
                          onClick={() => handleReject(selectedRequest._id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all duration-200 disabled:opacity-50"
                        >
                          {actionLoading === selectedRequest._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          <span>Reject</span>
                        </button>

                        <button
                          disabled={actionLoading === selectedRequest._id}
                          onClick={() => handleApprove(selectedRequest._id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all duration-200 disabled:opacity-50"
                        >
                          {actionLoading === selectedRequest._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          <span>Approve</span>
                        </button>
                      </>
                    )}

                    {selectedRequest.status === "PENDING" && (
                      <>
                        <button
                          disabled={actionLoading === selectedRequest._id}
                          onClick={() => handleReject(selectedRequest._id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all duration-200 disabled:opacity-50"
                        >
                          {actionLoading === selectedRequest._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          <span>Reject Request</span>
                        </button>

                        <button
                          disabled={actionLoading === selectedRequest._id}
                          onClick={() => handleComplete(selectedRequest._id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all duration-200 disabled:opacity-50"
                        >
                          {actionLoading === selectedRequest._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          <span>Complete Relocation</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Dynamic Confirm/Delete Modal */}
      {createPortal(
        <AnimatePresence>
          {confirmModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border
                  ${
                    isDark
                      ? "bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white"
                      : "bg-gradient-to-br from-white to-gray-50 border-gray-200 text-gray-900"
                  }
                `}
              >
                {/* Header */}
                <div
                  className={`p-6 border-b flex items-center gap-4 ${isDark ? "border-slate-800" : "border-gray-200"}`}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={`p-3 rounded-xl ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
                  >
                    {confirmModal.icon}
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold">{confirmModal.title}</h3>
                    <p
                      className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"} mt-0.5`}
                    >
                      Please confirm your action
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                  <p
                    className={`text-sm ${isDark ? "text-slate-300" : "text-gray-600"}`}
                  >
                    {confirmModal.message}
                  </p>
                  {confirmModal.subMessage && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs ${
                        isDark
                          ? "bg-slate-800/40 border-slate-800/80 text-slate-400"
                          : "bg-gray-50 border-gray-200 text-gray-500"
                      }`}
                    >
                      {confirmModal.subMessage}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div
                  className={`p-6 border-t flex justify-end gap-3 ${isDark ? "border-slate-800" : "border-gray-200"}`}
                >
                  <button
                    disabled={actionLoading !== null}
                    onClick={() =>
                      setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                    }
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                      ${
                        isDark
                          ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    `}
                  >
                    Cancel
                  </button>

                  <button
                    disabled={actionLoading !== null}
                    onClick={confirmModal.onConfirm}
                    className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${confirmModal.confirmColor} shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {actionLoading !== null ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      confirmModal.confirmText || "Confirm"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};

export default RelocationPage;
