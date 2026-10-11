import type { CSSProperties, ReactNode } from "react";

const ACCENTS = {
  cyan: "#4cc9ff",
  emerald: "#4ade80",
  brick: "#fb4b5b",
  amber: "#f6c453",
} as const;

export default function CyberShell({
  children,
  variant = "center",
  accent = "cyan",
}: {
  children: ReactNode;
  variant?: "center" | "app"; // center = Login / Register, app = Home / Dashboard
  accent?: keyof typeof ACCENTS;
}) {
  return (
    <div className="cg-page" style={{ "--c": ACCENTS[accent] } as CSSProperties}>
      <div className="cg-grid" aria-hidden="true" />
      <main
        className={
          variant === "center"
            ? "relative z-10 flex min-h-screen items-center justify-center p-6"
            : "relative z-10 mx-auto max-w-6xl px-5 py-8"
        }
      >
        {children}
      </main>
    </div>
  );
}
