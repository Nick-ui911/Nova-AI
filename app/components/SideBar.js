"use client";

import { useEffect, useState } from "react";
import api from "../../lib/axios";
import { Trash2, MessageSquare, Plus, Loader2 } from "lucide-react";

export default function Sidebar({ onSelect, refresh, onRefreshed }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

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

  return (
    <div className="w-72 bg-gray-900 text-white flex flex-col h-full border-r">
      <div className="p-4">
        <button
          onClick={() => onSelect(null)}
          className="w-full bg-blue-600 p-3 rounded flex gap-2 justify-center"
        >
          <Plus size={18} /> New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <Loader2 className="animate-spin mx-auto mt-10" />
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className="group flex items-center gap-3 p-3 rounded hover:bg-gray-800"
            >
              <MessageSquare size={16} />

              <span
                onClick={() => onSelect(chat.id)}
                className="flex-1 truncate cursor-pointer"
              >
                {chat.title || "New Chat"}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="opacity-0 group-hover:opacity-100"
              >
                {deletingId === chat.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
