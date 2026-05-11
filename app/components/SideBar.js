"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../lib/axios";
import {
  Trash2, MessageSquare, Plus, User, Menu, X,
  ChevronDown, Pencil, Check, Search, LogOut, Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { clearUser } from "../../Redux/userSlice";

function ChatSkeleton({ delay = 0 }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ animationDelay: `${delay}ms` }}>
      <div className="w-8 h-8 bg-white/[0.05] rounded-lg skeleton shrink-0" />
      <div className="flex-1 h-3 bg-white/[0.05] rounded-full skeleton" style={{ width: `${55 + delay}%` }} />
    </div>
  );
}

export default function Sidebar({ chatId, onSelect, refresh, onRefreshed }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamingLoading, setRenamingLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useSelector((store) => store.user.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const dropdownRef = useRef(null);
  const renameInputRef = useRef(null);

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

  useEffect(() => { fetchChats(); }, []);
  useEffect(() => { if (refresh) { fetchChats(); onRefreshed(); } }, [refresh]);
  useEffect(() => { if (renamingId && renameInputRef.current) renameInputRef.current.focus(); }, [renamingId]);

  const deleteChat = async (id) => {
    if (!confirm("Delete this chat?")) return;
    try {
      setDeletingId(id);
      await api.delete(`/api/chat/${id}`);
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (chatId === id) onSelect(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const startRename = (e, chat) => {
    e.stopPropagation();
    setRenamingId(chat.id);
    setRenameValue(chat.title || "");
  };

  const commitRename = async (id) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    if (renameValue.trim() === chats.find((c) => c.id === id)?.title) { setRenamingId(null); return; }
    try {
      setRenamingLoading(true);
      const res = await api.patch(`/api/chat/${id}`, { title: renameValue.trim() });
      setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: res.data.title } : c)));
    } catch (err) {
      console.error(err);
    } finally {
      setRenamingLoading(false);
      setRenamingId(null);
    }
  };

  const handleRenameKeyDown = (e, id) => {
    if (e.key === "Enter") { e.preventDefault(); commitRename(id); }
    if (e.key === "Escape") setRenamingId(null);
  };

  const handleChatSelect = (id) => {
    if (renamingId) return;
    onSelect(id);
    setMobileOpen(false);
  };

  const filteredChats = searchQuery.trim()
    ? chats.filter((c) => (c.title || "New Chat").toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [mobileOpen]);

  const initials = (user?.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2.5 bg-[#0e0e1f]/90 hover:bg-[#151528] text-white rounded-xl shadow-xl border border-white/[0.08] transition-all duration-200 backdrop-blur-md"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={17} /> : <Menu size={17} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 lg:z-10
          w-70 sm:w-75 lg:w-72 h-screen
          bg-[#0b0b1a] border-r border-white/[0.06]
          transform transition-transform duration-300 ease-in-out
          flex flex-col overflow-hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="shrink-0 p-4 mt-14 lg:mt-0 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-linear-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-bold bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Nova AI</span>
          </div>

          <button
            onClick={() => { onSelect(null); setMobileOpen(false); }}
            className="w-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 p-2.5 rounded-xl flex items-center gap-2 justify-center font-medium text-sm text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2.5} />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-3 py-2.5">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 focus-within:border-violet-500/40 transition-all duration-200">
            <Search size={13} className="text-slate-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats…"
              className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-600 hover:text-slate-400 transition-colors">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 min-h-0">
          {loading ? (
            <div className="py-1">
              {[40, 55, 35, 65, 45, 50].map((w, i) => (
                <ChatSkeleton key={i} delay={w} />
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 bg-white/[0.04] border border-white/[0.07] rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare size={22} className="text-violet-400/50" />
              </div>
              <p className="text-sm font-medium text-slate-300 mb-1">
                {searchQuery ? "No results" : "No chats yet"}
              </p>
              <p className="text-xs text-slate-600">
                {searchQuery ? "Try a different search" : "Start a new conversation"}
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chatId === chat.id;
              const isRenaming = renamingId === chat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-violet-500/15 border border-violet-500/30"
                      : "hover:bg-white/[0.05] border border-transparent"
                  }`}
                >
                  {/* Active bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-linear-to-b from-violet-400 to-cyan-400 rounded-r-full" />
                  )}

                  <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? "bg-violet-500/20" : "bg-white/[0.04] group-hover:bg-white/[0.08]"
                  }`}>
                    <MessageSquare size={13} className={isActive ? "text-violet-400" : "text-slate-500 group-hover:text-violet-400"} />
                  </div>

                  {isRenaming ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => handleRenameKeyDown(e, chat.id)}
                      onBlur={() => commitRename(chat.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-violet-500/10 text-xs text-slate-100 rounded-lg px-2 py-1 outline-none border border-violet-500/40 min-w-0"
                      maxLength={100}
                    />
                  ) : (
                    <span className={`flex-1 truncate text-xs transition-colors min-w-0 ${
                      isActive ? "text-violet-200 font-medium" : "text-slate-400 group-hover:text-slate-200"
                    }`}>
                      {chat.title || "New Chat"}
                    </span>
                  )}

                  {isRenaming ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); commitRename(chat.id); }}
                      disabled={renamingLoading}
                      className="shrink-0 p-1.5 rounded-md text-violet-400 hover:bg-violet-500/20 transition-colors"
                    >
                      {renamingLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    </button>
                  ) : (
                    <div className={`shrink-0 flex items-center gap-0.5 transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      <button
                        onClick={(e) => startRename(e, chat)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                        title="Rename"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                        disabled={deletingId === chat.id}
                        className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        {deletingId === chat.id
                          ? <Loader2 size={12} className="animate-spin text-violet-400" />
                          : <Trash2 size={12} />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Profile */}
        <div ref={dropdownRef} className="shrink-0 p-3 border-t border-white/[0.06] relative" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <div
            onClick={() => setOpen((p) => !p)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 cursor-pointer group"
          >
            <div className="shrink-0 w-8 h-8 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md overflow-hidden">
              {user?.profilePicture
                ? <img src={user.profilePicture} alt={user?.name} className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-white">{initials}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate group-hover:text-white transition-colors">{user?.name || "User"}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || ""}</p>
            </div>
            <ChevronDown size={13} className={`shrink-0 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </div>

          {open && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#0e0e1f] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={() => { router.push("/profile"); setOpen(false); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition-all duration-150"
              >
                <User size={14} className="text-violet-400" />
                <span className="font-medium">View Profile</span>
              </button>
              <div className="border-t border-white/[0.06]" />
              <button
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
              >
                <LogOut size={14} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
