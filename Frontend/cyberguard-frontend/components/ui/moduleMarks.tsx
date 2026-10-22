"use client";

/*
  components/ui/moduleMarks.tsx
  =============================
  Shared bits for the auth pages (register, verify-otp): the four module colours + icons,
  a falling-words backdrop, and the small animation CSS (scoped under .ax-root).
  The login page keeps its own copy, so nothing there changes.
*/

export type ModId = "vault" | "mirage" | "whisper" | "oracle";

export const MODULES: { id: ModId; name: string; color: string; topic: string; badge: string }[] = [
  { id: "vault", name: "THE VAULT", color: "#34D399", topic: "Passwords", badge: "VAULT BREAKER" },
  { id: "mirage", name: "THE MIRAGE", color: "#22D3EE", topic: "Phishing", badge: "PHISH-SPOTTER" },
  { id: "whisper", name: "THE WHISPER", color: "#A855F7", topic: "Social engineering", badge: "WHISPER BREAKER" },
  { id: "oracle", name: "THE ORACLE", color: "#FBBF24", topic: "Safe AI use", badge: "ORACLE'S APPRENTICE" },
];

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* A tiny icon per mission (24x24), drawn in the mission's colour. */
export function ModIcon({ id, color }: { id: ModId; color: string }) {
  const p = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {id === "vault" && (<><rect x="4" y="10" width="16" height="11" rx="2.5" {...p} /><path d="M8 10V7a4 4 0 0 1 8 0v3" {...p} /></>)}
      {id === "mirage" && (<><path d="M12 3v8" {...p} /><path d="M12 11a4 4 0 1 0 4 4" {...p} /><circle cx="12" cy="3.5" r="1.4" fill={color} /></>)}
      {id === "whisper" && (<path d="M5 5h6l1.5 4-2.5 1.5a10 10 0 0 0 4.5 4.5L16 12.5l4 1.5v6h-1C10.7 20 4 13.3 4 5Z" {...p} />)}
      {id === "oracle" && (<><circle cx="12" cy="12" r="8" {...p} /><circle cx="12" cy="12" r="3" fill={color} /></>)}
    </svg>
  );
}

/* Animation CSS. Put <style>{AUTH_CSS}</style> inside an element with className="ax-root". */
export const AUTH_CSS = `
@keyframes axSpin { to { transform: rotate(360deg); } }
@keyframes axFall { from { transform: translateY(-12vh); opacity: 0; } 10%,90% { opacity: .45; } to { transform: translateY(112vh); opacity: 0; } }
@keyframes axScan { to { transform: translateY(520%); } }
@keyframes axBlink { 50% { opacity: 0; } }
@keyframes axIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes axShake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(3px); } }
.ax-root .ax-spin { transform-origin: 60px 60px; animation: axSpin 30s linear infinite; }
.ax-root .ax-rain { animation: axFall linear infinite; }
.ax-root .ax-scan::after { content: ""; position: absolute; left: 0; right: 0; height: 16%; top: -20%; pointer-events: none; background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--c) 18%, transparent), transparent); animation: axScan 7s linear infinite; }
.ax-root .ax-blink { animation: axBlink 1s steps(1) infinite; }
.ax-root .ax-in { animation: axIn .5s ease-out both; }
.ax-root .ax-shake { animation: axShake .45s ease-in-out; }
.ax-root .ax-card { transition: border-color .8s ease, box-shadow .8s ease; }
@media (prefers-reduced-motion: reduce) { .ax-root *, .ax-root *::before, .ax-root *::after { animation: none !important; transition: none !important; } }
`;

/* Falling words in the four module colours (decorative). */
export function AuthRain({ words }: { words: string[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {words.map((w, i) => (
        <span
          key={w}
          className="ax-rain absolute text-[11px] font-bold tracking-[0.3em]"
          style={{ ...MONO, left: `${(i * 12 + 4) % 94}%`, color: MODULES[i % 4].color, opacity: 0.5, animationDuration: `${18 + (i % 4) * 4}s`, animationDelay: `${i * 1.8}s` }}
        >
          {w}
        </span>
      ))}
    </div>
  );
}
