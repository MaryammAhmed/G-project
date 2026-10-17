"use client";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export default function LearnPanel({
  title,
  points,
  onNext,
}: {
  title: string;
  points: string[];
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--c)]/40 bg-[#181a38]/80 p-5">
        <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--c)]" style={MONO}>
          {title}
        </h3>
        <ul className="mt-4 space-y-3">
          {points.map((p, i) => (
            <li
              key={i}
              className="rise-in flex gap-3 text-[#f5f3ff]"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="text-[var(--c)]">&#9670;</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={onNext}
        className="rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95"
        style={{ background: "var(--c)" }}
      >
        Continue
      </button>
    </div>
  );
}
