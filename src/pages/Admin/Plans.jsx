import { useState, useEffect, useMemo } from "react";
import {
  fetchFranchiseList,
  fetchGroupDetails,
  fetchProfileDetails,
} from "../../api/plans";
import { useTheme } from "../../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  UserCheck,
  Wifi,
  CreditCard,
  Settings,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Calendar,
  Shield,
  Package,
} from "lucide-react";

// ─── Shimmer Components ──────────────────────────────────────────────────────

const FranchiseCardShimmer = ({ isDark }) => (
  <div className="animate-pulse">
    <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl ${isDark ? "bg-slate-700" : "bg-gray-200"}`}></div>
        <div className={`w-16 h-6 rounded-full ${isDark ? "bg-slate-700" : "bg-gray-200"}`}></div>
      </div>
      <div className={`h-5 w-3/4 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded mb-2`}></div>
      <div className={`h-3 w-1/2 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded mb-1`}></div>
      <div className={`h-3 w-2/3 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded`}></div>
      <div className="mt-4 flex items-center gap-1.5">
        <div className={`h-3 w-20 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded`}></div>
      </div>
    </div>
  </div>
);

const GroupCardShimmer = ({ isDark }) => (
  <div className="animate-pulse">
    <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl ${isDark ? "bg-slate-700" : "bg-gray-200"}`}></div>
        <div className={`w-20 h-6 rounded-full ${isDark ? "bg-slate-700" : "bg-gray-200"}`}></div>
      </div>
      <div className={`h-5 w-3/4 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded mb-2`}></div>
      <div className={`h-3 w-2/3 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded mb-3`}></div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`rounded-lg p-2 ${isDark ? "bg-slate-700/50" : "bg-gray-100"}`}>
            <div className={`h-6 w-full ${isDark ? "bg-slate-600" : "bg-gray-200"} rounded mb-1`}></div>
            <div className={`h-2 w-full ${isDark ? "bg-slate-600" : "bg-gray-200"} rounded`}></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const StatsCardShimmer = ({ isDark }) => (
  <div className={`rounded-2xl p-6 animate-pulse ${isDark ? "bg-slate-800/50" : "bg-gray-100"}`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className={`h-8 w-20 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded mb-2`}></div>
        <div className={`h-4 w-24 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded`}></div>
      </div>
      <div className={`w-8 h-8 rounded-full ${isDark ? "bg-slate-700" : "bg-gray-200"}`}></div>
    </div>
  </div>
);

const DetailRowShimmer = ({ isDark }) => (
  <div className="flex items-center justify-between px-6 py-3 animate-pulse">
    <div className={`h-4 w-32 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded`}></div>
    <div className={`h-4 w-48 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded`}></div>
  </div>
);

const SectionCardShimmer = ({ isDark }) => (
  <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
    <div className={`flex items-center gap-3 px-6 py-4 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
      <div className={`w-5 h-5 rounded ${isDark ? "bg-slate-700" : "bg-gray-200"}`}></div>
      <div className={`h-4 w-32 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded`}></div>
    </div>
    <div className="divide-y">
      {[1, 2, 3, 4].map((i) => (
        <DetailRowShimmer key={i} isDark={isDark} />
      ))}
    </div>
  </div>
);

// ─── Shared UI Components ──────────────────────────────────────────────────────

const Spinner = () => {
  const { isDark } = useTheme();
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative w-12 h-12">
        <div
          className={`absolute inset-0 rounded-full border-4 ${
            isDark ? "border-slate-700" : "border-slate-200"
          }`}
        />
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin" />
      </div>
    </div>
  );
};

const ErrorMsg = ({ message, isDark = false }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex items-center justify-center py-20"
  >
    <div className="text-center">
      <div className={`text-6xl mb-4 ${isDark ? "text-rose-400" : "text-rose-500"}`}>⚠️</div>
      <p className={`text-sm font-medium ${isDark ? "text-rose-300" : "text-rose-500"}`}>{message}</p>
    </div>
  </motion.div>
);

const Badge = ({ children, color = "slate", icon = null }) => {
  const { isDark } = useTheme();
  const colors = {
    green: isDark
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
      : "bg-emerald-100 text-emerald-700 border-emerald-200",
    amber: isDark
      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
      : "bg-amber-100 text-amber-700 border-amber-200",
    rose: isDark
      ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
      : "bg-rose-100 text-rose-700 border-rose-200",
    blue: isDark
      ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
      : "bg-blue-100 text-blue-700 border-blue-200",
    slate: isDark
      ? "bg-slate-500/10 text-slate-300 border-slate-500/30"
      : "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}>
      {icon && <span className="text-xs">{icon}</span>}
      {children}
    </span>
  );
};

const Breadcrumb = ({ steps }) => {
  const { isDark } = useTheme();
  return (
    <nav className="flex items-center flex-wrap gap-1.5 text-sm mb-6">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className={`w-3 h-3 ${isDark ? "text-slate-600" : "text-slate-300"}`} />}
          <span
            className={`transition-colors ${
              i === steps.length - 1
                ? isDark
                  ? "text-blue-400 font-semibold"
                  : "text-blue-600 font-semibold"
                : isDark
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            {step}
          </span>
        </div>
      ))}
    </nav>
  );
};

