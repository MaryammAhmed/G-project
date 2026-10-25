"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CyberShell from "@/components/layout/CyberShell";
import { TerminalHeader } from "@/components/ui/CyberInteractive";
import CompanionSkeleton from "@/components/mission/CompanionSkeleton";
import type { Mood } from "@/lib/mission/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

type ModuleProgress = {
  module: number;
  scenario: string;
  completed: boolean;
  best_score: number;
  attempts: number;
  unlocked: boolean;
};

type ProgressResponse = {
  modules: ModuleProgress[];
  unlocked: number[];
  total_score: number;
};

const MODULE_META: Record<number, { icon: string; title: string; color: string }> = {
  1: { icon: "🔐", title: "Locked Out", color: "#34D399" },
  2: { icon: "🎣", title: "The Mirage", color: "#22D3EE" },
  3: { icon: "🎭", title: "The Whisper", color: "#A855F7" },
  4: { icon: "🤖", title: "The Oracle", color: "#FBBF24" },
};

export default function ProfilePage() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [username, setUsername] = useState<string>("Agent");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API}/api/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (r.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then(setProgress)
      .catch((e) => setError(String(e)));

    const stored = localStorage.getItem("username");
    if (stored) setUsername(stored);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  };

  const handleDelete = async () => {
    if (!confirm("This will permanently delete your account, all progress, and all data. This cannot be undone. Continue?")) return;

    setBusy(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/api/account`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setBusy(false);

    if (res.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      router.push("/login");
    } else {
      const body = await res.json().catch(() => ({}));
      alert("Delete failed: " + (body.detail || res.status));
    }
  };

  // Determine skeleton mood based on progress
  let skeletonMood: Mood = "calm";
  let completedCount = 0;
  if (progress) {
    completedCount = progress.modules.filter((m) => m.completed).length;
    if (completedCount === 4) skeletonMood = "safe";
    else if (completedCount > 0) skeletonMood = "alert";
  }

  if (error) return (
    <CyberShell variant="app" accent="brick">
      <div className="p-8 text-red-500 font-mono text-center">
        <p className="text-2xl font-bold mb-4">SYSTEM ERROR</p>
        <p>{error}</p>
        <button onClick={() => router.push("/map")} className="mt-6 px-4 py-2 border border-red-500 rounded hover:bg-red-500/20">RETURN TO MAP</button>
      </div>
    </CyberShell>
  );

  if (!progress) return (
    <CyberShell variant="app" accent="cyan">
      <div className="grid h-screen place-items-center text-cyan-300 font-mono tracking-widest animate-pulse">
        DECRYPTING AGENT DOSSIER...
      </div>
    </CyberShell>
  );

  const totalAttempts = progress.modules.reduce((s, m) => s + m.attempts, 0);

  return (
    <CyberShell variant="app" accent="cyan">
      <div className="fixed inset-0 z-10 flex flex-col p-2 sm:p-4">
        <div className="mx-auto flex min-h-0 w-full max-w-[1200px] flex-1 flex-col">
          
          <TerminalHeader
            title="cyberguard_XD"
            status="ONLINE"
            clearance="AGENT"
            right={
              <Link href="/map" className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-300/20" style={MONO}>
                &larr; BACK TO MAP
              </Link>
            }
          />

          <main className="relative flex-1 overflow-y-auto rounded-b-2xl border border-t-0 border-cyan-300/20 bg-[#050611]/95 p-6 sm:p-8">
            
            {/* Ambient background grid */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

            <div className="relative z-10 mx-auto max-w-5xl space-y-8">
              
              {/* --- HEADER SECTION --- */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-cyan-400 bg-[#0a1428] shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                  <span className="text-4xl">💀 </span>
                </div>
                <h1 className="text-3xl font-black tracking-widest text-[#f5f3ff] uppercase" style={MONO}>
                  {username}
                </h1>
                <p className="text-xs tracking-[0.3em] text-cyan-400" style={MONO}>CLEARANCE: AGENT | ACTIVE</p>
              </div>

              {/* --- STATS SECTION --- */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-amber-300/30 bg-amber-300/5 p-4 text-center">
                  <p className="text-[10px] tracking-widest text-amber-300/70 mb-1" style={MONO}>TOTAL XP</p>
                  <p className="text-3xl font-black text-amber-300" style={MONO}>{progress.total_score}</p>
                </div>
                <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/5 p-4 text-center">
                  <p className="text-[10px] tracking-widest text-cyan-300/70 mb-1" style={MONO}>MODULES SECURED</p>
                  <p className="text-3xl font-black text-cyan-300" style={MONO}>{completedCount} / 4</p>
                </div>
                <div className="rounded-xl border border-emerald-300/30 bg-emerald-300/5 p-4 text-center">
                  <p className="text-[10px] tracking-widest text-emerald-300/70 mb-1" style={MONO}>TOTAL ATTEMPTS</p>
                  <p className="text-3xl font-black text-emerald-300" style={MONO}>{totalAttempts}</p>
                </div>
              </div>

              {/* --- MODULES SECTION --- */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold tracking-[0.3em] text-[#f5f3ff] border-b border-white/10 pb-2" style={MONO}>MISSION ARCHIVES</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {progress.modules.map((m) => {
                    const meta = MODULE_META[m.module];
                    const isDone = m.completed;
                    const isUnlocked = m.unlocked;

                    return (
                      <div 
                        key={m.module} 
                        className="relative overflow-hidden rounded-xl border p-5 transition-all"
                        style={{ 
                          borderColor: isDone ? `${meta.color}80` : isUnlocked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
                          background: isDone ? `${meta.color}10` : "rgba(10,15,30,0.6)",
                          opacity: isUnlocked ? 1 : 0.6
                        }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] tracking-widest mb-1" style={{ ...MONO, color: meta.color }}>MODULE 0{m.module}</p>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <span>{meta.icon}</span> {meta.title}
                            </h3>
                          </div>
                          <span className="text-2xl" title={isDone ? "Secured" : isUnlocked ? "Unlocked" : "Locked"}>
                            {isDone ? "✅" : isUnlocked ? "🔓" : "🔒"}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs" style={MONO}>
                          <div className="rounded bg-black/40 p-2 border border-white/5">
                            <span className="block text-[9px] text-gray-500 mb-0.5">BEST SCORE</span>
                            <span className="text-amber-300">{m.best_score} XP</span>
                          </div>
                          <div className="rounded bg-black/40 p-2 border border-white/5">
                            <span className="block text-[9px] text-gray-500 mb-0.5">ATTEMPTS</span>
                            <span className="text-white">{m.attempts}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* --- BADGES SECTION --- */}
              {completedCount > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <h2 className="text-sm font-bold tracking-[0.3em] text-[#f5f3ff]" style={MONO}>EARNED BADGES</h2>
                  <div className="flex flex-wrap gap-3">
                    {progress.modules[0]?.completed && <Badge icon="🏆" label="First Steps" color="#34D399" />}
                    {progress.modules[1]?.completed && <Badge icon="🎯" label="Sharp Eye" color="#22D3EE" />}
                    {progress.modules[2]?.completed && <Badge icon="🕵️" label="Trust No One" color="#A855F7" />}
                    {progress.modules[3]?.completed && <Badge icon="🤖" label="AI Aware" color="#FBBF24" />}
                    {completedCount === 4 && <Badge icon="⭐" label="CyberGuard Elite" color="#f5f3ff" />}
                  </div>
                </div>
              )}

              {/* --- DANGER ZONE / ACTIONS --- */}
              <div className="flex flex-col sm:flex-row gap-3 pt-8 mt-8 border-t border-white/10">
                <button 
                  onClick={handleLogout} 
                  className="flex-1 rounded-xl border border-white/20 bg-white/5 py-3 text-xs font-bold tracking-widest text-white transition hover:bg-white/10"
                  style={MONO}
                >
                  🚪 LOGOUT
                </button>
                <button
                  onClick={handleDelete}
                  disabled={busy}
                  className="flex-1 rounded-xl border border-rose-500/50 bg-rose-500/10 py-3 text-xs font-bold tracking-widest text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                  style={MONO}
                >
                  {busy ? "DELETING DATA..." : "⚠️ DELETE ACCOUNT"}
                </button>
              </div>
              
            </div>
            
            {/* The skeleton companion sits in the bottom right of the main frame */}
            <div className="pointer-events-none fixed bottom-4 right-4 z-50 origin-bottom-right scale-75 sm:scale-100">
              <CompanionSkeleton mood={skeletonMood} />
            </div>

          </main>
        </div>
      </div>
    </CyberShell>
  );
}

function Badge({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div 
      className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold tracking-widest"
      style={{ 
        ...MONO,
        borderColor: `${color}50`, 
        background: `${color}10`,
        color: color,
        boxShadow: `0 0 15px ${color}20`
      }}
    >
      <span>{icon}</span>
      <span>{label.toUpperCase()}</span>
    </div>
  );
}
