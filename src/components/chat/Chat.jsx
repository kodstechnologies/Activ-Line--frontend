import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { 
  Send, 
  User, 
  ChevronDown, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  MoreVertical, 
  Smile, 
  Paperclip,
  Mic,
  Bot,
  Sparkles,
  Zap,
  Star,
  ThumbsUp,
  Download,
  Image as ImageIcon,
  FileText,
  Video,
  Pin,
  Copy,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Tag,
  MessageSquare,
  BarChart2,
  Shield,
  Globe,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  Link,
  Hash,
  TrendingUp,
  Crown,
  Coffee,
  Rocket,
  Feather,
  X,
  Upload,
  ListFilter
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../api/axios";
import { socket } from "../../socket/socket";

const Chat = ({
  ticket, // active selected ticket
  userTickets = [], // all tickets for dropdown
  onTicketSelect, // handle dropdown change
  messages = [],
  onSendMessage,
  showAssignment,
  staffList = [],
  showStatus,
  onAssigneeChange,
  onStatusChange,
  isDark = false,
  customerEmail,
  customerPhone,
  createdAt
}) => {
  const { isDark: themeDark, toggleTheme } = useTheme();
  const darkMode = isDark || themeDark;
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const [messageStats, setMessageStats] = useState({
    total: 0,
    agent: 0,
    customer: 0
  });

  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    const urls = selectedFiles.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setPreviewUrls(urls);

    return () => {
      urls.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [selectedFiles]);

  const handleFileSelect = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    const files = Array.from(e.target.files).filter(file => {
      if (file.size > MAX_SIZE) {
        alert(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFile = (file) => {
    window.open(file.url, "_blank");
  };

  const downloadFile = (file) => {
    const downloadUrl = file.url.replace(
      "/upload/",
      "/upload/fl_attachment/"
    );

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        setSelectedFiles(prev => [...prev, ...files]);
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
    const agentMsgs = messages.filter(m => ["ADMIN", "ADMIN_STAFF", "SUPER_ADMIN"].includes(m.senderRole)).length;
    const customerMsgs = messages.filter(m => !["ADMIN", "ADMIN_STAFF", "SUPER_ADMIN", "SYSTEM"].includes(m.senderRole)).length;
    setMessageStats({
      total: messages.length,
      agent: agentMsgs,
      customer: customerMsgs
    });
  }, [messages, ticket]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
       messagesEndRef.current?.scrollIntoView({ 
         behavior: "smooth",
         block: "nearest"
       });
    }, 100);
  }, []);

  const send = useCallback(async () => {
    if ((!inputMsg.trim() && selectedFiles.length === 0) || !ticket?._id) return;

    const attachments = await Promise.all(
      selectedFiles.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          buffer: Array.from(uint8Array),
        };
      })
    );

    onSendMessage({ message: inputMsg || "", attachments });

    setInputMsg("");
    setSelectedFiles([]);
  }, [inputMsg, selectedFiles, ticket?._id, onSendMessage]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }, [send]);

  const ALLOWED_STATUS_TRANSITIONS = {
    OPEN: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    ASSIGNED: ["IN_PROGRESS", "RESOLVED", "CLOSED","OPEN"],
    IN_PROGRESS: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
    RESOLVED: ["RESOLVED", "OPEN", "IN_PROGRESS", "CLOSED"],
    CLOSED: ["CLOSED"],
  };

  const getStatusStyles = (status) => {
    const base = "text-xs px-3 py-1.5 rounded-full font-medium inline-flex items-center gap-1.5 transition-all duration-500 transform hover:scale-105";
    
    if (darkMode) {
      switch(status?.toLowerCase()) {
        case 'open': return `${base} bg-gradient-to-r from-blue-500/20 via-blue-600/20 to-cyan-500/20 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/20`;
        case 'pending': 
        case 'in_progress': return `${base} bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/20`;
        case 'resolved': return `${base} bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/20`;
        case 'closed': return `${base} bg-gradient-to-r from-gray-800 via-gray-900 to-gray-950 text-gray-300 border border-gray-700 shadow-lg shadow-gray-900/30`;
        default: return `${base} bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-rose-500/20 text-purple-300 border border-purple-500/40`;
      }
    } else {
      switch(status?.toLowerCase()) {
        case 'open': return `${base} bg-gradient-to-r from-blue-50 via-blue-100 to-cyan-50 text-blue-700 border border-blue-300 shadow-lg shadow-blue-500/20`;
        case 'pending':
        case 'in_progress': return `${base} bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 text-amber-700 border border-amber-300 shadow-lg shadow-amber-500/20`;
        case 'resolved': return `${base} bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 text-emerald-700 border border-emerald-300 shadow-lg shadow-emerald-500/20`;
        case 'closed': return `${base} bg-gradient-to-r from-gray-50 via-gray-100 to-gray-150 text-gray-700 border border-gray-300 shadow-lg shadow-gray-500/10`;
        default: return `${base} bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 text-purple-700 border border-purple-300`;
      }
    }
  };

  const getStatusIcon = (status) => {
    const iconClass = "w-3.5 h-3.5";
    switch(status?.toLowerCase()) {
      case 'open': return <AlertCircle className={iconClass} />;
      case 'pending': 
      case 'in_progress': return <Clock className={iconClass} />;
      case 'resolved': return <CheckCircle className={iconClass} />;
      case 'closed': return <CheckCircle className={iconClass} />;
      default: return <AlertCircle className={iconClass} />;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const togglePinMessage = (messageId) => {
    setPinnedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  /* ----- GROUP AND REORDER MESSAGES ----- */
  const orderedMessageGroups = useMemo(() => {
    const groups = {};
    messages.forEach(m => {
       if (!groups[m.roomId]) groups[m.roomId] = [];
       groups[m.roomId].push(m);
    });

    // 1. Get all non-active groups and sort them by their LATEST message
    const nonActiveGroups = Object.keys(groups)
      .filter(id => id !== ticket?._id)
      .map(id => ({
         roomId: id,
         messages: groups[id].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))
      }));

    nonActiveGroups.sort((a, b) => {
      const aLatest = new Date(a.messages[a.messages.length - 1].createdAt);
      const bLatest = new Date(b.messages[b.messages.length - 1].createdAt);
      return aLatest - bLatest;
    });

    // 2. Pin the ACTIVE ticket to the absolute bottom
    const result = [...nonActiveGroups];
    if (ticket?._id && groups[ticket._id]) {
       result.push({
          roomId: ticket._id,
          messages: groups[ticket._id].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))
       });
    }

    return result;
  }, [messages, ticket?._id]);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'} flex flex-col overflow-hidden transition-all duration-700 ${
      darkMode 
        ? "bg-gradient-to-br from-gray-900 via-gray-950 to-black" 
        : "bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50"
    } relative backdrop-blur-sm`}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-10 left-10 w-96 h-96 rounded-full blur-3xl opacity-20 ${
          darkMode ? 'bg-blue-500/10' : 'bg-blue-400/10'
        }`}></div>
        <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-20 ${
          darkMode ? 'bg-purple-500/10' : 'bg-purple-400/10'
        }`}></div>
      </div>

      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center border-2 border-blue-500 border-dashed m-4 rounded-2xl animate-pulse">
          <div className="text-center p-10 rounded-3xl bg-gray-900/80 shadow-2xl">
            <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <p className="text-blue-300 font-bold text-2xl">Drop files to attach</p>
            <p className="text-gray-400 mt-2">Images and PDFs supported</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className={`p-4 sm:p-5 border-b flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 sm:gap-4 relative z-20 ${
        darkMode 
          ? "border-gray-800/50 bg-gradient-to-r from-gray-900/90 via-gray-950/90 to-black/90 backdrop-blur-xl" 
          : "border-gray-200/50 bg-gradient-to-r from-white/90 via-blue-50/90 to-white/90 backdrop-blur-xl"
      } shadow-2xl shadow-black/10`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-start sm:items-center gap-3 mb-2 sm:mb-3">
            <div className="relative group flex-shrink-0">
              <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-12 ${
                darkMode 
                  ? 'bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm' 
                  : 'bg-gradient-to-br from-blue-100 to-cyan-100'
              } shadow-lg`}>
                <User className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-500 ${
                  darkMode ? 'text-blue-400 group-hover:text-cyan-300' : 'text-blue-600 group-hover:text-cyan-500'
                }`} />
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Hash className={`w-3 h-3 sm:w-4 sm:h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className={`font-bold text-base sm:text-lg truncate bg-gradient-to-r bg-clip-text text-transparent ${
                  darkMode 
                    ? "from-blue-300 via-cyan-300 to-blue-300" 
                    : "from-blue-600 via-cyan-600 to-blue-600"
                }`}>
                  #{ticket?.ticketId || "N/A"} • {ticket?.customerName || "Customer"}
                  <Crown className="inline-block w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 text-yellow-500" />
                </h3>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 ${
                  darkMode 
                    ? 'bg-gray-800/50 hover:bg-gray-800' 
                    : 'bg-blue-50 hover:bg-blue-100'
                } shadow-sm`}>
                  <MessageSquare className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <p className={`text-xs sm:text-sm font-medium truncate max-w-[150px] sm:max-w-none ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {ticket?.issue || "Premium Support"}
                  </p>
                </div>
                
                <div className="hidden sm:flex items-center gap-2">
                  {customerEmail && (
                    <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm group ${
                      darkMode 
                        ? 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:from-blue-900/30 hover:to-blue-800/30' 
                        : 'bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100'
                    }`}>
                      <Mail className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-125" />
                      <span className="text-xs font-medium truncate max-w-[150px]">{customerEmail}</span>
                    </div>
                  )}
                  {customerPhone && (
                    <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm group ${
                      darkMode 
                        ? 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:from-emerald-900/30 hover:to-emerald-800/30' 
                        : 'bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100'
                    }`}>
                      <Phone className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-125" />
                      <span className="text-xs font-medium">{customerPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {createdAt && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calendar className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Created: {formatDate(createdAt)}
                </p>
              </div>
              
              <div className="hidden sm:block h-4 w-px bg-gray-600/30"></div>
              
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                <BarChart2 className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div className="flex items-center gap-1">
                  <span className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{messageStats.agent}</span>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>agent</span>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
                  <span className={`text-xs ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{messageStats.customer}</span>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>customer</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2 lg:mt-0 flex-wrap">
          {showAssignment && (
            <div className="relative group flex-1 min-w-[180px] sm:min-w-[200px]">
              <select
                value={ticket?.assignedTo || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  onAssigneeChange?.(value || null);
                }}
                className={`appearance-none pl-9 sm:pl-11 pr-7 sm:pr-9 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg sm:rounded-xl border transition-all duration-500 w-full ${
                  darkMode 
                    ? "bg-gradient-to-r from-gray-800/90 to-gray-900/90 border-gray-700 text-white hover:from-gray-700/90 hover:to-gray-800/90" 
                    : "bg-gradient-to-r from-white/90 to-blue-50/90 border-gray-300 text-gray-900 hover:from-white hover:to-blue-100"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-lg backdrop-blur-sm cursor-pointer`}
              >
                <option value="" className={`${darkMode ? 'bg-gray-900' : 'bg-white'}`}>🎯 Assign to...</option>
                {staffList.map(s => (
                  <option key={s._id} value={s._id} className={`${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                    👤 {s.name}
                  </option>
                ))}
              </select>
              <User className={`absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-500 ${
                darkMode ? 'text-blue-400 group-hover:text-cyan-300' : 'text-blue-500'
              }`} />
              <ChevronDown className={`absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-500 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              } group-hover:rotate-180`} />
            </div>
          )}

          {showStatus && (
            <div className="relative group flex-1 min-w-[180px] sm:min-w-[200px]">
              <select
                value={ticket?.status || ""}
                disabled={ticket?.status === "CLOSED"}
                onChange={(e) => onStatusChange?.(e.target.value)}
                className={`appearance-none pl-9 sm:pl-11 pr-7 sm:pr-9 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg sm:rounded-xl border transition-all duration-500 w-full ${
                  darkMode
                    ? "bg-gradient-to-r from-gray-800/90 to-gray-900/90 border-gray-700 text-white hover:from-gray-700/90 hover:to-gray-800/90"
                    : "bg-gradient-to-r from-white/90 to-blue-50/90 border-gray-300 text-gray-900 hover:from-white hover:to-blue-100"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg backdrop-blur-sm cursor-pointer`}
              >
                {(ALLOWED_STATUS_TRANSITIONS[ticket?.status] || []).map(status => (
                  <option key={status} value={status} className={`${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                    {status === "OPEN" ? "🚀 " : status === "IN_PROGRESS" ? "⚡ " : status === "RESOLVED" ? "✅ " : "🔒 "}
                    {status.replace("_", " ")}
                  </option>
                ))}
              </select>
              <div className={`absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 transition-all duration-500 ${
                getStatusStyles(ticket?.status).includes('blue') ? 'text-blue-400' : 
                getStatusStyles(ticket?.status).includes('amber') ? 'text-amber-400' : 
                getStatusStyles(ticket?.status).includes('emerald') ? 'text-emerald-400' : 
                'text-gray-400'
              }`}>
                {getStatusIcon(ticket?.status)}
              </div>
              <ChevronDown className={`absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-500 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              } group-hover:rotate-180`} />
            </div>
          )}
        </div>
      </div>

      {pinnedMessages.length > 0 && (
        <div className={`px-4 sm:px-5 py-2 sm:py-3 border-b flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide relative z-10 ${
          darkMode 
            ? 'bg-gradient-to-r from-amber-900/20 via-yellow-900/10 to-amber-800/10 border-amber-800/30' 
            : 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100 border-amber-200'
        } shadow-lg`}>
          <Pin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
          <span className={`text-xs font-bold ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
            📌 Pinned ({pinnedMessages.length})
          </span>
          <div className="flex-1"></div>
          <button 
            type="button"
            onClick={() => setPinnedMessages([])}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
              darkMode 
                ? 'text-gray-400 hover:text-amber-300 hover:bg-gray-800/50' 
                : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
            }`}>
            Clear
          </button>
        </div>
      )}

      <div 
        ref={messagesContainerRef}
        className={`flex-1 flex flex-col overflow-y-auto premium-scrollbar p-4 sm:p-6 space-y-6 sm:space-y-8 overscroll-contain scroll-smooth relative z-10 transition-all duration-500`}
      >
        {/* Spacer to push messages to the bottom */}
        <div className="flex-1 min-h-[0px]"></div>

        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center">
            <div className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 transition-all duration-700 hover:scale-[1.02] relative overflow-hidden ${
              darkMode 
                ? 'bg-gradient-to-br from-gray-900/60 via-gray-950/60 to-black/60 backdrop-blur-xl' 
                : 'bg-gradient-to-br from-white/80 via-blue-50/80 to-white/80 backdrop-blur-xl'
            } shadow-2xl`}>
              <div className="relative">
                <div className="relative w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6">
                  <Bot className={`w-full h-full ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                  <Sparkles className={`absolute -top-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                  <Sparkles className={`absolute -bottom-1 -left-1 w-4 h-4 sm:w-6 sm:h-6 ${darkMode ? 'text-cyan-400' : 'text-cyan-500'}`} />
                </div>
                
                <h3 className={`text-xl sm:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r bg-clip-text text-transparent ${
                  darkMode 
                    ? "from-blue-300 via-cyan-300 to-purple-300" 
                    : "from-blue-600 via-cyan-600 to-purple-600"
                }`}>
                  ✨ Premium Chat ✨
                </h3>
                
                <p className={`max-w-md text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Start an amazing conversation with <span className="font-bold text-blue-400">{ticket?.customerName || "Customer"}</span>.
                </p>
                
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl text-center transition-all duration-300 hover:scale-105 ${
                    darkMode ? 'bg-gray-800/50' : 'bg-blue-50'
                  }`}>
                    <Zap className={`w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 sm:mb-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                    <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Instant Replies</p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl text-center transition-all duration-300 hover:scale-105 ${
                    darkMode ? 'bg-gray-800/50' : 'bg-emerald-50'
                  }`}>
                    <Shield className={`w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 sm:mb-2 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
                    <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Secure & Encrypted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {orderedMessageGroups.map((group, groupIndex) => {
           const groupTicket = userTickets.find(t => t._id === group.roomId);
           const displayTicketId = groupTicket?.ticketId || group.roomId.slice(-6);
           const isGroupDone = ["RESOLVED", "CLOSED"].includes(groupTicket?.status);

           // Zig-zag background applied per-group when that ticket is RESOLVED or CLOSED
           const groupClosedStyle = isGroupDone
             ? {
                 backgroundColor: darkMode
                   ? "rgba(16, 185, 129, 0.04)"
                   : "rgba(209, 250, 229, 0.60)",
                 backgroundImage: darkMode
                   ? `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(16, 185, 129, 0.10) 10px, rgba(16, 185, 129, 0.10) 20px)`
                   : `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(16, 185, 129, 0.18) 10px, rgba(16, 185, 129, 0.18) 20px)`,
               }
             : {};

           return (
             <div
               key={`group-${group.roomId}`}
               className={`space-y-6 sm:space-y-8 rounded-2xl transition-all duration-500 ${
                 isGroupDone ? "p-3 sm:p-4" : ""
               }`}
               style={groupClosedStyle}
             >
               <div className="flex justify-center my-6 sm:my-8 sticky top-4 z-20">
                 <div className={`text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full backdrop-blur-xl border transition-all duration-500 hover:scale-105 shadow-lg flex items-center gap-3 ${
                   group.roomId === ticket?._id
                     ? darkMode 
                         ? 'bg-blue-900/80 border-blue-500 text-blue-200 shadow-blue-500/20' 
                         : 'bg-blue-100 border-blue-400 text-blue-800 shadow-blue-500/20'
                     : darkMode
                         ? 'bg-gray-900/90 border-gray-700 text-gray-300'
                         : 'bg-white/90 border-gray-300 text-gray-600'
                 }`}>
                   <Tag className="w-4 h-4" />
                   <span className="font-bold">Ticket #{displayTicketId}</span>
                   <span className="opacity-50">|</span>
                   <Calendar className="w-4 h-4" />
                   <span>{formatDate(group.messages[0]?.createdAt || new Date())}</span>
                 </div>
               </div>

               {group.messages.map((msg, index) => {
                  const isAgent = ["ADMIN", "ADMIN_STAFF", "SUPER_ADMIN"].includes(msg.senderRole);
                  const isSystem = msg.senderRole === "SYSTEM";
                  const isPinned = pinnedMessages.includes(msg._id);

                  if (isSystem) {
                    return (
                      <div key={msg._id} className="flex justify-center">
                        <div className={`text-xs sm:text-sm px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border flex items-center gap-3 sm:gap-4 max-w-full sm:max-w-md backdrop-blur-xl ${
                          darkMode 
                            ? 'bg-gradient-to-r from-gray-900/60 to-gray-950/60 border-gray-800 text-gray-300' 
                            : 'bg-gradient-to-r from-gray-100/80 to-white/80 border-gray-300 text-gray-600'
                        } shadow-2xl transition-all duration-500 hover:scale-[1.02]`}>
                          <div className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                          </div>
                          <span className="flex-1 text-sm sm:text-base">{msg.message}</span>
                          <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <MessageBubble 
                      key={msg._id}
                      msg={msg}
                      isAgent={isAgent}
                      isPinned={isPinned}
                      darkMode={darkMode}
                      formatTime={formatTime}
                      togglePinMessage={togglePinMessage}
                      copyToClipboard={copyToClipboard}
                      downloadFile={downloadFile}
                    />
                  );
               })}
             </div>
           );
        })}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl max-w-[85%] sm:max-w-[70%] backdrop-blur-xl shadow-2xl ${
              darkMode 
                ? 'bg-gradient-to-br from-gray-900/60 to-gray-950/60' 
                : 'bg-gradient-to-br from-white/80 to-blue-50/80 border border-gray-300'
            }`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                  <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                  <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                </div>
                <span className={`text-xs sm:text-sm font-medium ml-1 sm:ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {ticket?.customerName || "Customer"} is typing...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* ─── BOTTOM BAR: DROPDOWN & INPUT ─── */}
      <div className={`p-4 sm:p-5 border-t transition-all duration-500 relative z-20 ${
        darkMode
          ? "border-gray-800/50 bg-gradient-to-t from-gray-900/95 via-gray-950/95 to-black/95 backdrop-blur-xl"
          : "border-gray-200/50 bg-gradient-to-t from-white/95 via-blue-50/95 to-white/95 backdrop-blur-xl"
      } shadow-2xl`}>

        {/* ACTIVE TICKET DROPDOWN - ALWAYS VISIBLE */}
        {userTickets && userTickets.length > 0 && onTicketSelect && (
          <div className="mb-3 flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Replying To:
            </span>
            <div className="relative group w-2/3 max-w-sm">
              <select
                value={ticket?._id || ""}
                onChange={(e) => onTicketSelect(e.target.value)}
                className={`appearance-none pl-9 pr-8 py-2 text-sm rounded-lg border transition-all w-full ${
                  darkMode 
                    ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700" 
                    : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer shadow-sm`}
              >
                {userTickets.filter(t => ["OPEN", "IN_PROGRESS"].includes(t.status)).map(t => (
                  <option key={t._id} value={t._id} className={`${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                    Ticket #{t.ticketId} ({t.status.replace("_", " ")})
                  </option>
                ))}
                {userTickets.filter(t => !["OPEN", "IN_PROGRESS"].includes(t.status)).map(t => (
                  <option key={t._id} value={t._id} disabled className={`${darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                    Ticket #{t.ticketId} ({t.status}) - Closed
                  </option>
                ))}
              </select>
              <ListFilter className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                darkMode ? 'text-blue-400' : 'text-blue-500'
              }`} />
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-transform ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              } group-hover:rotate-180`} />
            </div>
          </div>
        )}

        {ticket?.status === "CLOSED" ? (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
            darkMode
              ? "bg-emerald-900/30 border-emerald-700/40 text-emerald-300"
              : "bg-emerald-100 border-emerald-300 text-emerald-700"
          }`}>
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-semibold">This active ticket is closed — select an open ticket to reply</span>
          </div>
        ) : (
          <>
            {/* Preview Area */}
            {selectedFiles.length > 0 && (
              <div className={`-mx-4 sm:-mx-5 px-4 sm:px-5 pb-4 mb-4 border-b ${darkMode ? 'border-gray-800/50' : 'border-gray-200/50'} animate-in slide-in-from-bottom-2 duration-200`}>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className={`relative flex-shrink-0 w-24 h-24 rounded-xl border overflow-hidden group/preview shadow-sm ${
                        darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      {previewUrls[idx]?.file.type.startsWith("image/") ? (
                        <img src={previewUrls[idx].url} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                          <FileText className="w-8 h-8 text-blue-500 mb-1.5" />
                          <span className={`text-[10px] leading-tight line-clamp-2 w-full break-all ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}>
                            {previewUrls[idx]?.file.name}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover/preview:opacity-100 transition-opacity hover:bg-red-500 backdrop-blur-sm"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex items-end gap-3"
            >
              <div className="flex-1 relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className={`absolute left-3 bottom-3 p-1.5 rounded-lg transition ${
                    darkMode
                      ? "text-gray-400 hover:text-blue-400"
                      : "text-gray-500 hover:text-blue-600"
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <textarea
                  ref={inputRef}
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onPaste={handlePaste}
                  placeholder={selectedFiles.length > 0 ? "Add a caption..." : "Type your message..."}
                  rows={1}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl resize-none transition-all duration-300 ${
                    darkMode
                      ? "bg-gray-900 text-white placeholder-gray-500 border border-gray-800"
                      : "bg-white text-gray-900 placeholder-gray-400 border border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  style={{ maxHeight: "120px", minHeight: "48px" }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!inputMsg.trim() && selectedFiles.length === 0}
                className={`p-3 rounded-xl transition-all ${
                  inputMsg.trim() || selectedFiles.length > 0
                    ? "bg-blue-600 text-white hover:scale-110"
                    : "bg-gray-300 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Send className="w-5 h-5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                hidden
                onChange={handleFileSelect}
              />
            </form>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 sm:mt-4 text-xs gap-2 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Press Enter to send
                </span>
                <span className={`hidden sm:block ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>•</span>
                <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Feather className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Shift + Enter for new line
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MessageBubble = ({ 
  msg, 
  isAgent, 
  isPinned, 
  darkMode, 
  formatTime, 
  togglePinMessage, 
  copyToClipboard,
  downloadFile
}) => {
  return (
    <div className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
      <div className={`group relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl max-w-[90%] sm:max-w-[85%] md:max-w-[70%] transition-all duration-700 hover:scale-[1.01] ${
        isPinned ? 'ring-2 ring-amber-500/50 shadow-2xl' : ''
      } ${
        isAgent 
          ? darkMode 
            ? "bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white rounded-br-none shadow-2xl" 
            : "bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400 text-white rounded-br-none shadow-2xl"
          : darkMode
            ? "bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-100 rounded-bl-none shadow-2xl"
            : "bg-gradient-to-br from-white via-gray-50 to-blue-50 text-gray-900 border border-gray-200 rounded-bl-none shadow-lg"
      }`}>
        <div className={`absolute -top-3 ${isAgent ? '-left-8 sm:-left-12' : '-right-8 sm:-right-12'} 
          flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500`}>
          <button
            type="button"
            onClick={() => copyToClipboard(msg.message)}
            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-125 hover:rotate-12 ${
              darkMode 
                ? 'bg-gray-900 text-gray-400 hover:text-blue-400 hover:bg-gray-800' 
                : 'bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            } shadow-lg`}
            title="Copy message"
          >
            <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        {/* Attachments */}
        {msg.attachments?.length > 0 && (
          <div className={`grid grid-cols-1 gap-2 ${msg.message ? 'mb-2' : ''}`}>
            {msg.attachments.map((file, idx) => (
              <div key={idx}>
                {file.type?.startsWith("image") ? (
                  <div className="relative group/image">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="rounded-lg max-h-60 w-full object-cover cursor-pointer border border-gray-200 dark:border-gray-700"
                      onClick={() => window.open(file.url, "_blank")}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file);
                      }}
                      className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity backdrop-blur-sm"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      darkMode
                        ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(file.url, "_blank")}>
                      <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {file.name}
                      </p>
                      <p className="text-xs opacity-70 uppercase">{file.type?.split('/')[1] || 'FILE'}</p>
                    </div>
                    <button
                      onClick={() => downloadFile(file)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode 
                          ? "hover:bg-gray-700 text-gray-400 hover:text-white" 
                          : "hover:bg-gray-200 text-gray-500 hover:text-gray-900"
                      }`}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message Text */}
        {msg.message && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-sm sm:text-base">
            {msg.message}
          </p>
        )}
        
        <div className={`text-xs mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 ${
          isAgent 
            ? "text-blue-200/80" 
            : darkMode 
              ? "text-gray-400" 
              : "text-gray-500"
        }`}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span>{formatTime(msg.createdAt)}</span>
            {isAgent && (
              <span className="text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-white/20">
                👑 Agent
              </span>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .premium-scrollbar { scrollbar-width: thin; }
        .premium-scrollbar::-webkit-scrollbar { width: 6px; }
        .premium-scrollbar::-webkit-scrollbar-track {
          background: transparent !important;
          background-color: transparent !important;
        }
        .premium-scrollbar::-webkit-scrollbar-thumb {
          background: ${darkMode ? "#4b5563" : "#d1d5db"};
          border-radius: 3px;
        }
        .premium-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? "#6b7280" : "#9ca3af"};
        }
      `}</style>
    </div>
  );
};

export default Chat;
