"use client";

import { useEffect, useState, useRef } from "react";
import ChatInput from "./ChatInput";
import api from "../../lib/axios";

export default function ChatWindow({ chatId, setChatId, onNewChat, onToggleSidebar }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const previousChatIdRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiThinking]);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      previousChatIdRef.current = null;
      return;
    }

    if (previousChatIdRef.current === null && messages.length > 0) {
      previousChatIdRef.current = chatId;
      return;
    }

    setIsLoading(true);
    api
      .get(`/api/chat/${chatId}`)
      .then((res) => {
        setMessages(res.data);
        setIsLoading(false);
        previousChatIdRef.current = chatId;
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [chatId]);

  const handleAppend = (msg) => {
    setMessages((prev) => [...prev, msg]);
    if (msg.role === "user") {
      setIsAiThinking(true);
    } else if (msg.role === "ai") {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-amber-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: "2s" }}></div>
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-orange-500/20 shadow-lg">
        <div className="px-3 py-3 sm:px-4 md:px-6">
          <div className="max-w-full mx-auto flex items-center justify-center">
            {/* App Name and Logo - Centered */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              
              <div className="flex flex-col">
                <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent tracking-tight">
                  Nova Chat AI
                </h1>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 -mt-0.5">
                  Powered by Intelligence
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="flex-1 p-3 sm:p-4 md:p-6 pb-24 sm:pb-28 md:pb-32 overflow-y-auto space-y-3 sm:space-y-4 md:space-y-6 relative z-10 scroll-smooth"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-slate-900/90 backdrop-blur-md rounded-2xl px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 shadow-2xl border border-orange-500/20">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="flex space-x-1 sm:space-x-1.5">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                  <span className="text-xs sm:text-sm font-medium bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                    Loading your chat...
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center px-4">
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-xl shadow-orange-500/20">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-sm sm:text-base md:text-lg font-medium bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Start a conversation
              </p>
              <p className="text-xs sm:text-sm text-slate-400">
                Send a message to begin your chat
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, index) => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                } animate-in fade-in slide-in-from-bottom-4 duration-500`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start space-x-2 sm:space-x-2.5 md:space-x-3 max-w-[90%] sm:max-w-[85%] md:max-w-2xl lg:max-w-3xl">
                  {m.role !== "user" && (
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 rounded-xl sm:rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${
                      m.role === "user"
                        ? "bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white shadow-orange-500/20"
                        : "bg-slate-800/80 text-slate-100 border border-orange-500/20 shadow-orange-500/10"
                    }`}
                  >
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {m.content}
                    </p>
                  </div>
                  {m.role === "user" && (
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center shadow-lg border border-orange-500/30">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isAiThinking && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start space-x-2 sm:space-x-2.5 md:space-x-3 max-w-[90%] sm:max-w-[85%] md:max-w-2xl lg:max-w-3xl">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 rounded-xl sm:rounded-2xl shadow-lg backdrop-blur-sm bg-slate-800/80 text-slate-100 border border-orange-500/20 shadow-orange-500/10">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                      <span className="text-[10px] sm:text-xs text-slate-400">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <ChatInput
        chatId={chatId}
        setChatId={setChatId}
        onAppend={handleAppend}
        onNewChat={onNewChat}
      />
    </div>
  );
}