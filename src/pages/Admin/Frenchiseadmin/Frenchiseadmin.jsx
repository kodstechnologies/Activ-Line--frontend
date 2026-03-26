import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  UserPlus,
  XCircle,
  Shield,
  Users,
  Calendar,
  Mail,
  User,
  Building,
  RefreshCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import Lottie from "lottie-react";
import { useTheme } from "../../../context/ThemeContext";
import cardAnimation from "../../../animations/Profile user card.json";
import statsUsersAnimation from "../../../animations/No transaction history (2).json";
import statsShieldAnimation from "../../../animations/Profile Avatar of Young Boy.json";
import {
  getFranchiseAdmins,
  createFranchiseAdmin,
  updateFranchiseAdmin,
  deleteFranchiseAdmin,
} from "../../../api/franchiseAdmin.api";
import { getFranchises } from "../../../api/franchise.api";

// Shimmer Components
const TableRowShimmer = ({ isDark, cols = 6 }) => (
  <tr className="animate-pulse">
    {[...Array(cols)].map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className={`h-4 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded`}></div>
       </td>
    ))}
  </tr>
);

const StatCardShimmer = ({ isDark }) => (
  <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"}`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className={`h-3 w-24 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded mb-2`}></div>
        <div className={`h-8 w-16 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded`}></div>
      </div>
      <div className={`w-12 h-12 rounded-full ${isDark ? "bg-slate-700" : "bg-gray-200"}`}></div>
    </div>
  </div>
);

