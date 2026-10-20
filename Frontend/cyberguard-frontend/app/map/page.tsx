"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import CyberShell from "@/components/layout/CyberShell";
import {
  CyberCard,
  GlowButton,
  TerminalHeader,
} from "@/components/ui/CyberInteractive";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";

const MONO = {
  fontFamily: "var(--font-mono), ui-monospace, monospace",
};

type Status = "completed" | "available" | "locked";

interface Realm {
  id: string;
  order: number;
  title: string;
  topic: string;
  blurb: string;
  guideline: string;
  badge: string;
  href: string;
  status: Status;
  color: string;
  x: number;
  y: number;
  symbol: string;
}

const MISSIONS: Realm[] = [
  {
    id: "vault",
    order: 1,
    title: "The Vault",
    topic: "Password Security",
    blurb:
      "Breach the cosmic vault. Build a strong passphrase, identify weak credentials, and secure your accounts with two-factor authentication.",
    guideline:
      "Create long, memorable passwords and protect accounts with multifactor authentication.",
    badge: "VAULT BREAKER",
    href: "/mission/vault",
    status: "available",
    color: "#4ade80",
    x: 145,
    y: 435,
    symbol: "🔐",
  },
  {
    id: "mirage",
    order: 2,
    title: "The Mirage",
    topic: "Phishing Detection",
    blurb:
      "Navigate a city of holograms. Investigate suspicious messages, inspect deceptive links, and expose digital traps.",
    guideline:
      "Check sender identity, inspect destinations, and verify unexpected requests before acting.",
    badge: "MIRAGE SEER",
    href: "/mission/spot-the-phish",
    status: "available",
    color: "#4cc9ff",
    x: 370,
    y: 330,
    symbol: "🎣",
  },
  {
    id: "whisper",
    order: 3,
    title: "The Whisper",
    topic: "Social Engineering",
    blurb:
      "Someone is manipulating the signal. Detect urgency, impersonation, and psychological pressure before trust becomes a vulnerability.",
    guideline:
      "Pause under pressure and verify unusual requests through a trusted, independent channel.",
    badge: "MIND SHIELD",
    href: "/mission/social-engineering",
    status: "locked",
    color: "#fb7185",
    x: 625,
    y: 415,
    symbol: "🎭",
  },
  {
    id: "oracle",
    order: 4,
    title: "The Oracle",
    topic: "Safe AI Usage",
    blurb:
      "Enter the AI core. Decide what information can be shared, protect private data, and evaluate AI-generated answers.",
    guideline:
      "Minimize sensitive information shared with AI and verify important outputs independently.",
    badge: "ORACLE KEEPER",
    href: "/mission/safe-ai",
    status: "locked",
    color: "#a78bfa",
    x: 850,
    y: 300,
    symbol: "🤖",
  },
];

const STATUS_TEXT: Record<Status, string> = {
  completed: "REALM SECURED",
  available: "MISSION AVAILABLE",
  locked: "ACCESS RESTRICTED",
};

const ROOMS = [
  { x: 135, y: 210, label: "ENCRYPTION BAY" },
  { x: 360, y: 155, label: "SIGNAL ARCHIVE" },
  { x: 620, y: 190, label: "IDENTITY CORE" },
  { x: 850, y: 145, label: "AI UPLINK" },
];

