"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../lib/axios";
import { Trash2, MessageSquare, Plus, Loader2, User, X, Menu } from "lucide-react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearUser } from "../../Redux/userSlice";

export default function Sidebar({ chatId, onSelect, refresh, onRefreshed }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const user = useSelector((store) => store.user.user);
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // 🔥 auto refresh when new chat starts
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
      
      // If deleting the active chat, clear it
      if (chatId === id) {
        onSelect(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
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

  // Close mobile menu when selecting a chat
  const handleSelectChat = (id) => {
    onSelect(id);
    setMobileMenuOpen(false);
  };

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <>
      {/* Mobile Menu Button - Fixed at top left */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-slate-900 border border-slate-700 rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
      >
        <Menu size={24} className="text-white" />
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-72 sm:w-80 md:w-72
          bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 
          text-white flex flex-col h-full 
          border-r border-slate-800/50 backdrop-blur-xl
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-3 sm:p-4 border-b border-slate-800/50">
          <button
            onClick={() => {
              onSelect(null);
              setMobileMenuOpen(false);
            }}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 p-3 sm:p-3.5 rounded-xl flex items-center gap-2 justify-center font-medium shadow-lg shadow-orange-500/20 transition-all duration-200 hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5} /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1 sm:space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {loading ? (
            <div className="flex items-center justify-center mt-10">
              <Loader2 className="animate-spin text-orange-400" size={24} />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-slate-800/50 rounded-full flex items-center justify-center border border-orange-500/20">
                <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-orange-400/50" />
              </div>
              <p className="text-sm text-slate-400">No chats yet</p>
              <p className="text-xs text-slate-500 mt-1">Start a new conversation</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = chatId === chat.id;
              
              return (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`group relative flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? "bg-gradient-to-r from-orange-500/20 via-orange-600/20 to-amber-600/20 border-orange-500/50 shadow-lg shadow-orange-500/10"
                      : "border-transparent hover:bg-slate-800/50 hover:border-slate-700/50"
                  }`}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 sm:h-6 bg-gradient-to-b from-orange-500 to-amber-600 rounded-r-full"></div>
                  )}

                  <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive 
                      ? "bg-orange-500/20" 
                      : "bg-slate-800 group-hover:bg-slate-700"
                  }`}>
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
                    className={`transition-opacity p-1 sm:p-1.5 rounded-md disabled:cursor-not-allowed ${
                      isActive
                        ? "opacity-100 hover:bg-orange-500/20 text-orange-400"
                        : "opacity-0 group-hover:opacity-100 hover:bg-orange-500/10 hover:text-orange-400"
                    }`}
                  >
                    {deletingId === chat.id ? (
                      <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin text-orange-400" />
                    ) : (
                      <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Profile Section at Bottom */}
        <div
          ref={dropdownRef}
          className="p-3 sm:p-4 border-t border-slate-800/50 relative"
        >
          <div
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all duration-200 cursor-pointer"
          >
            <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={18} className="sm:w-5 sm:h-5 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-white truncate">
                {user?.name}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Dropdown */}
          {open && (
            <div className="absolute bottom-20 sm:bottom-24 left-3 right-3 sm:left-4 sm:right-4 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut size={14} className="sm:w-4 sm:h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}