const Frenchiseadmin = () => {
  const { isDark } = useTheme();

  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const ITEMS_PER_PAGE = 8;
  const [franchises, setFranchises] = useState([]);
  const [franchiseLoading, setFranchiseLoading] = useState(false);

  const initialForm = {
    accountId: "",
    name: "",
    email: "",
    password: "",
    profileImage: null,
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchAdmins();
  }, [page, searchTerm]);

  useEffect(() => {
    fetchFranchises();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await getFranchiseAdmins(page, ITEMS_PER_PAGE, searchTerm);
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.admins)
              ? res.admins
              : [];
      setAdmins(list);
      setTotalPages(
        res?.totalPages ||
          res?.pagination?.totalPages ||
          Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE))
      );
    } catch (err) {
      toast.error("Failed to load franchise admins");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFranchises = async () => {
    setFranchiseLoading(true);
    try {
      const res = await getFranchises();
      const list = Array.isArray(res?.data) ? res.data : [];
      setFranchises(list);
    } catch (err) {
      toast.error("Failed to load franchises");
    } finally {
      setFranchiseLoading(false);
    }
  };

  const openModal = (admin = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        accountId: admin.accountId || "",
        name: admin.name || "",
        email: admin.email || "",
        password: "",
        profileImage: null,
      });
    } else {
      setEditingAdmin(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setEditingAdmin(null);
      setFormData(initialForm);
    }, 300);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, profileImage: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingAdmin) {
        const payload = new FormData();
        if (formData.name?.trim()) payload.append("name", formData.name.trim());
        if (formData.password?.trim()) payload.append("password", formData.password.trim());
        if (formData.profileImage) payload.append("profileImage", formData.profileImage);
        await updateFranchiseAdmin(editingAdmin._id, payload);
        toast.success("Franchise admin updated");
      } else {
        await createFranchiseAdmin({
          accountId: formData.accountId.trim(),
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });
        toast.success("Franchise admin created");
      }
      fetchAdmins();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteFranchiseAdmin(deleteId);
      toast.success("Franchise admin deleted");
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setShowDeleteModal(false);
      setTimeout(() => setDeleteId(null), 300);
    }
  };

  const filteredAdmins = useMemo(() => {
    if (!searchTerm) return admins;
    const term = searchTerm.toLowerCase();
    return admins.filter((a) =>
      [a.name, a.email, a.accountId].some((v) =>
        String(v || "").toLowerCase().includes(term)
      )
    );
  }, [admins, searchTerm]);

  const paginatedAdmins = useMemo(() => filteredAdmins, [filteredAdmins]);

  const handlePageChange = (next) => {
    setPage(next);
    const tableElement = document.querySelector(".franchise-admin-table");
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleRefresh = () => {
    fetchAdmins();
    toast.success("Refreshed successfully");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`relative overflow-hidden rounded-2xl border ${
          isDark 
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50" 
            : "bg-gradient-to-br from-white via-gray-50 to-white border-gray-200"
        } shadow-xl`}
      >
        <div className={`absolute inset-0 opacity-5 ${
          isDark ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gradient-to-r from-purple-500 to-indigo-500"
        }`}></div>
        
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 5, 
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
                className="w-20 h-20 md:w-24 md:h-24"
              >
                <Lottie
                  animationData={cardAnimation}
                  loop
                  autoplay
                  className="w-full h-full"
                />
              </motion.div>
              <div>
                <h1 className={`text-3xl md:text-4xl font-bold ${
                  isDark ? "bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent" : "text-gray-900"
                }`}>
                  Franchise Admins
                </h1>
                <p className={`text-sm mt-2 flex items-center gap-2 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                  <Users className="w-4 h-4" />
                  Create and manage franchise admin credentials
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or account ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all duration-200
                    ${isDark
                      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500"
                    } focus:ring-2 focus:ring-opacity-50 ${isDark ? "focus:ring-blue-500" : "focus:ring-purple-500"}`}
                />
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm
                  ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
                  ${isDark
                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openModal()}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg transition-all
                  ${isDark
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25"
                  }`}
              >
                <UserPlus className="w-4 h-4" />
                Add Admin
              </motion.button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className={`p-4 rounded-xl border ${
                isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>Total Frenchsie Admins</p>
                  <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"} mt-1`}>
                    {isLoading ? (
                      <span className={`inline-block h-8 w-16 rounded animate-pulse ${isDark ? "bg-slate-700" : "bg-gray-200"}`} />
                    ) : (
                      admins.length
                    )}
                  </p>
                </div>
                <div className="w-12 h-12">
                  <Lottie animationData={statsUsersAnimation} loop autoplay className="w-full h-full" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className={`p-4 rounded-xl border ${
                isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>Showing</p>
                  <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"} mt-1`}>
                    {isLoading ? (
                      <span className={`inline-block h-8 w-16 rounded animate-pulse ${isDark ? "bg-slate-700" : "bg-gray-200"}`} />
                    ) : (
                      paginatedAdmins.length
                    )}
                  </p>
                </div>
                <div className="w-12 h-12">
                  <Shield className={`${isDark ? "text-blue-400" : "text-indigo-500"} w-full h-full`} />
                </div>
              </div>
            </motion.div>

          

           
          </div>
        </div>
      </motion.div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`rounded-2xl border overflow-hidden shadow-lg franchise-admin-table ${
          isDark ? "bg-slate-900 border-slate-800/50" : "bg-white border-gray-200"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className={`${isDark ? "bg-slate-800/80" : "bg-gradient-to-r from-gray-50 to-gray-100"}`}>
              <tr>
                {["Admin", "Email", "Role", "Account ID", "Created", "Actions"].map((label) => (
                  <th key={label} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-gray-100"}`}>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRowShimmer key={i} isDark={isDark} cols={6} />
                ))
              ) : paginatedAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <Users className={`w-16 h-16 ${isDark ? "text-slate-600" : "text-gray-400"}`} />
                      <p className={`text-lg font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                        No franchise admins found
                      </p>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                        Click the "Add Admin" button to create one
                      </p>
                    </motion.div>
                  </td>
                </tr>
              ) : (
                paginatedAdmins.map((admin, index) => (
                  <motion.tr
                    key={admin._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: isDark ? "rgba(51, 65, 85, 0.4)" : "rgba(243, 244, 246, 0.6)" }}
                    className="transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isDark ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20" : "bg-gradient-to-br from-blue-100 to-purple-100"
                        }`}>
                          <span className={`font-semibold text-sm ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                            {(admin.name || "F").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{admin.name}</p>
                          <p className={`text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                            ID: {admin._id?.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className={`w-4 h-4 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
                        <span className={`text-sm ${isDark ? "text-slate-300" : "text-gray-600"}`}>{admin.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium ${
                        isDark 
                          ? "bg-slate-700 text-slate-300" 
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {admin.role || "FRANCHISE_ADMIN"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building className={`w-4 h-4 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
                        <span className={`text-sm ${isDark ? "text-slate-300" : "text-gray-600"}`}>{admin.accountId || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
                        <span className={`text-sm ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                          {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openModal(admin)}
                          className={`p-2 rounded-lg transition-all ${
                            isDark 
                              ? "hover:bg-slate-800 text-slate-400 hover:text-emerald-400" 
                              : "hover:bg-gray-100 text-gray-400 hover:text-emerald-600"
                          }`}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteClick(admin._id)}
                          className={`p-2 rounded-lg transition-all ${
                            isDark 
                              ? "hover:bg-slate-800 text-slate-400 hover:text-red-400" 
                              : "hover:bg-gray-100 text-gray-400 hover:text-red-600"
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && paginatedAdmins.length > 0 && (
          <div className={`p-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${
            isDark ? "border-slate-800 bg-slate-900/50" : "border-gray-200 bg-gray-50"
          }`}>
            <span className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to{" "}
              {Math.min(page * ITEMS_PER_PAGE, filteredAdmins.length)} of{" "}
              {filteredAdmins.length} entries
            </span>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark 
                    ? "border-slate-700 hover:bg-slate-800 text-slate-300" 
                    : "border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <motion.button
                      key={pageNum}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-lg transition-all duration-200 text-sm ${
                        page === pageNum
                          ? isDark
                            ? "bg-slate-700 text-white"
                            : "bg-gray-900 text-white"
                          : isDark
                            ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className={`p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark 
                    ? "border-slate-700 hover:bg-slate-800 text-slate-300" 
                    : "border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl ${
                isDark ? "bg-slate-900 border border-slate-700" : "bg-white border border-gray-200"
              }`}
            >
              <div className={`px-6 py-5 flex justify-between items-center border-b ${
                isDark ? "border-slate-800" : "border-gray-200"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>
                    <UserPlus className={`${isDark ? "text-blue-400" : "text-indigo-500"} w-5 h-5`} />
                  </div>
                  <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    {editingAdmin ? "Edit Franchise Admin" : "Add Franchise Admin"}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal}
                  className={`p-1 rounded-full transition ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-gray-400 hover:bg-gray-100"}`}
                >
                  <XCircle className="w-6 h-6" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                    Franchise Account *
                  </label>
                  <select
                    name="accountId"
                    required={!editingAdmin}
                    disabled={!!editingAdmin || franchiseLoading}
                    value={formData.accountId}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-xl border text-sm outline-none transition-all ${
                      isDark 
                        ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500" 
                        : "bg-white border-gray-300 text-gray-900 focus:border-purple-500"
                    } ${editingAdmin ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{franchiseLoading ? "Loading franchises..." : "Select a franchise"}</option>
                    {franchises.map((f) => (
                      <option key={f._id} value={f.accountId}>
                        {f.companyName || f.accountName || f.accountId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className={`w-full p-3 rounded-xl border text-sm outline-none transition-all ${
                      isDark 
                        ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500" 
                        : "bg-white border-gray-300 text-gray-900 focus:border-purple-500"
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required={!editingAdmin}
                    disabled={!!editingAdmin}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@example.com"
                    className={`w-full p-3 rounded-xl border text-sm outline-none transition-all ${
                      isDark 
                        ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500" 
                        : "bg-white border-gray-300 text-gray-900 focus:border-purple-500"
                    } ${editingAdmin ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                </div>

                <div>
                  <label className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                    {editingAdmin ? "New Password" : "Password"} {editingAdmin ? "(optional)" : "*"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required={!editingAdmin}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={editingAdmin ? "Leave blank to keep current" : "Enter secure password"}
                    className={`w-full p-3 rounded-xl border text-sm outline-none transition-all ${
                      isDark 
                        ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500" 
                        : "bg-white border-gray-300 text-gray-900 focus:border-purple-500"
                    }`}
                  />
                </div>

                {editingAdmin && (
                  <div>
                    <label className={`text-sm font-medium mb-2 block ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                      Profile Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className={`w-full p-2 rounded-xl border text-sm ${
                        isDark 
                          ? "bg-slate-800 border-slate-700 text-white" 
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isDark 
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 ${
                      isDark 
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500" 
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                    }`}
                  >
                    {isSubmitting ? "Processing..." : editingAdmin ? "Update Admin" : "Create Admin"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl ${
                isDark ? "bg-slate-900 border border-slate-700" : "bg-white border border-gray-200"
              }`}
            >
              <div className={`p-6 border-b ${isDark ? "border-slate-800" : "border-gray-200"}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isDark ? "bg-red-500/10" : "bg-red-100"}`}>
                    <Trash2 className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      Delete Franchise Admin
                    </h3>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"} mt-1`}>
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className={`${isDark ? "text-slate-300" : "text-gray-600"}`}>
                  Are you sure you want to delete this franchise admin? All associated data will be permanently removed.
                </p>
              </div>
              <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? "border-slate-800" : "border-gray-200"}`}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isDark 
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 to-pink-600 shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
        }
      `}</style>
    </motion.div>
  );
};

export default Frenchiseadmin;