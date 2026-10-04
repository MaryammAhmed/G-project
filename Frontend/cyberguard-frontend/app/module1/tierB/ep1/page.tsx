// app/module1/tierB/ep1/page.tsx
//
// THE page component for Episode 1. Pure content (episodeVariants) lives
// in data/scenarios/module1-tierB-ep1.ts — this file is only UI + logic.

"use client";
import { useState, useRef, useEffect } from "react";
import TierGate from "@/components/TierGate";
import { AGENT_TIERS } from "@/config/characters";
import { useAuth } from "@/context/AuthContext";
import {
  episodeVariants,
  Beat,
  EpisodeChoice,
  CompareOption,
} from "@/data/scenarios/module1-tierB-ep1";
import { speak, stopSpeaking } from "@/lib/speech";
import CharacterMascot, { Mood } from "@/components/CharacterMascot"; // FIXED — import stays with the other imports, nothing else goes here

// Reveals mentor text one character at a time instead of all at once.
function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text]);
  return displayed;
}

type ChatMessage =
  | { type: "text"; id: string; from: "mentor" | "user"; text: string }
  | { type: "loading"; id: string }
  | { type: "choice-beat"; id: string; beat: Extract<Beat, { type: "choice" }> }
  | { type: "compare-beat"; id: string; beat: Extract<Beat, { type: "compare" }> }
  | { type: "task-beat"; id: string; beat: Extract<Beat, { type: "task" }> }
  | { type: "info-beat"; id: string; beat: Extract<Beat, { type: "info" }> }
  | { type: "otp-sent"; id: string }
  | { type: "complete"; id: string };

