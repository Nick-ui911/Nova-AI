"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, MessageSquare, Hash, LogOut } from "lucide-react";
import api from "../../lib/axios";
import { clearUser } from "../../Redux/userSlice";

export default function ProfilePage() {
  const user = useSelector((store) => store.user.user);
  const authLoading = useSelector((store) => store.user.loading);
  const dispatch = useDispatch();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/"); return; }
    api.get("/api/profile")
      .then((res) => setProfile(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/api/logout");
    } catch {
      // ignore
    }
    dispatch(clearUser());
    router.replace("/");
  };

  const initials = (profile?.name || user?.name || "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-[#080812] text-white flex flex-col relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed top-0 left-0 w-125 h-125 bg-violet-600/8 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-100 h-100 bg-cyan-600/6 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#080812]/80 backdrop-blur-xl border-b border-white/6">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/chat")}
              className="p-2 rounded-xl text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-200"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-sm font-semibold text-slate-200">Profile</h1>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 disabled:opacity-50"
          >
            <LogOut size={13} />
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-10 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center gap-4 mt-24 w-full max-w-sm">
            <div className="w-20 h-20 rounded-3xl bg-white/5 skeleton" />
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-32 h-4 bg-white/5 rounded-full skeleton" />
              <div className="w-44 h-3 bg-white/4 rounded-full skeleton" style={{ animationDelay: "100ms" }} />
            </div>
            <div className="w-full space-y-3 mt-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-white/4 rounded-2xl skeleton" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 w-full mt-1">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-white/4 rounded-2xl skeleton" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Avatar card */}
            <div className="bg-white/4 border border-white/7 rounded-3xl p-7 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/30 ring-1 ring-violet-500/20 overflow-hidden">
                {user?.profilePicture
                  ? <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-white">{initials}</span>
                }
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-white">{profile?.name || user?.name || "User"}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{profile?.email || user?.email}</p>
              </div>
            </div>

            {/* Info rows */}
            <div className="bg-white/4 border border-white/7 rounded-2xl overflow-hidden">
              <InfoRow icon={<User size={14} />} label="Name" value={profile?.name || user?.name || "—"} />
              <div className="border-t border-white/6" />
              <InfoRow icon={<Mail size={14} />} label="Email" value={profile?.email || user?.email || "—"} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<MessageSquare size={18} />} label="Total Chats" value={profile?.chatCount ?? "—"} color="violet" />
              <StatCard icon={<Hash size={18} />} label="Messages" value={profile?.messageCount ?? "—"} color="cyan" />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => router.push("/chat")}
                className="w-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-3 rounded-xl text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-200 hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                Back to Chat
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 border border-white/6 hover:border-red-500/20 hover:bg-red-500/8 transition-all duration-200 disabled:opacity-50"
              >
                {loggingOut ? "Logging out…" : "Logout"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="text-violet-400 shrink-0">{icon}</span>
      <span className="text-xs text-slate-500 w-12 shrink-0">{label}</span>
      <span className="text-sm text-slate-200 truncate">{value}</span>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  };
  return (
    <div className="bg-white/4 border border-white/7 rounded-2xl p-5 flex flex-col items-center gap-2.5">
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="text-[11px] text-slate-500 text-center">{label}</span>
    </div>
  );
}
