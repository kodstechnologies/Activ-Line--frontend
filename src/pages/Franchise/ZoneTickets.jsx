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
  Download
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { socket } from "../../socket/socket";
import {
  getTicketRooms,
  getRoomMessages,
  updateTicketStatus
} from "../../api/frenchise/franchiseTicketApi";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

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
  return map[status] || (isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700");
};

const getStatusIcon = (status) => {
  switch(status) {
    case 'OPEN': return <AlertCircle className="w-3 h-3" />;
    case 'IN_PROGRESS': return <Clock className="w-3 h-3" />;
    case 'RESOLVED': return <CheckCircle className="w-3 h-3" />;
    case 'CLOSED': return <XCircle className="w-3 h-3" />;
    default: return <MessageSquare className="w-3 h-3" />;
  }
};

const isImageAttachment = (messageType, mimeType, fileUrl = "") => {
  const normalizedType = String(messageType || "").toUpperCase();
  const normalizedMime = String(mimeType || "").toLowerCase();
  const normalizedUrl = String(fileUrl || "").toLowerCase();

  if (normalizedType === "IMAGE") return true;
  if (normalizedMime.startsWith("image/")) return true;

  return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"].some(ext =>
    normalizedUrl.includes(ext)
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
        messageType: a.type || a.messageType
      }))
    : [];

  if (attachments.length === 0 && (m?.file || m?.fileUrl)) {
    attachments.push({
      url: m.file || m.fileUrl,
      name: m.fileName || "Attachment",
      type: m.mimeType || m.type || "",
      messageType: m.messageType || m.type || "FILE"
    });
  }

  const role = String(m.senderRole || "").toUpperCase();
  const isCustomer = role === "CUSTOMER";

  return {
    id: m._id || m.id || `${m.createdAt || ""}-${m.senderRole || ""}-${m.message || ""}`,
    sender: isCustomer ? "customer" : "agent",
    senderRole: role,
    text: m.message || "",
    attachments,
    time: new Date(m.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    createdAt: m.createdAt
  };
};

