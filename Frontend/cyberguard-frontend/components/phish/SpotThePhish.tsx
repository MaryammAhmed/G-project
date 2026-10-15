"use client";

/*
  components/mission/SpotThePhish.tsx
  Deterministic forensic task. No network calls. Correctness owned here.
  Parent may pass a caseFile; a default is provided for standalone use.
*/

import { useMemo, useState, type ReactNode } from "react";
import type { PhishCase, PhishSignal } from "@/lib/mission/types";

type Verdict = "hook" | "clear";
type Action = "cut" | "reel";

export interface PhishFindings {
  hooksFound: string[];
  hooksMissed: string[];
  falseFlags: string[];
  cues: string[];
  action: Action;
}

const DEFAULT_CASE: PhishCase = {
  email: {
    from_display: "Snapgram Support",
    from_address: "support@snapgram-help.co",
    to: "maya.snaps",
    subject: "Action required: verify your account",
    greeting: "Hi maya.snaps,",
    body: "We detected a login from an unknown device. To keep your account, confirm your identity now.",
    deadline: "You have 30 minutes to verify or your account will be permanently deleted.",
    cta_text: "Verify my account",
    cta_href: "http://snapgram.com.verify-login.co/u/maya",
    footer: "© 2026 Snapgram Inc. · Unsubscribe",
  },
  signals: [],
  hookPoints: 20,
  precisionBonus: 10,
  precisionPenalty: 5,
  actionPoints: 30,
};

export function computeScore(
  caseFile: PhishCase,
  verdicts: Record<string, Verdict | undefined>,
  action: Action,
): number {
  const hooks = caseFile.signals.filter((s) => s.isHook);
  const hooksFound = hooks.filter((s) => verdicts[s.id] === "hook").length;
  const falseFlags = caseFile.signals.filter((s) => !s.isHook && verdicts[s.id] === "hook").length;
  const precision = Math.max(0, caseFile.precisionBonus - caseFile.precisionPenalty * falseFlags);
  return hooksFound * caseFile.hookPoints + precision + (action === "cut" ? caseFile.actionPoints : 0);
}

function buildFindings(
  caseFile: PhishCase,
  verdicts: Record<string, Verdict | undefined>,
  action: Action,
): PhishFindings {
  const found = caseFile.signals.filter((s) => s.isHook && verdicts[s.id] === "hook");
  return {
    hooksFound: found.map((s) => s.id),
    hooksMissed: caseFile.signals.filter((s) => s.isHook && verdicts[s.id] !== "hook").map((s) => s.id),
    falseFlags: caseFile.signals.filter((s) => !s.isHook && verdicts[s.id] === "hook").map((s) => s.id),
    cues: found.map((s) => s.cue),
    action,
  };
}

