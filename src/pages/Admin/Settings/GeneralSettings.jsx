import { useEffect, useState, useCallback, useMemo } from "react";
import { useTheme } from "../../../context/ThemeContext";
import {
  getCompanyProfile,
  createCompanyProfile,
  updateCompanyProfile,
  deleteCompanyProfile,
} from "../../../api/companyProfile.api";
import { Save, Trash2, Building, Mail, MapPin, Loader2, CheckCircle, Sparkles } from "lucide-react";

const GeneralSettings = ({
  showHeader = true,
  primaryActionLabel = "Save General Settings",
}) => {
  const { isDark } = useTheme();

  const [form, setForm] = useState({
    companyName: "",
    email: "",
    address: "",
  });

  const [uiState, setUiState] = useState({
    isSaving: false,
    showSuccess: false,
    isLoading: true,
    hasProfile: false,
    isDeleting: false,
    error: null,
  });

  // Enhanced memoized styles for better visual appeal
  const styles = useMemo(() => ({
    input: `w-full px-5 py-3.5 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
      isDark
        ? "bg-gray-900/60 border-gray-700 text-white focus:ring-blue-500 focus:border-transparent hover:bg-gray-900/80 hover:border-gray-600"
        : "bg-white border-gray-200 text-gray-900 focus:ring-purple-500 focus:border-transparent hover:border-gray-300 hover:shadow-md"
    }`,
    textarea: `w-full px-5 py-3.5 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none ${
      isDark
        ? "bg-gray-900/60 border-gray-700 text-white focus:ring-blue-500 focus:border-transparent hover:bg-gray-900/80"
        : "bg-white border-gray-200 text-gray-900 focus:ring-purple-500 focus:border-transparent hover:border-gray-300 hover:shadow-md"
    }`,
    label: `block text-sm font-semibold mb-2.5 ${
      isDark ? "text-gray-300" : "text-gray-700"
    }`,
    card: `rounded-2xl border overflow-hidden ${
      isDark 
        ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-sm" 
        : "bg-white border-gray-200 shadow-xl hover:shadow-2xl"
    } transition-all duration-300`,
    section: `border-b last:border-b-0 ${
      isDark ? "border-gray-700/50" : "border-gray-100"
    }`,
    iconWrapper: `p-2 rounded-xl ${
      isDark ? "bg-gray-700/50" : "bg-gray-100"
    } group-hover:scale-110 transition-transform duration-300`,
  }), [isDark]);

  // Optimized fetch function with AbortController
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchSettings = async () => {
      try {
        const res = await getCompanyProfile({ signal: abortController.signal });
        
        if (res.success && res.data) {
          setForm({
            companyName: res.data.companyName || "",
            email: res.data.email || "",
            address: res.data.address || "",
          });
          setUiState(prev => ({ ...prev, hasProfile: true, error: null }));
        }
      } catch (error) {
        if (error?.response?.status === 404) {
          setUiState(prev => ({ ...prev, hasProfile: false }));
        } else if (error.name !== 'AbortError') {
          console.error("Failed to load company profile", error);
          setUiState(prev => ({ ...prev, error: "Failed to load profile" }));
        }
      } finally {
        setUiState(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchSettings();
    
    return () => abortController.abort();
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (uiState.error) setUiState(prev => ({ ...prev, error: null }));
  }, [uiState.error]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.companyName.trim() || !form.email.trim() || !form.address.trim()) {
      setUiState(prev => ({ ...prev, error: "All fields are required" }));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setUiState(prev => ({ ...prev, error: "Please enter a valid email address" }));
      return;
    }

    setUiState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const res = uiState.hasProfile
        ? await updateCompanyProfile(form)
        : await createCompanyProfile(form);
        
      if (res.success) {
        setUiState(prev => ({ 
          ...prev, 
          hasProfile: true, 
          showSuccess: true,
          isSaving: false 
        }));
        
        setTimeout(() => {
          setUiState(prev => ({ ...prev, showSuccess: false }));
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to save company profile", error);
      setUiState(prev => ({ 
        ...prev, 
        error: error?.response?.data?.message || "Failed to save profile" 
      }));
    } finally {
      setUiState(prev => ({ ...prev, isSaving: false }));
    }
  }, [form, uiState.hasProfile]);

  const handleDelete = useCallback(async () => {
    if (!uiState.hasProfile) return;
    
    if (!window.confirm("Are you sure you want to delete your company profile? This action cannot be undone.")) {
      return;
    }

    setUiState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      const res = await deleteCompanyProfile();
      if (res.success) {
        setForm({
          companyName: "",
          email: "",
          address: "",
        });
        setUiState(prev => ({ 
          ...prev, 
          hasProfile: false, 
          showSuccess: true,
          isDeleting: false 
        }));
        
        setTimeout(() => {
          setUiState(prev => ({ ...prev, showSuccess: false }));
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to delete company profile", error);
      setUiState(prev => ({ 
        ...prev, 
        error: error?.response?.data?.message || "Failed to delete profile" 
      }));
    } finally {
      setUiState(prev => ({ ...prev, isDeleting: false }));
    }
  }, [uiState.hasProfile]);

  // Enhanced Loading State with Skeleton Animation
  if (uiState.isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className={`h-5 ${isDark ? "bg-gray-700" : "bg-gray-200"} rounded-lg w-1/4`}></div>
              <div className={`h-12 ${isDark ? "bg-gray-700" : "bg-gray-200"} rounded-xl`}></div>
            </div>
          ))}
          <div className="flex justify-end gap-3">
            <div className={`h-12 w-32 ${isDark ? "bg-gray-700" : "bg-gray-200"} rounded-xl`}></div>
            <div className={`h-12 w-40 ${isDark ? "bg-gray-700" : "bg-gray-200"} rounded-xl`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with Animation */}
      {showHeader && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${isDark ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20" : "bg-gradient-to-br from-purple-100 to-indigo-100"}`}>
              <Sparkles className={`w-6 h-6 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
            </div>
            <div>
              <h2
                className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${
                  isDark
                    ? "from-blue-400 via-purple-400 to-pink-400"
                    : "from-purple-600 via-indigo-600 to-blue-600"
                } bg-clip-text text-transparent`}
              >
                General Settings
              </h2>
              <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Manage your company information and contact details
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Success Toast */}
      {uiState.showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${
            isDark ? "bg-green-900/95 border border-green-700" : "bg-green-50 border border-green-200"
          } backdrop-blur-sm`}>
            <CheckCircle className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`} />
            <span className={isDark ? "text-green-200" : "text-green-800"}>
              Settings saved successfully!
            </span>
          </div>
        </div>
      )}

      {/* Enhanced Error Alert */}
      {uiState.error && (
        <div className={`mb-6 p-4 rounded-xl border animate-shake ${
          isDark
            ? "bg-red-900/30 border-red-800 text-red-200"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-sm">{uiState.error}</span>
          </div>
        </div>
      )}

      {/* Enhanced Form */}
      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          {/* Company Information Section */}
          <div className={`${styles.section} p-6 md:p-8`}>
            <div className="flex items-center gap-2 mb-6">
              <div className={styles.iconWrapper}>
                <Building className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-purple-600"}`} />
              </div>
              <h3 className={`text-lg font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                Company Information
              </h3>
            </div>
            
            <div className="space-y-6">
              {/* Company Name */}
              <div className="group">
                <label className={styles.label}>
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Enter your company name"
                  required
                  className={styles.input}
                  disabled={uiState.isSaving || uiState.isDeleting}
                />
                <p className={`text-xs mt-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  This will be displayed across your workspace
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className={`${styles.section} p-6 md:p-8`}>
            <div className="flex items-center gap-2 mb-6">
              <div className={styles.iconWrapper}>
                <Mail className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-purple-600"}`} />
              </div>
              <h3 className={`text-lg font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                Contact Details
              </h3>
            </div>
            
            <div className="space-y-6">
              {/* Email */}
              <div>
                <label className={styles.label}>
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="company@example.com"
                  required
                  className={styles.input}
                  disabled={uiState.isSaving || uiState.isDeleting}
                />
                <p className={`text-xs mt-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  Primary contact email for your company
                </p>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className={`${styles.section} p-6 md:p-8`}>
            <div className="flex items-center gap-2 mb-6">
              <div className={styles.iconWrapper}>
                <MapPin className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-purple-600"}`} />
              </div>
              <h3 className={`text-lg font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                Location
              </h3>
            </div>
            
            <div className="space-y-6">
              {/* Address */}
              <div>
                <label className={styles.label}>
                  Company Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  rows="3"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter your full company address"
                  required
                  className={styles.textarea}
                  disabled={uiState.isSaving || uiState.isDeleting}
                />
                <p className={`text-xs mt-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  Full physical address of your company
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Actions */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {uiState.hasProfile && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={uiState.isDeleting || uiState.isSaving}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                    isDark
                      ? "border border-red-700 text-red-300 hover:bg-red-900/30 hover:scale-105 hover:shadow-lg"
                      : "border border-red-300 text-red-700 hover:bg-red-50 hover:scale-105 hover:shadow-lg"
                  } ${
                    (uiState.isDeleting || uiState.isSaving)
                      ? "opacity-60 cursor-not-allowed hover:scale-100"
                      : "active:scale-95"
                  }`}
                >
                  {uiState.isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Profile</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                type="submit"
                disabled={uiState.isSaving || uiState.isDeleting}
                className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-white font-medium transition-all duration-300 ${
                  isDark
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-105"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:scale-105"
                } ${(uiState.isSaving || uiState.isDeleting) ? "opacity-70 cursor-not-allowed hover:scale-100" : "active:scale-95"}`}
              >
                {uiState.isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{primaryActionLabel}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default GeneralSettings;