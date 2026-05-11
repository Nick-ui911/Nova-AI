"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import ChatWindow from "../components/ChatWindow";
import Sidebar from "../components/SideBar";
import { useSelector } from "react-redux";
import Loader from "../components/Loader";

export default function ChatPage() {
  const [chatId, setChatId] = useState(null);
  const [chatTitle, setChatTitle] = useState(null);
  const [refreshSidebar, setRefreshSidebar] = useState(false);
  const user = useSelector((store) => store.user.user);
  const chatInputRef = useRef(null);

  // Cmd+K / Ctrl+K → new chat
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setChatId(null);
        setChatTitle(null);
        chatInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = useCallback((id, title) => {
    setChatId(id);
    setChatTitle(title ?? null);
  }, []);

  // After sidebar refreshes, sync title if current chatId just got one
  const handleChatsLoaded = useCallback((chats) => {
    setChatTitle((prev) => {
      if (!chatId) return null;
      const found = chats.find((c) => c.id === chatId);
      return found?.title ?? prev;
    });
  }, [chatId]);

  if (!user) return <Loader />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        chatId={chatId}
        onSelect={handleSelect}
        refresh={refreshSidebar}
        onRefreshed={() => setRefreshSidebar(false)}
        onChatsLoaded={handleChatsLoaded}
      />
      <ChatWindow
        chatId={chatId}
        chatTitle={chatTitle}
        setChatId={setChatId}
        onNewChat={() => setRefreshSidebar(true)}
        chatInputRef={chatInputRef}
      />
    </div>
  );
}
