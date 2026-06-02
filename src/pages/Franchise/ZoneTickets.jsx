import { useState, useEffect, useRef, useMemo } from "react";
import {
  Send,
  Menu,
  Paperclip,
  Search,
  Inbox,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  Filter,
  RefreshCw,
  MessageSquare,
  User,
  FileText,
  Image as ImageIcon,
  Download,
  Tag,
  Calendar,
  ListFilter,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { socket } from "../../socket/socket";
import {
  getTicketRooms,
  getRoomMessages,
  updateTicketStatus,
} from "../../api/frenchise/franchiseTicketApi";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED"];

const normalizeTicketStatus = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "ASSIGNED") return "IN_PROGRESS";
  return normalized;
};

const getStatusColor = (status, isDark) => {
  const map = {
    OPEN: isDark
      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
      : "bg-amber-100 text-amber-700 border border-amber-200",
    IN_PROGRESS: isDark
      ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
      : "bg-blue-100 text-blue-700 border border-blue-200",
    RESOLVED: isDark
      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
      : "bg-emerald-100 text-emerald-700 border border-emerald-200",
    CLOSED: isDark
      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
      : "bg-emerald-100 text-emerald-700 border border-emerald-200",
  };
  return (
    map[status] ||
    (isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700")
  );
};

const getStatusIcon = (status) => {
  switch (status) {
    case "OPEN":
      return <AlertCircle className="w-3 h-3" />;
    case "IN_PROGRESS":
      return <Clock className="w-3 h-3" />;
    case "RESOLVED":
      return <CheckCircle className="w-3 h-3" />;
    case "CLOSED":
      return <XCircle className="w-3 h-3" />;
    default:
      return <MessageSquare className="w-3 h-3" />;
  }
};

const isImageAttachment = (messageType, mimeType, fileUrl = "") => {
  const normalizedType = String(messageType || "").toUpperCase();
  const normalizedMime = String(mimeType || "").toLowerCase();
  const normalizedUrl = String(fileUrl || "").toLowerCase();

  if (normalizedType === "IMAGE") return true;
  if (normalizedMime.startsWith("image/")) return true;

  return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"].some(
    (ext) => normalizedUrl.includes(ext),
  );
};

const toMessageType = (file) => {
  if (!file?.type) return "FILE";
  return file.type.startsWith("image/") ? "IMAGE" : "FILE";
};

