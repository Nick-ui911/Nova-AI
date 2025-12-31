"use client";

import { useState } from "react";
import ChatWindow from "../components/ChatWindow";
import Sidebar from "../components/SideBar";

export default function ChatPage() {
  const [chatId, setChatId] = useState(null);
  const [refreshSidebar, setRefreshSidebar] = useState(false);

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
