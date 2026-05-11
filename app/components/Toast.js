"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

// Module-level singleton so any file can call toast() without Context
let _addToast = null;

export function toast(message, type = "success") {
  _addToast?.({ message, type, id: Date.now() + Math.random() });
}

const CONFIG = {
  success: {
    icon: <CheckCircle size={14} className="text-emerald-400 shrink-0" />,
    bar: "bg-emerald-500",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/8",
  },
  error: {
    icon: <XCircle size={14} className="text-red-400 shrink-0" />,
    bar: "bg-red-500",
    border: "border-red-500/20",
    bg: "bg-red-500/8",
  },
  info: {
    icon: <Info size={14} className="text-violet-400 shrink-0" />,
    bar: "bg-violet-500",
    border: "border-violet-500/20",
    bg: "bg-violet-500/8",
  },
};

const DURATION = 3200;

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _addToast = (t) => {
      setToasts((prev) => [...prev.slice(-4), t]); // max 5 at once
      setTimeout(() => remove(t.id), DURATION);
    };
    return () => { _addToast = null; };
  }, []);

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const c = CONFIG[t.type] ?? CONFIG.info;
        return (
          <div
            key={t.id}
            className={`flex items-center gap-3 pl-3 pr-2 py-3 rounded-2xl border backdrop-blur-2xl shadow-2xl shadow-black/50 pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-300 min-w-52 max-w-xs ${c.bg} ${c.border}`}
          >
            {c.icon}
            <span className="flex-1 text-xs font-medium text-slate-200">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-300 transition-colors shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
