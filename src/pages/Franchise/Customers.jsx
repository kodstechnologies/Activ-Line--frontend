import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Pencil, Trash2, Plus, Eye, Search, Filter, XCircle,
  ChevronLeft, ChevronRight, Mail, Phone, MapPin, Calendar,
  User, CreditCard, FileText, Download, ExternalLink, Loader2
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext.jsx";
import Lottie from "lottie-react";
import fadeSlideAnimation from "../../animations/Profile Avatar of Young Boy.json";
import {
  getCustomers,
  editCustomer,
  
} from "../../api/frenchise/customer";
import { createCustomer, getFranchiseProfiles } from "../../api/customer.api";
import api from "../../api/axios";

const MySubscribers = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user } = useAuth();

  // State management
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const filterRef = useRef(null);

  // Modal states
  const [editModal, setEditModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewCustomerDetails, setViewCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [createdCustomer, setCreatedCustomer] = useState(null);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    emailId: ""
  });

  const resolvedAccountId =
    user?.accountId || user?.AccountId || user?.account_id || user?.userName || "";

  const [newSubscriber, setNewSubscriber] = useState({
    userGroupId: "",
    accountId: resolvedAccountId || "",
    userName: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    emailId: "",
    userType: "business",
    activationDate: "now",
    customActivationDate: "",
    customExpirationDate: "",
    installation_address_line2: "",
    installation_address_city: "",
    installation_address_pin: "",
    installation_address_state: "",
    installation_address_country: "IN",
    caf_num: "",
    createBilling: true,
    notifyUserSms: true
  });
  const [groupOptions, setGroupOptions] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    groupId: "",
    profileId: "",
    amount: ""
  });
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [formError, setFormError] = useState("");
  const [files, setFiles] = useState({
    idFile: null,
    addressFile: null,
    signFile: null,
    profilePicFile: null
  });
  const isUserDetailsComplete = Boolean(
    newSubscriber.firstName?.trim() &&
    newSubscriber.phoneNumber?.trim() &&
    newSubscriber.emailId?.trim()
  );

  // Fetch customers with filters
  useEffect(() => {
    fetchCustomers(page);
  }, [page, searchTerm, selectedPlan, selectedStatus]);

  useEffect(() => {
    if (!resolvedAccountId) return;
    setNewSubscriber((prev) => ({ ...prev, accountId: resolvedAccountId }));
  }, [resolvedAccountId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showFilter) return;
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilter]);

  const fetchCustomers = async (pageNumber) => {
    try {
      setLoading(true);
      const res = await getCustomers(pageNumber, itemsPerPage, {
        search: searchTerm?.trim(),
        plan: selectedPlan !== "All" ? selectedPlan : undefined,
        status: selectedStatus !== "All" ? selectedStatus : undefined
      });

      const customers = res.data || [];
      const pagination = res.pagination || res.meta?.pagination || res.meta || {};

      const formatted = customers.map((c) => ({
        id: c._id,
        name: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
        firstName: c.firstName || "",
        lastName: c.lastName || "",
        phone: c.phoneNumber || "N/A",
        email: c.emailId || "N/A",
        userId: c.userName || "N/A",
        status: c.status === "ACTIVE" ? "Active" : "Inactive",
        plan: c.userType === "business" ? "Business" : "Home",
        activationDate: c.customActivationDate || c.activationDate || "N/A",
        cafNum: c.cafNum || "N/A"
      }));

      setSubscribers(formatted);
      setTotalPages(Math.max(1, Number(pagination.totalPages ?? pagination.pages ?? 1)));
      setTotalItems(Number(pagination.total ?? pagination.totalItems ?? customers.length ?? 0));
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer details for view modal
  const fetchCustomerDetails = async (customerId) => {
    try {
      setLoadingDetails(true);
      const response = await api.get(`/api/customer/customers/${customerId}`);
      if (response.data.success) {
        setViewCustomerDetails(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Navigate to customer details page
  const openViewModal = (customer) => {
    navigate(`/my-customers-details/${customer.id}`);
  };

  const handleAddInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextSubscriber = {
      ...newSubscriber,
      [name]: type === "checkbox" ? checked : value
    };
    setNewSubscriber(nextSubscriber);
    setFormError("");

    if (name === "userGroupId") {
      setPaymentForm((prev) => ({
        ...prev,
        groupId: value
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (!fileList || fileList.length === 0) return;
    setFiles((prev) => ({
      ...prev,
      [name]: fileList[0]
    }));
  };

  useEffect(() => {
    const accountId = newSubscriber.accountId?.trim();
    const type = newSubscriber.userType?.trim();
    if (!accountId) {
      setGroupOptions([]);
      setGroupError("");
      setGroupLoading(false);
      return;
    }
    setGroupLoading(true);
    setGroupError("");
    getFranchiseProfiles(accountId, true, type)
      .then((res) => {
        const rows = res?.data?.data ?? res?.data ?? [];
        const profiles = Array.isArray(rows) ? rows : [];
        const groupMap = new Map();
        profiles.forEach((profile) => {
          const groupId =
            profile?.Profile?.groupId ||
            profile?.groupId ||
            profile?.group_id ||
            profile?.userGroupId ||
            "";
          if (!groupId || groupMap.has(groupId)) return;
          groupMap.set(groupId, {
            Group_id: groupId,
            Group_name: profile?.Profile?.name || groupId
          });
        });
        setGroupOptions(Array.from(groupMap.values()));
      })
      .catch((err) => {
        setGroupOptions([]);
        setGroupError(err?.response?.data?.message || err?.message || "Failed to load groups");
      })
      .finally(() => setGroupLoading(false));
  }, [newSubscriber.accountId, newSubscriber.userType]);

  const handleCreateCustomer = async () => {
    if (isCreatingCustomer) return;
    const requiredFields = [
      { key: "firstName", label: "First Name" },
      { key: "phoneNumber", label: "Phone Number" },
      { key: "emailId", label: "Email ID" },
      { key: "installation_address_line2", label: "Address Line 2" },
      { key: "installation_address_city", label: "City" },
      { key: "installation_address_pin", label: "Pin Code" },
      { key: "installation_address_state", label: "State" }
    ];
    const missing = requiredFields
      .filter((f) => !newSubscriber[f.key]?.toString().trim())
      .map((f) => f.label);
    if (missing.length > 0) {
      setFormError(`Please fill: ${missing.join(", ")}`);
      return;
    }

    const formData = new FormData();
    Object.keys(newSubscriber).forEach((key) => {
      if (key === "createBilling" || key === "notifyUserSms") {
        formData.append(key, newSubscriber[key] ? "on" : "off");
      } else {
        formData.append(key, newSubscriber[key]);
      }
    });

    try {
      setIsCreatingCustomer(true);
      Object.keys(files).forEach((key) => {
        if (files[key]) {
          formData.append(key, files[key]);
        }
      });

      const res = await createCustomer(formData);
      if (res.data.success) {
        fetchCustomers(page);
        const createdPayload = res?.data?.data || res?.data?.customer || res?.data || null;
        setCreatedCustomer(createdPayload);
        setPaymentStatus({ type: "success", message: "Customer created. You can select plans now." });
        setFormError("");
        setFiles({ idFile: null, addressFile: null, signFile: null, profilePicFile: null });
      }
    } catch (err) {
      console.error("Failed to create customer", err);
      alert("Failed to create customer: " + (err.response?.data?.message || err.message));
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleGoToPlans = () => {
    if (!createdCustomer || !newSubscriber.accountId?.trim()) return;
    const createdUserName =
      createdCustomer?.userName ||
      createdCustomer?.username ||
      createdCustomer?.data?.userName ||
      "";
    const createdCustomerId =
      createdCustomer?.id ||
      createdCustomer?._id ||
      createdCustomer?.customerId ||
      createdCustomer?.activlineUserId ||
      createdCustomer?.data?.id ||
      "";

    navigate("/customer-plans", {
      state: {
        accountId: newSubscriber.accountId,
        firstName: newSubscriber.firstName,
        lastName: newSubscriber.lastName,
        phoneNumber: newSubscriber.phoneNumber,
        emailId: newSubscriber.emailId,
        userName: createdUserName,
        customerId: createdCustomerId,
        userType: newSubscriber.userType,
        groupId: paymentForm.groupId,
        profileId: paymentForm.profileId
      }
    });
  };

  // Open edit modal
  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phoneNumber: customer.phone,
      emailId: customer.email
    });
    setEditModal(true);
  };

  // Update customer
  const updateCustomer = async () => {
    try {
      await editCustomer(selectedCustomer.id, editForm);
      
      setSubscribers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id
            ? {
                ...c,
                name: `${editForm.firstName} ${editForm.lastName}`.trim(),
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                phone: editForm.phoneNumber,
                email: editForm.emailId
              }
            : c
        )
      );

      setEditModal(false);
    } catch (err) {
      console.error("Update error", err);
    }
  };

 

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPlan("All");
    setSelectedStatus("All");
    setPage(1);
  };

  return (
    <div className={`rounded-xl shadow-lg border flex flex-col h-full ${
      isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
    }`}>
      
      {/* Header with Animation */}
      <div className={`p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        isDark ? "border-slate-800" : "border-gray-200"
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-30 h-20">
            <Lottie animationData={fadeSlideAnimation} loop={true} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}>
              My Subscribers
            </h2>
            <p className={`text-base ${
              isDark ? "text-slate-400" : "text-gray-600"
            }`}>
              Manage your franchise customers
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center w-full md:w-auto min-w-0">
          <button
            onClick={() => {
              setAddModal(true);
              setCreatedCustomer(null);
              setPaymentStatus(null);
              setPaymentVerified(false);
              setFiles({ idFile: null, addressFile: null, signFile: null, profilePicFile: null });
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>

          <div ref={filterRef} className="flex flex-col sm:flex-row gap-3 relative items-stretch sm:items-center w-full md:w-auto min-w-0">
          <div className="relative w-full sm:w-72 min-w-0">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? "text-slate-400" : "text-gray-400"
            }`} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none 
                focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all
                ${isDark
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                }`}
            />
          </div>

          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm transition-all
              ${isDark 
                ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" 
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>

          {/* Filter Popup */}
          {showFilter && (
            <div className={`absolute left-0 right-0 sm:left-auto sm:right-0 top-12 w-full sm:w-72 p-4 rounded-xl shadow-2xl border z-50 animate-in fade-in zoom-in duration-150
              ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"}`}>
              <h4 className={`text-base font-bold mb-3 ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                Filters
              </h4>

              <label className={`text-sm font-semibold ${
                isDark ? "text-slate-400" : "text-gray-600"
              }`}>
                Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => {
                  setSelectedPlan(e.target.value);
                  setPage(1);
                }}
                className={`w-full mt-1 mb-3 p-2 border rounded-lg text-sm
                  ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300"}`}
              >
                <option value="All">All Plans</option>
                <option value="business">Business</option>
                <option value="home">Home</option>
              </select>

              <label className={`text-sm font-semibold ${
                isDark ? "text-slate-400" : "text-gray-600"
              }`}>
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className={`w-full mt-1 mb-3 p-2 border rounded-lg text-sm
                  ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300"}`}
              >
                <option value="All">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <button
                onClick={clearFilters}
                className="w-full mt-2 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`animate-pulse h-16 rounded-lg ${
                isDark ? "bg-slate-800" : "bg-gray-200"
              }`}></div>
            ))}
          </div>
        ) : subscribers.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            No subscribers found
          </div>
        ) : (
          <div className={`rounded-lg border overflow-hidden ${
            isDark ? "border-slate-800" : "border-gray-200"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className={`${
                    isDark ? "bg-slate-800/50 border-b border-slate-800" : "bg-gray-50 border-b border-gray-200"
                  }`}>
                    <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                      isDark ? "text-slate-400" : "text-gray-600"
                    }`}>Customer</th>
                    <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                      isDark ? "text-slate-400" : "text-gray-600"
                    }`}>Plan</th>
                    <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                      isDark ? "text-slate-400" : "text-gray-600"
                    }`}>Status</th>
                    <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${
                      isDark ? "text-slate-400" : "text-gray-600"
                    }`}>Contact</th>
                    <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider text-right ${
                      isDark ? "text-slate-400" : "text-gray-600"
                    }`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDark ? "divide-slate-800" : "divide-gray-200"
                }`}>
                  {subscribers.map((sub) => (
                    <tr
                      key={sub.id}
                      className={`group transition-all duration-150 ${
                        isDark ? "hover:bg-slate-800/50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                            isDark ? "ring-2 ring-blue-500/20" : "ring-2 ring-blue-500/10"
                          }`}>
                            {sub.name.charAt(0) || "?"}
                          </div>
                          <div className="min-w-0">
                            <div className={`font-semibold text-sm truncate ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}>
                              {sub.name || "N/A"}
                            </div>
                            <div className={`text-xs mt-0.5 ${
                              isDark ? "text-slate-500" : "text-gray-500"
                            }`}>
                              ID: {sub.userId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-sm font-medium ${
                          isDark ? "text-slate-200" : "text-gray-700"
                        }`}>
                          {sub.plan}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          sub.status === "Active"
                            ? isDark
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-green-50 text-green-700 border border-green-200"
                            : isDark
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {sub.status === "Active" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                          )}
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`text-sm ${
                          isDark ? "text-slate-300" : "text-gray-700"
                        }`}>
                          {sub.phone}
                        </div>
                        <div className={`text-xs mt-0.5 ${
                          isDark ? "text-slate-500" : "text-gray-500"
                        }`}>
                          {sub.email}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewModal(sub)}
                            className={`p-2 rounded-lg transition-all ${
                              isDark
                                ? "hover:bg-slate-800 text-slate-400 hover:text-blue-400"
                                : "hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                            }`}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(sub)}
                            className={`p-2 rounded-lg transition-all ${
                              isDark
                                ? "hover:bg-slate-800 text-slate-400 hover:text-green-400"
                                : "hover:bg-gray-100 text-gray-400 hover:text-green-600"
                            }`}
                            title="Edit Customer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                         
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && subscribers.length > 0 && (
          <div className={`mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t ${
            isDark ? "border-slate-800" : "border-gray-200"
          }`}>
            <div className={`text-sm ${
              isDark ? "text-slate-400" : "text-gray-600"
            }`}>
              Showing <span className={`font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1}
              </span> to{" "}
              <span className={`font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {Math.min(page * itemsPerPage, totalItems)}
              </span> of{" "}
              <span className={`font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {totalItems}
              </span> entries
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  page === 1
                    ? isDark
                      ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isDark
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className={`px-3 py-1.5 text-sm font-medium ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  page === totalPages
                    ? isDark
                      ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isDark
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 border ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
          }`}>
            <div className={`p-4 border-b flex justify-between items-center rounded-t-xl ${
              isDark ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-white"
            }`}>
              <h3 className={`text-xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                Edit Customer
              </h3>
              <button
                onClick={() => setEditModal(false)}
                className={`transition-colors ${
                  isDark ? "text-slate-400 hover:text-white" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? "text-slate-400" : "text-gray-600"
                }`}>
                  First Name
                </label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? "text-slate-400" : "text-gray-600"
                }`}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? "text-slate-400" : "text-gray-600"
                }`}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? "text-slate-400" : "text-gray-600"
                }`}>
                  Email ID
                </label>
                <input
                  type="email"
                  value={editForm.emailId}
                  onChange={(e) => setEditForm({ ...editForm, emailId: e.target.value })}
                  className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                />
              </div>
            </div>

            <div className={`p-4 border-t flex gap-3 justify-end rounded-b-xl ${
              isDark ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-white"
            }`}>
              <button
                onClick={() => setEditModal(false)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={updateCustomer}
                className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-500 shadow-sm transition-all"
              >
                Update Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal - Full Details */}
      {viewModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 border ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
          }`}>
            <div className={`p-4 border-b flex justify-between items-center rounded-t-xl ${
              isDark ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-white"
            }`}>
              <h3 className={`text-xl font-bold flex items-center gap-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                <User className="w-5 h-5" />
                Customer Details
              </h3>
              <button
                onClick={() => setViewModal(false)}
                className={`transition-colors ${
                  isDark ? "text-slate-400 hover:text-white" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className={`mt-4 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                  Loading details...
                </p>
              </div>
            ) : viewCustomerDetails ? (
              <div className="p-6 space-y-6">
                {/* Header with Avatar */}
                <div className="flex items-center gap-4 pb-4 border-b">
                  <div className={`w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl flex-shrink-0 ${
                    isDark ? "ring-2 ring-blue-500/20" : "ring-2 ring-blue-500/10"
                  }`}>
                    {selectedCustomer.name.charAt(0) || "?"}
                  </div>
                  <div>
                    <h4 className={`text-xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}>
                      {selectedCustomer.name}
                    </h4>
                    <p className={`text-sm ${
                      isDark ? "text-slate-400" : "text-gray-600"
                    }`}>
                      User ID: {viewCustomerDetails.userName || "N/A"}
                    </p>
                  </div>
                  <span className={`ml-auto px-3 py-1.5 rounded-full text-sm font-medium ${
                    viewCustomerDetails.status === "ACTIVE"
                      ? isDark
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-green-50 text-green-700 border border-green-200"
                      : isDark
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {viewCustomerDetails.status === "ACTIVE" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse inline-block"></span>
                    )}
                    {viewCustomerDetails.status || "N/A"}
                  </span>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className={`p-4 rounded-lg ${
                    isDark ? "bg-slate-800/50" : "bg-gray-50"
                  }`}>
                    <h5 className={`text-sm font-bold uppercase mb-3 flex items-center gap-2 ${
                      isDark ? "text-slate-400" : "text-gray-500"
                    }`}>
                      <User className="w-4 h-4" />
                      Personal Information
                    </h5>
                    <div className="space-y-2">
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">First Name:</span>{" "}
                        {viewCustomerDetails.firstName || "N/A"}
                      </p>
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">Last Name:</span>{" "}
                        {viewCustomerDetails.lastName || "N/A"}
                      </p>
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">Account ID:</span>{" "}
                        {viewCustomerDetails.accountId || "N/A"}
                      </p>
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">User Group ID:</span>{" "}
                        {viewCustomerDetails.userGroupId || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className={`p-4 rounded-lg ${
                    isDark ? "bg-slate-800/50" : "bg-gray-50"
                  }`}>
                    <h5 className={`text-sm font-bold uppercase mb-3 flex items-center gap-2 ${
                      isDark ? "text-slate-400" : "text-gray-500"
                    }`}>
                      <Mail className="w-4 h-4" />
                      Contact Information
                    </h5>
                    <div className="space-y-2">
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">Phone:</span>{" "}
                        {viewCustomerDetails.phoneNumber || "N/A"}
                      </p>
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">Email:</span>{" "}
                        {viewCustomerDetails.emailId || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Service Details */}
                  <div className={`p-4 rounded-lg ${
                    isDark ? "bg-slate-800/50" : "bg-gray-50"
                  }`}>
                    <h5 className={`text-sm font-bold uppercase mb-3 flex items-center gap-2 ${
                      isDark ? "text-slate-400" : "text-gray-500"
                    }`}>
                      <CreditCard className="w-4 h-4" />
                      Service Details
                    </h5>
                    <div className="space-y-2">
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">Plan Type:</span>{" "}
                        {viewCustomerDetails.userType === "business" ? "Business" : "Home"}
                      </p>
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">CAF Number:</span>{" "}
                        {viewCustomerDetails.cafNum || "N/A"}
                      </p>
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">ActivLine User ID:</span>{" "}
                        {viewCustomerDetails.activlineUserId || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Activation Dates */}
                  <div className={`p-4 rounded-lg ${
                    isDark ? "bg-slate-800/50" : "bg-gray-50"
                  }`}>
                    <h5 className={`text-sm font-bold uppercase mb-3 flex items-center gap-2 ${
                      isDark ? "text-slate-400" : "text-gray-500"
                    }`}>
                      <Calendar className="w-4 h-4" />
                      Activation Dates
                    </h5>
                    <div className="space-y-2">
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">Activation:</span>{" "}
                        {viewCustomerDetails.customActivationDate || "Now"}
                      </p>
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">Expiration:</span>{" "}
                        {viewCustomerDetails.customExpirationDate || "N/A"}
                      </p>
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">Created:</span>{" "}
                        {new Date(viewCustomerDetails.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Installation Address */}
                  <div className={`p-4 rounded-lg col-span-2 ${
                    isDark ? "bg-slate-800/50" : "bg-gray-50"
                  }`}>
                    <h5 className={`text-sm font-bold uppercase mb-3 flex items-center gap-2 ${
                      isDark ? "text-slate-400" : "text-gray-500"
                    }`}>
                      <MapPin className="w-4 h-4" />
                      Installation Address
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">Address Line 2:</span>{" "}
                        {viewCustomerDetails.installationAddress?.line2 || "N/A"}
                      </p>
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">City:</span>{" "}
                        {viewCustomerDetails.installationAddress?.city || "N/A"}
                      </p>
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">State:</span>{" "}
                        {viewCustomerDetails.installationAddress?.state || "N/A"}
                      </p>
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">Pin Code:</span>{" "}
                        {viewCustomerDetails.installationAddress?.pin || "N/A"}
                      </p>
                      <p className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        <span className="font-medium">Country:</span>{" "}
                        {viewCustomerDetails.installationAddress?.country || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Documents */}
                  {viewCustomerDetails.documents && (
                    <div className={`p-4 rounded-lg col-span-2 ${
                      isDark ? "bg-slate-800/50" : "bg-gray-50"
                    }`}>
                      <h5 className={`text-sm font-bold uppercase mb-3 flex items-center gap-2 ${
                        isDark ? "text-slate-400" : "text-gray-500"
                      }`}>
                        <FileText className="w-4 h-4" />
                        Documents
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(viewCustomerDetails.documents).map(([key, value]) => (
                          value && (
                            <a
                              key={key}
                              href={value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 p-2 rounded-lg border text-sm hover:bg-opacity-80 transition-all ${
                                isDark
                                  ? "border-slate-700 text-slate-300 hover:bg-slate-700"
                                  : "border-gray-200 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <Download className="w-4 h-4" />
                              <span className="truncate">
                                {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                              </span>
                              <ExternalLink className="w-3 h-3 ml-auto" />
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className={isDark ? "text-slate-400" : "text-gray-600"}>
                  Failed to load customer details
                </p>
              </div>
            )}

            <div className={`p-4 border-t flex gap-3 justify-end rounded-b-xl ${
              isDark ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-white"
            }`}>
              <button
                onClick={() => setViewModal(false)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDark
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "bg-blue-600 text-white hover:bg-blue-500"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {addModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 border ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
          }`}>
            <div className={`p-4 border-b flex justify-between items-center rounded-t-xl ${
              isDark ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-white"
            }`}>
              <h3 className={`text-xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                Add New Customer
              </h3>
              <button
                onClick={() => setAddModal(false)}
                className={`transition-colors ${
                  isDark ? "text-slate-400 hover:text-white" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

              <div className="p-6 space-y-4">
                <div>
                  {/* Personal Info */}
                  <h4 className={`text-base font-bold uppercase mt-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={newSubscriber.firstName}
                        onChange={handleAddInputChange}
                        className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={newSubscriber.lastName}
                        onChange={handleAddInputChange}
                        className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={newSubscriber.phoneNumber}
                        onChange={handleAddInputChange}
                        className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        Email ID
                      </label>
                      <input
                        type="email"
                        name="emailId"
                        value={newSubscriber.emailId}
                        onChange={handleAddInputChange}
                        className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Service Info */}
                  <h4 className={`text-base font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Service Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        User Type
                      </label>
                      <select
                        name="userType"
                        value={newSubscriber.userType}
                        onChange={handleAddInputChange}
                        className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="business">Business</option>
                        <option value="home">Home</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        Activation Date
                      </label>
                      <select
                        name="activationDate"
                        value={newSubscriber.activationDate}
                        onChange={handleAddInputChange}
                        className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="now">Now</option>
                      </select>
                    </div>
                  </div>

                  {/* Address */}
                  <h4 className={`text-base font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Installation Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={`block text-base font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        name="installation_address_line2"
                        value={newSubscriber.installation_address_line2}
                        onChange={handleAddInputChange}
                        placeholder="Floor, Building, Street"
                        className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        City
                      </label>
                      <input
                        type="text"
                        name="installation_address_city"
                        value={newSubscriber.installation_address_city}
                        onChange={handleAddInputChange}
                        className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        State
                      </label>
                      <input
                        type="text"
                        name="installation_address_state"
                        value={newSubscriber.installation_address_state}
                        onChange={handleAddInputChange}
                        className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        Pin Code
                      </label>
                      <input
                        type="text"
                        name="installation_address_pin"
                        value={newSubscriber.installation_address_pin}
                        onChange={handleAddInputChange}
                        className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        Country
                      </label>
                      <input
                        type="text"
                        name="installation_address_country"
                        value={newSubscriber.installation_address_country}
                        onChange={handleAddInputChange}
                        className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="flex gap-6 mt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="createBilling"
                        checked={newSubscriber.createBilling}
                        onChange={handleAddInputChange}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-base ${isDark ? "text-slate-300" : "text-gray-700"}`}>Create Billing</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="notifyUserSms"
                        checked={newSubscriber.notifyUserSms}
                        onChange={handleAddInputChange}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-base ${isDark ? "text-slate-300" : "text-gray-700"}`}>Notify User via SMS</span>
                    </label>
                  </div>

                  {/* Documents */}
                  <h4 className={`text-base font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Documents Upload</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['idFile', 'addressFile', 'signFile', 'profilePicFile'].map((fileKey) => (
                      <div key={fileKey}>
                        <label className={`block text-base font-medium mb-1 capitalize ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                          {fileKey.replace('File', '').replace(/([A-Z])/g, ' $1')}
                        </label>
                        <input
                          type="file"
                          name={fileKey}
                          onChange={handleFileChange}
                          className={`w-full text-base ${isDark ? 'text-slate-400 file:bg-slate-800 file:text-slate-300' : 'text-gray-600 file:bg-gray-100 file:text-gray-700'} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold hover:file:bg-blue-100 transition-all`}
                        />
                      </div>
                    ))}
                  </div>
                  {Object.values(files).some(Boolean) && (
                    <div className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      <div className="font-semibold mb-1">Selected documents</div>
                      {Object.entries(files).map(([key, file]) => (
                        file ? (
                          <div key={key}>
                            {key.replace('File', '').replace(/([A-Z])/g, ' $1')}: {file.name}
                          </div>
                        ) : null
                      ))}
                    </div>
                  )}

                  {/* Franchise & Payment */}
                  <h4 className={`text-base font-bold uppercase mt-6 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Franchise & Payment</h4>
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isUserDetailsComplete ? '' : 'opacity-60 pointer-events-none'}`}>
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        Account ID
                      </label>
                      <input
                        type="text"
                        name="accountId"
                        value={newSubscriber.accountId}
                        readOnly
                        className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        Group / Plan
                      </label>
                      <select
                        name="userGroupId"
                        value={newSubscriber.userGroupId}
                        onChange={handleAddInputChange}
                        className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="">Select Group</option>
                        {groupOptions.map((group) => (
                          <option key={group.Group_id || group.Group_name} value={group.Group_id || ""}>
                            {group.Group_name || group.Group_id}
                          </option>
                        ))}
                      </select>
                      {groupLoading && (
                        <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Loading groups...</div>
                      )}
                      {groupError && (
                        <div className={`text-xs mt-1 ${isDark ? 'text-red-300' : 'text-red-600'}`}>{groupError}</div>
                      )}
                    </div>
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        User Group ID
                      </label>
                      <input
                        type="number"
                        name="userGroupId"
                        value={newSubscriber.userGroupId}
                        readOnly
                        disabled
                        className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    {!isUserDetailsComplete && (
                      <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        Fill user details above to unlock plan selection.
                      </div>
                    )}
                    {isUserDetailsComplete && !newSubscriber.accountId && (
                      <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        Select an Account ID to view plans on the next page.
                      </div>
                    )}
                    {isUserDetailsComplete && newSubscriber.accountId && !createdCustomer && (
                      <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        Create the customer first. After creation, you can select plans and pay.
                      </div>
                    )}
                  </div>
                </div>

                {formError && (
                  <div className={`text-base ${isDark ? "text-red-300" : "text-red-600"}`}>
                    {formError}
                  </div>
                )}

                {paymentStatus && (
                  <div className={`mt-4 text-sm ${paymentStatus.type === "success"
                    ? isDark ? "text-green-300" : "text-green-700"
                    : isDark ? "text-red-300" : "text-red-600"
                  }`}>
                    {paymentStatus.message}
                  </div>
                )}
              </div>

            <div className={`p-4 border-t flex gap-3 justify-end rounded-b-xl ${
              isDark ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-white"
            }`}>
              <button
                onClick={() => setAddModal(false)}
                className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${
                  isDark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              {createdCustomer ? (
                <button
                  onClick={handleGoToPlans}
                  className="px-4 py-2 text-base font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-500 shadow-sm transition-all"
                >
                  Select Plans & Pay
                </button>
              ) : (
                <button
                  onClick={handleCreateCustomer}
                  disabled={isCreatingCustomer}
                  className="px-4 py-2 text-base font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-sm transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingCustomer && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCreatingCustomer ? "Creating..." : "Create Customer"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySubscribers;
