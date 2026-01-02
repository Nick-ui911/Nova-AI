"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../lib/axios";
import {
  Trash2,
  MessageSquare,
  Plus,
  Loader2,
  User,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearUser } from "../../Redux/userSlice";

export default function Sidebar({ chatId, onSelect, refresh, onRefreshed }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const user = useSelector((store) => store.user.user);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post("/api/logout");
      dispatch(clearUser());
      router.replace("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/chat");
      setChats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (refresh) {
      fetchChats();
      onRefreshed();
    }
  }, [refresh]);

  const deleteChat = async (id) => {
    if (!confirm("Delete this chat?")) return;

    try {
      setDeletingId(id);
      await api.delete(`/api/chat/${id}`);
      setChats((prev) => prev.filter((c) => c.id !== id));

      if (chatId === id) {
        onSelect(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleChatSelect = (id) => {
    onSelect(id);
    setMobileOpen(false);
  };

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-slate-900/95 hover:bg-slate-800 text-white rounded-lg shadow-xl border border-slate-700/50 transition-all duration-200 backdrop-blur-sm"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 lg:z-10
          w-[280px] sm:w-[300px] lg:w-72
          h-screen
          bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 
          text-white
          border-r border-slate-800/50
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header - New Chat Button */}
        <div className="flex-shrink-0 p-3 sm:p-4  mt-16 lg:mt-0">
          <button
            onClick={() => {
              onSelect(null);
              setMobileOpen(false);
            }}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 p-3 sm:p-3.5 rounded-xl flex items-center gap-2 justify-center font-medium shadow-lg shadow-orange-500/20 transition-all duration-200 hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={18} strokeWidth={2.5} className="sm:w-5 sm:h-5" />
            <span className="text-sm">New Chat</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1 min-h-0 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {loading ? (
            <div className="flex flex-col items-center justify-center mt-16 sm:mt-20">
              <Loader2
                className="animate-spin text-orange-400 mb-3"
                size={28}
              />
              <p className="text-xs sm:text-sm text-slate-500">
                Loading chats...
              </p>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 bg-slate-800/50 rounded-full flex items-center justify-center border-2 border-orange-500/20">
                <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400/50" />
              </div>
              <p className="text-sm sm:text-base font-medium text-slate-300 mb-1">
                No chats yet
              </p>
              <p className="text-xs text-slate-500">Start a new conversation</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = chatId === chat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  className={`group relative flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? "bg-gradient-to-r from-orange-500/20 via-orange-600/20 to-amber-600/20 border-orange-500/50 shadow-lg shadow-orange-500/10"
                      : "border-transparent hover:bg-slate-800/50 hover:border-slate-700/50"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-600 rounded-r-full"></div>
                  )}

                  <div
                    className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-orange-500/20"
                        : "bg-slate-800 group-hover:bg-slate-700"
                    }`}
                  >
                    <MessageSquare
                      size={14}
                      className={`sm:w-4 sm:h-4 transition-colors ${
                        isActive
                          ? "text-orange-400"
                          : "text-slate-400 group-hover:text-orange-400"
                      }`}
                    />
                  </div>

                  <span
                    className={`flex-1 truncate text-xs sm:text-sm transition-colors ${
                      isActive
                        ? "text-orange-300 font-medium"
                        : "text-slate-300 group-hover:text-white"
                    }`}
                  >
                    {chat.title || "New Chat"}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    disabled={deletingId === chat.id}
                    className={`flex-shrink-0 transition-opacity p-1.5 rounded-md disabled:cursor-not-allowed ${
                      isActive
                        ? "opacity-100 hover:bg-orange-500/20 text-orange-400"
                        : "opacity-0 group-hover:opacity-100 hover:bg-orange-500/10 hover:text-orange-400"
                    }`}
                  >
                    {deletingId === chat.id ? (
                      <Loader2
                        size={14}
                        className="sm:w-4 sm:h-4 animate-spin text-orange-400"
                      />
                    ) : (
                      <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Profile Section */}
        <div
          ref={dropdownRef}
          className="flex-shrink-0 p-3 sm:p-4 border-t border-slate-800/50 bg-slate-900/95 backdrop-blur-sm relative"
        >
          <div
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg ring-2 ring-slate-700/50 group-hover:ring-orange-500/30 transition-all">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user?.name || "User"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={18} className="sm:w-5 sm:h-5 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-white truncate group-hover:text-orange-300 transition-colors">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate group-hover:text-slate-300 transition-colors">
                {user?.email || "user@example.com"}
              </p>
            </div>

            <ChevronDown
              size={14}
              className={`sm:w-4 sm:h-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Dropdown Menu */}
          {open && (
            <div className="absolute bottom-full left-3 right-3 sm:left-4 sm:right-4 mb-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                className="w-full flex items-center gap-2.5 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-red-400 hover:bg-red-500/10 transition-all duration-200 hover:text-red-300 group/logout"
              >
                <LogOut
                  size={16}
                  className="sm:w-[18px] sm:h-[18px] group-hover/logout:scale-110 transition-transform"
                />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
