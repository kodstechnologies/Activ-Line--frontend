import { useMemo } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { Settings, MessageSquare, Key, ChevronRight } from "lucide-react";

const tabs = [
  { id: "general", label: "General", icon: Settings, color: "purple" },
  { id: "canned", label: "Canned Responses", icon: MessageSquare, color: "blue" },
  { id: "api", label: "API Keys", icon: Key, color: "green" },
];

const SettingsTabs = ({ activeTab, setActiveTab }) => {
  const { isDark } = useTheme();

  const getTabColor = (color, isActive) => {
    if (!isActive) return "";
    
    const colors = {
      purple: isDark ? "from-purple-600 to-purple-500" : "from-purple-500 to-indigo-600",
      blue: isDark ? "from-blue-600 to-blue-500" : "from-blue-500 to-cyan-600",
      green: isDark ? "from-green-600 to-green-500" : "from-green-500 to-emerald-600",
    };
    return colors[color] || colors.purple;
  };

  const styles = useMemo(() => ({
    container: `flex gap-2 p-1 rounded-xl ${
      isDark 
        ? "bg-slate-800/50 border border-slate-700/50" 
        : "bg-gray-100/50 border border-gray-200"
    } backdrop-blur-sm`,
    tabButton: `relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 group`,
    activeTab: `text-white shadow-lg transform scale-105`,
    inactiveTab: `${isDark ? "text-slate-400 hover:text-slate-200" : "text-gray-600 hover:text-gray-900"}`,
  }), [isDark]);

  return (
    <div className="w-full">
      <div className={styles.container}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const gradientClass = getTabColor(tab.color, isActive);
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                ${styles.tabButton}
                ${isActive ? styles.activeTab : styles.inactiveTab}
                ${isActive ? `bg-gradient-to-r ${gradientClass}` : ""}
              `}
            >
              <Icon className={`w-4 h-4 md:w-5 md:h-5 transition-all duration-300 ${
                isActive ? "text-white" : ""
              }`} />
              <span className="text-sm md:text-base font-medium whitespace-nowrap">
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Tab Indicator Line (optional) */}
      <div className={`mt-3 h-0.5 w-full rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-gray-200"}`}>
        <div 
          className={`h-full transition-all duration-300 bg-gradient-to-r ${
            isDark 
              ? "from-blue-500 to-purple-500" 
              : "from-purple-500 to-indigo-500"
          }`}
          style={{ 
            width: `${(tabs.findIndex(t => t.id === activeTab) + 1) * (100 / tabs.length)}%` 
          }}
        />
      </div>
    </div>
  );
};

export default SettingsTabs;