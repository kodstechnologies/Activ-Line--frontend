import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Settings, Save, Loader2, Camera, User, Mail, Lock, 
  AlertCircle, CheckCircle, Shield, Building2, Clock,
  Sparkles, ChevronRight
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { getMyProfile, updateMyProfile } from "../../api/frenchise/franchiseprofile";
import { toast } from "react-hot-toast";

const Profile = () => {
  const { isDark } = useTheme();

  const [form, setForm] = useState({
    name: "",
    email: "",
    profileImage: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  // Memoized values for performance
  const hasChanges = useMemo(() => {
    return !!(form.name || form.email || password || profileImageFile);
  }, [form.name, form.email, password, profileImageFile]);

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
        setForm({
          name: res.data.data.name || "",
          email: res.data.data.email || "",
          profileImage: res.data.data.profileImage || "",
        });
        setLastUpdated(new Date());
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Validate file type
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
    
    if (form.name?.trim()) {
      formData.append("name", form.name.trim());
    }
    if (form.email?.trim()) {
      formData.append("email", form.email.trim());
    }
    if (password?.trim()) {
      formData.append("password", password);
    }
    if (profileImageFile) {
      formData.append("profileImage", profileImageFile);
    }

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
    fetchProfile(); // Reset to original data
    toast.success("Changes discarded");
  };

  // Gradient definitions for blue theme
  const gradientBlue = "from-blue-600 to-blue-500";
  const gradientBlueHover = "from-blue-700 to-blue-600";
  const gradientBlueLight = "from-blue-500 to-blue-400";
  const gradientBlueDark = "from-blue-700 to-blue-800";

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
      isDark ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" : "bg-gradient-to-br from-blue-50 via-white to-blue-50"
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-7xl">

        {/* Header with glass morphism effect */}
        <div className={`mb-8 p-6 rounded-2xl backdrop-blur-sm ${
          isDark ? "bg-slate-800/50 border border-slate-700" : "bg-white/70 border border-blue-100"
        }`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${
                isDark ? "from-blue-400 to-blue-300" : gradientBlue
              } bg-clip-text text-transparent flex items-center gap-3`}>
                <Building2 className="w-8 h-8 text-blue-500" />
                Franchise Profile
              </h1>
              <p className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Manage your franchise details, branding and security settings
              </p>
            </div>
            
          
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left – Avatar & Quick Info with glass effect */}
          <div className="lg:w-1/3">
            <div className={`sticky top-6 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${
              isDark 
                ? "bg-slate-800/90 border border-slate-700" 
                : "bg-white/90 border border-blue-100 shadow-lg"
            }`}>
              <div className={`h-24 bg-gradient-to-r ${gradientBlue}`}></div>
              
              <div className="px-6 pb-6 -mt-12">
                <div className="relative mb-4 flex justify-center">
                  <div className="relative group">
                    <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${
                      isDark ? "border-slate-800" : "border-white"
                    } shadow-xl`}>
                      <img
                        src={form.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || "Franchise")}&background=3b82f6&color=fff&bold=true&size=128`}
                        alt="Franchise Logo"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>

                    <label
                      htmlFor="avatar-upload"
                      className={`absolute bottom-2 right-2 bg-gradient-to-r ${gradientBlue} hover:${gradientBlueHover} text-white p-3 rounded-full cursor-pointer shadow-lg transition-all transform hover:scale-110 hover:rotate-12`}
                    >
                      <Camera className="w-5 h-5" />
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
                  <h2 className={`text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                    {form.name || "Franchise Name"}
                  </h2>
                  <p className={`text-sm flex items-center justify-center gap-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    <Mail className="w-4 h-4" />
                    {form.email || "—"}
                  </p>
                </div>

                {/* Quick stats */}
                <div className={`mt-6 p-4 rounded-xl ${
                  isDark ? "bg-slate-700/50" : "bg-blue-50"
                }`}>
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className={`w-5 h-5 ${
                      isDark ? "text-blue-400" : "text-blue-600"
                    }`} />
                    <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                      Security status: {password ? "Changing password" : "Secure"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right – Form Fields with enhanced design */}
          <div className="lg:w-2/3">
            <div className={`rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 ${
              isDark 
                ? "bg-slate-800/90 border border-slate-700" 
                : "bg-white/90 border border-blue-100 shadow-lg"
            }`}>
              
              {/* Form header */}
              <div className={`p-6 border-b ${
                isDark ? "border-slate-700" : "border-blue-100"
              }`}>
                <h3 className={`text-xl font-semibold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  <User className="w-5 h-5 text-blue-500" />
                  Account Information
                  <span className={`ml-auto text-sm font-normal px-3 py-1 rounded-full ${
                    isDark ? "bg-slate-700 text-slate-300" : "bg-blue-50 text-blue-600"
                  }`}>
                    {hasChanges ? "Unsaved changes" : "Up to date"}
                  </span>
                </h3>
              </div>

              <div className="p-6 lg:p-8 space-y-8">

                {/* Name field with icon */}
                <div className="space-y-2">
                  <label className={`flex items-center text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    <User className="w-4 h-4 mr-2 text-blue-500" />
                    Franchise Name
                  </label>
                  <div className="relative group">
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={`w-full px-4 py-3 pl-11 rounded-xl border transition-all duration-300 ${
                        isDark
                          ? "bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                          : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      } group-hover:border-blue-400`}
                      placeholder="Your franchise name"
                    />
                    <User className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                      isDark ? "text-slate-500 group-hover:text-blue-400" : "text-slate-400 group-hover:text-blue-500"
                    }`} />
                  </div>
                </div>

                {/* Email field */}
                <div className="space-y-2">
                  <label className={`flex items-center text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    <Mail className="w-4 h-4 mr-2 text-blue-500" />
                    Contact Email
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={`w-full px-4 py-3 pl-11 rounded-xl border transition-all duration-300 ${
                        isDark
                          ? "bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                          : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      } group-hover:border-blue-400`}
                      placeholder="contact@yourfranchise.com"
                    />
                    <Mail className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                      isDark ? "text-slate-500 group-hover:text-blue-400" : "text-slate-400 group-hover:text-blue-500"
                    }`} />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={`flex items-center text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      <Lock className="w-4 h-4 mr-2 text-blue-500" />
                      New Password
                    </label>
                    <div className="relative group">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        className={`w-full px-4 py-3 pl-11 rounded-xl border transition-all duration-300 ${
                          isDark
                            ? "bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                            : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        } group-hover:border-blue-400`}
                      />
                      <Lock className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                        isDark ? "text-slate-500 group-hover:text-blue-400" : "text-slate-400 group-hover:text-blue-500"
                      }`} />
                    </div>
                    {!isPasswordValid && password && (
                      <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-4 h-4" />
                        Password must be at least 8 characters
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className={`flex items-center text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      <Lock className="w-4 h-4 mr-2 text-blue-500" />
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className={`w-full px-4 py-3 pl-11 rounded-xl border transition-all duration-300 ${
                          isDark
                            ? "bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                            : "bg-white border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        } group-hover:border-blue-400`}
                      />
                      <Lock className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                        isDark ? "text-slate-500 group-hover:text-blue-400" : "text-slate-400 group-hover:text-blue-500"
                      }`} />
                    </div>
                    {!doPasswordsMatch && confirmPassword && (
                      <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-4 h-4" />
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  <p className={`text-xs flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                    <Shield className="w-3 h-3" />
                    Leave blank to keep current password • Minimum 8 characters
                  </p>
                </div>

                {/* Action buttons */}
                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className={`flex-1 px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                      saving || !hasChanges
                        ? "bg-slate-400 cursor-not-allowed opacity-50"
                        : `bg-gradient-to-r ${gradientBlue} hover:${gradientBlueHover} active:scale-95`
                    } text-white shadow-lg hover:shadow-xl`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {hasChanges && (
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
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;