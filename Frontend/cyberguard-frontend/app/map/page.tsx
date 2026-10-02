// app/map/page.tsx
//
// The mission map — replaces a plain dashboard link list with a single
// visual hub. Each "sector" is one training module, drawn as a glowing
// node on a starfield, connected by thin lines like a constellation.
// Locked sectors are dim and unclickable until the prior one is done.

"use client";
import Link from "next/link";
import { useEffect } from "react";
import { speak } from "@/lib/speech";

type Sector = {
  id: string;
  name: string;
  subtitle: string;
  color: "cyan" | "violet" | "alert" | "term-green";
  href: string;
  unlocked: boolean; // TODO: wire to real progress from the backend later
  position: { top: string; left: string }; // placement on the starfield, in %
};

const SECTORS: Sector[] = [
  {
    id: "passwords",
    name: "Vault Station",
    subtitle: "Module 1 — Passwords & Authentication",
    color: "cyan",
    href: "/module1/tierB/intro",   // was "/module1/tierB/ep1" — now goes to intro first
    unlocked: true, // first sector is always open
    position: { top: "60%", left: "15%" },
  },
  {
    id: "phishing",
    name: "Mirage Belt",
    subtitle: "Module 2 — Phishing",
    color: "violet",
    href: "/module2/tierB/ep1",
    unlocked: false,
    position: { top: "30%", left: "38%" },
  },
  {
    id: "social",
    name: "Whisper Drift",
    subtitle: "Module 3 — Social Engineering",
    color: "alert",
    href: "/module3/tierB/ep1",
    unlocked: false,
    position: { top: "65%", left: "62%" },
  },
  {
    id: "ai",
    name: "The Nullspace",
    subtitle: "Module 4 — Safe AI Usage",
    color: "term-green",
    href: "/module4/tierB/ep1",
    unlocked: false,
    position: { top: "25%", left: "82%" },
  },
];

// Maps each color name to its actual Tailwind classes — kept in one
// place so adding a 5th sector later doesn't mean hunting through JSX.
const COLOR_CLASSES: Record<Sector["color"], { border: string; text: string; glow: string; dot: string }> = {
  cyan: { border: "border-cyan", text: "text-cyan", glow: "shadow-[0_0_30px_rgba(34,211,238,0.5)]", dot: "bg-cyan" },
  violet: { border: "border-violet", text: "text-violet", glow: "shadow-[0_0_30px_rgba(168,85,247,0.5)]", dot: "bg-violet" },
  alert: { border: "border-alert", text: "text-alert", glow: "shadow-[0_0_30px_rgba(255,77,77,0.5)]", dot: "bg-alert" },
  "term-green": { border: "border-term-green", text: "text-term-green", glow: "shadow-[0_0_30px_rgba(74,250,154,0.5)]", dot: "bg-term-green" },
};

export default function MissionMap() {
      useEffect(() => {
    speak("Welcome back, agent. Select a sector to begin your next mission.");
  }, []);
  return (
    <div className="relative min-h-screen bg-void overflow-hidden">
      {/* Starfield — just small dots scattered via a repeating radial
          gradient, no images needed. Cheap and looks great on this bg. */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, white, transparent), radial-gradient(1px 1px at 70% 60%, white, transparent), radial-gradient(1px 1px at 40% 80%, white, transparent), radial-gradient(1px 1px at 90% 20%, white, transparent), radial-gradient(1px 1px at 55% 45%, white, transparent)",
          backgroundSize: "200% 200%",
        }}
      />

      {/* Header */}
      <div className="relative z-10 px-6 py-6 font-mono">
        <p className="text-xs text-cyan uppercase tracking-widest">CyberGuard — Mission Map</p>
        <p className="text-sm text-slate-400 mt-1">Select a sector to begin training.</p>
      </div>

      {/* The map itself — a tall relative container so sectors can be
          absolutely positioned by % like coordinates on a chart. */}
      <div className="relative z-10 w-full h-[600px] max-w-5xl mx-auto">
        {/* Connecting lines between sectors — drawn as a single SVG
            overlay sitting behind the sector nodes. */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <line x1="15%" y1="60%" x2="38%" y2="30%" stroke="#22D3EE" strokeOpacity="0.25" strokeWidth="2" />
          <line x1="38%" y1="30%" x2="62%" y2="65%" stroke="#22D3EE" strokeOpacity="0.15" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="62%" y1="65%" x2="82%" y2="25%" stroke="#22D3EE" strokeOpacity="0.15" strokeWidth="2" strokeDasharray="4 4" />
        </svg>

        {SECTORS.map((sector) => {
          const c = COLOR_CLASSES[sector.color];
          const node = (
            <div
              className={`absolute flex flex-col items-center gap-2 transition-transform ${
                sector.unlocked ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-40"
              }`}
              style={{ top: sector.position.top, left: sector.position.left, transform: "translate(-50%, -50%)" }}
            >
              {/* The glowing node itself */}
              <div
                className={`w-20 h-20 rounded-full border-2 bg-panel flex items-center justify-center ${
                  sector.unlocked ? `${c.border} ${c.glow}` : "border-slate-700"
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${sector.unlocked ? c.dot : "bg-slate-600"}`} />
              </div>

              {/* Label */}
              <div className="text-center font-mono">
                <p className={`text-sm font-bold ${sector.unlocked ? c.text : "text-slate-500"}`}>{sector.name}</p>
                <p className="text-[10px] text-slate-500 max-w-[120px]">{sector.subtitle}</p>
                {!sector.unlocked && <p className="text-[10px] text-slate-600 mt-1">🔒 locked</p>}
              </div>
            </div>
          );

          // Only wrap in a Link if the sector is actually unlocked.
          return sector.unlocked ? (
            <Link key={sector.id} href={sector.href}>
              {node}
            </Link>
          ) : (
            <div key={sector.id}>{node}</div>
          );
        })}
      </div>
    </div>
  );
}
