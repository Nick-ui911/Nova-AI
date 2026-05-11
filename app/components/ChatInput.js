"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { ArrowUp, Square } from "lucide-react";

const MAX_CHARS = 4000;

const ChatInput = forwardRef(function ChatInput({
  chatId, setChatId, onAppend, onStreamChunk, onStreamDone, onNewChat, onSetWaiting, disabled,
}, ref) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  const sendMessage = async (overrideText) => {
    const trimmed = (overrideText !== undefined ? overrideText : message).trim();
    if (!trimmed || loading || disabled || trimmed.length > MAX_CHARS) return;

    setError("");
    setLoading(true);
    if (overrideText === undefined) {
      setMessage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
    onAppend({ role: "user", content: trimmed, id: Date.now(), createdAt: new Date().toISOString() });
    onSetWaiting?.(true);

    let aiMsgId = null;
    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: trimmed, chatId }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Error ${response.status}`);
      }

      const newChatId = response.headers.get("X-Chat-Id");
      if (!chatId && newChatId) { setChatId(newChatId); onNewChat(); }

      aiMsgId = Date.now() + 1;
      onSetWaiting?.(false);
      onAppend({ role: "ai", content: "", id: aiMsgId, streaming: true, createdAt: new Date().toISOString() });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          onStreamChunk(aiMsgId, decoder.decode(value, { stream: true }));
        }
      } catch (e) {
        if (e.name !== "AbortError") throw e;
      }
      onStreamDone(aiMsgId);
    } catch (err) {
      if (err.name === "AbortError") {
        onSetWaiting?.(false);
        if (aiMsgId != null) onStreamDone(aiMsgId);
      } else {
        console.error(err);
        onSetWaiting?.(false);
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    triggerSend: (text) => sendMessage(text),
    stop: () => abortRef.current?.abort(),
  }));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const charsLeft = MAX_CHARS - message.length;
  const isOverLimit = message.length > MAX_CHARS;
  const canSend = message.trim() && !loading && !disabled && !isOverLimit;

  return (
    <div className="fixed bottom-0 left-0 lg:left-72 right-0 z-30 pointer-events-none">
      {/* Fade gradient */}
      <div className="absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-[#080812] via-[#080812]/80 to-transparent pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 pb-5 pointer-events-auto">
        {/* Error banner */}
        {error && (
          <div className="mb-3 flex items-center gap-2.5 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs animate-in slide-in-from-bottom-2 duration-200">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0 animate-pulse" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")} className="text-red-400/60 hover:text-red-400 transition-colors shrink-0">✕</button>
          </div>
        )}

        {/* Input box */}
        <div className={`relative flex items-end gap-2 bg-white/5 backdrop-blur-2xl border rounded-2xl p-2 transition-all duration-200 shadow-2xl shadow-black/40 ${
          isOverLimit
            ? "border-red-500/40 shadow-red-500/10"
            : "border-white/9 focus-within:border-violet-500/40 focus-within:shadow-violet-500/10"
        }`}>
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading || disabled}
              placeholder="Message Nova AI…"
              className="w-full px-3 py-3 bg-transparent border-none outline-none resize-none text-slate-100 placeholder-slate-600 text-sm leading-relaxed max-h-36 overflow-y-auto disabled:opacity-40"
              style={{ minHeight: "44px", height: "auto" }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 144) + "px";
              }}
            />
            {message.length > MAX_CHARS * 0.75 && (
              <span className={`absolute bottom-2 right-2 text-[10px] tabular-nums ${isOverLimit ? "text-red-400" : "text-slate-600"}`}>
                {charsLeft}
              </span>
            )}
          </div>

          <button
            onClick={loading ? () => abortRef.current?.abort() : sendMessage}
            disabled={!loading && !canSend}
            className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
              loading
                ? "bg-white/8 hover:bg-red-500/15 cursor-pointer"
                : canSend
                  ? "bg-linear-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95"
                  : "bg-white/6 cursor-not-allowed"
            }`}
            aria-label={loading ? "Stop generating" : "Send message"}
          >
            {loading ? (
              <Square size={13} className="text-slate-300 fill-current" />
            ) : (
              <ArrowUp size={16} className={canSend ? "text-white" : "text-slate-600"} strokeWidth={2.5} />
            )}
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-2">
          <span className="text-slate-600">Shift+Enter</span> for new line · Nova AI can make mistakes
        </p>
      </div>
    </div>
  );
});

export default ChatInput;
