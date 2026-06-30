"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, Menu, X, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { API_BASE_URL } from "@/config";
import { useBackend } from "./BackendStatusProvider";

export default function Navbar() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { status, elapsedSeconds } = useBackend();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          "Authorization": `Bearer ${savedToken}`
        }
      })
      .then(res => {
        if (res.ok) {
          setToken(savedToken);
        } else {
          localStorage.removeItem("token");
          setToken(null);
        }
      })
      .catch(() => {
        // Safe fallback: assume token is valid during network outage, or clear on auth error
        setToken(savedToken);
      });
    } else {
      setToken(null);
    }
  }, []);

  const getStatusBadge = () => {
    switch (status) {
      case "online":
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
            <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span>AI Server Ready</span>
          </div>
        );
      case "sleeping":
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-mono" title="The AI server goes to sleep to save energy when not in use. It takes about 50 seconds to wake up.">
            <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-ping" />
            <span>AI Server Waking Up ({elapsedSeconds}s)</span>
          </div>
        );
      case "offline":
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 font-mono">
            <span className="h-1.5 w-1.5 bg-rose-400 rounded-full animate-pulse" />
            <span>AI Server Offline</span>
          </div>
        );
      case "checking":
      default:
        return (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-[10px] text-slate-400 font-mono">
            <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-pulse" />
            <span>Connecting...</span>
          </div>
        );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 glass border-b border-white/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-white font-bold text-lg tracking-wider">
              <Activity className="h-6 w-6 text-cyan-400 glow-pulse" />
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
                NeuralVision AI
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {getStatusBadge()}
            <Link href="/dashboard?tab=sandbox" className="text-sm text-slate-300 hover:text-cyan-400 transition-colors">
              Sandbox
            </Link>
            <Link href="/dashboard?tab=xai" className="text-sm text-slate-300 hover:text-cyan-400 transition-colors">
              Audits (XAI)
            </Link>
            <Link href="/dashboard?tab=analytics" className="text-sm text-slate-300 hover:text-cyan-400 transition-colors">
              Metrics & MLOps
            </Link>
            {token ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-1.5 text-sm text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-slate-300 hover:text-rose-400 border border-slate-700/50 rounded-lg hover:border-rose-500/20 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white btn-cyber rounded-lg"
              >
                <LogIn className="h-4 w-4" />
                <span>Launch App</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle navigation menu"
              className="text-slate-400 hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass border-t border-white/5 px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <div className="px-3 py-2">
            {getStatusBadge()}
          </div>
          <Link
            href="/dashboard?tab=sandbox"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-cyan-400 hover:bg-white/5"
          >
            Sandbox
          </Link>
          <Link
            href="/dashboard?tab=xai"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-cyan-400 hover:bg-white/5"
          >
            Audits (XAI)
          </Link>
          <Link
            href="/dashboard?tab=analytics"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-cyan-400 hover:bg-white/5"
          >
            Metrics & MLOps
          </Link>
          {token ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-cyan-400 hover:bg-white/5"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="flex items-center space-x-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-rose-400 hover:bg-white/5 cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-white btn-cyber"
            >
              <LogIn className="h-5 w-5" />
              <span>Launch App</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
