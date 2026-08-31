"use client";

import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Attempting Login:", { username, password });
    alert(
      `Success! Logging in as ${username}. Next step: Verifying this with our backend!`,
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
      {/* Visual background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-xl">
        <h2 className="text-3xl font-bold text-center text-emerald-400">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Sign in to resume your CyberGuard training
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Your username"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-all active:scale-95"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          New to the game?{" "}
          <Link
            href="/register"
            className="text-emerald-400 hover:text-emerald-300 underline font-semibold"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
