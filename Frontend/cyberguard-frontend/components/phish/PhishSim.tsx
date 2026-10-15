"use client";

/*
  components/phish/PhishSim.tsx
  =============================
  The phishing lab as a GAME screen (same props and scoring as before).

    - full-screen cyber backdrop (grid, scanlines, glow, drifting phishing symbols)
    - a holographic mail client with scanner tools and a live evidence log
    - an analyst console: tap evidence cards, then lock in a verdict
    - an animated score ring and a debrief

  The scoring lives in lib/phish/scoring.ts. This file only draws and collects the answer.
  Pass backdrop={false} when it is embedded inside MissionPlayer (which has its own).
*/

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { GROUP_LABEL, REASONS } from "@/lib/phish/types";
import type { Answer, ChipGroup, Confidence, FillerMail, Interactions, PhishEmail, ReasonId, Span } from "@/lib/phish/types";
import { scoreAnswer } from "@/lib/phish/scoring";
import type { ScoreResult } from "@/lib/phish/scoring";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

const FLAG_GROUPS: ChipGroup[] = ["sender", "links", "attachment", "pressure", "content"];
const ALL_IDS = Object.keys(REASONS) as ReasonId[];

type Tab = ChipGroup | "trust";
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "sender", icon: "\u{1F4E8}", label: GROUP_LABEL.sender },
  { id: "links", icon: "\u{1F517}", label: GROUP_LABEL.links },
  { id: "attachment", icon: "\u{1F4CE}", label: GROUP_LABEL.attachment },
  { id: "pressure", icon: "\u26A1", label: GROUP_LABEL.pressure },
  { id: "content", icon: "\u{1F9E9}", label: GROUP_LABEL.content },
  { id: "trust", icon: "\u{1F9EA}", label: "Why it looks real" },
];

const ICON: Record<ReasonId, string> = {
  "sender-name": "\u{1FAAA}", domain: "\u{1F310}", link: "\u{1F517}", attachment: "\u{1F4CE}",
  urgency: "\u23F1\uFE0F", reward: "\u{1F381}", authority: "\u{1F3DB}\uFE0F", sensitive: "\u{1F511}",
  greeting: "\u{1F464}", errors: "\u270F\uFE0F", branding: "\u{1F5BC}\uFE0F",
  "t-logo": "\u{1F3F7}\uFE0F", "t-known": "\u{1F501}", "t-polished": "\u2728",
};

const CONFIDENCE: { id: Confidence; label: string; fill: number }[] = [
  { id: "guessing", label: "Guessing", fill: 33 },
  { id: "fairly", label: "Fairly sure", fill: 66 },
  { id: "certain", label: "Certain", fill: 100 },
];

type CueState = "none" | "found" | "missed" | "bonus";
const HIGHLIGHT: Record<CueState, string> = {
  none: "",
  found: "rounded bg-[#4ade80]/20 px-0.5 text-[#4ade80]",
  missed: "rounded bg-[#fb4b5b]/20 px-0.5 text-[#fb4b5b] ring-1 ring-[#fb4b5b]/50",
  bonus: "underline decoration-dotted decoration-[#77748c] underline-offset-2",
};

/* ---------- sound (only after the first click: browser rule) ---------- */
let gesture = false;
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", () => { gesture = true; }, { once: true, capture: true });
}
function snd(kind: SfxKind) {
  if (!gesture) return;
  try {
    ensureAudio();
    sfx(kind);
  } catch {
    /* sound is a bonus, never break the page */
  }
}

