"use client"; // Next.js: this component runs in the browser (needed for interactive/animated UI)

import Link from "next/link"; // Next.js Link: navigates between pages without a full reload
import { useT } from "@/context/LanguageContext";

// Home = the landing page component. Next.js shows it at the "/" route.
export default function Home() {
  const t = useT();
  return (
    // ROOT WRAPPER
    // h-dvh            -> exactly the visible screen height (dvh = "dynamic viewport height",
    //                     it also behaves correctly on mobile when the browser bar shows/hides).
    //                     This is what stops the page from growing -> NO SCROLLING.
    // overflow-hidden  -> anything that sticks out is clipped instead of creating a scrollbar.
    // relative         -> lets the absolutely-positioned children (glow, waves) anchor to it.
    // flex flex-col    -> stacks children vertically: nav on top, main content below.
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#0d0618] font-sans text-white">
      {/* ===== BACKGROUND GLOW (purely decorative) ===== */}
      {/* absolute inset-0 = covers the whole page; pointer-events-none = clicks pass through it */}
      <div className="pointer-events-none absolute inset-0">
        {/* Purple blob, top-left. blur makes it a soft glow instead of a hard circle */}
        <div className="absolute start-[10%] top-[-10%] h-[60%] w-[60%] rounded-full bg-[#9333ea] opacity-30 blur-[120px]" />
        {/* Pink blob, bottom-right */}
        <div className="absolute bottom-[-15%] end-[5%] h-[55%] w-[55%] rounded-full bg-[#ec4899] opacity-25 blur-[130px]" />
      </div>

      {/* ===== WAVES (pinned to the bottom of the screen) ===== */}
      {/* absolute bottom-0 inset-x-0 = glued to the bottom edge, full width.
          Because it's absolute, it takes NO space in the layout, so it can never
          push the content down or cause scrolling.
          h-[16dvh]  = 16% of screen height, min-h-16 / max-h-40 keep it between 4rem and 10rem.
          z-0        = sits behind the main content (which is z-10). */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[16dvh] max-h-40 min-h-16 overflow-hidden leading-none">
        {/* CSS for the scrolling wave animation.
            The track is 200% wide and holds two identical waves side by side.
            Sliding it left by 50% (exactly one wave) and looping = seamless endless movement. */}
        <style>{`
          @keyframes wave-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .wave-track { animation: wave-scroll 14s linear infinite; width: 200%; display: flex; }
        `}</style>

        {/* Back wave (purple, moving). h-full = fills the wave container's height */}
        <div className="wave-track h-full">
          {/* Two copies of the same SVG so the loop has no gap.
              preserveAspectRatio="none" lets the wave stretch to any width/height. */}
          <svg viewBox="0 0 1440 150" className="h-full w-1/2" preserveAspectRatio="none">
            {/* "path d=..." draws the curve. fillOpacity makes it semi-transparent */}
            <path d="M0,80 C240,140 480,20 720,70 C960,120 1200,30 1440,80 L1440,150 L0,150 Z" fill="#9333ea" fillOpacity="0.35" />
          </svg>
          <svg viewBox="0 0 1440 150" className="h-full w-1/2" preserveAspectRatio="none">
            <path d="M0,80 C240,140 480,20 720,70 C960,120 1200,30 1440,80 L1440,150 L0,150 Z" fill="#9333ea" fillOpacity="0.35" />
          </svg>
        </div>

        {/* Front wave (pink, static). Sits on top of the purple one at the very bottom */}
        <svg viewBox="0 0 1440 150" className="absolute bottom-0 h-[80%] w-full" preserveAspectRatio="none">
          <path d="M0,100 C360,40 1080,160 1440,90 L1440,150 L0,150 Z" fill="#ec4899" fillOpacity="0.25" />
        </svg>
      </div>

      {/* ===== NAV BAR ===== */}
      {/* z-20 = above everything so the buttons are always clickable.
          shrink-0 = the nav never gets squished when the screen is short.
          flex-wrap + gap = on tiny screens the buttons wrap under the logo.
          px-/py- values grow at breakpoints (sm:, lg:) = more padding on bigger screens. */}
      <nav className="relative z-20 mx-auto flex w-full max-w-[90rem] shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-3 px-3 py-3 sm:px-6 sm:py-4 lg:px-10">
        {/* Logo: "CYBER" in a gradient + "GUARD" in white.
            clamp(min, preferred, max) = font size scales with screen width within limits */}
        <span className="shrink-0 whitespace-nowrap text-[clamp(1rem,5vw,1.875rem)] font-extrabold tracking-wide">
          {/* bg-clip-text + text-transparent = shows the gradient *through* the letters */}
          <span className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(236,72,153,0.5)]">
            CYBER
          </span>
          <span className="text-white/90">GUARD</span>
        </span>

        {/* Buttons container */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Privacy Link: subtle text link, goes to /privacy */}
          <Link
            href="/privacy"
            className="whitespace-nowrap text-xs font-medium text-white/70 transition-colors hover:text-fuchsia-300 sm:text-sm"
          >
            {t("home.privacy")}
          </Link>
          {/* Sign In: outlined button, goes to /login */}
          <Link
            href="/login"
            className="min-h-10 whitespace-nowrap rounded-full border border-fuchsia-400/40 px-2.5 py-2 text-xs font-semibold text-fuchsia-200 transition-all hover:bg-fuchsia-500/10 sm:min-h-11 sm:px-5 sm:py-2.5 sm:text-base lg:px-7"
          >
            {t("home.signIn")}
          </Link>
          {/* Play Now: filled gradient button, goes to /register.
              hover:scale-105 = grows slightly on hover, active:scale-95 = shrinks when pressed */}
          <Link
            href="/register"
            className="min-h-10 whitespace-nowrap rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-2.5 py-2 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/30 transition-all hover:scale-105 active:scale-95 sm:min-h-11 sm:px-5 sm:py-2.5 sm:text-base lg:px-7"
          >
            {t("home.playNow")}
          </Link>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      {/* flex-1  = takes ALL the space left under the nav.
          min-h-0 = lets it shrink instead of forcing the page taller (key for no-scroll).
          justify-center = vertically centers title + skeleton + quote.
          pb-[8dvh] = leaves room at the bottom so content doesn't touch the waves.
          z-10 = above the waves. */}
      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-[1.5dvh] px-4 pb-[8dvh] text-center sm:px-6">
        {/* Small tagline above the title */}
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300/80 sm:text-base sm:tracking-[0.3em] md:text-lg">
          {t("home.tagline")}
        </p>

        {/* Big title.
            Font size = the SMALLER of 9% of screen width or 9% of screen height (min 1.5rem, max 6rem),
            so on short screens the title shrinks instead of pushing everything down. */}
        <h1 className="max-w-full whitespace-nowrap text-[clamp(1.5rem,min(9vw,9dvh),6rem)] font-black leading-[1.05] tracking-[-0.04em]">
          <span className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            CYBERGUARD
          </span>
        </h1>

        {/* ===== SKELETON MASCOT (inline SVG drawing) =====
            viewBox="0 0 220 220" = the internal drawing canvas (220x220 units).
            Real on-screen size = the smallest of: 28% of screen height, 60% of width, or 24rem.
            Tying it to height is what keeps it from overflowing on short screens. */}
        <svg
          viewBox="0 0 220 220"
          className="max-w-full shrink-0"
          style={{ width: "min(28dvh, 60vw, 24rem)", height: "min(28dvh, 60vw, 24rem)" }}
        >
          {/* <defs> = reusable colors/gradients that shapes below reference by id */}
          <defs>
            {/* Bone color: white fading to light lavender (radial = from a center point) */}
            <radialGradient id="boneGrad" cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d8cce8" />
            </radialGradient>
            {/* Shield color: light pink to deep purple, diagonal (linear) */}
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0abfc" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
          </defs>

          {/* Animations for the mascot.
              wave-arm   : rotates the arm back and forth around its shoulder (transform-origin)
              bob-body   : moves the whole skeleton up/down 5px = "breathing" effect
              shield-glow: fades the shield's opacity in and out = pulsing glow */}
          <style>{`
            @keyframes wave-arm { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(30deg); } }
            .wave-arm { transform-origin: 148px 95px; animation: wave-arm 1.4s ease-in-out infinite; }
            @keyframes bob-body { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
            .bob-body { animation: bob-body 2.6s ease-in-out infinite; }
            @keyframes shield-glow { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
            .shield-glow { animation: shield-glow 2s ease-in-out infinite; }
          `}</style>

          {/* <g> = group. Everything inside moves together with the "bob" animation */}
          <g className="bob-body">
            {/* --- Shield arm (left side, doesn't move) --- */}
            {/* Path "M95,110 Q70,120 58,145" = start at (95,110), curve toward (58,145) */}
            <path d="M95,110 Q70,120 58,145" stroke="url(#boneGrad)" strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray="0" />
            {/* Shoulder joint + hand joint (circles) */}
            <circle cx="95" cy="110" r="6" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />
            <circle cx="58" cy="145" r="6" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />

            {/* --- Shield (pulses via .shield-glow) --- */}
            <g className="shield-glow">
              {/* Shield body filled with the purple gradient */}
              <path
                d="M40,120 L70,110 L100,120 L100,155 Q100,185 70,200 Q40,185 40,155 Z"
                fill="url(#shieldGrad)"
                stroke="#e9d5ff"
                strokeWidth="2.5"
              />
              {/* Thin dark outline on top for depth */}
              <path
                d="M40,120 L70,110 L100,120 L100,155 Q100,185 70,200 Q40,185 40,155 Z"
                fill="none"
                stroke="#1e0a2e"
                strokeWidth="1"
                opacity="0.35"
              />
              {/* Lock icon: body (rect), shackle (arc path), keyhole (circle) */}
              <rect x="60" y="148" width="20" height="16" rx="3" fill="#1e0a2e" />
              <path d="M64,148 v-6 a6,6 0 0 1 12,0 v6" stroke="#1e0a2e" strokeWidth="3.5" fill="none" />
              <circle cx="70" cy="156" r="2.3" fill="#f0abfc" />
            </g>

            {/* --- Spine, ribs, legs, hips --- */}
            {/* Spine: a rounded vertical rectangle */}
            <rect x="113" y="92" width="10" height="46" rx="4" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />
            {/* Ribs: three horizontal lines */}
            <path d="M100,100 H136 M98,112 H138 M100,124 H136" stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round" />
            {/* Legs: two curves going down from the hips */}
            <path d="M118,138 Q110,160 100,178 M118,138 Q126,160 136,178" stroke="url(#boneGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />
            {/* Hips: an ellipse */}
            <ellipse cx="118" cy="140" rx="16" ry="8" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />

            {/* --- Skull --- */}
            {/* Main skull shape */}
            <ellipse cx="118" cy="55" rx="30" ry="32" fill="url(#boneGrad)" stroke="#c084fc" strokeWidth="2.5" />
            {/* Jaw */}
            <path d="M98,72 Q118,90 138,72 Q138,84 118,88 Q98,84 98,72 Z" fill="url(#boneGrad)" stroke="#c084fc" strokeWidth="2" />
            {/* Eye sockets (dark ellipses) + tiny pink highlights */}
            <ellipse cx="106" cy="52" rx="8" ry="10" fill="#1e0a2e" />
            <ellipse cx="130" cy="52" rx="8" ry="10" fill="#1e0a2e" />
            <circle cx="104" cy="50" r="1.6" fill="#f0abfc" opacity="0.8" />
            <circle cx="128" cy="50" r="1.6" fill="#f0abfc" opacity="0.8" />
            {/* Nose cavity (small triangle) */}
            <path d="M114,62 L118,70 L122,62 Z" fill="#1e0a2e" />
            {/* Teeth: one horizontal line + vertical dividers */}
            <path d="M101,75 H135" stroke="#1e0a2e" strokeWidth="1.5" />
            <path d="M104,75 V82 M110,75 V82 M116,75 V82 M122,75 V82 M128,75 V82 M133,75 V82"
                  stroke="#1e0a2e" strokeWidth="1.5" />
            {/* Small cracks for texture */}
            <path d="M100,38 Q108,44 102,52" stroke="#b794d4" strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M140,40 Q134,48 138,54" stroke="#b794d4" strokeWidth="1" fill="none" opacity="0.6" />

            {/* Collarbones: a "V" shape under the skull */}
            <path d="M103,90 L118,98 L133,90" stroke="url(#boneGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />

            {/* --- Waving arm (right side, rotates via .wave-arm) --- */}
            <g className="wave-arm">
              {/* Upper arm + forearm */}
              <path d="M133,95 Q155,85 165,58" stroke="url(#boneGrad)" strokeWidth="9" fill="none" strokeLinecap="round" />
              {/* Shoulder and elbow joints */}
              <circle cx="133" cy="95" r="6" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />
              <circle cx="152" cy="74" r="5" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />
              {/* Hand: four finger bones fanning out from the wrist */}
              <g stroke="url(#boneGrad)" strokeWidth="4" strokeLinecap="round">
                <path d="M165,58 L160,42" />
                <path d="M165,58 L168,40" />
                <path d="M165,58 L176,44" />
                <path d="M165,58 L180,52" />
              </g>
              {/* Wrist joint */}
              <circle cx="165" cy="58" r="6" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />
            </g>
          </g>
        </svg>

        {/* Speech-bubble style quote under the mascot.
            &quot; = a literal " character (JSX needs this escape) */}
        <p className="max-w-[34rem] px-2 text-base font-medium leading-relaxed text-fuchsia-300/70 sm:text-lg md:text-xl">
          {t("home.quote")}
        </p>
      </main>
    </div>
  );
}
