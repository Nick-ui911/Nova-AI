"use client";
import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, Sparkles, Zap, Shield } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser } from "../Redux/userSlice";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../lib/firebaseWeb.js";

const features = [
  { icon: <Sparkles size={18} />, title: "Context-aware AI", desc: "Remembers your full conversation history for smarter replies." },
  { icon: <Zap size={18} />, title: "Real-time streaming", desc: "See responses as they're generated — no waiting." },
  { icon: <Shield size={18} />, title: "Secure by default", desc: "JWT-authenticated sessions with encrypted storage." },
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? "/api/login" : "/api/signup";
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };

      const response = await axios.post(endpoint, payload);
      dispatch(setUser(response.data.user));
      setSuccess(isLogin ? "Welcome back! Redirecting…" : "Account created! Redirecting…");
      setTimeout(() => router.push("/chat"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const res = await axios.post("/api/google-login", { idToken });
      dispatch(setUser(res.data.user));
      router.push("/chat");
    } catch (err) {
      console.error(err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-violet-600/20 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/15 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Success toast */}
      {success && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 bg-white/[0.08] backdrop-blur-xl border border-green-500/30 text-green-300 px-5 py-3 rounded-2xl shadow-2xl shadow-green-500/10 text-sm font-medium">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {success}
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">

        {/* Left — Branding */}
        <div className="hidden md:flex flex-col gap-10 px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-linear-to-br from-violet-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              Nova AI
            </span>
          </div>

          <div>
            <h1 className="text-5xl font-bold text-white leading-[1.15] mb-5">
              Chat smarter.<br />
              <span className="bg-linear-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Think deeper.
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              An AI that remembers context, understands nuance, and gets better with every message.
            </p>
          </div>

          <div className="space-y-5">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-9 h-9 bg-violet-500/15 border border-violet-500/25 rounded-xl flex items-center justify-center text-violet-400 shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.07] rounded-3xl p-7 sm:p-9 shadow-2xl shadow-violet-500/5">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-7 md:hidden">
            <div className="w-8 h-8 bg-linear-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-base font-bold bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Nova AI</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-white mb-1">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-sm text-slate-400">
              {isLogin ? "Sign in to continue your conversations" : "Get started for free — no credit card needed"}
            </p>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] hover:border-white/[0.2] rounded-xl py-3 text-sm font-medium text-slate-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {googleLoading ? "Signing in…" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.07]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0e0e20] px-3 text-xs text-slate-500">or with email</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <InputField
                icon={<User size={15} />}
                label="Full Name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            )}
            <InputField
              icon={<Mail size={15} />}
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{<Lock size={15} />}</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-white/[0.05] border border-white/[0.08] focus:border-violet-500/50 focus:bg-white/[0.08] rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {!isLogin && (
              <InputField
                icon={<Lock size={15} />}
                label="Confirm Password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              ) : (
                <>{isLogin ? "Sign In" : "Create Account"}<ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(""); setFormData({ name: "", email: "", password: "", confirmPassword: "" }); }}
              className="ml-1.5 text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function InputField({ icon, label, name, type, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/[0.08] focus:border-violet-500/50 focus:bg-white/[0.08] rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
        />
      </div>
    </div>
  );
}
