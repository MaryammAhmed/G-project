import type { ReactNode } from "react";

/*
  STAGE: the "place" the character stands in.
  Layers, back to front:
    z-0   colored sky light
    z-0   glowing floor platform
    z-10  children (character + UI)
    z-30  foreground fog (in FRONT of the character = real depth)
*/
export default function Stage({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-dvh overflow-hidden">

      {/* Sky light: purple low, cyan high */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_30%_75%,rgba(139,92,246,0.30),transparent_60%),radial-gradient(ellipse_at_85%_10%,rgba(76,201,255,0.18),transparent_50%)]" />

      {/* FLOOR: a glowing ellipse + a ring, like a holographic platform */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[22vh] bg-[radial-gradient(ellipse_at_50%_100%,rgba(76,201,255,0.25),transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-[6vh] start-[8%] z-0 h-[9vh] w-[34vw] min-w-[260px] rounded-full border border-electric-blue/40 shadow-[0_0_40px_rgba(76,201,255,0.35)]" />

      {/* Content: character + dialogue */}
      <div className="relative z-10 h-full">{children}</div>

      {/* FOREGROUND FOG: sits IN FRONT, darkens the bottom edge */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-24 bg-gradient-to-t from-space to-transparent" />
    </div>
  );
}