/* ---------- animation CSS, scoped under .ps-root ---------- */
const CSS = `
@keyframes psIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes psPop { 0% { opacity: 0; transform: scale(.5); } 70% { transform: scale(1.12); } 100% { opacity: 1; transform: scale(1); } }
@keyframes psFloat { 0%,100% { transform: translateY(0); opacity: .25; } 50% { transform: translateY(-16px); opacity: .6; } }
@keyframes psSweep { to { transform: translateY(600%); } }
@keyframes psBlink { 50% { opacity: 0; } }
@keyframes psGlow { 0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--k, #4cc9ff) 50%, transparent); } 50% { box-shadow: 0 0 18px 2px color-mix(in srgb, var(--k, #4cc9ff) 40%, transparent); } }
.ps-root .ps-in { animation: psIn .4s ease-out both; }
.ps-root .ps-pop { animation: psPop .45s ease-out both; }
.ps-root .ps-float { animation: psFloat 6s ease-in-out infinite; }
.ps-root .ps-blink { animation: psBlink 1s steps(1) infinite; }
.ps-root .ps-glow { animation: psGlow 1.8s ease-in-out infinite; }
.ps-root .ps-sweep::after { content: ""; position: absolute; left: 0; right: 0; height: 18%; top: -20%; pointer-events: none;
  background: linear-gradient(180deg, transparent, rgba(76,201,255,.1), transparent); animation: psSweep 7s linear infinite; }
.ps-root :focus-visible { outline: 2px solid #4cc9ff; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .ps-root *, .ps-root *::before, .ps-root *::after { animation: none !important; transition: none !important; }
}
`;

const GLYPHS = [
  { t: "\u2709", l: 6, tp: 18, d: 0 }, { t: "@", l: 90, tp: 30, d: 1.2 }, { t: "https://", l: 70, tp: 8, d: 0.6 },
  { t: "\u{1F3A3}", l: 14, tp: 72, d: 1.8 }, { t: "0xFA11", l: 82, tp: 80, d: 0.9 }, { t: "PASSWORD?", l: 44, tp: 92, d: 2.2 },
];

function Backdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
      style={{
        background:
          "radial-gradient(48rem 26rem at 10% -5%, rgba(76,201,255,.16), transparent 60%)," +
          "radial-gradient(44rem 24rem at 100% 100%, rgba(238,42,123,.15), transparent 60%)," +
          "radial-gradient(36rem 20rem at 85% 0%, rgba(251,75,91,.1), transparent 60%), #070711",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 75%)",
        }}
      />
      <div className="absolute inset-0 opacity-60" style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0 1px, transparent 1px 3px)" }} />
      {GLYPHS.map((g) => (
        <span
          key={g.t}
          className="ps-float absolute text-sm font-bold text-[#4cc9ff]"
          style={{ ...MONO, left: `${g.l}%`, top: `${g.tp}%`, animationDelay: `${g.d}s` }}
        >
          {g.t}
        </span>
      ))}
    </div>
  );
}

/* A glass panel with a neon edge and a small title bar. */
function Panel({ title, accent = "#4cc9ff", right, children, className = "" }: {
  title: string; accent?: string; right?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border backdrop-blur ${className}`}
      style={{ borderColor: `${accent}55`, background: "rgba(17,19,41,.78)", boxShadow: `0 0 30px ${accent}1f, 0 18px 44px rgba(0,0,0,.45)` }}
    >
      <header className="flex items-center justify-between gap-3 border-b px-4 py-2" style={{ borderColor: `${accent}33`, background: `${accent}12` }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ ...MONO, color: accent }}>{title}</p>
        {right}
      </header>
      {children}
    </section>
  );
}

function ReasonCard({ id, on, onClick }: { id: ReasonId; on: boolean; onClick: () => void }) {
  const r = REASONS[id];
  const color = r.kind === "trust" ? "#f6c453" : "#4cc9ff";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex items-start gap-3 rounded-xl border p-3 text-start transition active:scale-[0.98] ${
        on ? "ps-pop" : "border-white/10 bg-[#0b0c1e]/80 hover:border-white/30"
      }`}
      style={
        on
          ? ({ borderColor: color, background: `${color}1a`, boxShadow: `0 0 18px ${color}44` } as CSSProperties)
          : undefined
      }
    >
      <span className="text-xl" aria-hidden="true">{ICON[id]}</span>
      <span className="min-w-0 flex-1 text-sm text-[#f5f3ff]">{r.label}</span>
      <span className="text-[10px] font-bold tracking-[0.2em]" style={{ ...MONO, color: on ? color : "#77748c" }}>
        {on ? (r.kind === "trust" ? "NOTED" : "FLAGGED") : "TAP"}
      </span>
    </button>
  );
}