const ZoneTickets = () => {
  const { isDark } = useTheme();
  const { token } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fileRef = useRef();
  const messageEndRef = useRef();

  const activeChat = chats.find(c => c.id === activeChatId);
  const sortedActiveMessages = useMemo(
    () => sortMessagesByCreatedAt(activeChat?.messages || []),
    [activeChat?.messages]
  );

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
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  const loadRooms = async () => {
    try {
      setRefreshing(true);
      const res = await getTicketRooms(1, 20);
      
      const rooms = res.data.map(room => ({
        id: room._id,
        name: `${room.customer.firstName} ${room.customer.lastName}`,
        customerId: room.customer.userName,
        status: room.status,
        lastMsg: room.lastMessage || "No messages yet",
        time: room.lastMessageAt || new Date().toISOString(),
        unreadCount: room.unreadCount || 0,
        messages: []
      }));

      setChats(rooms);

      if (rooms.length && !activeChatId) {
        setActiveChatId(rooms[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRooms(false);
      setRefreshing(false);
    }
  };

const loadMessages = async (roomId) => {
  try {
    setLoadingMessages(true);

    const res = await getRoomMessages(roomId);

    console.log("MESSAGES API RESPONSE:", res);   // 👈 ADD THIS

    const messages = sortMessagesByCreatedAt(
      (res?.data?.data || res?.data || []).map(normalizeMessage)
    );

    setChats(prev => prev.map(c =>
      c.id === roomId
        ? { ...c, messages }
        : c
    ));
  } catch (err) {
    console.error(err);
  } finally {
    setLoadingMessages(false);
  }
};

  const handleChatSelect = (id) => {
    setActiveChatId(id);
    setShowSidebar(false);
  };

  useEffect(() => {
    if (!activeChatId || !token) return;

    loadMessages(activeChatId);

    socket.auth = { token };
    if (!socket.connected) socket.connect();
    socket.emit("join-room", activeChatId);

    const onNewMessage = (msg) => {
      const normalized = normalizeMessage(msg);

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== activeChatId) return chat;
          if (chat.messages.some((m) => m.id === normalized.id)) return chat;

          return {
            ...chat,
            messages: sortMessagesByCreatedAt([...chat.messages, normalized]),
            lastMsg: normalized.text || normalized.attachments?.[0]?.name || "Attachment",
            time: msg?.createdAt || new Date().toISOString(),
          };
        })
      );
    };

    socket.on("new-message", onNewMessage);

    return () => {
      socket.off("new-message", onNewMessage);
      socket.emit("leave-room", activeChatId);
    };
  }, [activeChatId, token]);

  const handleSend = () => {
    const message = input.trim();
    if (!message || !activeChatId) return;

    socket.emit("send-message", {
      roomId: activeChatId,
      message,
      messageType: "TEXT",
    });

    setInput("");
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !activeChatId) {
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
        })
      );

      socket.emit("send-message", {
        roomId: activeChatId,
        message: "",
        attachments,
      });
      setTimeout(() => {
        loadMessages(activeChatId);
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      e.target.value = "";
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await updateTicketStatus(activeChatId, status);
      setChats(prev => prev.map(c =>
        c.id === activeChatId
          ? { ...c, status }
          : c
      ));
    } catch (err) {
      console.error(err);
    }
  };

  // Filter and search
  const filteredChats = useMemo(() => {
    let result = chats;
    
    if (filterStatus !== "All") {
      result = result.filter(chat => chat.status === filterStatus);
    }
    
    if (search) {
      result = result.filter(chat =>
        chat.name.toLowerCase().includes(search.toLowerCase()) ||
        chat.customerId.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return result;
  }, [chats, filterStatus, search]);

  // Stats
  const stats = {
    total: chats.length,
    open: chats.filter(c => c.status === "OPEN").length,
    inProgress: chats.filter(c => c.status === "IN_PROGRESS").length,
    resolved: chats.filter(c => c.status === "RESOLVED").length,
    closed: chats.filter(c => c.status === "CLOSED").length
  };

  return (
    <div className={`relative h-[calc(100vh-120px)] overflow-hidden rounded-xl ${
      isDark ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className={`md:hidden absolute top-3 left-3 z-50 p-2 rounded-md transition-all ${
          isDark 
            ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
        }`}
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`
          absolute md:relative z-40 h-full
          transition-transform duration-300 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          w-full md:w-80
          ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}
          border-r flex flex-col
        `}>
          {/* Header */}
          <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <Inbox className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Support Tickets
                </h2>
              </div>
              <button
                onClick={loadRooms}
                disabled={refreshing}
                className={`p-1.5 rounded-md transition ${
                  isDark 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                } ${refreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className={`text-center p-2 rounded-md ${
                isDark ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                <p className="font-bold text-base">{stats.total}</p>
              </div>
              <div className={`text-center p-2 rounded-md ${
                isDark ? 'bg-amber-500/10' : 'bg-amber-50'
              }`}>
                <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Open</p>
                <p className="font-bold text-base">{stats.open}</p>
              </div>
              <div className={`text-center p-2 rounded-md ${
                isDark ? 'bg-blue-500/10' : 'bg-blue-50'
              }`}>
                <p className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>In Prog.</p>
                <p className="font-bold text-base">{stats.inProgress}</p>
              </div>
              <div className={`text-center p-2 rounded-md ${
                isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
              }`}>
                <p className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Closed</p>
                <p className="font-bold text-base">{stats.closed}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className={`absolute left-3 top-2.5 w-4 h-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID..."
                className={`
                  w-full pl-9 pr-3 py-2 rounded-md border text-sm
                  transition-all focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none
                  ${isDark 
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" 
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
                  }
                `}
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative filter-container">
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
                  {["All", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(status => (
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
            </div>
          </div>

          {/* Tickets List */}
          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className={`h-16 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}></div>
                  </div>
                ))}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <div className={`p-3 rounded-lg mb-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <Inbox className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
                <p className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {search ? 'No matching tickets found' : 'No tickets available'}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {filteredChats.map((chat, index) => (
                  <div
                    key={chat.id}
                    onClick={() => handleChatSelect(chat.id)}
                    className={`
                      relative p-3 rounded-lg cursor-pointer mb-2
                      transition-all duration-150 animate-fade-in-up
                      ${activeChatId === chat.id
                        ? isDark
                          ? 'bg-gray-800 border-blue-500/50 border'
                          : 'bg-blue-50 border-blue-300 border'
                        : isDark
                          ? 'hover:bg-gray-800/50 border border-transparent hover:border-gray-700'
                          : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                      }
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {activeChatId === chat.id && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r ${
                        isDark ? 'bg-blue-500' : 'bg-blue-500'
                      }`}></div>
                    )}

                    <div className="flex items-start gap-2">
                      <div className={`
                        flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                        ${activeChatId === chat.id
                          ? isDark ? 'bg-blue-500' : 'bg-blue-500'
                          : isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }
                      `}>
                        <User className={`w-3.5 h-3.5 ${
                          activeChatId === chat.id 
                            ? 'text-white' 
                            : isDark ? 'text-gray-400' : 'text-gray-600'
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className={`font-medium text-sm truncate ${
                            activeChatId === chat.id
                              ? isDark ? 'text-white' : 'text-gray-900'
                              : isDark ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                            {chat.name}
                          </h3>
                          {chat.time && (
                            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(chat.time).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[10px] font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            #{chat.customerId.slice(-6)}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getStatusColor(chat.status, isDark)} flex items-center gap-0.5`}>
                            {getStatusIcon(chat.status)}
                            {chat.status}
                          </span>
                        </div>

                        {chat.lastMsg && (
                          <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {chat.lastMsg}
                          </p>
                        )}
                      </div>

                      {chat.unreadCount > 0 && (
                        <span className={`
                          flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center
                          text-[10px] font-bold animate-pulse
                          ${isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'}
                        `}>
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className={`p-4 border-b flex justify-between items-center ${
                isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center
                    ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
                  `}>
                    <User className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {activeChat.name}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      ID: {activeChat.customerId}
                    </p>
                  </div>
                </div>

                <select
                  value={activeChat.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`
                    text-xs px-3 py-1.5 rounded-md border outline-none
                    transition-all focus:ring-1 focus:ring-blue-500
                    ${isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-300'
                      : 'bg-white border-gray-300 text-gray-700'
                    }
                  `}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Messages */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${
                isDark ? 'bg-gray-900' : 'bg-gray-50'
              }`}>
                {loadingMessages ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className={`h-12 rounded-lg w-2/3 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  sortedActiveMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"} animate-fade-in`}
                    >
                      <div className={`
                        max-w-xs md:max-w-md rounded-lg p-3 shadow-sm
                        ${msg.sender === "agent"
                          ? isDark
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : isDark
                            ? 'bg-gray-800 text-gray-200'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }
                      `}>
                        {msg.attachments?.length > 0 && (
                          <div className="space-y-2 mb-2">
                            {msg.attachments.map((file, idx) => {
                              const fileUrl = file?.url;
                              const fileName = file?.name || "Attachment";
                              const fileType = file?.type || "";
                              const isImage = isImageAttachment(file?.messageType, fileType, fileUrl);

                              if (!fileUrl) return null;

                              return isImage ? (
                                <div key={`${msg.id}-img-${idx}`} className="relative group">
                                  <img
                                    src={fileUrl}
                                    alt={fileName}
                                    className="rounded max-w-[200px] cursor-pointer hover:opacity-90 transition"
                                    onClick={() => window.open(fileUrl, "_blank")}
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadFile({ url: fileUrl, name: fileName });
                                    }}
                                    className="absolute bottom-1 right-1 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Download"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  key={`${msg.id}-file-${idx}`}
                                  className={`
                                    flex items-center gap-2 p-2 rounded text-xs
                                    ${msg.sender === "agent"
                                      ? "bg-blue-700 text-white"
                                      : isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                                    }
                                  `}
                                >
                                  <FileText className="w-4 h-4" />
                                  <button
                                    type="button"
                                    onClick={() => window.open(fileUrl, "_blank")}
                                    className="flex-1 truncate text-left"
                                    title={fileName}
                                  >
                                    {fileName}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => downloadFile({ url: fileUrl, name: fileName })}
                                    className="p-1.5 rounded-full hover:bg-white/10"
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
                          <p className="text-sm break-words">{msg.text}</p>
                        )}
                        
                        <div className={`
                          text-[10px] mt-1 flex justify-end
                          ${msg.sender === "agent"
                            ? 'text-blue-200'
                            : isDark ? 'text-gray-400' : 'text-gray-500'
                          }
                        `}>
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Message Input */}
              {activeChat.status !== "CLOSED" && (
                <div className={`p-4 border-t ${
                  isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex gap-2 items-center">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Type your message..."
                      className={`
                        flex-1 px-3 py-2 rounded-md border text-sm
                        transition-all focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none
                        ${isDark
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
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
                        p-2 rounded-md border transition
                        ${isDark
                          ? 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                        }
                      `}
                      title="Attach file"
                    >
                      <Paperclip size={16} />
                    </button>
                    
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className={`
                        p-2 rounded-md transition
                        ${input.trim()
                          ? isDark
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                          : isDark
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className={`text-center p-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <MessageSquare className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
                <p className="text-sm font-medium mb-1">No ticket selected</p>
                <p className="text-xs">Select a ticket from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          className="md:hidden fixed inset-0 bg-black/20 z-30 transition-opacity"
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
        
        /* Custom Scrollbar */
        .overflow-y-auto {
          scrollbar-width: thin;
        }
        
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: ${isDark ? '#1f2937' : '#f3f4f6'};
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: ${isDark ? '#4b5563' : '#d1d5db'};
          border-radius: 2px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#6b7280' : '#9ca3af'};
        }
      `}</style>
    </div>
  );
};

export default ZoneTickets;