const CSS = `
.cg-map {
  isolation: isolate;
  background:
    radial-gradient(ellipse at 12% 16%, rgba(34,211,238,.15), transparent 34%),
    radial-gradient(ellipse at 85% 18%, rgba(139,92,246,.16), transparent 35%),
    radial-gradient(ellipse at 52% 100%, rgba(16,185,129,.12), transparent 40%),
    #050611;
  box-shadow: inset 0 0 90px rgba(76,201,255,.07);
}
.cg-stars {
  background-image:
    radial-gradient(1px 1px at 8% 18%, #e0fbff 99%, transparent),
    radial-gradient(1px 1px at 21% 72%, #4cc9ff 99%, transparent),
    radial-gradient(2px 2px at 39% 34%, #ffffff99 99%, transparent),
    radial-gradient(1px 1px at 54% 16%, #a78bfa 99%, transparent),
    radial-gradient(1px 1px at 67% 83%, #4ade80 99%, transparent),
    radial-gradient(2px 2px at 78% 48%, #ffffff99 99%, transparent),
    radial-gradient(1px 1px at 91% 22%, #4cc9ff 99%, transparent),
    radial-gradient(1px 1px at 32% 91%, #ffffff99 99%, transparent);
  background-size: 240px 190px;
  animation: cgDrift 24s linear infinite;
}
.cg-scanlines {
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 4px,
    rgba(255,255,255,.018) 5px,
    transparent 6px
  );
}
.cg-flow { animation: cgFlow 1.6s linear infinite; }
.cg-glow { animation: cgGlow 2.8s ease-in-out infinite; }
.cg-ping { animation: cgPing 2.4s ease-out infinite; }
.cg-float { animation: cgFloat 3.2s ease-in-out infinite; }
.cg-pop { animation: cgPop .22s ease-out both; }
.cg-shake { animation: cgShake .35s ease-in-out; }
.cg-sweep::after {
  content: "";
  position: absolute;
  top: -30%;
  left: 0;
  right: 0;
  height: 24%;
  pointer-events: none;
  background: linear-gradient(180deg, transparent, rgba(76,201,255,.08), transparent);
  animation: cgSweep 8s linear infinite;
}
@keyframes cgFlow { to { stroke-dashoffset: -28; } }
@keyframes cgGlow { 0%,100% { opacity: 1; } 50% { opacity: .58; } }
@keyframes cgPing { 0% { transform: scale(.8); opacity: .75; } 100% { transform: scale(2.1); opacity: 0; } }
@keyframes cgFloat { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-8px) rotate(3deg); } }
@keyframes cgPop { from { opacity: 0; transform: scale(.95); } to { opacity: 1; transform: scale(1); } }
@keyframes cgShake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
@keyframes cgSweep { to { transform: translateY(580%); } }
@keyframes cgDrift { to { background-position: 240px 190px; } }
@media (prefers-reduced-motion: reduce) {
  .cg-flow, .cg-glow, .cg-ping, .cg-float, .cg-pop, .cg-shake,
  .cg-sweep::after, .cg-stars { animation: none !important; }
}
`;

