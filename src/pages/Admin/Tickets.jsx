
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
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Filter, 
  RefreshCw,
  Inbox,
  Users,
  Shield,
  Sparkles
} from "lucide-react";




/* ---------- STATUS COLOR ---------- */
const getStatusColor = (status, isDark) => {
  const map = {
    OPEN: isDark 
      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" 
      : "bg-amber-100 text-amber-700 border border-amber-200",
    ASSIGNED: isDark 
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


const ALLOWED_STATUS_TRANSITIONS = {
  OPEN: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
  ASSIGNED: ["IN_PROGRESS", "RESOLVED", "CLOSED","OPEN"],
  IN_PROGRESS: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["RESOLVED", "OPEN", "IN_PROGRESS", "CLOSED"],
  CLOSED: ["CLOSED"],
};


const getStatusIcon = (status) => {
  switch(status) {
    case 'OPEN': return <AlertCircle className="w-3 h-3" />;
    case 'ASSIGNED': return <Users className="w-3 h-3" />;
    case 'RESOLVED': return <CheckCircle className="w-3 h-3" />;

    case 'CLOSED': return <CheckCircle className="w-3 h-3" />;
    default: return <MessageSquare className="w-3 h-3" />;
  }
};

const Tickets = () => {
  const { isDark } = useTheme();
  const { user, token } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
const [assignedRoomCount, setAssignedRoomCount] = useState(0);
const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketPageSize, setTicketPageSize] = useState(12);

  const activeTicket = tickets.find(t => t._id === activeTicketId);
  const [staffList, setStaffList] = useState([]);


  const loadStaff = async () => {
  try {
    const res = await api.get("/api/admin/staff");
    setStaffList(res.data.data || []);
  } catch (err) {
    console.error("Failed to load staff", err);
  }
};

  /* ---------- LOAD ROOMS ---------- */
  const loadTickets = () => {
    if (!token) return;

    setRefreshing(true);

    api.get("api/chat/admin/rooms")
      .then(res => {
     const mapped = res.data.data.map(r => ({
  _id: r._id,
  ticketId: r._id.slice(-6).toUpperCase(), // short readable ID
  issue: "Customer Support Chat",

  // ✅ FIXED
  customerName: r.customer?.userName || "Guest User",

  status: r.status || "OPEN",
  assignedTo: r.assignedStaff?._id || null,

  // ✅ FIXED
  lastMessage: r.lastMessage || "No messages yet",
  lastMessageTime: r.lastMessageAt,

  unreadCount: r.unreadCount || 0,
}));

        setTickets(mapped);

        if (!activeTicketId && mapped.length) {
          setActiveTicketId(mapped[0]._id);
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

    setTickets(prev =>
      prev.map(t =>
        t._id === roomId
          ? {
              ...t,
              assignedTo: res.data.data.assignedStaff,
              status: res.data.data.status, // ASSIGNED
            }
          : t
      )
    );
  } catch (err) {
    console.error("❌ Assign staff failed", err.response?.data || err);
  }
};

  const updateTicketStatus = async (roomId, status) => {
  try {
    const res = await api.patch("/api/chat/admin/status", {
      roomId,
      status,
    });

    // Update UI instantly
    setTickets(prev =>
      prev.map(t =>
        t._id === roomId
          ? { ...t, status: res.data.data.status }
          : t
      )
    );
  } catch (err) {
    console.error(
      "❌ Status update failed",
      err.response?.data || err.message
    );
  }
};




 useEffect(() => {
  loadTickets();
  loadStaff();
  getAssignedRoomsCount()
    .then(count => setAssignedRoomCount(count))
    .catch(() => setAssignedRoomCount(0));
}, [token]);

// const unassignStaff = async (roomId) => {
//   try {
//     await api.patch("/api/chat/admin/unassign", { roomId });

//     setTickets(prev =>
//       prev.map(t =>
//         t._id === roomId
//           ? { ...t, assignedTo: null, status: "OPEN" }
//           : t
//       )
//     );
//   } catch (err) {
//     console.error("Unassign failed", err);
//   }
// };

  /* ---------- LOAD MESSAGES + SOCKET (🔥 FIXED) ---------- */
  useEffect(() => {
    if (!activeTicket?._id || !token) return;

    setMessages([]);

    // 1️⃣ Load chat history
    api.get(`api/chat/admin/messages/${activeTicket._id}`)
      .then(res => setMessages(res.data.data || []))
      .catch(() => setMessages([]));

    // 2️⃣ 🔥 VERY IMPORTANT: attach ADMIN token to socket
    socket.auth = { token };

    if (!socket.connected && token) {
      socket.connect();
    }

    // 3️⃣ Join room AFTER connect
    socket.emit("join-room", activeTicket._id);

    const handleNewMessage = (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on("new-message", handleNewMessage);

   return () => {
  socket.off("new-message", handleNewMessage);
  socket.emit("leave-room", activeTicket._id);
};

  }, [activeTicket?._id, token]);

  useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest(".filter-container")) {
      setIsFilterOpen(false);
    }
  };

  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);

  /* ---------- SEND MESSAGE (ADMIN → CUSTOMER) ---------- */
 const sendMessage = ({ message }) => {
  if (!message || !message.trim()) return;

  socket.emit("send-message", {
    roomId: activeTicket._id,
    message
  });
};



  /* ---------- FILTER ---------- */
  const filteredTickets = useMemo(() => {
    let result = tickets;
    
    // Status filter
    if (filterStatus !== "All") {
      result = result.filter(t => t.status === filterStatus);
    }
    
    // Search filter
    if (search) {
      result = result.filter(t => 
        t.customerName.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketId.toLowerCase().includes(search.toLowerCase()) ||
        t.issue.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return result;
  }, [tickets, filterStatus, search]);

  const ticketTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredTickets.length / ticketPageSize)),
    [filteredTickets.length, ticketPageSize]
  );

  const paginatedTickets = useMemo(() => {
    const start = (ticketPage - 1) * ticketPageSize;
    return filteredTickets.slice(start, start + ticketPageSize);
  }, [filteredTickets, ticketPage, ticketPageSize]);

  useEffect(() => {
    if (ticketPage > ticketTotalPages) setTicketPage(1);
  }, [ticketPage, ticketTotalPages]);

  /* ---------- STATS ---------- */
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "OPEN").length,
    assigned: assignedRoomCount,

    resolved: tickets.filter(t => t.status === "RESOLVED").length,
    closed: tickets.filter(t => t.status === "CLOSED").length,
  };

  if (!token) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-medium">Unauthorized – Please login again</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-[calc(100vh-120px)] overflow-hidden ${
      isDark ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* MOBILE TOGGLE BUTTON */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`lg:hidden absolute top-3 left-3 z-50 p-2 rounded-md transition-all duration-200 ${
          isDark 
            ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
        }`}
      >
        {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      <div className="flex h-full">
        {/* ---------- SIDEBAR ---------- */}
        <div className={`
          absolute lg:relative z-40 h-full
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-full lg:w-80
          ${isDark ? "bg-gray-900" : "bg-white"}
          border-r
          flex flex-col
          ${isDark ? 'border-gray-800' : 'border-gray-200'}
        `}>
          {/* Sidebar Header */}
          <div className={`p-3 ${isDark ? 'border-gray-800' : 'border-gray-200'} border-b`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <Inbox className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Support Inbox
                </h2>
              </div>
              <button
                onClick={loadTickets}
                disabled={refreshing}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  isDark 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                } ${refreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className={`text-center p-2 rounded-md ${
                isDark ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <p className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                {loading ? (
                  <div className={`h-5 w-8 mx-auto rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                ) : (
                  <p className="font-bold text-lg">{stats.total}</p>
                )}
              </div>
              <div className={`text-center p-2 rounded-md ${
                isDark ? 'bg-amber-500/10' : 'bg-amber-50'
              }`}>
                <p className={`text-base ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Open</p>
                {loading ? (
                  <div className={`h-5 w-8 mx-auto rounded animate-pulse ${isDark ? "bg-amber-800/40" : "bg-amber-200"}`} />
                ) : (
                  <p className="font-bold text-lg">{stats.open}</p>
                )}
              </div>
              <div className={`text-center p-2 rounded-md ${
                isDark ? 'bg-blue-500/10' : 'bg-blue-50'
              }`}>
                <p className={`text-base ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Assigned</p>
                {loading ? (
                  <div className={`h-5 w-8 mx-auto rounded animate-pulse ${isDark ? "bg-blue-800/40" : "bg-blue-200"}`} />
                ) : (
                  <p className="font-bold text-lg">{stats.assigned}</p>
                )}
              </div>
              <div className={`text-center p-2 rounded-md ${
                isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
              }`}>
                <p className={`text-base ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Closed</p>
                {loading ? (
                  <div className={`h-5 w-8 mx-auto rounded animate-pulse ${isDark ? "bg-emerald-800/40" : "bg-emerald-200"}`} />
                ) : (
                  <p className="font-bold text-lg">{stats.closed}</p>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-2">
              <Search className={`absolute left-2.5 top-2.5 w-4 h-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setTicketPage(1);
                }}
                placeholder="Search tickets..."
                className={`
                  pl-9 pr-3 py-2 w-full rounded-md border text-lg
                  transition-all duration-200
                  focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none
                  ${isDark 
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" 
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
                  }
                `}
              />
            </div>

            {/* Status Filters */}
            {/* <div className="flex flex-wrap gap-1 mt-2">
              {["All", "OPEN", "ASSIGNED", "RESOLVED", "CLOSED"].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`
                    px-2 py-1.5 rounded text-xs font-medium transition-all duration-200
                    flex items-center gap-1.5
                    ${filterStatus === s
                      ? isDark
                        ? s === 'ALL' ? 'bg-blue-500 text-white' : getStatusColor(s, isDark).replace('bg-', 'bg-').replace('/15', '')
                        : s === 'ALL' ? 'bg-blue-500 text-white' : getStatusColor(s, isDark).replace('bg-100', 'bg-600 text-white')
                      : isDark
                        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {s !== "All" && getStatusIcon(s)}
                  <span>{s}</span>
                  {s === "All" && (
                    <span className="px-1 rounded text-[10px] bg-white/20">
                      {stats.total}
                    </span>
                  )}
                </button>
              ))}
            </div> */}

            {/* Filter Dropdown */}
<div className="relative mt-2  filter-container">
  <button
    onClick={() => setIsFilterOpen(prev => !prev)}
    className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition
      ${isDark
        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"}
    `}
  >
    <Filter className="w-4 h-4" />
    <span>
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
    className={`absolute z-50 mt-2 w-44 rounded-md shadow-lg border
      ${isDark
        ? "bg-gray-900 border-gray-700"
        : "bg-white border-gray-200"}
    `}
  >
    {["All", "OPEN", "ASSIGNED", "RESOLVED", "CLOSED"].map(status => (
      <button
        key={status}
        onClick={() => {
          setFilterStatus(status);
          setIsFilterOpen(false);
          setTicketPage(1);
        }}
        className={`w-full text-left px-3 py-2 text-base flex items-center gap-2 transition
          ${filterStatus === status
            ? isDark
              ? "bg-blue-500/20 text-blue-400"
              : "bg-blue-100 text-blue-600"
            : isDark
              ? "text-gray-300 hover:bg-gray-800"
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
            {loading ? (
              <div className="p-2 space-y-2">
                {Array.from({ length: ticketPageSize }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg animate-pulse ${
                      isDark ? "bg-gray-800/70" : "bg-gray-100"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-8 h-8 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                      <div className="flex-1 space-y-2">
                        <div className={`h-3 rounded w-1/3 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                        <div className={`h-2.5 rounded w-1/2 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                        <div className={`h-2.5 rounded w-2/3 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <div className={`p-3 rounded-lg mb-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <Inbox className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
                <p className={`text-center text-lg mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {search ? 'No matching tickets found' : 'No tickets available'}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className={`text-base ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2">
                {paginatedTickets.map((ticket, index) => (
                  <div
                    key={ticket._id}
                    onClick={() => {
                      setActiveTicketId(ticket._id);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                    className={`
                      relative p-3 rounded-lg cursor-pointer mb-2
                      transition-all duration-150 animate-fade-in-up
                      ${activeTicketId === ticket._id
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
                    {/* Active indicator */}
                    {activeTicketId === ticket._id && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r ${
                        isDark ? 'bg-blue-500' : 'bg-blue-500'
                      }`}></div>
                    )}

                    <div className="flex items-start gap-2">
                      {/* Avatar */}
                      <div className={`
                        flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                        ${activeTicketId === ticket._id
                          ? isDark
                            ? 'bg-blue-500'
                            : 'bg-blue-500'
                          : isDark
                            ? 'bg-gray-700'
                            : 'bg-gray-200'
                        }
                      `}>
                        <User className={`w-3.5 h-3.5 ${
                          activeTicketId === ticket._id 
                            ? 'text-white' 
                            : isDark ? 'text-gray-400' : 'text-gray-600'
                        }`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className={`font-medium text-base truncate ${
                            activeTicketId === ticket._id
                              ? isDark ? 'text-white' : 'text-gray-900'
                              : isDark ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                            {ticket.customerName}
                          </h3>
                          {ticket.lastMessageTime && (
                            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(ticket.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-base font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            #{ticket.ticketId}
                          </span>
                          <span className={`text-sm px-1.5 py-0.5 rounded-full ${getStatusColor(ticket.status, isDark)} flex items-center gap-1`}>
                            {getStatusIcon(ticket.status)}
                            {ticket.status}
                          </span>
                        </div>

                        {/* Last message preview */}
                        {ticket.lastMessage && (
                          <p className={`text-base truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {ticket.lastMessage}
                          </p>
                        )}
                      </div>

                      {/* Unread badge */}
                      {ticket.unreadCount > 0 && (
                        <span className={`
                          flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                          text-sm font-bold animate-pulse
                          ${isDark
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-500 text-white'
                          }
                        `}>
                          {ticket.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!loading && filteredTickets.length > 0 && (
            <div className={`p-2 border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Per page</span>
                  <select
                    value={ticketPageSize}
                    onChange={(e) => {
                      setTicketPageSize(Number(e.target.value));
                      setTicketPage(1);
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
                    onClick={() => setTicketPage((p) => Math.max(1, p - 1))}
                    disabled={ticketPage === 1}
                    className={`p-1.5 rounded ${ticketPage === 1 ? "opacity-50 cursor-not-allowed" : ""} ${
                      isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className={`text-xs px-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {ticketPage}/{ticketTotalPages}
                  </span>
                  <button
                    onClick={() => setTicketPage((p) => Math.min(ticketTotalPages, p + 1))}
                    disabled={ticketPage === ticketTotalPages}
                    className={`p-1.5 rounded ${ticketPage === ticketTotalPages ? "opacity-50 cursor-not-allowed" : ""} ${
                      isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                    }`}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ---------- CHAT AREA ---------- */}
        <div className={`
          flex-1 h-full flex flex-col
          ${isDark ? "bg-gray-900" : "bg-white"}
        `}>
          {/* Mobile overlay */}
          {isSidebarOpen && (
            <div 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
            />
          )}

          {activeTicket ? (
            <div className="flex-1 overflow-hidden animate-fade-in">
       <Chat
  ticket={activeTicket}
  messages={messages}
  onSendMessage={sendMessage}
  showAssignment={true}
  staffList={staffList}
  showStatus={true}
  isDark={isDark}
  allowedStatuses={
    ALLOWED_STATUS_TRANSITIONS[activeTicket.status] || []
  }
  onAssigneeChange={(staffId) =>
    assignStaff(activeTicket._id, staffId)
  }
  onStatusChange={(status) =>
    updateTicketStatus(activeTicket._id, status)
  }
/>



            </div>
          ) : loading ? (
            <div className="flex-1 p-4 space-y-3 animate-pulse">
              <div className={`h-12 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`} />
              <div className={`h-24 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`} />
              <div className={`h-24 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`} />
              <div className={`h-24 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 animate-fade-in">
              <div className={`max-w-sm p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Sparkles className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <h3 className={`text-2xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Admin Support Dashboard
                </h3>
                <p className={`text-lg text-center mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Select a ticket to start managing customer support
                </p>
                <div className="flex items-center justify-center gap-3 text-base">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    <span>Open: {stats.open}</span>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span>Assigned: {stats.assigned}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(8px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
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
        
        /* Custom scrollbar */
        .overflow-y-auto {
          scrollbar-width: thin;
        }
        
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: ${isDark ? '#374151' : '#f3f4f6'};
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: ${isDark ? '#4b5563' : '#d1d5db'};
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#6b7280' : '#9ca3af'};
        }
      `}</style>
    </div>
  );
};

export default Tickets;
