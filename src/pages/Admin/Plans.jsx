import { useState, useEffect } from "react";
import {
  fetchFranchiseList,
  fetchGroupDetails,
  fetchProfileDetails,
} from "../../api/plans";
import { useTheme } from "../../context/ThemeContext";

// ─── Shared UI Components ──────────────────────────────────────────────────────

const Spinner = () => {
  const { isDark } = useTheme();
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative w-10 h-10">
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
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <p className="text-3xl mb-2">⚠️</p>
      <p className={`text-sm font-medium ${isDark ? "text-rose-300" : "text-rose-500"}`}>{message}</p>
    </div>
  </div>
);

const Badge = ({ children, color = "slate" }) => {
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}>
      {children}
    </span>
  );
};

const Breadcrumb = ({ steps }) => (
  <nav className="flex items-center flex-wrap gap-1.5 text-sm mb-6">
    {steps.map((step, i) => (
      <span key={i} className="flex items-center gap-1.5">
        {i > 0 && <span className="text-slate-300">›</span>}
        <span className={i === steps.length - 1 ? "text-blue-600 font-semibold" : "text-slate-400"}>
          {step}
        </span>
      </span>
    ))}
  </nav>
);

const SectionCard = ({ title, icon, children }) => {
  const { isDark } = useTheme();
  return (
    <div
      className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}
    >
      <div
        className={`flex items-center gap-3 px-6 py-4 border-b ${
          isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-slate-50"
        }`}
      >
        <span className="text-base">{icon}</span>
        <h3
          className={`font-semibold text-xs tracking-widest uppercase ${
            isDark ? "text-slate-200" : "text-slate-700"
          }`}
        >
          {title}
        </h3>
      </div>
      <div className={isDark ? "divide-y divide-slate-800" : "divide-y divide-slate-100"}>
        {children}
      </div>
    </div>
  );
};

const DetailRow = ({ property, value }) => {
  const { isDark } = useTheme();
  return (
    <div
      className={`flex items-center justify-between px-6 py-3 transition-colors ${
        isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
      }`}
    >
      <span className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {property}
      </span>
      <span
        className={`text-sm font-semibold text-right max-w-xs ${
          isDark ? "text-slate-100" : "text-slate-800"
        }`}
      >
        {String(value)}
      </span>
    </div>
  );
};

