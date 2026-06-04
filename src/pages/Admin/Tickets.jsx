import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import Chat from "../../components/chat/Chat";
import api from "../../api/axios";
import { getAssignedRoomsCount } from "../../api/tickets.api";

import { socket } from "../../socket/socket";
import {
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Inbox,
  Shield,
  Sparkles,
  X,
} from "lucide-react";

const ALLOWED_STATUS_TRANSITIONS = {
  OPEN: ["OPEN", "IN_PROGRESS", "RESOLVED"],
  ASSIGNED: ["IN_PROGRESS", "RESOLVED", "OPEN"],
  IN_PROGRESS: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["RESOLVED", "OPEN", "IN_PROGRESS"],
};

const Tickets = () => {
  const { isDark } = useTheme();
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [activeTicketId, setActiveTicketId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [filterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth >= 1024,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [assignedRoomCount, setAssignedRoomCount] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(12);

  const activeUser = users.find((u) => u.customerId === activeUserId);
  const activeTicket =
    activeUser?.tickets?.find((t) => t._id === activeTicketId) ||
    activeUser?.tickets?.[0];

  const [staffList, setStaffList] = useState([]);

  const loadStaff = async () => {
    try {
      const res = await api.get("/api/admin/staff");
      setStaffList(res.data.data || []);
    } catch (err) {
      console.error("Failed to load staff", err);
    }
  };

  /* ---------- LOAD ROOMS AND GROUP BY USER ---------- */
  const loadTickets = () => {
    if (!token) return;

    setRefreshing(true);

    api
      .get("api/chat/admin/rooms")
      .then((res) => {
        console.log(res);
        const mapped = res.data.data.map((r) => ({
          _id: r._id,
          ticketId: r._id.slice(-6).toUpperCase(),
          issue: "Customer Support Chat",
          customerId: r.customer?._id || r.customer?.userName || "unknown",
          customerName: r.customer?.userName || "Guest User",
          customerEmail: r.customer?.emailId,
          customerPhone: r.customer?.phoneNumber,
          status: r.status || "OPEN",
          assignedTo: r.assignedStaff?._id || null,
          lastMessage: r.lastMessage || "No messages yet",
          lastMessageTime: r.lastMessageAt,
          unreadCount: r.unreadCount || 0,
          createdAt: r.createdAt,
        }));

        // Group by Customer
        const groupedUsers = [];
        const userMap = new Map();

        mapped.forEach((t) => {
          const cid = t.customerId;
          if (!userMap.has(cid)) {
            userMap.set(cid, {
              customerId: cid,
              customerName: t.customerName,
              customerEmail: t.customerEmail,
              customerPhone: t.customerPhone,
              latestTicketId: t.ticketId,
              latestMessageTime: t.lastMessageTime || t.createdAt,
              unreadCount: 0,
              tickets: [],
            });
            groupedUsers.push(userMap.get(cid));
          }
          const u = userMap.get(cid);
          u.tickets.push(t);
          u.unreadCount += t.unreadCount;
          if (
            new Date(t.lastMessageTime || 0) >
            new Date(u.latestMessageTime || 0)
          ) {
            u.latestMessageTime = t.lastMessageTime;
            u.latestTicketId = t.ticketId;
          }
        });

        // Sort users by latestMessageTime
        groupedUsers.sort(
          (a, b) =>
            new Date(b.latestMessageTime || 0) -
            new Date(a.latestMessageTime || 0),
        );

        setUsers(groupedUsers);

        if (!activeUserId && groupedUsers.length) {
          setActiveUserId(groupedUsers[0].customerId);
        }
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  const assignStaff = async (roomId, staffId) => {
    try {
      const res = await api.post("/api/chat/admin/assign", {
        roomId,
        staffId,
      });

      setUsers((prev) =>
        prev.map((u) => {
          if (u.tickets.some((t) => t._id === roomId)) {
            return {
              ...u,
              tickets: u.tickets.map((t) =>
                t._id === roomId
                  ? {
                      ...t,
                      assignedTo: res.data.data.assignedStaff,
                      status: res.data.data.status,
                    }
                  : t,
              ),
            };
          }
          return u;
        }),
      );
    } catch (err) {
      console.error("❌ Assign staff failed", err.response?.data || err);
      throw err;
    }
  };

  const updateTicketStatus = async (roomId, status) => {
    try {
      const res = await api.patch("/api/chat/admin/status", {
        roomId,
        status,
      });

      setUsers((prev) =>
        prev.map((u) => {
          if (u.tickets.some((t) => t._id === roomId)) {
            return {
              ...u,
              tickets: u.tickets.map((t) =>
                t._id === roomId ? { ...t, status: res.data.data.status } : t,
              ),
            };
          }
          return u;
        }),
      );
    } catch (err) {
      console.error(
        "❌ Status update failed",
        err.response?.data || err.message,
      );
      throw err;
    }
  };

  useEffect(() => {
    loadTickets();
    loadStaff();
    getAssignedRoomsCount()
      .then((count) => setAssignedRoomCount(count))
      .catch(() => setAssignedRoomCount(0));
  }, [token]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ---------- LOAD ALL MESSAGES FOR ACTIVE USER + SOCKET ---------- */
  useEffect(() => {
    if (!activeUser || !token) return;

    setMessages([]);
    setLoadingMessages(true);

    const fetchPromises = activeUser.tickets.map((t) =>
      api
        .get(`api/chat/admin/messages/${t._id}`)
        .then((res) => res.data.data || [])
        .catch(() => []),
    );

    Promise.all(fetchPromises)
      .then((results) => {
        const allMsgs = results.flat();
        allMsgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setMessages(allMsgs);
      })
      .finally(() => {
        setLoadingMessages(false);
      });

    socket.auth = { token };

    if (!socket.connected && token) {
      socket.connect();
    }

    // Join all ticket rooms for the active user
    activeUser.tickets.forEach((t) => {
      socket.emit("join-room", t._id);
    });

    const handleNewMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );
      });
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
      activeUser.tickets.forEach((t) => {
        socket.emit("leave-room", t._id);
      });
    };
  }, [activeUser?.customerId, token]);

  /* ---------- SET DEFAULT ACTIVE TICKET FOR DROPDOWN ---------- */
  useEffect(() => {
    if (activeUser && activeUser.tickets.length > 0) {
      // Only auto-switch if current active ticket doesn't belong to this user
      if (!activeUser.tickets.some((t) => t._id === activeTicketId)) {
        const openTicket = activeUser.tickets.find((t) =>
          ["OPEN", "IN_PROGRESS"].includes(t.status),
        );
        setActiveTicketId(
          openTicket ? openTicket._id : activeUser.tickets[0]._id,
        );
      }
    }
  }, [activeUser, activeTicketId]);

  /* ---------- SEND MESSAGE ---------- */
  const sendMessage = ({ message, attachments }) => {
    if (
      (!message || !message.trim()) &&
      (!attachments || attachments.length === 0)
    )
      return;

    if (!activeTicket) return;

    socket.emit("send-message", {
      roomId: activeTicket._id,
      ticketId: activeTicket.ticketId,
      message,
      attachments,
    });
  };

  /* ---------- FILTER USERS ---------- */
  const filteredUsers = useMemo(() => {
    let result = users;

    if (filterStatus !== "All") {
      result = result.filter((u) =>
        u.tickets.some((t) => t.status === filterStatus),
      );
    }

    if (search) {
      result = result.filter(
        (u) =>
          u.customerName.toLowerCase().includes(search.toLowerCase()) ||
          u.latestTicketId.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return result;
  }, [users, filterStatus, search]);

  const userTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredUsers.length / userPageSize)),
    [filteredUsers.length, userPageSize],
  );

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  useEffect(() => {
    if (userPage > userTotalPages) setUserPage(1);
  }, [userPage, userTotalPages]);

  const stats = useMemo(() => {
    let total = 0,
      open = 0,
      resolved = 0,
      closed = 0;
    users.forEach((u) => {
      u.tickets.forEach((t) => {
        total++;
        if (t.status === "OPEN") open++;
        if (t.status === "RESOLVED") resolved++;
        if (t.status === "CLOSED") closed++;
      });
    });
    return { total, open, assigned: assignedRoomCount, resolved, closed };
  }, [users, assignedRoomCount]);

  /* ---------- STAFF WORKLOAD STATS ---------- */
  const staffStats = useMemo(() => {
    const statsMap = {};
    staffList.forEach((s) => {
      statsMap[s._id] = {
        totalActive: 0,
        assignedToday: 0,
        pendingPrevious: 0,
      };
    });

    const todayStr = new Date().toDateString();

    users.forEach((u) => {
      u.tickets.forEach((t) => {
        const staffId = t.assignedTo;
        if (staffId && statsMap[staffId]) {
          const isActive = ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(
            t.status,
          );
          const isToday = new Date(t.createdAt).toDateString() === todayStr;

          if (isActive) {
            statsMap[staffId].totalActive++;
          }
          if (isToday) {
            statsMap[staffId].assignedToday++;
          }
          if (isActive && !isToday) {
            statsMap[staffId].pendingPrevious++;
          }
        }
      });
    });

    return statsMap;
  }, [users, staffList]);

  if (!token) {
    return (
      <div className="h-[calc(100dvh-120px)] min-h-[420px] flex items-center justify-center px-4">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-medium">
            Unauthorized – Please login again
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative h-[calc(100dvh-7.5rem)] min-h-[520px] sm:h-[calc(100dvh-12rem)] md:h-[calc(100dvh-14rem)] overflow-hidden rounded-lg ${
        isDark ? "bg-gray-900" : "bg-white"
      }`}
    >
      <div className="flex h-full min-w-0">
        {/* ---------- SIDEBAR ---------- */}
        <div
          className={`
          absolute lg:relative z-40 h-full min-w-0
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          w-[min(100vw,24rem)] sm:w-96 lg:w-80 xl:w-96
          ${isDark ? "bg-gray-900" : "bg-white"}
          border-r flex flex-col shadow-2xl lg:shadow-none
          ${isDark ? "border-gray-800" : "border-gray-200"}
        `}
        >
          <div
            className={`p-2.5 sm:p-3 ${isDark ? "border-gray-800" : "border-gray-200"} border-b`}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${isDark ? "bg-blue-500/20" : "bg-blue-100"}`}
                >
                  <Inbox
                    className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                  />
                </div>
                <h2
                  className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Support Inbox
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={loadTickets}
                  disabled={refreshing}
                  className={`p-1.5 rounded-md transition-all duration-200 ${
                    isDark
                      ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  } ${refreshing ? "animate-spin" : ""}`}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className={`lg:hidden p-1.5 rounded-md transition-all duration-200 ${
                    isDark
                      ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                  title="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <div
                className={`text-center p-2 rounded-md ${isDark ? "bg-gray-800" : "bg-gray-50"}`}
              >
                <p
                  className={`text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Total
                </p>
                {loading ? (
                  <div
                    className={`h-5 w-8 mx-auto rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                  />
                ) : (
                  <p className="font-bold text-base sm:text-lg">
                    {stats.total}
                  </p>
                )}
              </div>
              <div
                className={`text-center p-2 rounded-md ${isDark ? "bg-amber-500/10" : "bg-amber-50"}`}
              >
                <p
                  className={`text-xs sm:text-sm ${isDark ? "text-amber-400" : "text-amber-600"}`}
                >
                  Open
                </p>
                {loading ? (
                  <div
                    className={`h-5 w-8 mx-auto rounded animate-pulse ${isDark ? "bg-amber-800/40" : "bg-amber-200"}`}
                  />
                ) : (
                  <p className="font-bold text-base sm:text-lg">{stats.open}</p>
                )}
              </div>
              <div
                className={`text-center p-2 rounded-md ${isDark ? "bg-blue-500/10" : "bg-blue-50"}`}
              >
                <p
                  className={`text-xs sm:text-sm ${isDark ? "text-blue-400" : "text-blue-600"}`}
                >
                  Assigned
                </p>
                {loading ? (
                  <div
                    className={`h-5 w-8 mx-auto rounded animate-pulse ${isDark ? "bg-blue-800/40" : "bg-blue-200"}`}
                  />
                ) : (
                  <p className="font-bold text-base sm:text-lg">
                    {stats.assigned}
                  </p>
                )}
              </div>
              <div
                className={`text-center p-2 rounded-md ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}
              >
                <p
                  className={`text-xs sm:text-sm ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                >
                  Resolved
                </p>
                {loading ? (
                  <div
                    className={`h-5 w-8 mx-auto rounded animate-pulse ${isDark ? "bg-emerald-800/40" : "bg-emerald-200"}`}
                  />
                ) : (
                  <p className="font-bold text-base sm:text-lg">
                    {stats.resolved}
                  </p>
                )}
              </div>
            </div>

            <div className="relative mb-2">
              <Search
                className={`absolute left-2.5 top-2.5 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Search users..."
                className={`pl-9 pr-3 py-2 w-full rounded-md border text-sm sm:text-base transition-all duration-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
                }`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto premium-scrollbar">
            {loading ? (
              <div className="p-2 space-y-2">
                {Array.from({ length: userPageSize }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg animate-pulse ${isDark ? "bg-gray-800/70" : "bg-gray-100"}`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                      />
                      <div className="flex-1 space-y-2">
                        <div
                          className={`h-3 rounded w-1/3 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                        />
                        <div
                          className={`h-2.5 rounded w-1/2 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                        />
                        <div
                          className={`h-2.5 rounded w-2/3 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <div
                  className={`p-3 rounded-lg mb-3 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
                >
                  <Inbox
                    className={`w-8 h-8 ${isDark ? "text-gray-600" : "text-gray-400"}`}
                  />
                </div>
                <p
                  className={`text-center text-lg mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {search ? "No matching users found" : "No users available"}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className={`text-base ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"}`}
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2">
                {paginatedUsers.map((u, index) => {
                  // Show zig-zag when ALL tickets are ASSIGNED or RESOLVED (no active tickets)
                  const allDone = u.tickets.every((t) =>
                    ["ASSIGNED", "RESOLVED"].includes(t.status),
                  );
                  const isActive = activeUserId === u.customerId;
                  const closedStyle = allDone
                    ? isActive
                      ? {
                          // Active + all-closed: stripes over blue active bg
                          backgroundImage: isDark
                            ? `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(16, 185, 129, 0.15) 8px, rgba(16, 185, 129, 0.15) 16px)`
                            : `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(16, 185, 129, 0.18) 8px, rgba(16, 185, 129, 0.18) 16px)`,
                        }
                      : {
                          // Idle + all-closed: green tint base + stripes
                          backgroundColor: isDark
                            ? "rgba(16, 185, 129, 0.06)"
                            : "rgba(209, 250, 229, 0.75)",
                          backgroundImage: isDark
                            ? `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(16, 185, 129, 0.12) 8px, rgba(16, 185, 129, 0.12) 16px)`
                            : `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(16, 185, 129, 0.20) 8px, rgba(16, 185, 129, 0.20) 16px)`,
                        }
                    : {};
                  return (
                    <div
                      key={u.customerId}
                      onClick={() => {
                        setActiveUserId(u.customerId);
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                      }}
                      className={`
                      relative p-3 rounded-lg cursor-pointer mb-2
                      transition-all duration-150 animate-fade-in-up
                      ${
                        isActive
                          ? isDark
                            ? "bg-gray-800 border-blue-500/50 border"
                            : "bg-blue-50 border-blue-300 border"
                          : isDark
                            ? "hover:bg-gray-800/50 border border-transparent hover:border-gray-700"
                            : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
                      }
                    `}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        ...closedStyle,
                      }}
                    >
                      {activeUserId === u.customerId && (
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1 rounded-r ${isDark ? "bg-blue-500" : "bg-blue-500"}`}
                        ></div>
                      )}

                      <div className="flex items-start gap-2 min-w-0">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                            activeUserId === u.customerId
                              ? isDark
                                ? "bg-blue-500"
                                : "bg-blue-500"
                              : isDark
                                ? "bg-gray-700"
                                : "bg-gray-200"
                          }`}
                        >
                          <User
                            className={`w-3.5 h-3.5 ${
                              activeUserId === u.customerId
                                ? "text-white"
                                : isDark
                                  ? "text-gray-400"
                                  : "text-gray-600"
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h3
                              className={`font-medium text-base truncate ${
                                activeUserId === u.customerId
                                  ? isDark
                                    ? "text-white"
                                    : "text-gray-900"
                                  : isDark
                                    ? "text-gray-200"
                                    : "text-gray-900"
                              }`}
                            >
                              {u.customerName}
                            </h3>
                            {u.latestMessageTime && (
                              <span
                                className={`flex-shrink-0 text-xs sm:text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}
                              >
                                {new Date(
                                  u.latestMessageTime,
                                ).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span
                              className={`text-xs sm:text-sm font-mono ${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
                              Latest: #{u.latestTicketId}
                            </span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded-full ${isDark ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-700"} flex items-center gap-1`}
                            >
                              {u.tickets.length} Tickets
                            </span>
                          </div>
                        </div>

                        {u.unreadCount > 0 && (
                          <span
                            className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold animate-pulse ${
                              isDark
                                ? "bg-blue-500 text-white"
                                : "bg-blue-500 text-white"
                            }`}
                          >
                            {u.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && filteredUsers.length > userPageSize && (
              <div
                className={`p-2 border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Per page
                    </span>
                    <select
                      value={userPageSize}
                      onChange={(e) => {
                        setUserPageSize(Number(e.target.value));
                        setUserPage(1);
                      }}
                      className={`text-xs rounded px-2 py-1 border ${
                        isDark
                          ? "bg-gray-800 border-gray-700 text-gray-200"
                          : "bg-white border-gray-300 text-gray-700"
                      }`}
                    >
                      <option value={12}>12</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      disabled={userPage === 1}
                      className={`p-1.5 rounded ${userPage === 1 ? "opacity-50 cursor-not-allowed" : ""} ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span
                      className={`text-xs px-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {userPage}/{userTotalPages}
                    </span>
                    <button
                      onClick={() =>
                        setUserPage((p) => Math.min(userTotalPages, p + 1))
                      }
                      disabled={userPage === userTotalPages}
                      className={`p-1.5 rounded ${userPage === userTotalPages ? "opacity-50 cursor-not-allowed" : ""} ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* ---------- CHAT AREA ---------- */}
        <div
          className={`flex-1 h-full min-w-0 flex flex-col ${isDark ? "bg-gray-900" : "bg-white"}`}
        >
          {isSidebarOpen && (
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
            />
          )}

          {activeUser ? (
            <div className="flex-1 min-h-0 overflow-hidden animate-fade-in">
              <Chat
                ticket={activeTicket}
                userTickets={activeUser.tickets}
                onTicketSelect={(tId) => setActiveTicketId(tId)}
                messages={messages}
                onSendMessage={sendMessage}
                showAssignment={true}
                staffList={staffList}
                staffStats={staffStats}
                showStatus={true}
                isDark={isDark}
                allowedStatuses={
                  ALLOWED_STATUS_TRANSITIONS[activeTicket?.status] || []
                }
                onAssigneeChange={(staffId) =>
                  assignStaff(activeTicket?._id, staffId)
                }
                onStatusChange={(status) =>
                  updateTicketStatus(activeTicket?._id, status)
                }
                customerEmail={activeUser.customerEmail}
                customerPhone={activeUser.customerPhone}
                createdAt={activeUser.tickets?.[0]?.createdAt}
                loading={loadingMessages}
                zigzagStatuses={["ASSIGNED", "RESOLVED"]}
                onBack={() => setIsSidebarOpen(true)}
              />
            </div>
          ) : loading ? (
            <div className="flex-1 p-4 space-y-3 animate-pulse">
              <div
                className={`h-12 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
              />
              <div
                className={`h-24 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
              />
              <div
                className={`h-24 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
              />
              <div
                className={`h-24 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 animate-fade-in">
              <div
                className={`max-w-sm p-6 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-50"}`}
              >
                <div
                  className={`w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
                >
                  <Sparkles
                    className={`w-8 h-8 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                  />
                </div>
                <h3
                  className={`text-2xl font-bold mb-2 text-center ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Admin Support Dashboard
                </h3>
                <p
                  className={`text-lg text-center mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Select a user to start managing customer support
                </p>
                <div className="flex items-center justify-center gap-3 text-base">
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    <span>Open: {stats.open}</span>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span>Assigned: {stats.assigned}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fade-in-up 0.3s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .premium-scrollbar { scrollbar-width: thin; }
        .premium-scrollbar::-webkit-scrollbar { width: 6px; }
        .premium-scrollbar::-webkit-scrollbar-track {
          background: transparent !important;
          background-color: transparent !important;
        }
        .premium-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? "#4b5563" : "#d1d5db"};
          border-radius: 3px;
        }
        .premium-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? "#6b7280" : "#9ca3af"};
        }
      `}</style>
    </div>
  );
};

export default Tickets;