function Episode1Inner() {
  const [variant] = useState(() => episodeVariants[Math.floor(Math.random() * episodeVariants.length)]);
  const zain = AGENT_TIERS.TIER_B;
  const { email } = useAuth();

  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  function maybeSpeak(text: string) { if (!mutedRef.current) speak(text); }
  function toggleMute() { setMuted((m) => !m); stopSpeaking(); }

  // FIXED — mood state belongs HERE, inside the component, alongside
  // your other useState calls. "idle" is the correct starting mood,
  // not "thinking" — thinking only applies while waiting on the AI.
  const [mood, setMood] = useState<Mood>("idle");

  const hasSpokenIncident = useRef(false);
  const spokenBeatIds = useRef<Set<string>>(new Set());
  const sentOtpForBeat = useRef<Set<string>>(new Set());

  const [beatIndex, setBeatIndex] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const totalBeats = variant.beats.length;
  const progressPercent = Math.min((beatIndex / totalBeats) * 100, 100);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { type: "text", id: "incident", from: "mentor", text: variant.incident },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (hasSpokenIncident.current) return;
    hasSpokenIncident.current = true;
    maybeSpeak(variant.incident);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const beat = variant.beats[beatIndex];

    setMessages((prev) => {
      const alreadyAdded = prev.some((m) => m.id === (beat?.id ?? "complete"));
      if (alreadyAdded) return prev;
      if (!beat) return [...prev, { type: "complete", id: "complete" }];
      if (beat.type === "choice") return [...prev, { type: "choice-beat", id: beat.id, beat }];
      if (beat.type === "compare") return [...prev, { type: "compare-beat", id: beat.id, beat }];
      if (beat.type === "info") return [...prev, { type: "info-beat", id: beat.id, beat }];
      return [...prev, { type: "task-beat", id: beat.id, beat }];
    });

    if (beat && !spokenBeatIds.current.has(beat.id)) {
      if (beat.type === "info") {
        spokenBeatIds.current.add(beat.id);
        maybeSpeak(beat.text);
      } else if (beat.type === "compare") {
        spokenBeatIds.current.add(beat.id);
        maybeSpeak(beat.prompt);
      } else if (beat.type === "task" && beat.kind === "phrase-builder") {
        spokenBeatIds.current.add(beat.id);
        maybeSpeak(beat.prompt);
      }
    }

    if (beat?.type === "task" && beat.kind === "code" && !sentOtpForBeat.current.has(beat.id)) {
      sentOtpForBeat.current.add(beat.id);
      if (!email) { console.error("No email in AuthContext — cannot send practice OTP."); return; }
      maybeSpeak("A verification code has been sent to your email. Check your inbox.");
      fetch("http://127.0.0.1:8000/api/practice-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
        .then((res) => {
          if (!res.ok) console.error("practice-otp/send failed:", res.status);
          setMessages((prev) => [...prev, { type: "otp-sent", id: `otp-sent-${beat.id}` }]);
        })
        .catch((err) => console.error("practice-otp/send network error:", err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  async function getFeedbackAndAdvance(beatId: string, choiceText: string, correct: boolean) {
    setAnsweredIds((prev) => new Set(prev).add(beatId));
    setMessages((prev) => [...prev, { type: "text", id: `pick-${beatId}`, from: "user", text: choiceText }]);
    setMessages((prev) => [...prev, { type: "loading", id: `loading-${beatId}` }]);
    setMood("thinking"); // FIXED — belongs here, right after showing the loading bubble

    try {
      const res = await fetch("http://127.0.0.1:8000/api/scenario-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "B", module: 1, incident: variant.incident, choice_text: choiceText, correct }),
      });

      if (!res.ok) {
        const bodyText = await res.text();
        console.error(`scenario-feedback failed: ${res.status}`, bodyText);
        replaceLoading(beatId, `(Feedback request failed — server said ${res.status}.)`);
      } else {
        const data = await res.json();
        if (!data.feedback || data.feedback.trim().length === 0) {
          console.error("scenario-feedback returned empty content. Full response:", data);
          replaceLoading(beatId, "(The mentor's response came back empty — moving on.)");
        } else {
          replaceLoading(beatId, data.feedback);
          maybeSpeak(data.feedback);
        }
      }
    } catch (err) {
      console.error("scenario-feedback network error:", err);
      replaceLoading(beatId, "Could not reach the mentor — is uvicorn running?");
    }

    setMood(correct ? "happy" : "concerned"); // FIXED — belongs here, "correct" is a real parameter in this scope
    setBeatIndex((i) => i + 1);
  }

  function replaceLoading(beatId: string, text: string) {
    setMessages((prev) =>
      prev.map((m) => (m.type === "loading" && m.id === `loading-${beatId}` ? { type: "text", id: `fb-${beatId}`, from: "mentor", text } : m))
    );
  }

  function handleChoicePick(beatId: string, choice: EpisodeChoice) {
    if (answeredIds.has(beatId)) return;
    document.getElementById(`choice-${choice.id}`)?.classList.add(
      choice.correct ? "flash-correct" : "flash-incorrect"
    );
    getFeedbackAndAdvance(beatId, choice.text, choice.correct);
  }

  function handleComparePick(beatId: string, picked: CompareOption) {
    if (answeredIds.has(beatId)) return;
    const correct = picked.isWeaker;
    const choiceText = `Picked "${picked.label}" as the one that cracks first. ${picked.reason}`;
    getFeedbackAndAdvance(beatId, choiceText, correct);
  }

  function handleInfoContinue(beatId: string) {
    if (answeredIds.has(beatId)) return;
    setAnsweredIds((prev) => new Set(prev).add(beatId));
    setBeatIndex((i) => i + 1);
  }

  function handlePhraseBuilderResult(beatId: string, label: string, passed: boolean) {
    if (answeredIds.has(beatId)) return;
    getFeedbackAndAdvance(beatId, label, passed);
  }

  async function handleCodeSubmit(beatId: string, value: string) {
    if (answeredIds.has(beatId) || !email) {
      if (!email) console.error("No email available — cannot verify practice OTP.");
      return;
    }
    setAnsweredIds((prev) => new Set(prev).add(beatId));
    setMessages((prev) => [...prev, { type: "text", id: `pick-${beatId}`, from: "user", text: `Entered code: ${value}` }]);
    setMessages((prev) => [...prev, { type: "loading", id: `loading-${beatId}` }]);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/practice-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: value }),
      });
      const data = res.ok ? await res.json() : null;
      const correct = !!data?.correct;
      const msg = correct
        ? "Code verified! Zain's second authentication factor is now confirmed."
        : data
        ? "That code isn't correct. Check your email and try again."
        : `Verification failed (server said ${res.status}).`;
      replaceLoading(beatId, msg);
      maybeSpeak(msg);

      if (!correct) {
        setAnsweredIds((prev) => { const next = new Set(prev); next.delete(beatId); return next; });
        return;
      }
    } catch (err) {
      console.error("practice-otp/verify network error:", err);
      replaceLoading(beatId, "Could not reach the server to verify the code.");
      setAnsweredIds((prev) => { const next = new Set(prev); next.delete(beatId); return next; });
      return;
    }

    setBeatIndex((i) => i + 1);
  }

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <div className="border-b border-cyan/20 px-6 py-4 font-mono flex items-center justify-between">
        {/* FIXED — mascot + title wrapped together, mood passed in from state */}
        <div className="flex items-center gap-3">
          <CharacterMascot mood={mood} />
          <p className="text-xs text-cyan uppercase tracking-widest">{zain.title} — {zain.stage}</p>
        </div>
        <button onClick={toggleMute} className="text-xs text-cyan">{muted ? "🔇 unmute" : "🔊 mute"}</button>
      </div>

      <div className="h-1 bg-slate-800">
        <div className="h-full bg-cyan transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            msg={msg}
            answered={answeredIds.has(msg.id)}
            onChoicePick={handleChoicePick}
            onComparePick={handleComparePick}
            onInfoContinue={handleInfoContinue}
            onPhraseBuilderResult={handlePhraseBuilderResult}
            onCodeSubmit={handleCodeSubmit}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default function Episode1() {
  return (
    <TierGate requiredTier="B">
      <Episode1Inner />
    </TierGate>
  );
}