export default function SpotThePhish({
  caseFile = DEFAULT_CASE,
  onComplete,
  showHeader = true,
}: {
  caseFile?: PhishCase;
  onComplete?: (score: number, findings: PhishFindings) => void;
  showHeader?: boolean;
}) {
  const signals: PhishSignal[] = caseFile.signals;
  const totalHooks = signals.filter((s) => s.isHook).length;

  const [selected, setSelected] = useState<string | null>(null);
  const [verdicts, setVerdicts] = useState<Record<string, Verdict | undefined>>({});
  const [action, setAction] = useState<Action | null>(null);

  const judged = signals.filter((s) => verdicts[s.id]).length;
  const allJudged = judged === signals.length && signals.length > 0;
  const hooksTagged = signals.filter((s) => s.isHook && verdicts[s.id] === "hook").length;
  const progress = ((judged + (action ? 1 : 0)) / (signals.length + 1)) * 100;
  const active = signals.find((s) => s.id === selected) ?? null;

  const result = useMemo(
    () =>
      action
        ? { score: computeScore(caseFile, verdicts, action), findings: buildFindings(caseFile, verdicts, action) }
        : null,
    [action, verdicts, caseFile],
  );

  const linkTarget =
    selected === "link"
      ? signals.find((s) => s.id === "link")?.evidence[1]?.replace("href         : ", "") ?? null
      : null;

  function Part({ id, children, block = false }: { id: string; children: ReactNode; block?: boolean }) {
    const v = verdicts[id];
    const isSel = selected === id;
    const tone =
      v === "hook"
        ? "bg-amber-500/15 outline-amber-500"
        : v === "clear"
          ? "bg-teal-400/10 outline-teal-400/60"
          : "outline-transparent";
    return (
      <button
        type="button"
        disabled={!!action}
        aria-pressed={isSel}
        onClick={() => setSelected(id)}
        dir="auto"
        className={`${block ? "block w-full" : "inline-block"} rounded-sm px-1 text-left outline-1 outline-offset-2 transition-colors
          ${tone} ${isSel ? "!outline-2 !outline-slate-100" : "hover:outline-amber-500/50"} disabled:cursor-default
          ${!v && !isSel ? "underline decoration-dashed decoration-slate-600 underline-offset-4" : ""}`}
      >
        {children}
        {v === "hook" && <span className="ms-2 text-[10px] font-bold text-amber-500">[HOOK]</span>}
        {v === "clear" && <span className="ms-2 text-[10px] text-teal-400">[CLEAR]</span>}
      </button>
    );
  }

  return (
    <div className="bg-slate-950 font-mono text-slate-200" dir="auto">
      {showHeader && (
        <header className="border-b border-slate-800 bg-slate-950/90 px-5 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-teal-400">cyberguard://mission-2/phish-lab</p>
              <h1 className="text-lg font-bold text-slate-100">Spot the Phish</h1>
            </div>
            <div className="text-end text-xs">
              <p>
                <span className="text-amber-500">{hooksTagged}</span>/{totalHooks} hooks tagged
              </p>
              <p className="text-slate-500">
                {judged}/{signals.length} signals reviewed
              </p>
            </div>
          </div>
          <div className="mx-auto mt-3 h-1 max-w-6xl bg-slate-800">
            <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </header>
      )}

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-2">
        {/* LEFT: the bait */}
        <section aria-label="Suspicious email" className="flex flex-col overflow-hidden rounded-md border border-slate-700 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-3 py-2 text-[11px] text-slate-400">
            <span>SECURE MAIL // quarantine viewer</span>
            <span className="text-amber-500">UNVERIFIED</span>
          </div>

          <div className="space-y-4 p-5 text-sm leading-relaxed">
            <div className="space-y-1 border-b border-slate-800 pb-3 text-xs">
              <p className="flex flex-wrap items-center gap-1">
                <span className="text-slate-500">From:</span>
                <Part id="sender">
                  {caseFile.email.from_display} &lt;{caseFile.email.from_address}&gt;
                </Part>
              </p>
              <p>
                <span className="text-slate-500">To:</span> {caseFile.email.to}
              </p>
              <p>
                <span className="text-slate-500">Subject:</span> {caseFile.email.subject}
              </p>
            </div>

            <p>
              <Part id="greeting">{caseFile.email.greeting}</Part>
            </p>

            <p>{caseFile.email.body}</p>

            <p>
              <Part id="urgency">{caseFile.email.deadline}</Part>
            </p>

            <p>
              <Part id="link">
                <span className="inline-block rounded bg-slate-700 px-4 py-2 font-bold text-slate-100">
                  {caseFile.email.cta_text}
                </span>
              </Part>
            </p>

            <p className="border-t border-slate-800 pt-3 text-xs text-slate-500">
              <Part id="footer">{caseFile.email.footer}</Part>
            </p>
          </div>

          <div className="mt-auto border-t border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-500">
            {linkTarget ? <span className="text-amber-500">{linkTarget}</span> : "status: select any part of the message to inspect it"}
          </div>
        </section>

        {/* RIGHT: evidence */}
        <section aria-label="Evidence panel" className="space-y-4">
          {result ? (
            <div className="space-y-4 rounded-md border border-slate-700 bg-slate-900 p-5">
              <p className={`text-xs font-bold ${action === "cut" ? "text-teal-400" : "text-amber-500"}`}>
                {action === "cut" ? "LINE CUT: reported and quarantined" : "LINE REELED IN: you clicked the link"}
              </p>
              <p className="text-4xl font-bold text-slate-100">
                {result.score}
                <span className="text-lg text-slate-500">/100</span>
              </p>
              <ul className="space-y-1 text-xs">
                {signals.map((s) => {
                  const f = result.findings;
                  const state = f.hooksFound.includes(s.id)
                    ? ["text-teal-400", "hook found"]
                    : f.hooksMissed.includes(s.id)
                      ? ["text-amber-500", "hook missed"]
                      : f.falseFlags.includes(s.id)
                        ? ["text-amber-500", "false flag"]
                        : ["text-slate-500", "correctly cleared"];
                  return (
                    <li key={s.id} className="flex justify-between border-b border-slate-800 py-1">
                      <span>{s.label}</span>
                      <span className={state[0]}>{state[1]}</span>
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={() => onComplete?.(result.score, result.findings)}
                className="w-full rounded bg-teal-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-teal-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
              >
                Continue
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-md border border-slate-700 bg-slate-900 p-5">
                {!active ? (
                  <p className="text-sm text-slate-400">
                    <span className="text-teal-400">$</span> Select a part of the email to inspect it.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-teal-400">$ inspect --target {active.id}</p>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-slate-950 p-3 text-xs text-slate-300">
                      {active.evidence.join("\n")}
                    </pre>

                    <div className="flex gap-2">
                      <button
                        aria-pressed={verdicts[active.id] === "hook"}
                        onClick={() => setVerdicts((p) => ({ ...p, [active.id]: "hook" }))}
                        className={`flex-1 rounded border px-3 py-2 text-sm font-bold ${
                          verdicts[active.id] === "hook"
                            ? "border-amber-500 bg-amber-500 text-slate-950"
                            : "border-amber-500/60 text-amber-500 hover:bg-amber-500/10"
                        }`}
                      >
                        Tag as hook
                      </button>
                      <button
                        aria-pressed={verdicts[active.id] === "clear"}
                        onClick={() => setVerdicts((p) => ({ ...p, [active.id]: "clear" }))}
                        className={`flex-1 rounded border px-3 py-2 text-sm font-bold ${
                          verdicts[active.id] === "clear"
                            ? "border-teal-400 bg-teal-400 text-slate-950"
                            : "border-teal-400/60 text-teal-400 hover:bg-teal-400/10"
                        }`}
                      >
                        Looks safe
                      </button>
                    </div>

                    {verdicts[active.id] && (
                      <div
                        className={`rounded border-s-2 p-3 text-xs ${
                          (verdicts[active.id] === "hook") === active.isHook
                            ? "border-teal-400 bg-teal-400/5"
                            : "border-amber-500 bg-amber-500/5"
                        }`}
                      >
                        <p className="mb-1 font-bold">
                          {(verdicts[active.id] === "hook") === active.isHook ? "Correct call." : "Not quite."}{" "}
                          <span className="font-normal text-slate-500">{active.cue}</span>
                        </p>
                        <p className="text-slate-300">{active.why}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <ul className="space-y-1 rounded-md border border-slate-800 p-3 text-xs" aria-label="Evidence log">
                {signals.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => setSelected(s.id)}
                      className="flex w-full items-center justify-between rounded px-2 py-1 text-left hover:bg-slate-900"
                    >
                      <span className={selected === s.id ? "text-slate-100" : "text-slate-400"}>{s.label}</span>
                      <span
                        className={
                          verdicts[s.id] === "hook"
                            ? "text-amber-500"
                            : verdicts[s.id] === "clear"
                              ? "text-teal-400"
                              : "text-slate-600"
                        }
                      >
                        {verdicts[s.id] === "hook" ? "hook" : verdicts[s.id] === "clear" ? "clear" : "unreviewed"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 rounded-md border border-slate-700 bg-slate-900 p-4">
                <p className="text-xs text-slate-400">
                  {allJudged
                    ? "All signals reviewed. Choose your move."
                    : `Review all ${signals.length} signals to unlock the final move (${judged}/${signals.length}).`}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    disabled={!allJudged}
                    onClick={() => setAction("cut")}
                    className="rounded bg-teal-400 px-3 py-3 text-sm font-bold text-slate-950 hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Cut the line
                    <span className="block text-[11px] font-normal">report and quarantine</span>
                  </button>
                  <button
                    disabled={!allJudged}
                    onClick={() => setAction("reel")}
                    className="rounded border border-amber-500 px-3 py-3 text-sm font-bold text-amber-500 hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Reel it in
                    <span className="block text-[11px] font-normal">click the link</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
