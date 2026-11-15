"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip bg-[#0d0618] font-sans text-white">
      {/* Ambient purple/pink radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[10%] w-[60%] h-[60%] rounded-full bg-[#9333ea] opacity-30 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[5%] w-[55%] h-[55%] rounded-full bg-[#ec4899] opacity-25 blur-[130px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 mx-auto flex w-full max-w-[90rem] shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-3 px-3 py-4 sm:px-6 sm:py-5 lg:px-10 lg:py-6">
        <span className="shrink-0 whitespace-nowrap text-[clamp(1rem,5vw,1.875rem)] font-extrabold tracking-wide">
          <span className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(236,72,153,0.5)]">
            CYBER
          </span>
          <span className="text-white/90">GUARD</span>
        </span>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/login"
            className="min-h-10 whitespace-nowrap rounded-full border border-fuchsia-400/40 px-2.5 py-2 text-xs font-semibold text-fuchsia-200 transition-all hover:bg-fuchsia-500/10 sm:min-h-11 sm:px-5 sm:py-2.5 sm:text-base lg:px-7"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="min-h-10 whitespace-nowrap rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-2.5 py-2 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/30 transition-all hover:scale-105 active:scale-95 sm:min-h-11 sm:px-5 sm:py-2.5 sm:text-base lg:px-7"
          >
            Play Now
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-1 px-4 py-8 text-center sm:px-6 sm:py-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300/80 sm:mb-4 sm:text-base sm:tracking-[0.3em] md:text-lg">
          Enter the World of
        </p>

        <h1 className="mb-4 max-w-full whitespace-nowrap text-[clamp(1.875rem,9vw,6rem)] font-black leading-[1.05] tracking-[-0.04em] sm:mb-5">
          <span className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            CYBERGUARD
          </span>
        </h1>

        {/* Skeleton mascot: shield in one hand, waving with the other.
            Size follows the screen height so it grows on big screens
            but never pushes the page into scrolling. */}
        <svg
          viewBox="0 0 220 220"
          className="mb-2 max-w-full"
          style={{ width: "min(30dvh, 70vw, 24rem)", height: "min(30dvh, 70vw, 24rem)" }}
        >
          <defs>
            <radialGradient id="boneGrad" cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d8cce8" />
            </radialGradient>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0abfc" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
          </defs>

          <style>{`
            @keyframes wave-arm { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(30deg); } }
            .wave-arm { transform-origin: 148px 95px; animation: wave-arm 1.4s ease-in-out infinite; }
            @keyframes bob-body { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
            .bob-body { animation: bob-body 2.6s ease-in-out infinite; }
            @keyframes shield-glow { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
            .shield-glow { animation: shield-glow 2s ease-in-out infinite; }
          `}</style>

          <g className="bob-body">
            {/* Shield arm (left, static) */}
            <path d="M95,110 Q70,120 58,145" stroke="url(#boneGrad)" strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray="0" />
            <circle cx="95" cy="110" r="6" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />
            <circle cx="58" cy="145" r="6" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />

            {/* Shield: cyber guard themed */}
            <g className="shield-glow">
              <path
                d="M40,120 L70,110 L100,120 L100,155 Q100,185 70,200 Q40,185 40,155 Z"
                fill="url(#shieldGrad)"
                stroke="#e9d5ff"
                strokeWidth="2.5"
              />
              <path
                d="M40,120 L70,110 L100,120 L100,155 Q100,185 70,200 Q40,185 40,155 Z"
                fill="none"
                stroke="#1e0a2e"
                strokeWidth="1"
                opacity="0.35"
              />
              {/* lock icon on shield */}
              <rect x="60" y="148" width="20" height="16" rx="3" fill="#1e0a2e" />
              <path d="M64,148 v-6 a6,6 0 0 1 12,0 v6" stroke="#1e0a2e" strokeWidth="3.5" fill="none" />
              <circle cx="70" cy="156" r="2.3" fill="#f0abfc" />
            </g>

            {/* Ribcage / spine */}
            <rect x="113" y="92" width="10" height="46" rx="4" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />
            <path d="M100,100 H136 M98,112 H138 M100,124 H136" stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M118,138 Q110,160 100,178 M118,138 Q126,160 136,178" stroke="url(#boneGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />
            {/* hips */}
            <ellipse cx="118" cy="140" rx="16" ry="8" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />

            {/* Skull */}
            <ellipse cx="118" cy="55" rx="30" ry="32" fill="url(#boneGrad)" stroke="#c084fc" strokeWidth="2.5" />
            {/* jaw */}
            <path d="M98,72 Q118,90 138,72 Q138,84 118,88 Q98,84 98,72 Z" fill="url(#boneGrad)" stroke="#c084fc" strokeWidth="2" />
            {/* eye sockets */}
            <ellipse cx="106" cy="52" rx="8" ry="10" fill="#1e0a2e" />
            <ellipse cx="130" cy="52" rx="8" ry="10" fill="#1e0a2e" />
            <circle cx="104" cy="50" r="1.6" fill="#f0abfc" opacity="0.8" />
            <circle cx="128" cy="50" r="1.6" fill="#f0abfc" opacity="0.8" />
            {/* nasal cavity */}
            <path d="M114,62 L118,70 L122,62 Z" fill="#1e0a2e" />
            {/* teeth */}
            <path d="M101,75 H135" stroke="#1e0a2e" strokeWidth="1.5" />
            <path d="M104,75 V82 M110,75 V82 M116,75 V82 M122,75 V82 M128,75 V82 M133,75 V82"
                  stroke="#1e0a2e" strokeWidth="1.5" />
            {/* cranial cracks for texture */}
            <path d="M100,38 Q108,44 102,52" stroke="#b794d4" strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M140,40 Q134,48 138,54" stroke="#b794d4" strokeWidth="1" fill="none" opacity="0.6" />

            {/* Collarbones */}
            <path d="M103,90 L118,98 L133,90" stroke="url(#boneGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />

            {/* Waving arm (right, animated) */}
            <g className="wave-arm">
              <path d="M133,95 Q155,85 165,58" stroke="url(#boneGrad)" strokeWidth="9" fill="none" strokeLinecap="round" />
              <circle cx="133" cy="95" r="6" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />
              <circle cx="152" cy="74" r="5" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />
              {/* waving hand: splayed finger bones */}
              <g stroke="url(#boneGrad)" strokeWidth="4" strokeLinecap="round">
                <path d="M165,58 L160,42" />
                <path d="M165,58 L168,40" />
                <path d="M165,58 L176,44" />
                <path d="M165,58 L180,52" />
              </g>
              <circle cx="165" cy="58" r="6" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />
            </g>
          </g>
        </svg>

        <p className="max-w-[34rem] px-2 text-base font-medium leading-relaxed text-fuchsia-300/70 sm:text-lg md:text-xl">
          &quot;Hey there, ready to level up your security skills?&quot;
        </p>
      </main>

      <div className="pointer-events-none relative mt-auto h-20 w-full overflow-hidden leading-none sm:h-28 md:h-40">
        <style>{`
          @keyframes wave-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .wave-track { animation: wave-scroll 14s linear infinite; width: 200%; display: flex; }
        `}</style>
        <div className="wave-track">
          <svg viewBox="0 0 1440 150" className="h-20 w-1/2 sm:h-28 md:h-40" preserveAspectRatio="none">
            <path d="M0,80 C240,140 480,20 720,70 C960,120 1200,30 1440,80 L1440,150 L0,150 Z" fill="#9333ea" fillOpacity="0.35" />
          </svg>
          <svg viewBox="0 0 1440 150" className="h-20 w-1/2 sm:h-28 md:h-40" preserveAspectRatio="none">
            <path d="M0,80 C240,140 480,20 720,70 C960,120 1200,30 1440,80 L1440,150 L0,150 Z" fill="#9333ea" fillOpacity="0.35" />
          </svg>
        </div>
        <svg viewBox="0 0 1440 150" className="absolute bottom-0 h-16 w-full sm:h-24 md:h-36" preserveAspectRatio="none">
          <path d="M0,100 C360,40 1080,160 1440,90 L1440,150 L0,150 Z" fill="#ec4899" fillOpacity="0.25" />
        </svg>
      </div>
    </div>
  );
}
