import React, { useState, useMemo, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import SettingsTabs from "./SettingsTabs";
import { useTheme } from "../../../context/ThemeContext";
import Lottie from "lottie-react";
import settingsAnimation from "../../../animations/Desktop and smartphone app development (1).json";
import { 
  Settings, 
  ChevronRight, 
  Sparkles,
  Shield,
  Zap,
  Layers
} from "lucide-react";

// Lazy load components for better performance
const GeneralSettings = lazy(() => import("./GeneralSettings"));
const CannedResponses = lazy(() => import("../Settings/CannedResponses/CannedResponses"));
const ApiKeys = lazy(() => import("./ApiKeys"));

// Enhanced Loading fallback component
const LoadingFallback = ({ isDark }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mb-4"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full bg-purple-500/20 animate-pulse"></div>
      </div>
    </div>
    <p className={`mt-4 ${isDark ? "text-gray-400" : "text-gray-500"} font-medium`}>
      Loading settings...
    </p>
  </div>
);

const SettingsPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "general");
  const { isDark } = useTheme();

  // Tab configuration with metadata
  const tabConfig = useMemo(() => ({
    general: { 
      name: "General", 
      icon: Settings, 
      description: "Manage company information and basic settings",
      color: "purple"
    },
    canned: { 
      name: "Canned Responses", 
      icon: Layers, 
      description: "Create and manage pre-written responses",
      color: "blue"
    },
    api: { 
      name: "API Keys", 
      icon: Shield, 
      description: "Manage API authentication and access keys",
      color: "green"
    }
  }), []);

  const currentTab = tabConfig[activeTab];

  // Memoized tab content to prevent unnecessary re-renders
  const tabContent = useMemo(() => {
    const components = {
      general: GeneralSettings,
      canned: CannedResponses,
      api: ApiKeys,
    };
    
    const Component = components[activeTab];
    
    return Component ? (
      <Suspense fallback={<LoadingFallback isDark={isDark} />}>
        <Component showHeader={false} />
      </Suspense>
    ) : null;
  }, [activeTab, isDark]);

  // Enhanced memoized styles for full width
  const styles = useMemo(() => ({
    container: `w-full min-h-screen ${
      isDark 
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" 
        : "bg-gradient-to-br from-gray-50 via-white to-gray-50"
    }`,
    headerSection: `relative overflow-hidden ${
      isDark 
        ? "bg-gradient-to-r from-slate-800/30 to-slate-900/30 border-b border-slate-700/50" 
        : "bg-white/50 border-b border-gray-200"
    } backdrop-blur-sm`,
    headerContent: `px-4 md:px-8 lg:px-12 py-8 md:py-10`,
    titleWrapper: `flex items-start justify-between flex-wrap gap-6`,
    titleSection: `flex-1`,
    titleIcon: `inline-flex items-center gap-3 mb-4`,
    title: `text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r ${
      isDark 
        ? "from-blue-400 via-purple-400 to-pink-400" 
        : "from-purple-600 via-indigo-600 to-blue-600"
    } bg-clip-text text-transparent`,
    subtitle: `text-base md:text-lg mt-3 ${
      isDark ? "text-gray-400" : "text-gray-600"
    } max-w-2xl`,
    breadcrumb: `flex items-center gap-2 mt-4 text-sm`,
    badge: `px-3 py-1 rounded-full text-xs font-medium ${
      isDark 
        ? "bg-gray-800 text-gray-300 border border-gray-700" 
        : "bg-gray-100 text-gray-700 border border-gray-200"
    }`,
    animationWrapper: `relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48`,
    tabsWrapper: `px-4 md:px-8 lg:px-12 pt-6 pb-4`,
    contentWrapper: `px-4 md:px-8 lg:px-12 pb-12`,
    contentCard: `rounded-2xl overflow-hidden ${
      isDark 
        ? "bg-slate-900/40 border border-slate-700/50 backdrop-blur-sm" 
        : "bg-white/80 border border-gray-200 shadow-xl"
    } transition-all duration-300 hover:shadow-2xl`,
    tabIndicator: `absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300`,
  }), [isDark]);

  // Get gradient color based on active tab
  const getTabGradient = () => {
    const gradients = {
      purple: "from-purple-500 to-pink-500",
      blue: "from-blue-500 to-cyan-500",
      green: "from-green-500 to-emerald-500"
    };
    return gradients[currentTab?.color] || gradients.purple;
  };

  return (
    <div className={styles.container}>
      {/* Header Section - Full Width */}
      <div className={styles.headerSection}>
        <div className={styles.headerContent}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleSection}>
              <div className={styles.titleIcon}>
                <div className={`p-2 rounded-xl ${isDark ? "bg-purple-500/20" : "bg-purple-100"}`}>
                  <Settings className={`w-6 h-6 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                </div>
                <h1 className={styles.title}>
                  Settings
                </h1>
              </div>
              
              <p className={styles.subtitle}>
                Configure your workspace, manage preferences, and control integrations
              </p>
              
              {/* Enhanced Breadcrumb */}
              <div className={styles.breadcrumb}>
                <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                  Dashboard
                </span>
                <ChevronRight className={`w-3 h-3 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                <span className={`font-medium ${
                  isDark ? "text-purple-400" : "text-purple-600"
                }`}>
                  Settings
                </span>
                <ChevronRight className={`w-3 h-3 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                <span className={`flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  {currentTab?.name}
                  {currentTab && (
                    <span className={styles.badge}>
                      Active
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Enhanced Animation */}
            <div className={styles.animationWrapper}>
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${getTabGradient()} rounded-full blur-2xl opacity-20 animate-pulse`}></div>
                <Lottie 
                  animationData={settingsAnimation} 
                  loop 
                  autoplay 
                  style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}
                  rendererSettings={{
                    preserveAspectRatio: 'xMidYMid slice',
                    progressiveLoad: true,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Full Width */}
      <div className={styles.tabsWrapper}>
        <div className="relative">
          <SettingsTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <div className={styles.tabIndicator}></div>
        </div>
        
        {/* Tab Description */}
        {currentTab && (
          <div className={`mt-4 flex items-center gap-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            <Sparkles className="w-4 h-4" />
            <p className="text-sm">{currentTab.description}</p>
          </div>
        )}
      </div>

      {/* Content Area - Full Width */}
      <div className={styles.contentWrapper}>
        <div className={styles.contentCard}>
          <div className="p-6 md:p-8 lg:p-10">
            {tabContent}
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulse 3s ease-in-out infinite;
        }
        
        /* Custom scrollbar for better UX */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${isDark ? '#1e293b' : '#f1f5f9'};
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? '#475569' : '#cbd5e1'};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#64748b' : '#94a3b8'};
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;