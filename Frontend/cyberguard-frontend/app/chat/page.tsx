"use client";

/*
  app/chat/page.tsx
  ================
  ASK CIPHER: the live AI mentor, wired to the backend /api/chat route.
  Pick a realm (module), ask, and Cipher answers from that realm's rulebook,
  plus deeper study notes from the same standards.
  The reply is rendered as plain text, never HTML.

  WHAT CHANGED IN THIS VERSION:
    1. HISTORY: the last few messages are sent with each question, so follow-ups
       like "what about the second one?" make sense to Cipher.
    2. SOURCE LINE: the backend now returns which standard the realm is based on,
       and it is shown small under each Cipher answer.
    3. DARK SCROLLBAR: the white scrollbar in the chat log is now dark and thin.
*/

import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import CyberShell from "@/components/layout/CyberShell";
import PageCompanion from "@/components/layout/PageCompanion";

import { TerminalHeader } from "@/components/ui/CyberInteractive";
import { API_BASE_URL } from "@/lib/api";

const API = API_BASE_URL;
const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

const MODULES = [
  { id: 1, name: "LockedOut", topic: "Passwords", color: "#34D399" },
  { id: 2, name: "Phished", topic: "Phishing", color: "#22D3EE" },
  { id: 3, name: "Manipulated", topic: "Social engineering", color: "#A855F7" },
  { id: 4, name: "OverShared", topic: "Safe AI use", color: "#FBBF24" },
] as const;

/* source is only set on Cipher replies (it comes from the backend) */
type Msg = { role: "user" | "cipher"; text: string; source?: string };

function seedMsgs(): Msg[] {
  return [{ role: "cipher", text: "Cipher online. Ask me anything about the realm you are training in." }];
}

export default function ChatPage() {
  const router = useRouter();
  const [moduleId, setModuleId] = useState<number>(1);
  const [messages, setMessages] = useState<Msg[]>(seedMsgs());
  const [input, setInput] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(function () {
    if (!localStorage.getItem("token")) router.push("/login");
  }, [router]);

  useEffect(function () {
    if (logRef.current) logRef.current.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, busy]);

  function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const token = localStorage.getItem("token");

    /* HISTORY: the last 6 earlier messages (skipping the greeting), in the format the backend expects.
       Built BEFORE the new question is added, because the backend adds the new question itself. */
    const history = messages.slice(1).slice(-6).map(function (m) {
      return { role: m.role === "user" ? "user" : "assistant", content: m.text };
    });

    setBusy(true);
    setError(null);
    setMessages(function (m) { return m.concat({ role: "user", text: text }); });
    setInput("");
    fetch(API + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ message: text, module: moduleId, history: history }),
    })
      .then(function (res) {
        if (!res.ok) {
          if (res.status === 401) { router.push("/login"); throw new Error("signed out"); }
          return res.json().catch(function () { return {}; }).then(function (data) {
            throw new Error(typeof data.detail === "string" ? data.detail : "Cipher did not answer. Try again.");
          });
        }
        return res.json();
      })
      .then(function (data) {
        setMessages(function (m) {
          return m.concat({ role: "cipher", text: String(data.reply || ""), source: data.source ? String(data.source) : undefined });
        });
      })
      .catch(function (err) {
        if (err && err.message !== "signed out") {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      })
      .finally(function () { setBusy(false); });
  }

  const active = MODULES.find(function (m) { return m.id === moduleId; }) || MODULES[0];

  return (
    <CyberShell variant="app" accent="cyan">
      <PageCompanion mood="calm" message="Cipher online. Ask me about your security realm." />
      <TerminalHeader title="ASK CIPHER" right={
        <a href="/map" className="rounded-full border border-cyan-300/40 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-cyan-100 hover:border-cyan-200" style={MONO}>MAP</a>
      } />

      <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-white/10 bg-[#0c0e22]/90 p-4 sm:p-6">
        <p className="text-[10px] font-bold tracking-[0.3em] text-cyan-300" style={MONO}>{"// LIVE AI MENTOR"}</p>
        <h1 className="mt-1 text-xl font-bold text-white">Ask Cipher</h1>
        <p className="mt-1 text-xs text-slate-400">
          Cipher teaches from one realm at a time, using the lesson rulebook and the standards behind it.
          Ask follow-up questions if you are curious. It cannot see your password, your codes, or anything outside the lesson.
        </p>

        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Choose a realm">
          {MODULES.map(function (m) {
            const on = moduleId === m.id;
            return (
              <button
                key={m.id}
                role="tab"
                aria-selected={on}
                onClick={function () { setModuleId(m.id); }}
                className="rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.15em] transition"
                style={{
                  ...MONO,
                  color: on ? "#0c0e22" : m.color,
                  background: on ? m.color : "transparent",
                  borderColor: m.color,
                }}
              >
                {m.name.toUpperCase()} &#183; {m.topic.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* the chat log. colorScheme "dark" + thin slate scrollbar replace the bright white default one */}
        <div
          ref={logRef}
          className="mt-4 h-72 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3"
          style={{ colorScheme: "dark", scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}
          aria-live="polite"
        >
          {messages.map(function (m, i) {
            const mine = m.role === "user";
            return (
              <div key={i} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div className="max-w-[85%]">
                  <p
                    className={
                      "whitespace-pre-wrap rounded-xl px-3 py-2 text-xs " +
                      (mine ? "bg-cyan-500/20 text-cyan-100" : "border text-slate-100")
                    }
                    style={!mine ? { borderColor: active.color + "55", background: active.color + "14" } : undefined}
                  >
                    {!mine && <span className="mr-1 font-bold" style={{ color: active.color }}>CIPHER</span>}
                    {m.text}
                  </p>
                  {/* which standard this answer is based on (only on real answers, not the greeting) */}
                  {!mine && m.source && (
                    <p className="mt-1 px-1 text-[9px] leading-snug text-slate-500" style={MONO}>SOURCE: {m.source}</p>
                  )}
                </div>
              </div>
            );
          })}
          {busy && <p className="text-[10px] tracking-[0.2em] text-slate-400" style={MONO}>CIPHER IS THINKING...</p>}
        </div>

        {error && (
          <p className="mt-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">
            {"! "}{error}
          </p>
        )}

        <form onSubmit={send} className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={function (e: ChangeEvent<HTMLInputElement>) { setInput(e.target.value); }}
            placeholder={"Ask about " + active.topic.toLowerCase() + "..."}
            maxLength={300}
            aria-label="Your question for Cipher"
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-cyan-500 disabled:cursor-wait disabled:opacity-60"
            style={MONO}
          >
            {busy ? "..." : "Ask"}
          </button>
        </form>
      </div>
    </CyberShell>
  );
}
