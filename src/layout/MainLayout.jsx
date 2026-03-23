import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Bell,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import toast from "react-hot-toast";

import ActivlineLogo from "./logo.jsx";
import SidebarItem from "../components/SidebarItem";
import Breadcrumb from "../components/Breadcrumb";
import ThemeToggle from "../components/ThemeToggle";
import Lottie from "lottie-react";
import sidebarWifiAnimation from "../animations/SidebarWifi.json";


import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

import {
  adminSidebarItems,
  franchiseSidebarItems,
  staffSidebarItems,
} from "../config/Sidebar.config";
import { getStaffUnreadCount } from "../api/staffnotification.api";
import { getUnreadCountApi } from "../api/notification.api";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [notificationCount, setNotificationCount] = useState(0);

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    // Redirect to the correct dashboard after login, if landing on a generic page.
    if (user) {
      const role = user.role?.toLowerCase();

      if (location.pathname === "/" || location.pathname === "/dashboard") {
        if ((role === 'franchise' || role === 'franchise_admin') && location.pathname !== '/franchise-dashboard') {
          navigate('/franchise-dashboard', { replace: true });
        }
      } else if (location.pathname === "/customers" && (role === 'franchise' || role === 'franchise_admin')) {
        navigate('/my-customers', { replace: true });
      } else if (location.pathname === "/tickets" && (role === 'franchise' || role === 'franchise_admin')) {
        navigate('/Zone-tickets', { replace: true });
      }
    }
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchCount = async () => {
      if (!user) return;
      const role = user.role?.toLowerCase();

      try {
        if (["staff", "admin_staff"].includes(role)) {
          const count = await getStaffUnreadCount();
          setNotificationCount(count);
        } else if (["admin", "super_admin"].includes(role)) {
          const count = await getUnreadCountApi();
          setNotificationCount(count);
        }
      } catch (error) {
        console.error("Failed to fetch notification count", error);
        setNotificationCount(0);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [user]);

  /* ---------------- HELPERS ---------------- */
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNotificationClick = () => {
    const role = user?.role?.toLowerCase();
    if (role === "admin" || role === "super_admin") {
      navigate("/admin-notifications");
    } else if (role === "franchise" || role === "franchise_admin") {
      navigate("/franchise-notifications");
    } else {
      navigate("/staff-notifications");
    }
  };

  const handleTestNotification = async () => {
    const title = "Test notification";
    const body = "This is a local popup test.";

    try {
      if ("Notification" in window) {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }

        if (Notification.permission === "granted") {
          new Notification(title, { body });
        }
      }
    } catch {
      // Ignore native notification errors
    }

    toast(
      <div className="flex items-start gap-3">
        <div className="text-lg">🔔</div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-600 mt-0.5">{body}</p>
        </div>
      </div>,
      { duration: 4000 }
    );
  };

  const sidebarItemsMap = {
    admin: adminSidebarItems,
    super_admin: adminSidebarItems,
    // Filter out the 'Local Staff' item for franchise roles
    franchise: franchiseSidebarItems.filter(item => item.paths[0] !== '/local-staff'),
    franchise_admin: franchiseSidebarItems.filter(item => item.paths[0] !== '/local-staff'),
    staff: staffSidebarItems,
    admin_staff: staffSidebarItems,
  };

  const sidebarItems = sidebarItemsMap[user?.role?.toLowerCase()] || [];
  const isItemActive = (item) =>
    item.paths.some((p) => location.pathname.startsWith(p));

  /* ---------------- UI ---------------- */
  return (
    <div
      className={`flex min-h-screen transition-all duration-500 ease-out
      ${isDark 
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100" 
        : "bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900"}`}
    >
      {/* GLOW EFFECTS */}
      {!isMobile && (
        <>
          <div className={`fixed top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10 animate-pulse
            ${isDark ? 'bg-blue-500' : 'bg-purple-300'}`}
            style={{ transform: 'translate(-30%, -30%)' }}
          />
          <div className={`fixed bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10 animate-pulse delay-1000
            ${isDark ? 'bg-emerald-500' : 'bg-emerald-300'}`}
            style={{ transform: 'translate(30%, 30%)' }}
          />
        </>
      )}

      {/* MOBILE OVERLAY */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen
        ${sidebarCollapsed ? "w-24" : "w-80"}
        transition-all duration-500 ease-out
        ${sidebarOpen ? "translate-x-0 animate-in slide-in-from-left-80" : "-translate-x-full md:translate-x-0"}
        ${
          isDark
            ? "bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-lg border-slate-800/50 shadow-2xl shadow-slate-900/50"
            : "bg-gradient-to-b from-white/95 to-gray-50/95 backdrop-blur-lg border-gray-200 shadow-2xl shadow-gray-200/50"
        }
        border-r flex flex-col`}
      >
        {/* LOGO */}
        <div
          className={`h-24 flex items-center border-b
          ${sidebarCollapsed ? "justify-center" : "justify-between px-6"}
          ${isDark ? "border-slate-800/50" : "border-gray-200/50"} transition-all duration-300`}
        >
          <ActivlineLogo collapsed={sidebarCollapsed} />

          {!isMobile && (
            <button
              onClick={() => setSidebarCollapsed((p) => !p)}
              className={`p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110
                ${isDark 
                  ? "hover:bg-slate-800/80 shadow-lg shadow-slate-800/50" 
                  : "hover:bg-gray-100 shadow-lg shadow-gray-200/50"}`}
            >
              {sidebarCollapsed ? (
                <ChevronRight size={20} className={isDark ? "text-slate-400" : "text-gray-600"} />
              ) : (
                <ChevronLeft size={20} className={isDark ? "text-slate-400" : "text-gray-600"} />
              )}
            </button>
          )}

          {isMobile && (
            <button 
              onClick={() => setSidebarOpen(false)}
              className={`p-2.5 rounded-xl transition-all duration-300
                ${isDark 
                  ? "hover:bg-slate-800/80" 
                  : "hover:bg-gray-100"}`}
            >
              <X size={20} className={isDark ? "text-slate-400" : "text-gray-600"} />
            </button>
          )}
        </div>

        {/* NAV */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-transparent hover:scrollbar-thumb-gray-400/20">
          {sidebarItems.map((item) => (
            <SidebarItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={isItemActive(item)}
              collapsed={sidebarCollapsed}
              onClick={() => {
                navigate(item.paths[0]);
                setSidebarOpen(false);
              }}
              role={user?.role}
              isDark={isDark}
            />
          ))}
        </nav>

        {/* FOOTER */}
        {!sidebarCollapsed && (
          <div
            className={`p-4 border-t transition-all duration-300
              ${isDark ? "border-slate-800/50" : "border-gray-200/50"}`}
          >
            <button
              onClick={() => setIsUserMenuOpen((p) => !p)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl
                transition-all duration-300 transform hover:scale-[1.02] group
                ${isDark 
                  ? "hover:bg-slate-800/70 shadow-lg shadow-slate-900/30" 
                  : "hover:bg-gray-100 shadow-lg shadow-gray-200/30"}`}
            >
              <div className="relative">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br 
                  ${isDark 
                    ? "from-blue-500 to-purple-600" 
                    : "from-indigo-500 to-purple-600"
                  } text-white flex items-center justify-center font-bold text-lg`}
                >
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 
                  ${isDark ? "border-slate-900" : "border-white"}
                  ${["admin", "super_admin"].includes(user?.role?.toLowerCase()) 
                    ? "bg-emerald-500" 
                    : ["franchise", "franchise_admin"].includes(user?.role?.toLowerCase())
                    ? "bg-orange-500"
                    : "bg-blue-500"}`}
                />
              </div>
              <div className="text-left">
                <p className="text-base font-semibold group-hover:text-purple-600 dark:group-hover:text-blue-400 transition-colors">
                  {user?.name}
                </p>
                <p className={`text-xs uppercase tracking-wider font-medium
                  ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className={`mt-2 rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-2 duration-300
                ${isDark 
                  ? "bg-slate-800/80 border border-slate-700/50 backdrop-blur-lg" 
                  : "bg-white border border-gray-200/50 backdrop-blur-lg"}`}
              >
                <button
                  onClick={() => navigate("/profile")}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-lg font-medium
                    transition-all duration-300 hover:pl-5
                    ${isDark 
                      ? "hover:bg-slate-700/50 text-slate-300" 
                      : "hover:bg-gray-100 text-gray-700"}`}
                >
                  <User size={18} className="text-purple-500 dark:text-blue-400" /> Profile
                </button>
                <button
                  onClick={handleLogout}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-lg font-medium
                    transition-all duration-300 hover:pl-5
                    ${isDark 
                      ? "text-red-400 hover:bg-red-500/10" 
                      : "text-red-500 hover:bg-red-50"}`}
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <header
          className={`sticky top-0 z-30 h-24 px-6 md:px-8 flex items-center
            backdrop-blur-xl transition-all duration-500
            border-b shadow-xl
            ${
              isDark
                ? "bg-slate-900/80 border-slate-800/50 shadow-slate-900/30"
                : "bg-white/80 border-gray-200/50 shadow-gray-200/30"
            }`}
        >
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="md:hidden p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110"
          >
            <Menu size={24} className={isDark ? "text-slate-400" : "text-gray-600"} />
          </button>

        <div className="m-0 p-0">
  <div className="flex items-center m-0 p-0">

    {/* Animation (absolute trim technique) */}
    <div className="hidden md:flex w-14 h-14 items-center justify-center shrink-0 m-0 p-0">
      <Lottie
        animationData={sidebarWifiAnimation}
        loop
        className="block w-full h-full m-0 p-0"
        style={{ marginLeft: "-2px" }}   // trims SVG whitespace if present
      />
    </div>

    {/* Heading */}
    <h1
      className="
        m-0 p-0
        text-2xl md:text-3xl font-bold tracking-tight
        bg-gradient-to-r
        from-purple-600 to-blue-600
        dark:from-blue-400 dark:to-purple-400
        bg-clip-text text-transparent
        leading-tight
      "
    >
      Welcome back,{" "}
      <span className="whitespace-nowrap">
        {user?.name?.split(" ")[0] || "User"}
      </span>
    </h1>

  </div>

  {/* Subtitle */}
  <p
    className={`
      m-0 mt-1
      text-sm md:text-base
      leading-normal
      ${isDark ? "text-slate-400" : "text-gray-600"}
    `}
  >
    Manage your dashboard & activities efficiently
  </p>
</div>


          <div className="ml-auto flex items-center gap-4">
            {/* Theme Toggle Enhanced */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg
                ${isDark 
                  ? "bg-slate-800/50 hover:bg-slate-700/50 shadow-slate-900/50" 
                  : "bg-gray-100 hover:bg-gray-200 shadow-gray-200/50"}`}
            >
              {isDark ? (
                <Sun size={20} className="text-yellow-400" />
              ) : (
                <Moon size={20} className="text-indigo-600" />
              )}
            </button>

            <button
              onClick={handleTestNotification}
              className={`relative p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg
                ${isDark 
                  ? "hover:bg-slate-800/80 shadow-slate-900/50" 
                  : "hover:bg-gray-100 shadow-gray-200/50"}`}
              title="Test notification popup"
            >
              <Sparkles size={20} className={isDark ? "text-slate-300" : "text-gray-700"} />
            </button>

            <button
              onClick={handleNotificationClick}
              className={`relative p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg
                ${isDark 
                  ? "hover:bg-slate-800/80 shadow-slate-900/50" 
                  : "hover:bg-gray-100 shadow-gray-200/50"}`}
            >
              <Bell size={22} className={isDark ? "text-slate-300" : "text-gray-700"} />
              {notificationCount > 0 && (
                <>
                  <span className="absolute top-2 right-2 h-3 w-3 bg-red-500 rounded-full animate-ping" />
                  <span className="absolute top-2 right-2 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{notificationCount}</span>
                  </span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400/20">
          <div className="mb-6">
            <Breadcrumb />
          </div>
          <div className={`rounded-2xl p-6 md:p-8 transition-all duration-500
            ${isDark 
              ? "bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 shadow-2xl shadow-slate-900/20" 
              : "bg-white backdrop-blur-sm border border-gray-200/50 shadow-2xl shadow-gray-200/20"}`}
          >
            <Outlet />
          </div>
        </div>

        {/* FOOTER */}
        <footer className={`py-4 px-6 border-t text-center text-sm transition-colors duration-500
          ${isDark 
            ? "border-slate-800/50 text-slate-500" 
            : "border-gray-200/50 text-gray-500"}`}
        >
          <p>© {new Date().getFullYear()} Activline Dashboard. All rights reserved.</p>
          <p className="text-xs mt-1">v2.0.0 • Enhanced with modern UI</p>
        </footer>
      </main>
    </div>
  );
};

export default MainLayout;
