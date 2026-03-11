import { useState, useEffect } from "react";
import {
  fetchFranchiseList,
  fetchGroupDetails,
  fetchProfileDetails,
} from "../../api/plans";

// ─── Shared UI Components ──────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
      <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin" />
    </div>
  </div>
);

const ErrorMsg = ({ message }) => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <p className="text-3xl mb-2">⚠️</p>
      <p className="text-rose-500 text-sm font-medium">{message}</p>
    </div>
  </div>
);

const Badge = ({ children, color = "slate" }) => {
  const colors = {
    green: "bg-emerald-100 text-emerald-700 border-emerald-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
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

const SectionCard = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
      <span className="text-base">{icon}</span>
      <h3 className="font-semibold text-slate-700 text-xs tracking-widest uppercase">{title}</h3>
    </div>
    <div className="divide-y divide-slate-100">{children}</div>
  </div>
);

const DetailRow = ({ property, value }) => (
  <div className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
    <span className="text-sm text-slate-500 font-medium">{property}</span>
    <span className="text-sm text-slate-800 font-semibold text-right max-w-xs">{String(value)}</span>
  </div>
);

const BackButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
  >
    ← Back
  </button>
);

// ─── Step Progress ─────────────────────────────────────────────────────────────
const StepProgress = ({ current }) => {
  const steps = ["Franchise", "Groups", "Profile"];
  return (
    <div className="hidden sm:flex items-center gap-2">
      {steps.map((label, i) => {
        const n = i + 1;
        const isDone = current > n;
        const isActive = current === n;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className={`w-8 h-px ${isDone ? "bg-blue-400" : "bg-slate-200"}`} />}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isActive
                ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                : isDone
                ? "bg-emerald-100 text-emerald-700"
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
  if (error) return <ErrorMsg message={error} />;

  return (
    <div>
      <Breadcrumb steps={["Franchises"]} />
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Select a Franchise</h2>
        <p className="text-sm text-slate-500 mt-1">Choose an account to view its group plans</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {franchises.map((f) => (
          <button
            key={f._id}
            onClick={() => onSelect(f)}
            className="group text-left bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-md hover:shadow-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {f.companyName?.[0]?.toUpperCase() || "F"}
              </div>
              <Badge color="slate">{f.accountId}</Badge>
            </div>
            <p className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors">
              {f.companyName}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Parent: <span className="font-medium text-slate-500">{f.parentAccountId}</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Created: {new Date(f.dateCreated).toLocaleDateString()}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-blue-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
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
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroupDetails(franchise.accountId)
      .then((res) => {
        // Safely handle multiple possible response shapes:
        // { success, data: { data: [...] } }  OR  { success, data: [...] }
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
  if (error) return <ErrorMsg message={error} />;

  return (
    <div>
      <Breadcrumb steps={["Franchises", franchise.companyName, "Groups"]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Group Plans</h2>
          <p className="text-sm text-slate-500 mt-1">
            {franchise.companyName} · {groups.length} group{groups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <BackButton onClick={onBack} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <button
            key={g.Group_id}
            onClick={() => onSelect(g)}
            className="group text-left bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {g.Group_name?.[0]?.toUpperCase()}
              </div>
              <Badge color={activeBadgeColor(g.Active_Users, g.Total_Users)}>
                {g.Active_Users}/{g.Total_Users} active
              </Badge>
            </div>
            <p className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">
              {g.Group_name}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Profile: <span className="font-medium text-slate-500">{g.Profile_Name}</span>
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Total", val: g.Total_Users, color: "text-slate-700" },
                { label: "Active", val: g.Active_Users, color: "text-emerald-600" },
                { label: "Online", val: g.Online_Users, color: "text-blue-600" },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-slate-50 rounded-lg px-2 py-1.5 text-center">
                  <p className={`text-base font-bold ${color}`}>{val}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-indigo-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
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
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfileDetails(franchise.accountId, group.Profile_id)
      .then((res) => {
        // Safely handle: { success, data: { data: { message: {...} } } }
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
  if (error) return <ErrorMsg message={error} />;

  return (
    <div>
      <Breadcrumb steps={["Franchises", franchise.companyName, "Groups", group.Group_name, "Profile"]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{group.Profile_Name}</h2>
          <p className="text-sm text-slate-500 mt-1">Full plan &amp; billing configuration</p>
        </div>
        <BackButton onClick={onBack} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Users", val: group.Total_Users, icon: "👥", grad: "from-slate-500 to-slate-700" },
          { label: "Active Users", val: group.Active_Users, icon: "✅", grad: "from-emerald-500 to-teal-600" },
          { label: "Online Now", val: group.Online_Users, icon: "🟢", grad: "from-blue-500 to-indigo-600" },
        ].map(({ label, val, icon, grad }) => (
          <div key={label} className={`bg-gradient-to-br ${grad} rounded-2xl p-4 text-white shadow-sm`}>
            <p className="text-2xl font-black">{val}</p>
            <p className="text-xs font-medium opacity-80 mt-1">{icon} {label}</p>
          </div>
        ))}
      </div>

      {/* Detail Sections */}
      <div className="grid gap-4 lg:grid-cols-2">
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

      {/* IDs Footer */}
      <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 flex flex-wrap gap-4 text-xs text-slate-400">
        <span>Group ID: <code className="font-mono text-slate-600">{group.Group_id}</code></span>
        <span>Profile ID: <code className="font-mono text-slate-600">{group.Profile_id}</code></span>
        <span>Account: <code className="font-mono text-slate-600">{franchise.accountId}</code></span>
      </div>
    </div>
  );
};

// ─── Main Plans Page ───────────────────────────────────────────────────────────
export default function Plans() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Plans</h1>
            <p className="text-sm text-slate-500 mt-0.5">Franchise · Groups · Profile Details</p>
          </div>
          <StepProgress current={step} />
        </div>

        {/* Content Card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-200/80 shadow-sm p-6">
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
  );
}