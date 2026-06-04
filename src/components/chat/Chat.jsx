import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Send,
  User,
  ChevronDown,
  ChevronLeft,
  Info,
  AlertCircle,
  Clock,
  CheckCircle,
  Paperclip,
  Bot,
  Sparkles,
  Zap,
  Download,
  FileText,
  Pin,
  Copy,
  Phone,
  Mail,
  Calendar,
  Tag,
  MessageSquare,
  BarChart2,
  Shield,
  Globe,
  Hash,
  Crown,
  Feather,
  X,
  Upload,
  ListFilter,
  Search,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useTheme } from "../../context/ThemeContext";

const Chat = ({
  ticket, // active selected ticket
  userTickets = [], // all tickets for dropdown
  onTicketSelect, // handle dropdown change
  messages = [],
  onSendMessage,
  showAssignment,
  staffList = [],
  staffStats = {},
  showStatus,
  onAssigneeChange,
  onStatusChange,
  isDark = false,
  customerEmail,
  customerPhone,
  createdAt,
  loading = false,
  selectableStatuses = ["OPEN", "IN_PROGRESS"],
  zigzagStatuses = ["RESOLVED"],
  onBack, // handle back button toggle on mobile
}) => {
  const { isDark: themeDark } = useTheme();
  const darkMode = isDark || themeDark;
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isReplyToExpanded, setIsReplyToExpanded] = useState(false);
  const [isTicketListOpen, setIsTicketListOpen] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [isFullscreen] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const ticketListRef = useRef(null);

  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [isAssigneeLoading, setIsAssigneeLoading] = useState(false);
  const [assigningStaffId, setAssigningStaffId] = useState(null);

  const handleAssigneeChange = async (staffId) => {
    setAssigningStaffId(staffId);
    setIsAssigneeLoading(true);
    try {
      await onAssigneeChange?.(staffId || null);
      setIsStaffModalOpen(false);
    } catch (err) {
      console.error("Assignee update error:", err);
    } finally {
      setIsAssigneeLoading(false);
      setAssigningStaffId(null);
    }
  };

  const [messageStats, setMessageStats] = useState({
    total: 0,
    agent: 0,
    customer: 0,
  });

  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    const urls = selectedFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPreviewUrls(urls);

    return () => {
      urls.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [selectedFiles]);

  const handleFileSelect = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    const files = Array.from(e.target.files).filter((file) => {
      if (file.size > MAX_SIZE) {
        alert(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadFile = (file) => {
    const downloadUrl = file.url.replace("/upload/", "/upload/fl_attachment/");

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

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
      setSelectedFiles((prev) => [...prev, ...files]);
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
        setSelectedFiles((prev) => [...prev, ...files]);
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
    const agentMsgs = messages.filter((m) =>
      ["ADMIN", "ADMIN_STAFF", "SUPER_ADMIN"].includes(m.senderRole),
    ).length;
    const customerMsgs = messages.filter(
      (m) =>
        !["ADMIN", "ADMIN_STAFF", "SUPER_ADMIN", "SYSTEM"].includes(
          m.senderRole,
        ),
    ).length;
    setMessageStats({
      total: messages.length,
      agent: agentMsgs,
      customer: customerMsgs,
    });
  }, [messages, ticket]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        ticketListRef.current &&
        !ticketListRef.current.contains(event.target)
      ) {
        setIsTicketListOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  }, []);

  const send = useCallback(async () => {
    if ((!inputMsg.trim() && selectedFiles.length === 0) || !ticket?._id)
      return;

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
      }),
    );

    onSendMessage({ message: inputMsg || "", attachments });

    setInputMsg("");
    setSelectedFiles([]);
  }, [inputMsg, selectedFiles, ticket?._id, onSendMessage]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    [send],
  );

  const ALLOWED_STATUS_TRANSITIONS = {
    OPEN: ["OPEN", "IN_PROGRESS", "RESOLVED"],
    ASSIGNED: ["IN_PROGRESS", "RESOLVED", "OPEN"],
    IN_PROGRESS: ["IN_PROGRESS", "RESOLVED"],
    RESOLVED: ["RESOLVED", "OPEN", "IN_PROGRESS"],
  };

  const getStatusStyles = (status) => {
    const base =
      "text-xs px-3 py-1.5 rounded-full font-medium inline-flex items-center gap-1.5 transition-all duration-500 transform hover:scale-105";

    if (darkMode) {
      switch (status?.toLowerCase()) {
        case "open":
          return `${base} bg-gradient-to-r from-blue-500/20 via-blue-600/20 to-cyan-500/20 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/20`;
        case "pending":
        case "in_progress":
          return `${base} bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/20`;
        case "resolved":
          return `${base} bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/20`;
        case "closed":
          return `${base} bg-gradient-to-r from-gray-800 via-gray-900 to-gray-950 text-gray-300 border border-gray-700 shadow-lg shadow-gray-900/30`;
        default:
          return `${base} bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-rose-500/20 text-purple-300 border border-purple-500/40`;
      }
    } else {
      switch (status?.toLowerCase()) {
        case "open":
          return `${base} bg-gradient-to-r from-blue-50 via-blue-100 to-cyan-50 text-blue-700 border border-blue-300 shadow-lg shadow-blue-500/20`;
        case "pending":
        case "in_progress":
          return `${base} bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 text-amber-700 border border-amber-300 shadow-lg shadow-amber-500/20`;
        case "resolved":
          return `${base} bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 text-emerald-700 border border-emerald-300 shadow-lg shadow-emerald-500/20`;
        case "closed":
          return `${base} bg-gradient-to-r from-gray-50 via-gray-100 to-gray-150 text-gray-700 border border-gray-300 shadow-lg shadow-gray-500/10`;
        default:
          return `${base} bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 text-purple-700 border border-purple-300`;
      }
    }
  };

  const getStatusIcon = (status) => {
    const iconClass = "w-3.5 h-3.5";
    switch (status?.toLowerCase()) {
      case "open":
        return <AlertCircle className={iconClass} />;
      case "pending":
      case "in_progress":
        return <Clock className={iconClass} />;
      case "resolved":
        return <CheckCircle className={iconClass} />;
      case "closed":
        return <CheckCircle className={iconClass} />;
      default:
        return <AlertCircle className={iconClass} />;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  /* ----- GROUP AND REORDER MESSAGES ----- */
  const orderedMessageGroups = useMemo(() => {
    const groups = {};
    messages.forEach((m) => {
      if (!groups[m.roomId]) groups[m.roomId] = [];
      groups[m.roomId].push(m);
    });

    // 1. Get all non-active groups and sort them by their LATEST message
    const nonActiveGroups = Object.keys(groups)
      .filter((id) => id !== ticket?._id)
      .map((id) => ({
        roomId: id,
        messages: groups[id].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        ),
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
        messages: groups[ticket._id].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        ),
      });
    }

    return result;
  }, [messages, ticket?._id]);

  return (
    <div
      className={`${isFullscreen ? "fixed inset-0 z-50" : "h-full"} min-h-0 min-w-0 flex flex-col overflow-hidden transition-all duration-700 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-950 to-black"
          : "bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50"
      } relative backdrop-blur-sm`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 hidden sm:block overflow-hidden pointer-events-none">
        <div
          className={`absolute top-10 left-10 w-96 h-96 rounded-full blur-3xl opacity-20 ${
            darkMode ? "bg-blue-500/10" : "bg-blue-400/10"
          }`}
        ></div>
        <div
          className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-20 ${
            darkMode ? "bg-purple-500/10" : "bg-purple-400/10"
          }`}
        ></div>
      </div>

      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center border-2 border-blue-500 border-dashed m-2 sm:m-4 rounded-xl sm:rounded-2xl animate-pulse">
          <div className="text-center p-5 sm:p-10 rounded-2xl sm:rounded-3xl bg-gray-900/80 shadow-2xl max-w-[calc(100%-2rem)]">
            <Upload className="w-10 h-10 sm:w-16 sm:h-16 text-blue-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-blue-300 font-bold text-lg sm:text-2xl">
              Drop files to attach
            </p>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              Images and PDFs supported
            </p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div
        onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
        className={`border-b flex flex-col 2xl:flex-row 2xl:justify-between 2xl:items-center gap-3 sm:gap-4 relative z-20 shrink-0 cursor-pointer select-none transition-all duration-300 ${
          isHeaderExpanded ? "p-3 sm:p-4 2xl:p-5" : "p-2.5 sm:p-3"
        } ${
          darkMode
            ? "border-gray-800/50 bg-gradient-to-r from-gray-900/90 via-gray-950/90 to-black/90 backdrop-blur-xl"
            : "border-gray-200/50 bg-gradient-to-r from-white/90 via-blue-50/90 to-white/90 backdrop-blur-xl"
        } shadow-2xl shadow-black/10`}
      >
        <div className="flex-1 min-w-0">
          <div
            className={`flex items-start sm:items-center gap-2.5 sm:gap-3 transition-all duration-300 ${isHeaderExpanded ? "mb-2 sm:mb-3" : "mb-0"}`}
          >
            {onBack && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBack();
                }}
                className={`lg:hidden p-2 rounded-xl transition-all border shrink-0 ${
                  darkMode
                    ? "border-gray-800 text-gray-300 hover:bg-gray-800"
                    : "border-gray-200 text-gray-700 hover:bg-gray-105 shadow-sm"
                }`}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            <div className="relative group flex-shrink-0">
              <div
                className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-12 ${
                  darkMode
                    ? "bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm"
                    : "bg-gradient-to-br from-blue-100 to-cyan-100"
                } shadow-lg`}
              >
                <User
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-500 ${
                    darkMode
                      ? "text-blue-400 group-hover:text-cyan-300"
                      : "text-blue-600 group-hover:text-cyan-500"
                  }`}
                />
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 mb-1 min-w-0">
                <Hash
                  className={`w-3 h-3 sm:w-4 sm:h-4 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                />
                <h3
                  className={`font-bold text-sm sm:text-base lg:text-lg truncate bg-gradient-to-r bg-clip-text text-transparent min-w-0 ${
                    darkMode
                      ? "from-blue-300 via-cyan-300 to-blue-300"
                      : "from-blue-600 via-cyan-600 to-blue-600"
                  }`}
                >
                  #{ticket?.ticketId || "N/A"} •{" "}
                  {ticket?.customerName || "Customer"}
                </h3>
                <Crown className="inline-block w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 shrink-0" />
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 text-gray-400 ${
                    isHeaderExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* <div
                className={`${isHeaderExpanded ? "flex" : "hidden"} items-center gap-2 sm:gap-3 flex-wrap`}
              >
                <div
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 ${
                    darkMode
                      ? "bg-gray-800/50 hover:bg-gray-800"
                      : "bg-blue-50 hover:bg-blue-100"
                  } shadow-sm`}
                >
                  <MessageSquare
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                  />
                  <p
                    className={`text-xs sm:text-sm font-medium truncate max-w-[10rem] sm:max-w-[18rem] 2xl:max-w-none ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {ticket?.issue || "Premium Support"}
                  </p>
                </div>

                <div className="hidden md:flex items-center gap-2 min-w-0">
                  {customerEmail && (
                    <div
                      className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm group ${
                        darkMode
                          ? "bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:from-blue-900/30 hover:to-blue-800/30"
                          : "bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100"
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-125" />
                      <span className="text-xs font-medium truncate max-w-[9rem] 2xl:max-w-[12rem]">
                        {customerEmail}
                      </span>
                    </div>
                  )}
                  {customerPhone && (
                    <div
                      className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm group ${
                        darkMode
                          ? "bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:from-emerald-900/30 hover:to-emerald-800/30"
                          : "bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100"
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-125" />
                      <span className="text-xs font-medium whitespace-nowrap">
                        {customerPhone}
                      </span>
                    </div>
                  )}
                </div>
              </div> */}
            </div>
          </div>

          {createdAt && (
            <div
              className={`${isHeaderExpanded ? "flex" : "hidden"} flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calendar
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                />
                <p
                  className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Created: {formatDate(createdAt)}
                </p>
              </div>

              <div className="hidden sm:block h-4 w-px bg-gray-600/30"></div>

              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                <BarChart2
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                />
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                  >
                    {messageStats.agent}
                  </span>
                  <span
                    className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                  >
                    agent
                  </span>
                  <span
                    className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                  >
                    •
                  </span>
                  <span
                    className={`text-xs ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}
                  >
                    {messageStats.customer}
                  </span>
                  <span
                    className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                  >
                    customer
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div
            className={`${isHeaderExpanded ? "flex" : "hidden"} items-center gap-2 sm:gap-3 flex-wrap`}
          >
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 ${
                darkMode
                  ? "bg-gray-800/50 hover:bg-gray-800"
                  : "bg-blue-50 hover:bg-blue-100"
              } shadow-sm`}
            >
              <MessageSquare
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
              />
              <p
                className={`text-xs sm:text-sm font-medium truncate max-w-[10rem] sm:max-w-[18rem] 2xl:max-w-none ${darkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                {ticket?.issue || "Premium Support"}
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2 min-w-0">
              {customerEmail && (
                <div
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm group ${
                    darkMode
                      ? "bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:from-blue-900/30 hover:to-blue-800/30"
                      : "bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-125" />
                  <span className="text-xs font-medium truncate max-w-[9rem] 2xl:max-w-[12rem]">
                    {customerEmail}
                  </span>
                </div>
              )}
              {customerPhone && (
                <div
                  className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm group ${
                    darkMode
                      ? "bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:from-emerald-900/30 hover:to-emerald-800/30"
                      : "bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-125" />
                  <span className="text-xs font-medium whitespace-nowrap">
                    {customerPhone}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`${isHeaderExpanded ? "grid 2xl:flex" : "hidden"} grid-cols-1 sm:grid-cols-2 2xl:items-center gap-2 mt-2 2xl:mt-0 w-full 2xl:w-auto`}
          >
            {showAssignment && (
              <div className="relative group min-w-0 2xl:w-56">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(true)}
                  disabled={isAssigneeLoading}
                  className={`flex items-center justify-between pl-9 sm:pl-11 pr-7 sm:pr-9 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg sm:rounded-xl border transition-all duration-500 w-full text-left ${
                    darkMode
                      ? "bg-gradient-to-r from-gray-800/90 to-gray-900/90 border-gray-700 text-white hover:from-gray-700/90 hover:to-gray-800/90"
                      : "bg-gradient-to-r from-white/90 to-blue-50/90 border-gray-300 text-gray-900 hover:from-white hover:to-blue-100"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-lg backdrop-blur-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <span className="truncate">
                    {ticket?.assignedTo
                      ? `🎯 ${staffList.find((s) => s._id === ticket.assignedTo)?.name || "Assigned"}`
                      : "🎯 Assign to..."}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                </button>
                {isAssigneeLoading ? (
                  <div className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <User
                    className={`absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-500 ${
                      darkMode
                        ? "text-blue-400 group-hover:text-cyan-300"
                        : "text-blue-500"
                    }`}
                  />
                )}
              </div>
            )}

            {showStatus && (
              <div className="relative group min-w-0 2xl:w-56">
                <select
                  value={ticket?.status || ""}
                  disabled={ticket?.status === "CLOSED" || isStatusLoading}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setIsStatusLoading(true);
                    try {
                      await onStatusChange?.(value);
                    } catch (err) {
                      console.error("Status update error:", err);
                    } finally {
                      setIsStatusLoading(false);
                    }
                  }}
                  className={`appearance-none pl-9 sm:pl-11 pr-7 sm:pr-9 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg sm:rounded-xl border transition-all duration-500 w-full ${
                    darkMode
                      ? "bg-gradient-to-r from-gray-800/90 to-gray-900/90 border-gray-700 text-white hover:from-gray-700/90 hover:to-gray-800/90"
                      : "bg-gradient-to-r from-white/90 to-blue-50/90 border-gray-300 text-gray-900 hover:from-white hover:to-blue-100"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg backdrop-blur-sm cursor-pointer`}
                >
                  {(ALLOWED_STATUS_TRANSITIONS[ticket?.status] || []).map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                        className={`${darkMode ? "bg-gray-900" : "bg-white"}`}
                      >
                        {status === "OPEN"
                          ? "🚀 "
                          : status === "IN_PROGRESS"
                            ? "⚡ "
                            : status === "RESOLVED"
                              ? "✅ "
                              : "🔒 "}
                        {status.replace("_", " ")}
                      </option>
                    ),
                  )}
                </select>
                <div
                  className={`absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 transition-all duration-500 ${
                    getStatusStyles(ticket?.status).includes("blue")
                      ? "text-blue-400"
                      : getStatusStyles(ticket?.status).includes("amber")
                        ? "text-amber-400"
                        : getStatusStyles(ticket?.status).includes("emerald")
                          ? "text-emerald-400"
                          : "text-gray-400"
                  }`}
                >
                  {isStatusLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    getStatusIcon(ticket?.status)
                  )}
                </div>
                {/* {isStatusLoading ? (
                <div className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : ( */}
                <ChevronDown
                  className={`absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-500 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  } group-hover:rotate-180`}
                />
                {/* )} */}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsInfoDrawerOpen(true)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg sm:rounded-xl border transition-all duration-500 ${
                darkMode
                  ? "bg-gradient-to-r from-gray-800/90 to-gray-900/90 border-gray-700 text-white hover:from-gray-700/90 hover:to-gray-800/90"
                  : "bg-gradient-to-r from-white/90 to-blue-50/90 border-gray-300 text-gray-900 hover:from-white hover:to-blue-100"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-lg backdrop-blur-sm cursor-pointer`}
              title="Customer Details"
            >
              <Info className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="xl:hidden">Customer Details</span>
            </button>
          </div>
        </div>
      </div>

      {pinnedMessages.length > 0 && (
        <div
          className={`px-3 sm:px-5 py-2 sm:py-3 border-b flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide relative z-10 shrink-0 ${
            darkMode
              ? "bg-gradient-to-r from-amber-900/20 via-yellow-900/10 to-amber-800/10 border-amber-800/30"
              : "bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100 border-amber-200"
          } shadow-lg`}
        >
          <Pin
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${darkMode ? "text-amber-400" : "text-amber-600"}`}
          />
          <span
            className={`text-xs font-bold ${darkMode ? "text-amber-300" : "text-amber-700"}`}
          >
            📌 Pinned ({pinnedMessages.length})
          </span>
          <div className="flex-1"></div>
          <button
            type="button"
            onClick={() => setPinnedMessages([])}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
              darkMode
                ? "text-gray-400 hover:text-amber-300 hover:bg-gray-800/50"
                : "text-gray-600 hover:text-amber-700 hover:bg-amber-50"
            }`}
          >
            Clear
          </button>
        </div>
      )}

      <div
        ref={messagesContainerRef}
        className={`flex-1 min-h-0 min-w-0 flex flex-col overflow-y-auto premium-scrollbar px-3 py-4 sm:p-5 xl:p-6 space-y-5 sm:space-y-7 xl:space-y-8 overscroll-contain scroll-smooth relative z-10 transition-all duration-500`}
      >
        {/* Spacer to push messages to the bottom */}
        <div className="flex-1 min-h-[0px]"></div>

        {loading ? (
          <div className="space-y-5 sm:space-y-8 animate-pulse w-full min-w-0">
            {/* Left aligned loading bubble */}
            <div className="flex justify-start items-end gap-2.5 max-w-[94%] sm:max-w-[80%] lg:max-w-[70%]">
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}
              />
              <div className="flex flex-col gap-2">
                <div
                  className={`h-3 w-24 rounded ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}
                />
                <div
                  className={`p-4 rounded-2xl rounded-bl-none ${darkMode ? "bg-gray-900/60 border border-gray-800" : "bg-gray-100 border border-gray-200"} space-y-2`}
                >
                  <div
                    className={`h-3.5 w-48 sm:w-64 rounded ${darkMode ? "bg-gray-800" : "bg-gray-350"}`}
                  />
                  <div
                    className={`h-3.5 w-36 sm:w-48 rounded ${darkMode ? "bg-gray-800" : "bg-gray-350"}`}
                  />
                </div>
              </div>
            </div>

            {/* Right aligned loading bubble */}
            <div className="flex justify-end items-end gap-2.5 max-w-[94%] sm:max-w-[80%] lg:max-w-[70%] ml-auto">
              <div className="flex flex-col gap-2 items-end">
                <div
                  className={`h-3 w-16 rounded ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}
                />
                <div
                  className={`p-4 rounded-2xl rounded-br-none ${darkMode ? "bg-blue-900/20 border border-blue-900/30" : "bg-blue-50 border border-blue-100"} space-y-2`}
                >
                  <div
                    className={`h-3.5 w-40 sm:w-56 rounded ${darkMode ? "bg-blue-800/40" : "bg-blue-200/60"}`}
                  />
                  <div
                    className={`h-3.5 w-24 sm:w-36 rounded ${darkMode ? "bg-blue-800/40" : "bg-blue-200/60"}`}
                  />
                </div>
              </div>
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}
              />
            </div>

            {/* Left aligned loading bubble with image skeleton */}
            <div className="flex justify-start items-end gap-2.5 max-w-[94%] sm:max-w-[80%] lg:max-w-[70%]">
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}
              />
              <div className="flex flex-col gap-2">
                <div
                  className={`h-3 w-20 rounded ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}
                />
                <div
                  className={`p-4 rounded-2xl rounded-bl-none ${darkMode ? "bg-gray-900/60 border border-gray-800" : "bg-gray-100 border border-gray-200"} space-y-3`}
                >
                  <div
                    className={`w-40 sm:w-56 h-28 sm:h-36 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}
                  />
                  <div
                    className={`h-3.5 w-32 rounded ${darkMode ? "bg-gray-800" : "bg-gray-350"}`}
                  />
                </div>
              </div>
            </div>

            {/* Right aligned loading bubble */}
            <div className="flex justify-end items-end gap-2.5 max-w-[94%] sm:max-w-[80%] lg:max-w-[70%] ml-auto">
              <div className="flex flex-col gap-2 items-end">
                <div
                  className={`h-3 w-16 rounded ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}
                />
                <div
                  className={`p-4 rounded-2xl rounded-br-none ${darkMode ? "bg-blue-900/20 border border-blue-900/30" : "bg-blue-50 border border-blue-100"} space-y-2`}
                >
                  <div
                    className={`h-3.5 w-44 sm:w-60 rounded ${darkMode ? "bg-blue-800/40" : "bg-blue-200/60"}`}
                  />
                </div>
              </div>
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}
              />
            </div>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center p-2 sm:p-6 text-center">
                <div
                  className={`w-full max-w-md p-4 sm:p-8 rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 transition-all duration-700 hover:scale-[1.02] relative overflow-hidden ${
                    darkMode
                      ? "bg-gradient-to-br from-gray-900/60 via-gray-950/60 to-black/60 backdrop-blur-xl"
                      : "bg-gradient-to-br from-white/80 via-blue-50/80 to-white/80 backdrop-blur-xl"
                  } shadow-2xl`}
                >
                  <div className="relative">
                    <div className="relative w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6">
                      <Bot
                        className={`w-full h-full ${darkMode ? "text-blue-400" : "text-blue-500"}`}
                      />
                      <Sparkles
                        className={`absolute -top-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 ${darkMode ? "text-yellow-400" : "text-yellow-500"}`}
                      />
                      <Sparkles
                        className={`absolute -bottom-1 -left-1 w-4 h-4 sm:w-6 sm:h-6 ${darkMode ? "text-cyan-400" : "text-cyan-500"}`}
                      />
                    </div>

                    <h3
                      className={`text-xl sm:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r bg-clip-text text-transparent ${
                        darkMode
                          ? "from-blue-300 via-cyan-300 to-purple-300"
                          : "from-blue-600 via-cyan-600 to-purple-600"
                      }`}
                    >
                      ✨ Premium Chat ✨
                    </h3>

                    <p
                      className={`max-w-md text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      Start an amazing conversation with{" "}
                      <span className="font-bold text-blue-400">
                        {ticket?.customerName || ticket?.ticketId || "Customer"}
                      </span>
                      .
                    </p>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div
                        className={`p-2 sm:p-3 rounded-lg sm:rounded-xl text-center transition-all duration-300 hover:scale-105 ${
                          darkMode ? "bg-gray-800/50" : "bg-blue-50"
                        }`}
                      >
                        <Zap
                          className={`w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 sm:mb-2 ${darkMode ? "text-yellow-400" : "text-yellow-500"}`}
                        />
                        <p
                          className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                        >
                          Instant Replies
                        </p>
                      </div>
                      <div
                        className={`p-2 sm:p-3 rounded-lg sm:rounded-xl text-center transition-all duration-300 hover:scale-105 ${
                          darkMode ? "bg-gray-800/50" : "bg-emerald-50"
                        }`}
                      >
                        <Shield
                          className={`w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 sm:mb-2 ${darkMode ? "text-green-400" : "text-green-500"}`}
                        />
                        <p
                          className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                        >
                          Secure & Encrypted
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {orderedMessageGroups.map((group) => {
              const groupTicket = userTickets.find(
                (t) => t._id === group.roomId,
              );
              const displayTicketId =
                groupTicket?.ticketId || group.roomId.slice(-6);
              const isGroupDone = zigzagStatuses.includes(groupTicket?.status);

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
                  className={`space-y-5 sm:space-y-8 rounded-xl sm:rounded-2xl transition-all duration-500 min-w-0 ${
                    isGroupDone ? "p-3 sm:p-4" : ""
                  }`}
                  style={groupClosedStyle}
                >
                  <div className="flex justify-center my-4 sm:my-8 sticky top-2 sm:top-4 z-20">
                    <div
                      className={`max-w-full text-[11px] sm:text-sm px-3 sm:px-6 py-2 sm:py-3 rounded-full backdrop-blur-xl border transition-all duration-500 hover:scale-105 shadow-lg flex items-center gap-2 sm:gap-3 overflow-hidden ${
                        group.roomId === ticket?._id
                          ? darkMode
                            ? "bg-blue-900/80 border-blue-500 text-blue-200 shadow-blue-500/20"
                            : "bg-blue-100 border-blue-400 text-blue-800 shadow-blue-500/20"
                          : darkMode
                            ? "bg-gray-900/90 border-gray-700 text-gray-300"
                            : "bg-white/90 border-gray-300 text-gray-600"
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span className="font-bold truncate">
                        Ticket #{displayTicketId}
                      </span>
                      <span className="opacity-50 hidden sm:inline">|</span>
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span className="whitespace-nowrap">
                        {formatDate(group.messages[0]?.createdAt || new Date())}
                      </span>
                    </div>
                  </div>

                  {group.messages.map((msg) => {
                    const isAgent = [
                      "ADMIN",
                      "ADMIN_STAFF",
                      "SUPER_ADMIN",
                    ].includes(msg.senderRole);
                    const isSystem = msg.senderRole === "SYSTEM";
                    const isPinned = pinnedMessages.includes(msg._id);

                    if (isSystem) {
                      return (
                        <div key={msg._id} className="flex justify-center">
                          <div
                            className={`text-xs sm:text-sm px-3 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border flex items-center gap-2.5 sm:gap-4 max-w-full sm:max-w-md backdrop-blur-xl ${
                              darkMode
                                ? "bg-gradient-to-r from-gray-900/60 to-gray-950/60 border-gray-800 text-gray-300"
                                : "bg-gradient-to-r from-gray-100/80 to-white/80 border-gray-300 text-gray-600"
                            } shadow-2xl transition-all duration-500 hover:scale-[1.02]`}
                          >
                            <div
                              className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg ${darkMode ? "bg-blue-500/20" : "bg-blue-100"}`}
                            >
                              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                            </div>
                            <span className="flex-1 min-w-0 break-words text-sm sm:text-base">
                              {msg.message}
                            </span>
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
                        copyToClipboard={copyToClipboard}
                        downloadFile={downloadFile}
                      />
                    );
                  })}
                </div>
              );
            })}
          </>
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div
              className={`p-3 sm:p-5 rounded-2xl sm:rounded-3xl max-w-[94%] sm:max-w-[80%] lg:max-w-[70%] backdrop-blur-xl shadow-2xl ${
                darkMode
                  ? "bg-gradient-to-br from-gray-900/60 to-gray-950/60"
                  : "bg-gradient-to-br from-white/80 to-blue-50/80 border border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${darkMode ? "bg-blue-400" : "bg-blue-500"}`}
                  ></div>
                  <div
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${darkMode ? "bg-blue-400" : "bg-blue-500"}`}
                  ></div>
                  <div
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${darkMode ? "bg-blue-400" : "bg-blue-500"}`}
                  ></div>
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium ml-1 sm:ml-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  {ticket?.customerName || "Customer"} is typing...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* ─── BOTTOM BAR: DROPDOWN & INPUT ─── */}
      <div
        className={`px-3 sm:px-4 xl:px-5 border-t transition-all duration-500 relative z-20 shrink-0 ${
          darkMode
            ? "border-gray-800/50 bg-gradient-to-t from-gray-900/95 via-gray-950/95 to-black/95 backdrop-blur-xl"
            : "border-gray-200/50 bg-gradient-to-t from-white/95 via-blue-50/95 to-white/95 backdrop-blur-xl"
        } shadow-2xl`}
      >
        {/* ACTIVE TICKET DROPDOWN - COLLAPSIBLE ON MOBILE */}
        {userTickets && userTickets.length > 0 && onTicketSelect && (
          <div className=" w-full mb-1 min-w-0 max-w-full">
            {/* Mobile-only toggle pill */}
            <div className="flex sm:hidden items-center justify-between  w-full min-w-0">
              {!isReplyToExpanded ? (
                <button
                  type="button"
                  onClick={() => setIsReplyToExpanded(true)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-all select-none max-w-full min-w-0 ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-blue-400 hover:bg-gray-700"
                      : "bg-blue-50 border-blue-200 text-blue-600 shadow-sm hover:bg-blue-100"
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    Replying to #{ticket?.ticketId || "N/A"} (
                    {ticket?.status?.replace("_", " ")})
                  </span>
                  <ChevronDown className="w-3 h-3 shrink-0" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsReplyToExpanded(false)}
                  className={`text-xs font-medium px-2 py-0.5 rounded transition ${
                    darkMode
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Collapse Picker
                </button>
              )}
            </div>

            {/* Selector wrapper: always visible on sm+, toggleable on xs mobile */}
            <div
              className={`${
                isReplyToExpanded ? "flex" : "hidden"
              } sm:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full min-w-0 max-w-full`}
            >
              <span
                className={`text-xs font-semibold uppercase tracking-wider shrink-0 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Replying To:
              </span>
              <div
                ref={ticketListRef}
                className="relative w-full min-w-0 max-w-full sm:max-w-sm"
              >
                <button
                  type="button"
                  onClick={() => setIsTicketListOpen(!isTicketListOpen)}
                  className={`flex items-center justify-between pl-9 pr-8 py-2 text-sm rounded-lg border transition-all w-full min-w-0 max-w-full text-left relative ${
                    darkMode
                      ? "bg-gray-805 border-gray-700 text-white hover:bg-gray-750"
                      : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer shadow-sm`}
                >
                  <span className="truncate">
                    Ticket #{ticket?.ticketId || "N/A"} (
                    {ticket?.status?.replace("_", " ")})
                  </span>
                </button>
                <ListFilter
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                    darkMode ? "text-blue-400" : "text-blue-500"
                  }`}
                />
                <ChevronDown
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-transform pointer-events-none ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  } ${isTicketListOpen ? "rotate-180" : ""}`}
                />

                {isTicketListOpen && (
                  <div
                    className={`scrollbar-hide absolute bottom-full left-0 right-0 mb-2 z-50 rounded-xl border shadow-2xl max-h-60 overflow-y-auto w-full ${
                      darkMode
                        ? "bg-gray-900 border-gray-800 text-white divide-y divide-gray-800/50"
                        : "bg-white border-gray-200 text-gray-900 divide-y divide-gray-100"
                    }`}
                  >
                    {/* Open tickets */}
                    {userTickets
                      .filter((t) => selectableStatuses.includes(t.status))
                      .map((t) => (
                        <button
                          key={t._id}
                          type="button"
                          onClick={() => {
                            onTicketSelect(t._id);
                            setIsTicketListOpen(false);
                            setIsReplyToExpanded(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-colors flex items-center justify-between ${
                            t._id === ticket?._id
                              ? darkMode
                                ? "bg-blue-600/20 text-blue-400 font-semibold"
                                : "bg-blue-50 text-blue-600 font-semibold"
                              : darkMode
                                ? "hover:bg-gray-800 text-gray-300"
                                : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span className="truncate">Ticket #{t.ticketId}</span>
                          <span
                            className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold shrink-0 ${
                              t.status === "OPEN"
                                ? darkMode
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-green-100 text-green-800"
                                : darkMode
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {t.status.replace("_", " ")}
                          </span>
                        </button>
                      ))}

                    {/* Closed tickets */}
                    {userTickets
                      .filter((t) => !selectableStatuses.includes(t.status))
                      .map((t) => (
                        <div
                          key={t._id}
                          className={`px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between opacity-50 ${
                            darkMode
                              ? "text-gray-500 bg-gray-950/20"
                              : "text-gray-400 bg-gray-50/50"
                          }`}
                        >
                          <span className="truncate">Ticket #{t.ticketId}</span>
                          <span className="text-[10px] font-medium italic shrink-0">
                            Closed ({t.status})
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {ticket?.status === "CLOSED" ? (
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
              darkMode
                ? "bg-emerald-900/30 border-emerald-700/40 text-emerald-300"
                : "bg-emerald-100 border-emerald-300 text-emerald-700"
            }`}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-semibold">
              This active ticket is closed — select an open ticket to reply
            </span>
          </div>
        ) : (
          <>
            {/* Preview Area */}
            {selectedFiles.length > 0 && (
              <div
                className={`-mx-3 sm:-mx-4 xl:-mx-5 px-3 sm:px-4 xl:px-5 pb-3 sm:pb-4 mb-3 sm:mb-4 border-b ${darkMode ? "border-gray-800/50" : "border-gray-200/50"} animate-in slide-in-from-bottom-2 duration-200`}
              >
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl border overflow-hidden group/preview shadow-sm ${
                        darkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      {previewUrls[idx]?.file.type.startsWith("image/") ? (
                        <img
                          src={previewUrls[idx].url}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                          <FileText className="w-8 h-8 text-blue-500 mb-1.5" />
                          <span
                            className={`text-[10px] leading-tight line-clamp-2 w-full break-all ${
                              darkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
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
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-end gap-2 sm:gap-3"
            >
              <div className="flex-1 min-w-0 relative">
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
                  placeholder={
                    selectedFiles.length > 0
                      ? "Add a caption..."
                      : "Type your message..."
                  }
                  rows={1}
                  className={`w-full pl-11 sm:pl-12 pr-3 sm:pr-4 py-3 rounded-xl resize-none scrollbar-hide transition-all duration-300 text-sm sm:text-base leading-5 ${
                    darkMode
                      ? "bg-gray-900 text-white placeholder-gray-500 border border-gray-800"
                      : "bg-white text-gray-900 placeholder-gray-400 border border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  style={{ maxHeight: "120px", minHeight: "48px" }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!inputMsg.trim() && selectedFiles.length === 0}
                className={`shrink-0 p-3 rounded-xl transition-all ${
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
          </>
        )}
      </div>

      {/* ─── PREMIUM STAFF ASSIGNMENT MODAL ─── */}
      {isStaffModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
            {/* Backdrop Overlay */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsStaffModalOpen(false)}
            />

            {/* Modal Card */}
            <div
              className={`relative w-full max-w-md rounded-2xl border p-4 sm:p-5 shadow-2xl transition-all transform scale-100 duration-300 flex flex-col max-h-[88dvh] sm:max-h-[80vh] animate-fade-in ${
                darkMode
                  ? "bg-gradient-to-br from-gray-900 via-gray-950 to-black border-gray-800 text-white"
                  : "bg-white border-gray-200 text-gray-900"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-700/20 mb-4">
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 min-w-0 truncate">
                  🎯 Assign Ticket Agent
                </h3>
                <button
                  onClick={() => setIsStaffModalOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    darkMode
                      ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <Search
                  className={`absolute left-3 top-2.5 w-4 h-4 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Search staff by name..."
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none transition ${
                    darkMode
                      ? "bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
                  }`}
                />
              </div>

              {/* Staff List */}
              <div className="flex-1 overflow-y-auto premium-scrollbar space-y-2.5 pr-1">
                {/* Option to Remove Assignment */}
                {ticket?.assignedTo && (
                  <button
                    disabled={isAssigneeLoading}
                    onClick={async () => {
                      if (isAssigneeLoading) return;
                      await handleAssigneeChange(null);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all duration-300 disabled:opacity-50 ${
                      darkMode
                        ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                        : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    <span>❌ Remove Assignment</span>
                  </button>
                )}

                {staffList
                  .filter((s) =>
                    s.name.toLowerCase().includes(staffSearch.toLowerCase()),
                  )
                  .sort((a, b) => {
                    const activeA = staffStats?.[a._id]?.totalActive || 0;
                    const activeB = staffStats?.[b._id]?.totalActive || 0;
                    return activeA - activeB;
                  })
                  .map((s) => {
                    const stats = staffStats?.[s._id] || {
                      totalActive: 0,
                      assignedToday: 0,
                      pendingPrevious: 0,
                    };
                    const isCurrentlyAssigned = ticket?.assignedTo === s._id;

                    return (
                      <div
                        key={s._id}
                        onClick={async () => {
                          if (isCurrentlyAssigned || isAssigneeLoading) return;
                          await handleAssigneeChange(s._id);
                        }}
                        className={`w-full min-w-0 flex flex-col p-3 rounded-xl border text-left transition-all duration-300 ${
                          isCurrentlyAssigned
                            ? darkMode
                              ? "bg-blue-600/20 border-blue-500/40 text-white cursor-default"
                              : "bg-blue-50 border-blue-300 text-blue-900 cursor-default"
                            : darkMode
                              ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800 text-white hover:border-gray-600 cursor-pointer"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900 hover:border-gray-300 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-start sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isCurrentlyAssigned
                                  ? "bg-blue-500 text-white"
                                  : darkMode
                                    ? "bg-gray-700 text-gray-300"
                                    : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-sm block truncate">
                                {s.name}
                              </span>
                              <span
                                className={`text-xs block truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                              >
                                {s.email}
                              </span>
                            </div>
                          </div>
                          {isCurrentlyAssigned ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500 text-white font-medium flex-shrink-0">
                              Assigned
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isAssigneeLoading}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (isAssigneeLoading) return;
                                await handleAssigneeChange(s._id);
                              }}
                              className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all duration-300 flex-shrink-0 flex items-center justify-center min-w-[70px] ${
                                darkMode
                                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg disabled:opacity-50"
                                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg disabled:opacity-50"
                              }`}
                            >
                              {assigningStaffId === s._id ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                "Assign"
                              )}
                            </button>
                          )}
                        </div>

                        {/* Ticket stats */}
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-1">
                          <div
                            className={`p-1.5 rounded-lg text-center min-w-0 ${
                              darkMode ? "bg-gray-900/60" : "bg-white"
                            } border ${darkMode ? "border-gray-800" : "border-gray-200"}`}
                          >
                            <span
                              className={`text-[9px] block font-bold leading-tight ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                            >
                              ACTIVE
                            </span>
                            <span className="text-xs font-bold text-blue-400">
                              {stats.totalActive}
                            </span>
                          </div>
                          <div
                            className={`p-1.5 rounded-lg text-center min-w-0 ${
                              darkMode ? "bg-gray-900/60" : "bg-white"
                            } border ${darkMode ? "border-gray-800" : "border-gray-200"}`}
                          >
                            <span
                              className={`text-[9px] block font-bold leading-tight ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                            >
                              TODAY
                            </span>
                            <span className="text-xs font-bold text-amber-400">
                              {stats.assignedToday}
                            </span>
                          </div>
                          <div
                            className={`p-1.5 rounded-lg text-center min-w-0 ${
                              darkMode ? "bg-gray-900/60" : "bg-white"
                            } border ${darkMode ? "border-gray-800" : "border-gray-200"}`}
                          >
                            <span
                              className={`text-[9px] block font-bold leading-tight ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                            >
                              PENDING
                            </span>
                            <span className="text-xs font-bold text-rose-400">
                              {stats.pendingPrevious}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* CUSTOMER INFO DRAWER */}
      {isInfoDrawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsInfoDrawerOpen(false)}
            />
            {/* Drawer Panel */}
            <div
              className={`relative w-full max-w-sm h-full shadow-2xl transition-all transform duration-300 flex flex-col animate-fade-in ${
                darkMode
                  ? "bg-gradient-to-br from-gray-900 via-gray-950 to-black border-l border-gray-800 text-white"
                  : "bg-white border-l border-gray-200 text-gray-900"
              }`}
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-gray-700/20 flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" /> Customer Profile
                </h3>
                <button
                  onClick={() => setIsInfoDrawerOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    darkMode
                      ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto premium-scrollbar p-5 space-y-6">
                {/* User Avatar & Name */}
                <div className="text-center space-y-2">
                  <div
                    className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-white shadow-xl ${
                      darkMode ? "bg-blue-600" : "bg-blue-500"
                    }`}
                  >
                    {(ticket?.customerName?.[0] || "?").toUpperCase()}
                  </div>
                  <h4 className="font-bold text-xl">
                    {ticket?.customerName || "Customer"}
                  </h4>
                  <p
                    className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    ID: {ticket?.customerId || "N/A"}
                  </p>
                </div>

                {/* Details List */}
                <div className="space-y-4">
                  {customerEmail && (
                    <div
                      className={`p-3 rounded-xl border ${darkMode ? "bg-gray-900/60 border-gray-800" : "bg-gray-50 border-gray-200"} flex items-center justify-between gap-3`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <span
                            className={`text-[10px] block font-bold uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                          >
                            Email
                          </span>
                          <span className="text-sm font-medium block truncate">
                            {customerEmail}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          copyToClipboard(customerEmail);
                          alert("Email copied to clipboard!");
                        }}
                        className={`p-1.5 rounded-lg border ${darkMode ? "border-gray-800 hover:bg-gray-800 text-gray-400" : "border-gray-200 hover:bg-gray-100 text-gray-500"} transition`}
                        title="Copy Email"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {customerPhone && (
                    <div
                      className={`p-3 rounded-xl border ${darkMode ? "bg-gray-900/60 border-gray-800" : "bg-gray-50 border-gray-200"} flex items-center justify-between gap-3`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <span
                            className={`text-[10px] block font-bold uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                          >
                            Phone
                          </span>
                          <span className="text-sm font-medium block truncate">
                            {customerPhone}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          copyToClipboard(customerPhone);
                          alert("Phone copied to clipboard!");
                        }}
                        className={`p-1.5 rounded-lg border ${darkMode ? "border-gray-800 hover:bg-gray-800 text-gray-400" : "border-gray-200 hover:bg-gray-100 text-gray-500"} transition`}
                        title="Copy Phone"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {createdAt && (
                    <div
                      className={`p-3 rounded-xl border ${darkMode ? "bg-gray-900/60 border-gray-800" : "bg-gray-50 border-gray-200"} flex items-center gap-2.5`}
                    >
                      <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <div>
                        <span
                          className={`text-[10px] block font-bold uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                        >
                          Created Date
                        </span>
                        <span className="text-sm font-medium block">
                          {formatDate(createdAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Stats */}
                <div className="space-y-3">
                  <h5 className="font-bold text-xs uppercase tracking-wider opacity-60">
                    Chat Analytics
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`p-3 rounded-xl border text-center ${darkMode ? "bg-gray-900/60 border-gray-800" : "bg-gray-50 border-gray-200"}`}
                    >
                      <span className="text-2xl font-bold text-blue-500">
                        {messageStats.agent}
                      </span>
                      <span
                        className={`text-[10px] block font-medium mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Agent Messages
                      </span>
                    </div>
                    <div
                      className={`p-3 rounded-xl border text-center ${darkMode ? "bg-gray-900/60 border-gray-800" : "bg-gray-50 border-gray-200"}`}
                    >
                      <span className="text-2xl font-bold text-emerald-500">
                        {messageStats.customer}
                      </span>
                      <span
                        className={`text-[10px] block font-medium mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Customer Messages
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

const MessageBubble = ({
  msg,
  isAgent,
  isPinned,
  darkMode,
  formatTime,
  copyToClipboard,
  downloadFile,
}) => {
  return (
    <div
      className={`flex min-w-0 ${isAgent ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`group relative min-w-0 p-3 sm:p-4 lg:p-5 rounded-2xl sm:rounded-3xl max-w-[94%] sm:max-w-[82%] lg:max-w-[70%] transition-all duration-700 hover:scale-[1.01] ${
          isPinned ? "ring-2 ring-amber-500/50 shadow-2xl" : ""
        } ${
          isAgent
            ? darkMode
              ? "bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white rounded-br-none shadow-2xl"
              : "bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400 text-white rounded-br-none shadow-2xl"
            : darkMode
              ? "bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-100 rounded-bl-none shadow-2xl"
              : "bg-gradient-to-br from-white via-gray-50 to-blue-50 text-gray-900 border border-gray-200 rounded-bl-none shadow-lg"
        }`}
      >
        <div
          className={`absolute -top-3 ${isAgent ? "left-2 sm:-left-12" : "right-2 sm:-right-12"} 
          flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-500`}
        >
          <button
            type="button"
            onClick={() => copyToClipboard(msg.message)}
            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-125 hover:rotate-12 ${
              darkMode
                ? "bg-gray-900 text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                : "bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            } shadow-lg`}
            title="Copy message"
          >
            <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        {/* Attachments */}
        {msg.attachments?.length > 0 && (
          <div
            className={`grid grid-cols-1 gap-2 min-w-0 ${msg.message ? "mb-2" : ""}`}
          >
            {msg.attachments.map((file, idx) => (
              <div key={idx}>
                {file.type?.startsWith("image") ? (
                  <div className="relative group/image min-w-0">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="rounded-lg max-h-52 sm:max-h-60 w-full object-cover cursor-pointer border border-gray-200 dark:border-gray-700"
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
                    className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border transition-all min-w-0 ${
                      darkMode
                        ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                    </div>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => window.open(file.url, "_blank")}
                    >
                      <p
                        className={`text-sm font-medium truncate ${darkMode ? "text-gray-200" : "text-gray-800"}`}
                      >
                        {file.name}
                      </p>
                      <p className="text-xs opacity-70 uppercase">
                        {file.type?.split("/")[1] || "FILE"}
                      </p>
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
          <p className="leading-relaxed whitespace-pre-wrap break-words text-sm sm:text-base">
            {msg.message}
          </p>
        )}

        <div
          className={`text-xs mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 ${
            isAgent
              ? "text-blue-200/80"
              : darkMode
                ? "text-gray-400"
                : "text-gray-500"
          }`}
        >
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