const downloadFile = (file) => {
  if (!file?.url) return;
  const downloadUrl = file.url.includes("/upload/")
    ? file.url.replace("/upload/", "/upload/fl_attachment/")
    : file.url;
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = file.name || "attachment";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

const getMessageTime = (message) => {
  const parsed = new Date(message?.createdAt).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const sortMessagesByCreatedAt = (list = []) =>
  [...list].sort((a, b) => getMessageTime(a) - getMessageTime(b));

const normalizeMessage = (m) => {
  const attachments = Array.isArray(m?.attachments)
    ? m.attachments.map((a) => ({
        url: a.url || a.file || a.fileUrl,
        name: a.name || a.fileName || "Attachment",
        type: a.mimeType || a.type || "",
        messageType: a.type || a.messageType,
      }))
    : [];

  if (attachments.length === 0 && (m?.file || m?.fileUrl)) {
    attachments.push({
      url: m.file || m.fileUrl,
      name: m.fileName || "Attachment",
      type: m.mimeType || m.type || "",
      messageType: m.messageType || m.type || "FILE",
    });
  }

  const role = String(m.senderRole || "").toUpperCase();
  const isCustomer = role === "CUSTOMER";

  return {
    id:
      m._id ||
      m.id ||
      `${m.createdAt || ""}-${m.senderRole || ""}-${m.message || ""}`,
    roomId: m.roomId || m.ticketId || m.room?._id, // Add roomId to group
    sender: isCustomer ? "customer" : "agent",
    senderRole: role,
    text: m.message || "",
    attachments,
    time: new Date(m.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    createdAt: m.createdAt,
  };
};

const ZoneTickets = () => {
  const { isDark } = useTheme();
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  const fileRef = useRef();
  const messageEndRef = useRef();

  const activeUser = users.find((u) => u.customerId === activeUserId);
  const activeTicket =
    activeUser?.tickets?.find((t) => t.id === activeTicketId) ||
    activeUser?.tickets?.[0];
  const activeChatStatus =
    normalizeTicketStatus(activeTicket?.status) || "OPEN";

  // Group messages
  const orderedMessageGroups = useMemo(() => {
    const groups = {};
    messages.forEach((m) => {
      const key = m.roomId || "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });

    const nonActiveGroups = Object.keys(groups)
      .filter((id) => id !== activeTicket?.id)
      .map((id) => ({
        roomId: id,
        messages: groups[id].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        ),
      }));
    nonActiveGroups.sort(
      (a, b) =>
        new Date(a.messages[0].createdAt) - new Date(b.messages[0].createdAt),
    );

    const result = [...nonActiveGroups];
    if (activeTicket?.id && groups[activeTicket.id]) {
      result.push({
        roomId: activeTicket.id,
        messages: groups[activeTicket.id].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        ),
      });
    }
    return result;
  }, [messages, activeTicket?.id]);

  // Load rooms
  useEffect(() => {
    loadRooms();
  }, []);

  // Click outside handler for filter
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".filter-container")) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Auto scroll
  useEffect(() => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  }, [messages, activeTicket?.id]);

  const loadRooms = async () => {
    try {
      setRefreshing(true);
      const res = await getTicketRooms(1, 20);

      const mapped = res.data || [];
      const groupedUsers = [];
      const userMap = new Map();

      mapped.forEach((r) => {
        const cid = r.customer?._id || r.customer?.userName || "unknown";
        if (!userMap.has(cid)) {
          userMap.set(cid, {
            customerId: cid,
            name:
              `${r.customer?.firstName || ""} ${r.customer?.lastName || ""}`.trim() ||
              r.customer?.userName,
            latestTicketId: r._id.slice(-6).toUpperCase(),
            latestMessageTime: r.lastMessageAt || r.createdAt,
            unreadCount: 0,
            tickets: [],
          });
          groupedUsers.push(userMap.get(cid));
        }
        const u = userMap.get(cid);
        const t = {
          id: r._id,
          ticketId: r._id.slice(-6).toUpperCase(),
          status: normalizeTicketStatus(r.status),
          lastMsg: r.lastMessage || "No messages yet",
          time: r.lastMessageAt || r.createdAt,
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

      if (groupedUsers.length && !activeUserId) {
        setActiveUserId(groupedUsers[0].customerId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRooms(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeUser && activeUser.tickets.length > 0) {
      if (!activeUser.tickets.some((t) => t.id === activeTicketId)) {
        const openTicket = activeUser.tickets.find((t) =>
          ["OPEN", "IN_PROGRESS"].includes(t.status),
        );
        setActiveTicketId(
          openTicket ? openTicket.id : activeUser.tickets[0].id,
        );
      }
    }
  }, [activeUser, activeTicketId]);

  useEffect(() => {
    if (!activeUser || !token) return;

    setLoadingMessages(true);
    setMessages([]);

    const fetchPromises = activeUser.tickets.map((t) =>
      getRoomMessages(t.id)
        .then((res) => {
          const msgs = (res?.data?.data || res?.data || []).map((m) => ({
            ...normalizeMessage(m),
            roomId: t.id,
          }));
          return msgs;
        })
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
      socket.emit("join-room", t.id);
    });

    const onNewMessage = (msg) => {
      const normalized = normalizeMessage(msg);
      // Ensure we attach the roomId to group it correctly
      normalized.roomId =
        msg.roomId ||
        msg.ticketId ||
        activeUser.tickets.find((t) => t.id === msg.roomId)?.id ||
        activeTicketId;

      setMessages((prev) => {
        if (prev.some((m) => m.id === normalized.id)) return prev;
        return sortMessagesByCreatedAt([...prev, normalized]);
      });

      // Update sidebar latest msg
      setUsers((prev) =>
        prev.map((u) => {
          if (u.customerId === activeUserId) {
            return {
              ...u,
              latestMessageTime: msg.createdAt || new Date().toISOString(),
            };
          }
          return u;
        }),
      );
    };

    socket.on("new-message", onNewMessage);

    return () => {
      socket.off("new-message", onNewMessage);
      activeUser.tickets.forEach((t) => {
        socket.emit("leave-room", t.id);
      });
    };
  }, [activeUser?.customerId, token]);

  const handleUserSelect = (id) => {
    setActiveUserId(id);
    setShowSidebar(false);
  };

  const handleSend = () => {
    const message = input.trim();
    if (!message || !activeTicketId) return;

    socket.emit("send-message", {
      roomId: activeTicketId,
      message,
      messageType: "TEXT",
    });

    setInput("");
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !activeTicketId) {
      e.target.value = "";
      return;
    }

    try {
      const attachments = await Promise.all(
        files.map(async (file) => {
          const buffer = Array.from(new Uint8Array(await file.arrayBuffer()));
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            messageType: toMessageType(file),
            buffer,
          };
        }),
      );

      socket.emit("send-message", {
        roomId: activeTicketId,
        message: "",
        attachments,
      });
    } catch (err) {
      console.error(err);
    } finally {
      e.target.value = "";
    }
  };

  const handleStatusChange = async (status) => {
    if (!activeTicketId) return;
    setIsStatusLoading(true);
    try {
      await updateTicketStatus(activeTicketId, status);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.tickets.some((t) => t.id === activeTicketId)) {
            return {
              ...u,
              tickets: u.tickets.map((t) =>
                t.id === activeTicketId ? { ...t, status } : t,
              ),
            };
          }
          return u;
        }),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsStatusLoading(false);
    }
  };

  // Filter and search
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
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.latestTicketId.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return result;
  }, [users, filterStatus, search]);

  // Stats
  const stats = {
    total: users.reduce((acc, u) => acc + u.tickets.length, 0),
    open: users.reduce(
      (acc, u) => acc + u.tickets.filter((t) => t.status === "OPEN").length,
      0,
    ),
    inProgress: users.reduce(
      (acc, u) =>
        acc + u.tickets.filter((t) => t.status === "IN_PROGRESS").length,
      0,
    ),
    resolved: users.reduce(
      (acc, u) => acc + u.tickets.filter((t) => t.status === "RESOLVED").length,
      0,
    ),
    closed: users.reduce(
      (acc, u) => acc + u.tickets.filter((t) => t.status === "CLOSED").length,
      0,
    ),
  };

  return (
    <div
      className={`relative h-[calc(100vh-120px)] overflow-hidden rounded-xl ${
        isDark ? "bg-gray-900" : "bg-white"
      }`}
    >
      {/* Mobile Menu Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className={`md:hidden absolute top-3 left-3 z-50 p-2 rounded-md transition-all ${
          isDark
            ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
            : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
        }`}
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="flex h-full">
        {/* Sidebar */}
        <div
          className={`
          absolute md:relative z-40 h-full
          transition-transform duration-300 ease-in-out
          ${showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          w-full md:w-80
          ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}
          border-r flex flex-col
        `}
        >
          {/* Header */}
          <div
            className={`p-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between mb-4">
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
                  Support Chats
                </h2>
              </div>
              <button
                onClick={loadRooms}
                disabled={refreshing}
                className={`p-1.5 rounded-md transition ${
                  isDark
                    ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                } ${refreshing ? "animate-spin" : ""}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div
                className={`text-center p-2 rounded-md ${
                  isDark ? "bg-gray-800" : "bg-gray-50"
                }`}
              >
                <p
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Total
                </p>
                <p className="font-bold text-base">{stats.total}</p>
              </div>
              <div
                className={`text-center p-2 rounded-md ${
                  isDark ? "bg-amber-500/10" : "bg-amber-50"
                }`}
              >
                <p
                  className={`text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}
                >
                  Open
                </p>
                <p className="font-bold text-base">{stats.open}</p>
              </div>
              <div
                className={`text-center p-2 rounded-md ${
                  isDark ? "bg-blue-500/10" : "bg-blue-50"
                }`}
              >
                <p
                  className={`text-xs ${isDark ? "text-blue-400" : "text-blue-600"}`}
                >
                  In Prog.
                </p>
                <p className="font-bold text-base">{stats.inProgress}</p>
              </div>
              <div
                className={`text-center p-2 rounded-md ${
                  isDark ? "bg-emerald-500/10" : "bg-emerald-50"
                }`}
              >
                <p
                  className={`text-xs ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                >
                  Resolved
                </p>
                <p className="font-bold text-base">{stats.resolved}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search
                className={`absolute left-3 top-2.5 w-4 h-4 ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID..."
                className={`
                  w-full pl-9 pr-3 py-2 rounded-md border text-sm
                  transition-all focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none
                  ${
                    isDark
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
                  }
                `}
              />
            </div>

            {/* Filter Dropdown */}
            {/* <div className="relative filter-container">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition w-full
                  ${isDark
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"}
                `}
              >
                <Filter className="w-4 h-4" />
                <span className="flex-1 text-left">
                  {filterStatus === "All" ? "All Tickets" : filterStatus}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    isFilterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isFilterOpen && (
                <div
                  className={`absolute z-50 mt-1 w-full rounded-md shadow-lg border
                    ${isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"}
                  `}
                >
                  {["All", "OPEN", "IN_PROGRESS", "RESOLVED"].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        setFilterStatus(status);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition
                        ${filterStatus === status
                          ? isDark
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-blue-100 text-blue-600"
                          : isDark
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"}
                      `}
                    >
                      {status !== "All" && getStatusIcon(status)}
                      <span>{status}</span>
                    </button>
                  ))}
                </div>
              )}
            </div> */}
          </div>

          {/* Tickets List */}
          <div className="flex-1 overflow-y-auto premium-scrollbar">
            {loadingRooms ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div
                      className={`h-16 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
                    ></div>
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
                  className={`text-center text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {search ? "No matching users found" : "No users available"}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {filteredUsers.map((u, index) => {
                  // Show zig-zag when ALL tickets are ASSIGNED or CLOSED (no active tickets)
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
                      onClick={() => handleUserSelect(u.customerId)}
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
                          className={`absolute left-0 top-0 bottom-0 w-1 rounded-r ${
                            isDark ? "bg-blue-500" : "bg-blue-500"
                          }`}
                        ></div>
                      )}

                      <div className="flex items-start gap-2">
                        <div
                          className={`
                         flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                         ${
                           activeUserId === u.customerId
                             ? isDark
                               ? "bg-blue-500"
                               : "bg-blue-500"
                             : isDark
                               ? "bg-gray-700"
                               : "bg-gray-200"
                         }
                       `}
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
                          <div className="flex items-center justify-between mb-0.5">
                            <h3
                              className={`font-medium text-sm truncate ${
                                activeUserId === u.customerId
                                  ? isDark
                                    ? "text-white"
                                    : "text-gray-900"
                                  : isDark
                                    ? "text-gray-200"
                                    : "text-gray-900"
                              }`}
                            >
                              {u.name}
                            </h3>
                            {u.latestMessageTime && (
                              <span
                                className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}
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

                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className={`text-[10px] font-mono ${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
                              #{u.latestTicketId}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-700"} flex items-center gap-0.5`}
                            >
                              {u.tickets.length} Tickets
                            </span>
                          </div>
                        </div>

                        {u.unreadCount > 0 && (
                          <span
                            className={`
                           flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center
                           text-[10px] font-bold animate-pulse
                           ${isDark ? "bg-blue-500 text-white" : "bg-blue-500 text-white"}
                         `}
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
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative z-20">
          {activeUser ? (
            <>
              {/* Chat Header */}
              <div
                className={`p-4 border-b flex flex-col md:flex-row md:justify-between md:items-center gap-3 ${
                  isDark
                    ? "border-gray-800 bg-gray-900"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    ${isDark ? "bg-blue-900/50" : "bg-blue-100"}
                  `}
                  >
                    <User
                      className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold text-lg ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {activeUser.name}
                    </h3>
                    <p
                      className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Customer ID: {activeUser.customerId}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex items-center">
                    <select
                      value={activeChatStatus}
                      disabled={isStatusLoading}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className={`
                        text-xs px-3 py-1.5 pr-8 rounded-md border outline-none
                        transition-all focus:ring-1 focus:ring-blue-500 appearance-none
                        ${
                          isDark
                            ? "bg-gray-800 border-gray-700 text-gray-300"
                            : "bg-white border-gray-300 text-gray-700"
                        }
                        disabled:opacity-60 disabled:cursor-not-allowed
                      `}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <div className="absolute right-2.5 pointer-events-none">
                      {isStatusLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div
                className={`flex-1 overflow-y-auto premium-scrollbar p-4 space-y-6 transition-all duration-500 ${
                  isDark ? "bg-gray-900" : "bg-gray-50"
                }`}
              >
                {loadingMessages ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div
                          className={`h-12 rounded-lg w-2/3 ${isDark ? "bg-gray-800" : "bg-gray-200"}`}
                        ></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  orderedMessageGroups.map((group) => {
                    const groupTicket = activeUser.tickets.find(
                      (t) => t.id === group.roomId,
                    );
                    const displayTicketId =
                      groupTicket?.ticketId || group.roomId.slice(-6);
                    const isGroupDone = ["RESOLVED"].includes(
                      groupTicket?.status,
                    );

                    // Per-group zig-zag background for RESOLVED or CLOSED tickets
                    const groupDoneStyle = isGroupDone
                      ? {
                          backgroundColor: isDark
                            ? "rgba(16, 185, 129, 0.04)"
                            : "rgba(209, 250, 229, 0.60)",
                          backgroundImage: isDark
                            ? `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(16, 185, 129, 0.10) 10px, rgba(16, 185, 129, 0.10) 20px)`
                            : `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(16, 185, 129, 0.18) 10px, rgba(16, 185, 129, 0.18) 20px)`,
                        }
                      : {};

                    return (
                      <div
                        key={`group-${group.roomId}`}
                        className={`space-y-4 rounded-xl transition-all duration-500 ${
                          isGroupDone ? "p-3" : ""
                        }`}
                        style={groupDoneStyle}
                      >
                        <div className="flex justify-center my-6 sticky top-2 z-20">
                          <div
                            className={`text-xs px-4 py-1.5 rounded-full backdrop-blur-md border shadow-sm flex items-center gap-2 ${
                              group.roomId === activeTicket?.id
                                ? isDark
                                  ? "bg-blue-900/80 border-blue-500/50 text-blue-200"
                                  : "bg-blue-100 border-blue-300 text-blue-800"
                                : isDark
                                  ? "bg-gray-800/80 border-gray-700 text-gray-400"
                                  : "bg-white/80 border-gray-300 text-gray-600"
                            }`}
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span className="font-bold">
                              Ticket #{displayTicketId}
                            </span>
                          </div>
                        </div>

                        {group.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"} animate-fade-in`}
                          >
                            <div
                              className={`
                                  max-w-[85%] md:max-w-md rounded-2xl p-3 shadow-md
                                  ${
                                    msg.sender === "agent"
                                      ? isDark
                                        ? "bg-blue-600 text-white rounded-br-sm"
                                        : "bg-blue-500 text-white rounded-br-sm"
                                      : isDark
                                        ? "bg-gray-800 text-gray-200 rounded-bl-sm"
                                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                                  }
                                `}
                            >
                              {msg.attachments?.length > 0 && (
                                <div className="space-y-2 mb-2">
                                  {msg.attachments.map((file, idx) => {
                                    const fileUrl = file?.url;
                                    const fileName = file?.name || "Attachment";
                                    const fileType = file?.type || "";
                                    const isImage = isImageAttachment(
                                      file?.messageType,
                                      fileType,
                                      fileUrl,
                                    );

                                    if (!fileUrl) return null;

                                    return isImage ? (
                                      <div
                                        key={`${msg.id}-img-${idx}`}
                                        className="relative group"
                                      >
                                        <img
                                          src={fileUrl}
                                          alt={fileName}
                                          className="rounded-xl max-w-full cursor-pointer hover:opacity-90 transition border border-white/10"
                                          onClick={() =>
                                            window.open(fileUrl, "_blank")
                                          }
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            downloadFile({
                                              url: fileUrl,
                                              name: fileName,
                                            });
                                          }}
                                          className="absolute bottom-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Download"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div
                                        key={`${msg.id}-file-${idx}`}
                                        className={`
                                              flex items-center gap-2 p-2 rounded-xl text-xs
                                              ${
                                                msg.sender === "agent"
                                                  ? "bg-blue-700/50 text-white"
                                                  : isDark
                                                    ? "bg-gray-700 text-gray-300"
                                                    : "bg-gray-100 text-gray-700"
                                              }
                                            `}
                                      >
                                        <FileText className="w-4 h-4 flex-shrink-0" />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            window.open(fileUrl, "_blank")
                                          }
                                          className="flex-1 truncate text-left"
                                          title={fileName}
                                        >
                                          {fileName}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            downloadFile({
                                              url: fileUrl,
                                              name: fileName,
                                            })
                                          }
                                          className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                                          title="Download"
                                        >
                                          <Download className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {msg.text && (
                                <p className="text-sm break-words leading-relaxed">
                                  {msg.text}
                                </p>
                              )}

                              <div
                                className={`
                                    text-[10px] mt-2 flex justify-end
                                    ${
                                      msg.sender === "agent"
                                        ? "text-blue-200"
                                        : isDark
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                    }
                                  `}
                              >
                                {msg.time}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Message Input Bottom Area */}
              {activeChatStatus === "CLOSED" ? (
                <div
                  className={`p-4 border-t flex flex-col items-center justify-center gap-1.5 transition-all duration-500 relative z-20 ${
                    isDark
                      ? "border-emerald-900/40 bg-gray-900"
                      : "border-emerald-200 bg-white"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
                      isDark
                        ? "bg-emerald-900/30 border-emerald-700/40 text-emerald-300"
                        : "bg-emerald-100 border-emerald-300 text-emerald-700"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold">
                      This active ticket is closed — select an open ticket to
                      reply
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className={`p-4 border-t ${
                    isDark
                      ? "border-gray-800 bg-gray-900"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {/* Dropdown for Context Selection */}
                  <div className="w-full mb-3 flex justify-between items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Replying To:
                    </span>
                    <div className="relative">
                      <select
                        value={activeTicketId || ""}
                        onChange={(e) => setActiveTicketId(e.target.value)}
                        className={`
                             text-xs px-6.5 py-1.5 pl-7 rounded-md border outline-none
                             transition-all focus:ring-1 focus:ring-blue-500 appearance-none
                             ${
                               isDark
                                 ? "bg-gray-800 border-gray-700 text-white"
                                 : "bg-white border-gray-300 text-gray-900"
                             }
                           `}
                      >
                        {activeUser.tickets.map((t) => (
                          <option
                            key={t.id}
                            value={t.id}
                            disabled={["RESOLVED", "ASSIGNED"].includes(
                              t.status,
                            )}
                          >
                            Ticket #{t.ticketId} ({t.status})
                          </option>
                        ))}
                      </select>
                      <ListFilter
                        className={`absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      />
                      <ChevronDown
                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Type your message..."
                      className={`
                        flex-1 px-4 py-2.5 rounded-xl border text-sm
                        transition-all focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none
                        ${
                          isDark
                            ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                            : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
                        }
                      `}
                    />

                    <input
                      type="file"
                      ref={fileRef}
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      onClick={() => fileRef.current.click()}
                      className={`
                        p-2.5 rounded-xl border transition
                        ${
                          isDark
                            ? "border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                            : "border-gray-300 text-gray-600 hover:bg-gray-100"
                        }
                      `}
                      title="Attach file"
                    >
                      <Paperclip size={18} />
                    </button>

                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className={`
                        p-2.5 rounded-xl transition
                        ${
                          input.trim()
                            ? isDark
                              ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
                              : "bg-blue-500 text-white hover:bg-blue-600 hover:scale-105"
                            : isDark
                              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }
                      `}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div
                className={`text-center p-8 rounded-2xl max-w-sm w-full mx-4 border shadow-xl ${isDark ? "bg-gray-800/50 border-gray-800 text-gray-400" : "bg-white border-gray-100 text-gray-500"}`}
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                    isDark ? "bg-gray-800/80" : "bg-blue-50"
                  }`}
                >
                  <MessageSquare
                    className={`w-10 h-10 ${isDark ? "text-gray-600" : "text-blue-400"}`}
                  />
                </div>
                <p
                  className={`text-xl font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-800"}`}
                >
                  No user selected
                </p>
                <p className="text-sm">
                  Select a user from the sidebar to view their support history
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity"
        />
      )}

      {/* CSS Animations */}
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

export default ZoneTickets;
