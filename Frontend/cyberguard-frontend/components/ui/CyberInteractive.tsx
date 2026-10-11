"use client";

/*
  components/ui/CyberInteractive.tsx
  ==================================
  The shared interactive toolkit for every CyberGuard page:

    <CyberCard />       glass card: mouse-follow glow, border highlight, scanlines, click sound
    <TerminalHeader />  terminal title bar with animated STATUS / CLEARANCE chips
    <GlowButton />      cyber button with hover pulse and sound

  All three read their colour from the CSS variable --c (set by `accent`), so
  one prop re-themes them. Sounds come from lib/mission/audio (the same effects
  as the game) and only play AFTER the player's first click, because browsers
  block audio before that. Pass sound={false} to silence any element.
  Motion is switched off for people who enabled "reduce motion".
*/

import Link from "next/link";
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from "react";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";

/* ---------- shared helpers ---------- */

export type Accent = "cyan" | "emerald" | "brick" | "amber" | "violet";

const ACCENTS: Record<Accent, string> = {
  cyan: "#4cc9ff",
  emerald: "#4ade80",
  brick: "#fb4b5b",
  amber: "#f6c453",
  violet: "#8b5cf6",
};

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* Browsers block audio until the first user gesture, so remember when one happened. */
let gestureSeen = false;
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointerdown",
    () => {
      gestureSeen = true;
    },
    { once: true, capture: true }
  );
}

function playSound(kind: SfxKind | false | undefined) {
  if (!kind || !gestureSeen) return;
  try {
    ensureAudio();
    sfx(kind);
  } catch {
    /* audio is a bonus, never break the page because of it */
  }
}

