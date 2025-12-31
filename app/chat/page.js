"use client";

import { useEffect, useState } from "react";
import ChatWindow from "../components/ChatWindow";
import Sidebar from "../components/SideBar";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const [chatId, setChatId] = useState(null);
  const [refreshSidebar, setRefreshSidebar] = useState(false);
  const user = useSelector((store) => store.user.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/"); // 👈 better than push
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex h-screen">
      <Sidebar
        onSelect={setChatId}
        refresh={refreshSidebar}
        onRefreshed={() => setRefreshSidebar(false)}
      />

      <ChatWindow
        chatId={chatId}
        setChatId={setChatId}
        onNewChat={() => setRefreshSidebar(true)}
      />
    </div>
  );
}
