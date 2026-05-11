"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../lib/axios";
import {
  Trash2, MessageSquare, Plus, User, Menu, X,
  ChevronDown, Pencil, Check, Search, LogOut, Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { clearUser } from "../../Redux/userSlice";
import { toast } from "./Toast";

/* ── Skeleton ── */
function ChatSkeleton({ delay = 0 }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl">
      <div className="w-7 h-7 bg-white/5 rounded-lg skeleton shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 bg-white/5 rounded-full skeleton" style={{ width: `${50 + delay}%`, animationDelay: `${delay * 20}ms` }} />
        <div className="h-2 bg-white/3 rounded-full skeleton" style={{ width: `${30 + delay}%`, animationDelay: `${delay * 20 + 100}ms` }} />
      </div>
    </div>
  );
}

/* ── Date grouping ── */
function groupByDate(chats) {
  const now = new Date();
  const sod = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = sod(now);
  const yesterday = new Date(today - 864e5);
  const lastWeek = new Date(today - 7 * 864e5);

  const buckets = { Today: [], Yesterday: [], "This week": [], Older: [] };
  chats.forEach((c) => {
    const d = new Date(c.createdAt);
    if (d >= today) buckets.Today.push(c);
    else if (d >= yesterday) buckets.Yesterday.push(c);
    else if (d >= lastWeek) buckets["This week"].push(c);
    else buckets.Older.push(c);
  });
  return Object.entries(buckets).filter(([, items]) => items.length > 0);
}

