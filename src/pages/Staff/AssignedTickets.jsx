
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
    sender: role === "CUSTOMER" ? "customer" : "agent"
  };
};

const AssignedTickets = () => {
  const { isDark } = useTheme();
  const { token } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
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

  const activeRoom = rooms.find((r) => r._id === activeRoomId);

  const ALLOWED_STATUS_TRANSITIONS = {
    OPEN: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    ASSIGNED: ["IN_PROGRESS", "RESOLVED", "CLOSED", "OPEN"],
    IN_PROGRESS: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
    RESOLVED: ["RESOLVED", "OPEN", "IN_PROGRESS", "CLOSED"],
    CLOSED: ["CLOSED"],
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
    if (!activeRoom) return;
    try {
      const updatedRoom = await updateTicketStatus(activeRoom._id, newStatus);
      setRooms((prev) =>
        prev.map((r) =>
          r._id === updatedRoom._id ? { ...r, status: updatedRoom.status } : r,
        ),
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
        const data = res.data.data || [];
        setRooms(data);
        if (data.length > 0 && !activeRoomId) {
          setActiveRoomId(data[0]._id);
        }
      })
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
  }, [token, activeRoomId]);

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

  // Load messages + socket
  useEffect(() => {
    if (!activeRoomId || !token) return;

    setMessages([]); 
    setLoadingMessages(true);

    api
      .get(`/api/chat/staff/messages/${activeRoomId}`)
      .then((res) => {
        const normalized = (res.data.data || []).map(normalizeMessageForChat);
        setMessages(sortMessagesByCreatedAt(normalized));
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));

    socket.auth = { token };
    if (!socket.connected) socket.connect();
    socket.emit("join-room", activeRoomId);

    const onNewMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return sortMessagesByCreatedAt([...prev, normalizeMessageForChat(msg)]);
      });
    };

    socket.on("new-message", onNewMessage);

    return () => {
      socket.off("new-message", onNewMessage);
    };
  }, [activeRoomId, token]);

  const sendMessage = (text) => {
    if (!text.trim() || !activeRoomId) return;
    socket.emit("send-message", {
      roomId: activeRoomId,
      message: text,
    });
  };

  const filteredRooms = useMemo(() => {
    let result = rooms.filter(
      (r) =>
        r.customer?.userName?.toLowerCase().includes(search.toLowerCase()) ||
        r._id?.toLowerCase().includes(search.toLowerCase()),
    );

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    return result;
  }, [rooms, search, statusFilter]);

  const getStatusStyles = (status) => {
    const base =
      "text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5 border transition-colors";

    if (isDark) {
      switch (status?.toUpperCase()) {
        case "OPEN":
          return `${base} bg-blue-900/30 text-blue-300 border-blue-700/50`;
        case "IN_PROGRESS":
          return `${base} bg-amber-900/30 text-amber-300 border-amber-700/50`;
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
        return `${base} bg-blue-100 text-blue-800 border-blue-300`;
      case "IN_PROGRESS":
        return `${base} bg-amber-100 text-amber-800 border-amber-300`;
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
    { key: "all", label: "All Tickets", count: rooms.length, icon: ListFilter },
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
        isDark
          ? "bg-gradient-to-br from-gray-950 via-gray-900 to-black"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
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
                {rooms.length}
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
            <div className="relative">
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
            </div>
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredRooms.length === 0 ? (
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
              filteredRooms.map((room) => (
                <div
                  key={room._id}
                  onClick={() => {
                    setActiveRoomId(room._id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`
                    group relative p-4 rounded-xl cursor-pointer transition-all duration-200
                    ${
                      activeRoomId === room._id
                        ? isDark
                          ? "bg-gradient-to-r from-blue-900/40 to-blue-800/20 border border-blue-700/50 shadow-lg"
                          : "bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-sm"
                        : isDark
                          ? "hover:bg-gray-800/60 border border-transparent"
                          : "hover:bg-gray-50 border border-transparent"
                    }
                  `}
                >
                  {activeRoomId === room._id && (
                    <div
                      className={`absolute -left-px top-0 bottom-0 w-1 rounded-r-full ${isDark ? "bg-blue-500" : "bg-blue-600"}`}
                    />
                  )}

                  <div className="flex items-start gap-3">
                    <div
                      className={`
                        flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-medium
                        ${activeRoomId === room._id ? "bg-blue-600" : isDark ? "bg-gray-700" : "bg-gray-300"}
                      `}
                    >
                      {(room.customer?.userName?.[0] || "?").toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={`font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {room.customer?.userName || "Unknown Customer"}
                        </h4>
                        {room.lastMessageAt && (
                          <span
                            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                          >
                            {new Date(room.lastMessageAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={getStatusStyles(room.status)}>
                          {getStatusIcon(room.status)}
                          {room.status?.toLowerCase() || "open"}
                        </span>
                        <span
                          className={`text-xs font-mono opacity-70 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                        >
                          #{room._id.slice(-6)}
                        </span>
                      </div>

                      {room.lastMessage && (
                        <p
                          className={`text-sm truncate ${isDark ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {room.lastMessage}
                        </p>
                      )}
                    </div>

                    {room.unreadCount > 0 && (
                      <span
                        className={`
                          flex-shrink-0 min-w-[1.5rem] h-6 px-2 rounded-full flex items-center justify-center text-xs font-bold
                          ${isDark ? "bg-blue-600 text-white" : "bg-blue-600 text-white"}
                        `}
                      >
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
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

          {activeRoom ? (
            loadingMessages ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="relative inline-flex">
                    <div className="w-14 h-14 border-4 border-blue-500/20 rounded-full animate-spin border-t-blue-500"></div>
                    <MessageSquare className="absolute inset-0 m-auto w-6 h-6 text-blue-500 animate-pulse" />
                  </div>
                  <p
                    className={`${isDark ? "text-gray-300" : "text-gray-700"} font-medium`}
                  >
                    Loading conversation...
                  </p>
                </div>
              </div>
            ) : (
              <Chat
                ticket={{
                  ticketId: activeRoom._id.slice(-6),
                  issue: activeRoom.issue || "Customer Support",
                  customerName: activeRoom.customer?.userName,
                  customerEmail: activeRoom.customer?.emailId,
                  customerPhone: activeRoom.customer?.phoneNumber,
                  status: activeRoom.status,
                  createdAt: activeRoom.createdAt,
                  _id: activeRoom._id,
                }}
                messages={messages}
                onSendMessage={sendMessage}
                showAssignment={false}
                showStatus={true}
                isDark={isDark}
                onStatusChange={handleStatusChange}
              />
            )
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
                    Select a conversation from the sidebar to start helping
                    customers
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isDark
                        ? "bg-gray-800 text-blue-300"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Open: {openCount}</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isDark
                        ? "bg-gray-800 text-amber-300"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
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
                      </div>
                    );
                  };
                  
                  export default AssignedTickets;