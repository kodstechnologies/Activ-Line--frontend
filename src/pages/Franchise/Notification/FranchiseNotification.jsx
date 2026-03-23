import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Bell, Ticket, AlertCircle, Check, Trash2, CheckCheck, Mail, MailOpen, X, Clock, Eye, AlertTriangle } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import Lottie from "lottie-react";
import { motion, AnimatePresence } from "framer-motion";
import emailAnimation from "../../../animations/Email.json";
import notificationAnimation from "../../../animations/Email.json";
import {
  getFranchiseNotifications,
  markFranchiseNotificationRead,
  markAllFranchiseNotificationsRead,
  deleteFranchiseNotification,
  deleteAllFranchiseNotifications,
} from "../../../api/franchisenotification.api";

export default function FranchiseNotifications() {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [processingIds, setProcessingIds] = useState(new Set());

  // Memoized calculations
  const unreadCount = useMemo(() => notifications.filter(n => n.unread).length, [notifications]);
  const readCount = useMemo(() => notifications.length - unreadCount, [notifications.length, unreadCount]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filter === "unread") return n.unread;
      if (filter === "read") return !n.unread;
      return true;
    });
  }, [notifications, filter]);

  const normalizeNotifications = useCallback((data) => {
    return data.map((n) => ({
      ...n,
      unread: !n.isRead,
      icon: n.category === "ticket" ? Ticket : AlertCircle,
      time: new Date(n.createdAt).toLocaleString(),
      title: n.title || "Notification",
      message: n.message || n.body || "",
      description: n.description || n.category || "",
    }));
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFranchiseNotifications();
      setNotifications(normalizeNotifications(data));
    } catch (err) {
      console.error("Failed to load franchise notifications", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [normalizeNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    if (processingIds.has(id)) return;
    
    const target = notifications.find((n) => n._id === id);
    if (!target || !target.unread) return;

    setProcessingIds(prev => new Set([...prev, id]));
    try {
      await markFranchiseNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, unread: false, isRead: true } : n
        )
      );
      if (selectedNotification?._id === id) {
        setSelectedNotification(prev => ({ ...prev, unread: false, isRead: true }));
      }
    } catch (err) {
      console.error("Failed to mark franchise notification read", err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [notifications, processingIds, selectedNotification]);

  const markAllAsRead = useCallback(async () => {
    const hasUnread = notifications.some((n) => n.unread);
    if (!hasUnread) return;

    setProcessingIds(new Set(notifications.filter(n => n.unread).map(n => n._id)));
    try {
      await markAllFranchiseNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, unread: false, isRead: true }))
      );
    } catch (err) {
      console.error("Failed to mark all franchise notifications read", err);
    } finally {
      setProcessingIds(new Set());
    }
  }, [notifications]);

  const deleteOne = useCallback(async (id, e) => {
    e?.stopPropagation();
    if (processingIds.has(id)) return;
    
    setProcessingIds(prev => new Set([...prev, id]));
    try {
      await deleteFranchiseNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (selectedNotification?._id === id) {
        setSelectedNotification(null);
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [processingIds, selectedNotification]);

  const deleteAll = useCallback(async () => {
    setProcessingIds(new Set(notifications.map(n => n._id)));
    try {
      await deleteAllFranchiseNotifications();
      setNotifications([]);
      setShowDeleteConfirm(false);
      setSelectedNotification(null);
    } catch (err) {
      console.error("Failed to delete all notifications", err);
    } finally {
      setProcessingIds(new Set());
    }
  }, [notifications]);

  const getTimeAgo = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  const getIconGradient = useCallback((category) => {
    if (category === 'ticket') {
      return "from-blue-500 via-blue-600 to-indigo-600";
    }
    return "from-purple-500 via-purple-600 to-pink-600";
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
      },
    },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <div className={`w-full min-h-screen relative overflow-hidden ${
      isDark 
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" 
        : "bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/20"
    }`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob ${
          isDark ? "bg-purple-500" : "bg-purple-400"
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 ${
          isDark ? "bg-pink-500" : "bg-pink-400"
        }`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 ${
          isDark ? "bg-indigo-500" : "bg-indigo-400"
        }`}></div>
      </div>

      {/* Main Content */}
      <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full max-w-[1600px] mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="relative">
                <div className={`absolute -top-4 -left-4 w-20 h-20 rounded-full blur-2xl opacity-30 ${
                  isDark ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gradient-to-r from-purple-400 to-pink-400"
                }`}></div>
                <div className="relative flex items-center gap-4">
                  <div className="relative">
                    <div className={`absolute inset-0 ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'} rounded-2xl blur-xl`}></div>
                    <div className={`relative p-3 rounded-2xl backdrop-blur-xl ${
                      isDark ? 'bg-white/10 border border-white/20' : 'bg-white/30 border border-white/50'
                    }`}>
                      <Lottie
                        animationData={notificationAnimation}
                        loop
                        autoplay
                        className="w-12 h-12"
                      />
                    </div>
                  </div>
                  <div>
                    <h1 className={`text-4xl lg:text-5xl font-black tracking-tight ${
                      isDark 
                        ? "bg-gradient-to-r from-white via-purple-400 to-pink-500 bg-clip-text text-transparent"
                        : "bg-gradient-to-r from-gray-900 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                    }`}>
                      Franchise Notifications
                    </h1>
                    <p className={`text-sm mt-2 ${isDark ? "text-white/60" : "text-gray-600"}`}>
                      Updates related to your franchise area
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="group relative overflow-hidden px-5 py-2.5 rounded-xl
                      bg-gradient-to-r from-purple-500 to-pink-600
                      hover:from-purple-600 hover:to-pink-700
                      text-white text-sm font-semibold transition-all duration-300
                      shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30
                      transform hover:-translate-y-0.5"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    <div className="relative flex items-center gap-2">
                      <CheckCheck className="w-4 h-4" />
                      Mark all read
                    </div>
                  </button>
                )}

                {notifications.length > 0 && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="group relative overflow-hidden px-5 py-2.5 rounded-xl
                      bg-gradient-to-r from-rose-500 to-red-600
                      hover:from-rose-600 hover:to-red-700
                      text-white text-sm font-semibold transition-all duration-300
                      shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30
                      transform hover:-translate-y-0.5"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    <div className="relative flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Clear all
                    </div>
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8"
          >
            {[
              { label: "Total", value: notifications.length, icon: Bell, color: "slate" },
              { label: "Unread", value: unreadCount, icon: Mail, color: "purple" },
              { label: "Read", value: readCount, icon: MailOpen, color: "pink" },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? "bg-white/10 border border-white/20 hover:border-white/40" 
                    : "bg-black/5 border border-gray-200/50 hover:border-gray-300/70"
                }`}
              >
                <div className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDark ? "text-white/60" : "text-gray-600"}`}>
                        {stat.label}
                      </p>
                      <p className={`text-4xl font-bold mt-2 ${
                        stat.label === "Unread" 
                          ? isDark ? "text-purple-400" : "text-purple-700"
                          : stat.label === "Read"
                          ? isDark ? "text-pink-400" : "text-pink-700"
                          : isDark ? "text-white" : "text-gray-900"
                      }`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-14 h-14 rounded-2xl backdrop-blur-sm flex items-center justify-center ${
                      isDark 
                        ? `bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-500/5` 
                        : `bg-gradient-to-br from-${stat.color}-100/50 to-${stat.color}-50/50`
                    }`}>
                      <stat.icon className={`w-7 h-7 ${
                        stat.label === "Unread" 
                          ? isDark ? "text-purple-400" : "text-purple-600"
                          : stat.label === "Read"
                          ? isDark ? "text-pink-400" : "text-pink-600"
                          : isDark ? "text-white/80" : "text-gray-700"
                      }`} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3 mb-6 overflow-x-auto pb-2"
          >
            {[
              { id: "all", label: "All", icon: Bell },
              { id: "unread", label: "Unread", icon: Mail, count: unreadCount },
              { id: "read", label: "Read", icon: Eye, count: readCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap
                  ${filter === tab.id
                    ? isDark
                      ? "bg-gradient-to-r from-white/20 to-white/10 text-white shadow-lg"
                      : "bg-gradient-to-r from-gray-200/80 to-gray-100/80 text-gray-900 shadow-lg"
                    : isDark
                      ? "backdrop-blur-sm bg-white/5 text-white/60 hover:bg-white/10"
                      : "backdrop-blur-sm bg-black/5 text-gray-600 hover:bg-black/10"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      filter === tab.id
                        ? isDark
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-800"
                        : isDark
                          ? "bg-white/10 text-white/80"
                          : "bg-gray-200 text-gray-700"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </motion.div>

          {/* Notification List */}
          <div className={`rounded-2xl backdrop-blur-xl overflow-hidden ${
            isDark 
              ? "bg-white/5 border border-white/20" 
              : "bg-black/5 border border-gray-200/50"
          }`}>
            <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-32"
                  >
                    <div className="relative w-32 h-32">
                      <Lottie
                        animationData={emailAnimation}
                        loop
                        autoplay
                        className="w-32 h-32"
                      />
                    </div>
                    <p className={`mt-4 ${isDark ? "text-white/60" : "text-gray-600"}`}>
                      Loading notifications...
                    </p>
                  </motion.div>
                ) : filteredNotifications.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-32"
                  >
                    <div className="relative w-48 h-48">
                      <Lottie
                        animationData={emailAnimation}
                        loop
                        autoplay
                        className="w-48 h-48"
                      />
                    </div>
                    <h3 className={`text-2xl font-bold mt-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                      All caught up!
                    </h3>
                    <p className={`mt-2 text-center ${isDark ? "text-white/60" : "text-gray-600"}`}>
                      No franchise notifications at the moment
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={`divide-y ${isDark ? "divide-white/10" : "divide-gray-200"}`}
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredNotifications.map((n) => (
                        <motion.div
                          key={n._id}
                          variants={itemVariants}
                          layout
                          onClick={() => {
                            setSelectedNotification(n);
                            if (n.unread) markAsRead(n._id);
                          }}
                          className={`group relative p-6 transition-all duration-300 cursor-pointer
                            hover:backdrop-blur-2xl ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}
                            ${n.unread ? (isDark ? "bg-gradient-to-r from-purple-500/5 to-transparent" : "bg-gradient-to-r from-purple-50/50 to-transparent") : ""}`}
                        >
                          {/* Unread Indicator */}
                          {n.unread && (
                            <>
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-pink-500 rounded-l-xl"></div>
                              <div className="absolute -left-1 top-1/2 -translate-y-1/2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                              </div>
                            </>
                          )}

                          <div className="flex items-start gap-5">
                            {/* Icon */}
                            <div className="relative flex-shrink-0">
                              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getIconGradient(n.category)} 
                                flex items-center justify-center shadow-2xl transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                                <n.icon className="w-8 h-8 text-white" />
                              </div>
                              {n.unread && (
                                <>
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-400 rounded-full border-2 border-white/20 animate-ping"></div>
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full border-2 border-white"></div>
                                </>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex-1">
                                  <h3 className={`text-lg font-semibold ${
                                    n.unread 
                                      ? isDark ? "text-white" : "text-gray-900"
                                      : isDark ? "text-white/80" : "text-gray-700"
                                  }`}>
                                    {n.title}
                                  </h3>
                                  <p className={`mt-1 text-sm ${isDark ? "text-white/60" : "text-gray-600"}`}>
                                    {n.message}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                  <div className={`flex items-center gap-2 text-xs ${isDark ? "text-white/40" : "text-gray-500"}`}>
                                    <Clock className="w-3 h-3" />
                                    {getTimeAgo(n.createdAt)}
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    {n.unread && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markAsRead(n._id);
                                        }}
                                        disabled={processingIds.has(n._id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold
                                          backdrop-blur-sm transition-all duration-200 border
                                          ${isDark
                                            ? "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30"
                                            : "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
                                          } disabled:opacity-50`}
                                      >
                                        <Check className="w-3 h-3 inline mr-1" />
                                        Read
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteOne(n._id, e);
                                      }}
                                      disabled={processingIds.has(n._id)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold
                                        backdrop-blur-sm transition-all duration-200 border
                                        ${isDark
                                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30"
                                          : "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200"
                                        } disabled:opacity-50`}
                                      >
                                        <Trash2 className="w-3 h-3 inline mr-1" />
                                        Delete
                                      </button>
                                  </div>
                                </div>
                              </div>

                              {n.description && (
                                <p className={`mt-2 text-sm line-clamp-2 ${isDark ? "text-white/50" : "text-gray-500"}`}>
                                  {n.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className={`p-4 border-t backdrop-blur-sm ${isDark ? "border-white/10" : "border-gray-200"}`}>
                <p className={`text-xs text-center ${isDark ? "text-white/40" : "text-gray-500"}`}>
                  Showing {filteredNotifications.length} of {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`relative w-full max-w-2xl rounded-2xl backdrop-blur-2xl border shadow-2xl overflow-hidden
                ${isDark 
                  ? "bg-white/10 border-white/20" 
                  : "bg-white/90 border-gray-200"
                }`}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getIconGradient(selectedNotification.category)} 
                      flex items-center justify-center shadow-lg`}>
                      <selectedNotification.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {selectedNotification.title}
                      </h2>
                      <div className={`flex items-center gap-2 mt-1 text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(selectedNotification.createdAt)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className={`p-2 rounded-full transition-colors ${
                      isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                    }`}
                  >
                    <X className={`w-5 h-5 ${isDark ? "text-white/60" : "text-gray-600"}`} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="mt-6 space-y-4">
                  <p className={`text-lg font-medium ${isDark ? "text-white/90" : "text-gray-800"}`}>
                    {selectedNotification.message}
                  </p>
                  <p className={`${isDark ? "text-white/60" : "text-gray-600"}`}>
                    {selectedNotification.description}
                  </p>

                  {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                    <div className={`p-4 rounded-lg backdrop-blur-sm ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                      <h4 className={`font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                        Additional Data
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        {Object.entries(selectedNotification.data).map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className={`text-xs uppercase ${isDark ? "text-white/40" : "text-gray-500"}`}>
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className={`font-medium mt-0.5 ${isDark ? "text-white/80" : "text-gray-700"}`}>
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons in Modal */}
                  <div className="flex gap-3 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}">
                    {selectedNotification.unread && (
                      <button
                        onClick={() => {
                          markAsRead(selectedNotification._id);
                          setSelectedNotification(prev => ({
                            ...prev,
                            unread: false,
                            isRead: true
                          }));
                        }}
                        disabled={processingIds.has(selectedNotification._id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => {
                        deleteOne(selectedNotification._id);
                        setSelectedNotification(null);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-rose-500/25"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete All Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`max-w-md w-full rounded-2xl backdrop-blur-2xl border shadow-2xl p-6 ${
                isDark 
                  ? "bg-white/10 border-white/20" 
                  : "bg-white/90 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${isDark ? "bg-rose-500/20" : "bg-rose-100"}`}>
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    Clear all notifications?
                  </h3>
                  <p className={`text-sm mt-1 ${isDark ? "text-white/60" : "text-gray-600"}`}>
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <p className={`mb-6 ${isDark ? "text-white/60" : "text-gray-600"}`}>
                All {notifications.length} notifications will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all
                    backdrop-blur-sm border
                    ${isDark
                      ? "bg-white/10 text-white hover:bg-white/20 border-white/20"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAll}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold
                    bg-gradient-to-r from-rose-500 to-red-600
                    hover:from-rose-600 hover:to-red-700
                    text-white transition-all shadow-lg shadow-rose-500/25"
                >
                  Delete all
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}