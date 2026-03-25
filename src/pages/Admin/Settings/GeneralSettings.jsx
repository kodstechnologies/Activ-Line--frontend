import { useEffect, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import {
  getCompanyProfile,
  createCompanyProfile,
  updateCompanyProfile,
  deleteCompanyProfile,
} from "../../../api/companyProfile.api";

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

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /* =========================
     LOAD SETTINGS (GET)
     ========================= */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getCompanyProfile();

        if (res.success && res.data) {
          setForm({
            companyName: res.data.companyName || "",
            email: res.data.email || "",
            address: res.data.address || "",
          });
          setHasProfile(true);
        }
      } catch (error) {
        if (error?.response?.status === 404) {
          setHasProfile(false);
        } else {
          console.error("Failed to load company profile", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  /* =========================
     HANDLE CHANGE
     ========================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* =========================
     SAVE SETTINGS (POST/PUT)
     ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = hasProfile
        ? await updateCompanyProfile(form)
        : await createCompanyProfile(form);
      if (res.success) {
        setHasProfile(true);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save company profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!hasProfile) return;
    setIsDeleting(true);
    try {
      const res = await deleteCompanyProfile();
      if (res.success) {
        setForm({
          companyName: "",
          email: "",
          address: "",
        });
        setHasProfile(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to delete company profile", error);
    } finally {
      setIsDeleting(false);
    }
  };

  /* =========================
     LOADING STATE
     ========================= */
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className={isDark ? "text-gray-300" : "text-gray-600"}>
          Loading General Settings...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full p-0">
      {/* Header */}
      {showHeader && (
        <div className="mb-4">
          <h2
            className={`text-2xl font-bold mb-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            General Settings
          </h2>
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            Manage your company information and contact details
          </p>
        </div>
      )}

      {/* Success */}
      {showSuccess && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            isDark
              ? "bg-green-900/30 border-green-800 text-green-200"
              : "bg-green-50 border-green-200 text-green-800"
          }`}
        >
          Settings saved successfully!
        </div>
      )}

      {/* Form */}
      <div
        className={`rounded-xl p-3 border ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Company Name
            </label>
            <input
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 rounded-lg border ${
                isDark
                  ? "bg-gray-900 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>

          {/* Email */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 rounded-lg border ${
                isDark
                  ? "bg-gray-900 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>

          {/* Address */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Company Address
            </label>
            <textarea
              name="address"
              rows="3"
              value={form.address}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 rounded-lg border resize-none ${
                isDark
                  ? "bg-gray-900 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>

          {/* Actions */}
          <div className="pt-6 border-t flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!hasProfile || isDeleting}
              className={`px-6 py-3 rounded-lg border ${
                isDark
                  ? "border-red-700 text-red-300 hover:bg-red-900/30"
                  : "border-red-300 text-red-700 hover:bg-red-50"
              } ${
                !hasProfile || isDeleting
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
            >
              {isDeleting ? "Deleting..." : "Delete Profile"}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-8 py-3 rounded-lg text-white ${
                isDark
                  ? "bg-blue-600 hover:bg-blue-500"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600"
              } ${isSaving ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isSaving ? "Saving..." : primaryActionLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeneralSettings;
