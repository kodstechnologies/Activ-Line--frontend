import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Lottie from "lottie-react";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Edit2,
  Save,
  X,
  Briefcase,
  CheckCircle,
  Moon,
  Sun,
} from "lucide-react";

// Import animations
import profileAnimation from "../../animations/Profile Avatar of Young Boy.json";
import { useEffect } from "react";

const ProfilePage = () => {
  const { user, updateProfile, fetchProfile } = useAuth();

  const { theme, toggleTheme, isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  useEffect(() => {
    if (!user) {
      fetchProfile();
    }
  }, []);

  useEffect(() => {
    if (user) {
      setEditedUser({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        phone: user.phone || "",
        location: user.location || "",
        role: user.role || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const updated = await updateProfile({
        name: editedUser.name,
        email: editedUser.email,
        bio: editedUser.bio,
        phone: editedUser.phone,
        location: editedUser.location,
      });

      // merge backend response with existing user
      setEditedUser((prev) => ({
        ...prev,
        ...updated,
      }));

      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleCancel = () => {
    setEditedUser({ ...user });
    setIsEditing(false);
  };

  // Format join date
  const formatJoinDate = (dateString) => {
    if (!dateString) return "Not Available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get role badge color
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "editor":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };

  return (
    <div
      className={`min-h-screen ${isDark ? "dark:bg-slate-900" : "bg-gray-50"} transition-colors duration-300`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1
                className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Profile Settings
              </h1>
              <p
                className={`text-base mt-2 ${isDark ? "text-slate-400" : "text-gray-600"}`}
              >
                Manage your personal information and account preferences
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Takes full available height */}
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Left Column - Profile Overview */}
          <div className="lg:w-1/3">
            <div
              className={`rounded-xl border ${
                isDark
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-gray-200"
              } p-6 h-full transition-all duration-300`}
            >
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center text-center mb-6">
                <div
                  className={`relative mb-4 ${isDark ? "bg-slate-700" : "bg-gray-100"} rounded-full p-2`}
                >
                  <div className="w-40 h-40 rounded-full overflow-hidden">
                    <Lottie
                      animationData={profileAnimation}
                      loop={true}
                      autoplay={true}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user?.role)}`}
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      {user?.role || "User"}
                    </span>
                  </div>
                </div>

                <h2
                  className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {user?.name || "Guest User"}
                </h2>
                <p
                  className={`flex lg:items-center break-words break-all justify-center gap-2 mb-4 ${isDark ? "text-slate-400" : "text-gray-600"}`}
                >
                  <Mail className="w-4 h-4" />
                  {user?.email || "No email provided"}
                </p>
              </div>

              {/* Stats or Additional Info */}
              <div
                className={`border-t ${
                  isDark ? "border-slate-700" : "border-gray-200"
                } pt-6`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Account Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span
                      className={isDark ? "text-slate-400" : "text-gray-600"}
                    >
                      Account Status
                    </span>
                    <span className="inline-flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={isDark ? "text-slate-400" : "text-gray-600"}
                    >
                      Last Updated
                    </span>
                    <span
                      className={isDark ? "text-slate-300" : "text-gray-800"}
                    >
                      {formatJoinDate(user?.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Editable Profile Details */}
          <div className="lg:w-2/3">
            <div
              className={`rounded-xl border ${
                isDark
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-gray-200"
              } p-6 h-full transition-all duration-300`}
            >
              {/* Header with Edit Button */}
              <div className="flex justify-between items-center mb-8">
                <h3
                  className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Personal Information
                </h3>
                <button
                  onClick={() =>
                    isEditing ? handleCancel() : setIsEditing(true)
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    isEditing
                      ? `${isDark ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </>
                  )}
                </button>
              </div>

              {/* Profile Form */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label
                      className={`flex items-center text-sm font-medium mb-2 ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={editedUser.name || ""}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border outline-none transition ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        }`}
                        placeholder="Enter your name"
                      />
                    ) : (
                      <div
                        className={`px-4 py-3 rounded-lg ${
                          isDark
                            ? "bg-slate-700 text-white"
                            : "bg-gray-50 text-gray-900"
                        }`}
                      >
                        <p className="font-medium">{user?.name || "Not set"}</p>
                      </div>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label
                      className={`flex items-center text-sm font-medium mb-2 ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editedUser.email || ""}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border outline-none transition ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        }`}
                        placeholder="Enter your email"
                      />
                    ) : (
                      <div
                        className={`px-4 py-3 rounded-lg ${
                          isDark
                            ? "bg-slate-700 text-white"
                            : "bg-gray-50 text-gray-900"
                        }`}
                      >
                        <p className="font-medium break-words break-all">
                          {user?.email || "Not set"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Role Field */}
                <div className="space-y-2">
                  <label
                    className={`flex items-center text-sm font-medium mb-2 ${
                      isDark ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Role
                  </label>
                  <div
                    className={`inline-flex items-center px-4 py-2 rounded-lg ${getRoleColor(user?.role)}`}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    <span className="font-medium">{user?.role || "User"}</span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? "text-slate-500" : "text-gray-500"
                    }`}
                  >
                    Your role determines your access permissions
                  </p>
                </div>

                {/* Additional Fields (Optional) */}
                {isEditing && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDark ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={editedUser.location || ""}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border outline-none transition ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        }`}
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDark ? "text-slate-300" : "text-gray-700"
                        }`}
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={editedUser.phone || ""}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border outline-none transition ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        }`}
                        placeholder="+1 (123) 456-7890"
                      />
                    </div>
                  </div>
                )}

                {/* Save Button */}
                {isEditing && (
                  <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                      <button
                        onClick={handleCancel}
                        className={`px-6 py-3 rounded-lg font-medium transition ${
                          isDark
                            ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div
          className={`mt-6 text-center ${
            isDark ? "text-slate-500" : "text-gray-500"
          }`}
        >
          <p className="text-sm">
            Last profile update: {formatJoinDate(user?.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