const SectionCard = ({ title, icon, children, gradient = false, loading = false }) => {
  const { isDark } = useTheme();
  
  if (loading) {
    return <SectionCardShimmer isDark={isDark} />;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border shadow-sm overflow-hidden ${
        gradient && !isDark
          ? "bg-gradient-to-br from-white to-indigo-50/30"
          : isDark
          ? "bg-slate-900/60 border-slate-800"
          : "bg-white border-slate-200"
      }`}
    >
      <div
        className={`flex items-center gap-3 px-6 py-4 border-b ${
          isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-slate-50/50"
        }`}
      >
        <span className="text-lg">{icon}</span>
        <h3
          className={`font-semibold text-xs tracking-widest uppercase ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {title}
        </h3>
      </div>
      <div className={isDark ? "divide-y divide-slate-800" : "divide-y divide-slate-100"}>
        {children}
      </div>
    </motion.div>
  );
};

const DetailRow = ({ property, value, highlight = false }) => {
  const { isDark } = useTheme();
  return (
    <motion.div
      whileHover={{ x: 5 }}
      className={`flex items-center justify-between px-6 py-3 transition-all duration-200 ${
        isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
      } ${highlight ? (isDark ? "bg-blue-500/5" : "bg-blue-50/30") : ""}`}
    >
      <span className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {property}
      </span>
      <span
        className={`text-sm font-semibold text-right max-w-xs break-words ${
          highlight
            ? isDark
              ? "text-blue-400"
              : "text-blue-600"
            : isDark
            ? "text-slate-200"
            : "text-slate-700"
        }`}
      >
        {String(value)}
      </span>
    </motion.div>
  );
};

