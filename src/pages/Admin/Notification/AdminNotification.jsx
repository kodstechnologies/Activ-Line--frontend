import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useTheme } from "../../../context/ThemeContext";
import Lottie from "lottie-react";
import emailAnimation from "../../../animations/Email.json";
import notificationAnimation from "../../../animations/Email.json";
import { Bell, Check, X, AlertTriangle, Trash2, Mail, MailOpen, Clock, Eye, Sparkles } from "lucide-react";
import {
  getNotificationsApi,
  markNotificationReadApi,
  deleteNotificationApi,
  deleteAllNotificationsApi,
  markAllNotificationsReadApi,
} from "../../../api/notification.api";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminNotifications() {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState("all");

  const normalizeNotifications = useCallback((data) => {
    return data.map((n) => ({
      ...n,
      unread: !n.isRead,
      icon: n.category === "ticket" ? Mail : Bell,
      time: new Date(n.createdAt).toLocaleString(),
      category: n.category || "system",
      description: n.message,
      title: n.title || "Notification",
    }));
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotificationsApi();
      setNotifications(normalizeNotifications(data));
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  }, [normalizeNotifications]);

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.reduce((count, n) => (!n.isRead ? count + 1 : count), 0),
    [notifications]
  );

  const readCount = useMemo(
    () => notifications.length - unreadCount,
    [notifications.length, unreadCount]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === "unread") return !n.isRead;
      if (filter === "read") return n.isRead;
      return true;
    });
  }, [notifications, filter]);

  const markAsRead = useCallback(async (id, e) => {
    if (e) e.stopPropagation();
    
    const notification = notifications.find((n) => n._id === id);
    if (!notification || notification.isRead) return;

    setProcessingIds(prev => new Set([...prev, id]));

    try {
      await markNotificationReadApi(id);
      
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, isRead: true, unread: false } : n
        )
      );
      
      if (selectedNotification?._id === id) {
        setSelectedNotification(prev => ({
          ...prev,
          isRead: true,
          unread: false
        }));
      }
    } catch (err) {
      console.error("Failed to mark read", err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [notifications, selectedNotification]);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (!unread.length) return;

    try {
      const unreadIds = unread.map(n => n._id);
      setProcessingIds(new Set(unreadIds));
      
      await markAllNotificationsReadApi(unread);

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, unread: false }))
      );
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setProcessingIds(new Set());
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id) => {
    setProcessingIds(prev => new Set([...prev, id]));

    try {
      await deleteNotificationApi(id);
      
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      
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
      setShowDeleteConfirm(null);
    }
  }, [selectedNotification]);

  const showDeleteConfirmation = useCallback((id, e) => {
    if (e) e.stopPropagation();
    setShowDeleteConfirm(id);
  }, []);

  const clearAll = useCallback(async () => {
    if (notifications.length === 0 || processingIds.size > 0) return;
    setShowClearConfirm(true);
  }, [notifications.length, processingIds.size]);

  const handleConfirmClearAll = useCallback(async () => {
    setShowClearConfirm(false);
    try {
      setProcessingIds(new Set(notifications.map(n => n._id)));
      await deleteAllNotificationsApi();
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications", err);
    } finally {
      setProcessingIds(new Set());
    }
  }, [notifications]);

  const handleNotificationClick = useCallback((notification) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
  }, [markAsRead]);

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

  return (
    <div className={`w-full min-h-screen relative overflow-hidden ${
      isDark 
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" 
        : "bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20"
    }`}>
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob ${
          isDark ? "bg-purple-500" : "bg-purple-400"
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 ${
          isDark ? "bg-yellow-500" : "bg-yellow-400"
        }`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 ${
          isDark ? "bg-pink-500" : "bg-pink-400"
        }`}></div>
      </div>

      <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full max-w-[1600px] mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="relative">
                <div className={`absolute -top-4 -left-4 w-20 h-20 rounded-full blur-2xl opacity-30 ${
                  isDark ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gradient-to-r from-blue-400 to-purple-400"
                }`}></div>
                <div className="relative flex items-center gap-4">
                  <div className="relative">
                    <div className={`absolute inset-0 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-2xl blur-xl`}></div>
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
                        ? "bg-gradient-to-r from-white via-emerald-400 to-blue-500 bg-clip-text text-transparent"
                        : "bg-gradient-to-r from-gray-900 via-emerald-600 to-blue-600 bg-clip-text text-transparent"
                    }`}>
                      Notifications
                    </h1>
                    <p className={`text-sm mt-1 ${isDark ? "text-white/60" : "text-gray-600"}`}>
                      {unreadCount} unread of {notifications.length} total notifications
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={processingIds.size > 0}
                    className="group relative overflow-hidden px-5 py-2.5 rounded-xl
                      bg-gradient-to-r from-emerald-500 to-teal-600
                      hover:from-emerald-600 hover:to-teal-700
                      text-white text-sm font-semibold transition-all duration-300
                      shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30
                      transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    <div className="relative flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Mark all read
                    </div>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    disabled={processingIds.size > 0}
                    className="group relative overflow-hidden px-5 py-2.5 rounded-xl
                      bg-gradient-to-r from-rose-500 to-red-600
                      hover:from-rose-600 hover:to-red-700
                      text-white text-sm font-semibold transition-all duration-300
                      shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30
                      transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    <div className="relative flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Clear all
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards - Glassmorphic */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 ${
              isDark 
                ? "bg-white/10 border border-white/20 hover:border-white/40" 
                : "bg-black/5 border border-gray-200/50 hover:border-gray-300/70"
            }`}>
              <div className={`absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-white/60" : "text-gray-600"}`}>Total</p>
                    <p className={`text-4xl font-bold mt-2 ${isDark ? "text-white" : "text-gray-900"}`}>{notifications.length}</p>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl backdrop-blur-sm flex items-center justify-center ${
                    isDark 
                      ? "bg-gradient-to-br from-white/20 to-white/5" 
                      : "bg-gradient-to-br from-gray-200/50 to-gray-100/50"
                  }`}>
                    <Bell className={`w-7 h-7 ${isDark ? "text-white/80" : "text-gray-700"}`} />
                  </div>
                </div>
              </div>
            </div>

            <div className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 ${
              isDark 
                ? "bg-white/10 border border-white/20 hover:border-white/40" 
                : "bg-black/5 border border-gray-200/50 hover:border-gray-300/70"
            }`}>
              <div className={`absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-emerald-300" : "text-emerald-600"}`}>Unread</p>
                    <p className={`text-4xl font-bold mt-2 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>{unreadCount}</p>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl backdrop-blur-sm flex items-center justify-center ${
                    isDark 
                      ? "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5" 
                      : "bg-gradient-to-br from-emerald-100/50 to-emerald-50/50"
                  }`}>
                    <Mail className={`w-7 h-7 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                  </div>
                </div>
              </div>
            </div>

            <div className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 ${
              isDark 
                ? "bg-white/10 border border-white/20 hover:border-white/40" 
                : "bg-black/5 border border-gray-200/50 hover:border-gray-300/70"
            }`}>
              <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-blue-300" : "text-blue-600"}`}>Read</p>
                    <p className={`text-4xl font-bold mt-2 ${isDark ? "text-blue-400" : "text-blue-700"}`}>{readCount}</p>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl backdrop-blur-sm flex items-center justify-center ${
                    isDark 
                      ? "bg-gradient-to-br from-blue-500/20 to-blue-500/5" 
                      : "bg-gradient-to-br from-blue-100/50 to-blue-50/50"
                  }`}>
                    <MailOpen className={`w-7 h-7 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-3 mb-6">
            {[
              { id: "all", label: "All", icon: Bell },
              { id: "unread", label: "Unread", icon: Mail, count: unreadCount },
              { id: "read", label: "Read", icon: Eye, count: readCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`relative px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300
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
          </div>

          {/* Main Content - Glassmorphic */}
          <div className={`rounded-2xl backdrop-blur-xl overflow-hidden ${
            isDark 
              ? "bg-white/5 border border-white/20" 
              : "bg-black/5 border border-gray-200/50"
          }`}>
            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-full border-4 ${
                      isDark ? "border-white/20" : "border-gray-200"
                    }`}></div>
                    <div className={`absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-t-emerald-400 animate-spin`}></div>
                    <Sparkles className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 animate-pulse ${
                      isDark ? "text-emerald-400" : "text-emerald-600"
                    }`} />
                  </div>
                  <p className={`mt-4 ${isDark ? "text-white/60" : "text-gray-600"}`}>
                    Loading notifications...
                  </p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <div className="relative">
                    <div className={`w-32 h-32 rounded-full backdrop-blur-sm flex items-center justify-center ${
                      isDark 
                        ? "bg-gradient-to-br from-white/10 to-white/5" 
                        : "bg-gradient-to-br from-gray-200/50 to-gray-100/50"
                    }`}>
                      <Lottie
                        animationData={emailAnimation}
                        loop
                        autoplay
                        className="w-32 h-32"
                      />
                    </div>
                  </div>
                  <h3 className={`mt-6 text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    No notifications found
                  </h3>
                  <p className={`mt-2 text-center ${isDark ? "text-white/60" : "text-gray-600"}`}>
                    You're all caught up! 🎉
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`group relative p-6 rounded-xl border cursor-pointer transition-all duration-500
                        hover:shadow-2xl hover:-translate-y-0.5
                        ${notification.unread
                          ? isDark
                            ? "bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/30 hover:border-emerald-500/50"
                            : "bg-gradient-to-r from-emerald-50/50 to-transparent border-emerald-500/30 hover:border-emerald-500/50"
                          : isDark
                            ? "bg-transparent border-white/10 hover:border-white/30"
                            : "bg-transparent border-gray-200/50 hover:border-gray-300/70"
                        }`}
                    >
                      {/* Animated Unread Indicator */}
                      {notification.unread && (
                        <>
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-l-xl"></div>
                          <div className="absolute -left-1 top-1/2 -translate-y-1/2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                          </div>
                        </>
                      )}

                      <div className="flex gap-5 items-start">
                        {/* Icon with Animation */}
                        <div className="relative flex-shrink-0">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                              notification.category === "ticket" 
                                ? "from-blue-500 to-indigo-600"
                                : "from-emerald-500 to-teal-600"
                            } flex items-center justify-center shadow-lg`}
                          >
                            <notification.icon className="w-7 h-7 text-white" />
                          </motion.div>
                          {notification.unread && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`font-semibold text-lg ${
                                  notification.unread 
                                    ? isDark ? "text-white" : "text-gray-900"
                                    : isDark ? "text-white/80" : "text-gray-900"
                                }`}>
                                  {notification.title}
                                </h3>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${
                                  isDark 
                                    ? "bg-white/10 text-white/80 border border-white/20"
                                    : "bg-gray-100 text-gray-700 border border-gray-200"
                                }`}>
                                  {notification.category}
                                </span>
                              </div>
                              <p className={`mt-1.5 font-medium ${
                                isDark ? "text-white/80" : "text-gray-900"
                              }`}>
                                {notification.message}
                              </p>
                              <p className={`mt-1 text-sm ${
                                isDark ? "text-white/50" : "text-gray-700"
                              }`}>
                                {notification.description}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                              <div className={`flex items-center gap-2 text-xs ${
                                isDark ? "text-white/40" : "text-gray-500"
                              }`}>
                                <Clock className="w-3 h-3" />
                                {getTimeAgo(notification.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className={`mt-4 pt-4 border-t flex items-center justify-end gap-3 ${
                        isDark ? 'border-white/10' : 'border-gray-200'
                      }`}>
                        {notification.unread && (
                          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium mr-auto">
                            Unread
                          </span>
                        )}

                        {notification.unread && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => markAsRead(notification._id, e)}
                            disabled={processingIds.has(notification._id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg 
                              transition-all disabled:opacity-50 backdrop-blur-sm
                              ${isDark
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                                : "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200"
                              }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            Mark as Read
                          </motion.button>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => showDeleteConfirmation(notification._id, e)}
                          disabled={processingIds.has(notification._id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg 
                            transition-all disabled:opacity-50 backdrop-blur-sm
                            ${isDark
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                              : "bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200"
                            }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                      selectedNotification.category === "ticket" 
                        ? "from-blue-500 to-indigo-600"
                        : "from-emerald-500 to-teal-600"
                    } flex items-center justify-center shadow-lg`}>
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
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedNotification(null)}
                    className={`p-2 rounded-full transition-colors ${
                      isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Modal Body */}
                <div className="mt-6 space-y-4">
                  <p className={`text-lg font-medium ${isDark ? "text-white/90" : "text-gray-900"}`}>
                    {selectedNotification.message}
                  </p>
                  <p className={`${isDark ? "text-white/60" : "text-gray-700"}`}>
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
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          markAsRead(selectedNotification._id);
                          setSelectedNotification(prev => ({
                            ...prev,
                            isRead: true,
                            unread: false
                          }));
                        }}
                        disabled={processingIds.has(selectedNotification._id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        Mark as Read
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowDeleteConfirm(selectedNotification._id)}
                      disabled={processingIds.has(selectedNotification._id)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-rose-500/25 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Single Notification Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`w-full max-w-md rounded-2xl backdrop-blur-2xl border shadow-2xl overflow-hidden
                ${isDark
                  ? "bg-white/10 border-white/20"
                  : "bg-white/90 border-gray-200"
                }`}
            >
              {/* Header */}
              <div className={`p-6 border-b flex items-center gap-4 ${isDark ? "border-white/10" : "border-gray-200"}`}>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`p-3 rounded-xl ${isDark ? "bg-rose-500/20" : "bg-rose-100"}`}
                >
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </motion.div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    Delete Notification
                  </h3>
                  <p className={`text-sm mt-1 ${isDark ? "text-white/60" : "text-gray-600"}`}>
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className={`${isDark ? "text-white/80" : "text-gray-700"}`}>
                  Are you sure you want to delete this notification? This will permanently remove it from your history.
                </p>
              </div>

              {/* Footer */}
              <div className={`p-4 flex justify-end gap-3 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => setShowDeleteConfirm(null)} 
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all backdrop-blur-sm
                    ${isDark 
                      ? "bg-white/10 text-white/80 hover:bg-white/20 border border-white/20" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 8px 20px -5px rgba(239, 68, 68, 0.4)" }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => deleteNotification(showDeleteConfirm)} 
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 shadow-lg shadow-rose-500/30 transition-all hover:shadow-rose-500/40"
                >
                  Yes, Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`w-full max-w-md rounded-2xl backdrop-blur-2xl border shadow-2xl overflow-hidden
                ${isDark
                  ? "bg-white/10 border-white/20"
                  : "bg-white/90 border-gray-200"
                }`}
            >
              {/* Header */}
              <div className={`p-6 border-b flex items-center gap-4 ${isDark ? "border-white/10" : "border-gray-200"}`}>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`p-3 rounded-xl ${isDark ? "bg-rose-500/20" : "bg-rose-100"}`}
                >
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </motion.div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    Confirm Deletion
                  </h3>
                  <p className={`text-sm mt-1 ${isDark ? "text-white/60" : "text-gray-600"}`}>
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className={`${isDark ? "text-white/80" : "text-gray-700"}`}>
                  Are you sure you want to delete all notifications? This will permanently remove all entries from your history.
                </p>
              </div>

              {/* Footer */}
              <div className={`p-4 flex justify-end gap-3 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => setShowClearConfirm(false)} 
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all backdrop-blur-sm
                    ${isDark 
                      ? "bg-white/10 text-white/80 hover:bg-white/20 border border-white/20" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 8px 20px -5px rgba(239, 68, 68, 0.4)" }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={handleConfirmClearAll} 
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 shadow-lg shadow-rose-500/30 transition-all hover:shadow-rose-500/40"
                >
                  Yes, Delete All
                </motion.button>
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
