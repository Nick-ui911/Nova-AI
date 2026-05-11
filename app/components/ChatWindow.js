"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import ChatInput from "./ChatInput";
import api from "../../lib/axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, RefreshCw } from "lucide-react";

/* ── helpers ── */
function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`p-1.5 rounded-lg transition-all duration-200 ${copied ? "text-emerald-400 bg-emerald-500/10" : "text-slate-500 hover:text-violet-400 hover:bg-violet-500/10"}`}
      title={copied ? "Copied!" : "Copy"}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

/* ── Skeleton message bubbles shown while loading ── */
function MessageSkeletons() {
  const rows = [
    { align: "end", widths: [140] },
    { align: "start", widths: [200, 160] },
    { align: "end", widths: [100] },
    { align: "start", widths: [220, 180, 120] },
  ];
  return (
    <div className="space-y-6 p-4 pt-6">
      {rows.map((row, i) => (
        <div key={i} className={`flex items-end gap-2.5 ${row.align === "end" ? "justify-end" : "justify-start"}`}>
          {row.align === "start" && (
            <div className="w-7 h-7 rounded-full bg-white/[0.06] skeleton shrink-0" />
          )}
          <div className={`flex flex-col gap-1.5 ${row.align === "end" ? "items-end" : "items-start"}`}>
            {row.widths.map((w, j) => (
              <div key={j} className="h-4 bg-white/[0.06] rounded-2xl skeleton" style={{ width: `${w}px`, animationDelay: `${(i + j) * 80}ms` }} />
            ))}
          </div>
          {row.align === "end" && (
            <div className="w-7 h-7 rounded-full bg-white/[0.06] skeleton shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Markdown components ── */
function makeMarkdownComponents() {
  return {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const code = String(children).replace(/\n$/, "");
      if (!inline && match) {
        return (
          <div className="my-3 rounded-xl overflow-hidden border border-white/[0.08]">
            <div className="flex items-center justify-between bg-white/[0.06] px-4 py-2">
              <span className="text-[11px] text-slate-400 font-mono">{match[1]}</span>
              <button onClick={() => navigator.clipboard.writeText(code)} className="text-[11px] text-slate-500 hover:text-violet-400 transition-colors">Copy</button>
            </div>
            <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.78rem", background: "rgba(255,255,255,0.03)" }} {...props}>
              {code}
            </SyntaxHighlighter>
          </div>
        );
      }
      return <code className="bg-violet-500/15 text-violet-300 px-1.5 py-0.5 rounded-md text-[0.8em] font-mono" {...props}>{children}</code>;
    },
    p({ children }) { return <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>; },
    ul({ children }) { return <ul className="list-disc list-inside mb-2.5 space-y-1 pl-1">{children}</ul>; },
    ol({ children }) { return <ol className="list-decimal list-inside mb-2.5 space-y-1 pl-1">{children}</ol>; },
    li({ children }) { return <li className="text-slate-300 leading-relaxed">{children}</li>; },
    h1({ children }) { return <h1 className="text-lg font-bold text-white mb-3 mt-4 first:mt-0">{children}</h1>; },
    h2({ children }) { return <h2 className="text-base font-bold text-white mb-2 mt-3 first:mt-0">{children}</h2>; },
    h3({ children }) { return <h3 className="text-sm font-semibold text-violet-300 mb-2 mt-3 first:mt-0">{children}</h3>; },
    strong({ children }) { return <strong className="font-semibold text-white">{children}</strong>; },
    em({ children }) { return <em className="italic text-slate-300">{children}</em>; },
    blockquote({ children }) { return <blockquote className="border-l-2 border-violet-500/50 pl-4 italic text-slate-400 my-3">{children}</blockquote>; },
    table({ children }) { return <div className="overflow-x-auto my-3"><table className="min-w-full border border-white/[0.08] rounded-xl overflow-hidden text-xs">{children}</table></div>; },
    th({ children }) { return <th className="px-3 py-2 bg-white/[0.07] text-left font-semibold text-slate-200 border-b border-white/[0.06] uppercase tracking-wide">{children}</th>; },
    td({ children }) { return <td className="px-3 py-2 text-slate-300 border-b border-white/[0.05]">{children}</td>; },
    a({ href, children }) { return <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">{children}</a>; },
    hr() { return <hr className="border-white/[0.08] my-4" />; },
  };
}
const markdownComponents = makeMarkdownComponents();

/* ── Main component ── */
export default function ChatWindow({ chatId, setChatId, onNewChat }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isWaiting]);

  useEffect(() => {
    if (!chatId) { setMessages([]); return; }
    setIsLoading(true);
    api.get(`/api/chat/${chatId}`)
      .then((res) => setMessages(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [chatId]);

  const handleAppend = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
    if (msg.role === "ai" && msg.streaming) setIsStreaming(true);
  }, []);

  const handleStreamChunk = useCallback((msgId, chunk) => {
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: (m.content || "") + chunk } : m));
  }, []);

  const handleStreamDone = useCallback((msgId) => {
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, streaming: false } : m));
    setIsStreaming(false);
  }, []);

  const handleRegenerate = async () => {
    if (!chatId || isStreaming || isWaiting) return;
    const lastAiIdx = [...messages].map((m, i) => ({ ...m, i })).reverse().find((m) => m.role === "ai")?.i;
    if (lastAiIdx == null) return;

    setMessages((prev) => prev.slice(0, lastAiIdx));
    setIsWaiting(true);

    try {
      const response = await fetch("/api/gemini/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chatId }),
      });
      if (!response.ok) { setIsWaiting(false); return; }

      const aiMsgId = Date.now();
      setIsWaiting(false);
      handleAppend({ role: "ai", content: "", id: aiMsgId, streaming: true, createdAt: new Date().toISOString() });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        handleStreamChunk(aiMsgId, decoder.decode(value, { stream: true }));
      }
      handleStreamDone(aiMsgId);
    } catch (err) {
      console.error(err);
      setIsWaiting(false);
      setIsStreaming(false);
    }
  };

  const lastAiMsgIdx = (() => { for (let i = messages.length - 1; i >= 0; i--) { if (messages[i].role === "ai") return i; } return -1; })();
  const isBusy = isStreaming || isWaiting;

  return (
    <div className="flex-1 flex flex-col bg-[#080812] relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/[0.07] rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/[0.05] rounded-full filter blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="shrink-0 sticky top-0 z-40 bg-[#080812]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center justify-center px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-linear-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent leading-none">Nova Chat AI</h1>
              <p className="text-[10px] text-slate-600 mt-0.5">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pb-32 relative z-10">
        {isLoading ? (
          <MessageSkeletons />
        ) : messages.length === 0 && !isWaiting ? (
          /* Empty state */
          <div className="h-full flex items-center justify-center px-6 min-h-[400px]">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-5 bg-linear-to-br from-violet-500/20 to-cyan-500/10 border border-violet-500/20 rounded-3xl flex items-center justify-center">
                <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Start a conversation</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Ask anything — Nova AI has full context of your conversation and streams responses in real time.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {messages.map((m, index) => (
              <div
                key={m.id}
                className={`flex items-end gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-3 duration-400`}
                style={{ animationDelay: `${Math.min(index * 20, 150)}ms` }}
              >
                {/* AI avatar */}
                {m.role === "ai" && (
                  <div className="shrink-0 w-7 h-7 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-5">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )}

                <div className={`flex flex-col gap-1 max-w-[80%] sm:max-w-[75%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                  {/* Bubble */}
                  <div className={`px-4 py-3 rounded-2xl shadow-lg ${
                    m.role === "user"
                      ? "bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-violet-500/20 rounded-br-sm"
                      : "bg-white/[0.05] border border-white/[0.08] text-slate-100 rounded-bl-sm backdrop-blur-sm"
                  }`}>
                    {m.role === "user" ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                    ) : (
                      <div className="text-sm leading-relaxed min-w-0">
                        {m.content
                          ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{m.content}</ReactMarkdown>
                          : null}
                        {m.streaming && (
                          <span className="inline-block w-1.5 h-4 bg-violet-400 ml-0.5 animate-pulse rounded-sm align-text-bottom" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className={`flex items-center gap-1 px-1 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.createdAt && (
                      <span className="text-[10px] text-slate-600">{formatTime(m.createdAt)}</span>
                    )}
                    {m.role === "ai" && !m.streaming && m.content && (
                      <>
                        <CopyButton text={m.content} />
                        {index === lastAiMsgIdx && !isBusy && (
                          <button
                            onClick={handleRegenerate}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-200"
                            title="Regenerate response"
                          >
                            <RefreshCw size={13} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* User avatar */}
                {m.role === "user" && (
                  <div className="shrink-0 w-7 h-7 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mb-5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {isWaiting && (
              <div className="flex items-end gap-2.5 justify-start animate-in fade-in slide-in-from-bottom-3 duration-300">
                <div className="shrink-0 w-7 h-7 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 160, 320].map((d) => (
                        <div key={d} className="w-1.5 h-1.5 bg-violet-400/60 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-500">Thinking…</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput
        chatId={chatId}
        setChatId={setChatId}
        onAppend={handleAppend}
        onStreamChunk={handleStreamChunk}
        onStreamDone={handleStreamDone}
        onNewChat={onNewChat}
        onSetWaiting={setIsWaiting}
        disabled={isBusy}
      />
    </div>
  );
}