const BackButton = ({ onClick, isDark = false }) => (
  <motion.button
    whileHover={{ x: -3 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex items-center gap-2 text-sm font-medium transition-all px-3 py-1.5 rounded-lg ${
      isDark
        ? "text-slate-400 hover:text-white hover:bg-slate-800"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`}
  >
    <ArrowLeft className="w-4 h-4" />
    Back
  </motion.button>
);

// ─── Step Progress ─────────────────────────────────────────────────────────────
const StepProgress = ({ current, isDark = false }) => {
  const steps = [
    { name: "Franchise", icon: Building2 },
    { name: "Groups", icon: Users },
    { name: "Profile", icon: Shield },
  ];
  
  return (
    <div className="hidden sm:flex items-center gap-2">
      {steps.map((step, i) => {
        const n = i + 1;
        const isDone = current > n;
        const isActive = current === n;
        const Icon = step.icon;
        
        return (
          <div key={step.name} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`w-8 h-px ${isDone ? "bg-blue-400" : isDark ? "bg-slate-700" : "bg-slate-200"}`} />
            )}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? isDark
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                  : isDone
                  ? isDark
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : isDark
                  ? "bg-slate-800 text-slate-500"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {isDone ? (
                <span className="text-xs">✓</span>
              ) : (
                <Icon className="w-3 h-3" />
              )}
              <span>{step.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Step 1: Franchise List ────────────────────────────────────────────────────
const FranchiseList = ({ onSelect }) => {
  const { isDark } = useTheme();
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFranchiseList()
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!res?.success && list.length === 0) {
          setError("Failed to load franchises.");
        } else {
          setFranchises(list);
        }
      })
      .catch((err) =>
        setError(err?.response?.data?.message || err?.message || "Network error. Is the server running?")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <Breadcrumb steps={["Franchises"]} />
        <div className="mb-6">
          <div className={`h-8 w-64 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded animate-pulse mb-2`}></div>
          <div className={`h-4 w-96 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded animate-pulse`}></div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <FranchiseCardShimmer key={i} isDark={isDark} />
          ))}
        </div>
      </div>
    );
  }
  
  if (error) return <ErrorMsg message={error} isDark={isDark} />;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Breadcrumb steps={["Franchises"]} />
      <div className="mb-6">
        <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}>
          <Building2 className="w-6 h-6" />
          Select a Franchise
        </h2>
        <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Choose an account to view its group plans and configurations
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {franchises.map((f, index) => (
          <motion.button
            key={f._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(f)}
            className={`group text-left rounded-2xl border p-5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              isDark
                ? "bg-slate-900/60 border-slate-800 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10"
                : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-xl"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {f.companyName?.[0]?.toUpperCase() || "F"}
              </div>
              <Badge color="slate" icon="📋">{f.accountId}</Badge>
            </div>
            <p
              className={`font-bold text-base transition-colors ${
                isDark
                  ? "text-slate-100 group-hover:text-blue-300"
                  : "text-slate-800 group-hover:text-blue-600"
              }`}
            >
              {f.companyName}
            </p>
            <p className={`text-xs mt-1 flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <Building2 className="w-3 h-3" />
              Parent:{" "}
              <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                {f.parentAccountId}
              </span>
            </p>
            <p className={`text-xs mt-0.5 flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <Calendar className="w-3 h-3" />
              Created: {new Date(f.dateCreated).toLocaleDateString()}
            </p>
            <div className={`mt-4 flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-blue-300" : "text-blue-500"}`}>
              View Groups →
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Step 2: Group List ────────────────────────────────────────────────────────
const GroupList = ({ franchise, onSelect, onBack }) => {
  const { isDark } = useTheme();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroupDetails(franchise.accountId)
      .then((res) => {
        const list =
          Array.isArray(res?.data?.data)  ? res.data.data  :
          Array.isArray(res?.data)        ? res.data       :
          [];

        if (!res?.success && list.length === 0) {
          setError("Failed to load group details.");
        } else {
          setGroups(list);
        }
      })
      .catch((err) =>
        setError(err?.response?.data?.message || err?.message || "Network error while loading groups.")
      )
      .finally(() => setLoading(false));
  }, [franchise]);

  const activeBadgeColor = (active, total) => {
    if (total === 0) return "slate";
    const pct = active / total;
    if (pct >= 0.8) return "green";
    if (pct >= 0.4) return "amber";
    return "rose";
  };

  if (loading) {
    return (
      <div>
        <Breadcrumb steps={["Franchises", franchise.companyName, "Groups"]} />
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className={`h-8 w-48 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded animate-pulse mb-2`}></div>
            <div className={`h-4 w-64 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded animate-pulse`}></div>
          </div>
          <div className={`w-20 h-9 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded animate-pulse`}></div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <GroupCardShimmer key={i} isDark={isDark} />
          ))}
        </div>
      </div>
    );
  }
  
  if (error) return <ErrorMsg message={error} isDark={isDark} />;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Breadcrumb steps={["Franchises", franchise.companyName, "Groups"]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}>
            <Users className="w-6 h-6" />
            Group Plans
          </h2>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {franchise.companyName} · {groups.length} group{groups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <BackButton onClick={onBack} isDark={isDark} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups.map((g, index) => (
          <motion.button
            key={g.Group_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(g)}
            className={`group text-left rounded-2xl border p-5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              isDark
                ? "bg-slate-900/60 border-slate-800 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10"
                : "bg-white border-slate-200 hover:border-indigo-400 hover:shadow-xl"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {g.Group_name?.[0]?.toUpperCase()}
              </div>
              <Badge color={activeBadgeColor(g.Active_Users, g.Total_Users)} icon="👥">
                {g.Active_Users}/{g.Total_Users} active
              </Badge>
            </div>
            <p
              className={`font-bold text-base transition-colors ${
                isDark
                  ? "text-slate-100 group-hover:text-indigo-300"
                  : "text-slate-800 group-hover:text-indigo-600"
              }`}
            >
              {g.Group_name}
            </p>
            <p className={`text-xs mt-1 flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <Package className="w-3 h-3" />
              Profile:{" "}
              <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                {g.Profile_Name}
              </span>
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Total", val: g.Total_Users, icon: "👥", color: isDark ? "text-slate-200" : "text-slate-700" },
                { label: "Active", val: g.Active_Users, icon: "✅", color: isDark ? "text-emerald-300" : "text-emerald-600" },
                { label: "Online", val: g.Online_Users, icon: "🟢", color: isDark ? "text-blue-300" : "text-blue-600" },
              ].map(({ label, val, icon, color }) => (
                <div
                  key={label}
                  className={`rounded-lg px-2 py-2 text-center transition-all group-hover:scale-105 ${
                    isDark ? "bg-slate-800/60" : "bg-slate-50"
                  }`}
                >
                  <p className={`text-lg font-bold ${color}`}>{val}</p>
                  <p className={`text-[10px] font-medium flex items-center justify-center gap-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    <span>{icon}</span>
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <div className={`mt-4 flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-indigo-300" : "text-indigo-500"}`}>
              View Profile Details →
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Step 3: Profile Details ───────────────────────────────────────────────────
const ProfileDetails = ({ franchise, group, onBack }) => {
  const { isDark } = useTheme();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfileDetails(franchise.accountId, group.Profile_id)
      .then((res) => {
        const message =
          res?.data?.data?.message ||
          res?.data?.message ||
          res?.message ||
          null;

        if (!res?.success && !message) {
          setError("Failed to load profile details.");
        } else {
          setDetails(message);
        }
      })
      .catch((err) =>
        setError(err?.response?.data?.message || err?.message || "Network error while loading profile details.")
      )
      .finally(() => setLoading(false));
  }, [franchise, group]);

  if (loading) {
    return (
      <div>
        <Breadcrumb steps={["Franchises", franchise.companyName, "Groups", group.Group_name, "Profile"]} />
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className={`h-8 w-64 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded animate-pulse mb-2`}></div>
            <div className={`h-4 w-48 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded animate-pulse`}></div>
          </div>
          <div className={`w-20 h-9 ${isDark ? "bg-slate-800" : "bg-gray-200"} rounded animate-pulse`}></div>
        </div>

        {/* Stats Row Shimmer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {[1, 2, 3].map((i) => (
            <StatsCardShimmer key={i} isDark={isDark} />
          ))}
        </div>

        {/* Detail Sections Shimmer */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCardShimmer isDark={isDark} />
          <SectionCardShimmer isDark={isDark} />
        </div>

        {/* Footer Shimmer */}
        <div className={`mt-8 rounded-xl px-6 py-4 flex flex-wrap gap-6 ${isDark ? "bg-slate-800/30" : "bg-slate-50"}`}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-8 w-48 ${isDark ? "bg-slate-700" : "bg-gray-200"} rounded animate-pulse`}></div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) return <ErrorMsg message={error} isDark={isDark} />;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Breadcrumb steps={["Franchises", franchise.companyName, "Groups", group.Group_name, "Profile"]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}>
            <Shield className="w-6 h-6" />
            {group.Profile_Name}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Full plan & billing configuration
          </p>
        </div>
        <BackButton onClick={onBack} isDark={isDark} />
      </div>

      {/* Stats Row - Full width gradient cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[
          { label: "Total Users", val: group.Total_Users, icon: Users, gradient: "from-slate-600 to-slate-800", color: "slate" },
          { label: "Active Users", val: group.Active_Users, icon: UserCheck, gradient: "from-emerald-500 to-teal-600", color: "green" },
          { label: "Online Now", val: group.Online_Users, icon: Wifi, gradient: "from-blue-500 to-indigo-600", color: "blue" },
        ].map(({ label, val, icon: Icon, gradient, color }) => (
          <motion.div
            key={label}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-black">{val}</p>
                <p className="text-sm font-medium opacity-90 mt-2 flex items-center gap-1">
                  <Icon className="w-4 h-4" />
                  {label}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-50" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Sections - Full width grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {details?.["profile Details"] && (
          <SectionCard title="Profile Details" icon="⚙️" gradient>
            {details["profile Details"].map((item, i) => (
              <DetailRow key={i} property={item.property.trim()} value={item.value} />
            ))}
          </SectionCard>
        )}
        {details?.["billing Details"] && (
          <SectionCard title="Billing Details" icon="💳" gradient>
            {details["billing Details"].map((item, i) => (
              <DetailRow key={i} property={item.property.trim()} value={item.value} highlight={item.property?.toLowerCase().includes("price") || item.property?.toLowerCase().includes("amount")} />
            ))}
          </SectionCard>
        )}
      </div>

      {/* IDs Footer - Full width */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`mt-8 border rounded-xl px-6 py-4 flex flex-wrap gap-6 text-xs ${
          isDark
            ? "bg-slate-900/40 border-slate-800"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Group ID:</span>
          <code className={`font-mono px-2 py-1 rounded ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
            {group.Group_id}
          </code>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Profile ID:</span>
          <code className={`font-mono px-2 py-1 rounded ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
            {group.Profile_id}
          </code>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Account:</span>
          <code className={`font-mono px-2 py-1 rounded ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
            {franchise.accountId}
          </code>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Plans Page ───────────────────────────────────────────────────────────
export default function Plans() {
  const { isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const handleSelectFranchise = (franchise) => {
    setSelectedFranchise(franchise);
    setStep(2);
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setStep(3);
  };

  const handleBackToFranchises = () => {
    setSelectedFranchise(null);
    setSelectedGroup(null);
    setStep(1);
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setStep(2);
  };

  return (
    <div
      className={`min-h-screen w-full ${
        isDark
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
          : "bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1
              className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight flex items-center gap-3 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              <div className={`p-2 rounded-xl ${isDark ? "bg-blue-500/20" : "bg-blue-100"}`}>
                <Settings className={`w-6 h-6 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
              </div>
              Plans
            </h1>
            <p className={`text-sm mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Franchise Management · Groups · Profile Details
            </p>
          </div>
          <StepProgress current={step} isDark={isDark} />
        </motion.div>

        {/* Content Card - Full width with no side margins */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`w-full rounded-3xl border shadow-xl ${
            isDark 
              ? "bg-slate-900/40 border-slate-800/50 backdrop-blur-sm" 
              : "bg-white/80 border-slate-200/80 backdrop-blur-sm"
          }`}
        >
          <div className="p-6 lg:p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <FranchiseList key="franchise" onSelect={handleSelectFranchise} />
              )}
              {step === 2 && selectedFranchise && (
                <GroupList
                  key="group"
                  franchise={selectedFranchise}
                  onSelect={handleSelectGroup}
                  onBack={handleBackToFranchises}
                />
              )}
              {step === 3 && selectedFranchise && selectedGroup && (
                <ProfileDetails
                  key="profile"
                  franchise={selectedFranchise}
                  group={selectedGroup}
                  onBack={handleBackToGroups}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}