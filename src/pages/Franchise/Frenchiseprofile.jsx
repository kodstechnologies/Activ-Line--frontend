import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Settings, Save, Loader2, Camera, User, Mail, Lock, 
  AlertCircle, CheckCircle, Shield, Building2, Clock,
  Sparkles, ChevronRight, Calendar, Image as ImageIcon,
  Trash2, Edit2, X, Globe, Phone, MapPin, Award
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { getMyProfile, updateMyProfile } from "../../api/frenchise/franchiseprofile";
import {
  getAccountMaintenance,
  createAccountMaintenance,
  updateAccountMaintenance,
  deleteAccountMaintenance
} from "../../api/customer.api";
import GeneralSettings from "../Admin/Settings/GeneralSettings";
import { toast } from "react-hot-toast";

const Profile = () => {
  const { isDark } = useTheme();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    profileImage: "",
    maintenanceLastDate: "",
    maintenanceEndDate: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [accountId, setAccountId] = useState("");
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [maintenanceDeleting, setMaintenanceDeleting] = useState(false);
  const [maintenanceExists, setMaintenanceExists] = useState(false);
  const [maintenanceSnapshot, setMaintenanceSnapshot] = useState({
    lastDate: "",
    endDate: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Memoized values for performance
  const hasChanges = useMemo(() => {
    return !!(form.name || form.email || form.phone || form.address || form.website || password || profileImageFile);
  }, [form.name, form.email, form.phone, form.address, form.website, password, profileImageFile]);

  const isPasswordValid = useMemo(() => {
    if (!password) return true;
    return password.length >= 8;
  }, [password]);

  const doPasswordsMatch = useMemo(() => {
    if (!password && !confirmPassword) return true;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyProfile();
      if (res.data.success) {
        const resolvedAccountId =
          res.data.data.accountId ||
          res.data.data.accountID ||
          res.data.data.franchiseAccountId ||
          "";
        setForm({
          name: res.data.data.name || "",
          email: res.data.data.email || "",
          phone: res.data.data.phone || "",
          address: res.data.data.address || "",
          website: res.data.data.website || "",
          profileImage: res.data.data.profileImage || "",
          maintenanceLastDate: "",
          maintenanceEndDate: "",
        });
        setAccountId(resolvedAccountId);
        setLastUpdated(new Date());
        if (resolvedAccountId) {
          setMaintenanceLoading(true);
          try {
            const maintenanceRes = await getAccountMaintenance(resolvedAccountId);
            const data = maintenanceRes?.data?.data || {};
            setForm((prev) => ({
              ...prev,
              maintenanceLastDate: data.lastDate || "",
              maintenanceEndDate: data.endDate || ""
            }));
            setMaintenanceSnapshot({
              lastDate: data.lastDate || "",
              endDate: data.endDate || ""
            });
            setMaintenanceExists(Boolean(data.lastDate || data.endDate));
          } catch (err) {
            const status = err?.response?.status;
            if (status === 404) {
              setMaintenanceExists(false);
              setForm((prev) => ({
                ...prev,
                maintenanceLastDate: "",
                maintenanceEndDate: ""
              }));
              setMaintenanceSnapshot({ lastDate: "", endDate: "" });
            } else {
              toast.error(
                err.response?.data?.message || "Failed to load maintenance dates"
              );
            }
          } finally {
            setMaintenanceLoading(false);
          }
        }
      } else {
        toast.error(res.data.message || "Failed to load profile");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Network / server error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const validateForm = () => {
    const newErrors = {};

    if (password && password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (form.phone && !/^[+]?[\d\s-]{10,}$/.test(form.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (form.website && !/^https?:\/\/[^\s]+$/.test(form.website)) {
      newErrors.website = "Please enter a valid URL (http:// or https://)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateMaintenance = () => {
    const newErrors = {};
    if (form.maintenanceLastDate && form.maintenanceEndDate) {
      const last = new Date(form.maintenanceLastDate);
      const end = new Date(form.maintenanceEndDate);
      if (last > end) {
        newErrors.maintenanceEndDate = "End date must be on or after last date";
      }
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    setSaving(true);

    const formData = new FormData();
    
    if (form.name?.trim()) formData.append("name", form.name.trim());
    if (form.email?.trim()) formData.append("email", form.email.trim());
    if (form.phone?.trim()) formData.append("phone", form.phone.trim());
    if (form.address?.trim()) formData.append("address", form.address.trim());
    if (form.website?.trim()) formData.append("website", form.website.trim());
    if (password?.trim()) formData.append("password", password);
    if (profileImageFile) formData.append("profileImage", profileImageFile);

    try {
      const res = await updateMyProfile(formData);
      if (res.data.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Profile updated successfully!</span>
          </div>,
          { duration: 4000 }
        );
        
        setForm(res.data.data);
        setPassword("");
        setConfirmPassword("");
        setProfileImageFile(null);
        setErrors({});
        setLastUpdated(new Date());
      } else {
        toast.error(res.data.message || "Update failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    setConfirmPassword("");
    setProfileImageFile(null);
    setErrors({});
    fetchProfile();
    toast.success("Changes discarded");
  };

  const handleSaveMaintenance = async () => {
    if (!accountId) {
      toast.error("Account ID not found.");
      return;
    }
    if (!validateMaintenance()) {
      toast.error("Please fix the maintenance date errors.");
      return;
    }
    if (!form.maintenanceLastDate && !form.maintenanceEndDate) {
      toast.error("Please enter at least one maintenance date.");
      return;
    }
    setMaintenanceSaving(true);
    try {
      const payload = {
        lastDate: form.maintenanceLastDate || null,
        endDate: form.maintenanceEndDate || null
      };
      if (maintenanceExists) {
        await updateAccountMaintenance(accountId, payload);
      } else {
        await createAccountMaintenance(accountId, payload);
      }
      setMaintenanceExists(true);
      toast.success("Maintenance dates saved.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to save maintenance dates"
      );
    } finally {
      setMaintenanceSaving(false);
    }
  };

  const handleCancelMaintenance = () => {
    setForm((prev) => ({
      ...prev,
      maintenanceLastDate: maintenanceSnapshot.lastDate || "",
      maintenanceEndDate: maintenanceSnapshot.endDate || ""
    }));
    setErrors((prev) => ({ ...prev, maintenanceEndDate: undefined }));
    toast.success("Maintenance changes discarded");
  };

  const handleDeleteMaintenance = async () => {
    if (!accountId) {
      toast.error("Account ID not found.");
      return;
    }
    setMaintenanceDeleting(true);
    try {
      await deleteAccountMaintenance(accountId);
      setMaintenanceExists(false);
      setMaintenanceSnapshot({ lastDate: "", endDate: "" });
      setForm((prev) => ({
        ...prev,
        maintenanceLastDate: "",
        maintenanceEndDate: ""
      }));
      toast.success("Maintenance dates deleted.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to delete maintenance dates"
      );
    } finally {
      setMaintenanceDeleting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <Sparkles className="w-6 h-6 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className={`text-lg font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDark ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" : "bg-gradient-to-br from-blue-50 via-indigo-50/30 to-blue-50"
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-7xl">

        {/* Header with glass morphism effect */}
        <div className={`mb-8 p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
          isDark ? "bg-slate-800/50 border border-slate-700 shadow-xl" : "bg-white/70 border border-blue-100 shadow-lg"
        }`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${
                isDark ? "from-blue-400 via-cyan-400 to-blue-300" : "from-blue-600 via-indigo-600 to-blue-600"
              } bg-clip-text text-transparent flex items-center gap-3`}>
                <Building2 className="w-8 h-8 text-blue-500" />
                Franchise Dashboard
              </h1>
              <p className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Manage your franchise profile, settings, and maintenance schedule
              </p>
            </div>
            
            {lastUpdated && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isDark ? "bg-slate-700/50" : "bg-blue-50"
              }`}>
                <Clock className="w-4 h-4 text-blue-500" />
                <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Last updated: {lastUpdated.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { id: "profile", label: "Profile Information", icon: User },
            { id: "general", label: "General Settings", icon: Settings },
            { id: "maintenance", label: "Maintenance Schedule", icon: Calendar },
            { id: "security", label: "Security Settings", icon: Shield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? isDark
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                    : "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                  : isDark
                  ? "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                  : "bg-white/50 text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left – Avatar & Quick Info */}
          <div className="lg:w-1/3">
            <div className={`sticky top-6 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-2xl ${
              isDark 
                ? "bg-slate-800/90 border border-slate-700" 
                : "bg-white/90 border border-blue-100 shadow-xl"
            }`}>
              <div className={`h-32 bg-gradient-to-r ${isDark ? "from-blue-600 to-cyan-600" : "from-blue-600 to-indigo-600"} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <Sparkles className="absolute top-4 right-4 w-8 h-8 text-white/30 animate-pulse" />
              </div>
              
              <div className="px-6 pb-6 -mt-16">
                <div className="relative mb-4 flex justify-center">
                  <div className="relative group">
                    <div className={`w-28 h-28 rounded-2xl overflow-hidden border-4 ${
                      isDark ? "border-slate-800" : "border-white"
                    } shadow-xl transition-transform duration-300 group-hover:scale-105`}>
                      <img
                        src={form.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || "Franchise")}&background=3b82f6&color=fff&bold=true&size=128&rounded=true`}
                        alt="Franchise Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <label
                      htmlFor="avatar-upload"
                      className={`absolute -bottom-2 -right-2 bg-gradient-to-r ${isDark ? "from-blue-600 to-cyan-600" : "from-blue-600 to-indigo-600"} hover:from-blue-700 hover:to-indigo-700 text-white p-2.5 rounded-full cursor-pointer shadow-lg transition-all transform hover:scale-110`}
                    >
                      <Camera className="w-4 h-4" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>

                <div className="text-center">
                  <h2 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    {form.name || "Franchise Name"}
                  </h2>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Mail className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                    <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                      {form.email || "—"}
                    </p>
                  </div>
                  {form.phone && (
                    <div className="flex items-center justify-center gap-2 text-sm mt-1">
                      <Phone className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                      <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                        {form.phone}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick stats */}
                <div className="mt-6 space-y-3">
                  <div className={`p-3 rounded-xl ${
                    isDark ? "bg-slate-700/50" : "bg-blue-50"
                  }`}>
                    <div className="flex items-center gap-3 text-sm">
                      <Shield className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                      <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                        Security: {password ? "Pending changes" : "Active"}
                      </span>
                    </div>
                  </div>
                  
                  {form.website && (
                    <div className={`p-3 rounded-xl ${
                      isDark ? "bg-slate-700/50" : "bg-blue-50"
                    }`}>
                      <div className="flex items-center gap-3 text-sm">
                        <Globe className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                        <a href={form.website} target="_blank" rel="noopener noreferrer" 
                           className={`hover:underline ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right – Form Fields */}
          <div className="lg:w-2/3 space-y-6">
            
            {/* Profile Information Tab */}
            {activeTab === "profile" && (
              <div className={`rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 ${
                isDark 
                  ? "bg-slate-800/90 border border-slate-700" 
                  : "bg-white/90 border border-blue-100 shadow-xl"
              }`}>
                <div className={`p-6 border-b ${
                  isDark ? "border-slate-700" : "border-blue-100"
                }`}>
                  <h3 className={`text-xl font-semibold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    <User className="w-5 h-5 text-blue-500" />
                    Profile Information
                    {hasChanges && (
                      <span className={`ml-auto text-sm font-normal px-3 py-1 rounded-full animate-pulse ${
                        isDark ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        Unsaved changes
                      </span>
                    )}
                  </h3>
                </div>

                <div className="p-6 lg:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={`flex items-center text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        <User className="w-4 h-4 mr-2 text-blue-500" />
                        Franchise Name *
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none ${
                          isDark
                            ? "bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                            : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        }`}
                        placeholder="Your franchise name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={`flex items-center text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        <Mail className="w-4 h-4 mr-2 text-blue-500" />
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none ${
                          isDark
                            ? "bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                            : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        }`}
                        placeholder="contact@yourfranchise.com"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.email}
                        </p>
                      )}
                    </div>
                

                   
                  </div>
                </div>
              </div>
            )}

            {/* General Settings Tab */}
            {activeTab === "general" && (
              <div className={`rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 ${
                isDark 
                  ? "bg-slate-800/90 border border-slate-700" 
                  : "bg-white/90 border border-blue-100 shadow-xl"
              }`}>
                <div className={`p-6 border-b ${
                  isDark ? "border-slate-700" : "border-blue-100"
                }`}>
                  <h3 className={`text-xl font-semibold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    <Settings className="w-5 h-5 text-blue-500" />
                    General Settings
                  </h3>
                  <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Manage your company profile details
                  </p>
                </div>
                <div className="p-6 lg:p-8">
                  <GeneralSettings showHeader={false} primaryActionLabel="Save All Changes" />
                </div>
              </div>
            )}

            {/* Maintenance Schedule Tab */}
            {activeTab === "maintenance" && (
              <div className={`rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 ${
                isDark 
                  ? "bg-slate-800/90 border border-slate-700" 
                  : "bg-white/90 border border-blue-100 shadow-xl"
              }`}>
                <div className={`p-6 border-b ${
                  isDark ? "border-slate-700" : "border-blue-100"
                }`}>
                  <h3 className={`text-xl font-semibold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Maintenance Schedule
                  </h3>
                  <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Set maintenance periods visible only to franchise users
                  </p>
                </div>
                <div className="p-6 lg:p-8">
                  {maintenanceLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className={`flex items-center text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            <Clock className="w-4 h-4 mr-2 text-blue-500" />
                            Maintenance Start Date
                          </label>
                          <input
                            type="date"
                            value={form.maintenanceLastDate}
                            onChange={(e) => setForm({ ...form, maintenanceLastDate: e.target.value })}
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none ${
                              isDark
                                ? "bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            }`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className={`flex items-center text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            <Clock className="w-4 h-4 mr-2 text-blue-500" />
                            Maintenance End Date
                          </label>
                          <input
                            type="date"
                            value={form.maintenanceEndDate}
                            onChange={(e) => setForm({ ...form, maintenanceEndDate: e.target.value })}
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none ${
                              isDark
                                ? "bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            }`}
                          />
                          {errors.maintenanceEndDate && (
                            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.maintenanceEndDate}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <button
                          type="button"
                          onClick={handleSaveMaintenance}
                          disabled={maintenanceSaving || !accountId}
                          className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                            maintenanceSaving || !accountId
                              ? "bg-slate-400 cursor-not-allowed opacity-60"
                              : `bg-gradient-to-r ${isDark ? "from-blue-600 to-cyan-600" : "from-blue-600 to-indigo-600"} hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl active:scale-95`
                          }`}
                        >
                          {maintenanceSaving ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5" />
                              Save Schedule
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelMaintenance}
                          disabled={maintenanceLoading}
                          className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                            maintenanceLoading
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : isDark
                                ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          } active:scale-95`}
                        >
                          Cancel
                        </button>
                        {(form.maintenanceLastDate || form.maintenanceEndDate) && (
                          <button
                            type="button"
                            onClick={handleDeleteMaintenance}
                            disabled={maintenanceDeleting || !accountId}
                            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                              maintenanceDeleting || !accountId
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : isDark
                                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50"
                                  : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            } active:scale-95`}
                          >
                            {maintenanceDeleting ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-5 h-5" />
                                Delete
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Security Settings Tab */}
            {activeTab === "security" && (
              <div className={`rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 ${
                isDark 
                  ? "bg-slate-800/90 border border-slate-700" 
                  : "bg-white/90 border border-blue-100 shadow-xl"
              }`}>
                <div className={`p-6 border-b ${
                  isDark ? "border-slate-700" : "border-blue-100"
                }`}>
                  <h3 className={`text-xl font-semibold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    <Lock className="w-5 h-5 text-blue-500" />
                    Security Settings
                  </h3>
                  <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Update your password to keep your account secure
                  </p>
                </div>

                <div className="p-6 lg:p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className={`flex items-center text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        <Lock className="w-4 h-4 mr-2 text-blue-500" />
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter new password"
                          className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-300 focus:outline-none ${
                            isDark
                              ? "bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                              : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <X className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        </button>
                      </div>
                      {!isPasswordValid && password && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-4 h-4" />
                          Password must be at least 8 characters
                        </p>
                      )}
                      <p className={`text-xs flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                        <Shield className="w-3 h-3" />
                        Use at least 8 characters with a mix of letters, numbers & symbols
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className={`flex items-center text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        <Lock className="w-4 h-4 mr-2 text-blue-500" />
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none ${
                          isDark
                            ? "bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                            : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        }`}
                      />
                      {!doPasswordsMatch && confirmPassword && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-4 h-4" />
                          Passwords do not match
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {activeTab !== "maintenance" && activeTab !== "general" && (hasChanges || (activeTab === "security" && (password || confirmPassword))) && (
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex-1 px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                    saving
                      ? "bg-slate-400 cursor-not-allowed opacity-50"
                      : `bg-gradient-to-r ${isDark ? "from-blue-600 to-cyan-600" : "from-blue-600 to-indigo-600"} hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl active:scale-95`
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save All Changes
                    </>
                  )}
                </button>

                <button
                  onClick={handleCancel}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  } active:scale-95`}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
