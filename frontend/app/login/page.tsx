"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, LogIn, UserPlus, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "@/config";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Redirect to dashboard if token exists
    if (localStorage.getItem("token")) {
      router.push("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const endpoint = isLogin ? "/auth/login" : "/auth/signup";
    const body = isLogin 
      ? { email, password } 
      : { email, password, name };

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Authentication failed.");
      }

      const data = await response.json();

      if (isLogin) {
        // Save token and redirect
        localStorage.setItem("token", data.access_token);
        router.push("/dashboard");
      } else {
        // Transition to login tab automatically on signup success
        setIsLogin(true);
        setErrorMsg("Account created successfully! Please log in.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12 overflow-hidden">
      {/* Background Gradients & Grid */}
      <div className="absolute inset-0 bg-grid pointer-events-none z-0" />
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] bg-violet-500/10 rounded-full filter blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] bg-cyan-500/10 rounded-full filter blur-3xl" />

      {/* Back button */}
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors z-10"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      {/* Main Login Card */}
      <div className="glass p-8 rounded-3xl border border-white/5 max-w-sm w-full z-10 relative overflow-hidden">
        {/* Glowing cyber gradient line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Brand logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
            <Activity className="h-6 w-6 text-cyan-400 glow-pulse" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 bg-clip-text text-transparent tracking-wide">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-1">
            NeuralVision AI Access
          </p>
        </div>

        {errorMsg && (
          <div className={`p-3 rounded-lg text-xs mb-4 text-center border ${
            errorMsg.includes("successfully") 
              ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/20" 
              : "bg-rose-950/30 text-rose-400 border-rose-500/20"
          }`}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500/30 transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5 mb-6">
            <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500/30 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 btn-cyber rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            <span>{loading ? "Authenticating..." : isLogin ? "Login" : "Sign Up"}</span>
          </button>
        </form>

        {/* Tab switch link */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg("");
            }}
            className="text-xs text-slate-400 hover:text-cyan-400 transition-colors font-medium cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
