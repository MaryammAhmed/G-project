"use client";

/*
  components/game/DialogueBox.tsx
  ===============================
  Shows what the speaker is saying: an optional name tag, typewriter text,
  and an optional "need a hint?" toggle.

  The companion (skeleton) is NO LONGER drawn inside this box. MissionPlayer
  places it beside the box instead, which keeps this component small and
  stops the avatar from overlapping the text.
*/

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* ---------- PROPS ---------- */
// Props. Two naming styles are accepted (text/speaker/onDone and dialogueText/speakerName/onTypingDone) so older call sites keep working.
export interface DialogueBoxProps {
  // Two naming styles are accepted so older call sites keep working.
  text?: string;
  speaker?: string;
  onDone?: () => void;
  dialogueText?: string;
  speakerName?: string;
  onTypingDone?: () => void;

  avatarUrl?: string;       // Optional image avatar (shown inside the box)
  customAvatar?: ReactNode; // Optional custom avatar. Not used by MissionPlayer anymore
  hint?: string;            // Optional hint, revealed by a button after typing finishes
}

/* ---------- TYPEWRITER HOOK ---------- */
// Reveals the text one character at a time.
// Returns the visible text, whether typing has finished, and a skip() helper.
// Custom hook: reveals the text one character at a time. Returns what is visible now, whether typing finished, and skip().
function useTypewriter(fullText: string, speed = 16) {
  // How many characters are visible right now.
  const [count, setCount] = useState(0);
  // Array.from splits by real characters, so emoji don't get cut in half
  // Array.from splits by real characters, so an emoji is never cut in half.
  const chars = Array.from(fullText);

  useEffect(() => {
    // Restart from 0 whenever the text changes (done in a timeout so React does not warn about setState inside an effect).
    const restart = setTimeout(() => setCount(0));
    const total = Array.from(fullText).length;
    // Every `speed` ms show one more character; stop the timer when everything is visible.
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= total) {
          clearInterval(id); // stop the timer once everything is shown
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => {
      clearTimeout(restart);
      clearInterval(id);
    }; // cleanup if the text changes or component unmounts
  }, [fullText, speed]);

  return {
    shown: chars.slice(0, count).join(""),
    done: count >= chars.length,
    skip: () => setCount(chars.length), // click the box to show all text instantly
  };
}

/* ---------- COMPONENT ---------- */
// DialogueBox: name tag + typewriter text + optional hint button. Clicking the box skips the typing.
export default function DialogueBox({
  text,
  speaker,
  onDone,
  dialogueText,
  speakerName,
  onTypingDone,
  avatarUrl,
  customAvatar,
  hint,
}: DialogueBoxProps) {
  // Pick whichever naming style the parent used
  // Use whichever naming style the parent used.
  const fullText = text ?? dialogueText ?? "";
  const name = speaker ?? speakerName ?? "";
  const callback = onDone ?? onTypingDone;

  // shown = visible text, done = typing finished, skip = show everything now.
  const { shown, done, skip } = useTypewriter(fullText);
  const [showHint, setShowHint] = useState(false);

  // Keep the latest callback in a ref so the effect below doesn't re-fire
  // just because the parent re-rendered with a new function.
  // Keep the newest callback in a ref so the effect below does not re-run just because the parent re-rendered.
  const doneRef = useRef(callback);
  useEffect(() => {
    doneRef.current = callback;
  }, [callback]);

  // Tell the parent when typing finishes (MissionPlayer uses this to reveal the buttons)
  useEffect(() => {
    // When typing finishes, tell the parent (MissionPlayer then reveals the choice buttons).
    if (done) doneRef.current?.();
  }, [done]);

  return (
    <div
      aria-live="polite"
      onClick={skip}
      // Compact box: p-4 padding and a smaller min height than before
      className="relative min-h-[96px] cursor-pointer rounded-2xl border border-white/10 border-s-4 bg-[#111329]/80 p-4 shadow-2xl backdrop-blur-md"
      style={{ borderInlineStartColor: "var(--c, #4cc9ff)" }}
    >
      {/* Optional name tag sitting on the top edge of the box */}
      {name && (
        <span
          className="absolute -top-3 start-5 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#070711]"
          style={{ background: "var(--c, #4cc9ff)", ...MONO }}
        >
          {name}
        </span>
      )}

      <div className="flex items-start gap-3">
        {/* Optional avatars. Only drawn if a parent explicitly passes one */}
        {customAvatar && <div className="shrink-0">{customAvatar}</div>}
        {!customAvatar && avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="h-12 w-12 shrink-0 rounded-full border border-white/20 object-cover"
          />
        )}

        <div className="min-w-0 flex-1">
          {/* The typewriter text (text-base instead of text-lg to make the box smaller) */}
          <p className="min-h-[2.5rem] text-base leading-relaxed text-[#f5f3ff]">
            {shown}
            {/* Blinking cursor while typing */}
            {!done && (
              <span className="cursor ms-0.5 inline-block h-4 w-[2px] translate-y-1 bg-[var(--c,#4cc9ff)]" />
            )}
          </p>

          {/* Hint toggle: only appears after typing finishes */}
          {hint && done && (
            <div className="mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // don't trigger the box's skip() click
                  setShowHint((h) => !h);
                }}
                className="text-xs text-[#b8b5c9] underline-offset-4 hover:underline"
                style={MONO}
              >
                {showHint ? "hide hint" : "need a hint?"}
              </button>
              {showHint && <p className="rise-in mt-2 text-sm text-[#f6c453]">{hint}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
