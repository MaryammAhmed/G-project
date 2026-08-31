"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white font-sans overflow-hidden">
      {/* 1. Atmospheric Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.1),transparent_50%)] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* 2. Top Navigation Bar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            CG
          </div>
          <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
            CYBERGUARD
          </span>
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link
            href="#overview"
            className="hover:text-emerald-400 transition-colors"
          >
            Overview
          </Link>
          <Link
            href="#modules"
            className="hover:text-emerald-400 transition-colors"
          >
            Modules
          </Link>
          <Link
            href="#about"
            className="hover:text-emerald-400 transition-colors"
          >
            About
          </Link>
        </div>

        {/* Right: Quick Action Button */}
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />{" "}
            ENG
          </span>
          <Link
            href="/register"
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-95"
          >
            Play Now
          </Link>
        </div>
      </nav>

      {/* 3. Hero Content Arena */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-12 md:pt-24 pb-20 flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Hero Left Column */}
        <div className="w-full md:w-1/2 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            <span>🛡️</span> Interactive AI Security Training
          </div>

          <p className="text-xs uppercase tracking-[0.3em] font-bold text-slate-400">
            Enter the World of
          </p>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
            CYBER
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              GUARD
            </span>
          </h1>

          {/* Decorative Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="h-[2px] w-12 bg-emerald-500" />
            <div className="h-2 w-2 rotate-45 border border-emerald-400 bg-slate-950" />
            <div className="h-[1px] w-24 bg-slate-800" />
          </div>

          <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-lg">
            Face real-time AI characters, navigate high-stakes scenarios, and
            stop identity theft before it happens.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/register"
              className="rounded-full bg-emerald-500 px-8 py-4 text-base font-bold text-slate-950 shadow-xl shadow-emerald-500/25 hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95"
            >
              Start Game
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-slate-700 bg-slate-900/60 px-8 py-4 text-base font-semibold text-slate-300 hover:border-slate-500 hover:bg-slate-900 hover:text-white transition-all active:scale-95 backdrop-blur-md"
            >
              Resume Journey
            </Link>
          </div>
        </div>

        {/* Hero Right Column: Atmospheric Card Visual */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-md aspect-square rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between overflow-hidden group">
            {/* Inner Glow Decorative Ring */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl group-hover:bg-emerald-500/30 transition-all" />

            <div className="space-y-4">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
                [ SYSTEM ACTIVE ]
              </span>
              <h3 className="text-2xl font-bold text-white">
                Target Scenario: The Breach
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                "An unknown device logged into your portal from an unfamiliar IP
                address. What is your move?"
              </p>
            </div>

            {/* Badges Footer (Reflects award laurels from reference image) */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center text-xs">
                  🏆
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Standard
                  </p>
                  <p className="text-xs font-bold text-emerald-400">
                    NIST SP 800-63B
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full border border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center text-xs">
                  🤖
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    AI Engine
                  </p>
                  <p className="text-xs font-bold text-cyan-400">
                    Groq Llama 3
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
