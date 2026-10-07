"use client";
import { useEffect, useState, type ReactNode } from "react";

interface Props {
  speaker: string;
  text: string;
  children?: ReactNode; // extra UI under the text (buttons, evidence)
}

/* Types the text out letter by letter, like a game. */
export default function DialogueBox({ speaker, text, children }: Props) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id); // cleanup when the line changes
  }, [text]);

  return (
    <div aria-live="polite" className="relative w-full max-w-xl">
      {/* Name tag sticking out of the panel: makes it feel "spoken by her" */}
      <span className="absolute -top-3 start-5 rounded-full bg-maya-red px-4 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-lg">
        {speaker}
      </span>

      <div className="rounded-2xl border border-white/10 border-s-4 border-s-maya-red-light bg-panel/80 p-6 pt-8 shadow-2xl backdrop-blur-md">
        <p className="min-h-16 text-lg leading-relaxed text-text-primary">{shown}</p>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}