function RealmIcon({ realm }: { realm: Realm }) {
  const shared = {
    stroke: realm.color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  if (realm.id === "vault") {
    return (
      <svg viewBox="0 0 64 64" className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden="true">
        <path {...shared} d="M19 28V19a13 13 0 0 1 26 0v9" />
        <rect {...shared} x="11" y="27" width="42" height="29" rx="5" />
        <circle {...shared} cx="32" cy="39" r="4" />
        <path {...shared} d="M32 43v6" />
        <path {...shared} d="M5 17h6M53 17h6M32 3v5" opacity=".6" />
      </svg>
    );
  }

  if (realm.id === "mirage") {
    return (
      <svg viewBox="0 0 64 64" className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden="true">
        <path {...shared} d="M7 39h50L45 52H20L7 39Z" />
        <path {...shared} d="M30 10v28M30 12 47 32H30" />
        <path {...shared} d="M8 18h12M5 25h9M43 9h12M48 16h9" opacity=".7" />
        <path {...shared} d="M10 57c5-4 9 4 14 0s9 4 14 0 9 4 14 0" opacity=".8" />
        <circle cx="46" cy="31" r="3" fill={realm.color} />
      </svg>
    );
  }

  if (realm.id === "whisper") {
    return (
      <svg viewBox="0 0 64 64" className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden="true">
        <path {...shared} d="M32 6 52 14v15c0 13-8 22-20 29C20 51 12 42 12 29V14L32 6Z" />
        <path {...shared} d="M16 31 24 24 32 29 40 24 48 31 40 39H24L16 31Z" />
        <path {...shared} d="M23 20h18M27 46h10" opacity=".7" />
        <circle cx="25" cy="31" r="2" fill={realm.color} />
        <circle cx="39" cy="31" r="2" fill={realm.color} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden="true">
      <rect {...shared} x="5" y="13" width="23" height="30" rx="6" />
      <rect {...shared} x="36" y="13" width="23" height="30" rx="6" />
      <path {...shared} d="M11 13V8M22 13V8M42 13V8M53 13V8" />
      <circle cx="12" cy="26" r="2.5" fill="#fb7185" />
      <circle cx="21" cy="26" r="2.5" fill="#fb7185" />
      <circle cx="43" cy="26" r="2.5" fill={realm.color} />
      <circle cx="52" cy="26" r="2.5" fill={realm.color} />
      <path {...shared} d="M12 35h9M43 35h9M16 43v5h32v-5M32 48v8M25 56h14" />
      <path d="M28 27h8" stroke="#ffffff99" strokeDasharray="2 2" />
    </svg>
  );
}

function isUnlocked(realm: Realm) {
  return realm.status !== "locked";
}

function isoPipe(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const k = (dx / 2 - dy) / 2;
  if (k < 0) return `M${a.x} ${a.y} L${b.x} ${b.y}`;
  return `M${a.x} ${a.y} L${a.x + 2 * k} ${a.y - k} L${b.x} ${b.y}`;
}

function Platform({
  cx,
  cy,
  color,
  active,
  locked,
}: {
  cx: number;
  cy: number;
  color: string;
  active: boolean;
  locked: boolean;
}) {
  const w = 74;
  const h = w / 2;
  const depth = 20;
  const top = `${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`;
  const left = `${cx - w},${cy} ${cx},${cy + h} ${cx},${cy + h + depth} ${cx - w},${cy + depth}`;
  const right = `${cx + w},${cy} ${cx},${cy + h} ${cx},${cy + h + depth} ${cx + w},${cy + depth}`;

  return (
    <g
      filter={active ? "url(#cgGlow)" : undefined}
      opacity={locked ? 0.48 : 1}
    >
      <polygon points={left} fill="#080b1b" stroke={color} strokeOpacity=".6" />
      <polygon points={right} fill="#0d1024" stroke={color} strokeOpacity=".65" />
      <polygon
        points={top}
        fill={`${color}${active ? "38" : "18"}`}
        stroke={color}
        strokeWidth={active ? 2.5 : 1.5}
        strokeDasharray={locked ? "5 5" : undefined}
      />
      <path
        d={`M${cx - 38} ${cy} L${cx} ${cy - 19} L${cx + 38} ${cy}`}
        fill="none"
        stroke={color}
        strokeOpacity=".55"
      />
    </g>
  );
}

export default function MissionMapPage() {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const [denied, setDenied] = useState<Realm | null>(null);
  const [reduced, setReduced] = useState(false);
  const gesture = useRef(false);
  const deniedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unlockedCount = MISSIONS.filter(isUnlocked).length;
  const selected = MISSIONS.find((realm) => realm.id === hovered) ?? null;

  useEffect(() => {
    const markGesture = () => {
      gesture.current = true;
    };

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduced(media.matches);

    window.addEventListener("pointerdown", markGesture, { capture: true });
    window.addEventListener("keydown", markGesture, { capture: true });
    media.addEventListener("change", updateMotion);
    updateMotion();

    return () => {
      window.removeEventListener("pointerdown", markGesture, { capture: true });
      window.removeEventListener("keydown", markGesture, { capture: true });
      media.removeEventListener("change", updateMotion);
      if (deniedTimer.current) clearTimeout(deniedTimer.current);
    };
  }, []);

  function play(kind: SfxKind) {
    if (!gesture.current) return;
    try {
      ensureAudio();
      sfx(kind);
    } catch {
      // Audio must never prevent mission navigation.
    }
  }

  function highlight(id: string) {
    if (hovered !== id) play("tick");
    setHovered(id);
  }

  function launch(realm: Realm) {
    if (!isUnlocked(realm)) {
      play("bad");
      setDenied(realm);
      if (deniedTimer.current) clearTimeout(deniedTimer.current);
      deniedTimer.current = setTimeout(() => setDenied(null), 2400);
      return;
    }

    play("unlock");
    router.push(realm.href);
  }

  return (
    <CyberShell variant="app" accent="cyan">
      <style>{CSS}</style>

      <section aria-labelledby="map-title" className="text-[#f5f3ff]">
        <TerminalHeader
          title="cyberguard@realm:~/mission-map"
          status="ONLINE"
          clearance="TIER 1"
        />

        <div className="rounded-b-2xl border border-t-0 border-white/10 bg-[#080918]/80 p-3 backdrop-blur sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p
                className="text-[10px] font-bold uppercase tracking-[.28em] text-cyan-300"
                style={MONO}
              >
                {"// global threat network :: mission selection"}
              </p>
              <h1 id="map-title" className="text-2xl font-black sm:text-4xl">
                CyberGuard{" "}
                <span className="text-cyan-300">Realms</span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-slate-400">
                Four digital frontiers. One mission: protect the human side of
                the network.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 px-4 py-3">
              <p
                className="text-[9px] uppercase tracking-[.2em] text-emerald-300"
                style={MONO}
              >
                Network status
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-200">
                {unlockedCount}/{MISSIONS.length} REALMS ONLINE
              </p>
            </div>
          </div>

          <div
            className="cg-map cg-sweep relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-cyan-300/20 sm:aspect-[1000/570]"
            style={{ minHeight: 380 }}
          >
            <div
              className="cg-stars pointer-events-none absolute inset-0"
              aria-hidden="true"
            />
            <div
              className="cg-scanlines pointer-events-none absolute inset-0"
              aria-hidden="true"
            />

            <svg
              viewBox="0 0 1000 570"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id="cgGrid"
                  width="44"
                  height="44"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M44 0H0V44"
                    fill="none"
                    stroke="#4cc9ff"
                    strokeOpacity=".09"
                    strokeWidth=".7"
                  />
                </pattern>

                <filter
                  id="cgGlow"
                  x="-60%"
                  y="-60%"
                  width="220%"
                  height="220%"
                >
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {MISSIONS.map((realm) => (
                  <linearGradient
                    key={realm.id}
                    id={`cgBeam-${realm.id}`}
                    x1="0"
                    y1="1"
                    x2="0"
                    y2="0"
                  >
                    <stop offset="0" stopColor={realm.color} stopOpacity=".6" />
                    <stop offset="1" stopColor={realm.color} stopOpacity="0" />
                  </linearGradient>
                ))}
              </defs>

              <rect width="1000" height="570" fill="url(#cgGrid)" />

              {ROOMS.map((room) => (
                <g key={room.label} opacity=".5">
                  <Platform
                    cx={room.x}
                    cy={room.y}
                    color="#4cc9ff"
                    active={false}
                    locked
                  />
                  <text
                    x={room.x}
                    y={room.y + 4}
                    textAnchor="middle"
                    fontSize="9"
                    letterSpacing="2"
                    fill="#7dd3fc"
                    style={MONO}
                  >
                    {room.label}
                  </text>
                </g>
              ))}

              {MISSIONS.slice(0, -1).map((realm, index) => {
                const next = MISSIONS[index + 1];
                const path = isoPipe(realm, next);
                const live = isUnlocked(realm) && isUnlocked(next);
                const active =
                  hovered === realm.id || hovered === next.id;
                const color = active
                  ? selected?.color ?? "#4cc9ff"
                  : live
                    ? "#4cc9ff"
                    : "#6b7280";

                return (
                  <g key={realm.id}>
                    <path
                      d={path}
                      fill="none"
                      stroke="#02040d"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    <path
                      d={path}
                      fill="none"
                      stroke={color}
                      strokeWidth={active ? 4 : 2}
                      strokeOpacity={active ? 0.95 : 0.4}
                      strokeDasharray="4 8"
                      strokeLinecap="round"
                      className={live && !reduced ? "cg-flow" : undefined}
                    />
                    {live && !reduced && (
                      <circle r="4" fill="#e0fbff" filter="url(#cgGlow)">
                        <animateMotion
                          dur="3.2s"
                          repeatCount="indefinite"
                          begin={`${index * 0.45}s`}
                        >
                          <mpath href={`#cgRoute-${index}`} />
                        </animateMotion>
                      </circle>
                    )}
                    <path id={`cgRoute-${index}`} d={path} fill="none" />
                  </g>
                );
              })}

              {MISSIONS.map((realm) => (
                <g key={realm.id}>
                  <Platform
                    cx={realm.x}
                    cy={realm.y}
                    color={realm.color}
                    active={hovered === realm.id}
                    locked={!isUnlocked(realm)}
                  />
                  {isUnlocked(realm) && (
                    <rect
                      x={realm.x - 2}
                      y={realm.y - 140}
                      width="4"
                      height="140"
                      fill={`url(#cgBeam-${realm.id})`}
                    />
                  )}
                  <circle
                    cx={realm.x}
                    cy={realm.y}
                    r={hovered === realm.id ? 52 : 39}
                    fill="none"
                    stroke={realm.color}
                    strokeOpacity={isUnlocked(realm) ? ".25" : ".1"}
                    strokeDasharray="3 8"
                  />
                </g>
              ))}
            </svg>

            <div
              className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col gap-2 sm:left-5 sm:top-5"
              style={MONO}
            >
              <span className="w-fit rounded border border-emerald-400/40 bg-[#050611]/90 px-2 py-1 text-[9px] font-bold tracking-widest text-emerald-300 sm:text-[10px]">
                ● SYSTEM ONLINE
              </span>
              <span className="w-fit rounded border border-rose-400/40 bg-[#050611]/90 px-2 py-1 text-[9px] font-bold tracking-widest text-rose-300 sm:text-[10px]">
                THREAT MONITOR ACTIVE
              </span>
            </div>

            <div
              className="pointer-events-none absolute right-3 top-3 z-20 text-right text-[9px] tracking-widest text-cyan-200/70 sm:right-5 sm:top-5 sm:text-[10px]"
              style={MONO}
            >
              GRID 07
              <br />
              ENCRYPTED UPLINK
            </div>

            {MISSIONS.map((realm) => {
              const locked = !isUnlocked(realm);

              return (
                <button
                  key={realm.id}
                  type="button"
                  onClick={() => launch(realm)}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") highlight(realm.id);
                  }}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => highlight(realm.id)}
                  onBlur={() => setHovered(null)}
                  aria-label={`${realm.title}, ${realm.topic}, ${STATUS_TEXT[realm.status]}`}
                  className="group absolute z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-xl p-1 outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#050611]"
                  style={
                    {
                      left: `${realm.x / 10}%`,
                      top: `${(realm.y / 570) * 100}%`,
                      "--realm-color": realm.color,
                    } as CSSProperties
                  }
                >
                  {!locked && (
                    <span
                      className="cg-ping absolute top-1 h-12 w-12 rounded-full border-2 sm:h-16 sm:w-16"
                      style={{ borderColor: realm.color }}
                      aria-hidden="true"
                    />
                  )}

                  <span
                    className="relative flex h-11 w-11 items-center justify-center rounded-xl border bg-[#070918]/95 transition duration-200 group-hover:scale-110 group-focus-visible:scale-110 sm:h-16 sm:w-16"
                    style={{
                      borderColor: realm.color,
                      boxShadow: locked
                        ? "inset 0 0 12px rgba(255,255,255,.03)"
                        : `0 0 22px ${realm.color}55, inset 0 0 16px ${realm.color}22`,
                      opacity: locked ? 0.6 : 1,
                      filter: locked ? "grayscale(.65)" : undefined,
                    }}
                  >
                    {locked ? (
                      <span className="text-xl" aria-hidden="true">
                        🔒
                      </span>
                    ) : (
                      <span className="cg-glow">
                        <RealmIcon realm={realm} />
                      </span>
                    )}
                    {!locked && (
                      <span
                        className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full"
                        style={{
                          background: realm.color,
                          boxShadow: `0 0 9px ${realm.color}`,
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </span>

                  <span
                    className="mt-1 rounded bg-[#050611]/95 px-1.5 py-0.5 text-[8px] font-bold tracking-widest sm:text-[10px]"
                    style={{ ...MONO, color: locked ? "#9ca3af" : realm.color }}
                  >
                    REALM 0{realm.order}
                  </span>
                  <span
                    className="max-w-[94px] truncate rounded bg-[#050611]/95 px-1.5 py-0.5 text-[9px] font-bold sm:max-w-none sm:text-[11px]"
                    style={MONO}
                  >
                    {realm.title}
                  </span>
                </button>
              );
            })}

            {selected && (
              <div
                key={selected.id}
                className="cg-pop pointer-events-none absolute bottom-3 left-3 right-3 z-40 max-w-sm overflow-hidden rounded-xl border backdrop-blur-xl sm:bottom-auto sm:left-auto sm:right-5 sm:top-1/2 sm:w-[min(290px,40%)] sm:-translate-y-1/2"
                style={{
                  borderColor: `${selected.color}99`,
                  background: "rgba(5,7,20,.94)",
                  boxShadow: `0 0 30px ${selected.color}33`,
                }}
                role="status"
              >
                <div
                  className="flex items-center justify-between gap-2 border-b px-3 py-2"
                  style={{
                    borderColor: `${selected.color}44`,
                    background: `${selected.color}12`,
                  }}
                >
                  <span
                    className="truncate text-[10px] tracking-widest"
                    style={{ ...MONO, color: selected.color }}
                  >
                    INTEL_0{selected.order}.SYS
                  </span>
                  <span className="flex gap-1" aria-hidden="true">
                    <i className="h-2 w-2 rounded-full bg-rose-400" />
                    <i className="h-2 w-2 rounded-full bg-amber-300" />
                    <i className="h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                </div>
                <div className="space-y-2 p-3">
                  <p className="text-base font-bold">
                    {selected.title}
                  </p>
                  <p
                    className="text-[10px] uppercase tracking-widest"
                    style={{ ...MONO, color: selected.color }}
                  >
                    {selected.topic}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-300">
                    {selected.blurb}
                  </p>
                  <p
                    className="border-l-2 pl-2 text-[10px] leading-relaxed text-slate-400"
                    style={{
                      ...MONO,
                      borderColor: selected.color,
                    }}
                  >
                    {selected.guideline}
                  </p>
                  <p className="text-[10px] text-slate-400" style={MONO}>
                    BADGE:{" "}
                    <span style={{ color: selected.color }}>
                      {selected.badge}
                    </span>
                  </p>
                  <p
                    className="text-[10px] font-bold tracking-widest"
                    style={{
                      ...MONO,
                      color: isUnlocked(selected) ? "#4ade80" : "#fb7185",
                    }}
                  >
                    {isUnlocked(selected)
                      ? "> CLICK TO DEPLOY"
                      : "> ACCESS DENIED"}
                  </p>
                </div>
              </div>
            )}

            {denied && (
              <div
                className="cg-pop cg-shake absolute inset-x-3 top-1/2 z-50 mx-auto w-[min(360px,90%)] -translate-y-1/2 rounded-xl border-2 border-rose-400 bg-[#190710]/95 p-5 text-center backdrop-blur-xl"
                style={{
                  ...MONO,
                  boxShadow: "0 0 40px rgba(251,75,133,.35)",
                }}
                role="alert"
              >
                <p className="text-3xl" aria-hidden="true">
                  🔒
                </p>
                <p className="mt-2 text-xl font-black tracking-widest text-rose-300">
                  ACCESS DENIED
                </p>
                <p className="mt-2 text-[10px] font-bold tracking-widest text-amber-300">
                  REALM LOCKED
                </p>
                <p className="mt-3 text-xs leading-relaxed text-slate-300">
                  {denied.title} is currently sealed. Complete the previous
                  mission to unlock this realm.
                </p>
              </div>
            )}

            <div
              className="cg-float pointer-events-none absolute bottom-3 right-3 z-10 hidden items-end gap-2 sm:flex"
              aria-label="CyberGuard mascot companion"
            >
              <div className="rounded-lg border border-cyan-300/30 bg-[#050611]/85 px-3 py-2">
                <p className="text-[9px] font-bold tracking-widest text-cyan-200" style={MONO}>
                  BOB // COMPANION
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Stay sharp. Verify everything.
                </p>
              </div>
              <div className="text-4xl drop-shadow-[0_0_15px_rgba(76,201,255,.65)]" aria-hidden="true">
                💀
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <p
              className="text-[10px] uppercase tracking-widest text-slate-500"
              style={MONO}
            >
              Select a realm to inspect its mission intelligence.
            </p>
            <p
              className="text-[10px] uppercase tracking-widest text-cyan-300/70"
              style={MONO}
            >
              Four realms // One network
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {MISSIONS.map((realm) => (
              <CyberCard key={realm.id}>
                <div
                  className="flex h-full flex-col gap-3 rounded-xl border border-white/10 bg-[#080918]/80 p-4 transition duration-200 hover:border-white/25"
                  style={
                    {
                      "--realm-color": realm.color,
                      borderColor:
                        hovered === realm.id
                          ? `${realm.color}99`
                          : undefined,
                      boxShadow:
                        hovered === realm.id
                          ? `0 0 20px ${realm.color}18`
                          : undefined,
                    } as CSSProperties
                  }
                  onMouseEnter={() => highlight(realm.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl border"
                      style={{
                        borderColor: `${realm.color}66`,
                        background: `${realm.color}10`,
                      }}
                    >
                      {isUnlocked(realm) ? (
                        <RealmIcon realm={realm} />
                      ) : (
                        <span className="text-2xl" aria-hidden="true">
                          🔒
                        </span>
                      )}
                    </div>
                    <span
                      className="rounded border px-2 py-1 text-[9px] font-bold tracking-widest"
                      style={{
                        ...MONO,
                        color: isUnlocked(realm) ? realm.color : "#9ca3af",
                        borderColor: `${realm.color}55`,
                      }}
                    >
                      0{realm.order}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold">{realm.title}</h2>
                    <p
                      className="mt-1 text-[10px] uppercase tracking-widest"
                      style={{ ...MONO, color: realm.color }}
                    >
                      {realm.topic}
                    </p>
                  </div>

                  <p className="flex-1 text-xs leading-relaxed text-slate-400">
                    {realm.blurb}
                  </p>

                  <p
                    className="text-[9px] font-bold tracking-widest"
                    style={{
                      ...MONO,
                      color: isUnlocked(realm) ? "#4ade80" : "#9ca3af",
                    }}
                  >
                    {STATUS_TEXT[realm.status]}
                  </p>

                  {isUnlocked(realm) ? (
                    <GlowButton
                      size="sm"
                      href={realm.href}
                      accent={realm.status === "completed" ? "amber" : "emerald"}
                    >
                      {realm.status === "completed" ? "Replay Realm" : "Deploy Mission"}
                    </GlowButton>
                  ) : (
                    <GlowButton
                      size="sm"
                      variant="outline"
                      disabled
                      hoverSound={false}
                      clickSound={false}
                    >
                      Locked
                    </GlowButton>
                  )}
                </div>
              </CyberCard>
            ))}
          </div>
        </div>
      </section>
    </CyberShell>
  );
}