function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setV(Math.round(target * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/* ================================================================== */
interface PhishSimProps {
  email: PhishEmail;
  persona: string;
  filler: FillerMail[];
  onComplete?: (result: ScoreResult, answer: Answer) => void;
  backdrop?: boolean; // draw the full-screen background (default true)
}

export default function PhishSim({ email, persona, filler, onComplete, backdrop = true }: PhishSimProps) {
  const [interactions, setInteractions] = useState<Interactions>({
    openedDetails: false, probedLink: false, clickedLink: false, openedAttachment: false,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [hoverUrl, setHoverUrl] = useState<string | null>(null);
  const [traced, setTraced] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const [panel, setPanel] = useState<"evidence" | "verdict">("evidence");
  const [tab, setTab] = useState<Tab>("sender");
  const [verdict, setVerdict] = useState<Answer["verdict"] | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [reasons, setReasons] = useState<ReasonId[]>([]);
  const [note, setNote] = useState("");

  const [submitted, setSubmitted] = useState<Answer | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const reviewing = result !== null;
  const picked = submitted?.reasons ?? [];

  /* Records an action; the first time only, it is also written to the evidence log. */
  function mark(key: keyof Interactions, text?: string) {
    if (text && !interactions[key]) setLog((l) => [...l, text]);
    setInteractions((i) => ({ ...i, [key]: true }));
  }

  function toggleDetails() {
    setShowDetails((s) => !s);
    mark("openedDetails", "opened the sender details");
    snd("tick");
  }
  function showLink(index: number) {
    setHoverUrl(email.links[index].realUrl);
    mark("probedLink", `checked where the link goes: ${email.links[index].realUrl}`);
  }
  function clickLink(index: number) {
    showLink(index);
    mark("clickedLink", "clicked the link (blocked in training mode)");
    setNotice("Links are disabled in training mode. In a real inbox, that click would have opened the address shown at the bottom.");
    snd("bad");
  }
  function traceTool() {
    if (email.links.length === 0) return;
    setTraced((t) => !t);
    mark("probedLink", `traced the link: ${email.links[0].realUrl}`);
    snd("tick");
  }
  function clickAttachment() {
    mark("openedAttachment", "clicked the attachment (blocked in training mode)");
    setNotice("Attachments are disabled in training mode. In a real inbox, opening this file is the risky step.");
    snd("bad");
  }
  function toggleReason(id: ReasonId) {
    setReasons((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
    snd("tick");
  }

  function submit() {
    if (!verdict || !confidence) return;
    const answer: Answer = { verdict, confidence, reasons, note: note.trim() };
    const scored = scoreAnswer(email, answer);
    setSubmitted(answer);
    setResult(scored);
    setShowDetails(true);
    setNotice(null);
    snd(scored.verdictCorrect ? "good" : "bad");
  }

  function cueState(ids?: string[]): CueState {
    if (!reviewing || !ids || ids.length === 0) return "none";
    const cues = email.cues.filter((c) => ids.includes(c.id));
    if (cues.length === 0) return "none";
    if (cues.some((c) => c.reason && !picked.includes(c.reason))) return "missed";
    if (cues.some((c) => c.reason)) return "found";
    return "bonus";
  }

  function renderSpan(span: Span, key: number) {
    const style = HIGHLIGHT[cueState(span.cueIds)];
    if (span.linkIndex === undefined) {
      return <span key={key} className={style}>{span.text}</span>;
    }
    const index = span.linkIndex;
    return (
      <a
        key={key}
        href="#"
        onClick={(e) => { e.preventDefault(); clickLink(index); }}
        onMouseEnter={() => showLink(index)}
        onMouseLeave={() => setHoverUrl(null)}
        onFocus={() => showLink(index)}
        onBlur={() => setHoverUrl(null)}
        className={`inline-block rounded-lg px-5 py-2.5 font-semibold text-[#070711] no-underline transition hover:brightness-110 ${style ? "ring-2 ring-[#fb4b5b]" : ""}`}
        style={{ background: "linear-gradient(135deg,#4cc9ff,#8b5cf6)", boxShadow: "0 0 18px rgba(76,201,255,.4)" }}
      >
        {span.text}
      </a>
    );
  }

  const h = email.header;
  const detailsOpen = showDetails || reviewing;
  const att = email.attachments[0];
  const urlBar = hoverUrl ?? (traced ? email.links[0]?.realUrl ?? null : null);

  const intel = [interactions.openedDetails, interactions.probedLink].filter(Boolean).length;
  const steps = [
    { label: "INSPECT", done: intel > 0 },
    { label: "FLAG", done: reasons.length > 0 },
    { label: "VERDICT", done: !!verdict && !!confidence },
  ];
  const countIn = (t: Tab) =>
    ALL_IDS.filter((id) => (t === "trust" ? REASONS[id].kind === "trust" : REASONS[id].kind === "flag" && REASONS[id].group === t) && reasons.includes(id)).length;
  const tabIds = (t: Tab) =>
    ALL_IDS.filter((id) => (t === "trust" ? REASONS[id].kind === "trust" : REASONS[id].kind === "flag" && REASONS[id].group === t));

  const toolBtn = (on: boolean) =>
    `rounded-lg border px-3 py-1.5 text-xs font-bold tracking-widest transition active:scale-95 disabled:opacity-30 ${
      on ? "border-[#4cc9ff] bg-[#4cc9ff]/15 text-[#4cc9ff]" : "border-white/15 text-[#b8b5c9] hover:border-white/40"
    }`;

  return (
    <div className="ps-root relative isolate text-[#f5f3ff]" style={{ "--k": "#4cc9ff" } as CSSProperties}>
      <style>{CSS}</style>
      {backdrop && <Backdrop />}

      <div className="relative z-10 space-y-5">
        {/* ---------- HUD ---------- */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#4cc9ff]" style={MONO}>
              {"// phishing lab: sandbox"}
            </p>
            <h1 className="text-2xl font-bold sm:text-3xl">Is this email a trap?</h1>
          </div>
          <ol className="flex flex-wrap gap-2 text-[10px] font-bold tracking-[0.2em]" style={MONO} aria-label="Progress">
            {steps.map((s, i) => (
              <li
                key={s.label}
                className="rounded-full border px-3 py-1"
                style={{
                  borderColor: s.done ? "#4ade80aa" : "rgba(255,255,255,.12)",
                  color: s.done ? "#4ade80" : "#77748c",
                  background: s.done ? "rgba(74,222,128,.08)" : "transparent",
                }}
              >
                {s.done ? "\u2713" : i + 1} {s.label}
              </li>
            ))}
          </ol>
        </header>

        {/* ---------- briefing ---------- */}
        <Panel title="MISSION BRIEFING" accent="#8b5cf6">
          <p className="ps-in p-4 text-sm leading-relaxed text-[#b8b5c9]">
            <span className="me-2 text-[#8b5cf6]" aria-hidden="true">&#9670;</span>
            {persona}
          </p>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          {/* ---------- MAIL CLIENT ---------- */}
          <Panel
            title="CYBERGUARD MAIL // SANDBOX"
            right={<span className="text-[10px] tracking-[0.2em] text-[#4ade80]" style={MONO}><span className="ps-blink">&#9679;</span> SAFE MODE</span>}
          >
            {/* scanner tools */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#070711]/60 px-4 py-2.5" style={MONO}>
              <span className="text-[10px] tracking-[0.2em] text-[#77748c]">SCANNER</span>
              <button type="button" onClick={toggleDetails} className={toolBtn(detailsOpen)} aria-pressed={detailsOpen}>
                {"\u{1F50D}"} SENDER
              </button>
              <button type="button" onClick={traceTool} disabled={email.links.length === 0} className={toolBtn(traced)} aria-pressed={traced}>
                {"\u{1F517}"} TRACE LINK
              </button>
              <span className="ms-auto text-[10px] tracking-[0.2em] text-[#f6c453]">INTEL {intel}/2</span>
            </div>

            <div className="grid md:grid-cols-[210px_minmax(0,1fr)]">
              <aside className="hidden border-e border-white/10 bg-[#070711]/50 md:block" aria-label="Inbox list">
                <p className="border-b border-white/10 px-4 py-3 text-sm font-semibold">Inbox</p>
                <ul>
                  <li className="border-b border-white/10 border-s-4 border-s-[#4cc9ff] bg-[#4cc9ff]/10 px-4 py-3">
                    <p className="truncate text-sm font-bold">{h.displayName}</p>
                    <p className="truncate text-xs text-[#b8b5c9]">{email.subject}</p>
                    <p className="text-[11px] text-[#77748c]">8:12 AM</p>
                  </li>
                  {filler.map((m) => (
                    <li key={m.subject} className="border-b border-white/5 px-4 py-3 text-[#77748c]">
                      <p className="truncate text-sm">{m.from}</p>
                      <p className="truncate text-xs">{m.subject}</p>
                      <p className="text-[11px]">{m.time}</p>
                    </li>
                  ))}
                </ul>
              </aside>

              <article className="relative min-w-0 pb-9" aria-label="Open email">
                <div className="space-y-3 border-b border-white/10 px-5 py-4">
                  <h2 className="text-lg font-bold leading-snug">{email.subject}</h2>
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#4cc9ff]/40 bg-[#4cc9ff]/10 text-sm font-bold text-[#4cc9ff]" aria-hidden="true">
                      {h.displayName[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${HIGHLIGHT[cueState(h.cueIds?.displayName)]}`}>{h.displayName}</p>
                      <p className="text-xs text-[#77748c]">to me</p>
                    </div>
                  </div>

                  {detailsOpen && (
                    <dl className="ps-in grid grid-cols-[70px_1fr] gap-y-1 rounded-lg border border-white/10 bg-[#070711]/70 p-3 text-xs" style={MONO}>
                      <dt className="text-[#77748c]">From</dt>
                      <dd className={`break-all ${HIGHLIGHT[cueState(h.cueIds?.from)]}`}>{h.from}</dd>
                      <dt className="text-[#77748c]">Reply-to</dt>
                      <dd className={`break-all ${HIGHLIGHT[cueState(h.cueIds?.replyTo)]}`}>{h.replyTo}</dd>
                      <dt className="text-[#77748c]">To</dt>
                      <dd className="break-all">{h.to}</dd>
                      <dt className="text-[#77748c]">Date</dt>
                      <dd>{h.date}</dd>
                    </dl>
                  )}
                </div>

                <div className="space-y-3 px-5 py-4 text-sm leading-relaxed text-[#e9e6ff]">
                  {email.body.map((paragraph, i) => (
                    <p key={i}>{paragraph.map((span, j) => renderSpan(span, j))}</p>
                  ))}
                </div>

                {att && (
                  <div className="px-5 pb-4">
                    <button
                      type="button"
                      onClick={clickAttachment}
                      className={`flex items-center gap-3 rounded-lg border border-white/15 bg-[#070711]/60 px-3 py-2 text-start text-sm transition hover:border-white/40 ${HIGHLIGHT[cueState(att.cueIds)]}`}
                    >
                      <span aria-hidden="true">&#128206;</span>
                      <span>
                        <span className="block font-semibold">{att.name}</span>
                        <span className="block text-xs text-[#77748c]">{att.type}, {att.sizeKb} KB</span>
                      </span>
                    </button>
                  </div>
                )}

                {notice && (
                  <p className="ps-in mx-5 mb-3 rounded-lg border border-[#fb4b5b]/40 bg-[#fb4b5b]/10 px-3 py-2 text-xs text-[#fb4b5b]" role="alert">
                    {notice}
                  </p>
                )}

                {urlBar && (
                  <div className="absolute bottom-0 start-0 max-w-full truncate border-e border-t border-[#4cc9ff]/40 bg-[#070711]/95 px-3 py-1 text-xs text-[#4cc9ff]" style={MONO}>
                    &#9656; link target: {urlBar}
                  </div>
                )}
              </article>
            </div>

            {/* evidence log */}
            <div className="border-t border-white/10 bg-[#070711]/70 px-4 py-2.5 text-[11px]" style={MONO} aria-live="polite">
              <p className="mb-1 tracking-[0.2em] text-[#77748c]">EVIDENCE LOG</p>
              {log.length === 0 ? (
                <p className="text-[#77748c]">
                  &gt; nothing inspected yet <span className="ps-blink">_</span>
                </p>
              ) : (
                log.slice(-4).map((l, i) => (
                  <p key={`${l}-${i}`} className="ps-in break-all text-[#4ade80]">&gt; {l}</p>
                ))
              )}
            </div>
          </Panel>

          {/* ---------- ANALYST CONSOLE ---------- */}
          {!result && (
            <Panel
              title="ANALYST CONSOLE"
              className="ps-sweep relative lg:sticky lg:top-6"
              right={<span className="text-[10px] tracking-[0.2em] text-[#f6c453]" style={MONO}>FLAGS {reasons.length}</span>}
            >
              <div className="grid grid-cols-2 border-b border-white/10 text-[11px] font-bold tracking-[0.2em]" style={MONO}>
                {(["evidence", "verdict"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setPanel(p); snd("tick"); }}
                    aria-pressed={panel === p}
                    className={`py-2.5 transition ${panel === p ? "bg-[#4cc9ff]/12 text-[#4cc9ff]" : "text-[#77748c] hover:text-[#b8b5c9]"}`}
                  >
                    {p === "evidence" ? "1 | EVIDENCE" : "2 | VERDICT"}
                  </button>
                ))}
              </div>

              {panel === "evidence" ? (
                <div className="ps-in space-y-3 p-4">
                  <p className="text-xs text-[#b8b5c9]">
                    Inspect the email, then tap every red flag you can point to. Wrong flags cost points.
                  </p>
                  <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Evidence categories">
                    {TABS.map((t) => {
                      const n = countIn(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          role="tab"
                          aria-selected={tab === t.id}
                          onClick={() => { setTab(t.id); snd("tick"); }}
                          className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition ${
                            tab === t.id ? "border-[#4cc9ff] bg-[#4cc9ff]/15 text-[#4cc9ff]" : "border-white/10 text-[#b8b5c9] hover:border-white/30"
                          }`}
                          style={MONO}
                        >
                          <span aria-hidden="true">{t.icon}</span> {t.label}
                          {n > 0 && <span className="ms-1.5 rounded-full bg-[#f6c453] px-1.5 text-[10px] font-bold text-[#070711]">{n}</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid gap-2">
                    {tabIds(tab).map((id) => (
                      <ReasonCard key={id} id={id} on={reasons.includes(id)} onClick={() => toggleReason(id)} />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPanel("verdict"); snd("unlock"); }}
                    className="w-full rounded-xl bg-[#4cc9ff] px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95"
                  >
                    Next: give your verdict
                  </button>
                </div>
              ) : (
                <div className="ps-in space-y-5 p-4">
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold tracking-[0.2em] text-[#4cc9ff]" style={MONO}>YOUR VERDICT</p>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { id: "safe", icon: "\u2705", label: "Looks safe", color: "#4ade80" },
                        { id: "phish", icon: "\u{1F6A9}", label: "Report as phishing", color: "#fb4b5b" },
                      ] as const).map((v) => {
                        const on = verdict === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => { setVerdict(v.id); snd("unlock"); }}
                            aria-pressed={on}
                            className={`rounded-2xl border-2 p-4 text-center transition active:scale-95 ${on ? "ps-pop ps-glow" : "border-white/10 bg-[#0b0c1e]/80 hover:border-white/30"}`}
                            style={on ? ({ borderColor: v.color, background: `${v.color}18`, "--k": v.color } as CSSProperties) : undefined}
                          >
                            <span className="block text-3xl" aria-hidden="true">{v.icon}</span>
                            <span className="mt-1 block text-sm font-bold" style={{ color: on ? v.color : "#f5f3ff" }}>{v.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold tracking-[0.2em] text-[#4cc9ff]" style={MONO}>GUT METER: HOW SURE ARE YOU?</p>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${CONFIDENCE.find((c) => c.id === confidence)?.fill ?? 0}%`, background: "linear-gradient(90deg,#4cc9ff,#8b5cf6)" }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {CONFIDENCE.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { setConfidence(c.id); snd("tick"); }}
                          aria-pressed={confidence === c.id}
                          className={`rounded-lg border py-2 text-xs transition ${
                            confidence === c.id ? "border-[#4cc9ff] bg-[#4cc9ff]/15 text-[#4cc9ff]" : "border-white/10 text-[#b8b5c9] hover:border-white/30"
                          }`}
                          style={MONO}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold tracking-[0.2em] text-[#4cc9ff]" style={MONO}>IN YOUR OWN WORDS (OPTIONAL)</p>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={280}
                      rows={3}
                      aria-label="Your reasoning in your own words"
                      placeholder="What made you decide?"
                      className="w-full rounded-xl border border-white/20 bg-[#070711] p-3 text-sm text-[#f5f3ff] outline-none focus:border-[#4cc9ff]"
                      style={MONO}
                    />
                    <p className="text-end text-[11px] text-[#77748c]">{note.length} / 280</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPanel("evidence")}
                      className="rounded-xl border border-white/20 px-4 py-3 text-sm text-[#f5f3ff] transition hover:border-white/50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={!verdict || !confidence}
                      className="flex-1 rounded-xl bg-[#4cc9ff] px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      LOCK IN VERDICT
                    </button>
                  </div>
                </div>
              )}
            </Panel>
          )}
        </div>

        {result && submitted && (
          <ScoreCard email={email} result={result} interactions={interactions} onContinue={() => onComplete?.(result, submitted)} />
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
function ScoreCard({ email, result, interactions, onContinue }: {
  email: PhishEmail; result: ScoreResult; interactions: Interactions; onContinue: () => void;
}) {
  const shown = useCountUp(result.total);
  const color = result.verdictCorrect ? "#4ade80" : "#fb4b5b";
  const strongest = result.found.filter((f) => f.decisive);

  const process = [
    interactions.openedDetails ? "You opened the sender details." : "You never opened the sender details, where the real address is.",
    interactions.probedLink ? "You checked where the link goes." : "You never checked where the link goes.",
    interactions.openedAttachment ? "You clicked the attachment." : "You left the attachment alone.",
  ];

  const bars = [
    { label: "Verdict", value: result.verdictPoints, max: 40 },
    { label: "Warning signs", value: result.recallPoints, max: 40 },
    { label: "Precision", value: result.precisionPoints, max: 20 },
  ];

  return (
    <Panel title="ASSESSMENT RESULT" accent={color} className="ps-in" >
      <div className="space-y-5 p-5" aria-live="polite">
        <div className="flex flex-wrap items-center gap-6">
          <div
            className="grid h-32 w-32 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(${color} ${shown * 3.6}deg, rgba(255,255,255,.08) 0)` }}
            role="img"
            aria-label={`${result.total} out of 100`}
          >
            <div className="grid h-[104px] w-[104px] place-items-center rounded-full bg-[#0b0c1e]">
              <p className="text-center">
                <span className="block text-3xl font-bold" style={{ color }}>{shown}</span>
                <span className="block text-[10px] tracking-[0.2em] text-[#77748c]" style={MONO}>/ 100</span>
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-2xl font-bold" style={{ color }}>
              {result.verdictCorrect ? "Threat neutralised: this is phishing." : "Breach: this email is phishing."}
            </p>
            <p className="text-2xl" aria-label={`${result.stars} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="ps-pop inline-block"
                  style={{ animationDelay: `${0.15 * i}s`, color: i < result.stars ? "#f6c453" : "#3a3b55" }}
                >
                  &#9733;
                </span>
              ))}
            </p>
            <p className="text-sm text-[#b8b5c9]">{result.calibration}</p>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3" style={MONO}>
          {bars.map((b) => (
            <li key={b.label} className="rounded-xl border border-white/10 bg-[#070711]/60 p-3">
              <p className="flex justify-between text-xs text-[#b8b5c9]">
                {b.label}
                <span className="text-[#4cc9ff]">{b.value}/{b.max}</span>
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#4cc9ff] transition-all duration-700" style={{ width: `${(b.value / b.max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>

        {result.found.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#4ade80]" style={MONO}>YOU CAUGHT</p>
            {strongest.length > 0 && (
              <p className="text-sm text-[#e9e6ff]">
                Strongest evidence you found: {strongest.map((s) => REASONS[s.reason].label.toLowerCase()).join("; ")}.
              </p>
            )}
            <ul className="flex flex-wrap gap-2">
              {result.found.map((f) => (
                <li key={f.reason} className="rounded-lg border border-[#4ade80]/40 bg-[#4ade80]/10 px-3 py-1.5 text-sm text-[#4ade80]">
                  {ICON[f.reason]} {REASONS[f.reason].label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.missed.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#fb4b5b]" style={MONO}>YOU MISSED (HIGHLIGHTED IN THE EMAIL)</p>
            <ul className="space-y-2 text-sm">
              {result.missed.map((m) => (
                <li key={m.reason} className="rounded-xl border border-[#fb4b5b]/30 bg-[#fb4b5b]/5 p-3">
                  <p className="font-semibold text-[#f5f3ff]">
                    {ICON[m.reason]} {REASONS[m.reason].label}
                    {m.decisive && <span className="ms-2 text-[10px] tracking-widest text-[#fb4b5b]" style={MONO}>DECISIVE</span>}
                  </p>
                  {m.cues.map((c) => <p key={c.id} className="mt-1 text-[#b8b5c9]">{c.explain}</p>)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.falseFlags.length > 0 && (
          <p className="text-sm text-[#b8b5c9]">
            Not actually in this email: {result.falseFlags.map((f) => REASONS[f].label.toLowerCase()).join("; ")}. Each costs 5 points, so only flag what you can point to.
          </p>
        )}

        {result.trustPicked.length > 0 && (
          <p className="text-sm text-[#b8b5c9]">
            You said it looked real because: {result.trustPicked.map((t) => REASONS[t].label.toLowerCase()).join("; ")}. Attackers copy logos, style and names, so these prove nothing on their own.
          </p>
        )}

        <div className="space-y-1">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#77748c]" style={MONO}>HOW YOU INVESTIGATED</p>
          <ul className="list-inside list-disc text-sm text-[#b8b5c9]">
            {process.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>

        <p className="text-xs text-[#77748c]">{email.cues.length} warning signs were planted in this email. Next you will learn how to spot each kind.</p>

        <button
          type="button"
          onClick={() => { snd("unlock"); onContinue(); }}
          className="rounded-xl bg-[#4cc9ff] px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95"
        >
          Continue
        </button>
      </div>
    </Panel>
  );
}
