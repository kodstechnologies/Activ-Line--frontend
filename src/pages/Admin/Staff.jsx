

import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Users,
  CheckCircle,
  Filter,
  Search,
  Download,
  MoreVertical,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldOff,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { toast } from "react-hot-toast";
import {
  getAllAdminStaff,
  createAdminStaff,
  updateAdminStaff,
  deleteAdminStaff,
} from "../../api/staff.api";
import Lottie from "lottie-react";
import cardAnimation from "../../animations/Profile user card.json";
import { motion, AnimatePresence } from "framer-motion";
import statsUsersAnimation from "../../animations/No transaction history (2).json";
import statsShieldAnimation from "../../animations/Profile Avatar of Young Boy.json";
import statsEyeAnimation from "../../animations/Profile user card.json";
// Animation variants for Framer Motion
// If you don't have these specific Lottie files, we'll use the existing cardAnimation for all

const getUserRole = () => {
  try {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role?.toUpperCase();
  } catch {
    return null;
  }
};

const normalizeStatus = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "INACTIVE") return "DISABLED";
  if (value === "ACTIVE" || value === "DISABLED") {
    return value;
  }
  return "DISABLED";
};

const Staff = () => {
  const { isDark } = useTheme();
  const [staffs, setStaffs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const userRole = getUserRole();
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showFilter, setShowFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const ITEMS_PER_PAGE = 8;

  const initialForm = {
    name: "",
    email: "",
    password: "",
    role: "ADMIN_STAFF",
    status: "ACTIVE",
  };

  const [formData, setFormData] = useState(initialForm);

  // Fetch staff on component mount
  useEffect(() => {
    fetchStaffs();
  }, []);

  // Reset pagination to Page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStaffs();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const fetchStaffs = async () => {
    setIsLoading(true);
    try {
      const res = await getAllAdminStaff();
      const normalized = res.data.map((s) => ({
        ...s,
        status: normalizeStatus(s.status),
        role: s.role?.toUpperCase() || "ADMIN_STAFF",
      }));
      setStaffs(normalized);
    } catch (err) {
      toast.error("Failed to load staff");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedStaffs = useMemo(() => {
    let sortableItems = [...staffs];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [staffs, sortConfig]);

  const filteredStaffs = useMemo(() => {
    return sortedStaffs.filter((staff) => {
      const roleMatch = roleFilter === "ALL" || staff.role === roleFilter;
      const statusMatch =
        statusFilter === "ALL" || staff.status === statusFilter;
      const searchMatch =
        searchTerm === "" ||
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase());

      return roleMatch && statusMatch && searchMatch;
    });
  }, [sortedStaffs, roleFilter, statusFilter, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStaffs.length / ITEMS_PER_PAGE),
  );

  const paginatedStaffs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStaffs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStaffs, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of table
    const tableElement = document.querySelector(".staff-table");
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const openModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        name: staff.name,
        email: staff.email,
        role: staff.role,
        status: normalizeStatus(staff.status),
        password: "",
      });
    } else {
      setEditingStaff(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setEditingStaff(null);
      setFormData(initialForm);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingStaff) {
        const { password, ...updateData } = formData;
        await updateAdminStaff(editingStaff._id, updateData);
        toast.success("Staff updated successfully");
      } else {
        await createAdminStaff(formData);

        toast.success("Admin staff created successfully");
      }

      fetchStaffs();
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
      await deleteAdminStaff(deleteId);
      toast.success("Staff deleted successfully");
      fetchStaffs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setShowDeleteModal(false);
      setTimeout(() => setDeleteId(null), 300);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "ADMIN":
      case "SUPER_ADMIN":
        return <Shield className="w-4 h-4" />;
      case "ADMIN_STAFF":
        return <Users className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ACTIVE":
        return <ShieldCheck className="w-4 h-4" />;
      case "DISABLED":
        return <ShieldOff className="w-4 h-4" />;
    default:
      return null;
  }
};

  const exportStaffData = () => {
    const data = filteredStaffs.map((staff) => ({
      Name: staff.name,
      Email: staff.email,
      Role: staff.role,
      Status: staff.status,
      "Created At": new Date(staff.createdAt).toLocaleDateString(),
    }));

    const csvContent = [
      Object.keys(data[0]).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff_data_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Success Banner */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-4 rounded-xl border mb-4
            ${
              isDark
                ? "bg-gradient-to-r from-green-900/30 to-emerald-900/20 border-green-500/30 text-green-400"
                : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-700"
            }
          `}
        >
          <CheckCircle className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-medium">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage("")}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`p-6 rounded-2xl border ${isDark ? "bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700" : "bg-gradient-to-br from-white to-gray-50 border-gray-200"} shadow-lg`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Card Animation - Updated with Framer Motion */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{
                repeat: Infinity,
                duration: 5,
                repeatType: "reverse",
              }}
              className="w-16 h-16"
            >
              <Lottie
                animationData={cardAnimation}
                loop={true}
                autoplay={true}
                className="w-full h-full"
              />
            </motion.div>

            {/* Title Text */}
            <div>
              <h1
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                } mb-1`}
              >
                Staff Management
              </h1>
              <p
                className={`text-sm ${
                  isDark ? "text-slate-400" : "text-gray-600"
                }`}
              >
                Manage your team members and their permissions
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-2 xl:flex gap-3">
            {/* Search */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`relative col-span-1 sm:col-span-2 xl:col-span-1 xl:min-w-[300px] ${isDark ? "text-slate-300" : "text-gray-600"}`}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all
                  ${
                    isDark
                      ? "bg-slate-800 border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      : "bg-white border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  }
                `}
              />
            </motion.div>

            {/* Filter Button */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilter(!showFilter)}
                className={`w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
                  ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                <Filter className="w-4 h-4" />
                Filter
              </motion.button>

              {/* Filter Dropdown */}
              <AnimatePresence>
                {showFilter && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl z-50 p-4 space-y-4
                      ${
                        isDark
                          ? "bg-slate-900 border-slate-700"
                          : "bg-white border-gray-200 shadow-lg"
                      }
                    `}
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">
                        Role
                      </label>
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all
                          ${
                            isDark
                              ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 focus:border-purple-500"
                          }
                        `}
                      >
                        <option value="ALL">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="ADMIN_STAFF">Staff</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all
                          ${
                            isDark
                              ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 focus:border-purple-500"
                          }
                        `}
                      >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="DISABLED">Disabled</option>
                      </select>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => {
                          setRoleFilter("ALL");
                          setStatusFilter("ALL");
                          setSearchTerm("");
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setShowFilter(false)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportStaffData}
              className={`w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
                ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              <Download className="w-4 h-4" />
              Export
            </motion.button>

            {/* Add Staff Button */}
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openModal()}
              className={`w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg transition-all group
                ${
                  isDark
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/25"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/25"
                }
              `}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <Plus className="w-4 h-4" />
              </motion.div>
              Add Staff
            </motion.button>
          </div>
        </div>

        {/* Stats Cards - Updated with animations */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}
                >
                  Total Staff
                </p>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"} mt-1`}
                >
                  {isLoading ? (
                    <span
                      className={`inline-block h-7 w-16 rounded animate-pulse ${isDark ? "bg-slate-700" : "bg-gray-200"}`}
                    />
                  ) : (
                    staffs.length
                  )}
                </p>
              </div>
              <div className="w-12 h-12">
                <Lottie
                  animationData={statsUsersAnimation}
                  loop={true}
                  autoplay={true}
                  className="w-full h-full"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}
                >
                  Active
                </p>
                <p className={`text-2xl font-bold text-green-500 mt-1`}>
                  {isLoading ? (
                    <span
                      className={`inline-block h-7 w-16 rounded animate-pulse ${isDark ? "bg-slate-700" : "bg-gray-200"}`}
                    />
                  ) : (
                    staffs.filter((s) => s.status === "ACTIVE").length
                  )}
                </p>
              </div>
              <div className="w-12 h-12">
                <Lottie
                  animationData={statsShieldAnimation}
                  loop={true}
                  autoplay={true}
                  className="w-full h-full"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}
                >
                  Admins
                </p>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-blue-400" : "text-purple-600"} mt-1`}
                >
                  {isLoading ? (
                    <span
                      className={`inline-block h-7 w-16 rounded animate-pulse ${isDark ? "bg-slate-700" : "bg-gray-200"}`}
                    />
                  ) : (
                    staffs.filter((s) => s.role === "ADMIN").length
                  )}
                </p>
              </div>
              <div className="w-12 h-12">
                <Lottie
                  animationData={statsShieldAnimation}
                  loop={true}
                  autoplay={true}
                  className="w-full h-full"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}
                >
                  Showing
                </p>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"} mt-1`}
                >
                  {isLoading ? (
                    <span
                      className={`inline-block h-7 w-16 rounded animate-pulse ${isDark ? "bg-slate-700" : "bg-gray-200"}`}
                    />
                  ) : (
                    filteredStaffs.length
                  )}
                </p>
              </div>
              <div className="w-12 h-12">
                <Lottie
                  animationData={statsEyeAnimation}
                  loop={true}
                  autoplay={true}
                  className="w-full h-full"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`rounded-2xl border overflow-hidden shadow-lg staff-table ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}
      >
        {isLoading ? (
          <div className="p-4 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead
                  className={
                    isDark
                      ? "bg-gradient-to-r from-slate-800 to-slate-900/80"
                      : "bg-gradient-to-r from-gray-50 to-gray-100"
                  }
                >
                  <tr>
                    {["Name", "Email", "Role", "Status", "Actions"].map((label) => (
                      <th
                        key={label}
                        className={`px-6 py-4 text-xs font-semibold uppercase ${isDark ? "text-slate-400" : "text-gray-500"}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={isDark ? "divide-y divide-slate-800" : "divide-y divide-gray-100"}>
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${isDark ? "bg-slate-800" : "bg-gray-200"}`} />
                          <div className="space-y-2">
                            <div className={`h-3.5 w-28 rounded ${isDark ? "bg-slate-800" : "bg-gray-200"}`} />
                            <div className={`h-3 w-20 rounded ${isDark ? "bg-slate-800" : "bg-gray-200"}`} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`h-3.5 w-44 rounded ${isDark ? "bg-slate-800" : "bg-gray-200"}`} />
                      </td>
                      <td className="px-6 py-4">
                        <div className={`h-7 w-24 rounded-full ${isDark ? "bg-slate-800" : "bg-gray-200"}`} />
                      </td>
                      <td className="px-6 py-4">
                        <div className={`h-7 w-24 rounded-full ${isDark ? "bg-slate-800" : "bg-gray-200"}`} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-lg ${isDark ? "bg-slate-800" : "bg-gray-200"}`} />
                          <div className={`h-8 w-8 rounded-lg ${isDark ? "bg-slate-800" : "bg-gray-200"}`} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : filteredStaffs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 text-center"
          >
            <div className="w-48 h-48 mx-auto mb-6">
              {/* Using existing cardAnimation for empty state */}
              <Lottie
                animationData={cardAnimation}
                loop={true}
                autoplay={true}
                className="w-full h-full"
              />
            </div>
            <p
              className={`text-lg font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}
            >
              No staff members found
            </p>
            <p
              className={`mb-6 ${isDark ? "text-slate-400" : "text-gray-500"}`}
            >
              {searchTerm
                ? "Try a different search term."
                : "Get started by adding your first team member"}
            </p>
            {!searchTerm && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold"
              >
                <UserPlus className="w-5 h-5" />
                Add First Staff Member
              </motion.button>
            )}
          </motion.div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead
                className={
                  isDark
                    ? "bg-gradient-to-r from-slate-800 to-slate-900/80"
                    : "bg-gradient-to-r from-gray-50 to-gray-100"
                }
              >
                <tr>
                  {[
                    { label: "Name", key: "name" },
                    { label: "Email", key: "email" },
                    { label: "Role", key: "role" },
                    { label: "Status", key: "status" },
                    { label: "Actions", key: null },
                  ].map(({ label, key }) => (
                    <th
                      key={label}
                      className={`px-6 py-4 text-xs font-semibold uppercase cursor-pointer transition-colors ${isDark ? "text-slate-400 hover:text-slate-300" : "text-gray-500 hover:text-gray-700"}`}
                      onClick={() => key && handleSort(key)}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        {sortConfig.key === key && (
                          <span className="text-xs">
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody
                className={
                  isDark
                    ? "divide-y divide-slate-800"
                    : "divide-y divide-gray-100"
                }
              >
                {paginatedStaffs.map((staff, index) => (
                  <motion.tr
                    key={staff._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{
                      backgroundColor: isDark
                        ? "rgba(30, 41, 59, 0.5)"
                        : "rgba(243, 244, 246, 0.8)",
                    }}
                    className="transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
                        >
                          {staff.name.charAt(0).toUpperCase()}
                        </motion.div>
                        <div>
                          <p
                            className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                          >
                            {staff.name}
                          </p>
                          <p
                            className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}
                          >
                            ID: {staff._id.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${isDark ? "text-slate-300" : "text-gray-600"}`}
                    >
                      {staff.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <motion.span
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className={`p-1.5 rounded-lg ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
                        >
                          {getRoleIcon(staff.role)}
                        </motion.span>
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                            ${
                              staff.role === "ADMIN"
                                ? isDark
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                                : isDark
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                  : "bg-purple-50 text-purple-700 border-purple-200"
                            }
                          `}
                        >
                          {staff.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <motion.span
                          animate={{
                            scale: staff.status === "ACTIVE" ? [1, 1.2, 1] : 1,
                          }}
                          transition={{
                            duration: 2,
                            repeat: staff.status === "ACTIVE" ? Infinity : 0,
                            repeatDelay: 3,
                          }}
                          className={`p-1.5 rounded-lg ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
                        >
                          {getStatusIcon(staff.status)}
                        </motion.span>
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border
                            ${
                              staff.status === "ACTIVE"
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }
                          `}
                        >
                          {staff.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.2, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openModal(staff)}
                          className={`p-2 rounded-lg transition-all ${
                            isDark
                              ? "hover:bg-slate-800 text-slate-400 hover:text-green-400"
                              : "hover:bg-gray-100 text-gray-400 hover:text-green-600"
                          }`}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.2, rotate: -5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteClick(staff._id)}
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
                ))}
              </tbody>
            </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isDark ? "border-slate-800 bg-slate-900/50" : "border-gray-200 bg-gray-50"}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}
                  >
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredStaffs.length,
                    )}{" "}
                    of {filteredStaffs.length} entries
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed
                      ${
                        isDark
                          ? "border-slate-700 hover:bg-slate-800 text-slate-300"
                          : "border-gray-300 hover:bg-gray-100 text-gray-700"
                      }
                    `}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </motion.button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                      <motion.button
                        key={pageNum}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all
                          ${
                            currentPage === pageNum
                              ? isDark
                                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-500"
                                : "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500"
                              : isDark
                                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                                : "border-gray-300 text-gray-700 hover:bg-gray-100"
                          }
                        `}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed
                      ${
                        isDark
                          ? "border-slate-700 hover:bg-slate-800 text-slate-300"
                          : "border-gray-300 hover:bg-gray-100 text-gray-700"
                      }
                    `}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      {/* Add/Edit Staff Modal */}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4
                 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-lg rounded-3xl
          shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]
          ${
            isDark
              ? "bg-slate-900/90 border border-slate-700/60"
              : "bg-white/90 border border-gray-200/70"
          }`}
            >
              {/* Header */}
              <div
                className={`px-6 py-5 flex justify-between items-center border-b
            ${isDark ? "border-slate-700/60" : "border-gray-200/70"}`}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className={`p-3 rounded-xl shadow-inner
                ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
                  >
                    <UserPlus
                      className={`w-6 h-6 ${
                        isDark ? "text-blue-400" : "text-purple-500"
                      }`}
                    />
                  </motion.div>

                  <h2
                    className={`text-xl font-bold tracking-tight
                ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {editingStaff ? "Edit Staff" : "Add New Staff"}
                  </h2>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal}
                  className={`p-2 rounded-full transition
              ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-gray-400 hover:bg-gray-100"}`}
                >
                  <XCircle className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}
                    >
                      Full Name *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={`w-full p-3.5 rounded-xl border text-sm
                  outline-none transition-all hover:shadow-md focus:ring-2
                  ${
                    isDark
                      ? "bg-slate-800/80 border-slate-700 text-white focus:ring-blue-500/30"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-purple-500/30"
                  }`}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}
                    >
                      Email Address *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className={`w-full p-3.5 rounded-xl border text-sm
                  outline-none transition-all hover:shadow-md focus:ring-2
                  ${
                    isDark
                      ? "bg-slate-800/80 border-slate-700 text-white focus:ring-blue-500/30"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-purple-500/30"
                  }`}
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}
                    >
                      Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className={`w-full p-3.5 rounded-xl border text-sm cursor-pointer
                  transition-all hover:shadow-md
                  ${
                    isDark
                      ? "bg-slate-800/80 border-slate-700 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                    >
                      <option value="ADMIN_STAFF">ADMIN STAFF</option>
                  {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
                        <option value="ADMIN">ADMIN</option>
                      )}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}
                    >
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className={`w-full p-3.5 rounded-xl border text-sm cursor-pointer
                  transition-all hover:shadow-md
                  ${
                    isDark
                      ? "bg-slate-800/80 border-slate-700 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="DISABLED">Disabled</option>
                    </select>
                  </div>

                  {/* Password */}
                  {!editingStaff && (
                    <div className="md:col-span-2 space-y-2">
                      <label
                        className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"}`}
                      >
                        Temporary Password *
                      </label>
                      <div className="relative group">
                        <motion.input
                          whileFocus={{ scale: 1.02 }}
                          type={showPassword ? "text" : "password"}
                          name="password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter temporary password"
                          className={`w-full p-3.5 rounded-xl border text-sm pr-10
                      outline-none transition-all hover:shadow-md focus:ring-2
                      ${
                        isDark
                          ? "bg-slate-800/80 border-slate-700 text-white focus:ring-blue-500/30"
                          : "bg-white border-gray-300 text-gray-900 focus:ring-purple-500/30"
                      }`}
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 group-hover:opacity-100"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                      <p
                        className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}
                      >
                        User will be prompted to change this password on first
                        login
                      </p>
                    </div>
                  )}

                </div>

                {/* Footer */}
                <div className="pt-4 flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={closeModal}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium
                transition-all hover:shadow-md
                ${
                  isDark
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white
                shadow-lg transition-all disabled:opacity-50 flex items-center gap-2
                ${
                  isDark
                    ? "bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500"
                    : "bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500"
                }`}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Processing...
                      </>
                    ) : editingStaff ? (
                      "Update Staff"
                    ) : (
                      "Create Staff"
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl
                ${
                  isDark
                    ? "bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700"
                    : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
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
                  className={`p-3 rounded-xl ${isDark ? "bg-red-500/10" : "bg-red-100"}`}
                >
                  <Trash2 className="w-6 h-6 text-red-500" />
                </motion.div>
                <div>
                  <h3
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Delete Staff Member
                  </h3>
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"} mt-1`}
                  >
                    This action cannot be undone
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p
                  className={`${isDark ? "text-slate-300" : "text-gray-600"} mb-4`}
                >
                  Are you sure you want to delete this staff member? All their
                  access will be immediately revoked.
                </p>
                <div
                  className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
                >
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}
                  >
                    This will permanently remove the staff member from the
                    system.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div
                className={`p-6 border-t flex justify-end gap-3 ${isDark ? "border-slate-800" : "border-gray-200"}`}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteModal(false)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${
                      isDark
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }
                  `}
                >
                  Cancel
                </motion.button>

                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmDelete}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 to-pink-600 shadow-lg transition-all"
                >
                  Yes, Delete Permanently
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Staff;