/* Moves the glow to the pointer without re-rendering React (cheap and smooth). */
function trackPointer(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

/* Small CSS block: pseudo-element glows, scanlines, keyframes. */
const STYLES = `
.cgi-card { position: relative; overflow: hidden; transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
.cgi-card.cgi-live:hover { transform: translateY(-3px); }
.cgi-card::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
  background: radial-gradient(200px circle at var(--mx, 50%) var(--my, 50%), var(--c), transparent 70%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  opacity: 0; transition: opacity .25s ease;
}
.cgi-card.cgi-live:hover::before, .cgi-card.cgi-live:focus-visible::before { opacity: 1; }
.cgi-glow {
  position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .25s ease;
  background: radial-gradient(280px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--c) 24%, transparent), transparent 70%);
}
.cgi-card.cgi-live:hover .cgi-glow, .cgi-card.cgi-live:focus-visible .cgi-glow { opacity: 1; }
.cgi-scan {
  position: absolute; inset: 0; pointer-events: none; opacity: .7;
  background: repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 3px);
}
.cgi-scan::after {
  content: ""; position: absolute; left: 0; right: 0; height: 36%; top: -40%;
  background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--c) 14%, transparent), transparent);
}
.cgi-card.cgi-live:hover .cgi-scan::after { animation: cgiSweep 1.6s linear infinite; }
.cgi-blink { animation: cgiBlink 1s steps(1) infinite; }
.cgi-dot { animation: cgiDot 1.6s ease-in-out infinite; }
.cgi-btn { position: relative; transition: transform .15s ease, filter .15s ease, box-shadow .2s ease; }
.cgi-btn:hover:not(:disabled):not([aria-disabled="true"]) { filter: brightness(1.12); animation: cgiPulse 1.4s ease-in-out infinite; }
.cgi-btn:active:not(:disabled) { transform: scale(.97); }
.cgi-btn:focus-visible, .cgi-card:focus-visible { outline: 2px solid var(--c); outline-offset: 3px; }
@keyframes cgiSweep { to { transform: translateY(420%); } }
@keyframes cgiBlink { 50% { opacity: 0; } }
@keyframes cgiDot { 0%,100% { opacity: .45; transform: scale(.85); } 50% { opacity: 1; transform: scale(1.15); } }
@keyframes cgiPulse {
  0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--c) 55%, transparent), 0 0 14px color-mix(in srgb, var(--c) 35%, transparent); }
  50% { box-shadow: 0 0 0 7px transparent, 0 0 26px color-mix(in srgb, var(--c) 55%, transparent); }
}
@media (prefers-reduced-motion: reduce) {
  .cgi-card, .cgi-card *, .cgi-btn, .cgi-blink, .cgi-dot { animation: none !important; transition: none !important; }
  .cgi-card.cgi-live:hover { transform: none; }
}
`;

/* ==================================================================
   <CyberCard />
   ================================================================== */
export interface CyberCardProps {
  children: ReactNode;
  accent?: Accent;
  href?: string;                    // makes the whole card a link (map nodes, dashboard tiles)
  onClick?: () => void;             // makes the whole card a button
  locked?: boolean;                 // dimmed, no glow, no click, no sound
  scanlines?: boolean;              // holographic scanlines (default true)
  hoverSound?: SfxKind | false;     // default "tick"
  clickSound?: SfxKind | false;     // default "tick"
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export function CyberCard({
  children,
  accent = "cyan",
  href,
  onClick,
  locked = false,
  scanlines = true,
  hoverSound = "tick",
  clickSound = "tick",
  ariaLabel,
  className = "",
  style,
}: CyberCardProps) {
  const interactive = !locked && (Boolean(href) || Boolean(onClick));

  const cardStyle = {
    "--c": ACCENTS[accent],
    background: "color-mix(in srgb, #111329 72%, transparent)",
    border: "1px solid color-mix(in srgb, var(--c) 26%, transparent)",
    boxShadow:
      "inset 0 0 0 1px rgba(255,255,255,.03), 0 0 28px color-mix(in srgb, var(--c) 14%, transparent), 0 18px 44px rgba(0,0,0,.45)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    opacity: locked ? 0.55 : 1,
    filter: locked ? "grayscale(.7)" : undefined,
    cursor: interactive ? "pointer" : locked ? "not-allowed" : "default",
    ...style,
  } as CSSProperties;

  const classes = `cgi-card ${interactive || (!locked && !href && !onClick) ? "cgi-live" : ""} rounded-2xl text-[#f5f3ff] ${className}`;

  function handleClick() {
    if (!interactive) return;
    playSound(clickSound);
    onClick?.();
  }
  function handleEnter(e: PointerEvent<HTMLElement>) {
    if (interactive && e.pointerType === "mouse") playSound(hoverSound);
  }
  function handleKey(e: KeyboardEvent<HTMLElement>) {
    if (!onClick || !interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }

  const inner = (
    <>
      <style>{STYLES}</style>
      <span className="cgi-glow" aria-hidden="true" />
      {scanlines && <span className="cgi-scan" aria-hidden="true" />}
      <div className="relative z-10 p-6">{children}</div>
    </>
  );

  if (href && !locked) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={`${classes} block`}
        style={cardStyle}
        onPointerMove={trackPointer}
        onPointerEnter={handleEnter}
        onClick={handleClick}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      className={classes}
      style={cardStyle}
      role={onClick ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      aria-disabled={locked || undefined}
      onPointerMove={trackPointer}
      onPointerEnter={handleEnter}
      onClick={handleClick}
      onKeyDown={handleKey}
    >
      {inner}
    </div>
  );
}

/* ==================================================================
   <TerminalHeader />
   ================================================================== */
export interface TerminalHeaderProps {
  title?: string;                                    // e.g. "cyberguard@realm:~/missions"
  status?: "ONLINE" | "OFFLINE" | "ALERT" | "SECURE";
  clearance?: string;                                // e.g. "TIER 1"
  accent?: Accent;
  right?: ReactNode;                                 // optional extra (XP, user name...)
  className?: string;
}

const STATUS_COLOR: Record<NonNullable<TerminalHeaderProps["status"]>, string> = {
  ONLINE: ACCENTS.emerald,
  SECURE: ACCENTS.cyan,
  ALERT: ACCENTS.amber,
  OFFLINE: ACCENTS.brick,
};

export function TerminalHeader({
  title = "cyberguard@realm:~",
  status = "ONLINE",
  clearance = "TIER 1",
  accent = "cyan",
  right,
  className = "",
}: TerminalHeaderProps) {
  const statusColor = STATUS_COLOR[status];

  return (
    <header
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-t-2xl border border-white/10 bg-[#070711]/80 px-4 py-2.5 backdrop-blur ${className}`}
      style={{ "--c": ACCENTS[accent], ...MONO } as CSSProperties}
    >
      <style>{STYLES}</style>

      {/* window controls (decorative) */}
      <span className="flex gap-1.5" aria-hidden="true">
        <i className="h-3 w-3 rounded-full bg-[#fb4b5b]" />
        <i className="h-3 w-3 rounded-full bg-[#f6c453]" />
        <i className="h-3 w-3 rounded-full bg-[#4ade80]" />
      </span>

      <p className="min-w-0 flex-1 truncate text-xs text-[#b8b5c9]">
        <span style={{ color: "var(--c)" }}>$</span> {title}
        <span className="cgi-blink ms-0.5" style={{ color: "var(--c)" }} aria-hidden="true">_</span>
      </p>

      <p
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{ color: statusColor }}
        role="status"
      >
        <span
          className="cgi-dot inline-block h-2 w-2 rounded-full"
          style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
          aria-hidden="true"
        />
        STATUS: {status}
      </p>

      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6c453]">
        CLEARANCE: {clearance}
      </p>

      {right}
    </header>
  );
}

/* ==================================================================
   <GlowButton />
   ================================================================== */
export interface GlowButtonProps {
  children: ReactNode;
  accent?: Accent;
  variant?: "solid" | "outline";
  size?: "sm" | "md" | "lg";
  href?: string;                    // renders a link that looks like a button
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  fullWidth?: boolean;
  hoverSound?: SfxKind | false;     // default "tick"
  clickSound?: SfxKind | false;     // default "unlock"
  className?: string;
}

const SIZES = { sm: "px-4 py-2 text-xs", md: "px-6 py-3 text-sm", lg: "px-8 py-4 text-base" };

export function GlowButton({
  children,
  accent = "cyan",
  variant = "solid",
  size = "md",
  href,
  onClick,
  type = "button",
  disabled = false,
  fullWidth = false,
  hoverSound = "tick",
  clickSound = "unlock",
  className = "",
}: GlowButtonProps) {
  const color = ACCENTS[accent];
  const classes = `cgi-btn inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wide ${SIZES[size]} ${
    fullWidth ? "w-full" : ""
  } ${disabled ? "cursor-not-allowed opacity-30" : ""} ${className}`;

  const buttonStyle = {
    "--c": color,
    ...MONO,
    ...(variant === "solid"
      ? { background: color, color: "#070711" }
      : { background: "transparent", color, border: `1px solid ${color}` }),
  } as CSSProperties;

  function handleEnter(e: PointerEvent<HTMLElement>) {
    if (!disabled && e.pointerType === "mouse") playSound(hoverSound);
  }
  function handleClick() {
    if (disabled) return;
    playSound(clickSound);
    onClick?.();
  }

  if (href && !disabled) {
    return (
      <Link href={href} className={classes} style={buttonStyle} onPointerEnter={handleEnter} onClick={handleClick}>
        <style>{STYLES}</style>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      style={buttonStyle}
      disabled={disabled}
      onPointerEnter={handleEnter}
      onClick={handleClick}
    >
      <style>{STYLES}</style>
      {children}
    </button>
  );
}
