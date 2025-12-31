"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../lib/axios";
import { Trash2, MessageSquare, Plus, Loader2, User } from "lucide-react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearUser } from "../../Redux/userSlice";

export default function Sidebar({ onSelect, refresh, onRefreshed }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const user = useSelector((store) => store.user.user);
  const [open, setOpen] = useState(false);
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

  const deleteChat = async (chatId) => {
    if (!confirm("Delete this chat?")) return;

    try {
      setDeletingId(chatId);
      await api.delete(`/api/chat/${chatId}`);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      onSelect(null);
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

  return (
    <div className="w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col h-full border-r border-slate-800/50 backdrop-blur-xl">
      <div className="p-4 border-b border-slate-800/50">
        <button
          onClick={() => onSelect(null)}
          className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 p-3.5 rounded-xl flex items-center gap-2 justify-center font-medium shadow-lg shadow-orange-500/20 transition-all duration-200 hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={20} strokeWidth={2.5} /> New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {loading ? (
          <div className="flex items-center justify-center mt-10">
            <Loader2 className="animate-spin text-orange-400" size={24} />
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-slate-700/50"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                <MessageSquare
                  size={16}
                  className="text-slate-400 group-hover:text-orange-400 transition-colors"
                />
              </div>

              <span
                onClick={() => onSelect(chat.id)}
                className="flex-1 truncate text-sm text-slate-300 group-hover:text-white transition-colors"
              >
                {chat.title || "New Chat"}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                disabled={deletingId === chat.id}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-orange-500/10 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-100"
              >
                {deletingId === chat.id ? (
                  <Loader2 size={16} className="animate-spin text-orange-400" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Profile Section at Bottom */}
      <div
        ref={dropdownRef}
        className="p-4 border-t border-slate-800/50 relative"
      >
        <div
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all duration-200 cursor-pointer"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={20} className="text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute bottom-24 left-4 right-4 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
