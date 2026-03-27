
import { useEffect, useState } from "react";
import {
  getCannedCategories,
  getResponsesByCategory,
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
} from "../../../../api/cannedResponse.api";
import {
  Save,
  MessageSquare,
  Loader2,
  Search,
  Copy,
  Check,
  Trash2,
  Pencil,
  Folder,
  Plus,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext.jsx";
import { Link } from "react-router-dom";

const CannedResponsesPage = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const isAdminStaff = user?.role?.toLowerCase() === "admin_staff";

  /* ---------------- STATE ---------------- */
  const [categories, setCategories] = useState([]);
  const [createCategoryId, setCreateCategoryId] = useState("");
  const [form, setForm] = useState({ title: "", message: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [listCategoryId, setListCategoryId] = useState("");
  const [responses, setResponses] = useState([]);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(true);

  /* ---------------- LOAD CATEGORIES ---------------- */
  useEffect(() => {
    const loadCategories = async () => {
      const res = await getCannedCategories();
      setCategories(res.data.data);
    };
    loadCategories();
  }, []);

  /* ---------------- LOAD RESPONSES ---------------- */
  useEffect(() => {
    if (!listCategoryId) return;

    const loadResponses = async () => {
      const res = await getResponsesByCategory(listCategoryId);
      // Add delay for smooth animation
      setTimeout(() => {
        setResponses(res.data.data);
      }, 300);
    };
    loadResponses();
  }, [listCategoryId]);

  /* ---------------- CREATE / UPDATE ---------------- */
  const handleSave = async () => {
    setFormError("");
    setSuccess("");

    if (!createCategoryId) {
      setFormError("Please select a category");
      return;
    }

    if (!form.title.trim() || !form.message.trim()) {
      setFormError("Title and message are required");
      return;
    }

    try {
      setLoading(true);

      let res;

      if (editingId) {
        // ✅ UPDATE
        res = await updateCannedResponse(editingId, {
          categoryId: createCategoryId,
          title: form.title.trim(),
          message: form.message.trim(),
        });

        setResponses((prev) =>
          prev.map((r) =>
            r._id === editingId ? res.data.data : r
          )
        );

        setSuccess("✅ Response updated successfully");
      } else {
        // ➕ CREATE
        res = await createCannedResponse({
          categoryId: createCategoryId,
          title: form.title.trim(),
          message: form.message.trim(),
        });

        if (createCategoryId === listCategoryId) {
          setResponses((prev) => [...prev, res.data.data]);
        }

        setSuccess("✨ Response created successfully");
      }

      // Reset form with animation
      setTimeout(() => {
        setForm({ title: "", message: "" });
        setEditingId(null);
        setIsFormVisible(false);
        setTimeout(() => setIsFormVisible(true), 100);
      }, 500);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setFormError(
        err?.response?.data?.message || "❌ Operation failed"
      );
      setTimeout(() => setFormError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this response?")) return;
    await deleteCannedResponse(id);
    setResponses((prev) => prev.filter((r) => r._id !== id));
  };

  /* ---------------- COPY ---------------- */
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  /* ---------------- FILTER ---------------- */
  const filteredResponses = responses.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
   <div className={`w-full p-0 ${isDark ? "bg-transparent text-white" : "bg-transparent"}`}>

      <div className="w-full space-y-4">


        {/* HEADER WITH ANIMATION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isDark ? "bg-gradient-to-r from-blue-500 to-purple-600" : "bg-gradient-to-r from-blue-500 to-cyan-400"} shadow-lg`}>
                <MessageSquare className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Canned Response Manager
                </h1>
                <p className={`flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  <Sparkles size={16} />
                  Create and manage reusable support replies
                </p>
              </div>
            </div>
          </div>

          {!isAdminStaff && (
            <Link
              to="/settings/canned/categories"
              className={`group flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                isDark 
                  ? "bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 hover:border-blue-500" 
                  : "bg-gradient-to-r from-white to-blue-50 border-blue-100 hover:border-blue-300"
              } shadow-lg`}
            >
              <Folder size={20} className="text-blue-500 group-hover:rotate-12 transition-transform" />
              <span className="font-medium">Manage Categories</span>
              <ChevronRight size={18} className="opacity-50 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {/* CREATE / EDIT FORM WITH SLIDE ANIMATION */}
        {!isAdminStaff && (
          <div 
            className={`rounded-2xl border-2 p-6 transition-all duration-500 transform ${isFormVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${
              isDark 
                ? "bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm" 
                : "bg-gradient-to-br from-white to-blue-50/30 border-blue-100 backdrop-blur-sm"
            } shadow-2xl hover:shadow-3xl transition-shadow`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${editingId ? "bg-amber-500/20" : "bg-green-500/20"}`}>
                  {editingId ? <Pencil size={20} className={editingId ? "text-amber-500" : "text-green-500"} /> : <Plus size={20} className="text-green-500" />}
                </div>
                <h2 className="text-2xl font-bold">
                  {editingId ? "Edit Response" : "Create New Response"}
                </h2>
              </div>
              <button
                onClick={() => setIsFormVisible(!isFormVisible)}
                className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <ChevronRight className={`transform transition-transform ${isFormVisible ? "rotate-90" : "-rotate-90"}`} />
              </button>
            </div>

            {isFormVisible && (
              <div className="space-y-6 animate-fadeIn">
                {formError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-shake">
                    <p className="text-red-500 flex items-center gap-2">
                      <X size={18} />
                      {formError}
                    </p>
                  </div>
                )}
                
                {success && (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 animate-pulse">
                    <p className="text-green-500 flex items-center gap-2">
                      <Check size={18} />
                      {success}
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-medium text-sm opacity-75">Category</label>
                    <select
                      value={createCategoryId}
                      onChange={(e) => setCreateCategoryId(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isDark 
                          ? "bg-gray-900/50 border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30" 
                          : "bg-white border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                      } shadow-inner`}
                    >
                      <option value="" className={isDark ? "bg-gray-800" : "bg-white"}>Select category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id} className={isDark ? "bg-gray-800" : "bg-white"}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium text-sm opacity-75">Title</label>
                    <input
                      placeholder="Response title"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isDark 
                          ? "bg-gray-900/50 border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30" 
                          : "bg-white border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                      } shadow-inner`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-medium text-sm opacity-75">Message</label>
                  <textarea
                    rows={5}
                    placeholder="Enter your response message here..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      isDark 
                        ? "bg-gray-900/50 border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30" 
                        : "bg-white border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                    } shadow-inner resize-none`}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className={`group flex items-center gap-3 px-8 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                      editingId 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-amber-500/25" 
                        : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-blue-500/25"
                    } shadow-lg hover:shadow-xl`}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : editingId ? (
                      <>
                        <Save size={20} />
                        Update Response
                      </>
                    ) : (
                      <>
                        <Plus size={20} />
                        Create Response
                      </>
                    )}
                  </button>

                  {editingId && (
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setForm({ title: "", message: "" });
                      }}
                      className={`px-6 py-3 rounded-xl border transition-all duration-300 hover:scale-105 ${
                        isDark 
                          ? "border-gray-600 hover:border-gray-500 hover:bg-gray-800" 
                          : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESPONSES LIST WITH STAGGERED ANIMATION */}
        <div className={`rounded-2xl border-2 p-6 ${
          isDark 
            ? "bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm" 
            : "bg-gradient-to-br from-white to-blue-50/30 border-blue-100 backdrop-blur-sm"
        } shadow-sm`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? "bg-purple-500/20" : "bg-purple-100"}`}>
                  <MessageSquare size={20} className="text-purple-500" />
                </div>
                Saved Responses
              </h2>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {filteredResponses.length} response{filteredResponses.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <select
                value={listCategoryId}
                onChange={(e) => setListCategoryId(e.target.value)}
                className={`px-4 py-3 rounded-xl border transition-all ${
                  isDark 
                    ? "bg-gray-900/50 border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30" 
                    : "bg-white border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30"
                } shadow-inner`}
              >
                <option value="" className={isDark ? "bg-gray-800" : "bg-white"}>All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id} className={isDark ? "bg-gray-800" : "bg-white"}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  placeholder="Search responses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`pl-12 pr-4 py-3 rounded-xl border transition-all w-full ${
                    isDark 
                      ? "bg-gray-900/50 border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30" 
                      : "bg-white border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30"
                  } shadow-inner`}
                />
              </div>
            </div>
          </div>

          {filteredResponses.length === 0 ? (
            <div className="text-center py-16 animate-fadeIn">
              <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 opacity-30">
                <MessageSquare size={48} />
              </div>
              <p className={`text-xl font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                No responses found
              </p>
              <p className={isDark ? "text-gray-500" : "text-gray-400"}>
                {listCategoryId ? "Try selecting a different category" : "Select a category to view responses"}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResponses.map((r, index) => (
                <div 
                  key={r._id} 
                  className={`border-2 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl animate-slideUp`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-lg line-clamp-2">{r.title}</h4>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-600"
                      }`}>
                        {categories.find(c => c._id === listCategoryId)?.name || "Uncategorized"}
                      </span>
                    </div>
                    
                    <p className={`text-sm line-clamp-3 ${isDark ? "text-gray-300" : "text-gray-600"} mb-4`}>
                      {r.message}
                    </p>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleCopy(r.message, r._id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                          copiedId === r._id
                            ? "bg-green-500/20 text-green-500"
                            : isDark 
                              ? "bg-gray-800 hover:bg-gray-700" 
                              : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {copiedId === r._id ? (
                          <>
                            <Check size={16} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            Copy
                          </>
                        )}
                      </button>

                      {!isAdminStaff && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingId(r._id);
                              setCreateCategoryId(listCategoryId);
                              setForm({ title: r.title, message: r.message });
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className={`p-2 rounded-lg transition-all hover:scale-110 ${
                              isDark 
                                ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400" 
                                : "bg-amber-100 hover:bg-amber-200 text-amber-600"
                            }`}
                          >
                            <Pencil size={18} />
                          </button>

                          <button 
                            onClick={() => handleDelete(r._id)}
                            className={`p-2 rounded-lg transition-all hover:scale-110 ${
                              isDark 
                                ? "bg-red-500/20 hover:bg-red-500/30 text-red-400" 
                                : "bg-red-100 hover:bg-red-200 text-red-600"
                            }`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out forwards;
          opacity: 0;
        }
        .animate-slideDown {
          animation: slideDown 0.5s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .backdrop-blur-sm {
          backdrop-filter: blur(8px);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default CannedResponsesPage;
