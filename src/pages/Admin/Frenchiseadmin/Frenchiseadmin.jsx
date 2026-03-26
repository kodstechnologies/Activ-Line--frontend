import React, { useEffect, useMemo, useState } from "react";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`p-6 rounded-2xl border ${isDark ? "bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700" : "bg-gradient-to-br from-white to-gray-50 border-gray-200"} shadow-lg`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 5, repeatType: "reverse" }}
              className="w-16 h-16"
            >
              <Lottie
                animationData={cardAnimation}
                loop
                autoplay
                className="w-full h-full"
              />
            </motion.div>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"} mb-1`}>
                Franchise Admins
              </h1>
              <p className={`${isDark ? "text-slate-400" : "text-gray-600"} text-sm`}>
                Create and manage franchise admin credentials
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-2 xl:flex gap-3">
            <div className={`relative col-span-1 sm:col-span-2 xl:col-span-1 xl:min-w-[280px] ${isDark ? "text-slate-300" : "text-gray-600"}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
              <input
                type="text"
                placeholder="Search franchise admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  isDark
                    ? "bg-slate-800 border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    : "bg-white border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                }`}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openModal()}
              className={`w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg transition-all group ${
                isDark
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Add Franchise Admin
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>Total Admins</p>
                <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"} mt-1`}>
                  {isLoading ? <span className={`inline-block h-7 w-16 rounded animate-pulse ${isDark ? "bg-slate-700" : "bg-gray-200"}`} /> : admins.length}
                </p>
              </div>
              <div className="w-12 h-12">
                <Lottie animationData={statsUsersAnimation} loop autoplay className="w-full h-full" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>Showing</p>
                <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"} mt-1`}>
                  {isLoading ? <span className={`inline-block h-7 w-16 rounded animate-pulse ${isDark ? "bg-slate-700" : "bg-gray-200"}`} /> : paginatedAdmins.length}
                </p>
              </div>
              <div className="w-12 h-12">
                <Shield className={`${isDark ? "text-blue-400" : "text-indigo-500"} w-full h-full`} />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`rounded-2xl border overflow-hidden shadow-lg franchise-admin-table ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}
      >
        {isLoading ? (
          <div className="p-6">
            <div className="h-10 w-full rounded-lg animate-pulse mb-3" />
            <div className="h-10 w-full rounded-lg animate-pulse mb-3" />
            <div className="h-10 w-full rounded-lg animate-pulse" />
          </div>
        ) : paginatedAdmins.length === 0 ? (
          <div className="p-12 text-center">
            <p className={`${isDark ? "text-slate-300" : "text-gray-700"} text-lg font-medium mb-2`}>No franchise admins found</p>
            <p className={`${isDark ? "text-slate-400" : "text-gray-500"}`}>Use the button above to create one.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className={isDark ? "bg-gradient-to-r from-slate-800 to-slate-900/80" : "bg-gradient-to-r from-gray-50 to-gray-100"}>
                  <tr>
                    {["Name", "Email", "Role", "Account ID", "Created", "Actions"].map((label) => (
                      <th key={label} className={`px-6 py-4 text-xs font-semibold uppercase ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={isDark ? "divide-y divide-slate-800" : "divide-y divide-gray-100"}>
                  {paginatedAdmins.map((admin) => (
                    <tr key={admin._id} className="transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>
                            {(admin.name || "F").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{admin.name}</p>
                            <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>ID: {admin._id?.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? "text-slate-300" : "text-gray-600"}`}>{admin.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${isDark ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                          {admin.role || "FRANCHISE_ADMIN"}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? "text-slate-300" : "text-gray-600"}`}>{admin.accountId || "-"}</td>
                      <td className={`px-6 py-4 text-sm ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                        {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openModal(admin)}
                            className={`p-2 rounded-lg transition-all ${isDark ? "hover:bg-slate-800 text-slate-400 hover:text-green-400" : "hover:bg-gray-100 text-gray-400 hover:text-green-600"}`}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteClick(admin._id)}
                            className={`p-2 rounded-lg transition-all ${isDark ? "hover:bg-slate-800 text-slate-400 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-600"}`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={`p-6 border-t flex items-center justify-between ${isDark ? "border-slate-800 bg-slate-900/50" : "border-gray-200 bg-gray-50"}`}>
                <span className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={`p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "border-gray-300 hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className={`p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "border-gray-300 hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            )}
          </>
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-lg rounded-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] ${
                isDark ? "bg-slate-900/90 border border-slate-700/60" : "bg-white/90 border border-gray-200/70"
              }`}
            >
              <div className={`px-6 py-5 flex justify-between items-center border-b ${isDark ? "border-slate-700/60" : "border-gray-200/70"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>
                    <UserPlus className={`${isDark ? "text-blue-400" : "text-indigo-500"} w-6 h-6`} />
                  </div>
                  <h2 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                    {editingAdmin ? "Edit Franchise Admin" : "Add Franchise Admin"}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal}
                  className={`p-2 rounded-full transition ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-gray-400 hover:bg-gray-100"}`}
                >
                  <XCircle className="w-6 h-6" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}>Account ID *</label>
                  <select
                    name="accountId"
                    required={!editingAdmin}
                    disabled={!!editingAdmin || franchiseLoading}
                    value={formData.accountId}
                    onChange={handleChange}
                    className={`w-full p-3.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark ? "bg-slate-800/80 border-slate-700 text-white focus:border-blue-500" : "bg-white border-gray-300 text-gray-900 focus:border-purple-500"
                    } ${editingAdmin ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{franchiseLoading ? "Loading..." : "Select franchise"}</option>
                    {franchises.map((f) => (
                      <option key={f._id} value={f.accountId}>
                        {f.companyName || f.accountName || f.accountId}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}>Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Rohit Sharma"
                    className={`w-full p-3.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark ? "bg-slate-800/80 border-slate-700 text-white focus:border-blue-500" : "bg-white border-gray-300 text-gray-900 focus:border-purple-500"
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    required={!editingAdmin}
                    disabled={!!editingAdmin}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="rohit@example.com"
                    className={`w-full p-3.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark ? "bg-slate-800/80 border-slate-700 text-white focus:border-blue-500" : "bg-white border-gray-300 text-gray-900 focus:border-purple-500"
                    } ${editingAdmin ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                    {editingAdmin ? "New Password" : "Password"} {editingAdmin ? "" : "*"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required={!editingAdmin}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={editingAdmin ? "Leave blank to keep current password" : "Secret@123"}
                    className={`w-full p-3.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark ? "bg-slate-800/80 border-slate-700 text-white focus:border-blue-500" : "bg-white border-gray-300 text-gray-900 focus:border-purple-500"
                    }`}
                  />
                </div>

                {editingAdmin && (
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                      Profile Image (optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className={`w-full p-2 rounded-xl border text-sm ${
                        isDark ? "bg-slate-800/80 border-slate-700 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 ${
                      isDark ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-blue-600 to-indigo-600"
                    }`}
                  >
                    {isSubmitting ? "Processing..." : editingAdmin ? "Update Franchise Admin" : "Create Franchise Admin"}
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
                isDark ? "bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700" : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
              }`}
            >
              <div className={`p-6 border-b flex items-center gap-4 ${isDark ? "border-slate-800" : "border-gray-200"}`}>
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
              <div className="p-6">
                <p className={`${isDark ? "text-slate-300" : "text-gray-600"} mb-4`}>
                  Are you sure you want to delete this franchise admin?
                </p>
              </div>
              <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? "border-slate-800" : "border-gray-200"}`}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 to-pink-600 shadow-lg transition-all"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Frenchiseadmin;
