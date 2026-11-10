"use client";

/*
  Shown before every hands-on task. One finished example, then the player's turn.
  The task itself does not render until "Your turn" is clicked.
*/

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export interface Brief {
  title: string;
  doing: string;
  example: string;
  marked: string;
  why: string;
}

export default function TaskBrief({ brief, onStart }: { brief: Brief; onStart: () => void }) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/15 bg-[#12141f] p-5">
      <p className="text-[10px] font-bold tracking-[0.25em] text-[#c4c1d4]" style={MONO}>
        BEFORE YOU START
      </p>
      <h3 className="text-lg font-bold text-[#f5f3ff]">{brief.title}</h3>
      <p className="text-sm leading-relaxed text-[#d9d6e8]">{brief.doing}</p>
      <div className="rounded-xl border border-white/10 bg-[#0c0e18] p-4">
        <p className="text-[10px] tracking-[0.2em] text-[#9a97ad]" style={MONO}>EXAMPLE, ALREADY DONE</p>
        <p className="mt-2 text-sm text-[#f5f3ff]">{brief.example}</p>
        <p className="mt-3 text-sm font-semibold" style={{ color: "var(--c)" }}>{brief.marked}</p>
        <p className="mt-1 text-sm text-[#d9d6e8]">{brief.why}</p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="rounded-xl px-6 py-3 text-sm font-semibold text-[#070711]"
        style={{ background: "var(--c, #67e8f9)" }}
      >
        Your turn
      </button>
    </section>
  );
}