function ChatBubble({
  msg, answered, onChoicePick, onComparePick, onInfoContinue, onPhraseBuilderResult, onCodeSubmit,
}: {
  msg: ChatMessage;
  answered: boolean;
  onChoicePick: (beatId: string, choice: EpisodeChoice) => void;
  onComparePick: (beatId: string, picked: CompareOption) => void;
  onInfoContinue: (beatId: string) => void;
  onPhraseBuilderResult: (beatId: string, label: string, passed: boolean) => void;
  onCodeSubmit: (beatId: string, value: string) => void;
}) {
  if (msg.type === "text") {
    const isUser = msg.from === "user";
    const displayed = isUser ? msg.text : useTypewriter(msg.text);
    return (
      <div className={`max-w-[80%] rounded-lg p-3 text-sm font-mono animate-[slideIn_0.3s_ease-out] ${isUser ? "ml-auto bg-cyan/10 border border-cyan/40 text-cyan" : "bg-panel border border-slate-700 text-slate-200"}`}>
        {displayed}
      </div>
    );
  }

  if (msg.type === "loading") {
    return (
      <div className="bg-panel border border-slate-700 rounded-lg p-3 max-w-[80%] animate-pulse">
        <div className="h-3 bg-slate-700 rounded w-5/6 mb-2" />
        <div className="h-3 bg-slate-700 rounded w-2/3" />
      </div>
    );
  }

  if (msg.type === "info-beat") {
    return (
      <div className="bg-panel border border-violet/30 rounded-lg p-4 font-mono">
        <p className="text-sm text-slate-200 leading-relaxed mb-3">{msg.beat.text}</p>
        <button disabled={answered} onClick={() => onInfoContinue(msg.beat.id)}
          className="bg-violet/20 border border-violet/50 text-violet text-xs px-4 py-2 rounded disabled:opacity-40">
          continue →
        </button>
      </div>
    );
  }

  if (msg.type === "otp-sent") {
    return (
      <div className="max-w-[85%] bg-panel border border-term-green/40 rounded-lg p-4 font-mono">
        <div className="flex items-center gap-2 text-term-green text-xs mb-2">
          <span>📧</span><span>scholarship portal — security alert</span>
        </div>
        <p className="text-sm text-slate-200">A verification code was just sent to your email.</p>
        <p className="text-xs text-slate-500 mt-1">Check your inbox (and spam folder) — it expires in 10 minutes.</p>
      </div>
    );
  }

  if (msg.type === "choice-beat") {
    return (
      <div className="space-y-2">
        {msg.beat.options.map((choice) => (
          <button
            key={choice.id}
            id={`choice-${choice.id}`}
            disabled={answered}
            onClick={() => onChoicePick(msg.beat.id, choice)}
            className="w-full text-left bg-void border border-cyan/30 rounded px-4 py-3 text-sm text-slate-200 hover:border-cyan transition-colors disabled:opacity-40"
          >
            {choice.text}
          </button>
        ))}
      </div>
    );
  }

  if (msg.type === "compare-beat") {
    return (
      <div className="space-y-3">
        <p className="text-xs text-violet font-mono">{msg.beat.prompt}</p>
        <div className="grid grid-cols-1 gap-2">
          {msg.beat.options.map((opt) => (
            <button
              key={opt.id}
              disabled={answered}
              onClick={() => onComparePick(msg.beat.id, opt)}
              className="font-mono text-sm text-left bg-void border border-violet/30 rounded px-4 py-3 text-slate-200 hover:border-violet transition-colors disabled:opacity-40"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (msg.type === "task-beat") {
    if (msg.beat.kind === "phrase-builder") {
      return <PhraseBuilderTask beat={msg.beat} disabled={answered} onResult={onPhraseBuilderResult} />;
    }
    return <CodeTaskInput beat={msg.beat} disabled={answered} onSubmit={onCodeSubmit} />;
  }

  if (msg.type === "complete") {
    return (
      <div className="bg-panel border border-term-green/30 rounded-lg p-4 font-mono text-center">
        <p className="text-sm text-term-green">Episode complete — Zain's account is secure.</p>
      </div>
    );
  }
  return null;
}

function PhraseBuilderTask({
  beat, disabled, onResult,
}: {
  beat: Extract<Beat, { type: "task"; kind: "phrase-builder" }>;
  disabled: boolean;
  onResult: (beatId: string, label: string, passed: boolean) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sentence, setSentence] = useState("");
  const [initials, setInitials] = useState("");
  const [finalPass, setFinalPass] = useState("");

  const sentenceValid = sentence.trim().split(/\s+/).length >= 3;
  const expectedInitials = sentence.trim().split(/\s+/).map((w) => w[0] ?? "").join("").toLowerCase();
  const initialsValid = initials.length >= 3 && initials.toLowerCase() === expectedInitials;

  const hasDigit = /\d/.test(finalPass);
  const hasSymbol = /[^a-zA-Z0-9]/.test(finalPass);
  const containsInitials = initials.length > 0 && finalPass.toLowerCase().includes(initials.toLowerCase());
  const finalValid = finalPass.length >= 12 && hasDigit && hasSymbol && containsInitials;

  function handleFinalSubmit() {
    const label = finalValid
      ? `Built passphrase from "${sentence}" → ${finalPass.length} characters.`
      : `Passphrase didn't meet all 4 rules (length / digit / symbol / traceable to initials).`;
    onResult(beat.id, label, finalValid);
  }

  return (
    <div className="bg-panel border border-cyan/30 rounded-lg p-4 font-mono space-y-3">
      {step === 1 && (
        <>
          <p className="text-xs text-cyan">{beat.prompt}</p>
          <input
            value={sentence}
            disabled={disabled}
            onChange={(e) => setSentence(e.target.value)}
            className="w-full bg-void border border-cyan/50 rounded px-3 py-2 text-cyan text-sm outline-none disabled:opacity-40"
            placeholder="type your sentence..."
            autoFocus
          />
          <button disabled={disabled || !sentenceValid} onClick={() => setStep(2)}
            className="bg-cyan text-void text-sm px-4 py-2 rounded disabled:opacity-30">
            next →
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <p className="text-xs text-cyan">Now take the first letter of each word:</p>
          <p className="text-xs text-slate-500">your sentence: "{sentence}"</p>
          <input
            value={initials}
            disabled={disabled}
            onChange={(e) => setInitials(e.target.value)}
            className="w-full bg-void border border-cyan/50 rounded px-3 py-2 text-cyan text-sm outline-none disabled:opacity-40"
            placeholder="e.g. iat"
          />
          {!initialsValid && initials.length > 0 && (
            <p className="text-xs text-alert">Doesn't match your sentence's initials yet.</p>
          )}
          <button disabled={disabled || !initialsValid} onClick={() => setStep(3)}
            className="bg-cyan text-void text-sm px-4 py-2 rounded disabled:opacity-30">
            next →
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <p className="text-xs text-cyan">
            Now build your final passphrase — add a number, a symbol, and make it 12+ characters:
          </p>
          <input
            value={finalPass}
            disabled={disabled}
            onChange={(e) => setFinalPass(e.target.value)}
            className="w-full bg-void border border-cyan/50 rounded px-3 py-2 text-cyan text-sm outline-none disabled:opacity-40"
            placeholder="e.g. Iat3tacos@midnight"
          />
          <ul className="text-xs space-y-1">
            <li className={finalPass.length >= 12 ? "text-term-green" : "text-slate-500"}>✓ 12+ characters</li>
            <li className={hasDigit ? "text-term-green" : "text-slate-500"}>✓ contains a number</li>
            <li className={hasSymbol ? "text-term-green" : "text-slate-500"}>✓ contains a symbol</li>
            <li className={containsInitials ? "text-term-green" : "text-slate-500"}>✓ built from your initials</li>
          </ul>
          <button disabled={disabled || !finalValid} onClick={handleFinalSubmit}
            className="w-full bg-cyan text-void text-sm py-2.5 rounded disabled:opacity-30">
            lock in passphrase →
          </button>
        </>
      )}
    </div>
  );
}

function CodeTaskInput({
  beat, disabled, onSubmit,
}: {
  beat: Extract<Beat, { type: "task"; kind: "code" }>;
  disabled: boolean;
  onSubmit: (beatId: string, value: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="bg-panel border border-cyan/30 rounded-lg p-4 font-mono">
      <p className="text-xs text-cyan mb-3">{beat.prompt}</p>
      <div className="flex gap-2">
        <input
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          maxLength={6}
          className="flex-1 bg-void border border-cyan/50 rounded px-3 py-2 text-cyan text-sm outline-none disabled:opacity-40 text-center tracking-widest"
          placeholder="______"
        />
        <button disabled={disabled || value.length === 0} onClick={() => onSubmit(beat.id, value)}
          className="bg-cyan text-void font-medium text-sm px-4 rounded disabled:opacity-30">
          verify
        </button>
      </div>
    </div>
  );
}