export default function Sidebar({ chatId, onSelect, refresh, onRefreshed, onChatsLoaded }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
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
  const confirmTimerRef = useRef(null);

  const handleLogout = async () => {
    try {
      await api.post("/api/logout");
      dispatch(clearUser());
      router.replace("/");
    } catch {
      toast("Logout failed", "error");
    }
  };

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/chat");
      setChats(res.data);
      onChatsLoaded?.(res.data);
    } catch {
      toast("Failed to load chats", "error");
    } finally {
      setLoading(false);
    }
  }, [onChatsLoaded]);

  useEffect(() => { fetchChats(); }, []);
  useEffect(() => { if (refresh) { fetchChats(); onRefreshed(); } }, [refresh]);
  useEffect(() => { if (renamingId && renameInputRef.current) renameInputRef.current.focus(); }, [renamingId]);

  /* ── Delete with inline confirm ── */
  const requestDelete = (e, id) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
    clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => setConfirmDeleteId(null), 3000);
  };

  const confirmDelete = async (e, id) => {
    e.stopPropagation();
    clearTimeout(confirmTimerRef.current);
    setConfirmDeleteId(null);
    try {
      setDeletingId(id);
      await api.delete(`/api/chat/${id}`);
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (chatId === id) onSelect(null, null);
      toast("Chat deleted", "success");
    } catch {
      toast("Failed to delete chat", "error");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Rename ── */
  const startRename = (e, chat) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
    setRenamingId(chat.id);
    setRenameValue(chat.title || "");
  };

  const commitRename = async (id) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    if (renameValue.trim() === chats.find((c) => c.id === id)?.title) { setRenamingId(null); return; }
    try {
      setRenamingLoading(true);
      const res = await api.patch(`/api/chat/${id}`, { title: renameValue.trim() });
      setChats((prev) => prev.map((c) => c.id === id ? { ...c, title: res.data.title } : c));
      toast("Chat renamed", "success");
    } catch {
      toast("Failed to rename", "error");
    } finally {
      setRenamingLoading(false);
      setRenamingId(null);
    }
  };

  const handleRenameKey = (e, id) => {
    if (e.key === "Enter") { e.preventDefault(); commitRename(id); }
    if (e.key === "Escape") setRenamingId(null);
  };

  const handleChatSelect = (chat) => {
    if (renamingId) return;
    setConfirmDeleteId(null);
    onSelect(chat.id, chat.title);
    setMobileOpen(false);
  };

  /* ── Filter + group ── */
  const filtered = searchQuery.trim()
    ? chats.filter((c) => (c.title || "New Chat").toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;
  const groups = groupByDate(filtered);

  /* ── Side effects ── */
  useEffect(() => {
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [mobileOpen]);

  const initials = (user?.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2.5 bg-[#0e0e1f]/90 hover:bg-[#151528] text-white rounded-xl shadow-xl border border-white/8 transition-all duration-200 backdrop-blur-md"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={17} /> : <Menu size={17} />}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 lg:z-10
        w-70 sm:w-75 lg:w-72 h-screen
        bg-[#0b0b1a] border-r border-white/6
        transform transition-transform duration-300 ease-in-out
        flex flex-col overflow-hidden
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Header */}
        <div className="shrink-0 p-4 mt-14 lg:mt-0 border-b border-white/6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-linear-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Nova AI</span>
              <p className="text-[10px] text-slate-600 -mt-0.5">⌘K for new chat</p>
            </div>
          </div>
          <button
            onClick={() => { onSelect(null, null); setMobileOpen(false); }}
            className="w-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 p-2.5 rounded-xl flex items-center gap-2 justify-center font-medium text-sm text-white shadow-lg shadow-violet-500/20 transition-all duration-200 hover:shadow-violet-500/35 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={15} strokeWidth={2.5} />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-3 py-2.5">
          <div className="flex items-center gap-2 bg-white/4 border border-white/7 rounded-xl px-3 py-2 focus-within:border-violet-500/40 transition-all duration-200">
            <Search size={13} className="text-slate-600 shrink-0" />
            <input
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
        <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
          {loading ? (
            <div className="py-1">
              {[40, 55, 35, 65, 45, 50].map((w, i) => <ChatSkeleton key={i} delay={w} />)}
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 bg-white/4 border border-white/7 rounded-2xl flex items-center justify-center mb-3">
                <MessageSquare size={18} className="text-violet-400/40" />
              </div>
              <p className="text-xs font-medium text-slate-400 mb-1">{searchQuery ? "No results" : "No chats yet"}</p>
              <p className="text-[11px] text-slate-600">{searchQuery ? "Try another search" : "Start a new conversation"}</p>
            </div>
          ) : (
            groups.map(([label, items]) => (
              <div key={label} className="mt-3 first:mt-1">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">{label}</p>
                <div className="space-y-0.5">
                  {items.map((chat) => {
                    const isActive = chatId === chat.id;
                    const isRenaming = renamingId === chat.id;
                    const isConfirming = confirmDeleteId === chat.id;
                    const preview = chat.lastMessage?.content?.slice(0, 55);

                    return (
                      <div
                        key={chat.id}
                        onClick={() => handleChatSelect(chat)}
                        className={`group relative flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-violet-500/15 border border-violet-500/30"
                            : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-linear-to-b from-violet-400 to-cyan-400 rounded-r-full" />
                        )}

                        <div className={`shrink-0 w-7 h-7 mt-0.5 rounded-lg flex items-center justify-center transition-colors ${
                          isActive ? "bg-violet-500/20" : "bg-white/4 group-hover:bg-white/8"
                        }`}>
                          <MessageSquare size={13} className={isActive ? "text-violet-400" : "text-slate-600 group-hover:text-violet-400"} />
                        </div>

                        <div className="flex-1 min-w-0">
                          {isRenaming ? (
                            <input
                              ref={renameInputRef}
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => handleRenameKey(e, chat.id)}
                              onBlur={() => commitRename(chat.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-violet-500/10 text-xs text-slate-100 rounded-lg px-2 py-0.5 outline-none border border-violet-500/40"
                              maxLength={100}
                            />
                          ) : (
                            <>
                              <p className={`text-xs truncate transition-colors ${isActive ? "text-violet-200 font-medium" : "text-slate-300 group-hover:text-slate-100"}`}>
                                {chat.title || "New Chat"}
                              </p>
                              {preview && (
                                <p className="text-[10px] text-slate-600 truncate mt-0.5 leading-relaxed">
                                  {chat.lastMessage?.role === "ai" ? "AI: " : ""}{preview}
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        {isConfirming ? (
                          <div className="shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] text-red-400 font-medium">Delete?</span>
                            <button
                              onClick={(e) => confirmDelete(e, chat.id)}
                              disabled={deletingId === chat.id}
                              className="px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400 text-[10px] font-medium hover:bg-red-500/30 transition-colors"
                            >
                              {deletingId === chat.id ? <Loader2 size={10} className="animate-spin" /> : "Yes"}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                              className="px-1.5 py-0.5 rounded-md text-slate-500 text-[10px] font-medium hover:text-slate-300 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : isRenaming ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); commitRename(chat.id); }}
                            disabled={renamingLoading}
                            className="shrink-0 p-1.5 rounded-md text-violet-400 hover:bg-violet-500/20 transition-colors"
                          >
                            {renamingLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          </button>
                        ) : (
                          <div className={`shrink-0 flex items-center gap-0.5 mt-0.5 transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                            <button
                              onClick={(e) => startRename(e, chat)}
                              className="p-1.5 rounded-md text-slate-600 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                              title="Rename"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={(e) => requestDelete(e, chat.id)}
                              className="p-1.5 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Profile */}
        <div ref={dropdownRef} className="shrink-0 p-3 border-t border-white/6 relative" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <div
            onClick={() => setOpen((p) => !p)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/4 hover:bg-white/7 border border-white/6 hover:border-white/12 transition-all duration-200 cursor-pointer group"
          >
            <div className="shrink-0 w-8 h-8 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md overflow-hidden">
              {user?.profilePicture
                ? <img src={user.profilePicture} alt={user?.name} className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-white">{initials}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate group-hover:text-white transition-colors">{user?.name || "User"}</p>
              <p className="text-[10px] text-slate-600 truncate">{user?.email || ""}</p>
            </div>
            <ChevronDown size={13} className={`shrink-0 text-slate-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </div>

          {open && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#0e0e1f] border border-white/8 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={() => { router.push("/profile"); setOpen(false); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-150"
              >
                <User size={14} className="text-violet-400" />
                <span className="font-medium">View Profile</span>
              </button>
              <div className="border-t border-white/6" />
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
