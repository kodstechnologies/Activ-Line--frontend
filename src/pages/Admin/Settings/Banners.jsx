import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTheme } from "../../../context/ThemeContext";
import {
  Image,
  Upload,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  Film,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  getAllBanners,
  createBanner,
  updateBanner,
  toggleBanner,
  deleteBanner,
} from "../../../api/banner.api";

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toast, isDark }) => {
  if (!toast) return null;
  const isSuccess = toast.type === "success";
  return (
    <div className="fixed top-5 right-5 z-50 animate-[slideDown_0.3s_ease-out]">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-sm ${
          isSuccess
            ? isDark
              ? "bg-green-900/95 border-green-700 text-green-200"
              : "bg-green-50 border-green-200 text-green-800"
            : isDark
              ? "bg-red-900/95 border-red-700 text-red-200"
              : "bg-red-50 border-red-200 text-red-800"
        }`}
      >
        {isSuccess ? (
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 flex-shrink-0" />
        )}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = ({ isDark }) => (
  <div
    className={`rounded-2xl border overflow-hidden animate-pulse ${
      isDark
        ? "bg-slate-800/60 border-slate-700/50"
        : "bg-white border-gray-200"
    }`}
  >
    <div
      className={`aspect-video w-full ${isDark ? "bg-slate-700" : "bg-gray-200"}`}
    />
    <div className="p-4 space-y-3">
      <div
        className={`h-4 rounded-lg w-1/3 ${isDark ? "bg-slate-700" : "bg-gray-200"}`}
      />
      <div
        className={`h-3 rounded-lg w-1/2 ${isDark ? "bg-slate-700" : "bg-gray-200"}`}
      />
      <div className="flex gap-2 pt-1">
        <div
          className={`h-8 rounded-lg flex-1 ${isDark ? "bg-slate-700" : "bg-gray-200"}`}
        />
        <div
          className={`h-8 rounded-lg flex-1 ${isDark ? "bg-slate-700" : "bg-gray-200"}`}
        />
      </div>
    </div>
  </div>
);

// ─── Banner Card ──────────────────────────────────────────────────────────────
const BannerCard = ({
  banner,
  isDark,
  onToggle,
  onDelete,
  onReplace,
  togglingId,
  deletingId,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [replaceFile, setReplaceFile] = useState(null);
  const [replacing, setReplacing] = useState(false);
  const replaceInputRef = useRef();

  const isTogglingThis = togglingId === banner._id;
  const isDeletingThis = deletingId === banner._id;
  const isVideo = banner.file_type === "video";

  const handleReplaceSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) return;
    setReplaceFile(f);
  };

  const handleReplaceConfirm = async () => {
    if (!replaceFile) return;
    setReplacing(true);
    await onReplace(banner._id, replaceFile);
    setReplacing(false);
    setShowReplace(false);
    setReplaceFile(null);
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-300 group flex flex-col ${
        isDark
          ? "bg-slate-800/60 border-slate-700/50 hover:border-slate-600"
          : "bg-white border-gray-200 shadow-md hover:shadow-xl"
      }`}
    >
      {/* Media Preview — fixed h-48 so every card is identical height regardless of image/video dimensions */}
      <div className="relative h-48 w-full overflow-hidden bg-black flex-shrink-0">
        {isVideo ? (
          <video
            src={banner.url}
            className="w-full h-full object-cover"
            muted
            autoPlay
            loop
            playsInline
          />
        ) : (
          <img
            src={banner.url}
            alt="banner"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* Overlay badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-2">
          <span
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${
              isVideo
                ? "bg-blue-600/90 text-white"
                : "bg-purple-600/90 text-white"
            }`}
          >
            {isVideo ? (
              <Film className="w-3 h-3" />
            ) : (
              <Image className="w-3 h-3" />
            )}
            {isVideo ? "Video" : "Image"}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${
              banner.isActive
                ? "bg-green-600/90 text-white"
                : "bg-gray-600/80 text-white"
            }`}
          >
            {banner.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
          Added {fmtDate(banner.createdAt)}
        </p>

        {/* Replace inline panel */}
        {showReplace && (
          <div
            className={`rounded-xl p-3 border space-y-2 ${
              isDark
                ? "bg-slate-900/60 border-slate-700"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <p
              className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-gray-700"}`}
            >
              Select new file
            </p>
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleReplaceSelect}
            />
            <button
              onClick={() => replaceInputRef.current?.click()}
              className={`w-full text-xs py-2 rounded-lg border border-dashed transition ${
                isDark
                  ? "border-slate-600 text-slate-400 hover:border-orange-500 hover:text-orange-400"
                  : "border-gray-300 text-gray-500 hover:border-orange-500 hover:text-orange-600"
              }`}
            >
              {replaceFile
                ? `✓ ${replaceFile.name.slice(0, 24)}…`
                : "Click to pick file"}
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleReplaceConfirm}
                disabled={!replaceFile || replacing}
                className={`flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-lg font-medium transition ${
                  !replaceFile || replacing
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                } bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-400 hover:to-amber-400`}
              >
                {replacing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                {replacing ? "Replacing…" : "Replace"}
              </button>
              <button
                onClick={() => {
                  setShowReplace(false);
                  setReplaceFile(null);
                }}
                className={`flex-1 text-xs py-2 rounded-lg font-medium transition ${
                  isDark
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Delete confirm row */}
        {confirmDelete ? (
          <div
            className={`flex items-center gap-2 p-2.5 rounded-xl border ${
              isDark
                ? "bg-red-900/20 border-red-800/50"
                : "bg-red-50 border-red-200"
            }`}
          >
            <AlertTriangle
              className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-red-400" : "text-red-500"}`}
            />
            <span
              className={`text-xs flex-1 ${isDark ? "text-red-300" : "text-red-700"}`}
            >
              Delete permanently?
            </span>
            <button
              onClick={() => {
                onDelete(banner._id);
                setConfirmDelete(false);
              }}
              disabled={isDeletingThis}
              className="text-xs px-2.5 py-1 rounded-lg bg-red-600 text-white hover:bg-red-500 transition font-medium flex items-center gap-1"
            >
              {isDeletingThis ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : null}
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                isDark
                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              No
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {/* Toggle */}
            <button
              onClick={() => onToggle(banner._id)}
              disabled={isTogglingThis}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-xl font-medium transition-all duration-200 border ${
                banner.isActive
                  ? isDark
                    ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-100"
                  : isDark
                    ? "border-green-700 text-green-400 hover:bg-green-900/30"
                    : "border-green-300 text-green-700 hover:bg-green-50"
              } ${isTogglingThis ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {isTogglingThis ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : banner.isActive ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              {banner.isActive ? "Deactivate" : "Activate"}
            </button>

            {/* Replace */}
            <button
              onClick={() => setShowReplace((p) => !p)}
              className={`flex items-center justify-center gap-1 text-xs px-3 py-2.5 rounded-xl font-medium border transition-all ${
                isDark
                  ? "border-orange-700/60 text-orange-400 hover:bg-orange-900/20"
                  : "border-orange-300 text-orange-600 hover:bg-orange-50"
              }`}
            >
              <RefreshCw className="w-3 h-3" />
            </button>

            {/* Delete */}
            <button
              onClick={() => setConfirmDelete(true)}
              className={`flex items-center justify-center gap-1 text-xs px-3 py-2.5 rounded-xl font-medium border transition-all ${
                isDark
                  ? "border-red-700/60 text-red-400 hover:bg-red-900/20"
                  : "border-red-300 text-red-600 hover:bg-red-50"
              }`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ isDark }) => (
  <div
    className={`flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed ${
      isDark
        ? "border-slate-700 text-slate-500"
        : "border-gray-200 text-gray-400"
    }`}
  >
    <div
      className={`p-5 rounded-2xl mb-4 ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
    >
      <Image className="w-10 h-10 opacity-40" />
    </div>
    <p className="font-semibold text-base">No banners yet</p>
    <p className="text-sm mt-1 opacity-70">
      Upload your first image or video banner above
    </p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Banners = () => {
  const { isDark } = useTheme();
  const fileInputRef = useRef();

  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // ← live preview URL
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Generate / revoke object URL whenever pendingFile changes
  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url); // cleanup on unmount or file change
  }, [pendingFile]);

  // Fetch on mount
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await getAllBanners();
        setBanners(res?.data?.banners ?? []);
      } catch {
        showToast("error", "Failed to load banners");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBanners();
  }, [showToast]);

  // Upload
  const handleUpload = useCallback(
    async (file) => {
      if (!file) return;
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        showToast("error", "Only image or video files are allowed");
        return;
      }
      setIsUploading(true);
      try {
        const res = await createBanner(file);
        const newBanner = res?.data;
        if (newBanner) setBanners((p) => [...p, newBanner]);
        setPendingFile(null); // triggers previewUrl cleanup via useEffect
        showToast("success", "Banner uploaded successfully");
      } catch (err) {
        showToast("error", err?.response?.data?.message ?? "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [showToast],
  );

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) setPendingFile(f);
    e.target.value = "";
  };

  // Drag & Drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setPendingFile(f);
  }, []);

  // Toggle
  const handleToggle = useCallback(
    async (id) => {
      setTogglingId(id);
      try {
        const res = await toggleBanner(id);
        const updated = res?.data;
        setBanners((p) =>
          p.map((b) =>
            b._id === id
              ? { ...b, isActive: updated?.isActive ?? !b.isActive }
              : b,
          ),
        );
        showToast(
          "success",
          `Banner ${updated?.isActive ? "activated" : "deactivated"}`,
        );
      } catch {
        showToast("error", "Toggle failed");
      } finally {
        setTogglingId(null);
      }
    },
    [showToast],
  );

  // Delete
  const handleDelete = useCallback(
    async (id) => {
      setDeletingId(id);
      try {
        await deleteBanner(id);
        setBanners((p) => p.filter((b) => b._id !== id));
        showToast("success", "Banner deleted");
      } catch {
        showToast("error", "Delete failed");
      } finally {
        setDeletingId(null);
      }
    },
    [showToast],
  );

  // Replace
  const handleReplace = useCallback(
    async (id, file) => {
      try {
        const res = await updateBanner(id, file);
        const updated = res?.data;
        if (updated)
          setBanners((p) =>
            p.map((b) => (b._id === id ? { ...b, ...updated } : b)),
          );
        showToast("success", "Banner replaced successfully");
      } catch {
        showToast("error", "Replace failed");
      }
    },
    [showToast],
  );

  // Memoised styles
  const styles = useMemo(
    () => ({
      card: `rounded-2xl border overflow-hidden transition-all duration-300 ${
        isDark
          ? "bg-slate-800/40 border-slate-700/50 backdrop-blur-sm"
          : "bg-white border-gray-200 shadow-xl"
      }`,
      label: `text-sm font-semibold ${isDark ? "text-slate-300" : "text-gray-700"}`,
      sectionTitle: `text-lg font-semibold ${isDark ? "text-slate-100" : "text-gray-800"}`,
      iconWrap: `p-2 rounded-xl ${isDark ? "bg-orange-500/15" : "bg-orange-100"}`,
      hint: `text-xs mt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`,
    }),
    [isDark],
  );

  const dropZoneCls = `relative flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
    dragOver
      ? isDark
        ? "border-orange-500 bg-orange-500/10 scale-[1.01]"
        : "border-orange-400 bg-orange-50 scale-[1.01]"
      : isDark
        ? "border-slate-700 hover:border-orange-600 hover:bg-orange-500/5"
        : "border-gray-300 hover:border-orange-400 hover:bg-orange-50/50"
  }`;

  const isPendingVideo = pendingFile?.type?.startsWith("video/");
  const pendingSizeLabel = pendingFile
    ? (pendingFile.size / 1024 / 1024).toFixed(1) + " MB"
    : null;

  return (
    <div className="w-full space-y-8">
      <Toast toast={toast} isDark={isDark} />

      {/* ── Section Header ── */}
      <div className="flex items-center gap-3">
        <div className={styles.iconWrap}>
          <Image
            className={`w-5 h-5 ${isDark ? "text-orange-400" : "text-orange-600"}`}
          />
        </div>
        <div>
          <h2
            className={`text-2xl font-bold bg-gradient-to-r ${
              isDark
                ? "from-orange-400 to-amber-400"
                : "from-orange-600 to-amber-600"
            } bg-clip-text text-transparent`}
          >
            Banner Management
          </h2>
          <p
            className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-gray-500"}`}
          >
            Upload and manage promotional image &amp; video banners
          </p>
        </div>
      </div>

      {/* ── Upload Card ── */}
      <div className={styles.card}>
        <div className="p-6 md:p-8 space-y-5">
          {/* Drop zone */}
          <div
            className={dropZoneCls}
            onClick={() => !pendingFile && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {previewUrl ? (
              /* ── Live preview replaces the upload prompt ── */
              <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                {isPendingVideo ? (
                  <video
                    src={previewUrl}
                    className="w-full h-full object-cover"
                    muted
                    autoPlay
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Overlay: type badge + file info + clear button */}
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${
                        isPendingVideo
                          ? "bg-blue-600/90 text-white"
                          : "bg-purple-600/90 text-white"
                      }`}
                    >
                      {isPendingVideo ? (
                        <Film className="w-3 h-3" />
                      ) : (
                        <Image className="w-3 h-3" />
                      )}
                      {isPendingVideo ? "Video" : "Image"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingFile(null);
                      }}
                      className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="">
                    <p className="text-white text-xs font-semibold truncate">
                      {pendingFile?.name}
                    </p>
                    <p className="text-white/70 text-xs">{pendingSizeLabel}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Default upload prompt ── */
              <>
                <div
                  className={`p-4 rounded-2xl ${isDark ? "bg-slate-700/60" : "bg-gray-100"}`}
                >
                  <Upload
                    className={`w-8 h-8 ${isDark ? "text-orange-400" : "text-orange-500"}`}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={`font-semibold ${isDark ? "text-slate-200" : "text-gray-700"}`}
                  >
                    Drag &amp; drop or{" "}
                    <span
                      className={isDark ? "text-orange-400" : "text-orange-600"}
                    >
                      browse
                    </span>
                  </p>
                  <p className={styles.hint}>
                    Supports JPG, PNG, GIF, WEBP, MP4, WEBM · Max 100 MB
                  </p>
                </div>
              </>
            )}
          </div>

          {/* File info row — shown only when no preview (shouldn't happen, but safety net) */}
          {pendingFile && !previewUrl && (
            <div
              className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                isDark
                  ? "bg-slate-900/50 border-slate-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div
                className={`p-2 rounded-lg ${isDark ? "bg-orange-500/15" : "bg-orange-100"}`}
              >
                {isPendingVideo ? (
                  <Film
                    className={`w-4 h-4 ${isDark ? "text-orange-400" : "text-orange-600"}`}
                  />
                ) : (
                  <Image
                    className={`w-4 h-4 ${isDark ? "text-orange-400" : "text-orange-600"}`}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${isDark ? "text-slate-200" : "text-gray-800"}`}
                >
                  {pendingFile.name}
                </p>
                <p className={styles.hint}>{pendingSizeLabel}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingFile(null);
                }}
                className={`p-1.5 rounded-lg transition ${isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-gray-200 text-gray-500"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={() => handleUpload(pendingFile)}
            disabled={!pendingFile || isUploading}
            className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-white font-medium transition-all duration-300 ${
              !pendingFile || isUploading
                ? "opacity-50 cursor-not-allowed bg-orange-500"
                : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95"
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isUploading ? "Uploading…" : "Upload Banner"}
          </button>
        </div>
      </div>

      {/* ── Banners Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={styles.sectionTitle}>
            All Banners
            {!isLoading && (
              <span
                className={`ml-2 text-sm font-normal px-2.5 py-0.5 rounded-full ${
                  isDark
                    ? "bg-slate-700 text-slate-400"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {banners.length}
              </span>
            )}
          </h3>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} isDark={isDark} />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <EmptyState isDark={isDark} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {banners.map((banner) => (
              <BannerCard
                key={banner._id}
                banner={banner}
                isDark={isDark}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onReplace={handleReplace}
                togglingId={togglingId}
                deletingId={deletingId}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Banners;