const BackButton = ({ onClick, isDark = false }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
      isDark
        ? "text-slate-300 hover:text-white hover:bg-slate-800"
        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
    }`}
  >
    ← Back
  </button>
);

// ─── Step Progress ─────────────────────────────────────────────────────────────
const StepProgress = ({ current, isDark = false }) => {
  const steps = ["Franchise", "Groups", "Profile"];
  return (
    <div className="hidden sm:flex items-center gap-2">
      {steps.map((label, i) => {
        const n = i + 1;
        const isDone = current > n;
        const isActive = current === n;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className={`w-8 h-px ${isDone ? "bg-blue-400" : isDark ? "bg-slate-700" : "bg-slate-200"}`} />}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isActive
                ? isDark
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-900/30"
                  : "bg-blue-600 text-white shadow-sm shadow-blue-200"
                : isDone
                ? isDark
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-emerald-100 text-emerald-700"
                : isDark
                ? "bg-slate-800 text-slate-500"
                : "bg-slate-100 text-slate-400"
            }`}>
              <span>{isDone ? "✓" : n}</span>
              <span>{label}</span>
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

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} isDark={isDark} />;

  return (
    <div>
      <Breadcrumb steps={["Franchises"]} />
      <div className="mb-6">
        <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Select a Franchise</h2>
        <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Choose an account to view its group plans
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {franchises.map((f) => (
          <button
            key={f._id}
            onClick={() => onSelect(f)}
            className={`group text-left rounded-2xl border p-5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              isDark
                ? "bg-slate-900 border-slate-800 hover:border-blue-400 hover:shadow-md hover:shadow-blue-900/20"
                : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-md hover:shadow-blue-50"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {f.companyName?.[0]?.toUpperCase() || "F"}
              </div>
              <Badge color="slate">{f.accountId}</Badge>
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
            <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Parent:{" "}
              <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                {f.parentAccountId}
              </span>
            </p>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Created: {new Date(f.dateCreated).toLocaleDateString()}
            </p>
            <div className={`mt-4 flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-blue-300" : "text-blue-500"}`}>
              View Groups →
            </div>
          </button>
        ))}
      </div>
    </div>
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

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} isDark={isDark} />;

  return (
    <div>
      <Breadcrumb steps={["Franchises", franchise.companyName, "Groups"]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Group Plans</h2>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {franchise.companyName} · {groups.length} group{groups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <BackButton onClick={onBack} isDark={isDark} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups.map((g) => (
          <button
            key={g.Group_id}
            onClick={() => onSelect(g)}
            className={`group text-left rounded-2xl border p-5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              isDark
                ? "bg-slate-900 border-slate-800 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-900/20"
                : "bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-50"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {g.Group_name?.[0]?.toUpperCase()}
              </div>
              <Badge color={activeBadgeColor(g.Active_Users, g.Total_Users)}>
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
            <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Profile:{" "}
              <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                {g.Profile_Name}
              </span>
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Total", val: g.Total_Users, color: isDark ? "text-slate-200" : "text-slate-700" },
                { label: "Active", val: g.Active_Users, color: isDark ? "text-emerald-300" : "text-emerald-600" },
                { label: "Online", val: g.Online_Users, color: isDark ? "text-blue-300" : "text-blue-600" },
              ].map(({ label, val, color }) => (
                <div
                  key={label}
                  className={`rounded-lg px-2 py-1.5 text-center ${isDark ? "bg-slate-800/60" : "bg-slate-50"}`}
                >
                  <p className={`text-base font-bold ${color}`}>{val}</p>
                  <p className={`text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <div className={`mt-4 flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-indigo-300" : "text-indigo-500"}`}>
              View Profile Details →
            </div>
          </button>
        ))}
      </div>
    </div>
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

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} isDark={isDark} />;

  return (
    <div>
      <Breadcrumb steps={["Franchises", franchise.companyName, "Groups", group.Group_name, "Profile"]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
            {group.Profile_Name}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Full plan &amp; billing configuration
          </p>
        </div>
        <BackButton onClick={onBack} isDark={isDark} />
      </div>

      {/* Stats Row - Full width cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Users", val: group.Total_Users, icon: "👥", grad: "from-slate-500 to-slate-700" },
          { label: "Active Users", val: group.Active_Users, icon: "✅", grad: "from-emerald-500 to-teal-600" },
          { label: "Online Now", val: group.Online_Users, icon: "🟢", grad: "from-blue-500 to-indigo-600" },
        ].map(({ label, val, icon, grad }) => (
          <div key={label} className={`bg-gradient-to-br ${grad} rounded-2xl p-5 text-white shadow-sm`}>
            <p className="text-3xl font-black">{val}</p>
            <p className="text-sm font-medium opacity-80 mt-2">{icon} {label}</p>
          </div>
        ))}
      </div>

      {/* Detail Sections - Full width grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {details?.["profile Details"] && (
          <SectionCard title="Profile Details" icon="⚙️">
            {details["profile Details"].map((item, i) => (
              <DetailRow key={i} property={item.property.trim()} value={item.value} />
            ))}
          </SectionCard>
        )}
        {details?.["billing Details"] && (
          <SectionCard title="Billing Details" icon="💳">
            {details["billing Details"].map((item, i) => (
              <DetailRow key={i} property={item.property.trim()} value={item.value} />
            ))}
          </SectionCard>
        )}
      </div>

      {/* IDs Footer - Full width */}
      <div
        className={`mt-6 border rounded-xl px-6 py-4 flex flex-wrap gap-6 text-xs ${
          isDark
            ? "bg-slate-900 border-slate-800 text-slate-500"
            : "bg-slate-50 border-slate-200 text-slate-400"
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="font-medium">Group ID:</span>
          <code className={`font-mono px-2 py-1 rounded ${isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
            {group.Group_id}
          </code>
        </span>
        <span className="flex items-center gap-2">
          <span className="font-medium">Profile ID:</span>
          <code className={`font-mono px-2 py-1 rounded ${isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
            {group.Profile_id}
          </code>
        </span>
        <span className="flex items-center gap-2">
          <span className="font-medium">Account:</span>
          <code className={`font-mono px-2 py-1 rounded ${isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
            {franchise.accountId}
          </code>
        </span>
      </div>
    </div>
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
          : "bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className={`text-3xl lg:text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Plans
            </h1>
            <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Franchise · Groups · Profile Details
            </p>
          </div>
          <StepProgress current={step} isDark={isDark} />
        </div>

        {/* Content Card - Full width with no side margins */}
        <div
          className={`w-full rounded-3xl border shadow-sm ${
            isDark ? "bg-slate-900/60 border-slate-800" : "bg-white/60 border-slate-200/80"
          }`}
        >
          <div className="p-6 lg:p-8">
            {step === 1 && (
              <FranchiseList onSelect={handleSelectFranchise} />
            )}
            {step === 2 && selectedFranchise && (
              <GroupList
                franchise={selectedFranchise}
                onSelect={handleSelectGroup}
                onBack={handleBackToFranchises}
              />
            )}
            {step === 3 && selectedFranchise && selectedGroup && (
              <ProfileDetails
                franchise={selectedFranchise}
                group={selectedGroup}
                onBack={handleBackToGroups}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}