import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import Chat from "../../components/chat/Chat";
import api from "../../api/axios";
import { socket } from "../../socket/socket";
import {
  Search,
  User,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  Filter,
  X,
  ListFilter,
} from "lucide-react";
import {
  getOpenTickets,
  getInProgressTickets,
  getResolvedTickets,
} from "../../api/staffticket.api";
import { ChevronDown } from "lucide-react";

const getMessageTime = (message) => {
  const parsed = new Date(message?.createdAt).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const sortMessagesByCreatedAt = (list = []) =>
  [...list].sort((a, b) => getMessageTime(a) - getMessageTime(b));

const normalizeMessageForChat = (msg) => {
  const role = String(msg.senderRole || "").toUpperCase();
  return {
    ...msg,
    senderRole: role,
    sender: role === "CUSTOMER" ? "customer" : "agent",
  };
};

const AssignedTickets = () => {
  const { isDark } = useTheme();
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [activeTicketId, setActiveTicketId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [openCount, setOpenCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeUser = users.find((u) => u.customerId === activeUserId);
  const activeTicket =
    activeUser?.tickets?.find((t) => t._id === activeTicketId) ||
    activeUser?.tickets?.[0];

  const ALLOWED_STATUS_TRANSITIONS = {
    OPEN: ["OPEN", "IN_PROGRESS", "RESOLVED"],
    ASSIGNED: ["IN_PROGRESS", "RESOLVED", "OPEN"],
    IN_PROGRESS: ["IN_PROGRESS", "RESOLVED"],
    RESOLVED: ["RESOLVED", "OPEN", "IN_PROGRESS"],
  };

  const updateTicketStatus = async (roomId, status) => {
    try {
      const res = await api.patch("/api/chat/admin/status", { roomId, status });
      return res.data.data;
    } catch (err) {
      console.error("Status update failed:", err);
      throw err;
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeTicket) return;
    try {
      const updatedRoom = await updateTicketStatus(activeTicket._id, newStatus);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.tickets.some((t) => t._id === activeTicket._id)) {
            return {
              ...u,
              tickets: u.tickets.map((t) =>
                t._id === activeTicket._id
                  ? { ...t, status: updatedRoom.status }
                  : t,
              ),
            };
          }
          return u;
        }),
      );
    } catch {}
  };

  // Load assigned rooms
  useEffect(() => {
    if (!token) return;
    setLoadingRooms(true);

    api
      .get("/api/chat/staff/rooms")
      .then((res) => {
        const mapped = res.data.data || [];

        const groupedUsers = [];
        const userMap = new Map();

        mapped.forEach((r) => {
          const cid = r.customer?._id || r.customer?.userName || "unknown";
          if (!userMap.has(cid)) {
            userMap.set(cid, {
              customerId: cid,
              customerName: r.customer?.userName || "Unknown Customer",
              customerEmail: r.customer?.emailId,
              customerPhone: r.customer?.phoneNumber,
              latestTicketId: r._id.slice(-6).toUpperCase(),
              latestMessageTime: r.lastMessageAt || r.createdAt,
              unreadCount: 0,
              tickets: [],
            });
            groupedUsers.push(userMap.get(cid));
          }
          const u = userMap.get(cid);
          const t = {
            _id: r._id,
            ticketId: r._id.slice(-6).toUpperCase(),
            issue: r.issue || "Customer Support",
            status: r.status,
            createdAt: r.createdAt,
          };
          u.tickets.push(t);
          u.unreadCount += r.unreadCount || 0;
          if (
            new Date(r.lastMessageAt || 0) > new Date(u.latestMessageTime || 0)
          ) {
            u.latestMessageTime = r.lastMessageAt;
            u.latestTicketId = t.ticketId;
          }
        });

        groupedUsers.sort(
          (a, b) =>
            new Date(b.latestMessageTime || 0) -
            new Date(a.latestMessageTime || 0),
        );
        setUsers(groupedUsers);

        if (groupedUsers.length > 0 && !activeUserId) {
          setActiveUserId(groupedUsers[0].customerId);
        }
      })
      .catch(() => setUsers([]))
      .finally(() => setLoadingRooms(false));
  }, [token]);

  // Load ticket counts
  useEffect(() => {
    if (!token) return;

    Promise.all([
      getOpenTickets(),
      getInProgressTickets(),
      getResolvedTickets(),
    ])
      .then(([openRes, inProgressRes, resolvedRes]) => {
        setOpenCount(openRes.count || 0);
        setInProgressCount(inProgressRes.count || 0);
        setResolvedCount(resolvedRes.count || 0);
      })
      .catch((err) => {
        console.error("Staff stats error:", err);
        setOpenCount(0);
        setInProgressCount(0);
        setResolvedCount(0);
      });
  }, [token]);

  // SET DEFAULT ACTIVE TICKET
  useEffect(() => {
    if (activeUser && activeUser.tickets.length > 0) {
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

  // Load messages + socket
  useEffect(() => {
    if (!activeUser || !token) return;

    setMessages([]);
    setLoadingMessages(true);

    const fetchPromises = activeUser.tickets.map((t) =>
      api
        .get(`/api/chat/staff/messages/${t._id}`)
        .then((res) =>
          (res.data.data || []).map((msg) => ({
            ...normalizeMessageForChat(msg),
            roomId: t._id,
          })),
        )
        .catch(() => []),
    );

    Promise.all(fetchPromises)
      .then((results) => {
        const allMsgs = results.flat();
        setMessages(sortMessagesByCreatedAt(allMsgs));
      })
      .finally(() => {
        setLoadingMessages(false);
      });

    socket.auth = { token };
    if (!socket.connected) socket.connect();

    activeUser.tickets.forEach((t) => {
      socket.emit("join-room", t._id);
    });

    const onNewMessage = (msg) => {
      const normalized = normalizeMessageForChat(msg);
      // Ensure roomId is attached so Chat.jsx can group it and apply zig-zag backgrounds
      normalized.roomId = msg.roomId || activeTicketId;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return sortMessagesByCreatedAt([...prev, normalized]);
      });
    };

    socket.on("new-message", onNewMessage);

    return () => {
      socket.off("new-message", onNewMessage);
      activeUser.tickets.forEach((t) => {
        socket.emit("leave-room", t._id);
      });
    };
  }, [activeUser?.customerId, token]);

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

  const filteredUsers = useMemo(() => {
    let result = users.filter(
      (u) =>
        u.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        u.latestTicketId?.toLowerCase().includes(search.toLowerCase()),
    );

    if (statusFilter !== "all") {
      result = result.filter((u) =>
        u.tickets.some((t) => t.status === statusFilter),
      );
    }

    return result;
  }, [users, search, statusFilter]);

  const getStatusStyles = (status) => {
    const base =
      "text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5 border transition-colors";

    if (isDark) {
      switch (status?.toUpperCase()) {
        case "OPEN":
          return `${base} bg-amber-900/30 text-amber-300 border-amber-700/50`;
        case "IN_PROGRESS":
          return `${base} bg-blue-900/30 text-blue-300 border-blue-700/50`;
        case "RESOLVED":
          return `${base} bg-emerald-900/30 text-emerald-300 border-emerald-700/50`;
        case "CLOSED":
          return `${base} bg-gray-800 text-gray-400 border-gray-700`;
        default:
          return `${base} bg-gray-800 text-gray-400 border-gray-700`;
      }
    }

    switch (status?.toUpperCase()) {
      case "OPEN":
        return `${base} bg-amber-100 text-amber-800 border-amber-300`;
      case "IN_PROGRESS":
        return `${base} bg-blue-100 text-blue-800 border-blue-300`;
      case "RESOLVED":
        return `${base} bg-emerald-100 text-emerald-800 border-emerald-300`;
      case "CLOSED":
        return `${base} bg-gray-200 text-gray-700 border-gray-300`;
      default:
        return `${base} bg-gray-200 text-gray-700 border-gray-300`;
    }
  };

  const getStatusIcon = (status) => {
    const cls = "w-3.5 h-3.5";
    switch (status?.toUpperCase()) {
      case "OPEN":
        return <AlertCircle className={cls} />;
      case "IN_PROGRESS":
        return <Clock className={cls} />;
      case "RESOLVED":
        return <CheckCircle className={cls} />;
      default:
        return <MessageSquare className={cls} />;
    }
  };

  const statusFilters = [
    {
      key: "all",
      label: "All Tickets",
      count: users.reduce((acc, u) => acc + u.tickets.length, 0),
      icon: ListFilter,
    },
    { key: "OPEN", label: "Open", count: openCount, color: "blue" },
    {
      key: "IN_PROGRESS",
      label: "In Progress",
      count: inProgressCount,
      color: "amber",
    },
    {
      key: "RESOLVED",
      label: "Resolved",
      count: resolvedCount,
      color: "emerald",
    },
  ];

  if (loadingRooms) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative inline-flex">
            <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500"></div>
            <MessageSquare className="absolute inset-0 m-auto w-6 h-6 text-blue-500 animate-pulse" />
          </div>
          <p
            className={`text-lg font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Loading your assigned conversations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative h-[calc(100vh-120px)] overflow-hidden ${
        isDark ? "bg-gray-900" : "bg-white"
      }`}
    >
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl shadow-lg transition-all ${
          isDark
            ? "bg-gray-800/90 backdrop-blur-md text-white hover:bg-gray-700"
            : "bg-white/90 backdrop-blur-md text-gray-800 hover:bg-gray-100 shadow-md"
        }`}
      >
        {isSidebarOpen ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>

      <div className="flex h-full">
        {/* Sidebar */}
        <aside
          className={`
            absolute lg:static inset-y-0 left-0 z-40 w-80 lg:w-80
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            flex flex-col border-r shadow-xl
            ${isDark ? "bg-gray-900/95 border-gray-800 backdrop-blur-xl" : "bg-white/95 border-gray-200 backdrop-blur-xl"}
          `}
        >
          {/* Sidebar Header */}
          <div className="p-5 border-b flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2
                className={`text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Assigned Chats
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isDark
                    ? "bg-blue-600/20 text-blue-300"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {users.length}
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers or tickets..."
                className={`
                  w-full pl-11 pr-10 py-3 rounded-xl border text-sm
                  focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all
                  ${
                    isDark
                      ? "bg-gray-800/70 border-gray-700 text-white placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 shadow-sm"
                  }
                `}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Status Filter Dropdown */}
            {/* <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200 border
                  ${
                    isDark
                      ? "bg-gray-800/70 border-gray-700 text-gray-200 hover:bg-gray-700/80"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>
                    {statusFilter === "all"
                      ? "All Tickets"
                      : statusFilter.replace("_", " ")}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isFilterOpen && (
                <div
                  className={`
                    absolute z-50 mt-2 w-full rounded-xl shadow-2xl border overflow-hidden backdrop-blur-xl
                    ${isDark ? "bg-gray-900/95 border-gray-800" : "bg-white/95 border-gray-200"}
                  `}
                >
                  {statusFilters.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => {
                        setStatusFilter(f.key);
                        setIsFilterOpen(false);
                      }}
                      className={`
                        w-full px-4 py-3 text-left flex items-center justify-between text-sm transition-colors
                        ${
                          statusFilter === f.key
                            ? isDark
                              ? "bg-blue-600/20 text-blue-300"
                              : "bg-blue-50 text-blue-800"
                            : isDark
                              ? "hover:bg-gray-800/60 text-gray-300"
                              : "hover:bg-gray-50 text-gray-700"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        {f.icon && <f.icon className="w-4 h-4" />}
                        <span>{f.label}</span>
                      </div>
                      <span className="text-xs opacity-75 px-2 py-0.5 rounded-full bg-black/10">
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div> */}
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto premium-scrollbar p-3 space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <MessageSquare
                  className={`w-12 h-12 mb-4 ${isDark ? "text-gray-600" : "text-gray-400"}`}
                />
                <p
                  className={`text-lg font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  {search
                    ? "No matching conversations"
                    : "No assigned chats yet"}
                </p>
                <p
                  className={`mt-2 text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
                >
                  New tickets will appear here automatically
                </p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                // Show zig-zag when ALL tickets are RESOLVED (no active tickets)
                const allDone = u.tickets.every((t) =>
                  ["RESOLVED"].includes(t.status),
                );
                const isActive = activeUserId === u.customerId;
                const closedStyle = allDone
                  ? isActive
                    ? {
                        backgroundImage: isDark
                          ? `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(16, 185, 129, 0.15) 8px, rgba(16, 185, 129, 0.15) 16px)`
                          : `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(16, 185, 129, 0.18) 8px, rgba(16, 185, 129, 0.18) 16px)`,
                      }
                    : {
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
                    group relative p-4 rounded-xl cursor-pointer transition-all duration-200
                    ${
                      isActive
                        ? isDark
                          ? "bg-gradient-to-r from-blue-900/40 to-blue-800/20 border border-blue-700/50 shadow-lg"
                          : "bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-sm"
                        : isDark
                          ? "hover:bg-gray-800/60 border border-transparent"
                          : "hover:bg-gray-50 border border-transparent"
                    }
                  `}
                    style={closedStyle}
                  >
                    {activeUserId === u.customerId && (
                      <div
                        className={`absolute -left-px top-0 bottom-0 w-1 rounded-r-full ${isDark ? "bg-blue-500" : "bg-blue-600"}`}
                      />
                    )}

                    <div className="flex items-start gap-3">
                      <div
                        className={`
                        flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-medium
                        ${activeUserId === u.customerId ? "bg-blue-600" : isDark ? "bg-gray-700" : "bg-gray-300"}
                      `}
                      >
                        {(u.customerName?.[0] || "?").toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4
                            className={`font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}
                          >
                            {u.customerName || "Unknown Customer"}
                          </h4>
                          {u.latestMessageTime && (
                            <span
                              className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                            >
                              {new Date(u.latestMessageTime).toLocaleDateString(
                                [],
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-sm px-1.5 py-0.5 rounded-full ${isDark ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-700"} flex items-center gap-1`}
                          >
                            {u.tickets.length} Tickets
                          </span>
                          <span
                            className={`text-xs font-mono opacity-70 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                          >
                            Latest: #{u.latestTicketId}
                          </span>
                        </div>
                      </div>

                      {u.unreadCount > 0 && (
                        <span
                          className={`
                          flex-shrink-0 min-w-[1.5rem] h-6 px-2 rounded-full flex items-center justify-center text-xs font-bold
                          ${isDark ? "bg-blue-600 text-white" : "bg-blue-600 text-white"}
                        `}
                        >
                          {u.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col h-full">
          {/* Overlay for mobile when sidebar is open */}
          {isSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {activeUser ? (
            <Chat
              ticket={{
                ticketId: activeTicket?.ticketId,
                issue: activeTicket?.issue || "Customer Support",
                customerName: activeUser.customerName,
                customerEmail: activeUser.customerEmail,
                customerPhone: activeUser.customerPhone,
                status: activeTicket?.status,
                createdAt: activeTicket?.createdAt,
                _id: activeTicket?._id,
              }}
              userTickets={activeUser.tickets}
              onTicketSelect={(tId) => setActiveTicketId(tId)}
              messages={messages}
              onSendMessage={sendMessage}
              showAssignment={false}
              showStatus={true}
              isDark={isDark}
              onStatusChange={handleStatusChange}
              loading={loadingMessages}
              zigzagStatuses={["RESOLVED"]}
              selectableStatuses={["OPEN", "ASSIGNED", "IN_PROGRESS"]}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div
                className={`max-w-md w-full p-8 rounded-2xl text-center space-y-6 shadow-xl ${
                  isDark
                    ? "bg-gray-900/80 border border-gray-800"
                    : "bg-white/80 border border-gray-200"
                } backdrop-blur-xl`}
              >
                <MessageSquare
                  className={`w-16 h-16 mx-auto ${isDark ? "text-gray-600" : "text-gray-400"}`}
                />
                <div>
                  <h3
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    No Chat Selected
                  </h3>
                  <p
                    className={`mt-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Select a user from the sidebar to start helping
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isDark
                        ? "bg-gray-800 text-amber-300"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>Open: {openCount}</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isDark
                        ? "bg-gray-800 text-blue-300"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>In Progress: {inProgressCount}</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isDark
                        ? "bg-gray-800 text-emerald-300"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Resolved: {resolvedCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      {/* CSS Animations */}
      <style>{`
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

export default AssignedTickets;
