"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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

      login(data.token, data.age_group, data.email);
      alert(`Welcome back, Tier ${data.age_group} agent.`);
    } catch (err: any) {
      console.error("Login failed:", err);
      alert(err.message);
    }
  };

  return (
    // Switched from slate-950/emerald to the real theme palette, and
    // this is now `relative` so the floating sticker icons below can
    // be positioned against it.
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-void px-4 text-white overflow-hidden">

      {/* Faint scanline texture — same idea as a CRT monitor, makes
          the whole page feel like a terminal, not a web form. */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, white 0px, white 1px, transparent 1px, transparent 3px)",
        }}
      />

      {/* Faint cyan glow behind the card, replaces the old emerald radial */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.07),transparent_50%)] pointer-events-none" />

      {/* ---- Floating sticker decorations ---- */}
      {/* Each one is just a small positioned box — cheap to render,
          no images needed. Hidden on small screens (sm:block) so
          they don't crowd a mobile layout. */}

      <div className="hidden sm:block absolute top-[12%] left-[8%] -rotate-6 bg-panel border border-term-green/40 rounded px-3 py-2 font-mono text-[10px] text-term-green">
        root@cyberguard:~# <br />access_granted
      </div>

      <div className="hidden sm:flex absolute top-[18%] right-[10%] rotate-[4deg] bg-panel border border-alert/50 rounded px-3 py-2 font-mono text-[10px] text-alert items-center gap-1">
        <span>📶</span> unsecured network
      </div>

      <div className="hidden sm:flex absolute bottom-[16%] left-[10%] rotate-[5deg] bg-panel border border-cyan/40 rounded-full w-12 h-12 items-center justify-center text-xl">
        💀
      </div>

      <div className="hidden sm:block absolute bottom-[20%] right-[8%] rotate-[-4deg] bg-panel border border-violet/40 rounded px-3 py-2 font-mono text-[10px] text-violet">
        no system<br />is safe
      </div>

      <div className="hidden sm:flex absolute top-[45%] left-[4%] rotate-[-8deg] bg-panel border border-cyan/30 rounded-full w-10 h-10 items-center justify-center text-lg">
        🔒
      </div>

      {/* ---- The actual login card ---- */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-cyan/30 bg-panel/80 p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.08)]">

        {/* Terminal-style header bar — three dots like image 1's
            terminal window, reinforces the "this is a terminal" feel */}
        <div className="flex items-center gap-1.5 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-alert" />
          <span className="w-2.5 h-2.5 rounded-full bg-term-green" />
          <span className="w-2.5 h-2.5 rounded-full bg-cyan" />
        </div>

        <h2 className="text-3xl font-bold text-center text-cyan font-mono">
          Welcome Back, Agent
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400 font-mono">
          Sign in to resume your CyberGuard training
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 font-mono">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-void px-4 py-3 text-white placeholder-slate-600 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan font-mono"
              placeholder="Your username"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 font-mono">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-void px-4 py-3 text-white placeholder-slate-600 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan font-mono"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-cyan py-3 text-sm font-semibold text-void hover:bg-cyan/90 transition-all active:scale-95 font-mono"
          >
            sign in →
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400 font-mono">
          New to the game?{" "}
          <Link
            href="/register"
            className="text-cyan hover:text-cyan/80 underline font-semibold"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
