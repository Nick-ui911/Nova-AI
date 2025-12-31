"use client";

import { useState } from "react";
import api from "../../lib/axios";

export default function ChatInput({ chatId, setChatId, onAppend, onNewChat }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    onAppend({ role: "user", content: message, id: Date.now() });

    try {
      const res = await api.post("/api/gemini", { message, chatId });

      if (!chatId) {
        setChatId(res.data.chatId);
        onNewChat();
      }

      onAppend({ role: "ai", content: res.data.reply, id: Date.now() + 1 });
      setMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="p-6 relative">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-3 bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-orange-500/20 p-2 transition-all duration-300 hover:shadow-orange-500/20 focus-within:shadow-orange-500/30 focus-within:border-orange-500/40">
          {/* Input Container */}
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
              disabled={loading}
              className="w-full px-4 py-3 bg-transparent border-none outline-none resize-none text-slate-100 placeholder-slate-500 text-sm leading-relaxed max-h-32 overflow-y-auto disabled:opacity-50"
              placeholder="Ask me anything..."
              style={{
                minHeight: "44px",
                height: "auto",
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
              }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={loading || !message.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none group relative overflow-hidden"
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            
            {loading ? (
              <div className="flex space-x-0.5 relative z-10">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            ) : (
              <svg 
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 relative z-10" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}