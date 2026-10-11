"use client";

/*
  components/game/DialogueBox.tsx
  ===============================
  The speaker's line: name tag, typewriter text, optional avatar and hint.
  Click the box to show the whole line at once.

  Accepts BOTH prop styles, so old and new callers work:
    text       | dialogueText    -> the line to type out
    speaker    | speakerName     -> the name tag (default "Maya")
    onDone     | onTypingDone    -> called once when the whole line is visible
  A missing or undefined text is treated as an empty line, so it never crashes.
*/

import { useEffect, useRef, useState } from "react";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export interface DialogueBoxProps {
  text?: string;
  speaker?: string;
  onDone?: () => void;
  /* aliases used by MissionPlayer / MissionEngine */
  dialogueText?: string;
  speakerName?: string;
  onTypingDone?: () => void;
  /* optional extras */
  avatarUrl?: string;
  hint?: string;
}

/* Types text out letter by letter. Array.from splits by whole characters,
   so emoji and Arabic text are never cut in half. */
function useTypewriter(fullText: string, speed = 16) {
  const [count, setCount] = useState(0);
  const chars = Array.from(fullText);

  useEffect(() => {
    setCount(0);
    const total = Array.from(fullText).length;
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= total) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => clearInterval(id); // cleanup when the line changes
  }, [fullText, speed]);

  return {
    shown: chars.slice(0, count).join(""),
    done: count >= chars.length,
    skip: () => setCount(chars.length),
  };
}

export default function DialogueBox({
  text,
  speaker,
  onDone,
  dialogueText,
  speakerName,
  onTypingDone,
  avatarUrl,
  hint,
}: DialogueBoxProps) {
  const fullText = text ?? dialogueText ?? "";
  const name = speaker ?? speakerName ?? "Maya";
  const callback = onDone ?? onTypingDone;

  const { shown, done, skip } = useTypewriter(fullText);
  const [showHint, setShowHint] = useState(false);

  /* Tell the parent when typing finishes. The ref always holds the latest
     callback, so the parent can pass an inline arrow function safely. */
  const doneRef = useRef(callback);
  useEffect(() => {
    doneRef.current = callback;
  }, [callback]);
  useEffect(() => {
    if (done) doneRef.current?.();
  }, [done]);

  return (
    <div
      aria-live="polite"
      onClick={skip} // click the bubble to show the whole line at once
      className="relative cursor-pointer rounded-2xl border border-white/10 border-s-4 bg-[#111329]/80 p-5 shadow-2xl backdrop-blur-md"
      style={{ borderInlineStartColor: "var(--c, #4cc9ff)" }}
    >
      <span
        className="absolute -top-3 start-5 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#070711]"
        style={{ background: "var(--c, #4cc9ff)", ...MONO }}
      >
        {name}
      </span>

      <div className="flex items-start gap-4">
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="h-14 w-14 shrink-0 rounded-full border border-white/20 object-cover"
          />
        )}

        <div className="min-w-0 flex-1">
          <p className="min-h-[3.5rem] pt-1 text-lg leading-relaxed text-[#f5f3ff]">
            {shown}
            {!done && (
              <span className="cursor ms-0.5 inline-block h-5 w-[2px] translate-y-1 bg-[var(--c,#4cc9ff)]" />
            )}
          </p>

          {hint && done && (
            <div className="mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // don't trigger the skip click
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
