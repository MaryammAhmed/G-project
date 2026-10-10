"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CyberShell from "@/components/layout/CyberShell";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await res.json();

      if (data.otp_required) {
        router.push(`/verify-otp?username=${encodeURIComponent(data.username)}`);
        return;
      }

      // Updated: Removed age_group since tiers were dropped
      login(data.token, data.email);
      alert(`Welcome back, Agent ${username}.`);
    } catch (err: any) {
      console.error("Login failed:", err);
      alert(err.message);
    }
  };

  return (
    <CyberShell variant="center" accent="cyan">
      {/* ---- Floating Sticker Decorations ---- */}
      <div className="hidden sm:block absolute top-[12%] left-[8%] -rotate-6 bg-panel border border-emerald-400/40 rounded px-3 py-2 font-hud text-[10px] text-emerald-400">
        root@cyberguard:~# <br />access_granted
      </div>

      <div className="hidden sm:flex absolute top-[18%] right-[10%] rotate-[4deg] bg-panel border border-brick/50 rounded px-3 py-2 font-hud text-[10px] text-brick items-center gap-1">
        <span>📶</span> unsecured network
      </div>

      <div className="hidden sm:flex absolute bottom-[16%] left-[10%] rotate-[5deg] bg-panel border border-cyan/40 rounded-full w-12 h-12 items-center justify-center text-xl">
        💀
      </div>

      <div className="hidden sm:block absolute bottom-[20%] right-[8%] rotate-[-4deg] bg-panel border border-violet-400/40 rounded px-3 py-2 font-hud text-[10px] text-violet-400">
        no system<br />is safe
      </div>

      <div className="hidden sm:flex absolute top-[45%] left-[4%] rotate-[-8deg] bg-panel border border-cyan/30 rounded-full w-10 h-10 items-center justify-center text-lg">
        🔒
      </div>

      {/* ---- Main Glassmorphism Login Card ---- */}
      <div className="cg-glass relative z-10 w-full max-w-md p-8 space-y-6">
        {/* Terminal Header Dots */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brick" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-cyan" />
        </div>

        <div>
          <p className="cg-kicker mb-1">{"// SECURE ACCESS TERMINAL"}</p>
          <h2 className="cg-title text-2xl font-bold text-cyan">
            Welcome Back, Agent
          </h2>
          <p className="mt-1 text-xs text-text-secondary font-hud">
            Sign in to resume your CyberGuard training
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="cg-label">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="cg-input"
              placeholder="Your username"
            />
          </div>

          <div>
            <label className="cg-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cg-input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="cg-btn w-full font-hud uppercase font-bold tracking-wider">
            Sign In →
          </button>
        </form>

        <p className="text-center text-xs text-text-secondary font-hud">
          New to the game?{" "}
          <Link
            href="/register"
            className="text-cyan hover:underline font-semibold"
          >
            Create an account
          </Link>
        </p>
      </div>
    </CyberShell>
  );
}
