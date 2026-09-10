"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
// ^ NEW: tune in to the shared notice board.

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [ageGroup, setAgeGroup] = useState("A");

  // NEW: grab login() from context — we'll use this if your backend
  // ever returns a token straight after registration (auto-login).
  // If it doesn't yet, this line is still safe to keep for later.
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          password: password,
          ageGroup: ageGroup
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // NEW: if your backend's /api/register response ever includes
        // a token (some apps auto-login right after registering),
        // this line would record it the same centralized way login does:
        // if (data.token) login(data.token, data.age_group);
        alert("Success! Backend says: " + data.message);
      } else {
        alert("Registration failed: " + (data.detail || "Unknown error"));
      }
    } catch (error) {
      alert("Could not reach the Python server. Is Uvicorn running?");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-xl">
        <h2 className="text-3xl font-bold text-center text-emerald-400">Create Account</h2>
        <p className="mt-2 text-center text-sm text-slate-400">Choose your training identity to begin</p>

        <form onSubmit={handleRegister} className="mt-8 space-y-6">

          <div>
            <label className="block text-sm font-semibold text-slate-300">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. Layla_H"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Select Your Training Track</label>
            <div className="grid grid-cols-1 gap-3">

              <button
                type="button"
                onClick={() => setAgeGroup("A")}
                className={`rounded-lg border p-3 text-left transition-all ${
                  ageGroup === "A"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold">Group A (Ages 16–19)</div>
                <div className="text-xs mt-1">Scenario: School exam portals, gaming accounts, social media.</div>
              </button>

              <button
                type="button"
                onClick={() => setAgeGroup("B")}
                className={`rounded-lg border p-3 text-left transition-all ${
                  ageGroup === "B"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold">Group B (Ages 20–22)</div>
                <div className="text-xs mt-1">Scenario: University portals, campus Wi-Fi, internship applications.</div>
              </button>

              <button
                type="button"
                onClick={() => setAgeGroup("C")}
                className={`rounded-lg border p-3 text-left transition-all ${
                  ageGroup === "C"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold">Group C (Ages 23–25)</div>
                <div className="text-xs mt-1">Scenario: Corporate emails, HR systems, client file security.</div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-all active:scale-95"
          >
            Create Account & Save Profile
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 underline font-semibold">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
