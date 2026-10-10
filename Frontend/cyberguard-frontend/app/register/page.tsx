"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import CyberShell from "@/components/layout/CyberShell";

// The project now targets ONE audience only: high school students (ages 16–18).
// The backend still stores an "age_group" value for every user, so we keep
// sending it, but it is now a fixed constant instead of a user choice.
// "A" is the code the backend already uses for the 16–18 group.
const FIXED_AGE_GROUP = "A";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // REMOVED: const [ageGroup, setAgeGroup] = useState("A");
  // No state is needed any more because the user can no longer change it.
  const { login } = useAuth(); // used later if backend ever auto-logs-in after register

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The backend expects the key "ageGroup", so the name stays the same,
        // but the value always comes from the fixed constant above.
        body: JSON.stringify({
          username,
          email,
          password,
          ageGroup: FIXED_AGE_GROUP,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Success! Backend says: " + data.message);
      } else {
        alert("Registration failed: " + (data.detail || "Unknown error"));
      }
    } catch (error) {
      alert("Could not reach the Python server. Is Uvicorn running?");
    }
  };

  return (
    <CyberShell variant="center" accent="emerald">
      {/* ---- Floating Sticker Decorations ---- */}
      <div className="hidden sm:block absolute top-[10%] left-[6%] -rotate-6 bg-panel border border-emerald-400/40 rounded px-3 py-2 font-hud text-[10px] text-emerald-400">
        sys_init: agent_creation
      </div>

      <div className="hidden sm:flex absolute top-[15%] right-[8%] rotate-[4deg] bg-panel border border-emerald-400/30 rounded px-3 py-2 font-hud text-[10px] text-emerald-400 items-center gap-1">
        <span>🛡️</span> NIST SP 800-63B Compliant
      </div>

      <div className="hidden sm:flex absolute bottom-[12%] left-[8%] rotate-[5deg] bg-panel border border-emerald-400/40 rounded-full w-12 h-12 items-center justify-center text-xl">
        ⚡
      </div>

      <div className="hidden sm:block absolute bottom-[15%] right-[6%] rotate-[-4deg] bg-panel border border-cyan/40 rounded px-3 py-2 font-hud text-[10px] text-cyan">
        clearance_level: Tier 1
      </div>

      {/* ---- Main Glassmorphism Register Card ---- */}
      <div className="cg-glass relative z-10 w-full max-w-md p-8 space-y-6">
        {/* Terminal Header Dots */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brick" />
          <span className="w-2.5 h-2.5 rounded-full bg-warning" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>

        <div>
          <p className="cg-kicker mb-1">{"// AGENT REGISTRATION"}</p>
          <h2 className="cg-title text-2xl font-bold text-emerald-400">
            Create Account
          </h2>
          <p className="mt-1 text-xs text-text-secondary font-hud">
            Choose your training identity to begin
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="cg-label">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="cg-input"
              placeholder="e.g. Layla_H"
            />
          </div>

          <div>
            <label className="cg-label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="cg-input"
              placeholder="you@example.com"
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

          {/* REMOVED: the three "Select Your Training Track" buttons (Group A / B / C).
              REPLACED with a read-only info box so players still see which track
              they are joining, but nothing here is clickable or changeable. */}
          <div>
            <label className="cg-label mb-2">Your Training Track</label>
            <div className="rounded-xl border border-emerald-400 bg-emerald-400/10 p-3.5 text-emerald-300">
              <div className="font-hud text-sm font-bold">High School (Ages 16–18)</div>
              <div className="text-xs mt-1 opacity-80">
                Scenario: School exam portals, gaming accounts, social media.
              </div>
            </div>
          </div>

          <button type="submit" className="cg-btn w-full font-hud uppercase font-bold tracking-wider">
            Create Account & Save Profile
          </button>
        </form>

        <p className="text-center text-xs text-text-secondary font-hud">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline font-semibold">
            Sign in here
          </Link>
        </p>
      </div>
    </CyberShell>
  );
}
