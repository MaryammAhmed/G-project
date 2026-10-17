"use client";

import type { Mood } from "@/lib/mission/types";

// We take the exact SVG you provided and map the mood to the skeleton's facial features
export default function CompanionSkeleton({ mood, text }: { mood: Mood; text?: string }) {
  // Determine the eye and mouth shapes based on the game state
  const isHappy = mood === "safe";
  const isAlert = mood === "alert";
  const isBreach = mood === "breach";

  return (
    <div className="flex items-end gap-3 pointer-events-none absolute bottom-6 right-6 z-50">
      
      {/* Speech Bubble that appears if there is text */}
      {text && (
        <div className="relative max-w-sm rounded-2xl border border-fuchsia-500/30 bg-[#111329]/95 p-4 shadow-[0_0_30px_rgba(192,38,211,0.2)] backdrop-blur-md">
          {/* The little triangle pointing to the skeleton */}
          <div className="absolute -right-2 bottom-8 h-4 w-4 rotate-45 border-r border-t border-fuchsia-500/30 bg-[#111329]" />
          <p className="text-sm leading-relaxed text-fuchsia-100">{text}</p>
        </div>
      )}

      {/* The Skeleton Mascot */}
      <div className={`relative transition-transform duration-500 ${isBreach ? "animate-bounce" : "animate-[bob-body_2.6s_ease-in-out_infinite]"}`}>
        <svg width="150" height="150" viewBox="0 0 220 220">
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
            {/* Shield arm */}
            <path d="M95,110 Q70,120 58,145" stroke="url(#boneGrad)" strokeWidth="9" fill="none" strokeLinecap="round" />
            <circle cx="95" cy="110" r="6" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />
            <circle cx="58" cy="145" r="6" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />

            {/* Shield */}
            <g className="shield-glow">
              <path d="M40,120 L70,110 L100,120 L100,155 Q100,185 70,200 Q40,185 40,155 Z" fill="url(#shieldGrad)" stroke="#e9d5ff" strokeWidth="2.5" />
              <rect x="60" y="148" width="20" height="16" rx="3" fill="#1e0a2e" />
              <path d="M64,148 v-6 a6,6 0 0 1 12,0 v6" stroke="#1e0a2e" strokeWidth="3.5" fill="none" />
              <circle cx="70" cy="156" r="2.3" fill="#f0abfc" />
            </g>

            {/* Body */}
            <rect x="113" y="92" width="10" height="46" rx="4" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />
            <path d="M100,100 H136 M98,112 H138 M100,124 H136" stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M118,138 Q110,160 100,178 M118,138 Q126,160 136,178" stroke="url(#boneGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />
            <ellipse cx="118" cy="140" rx="16" ry="8" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />

            {/* Skull Base */}
            <ellipse cx="118" cy="55" rx="30" ry="32" fill="url(#boneGrad)" stroke="#c084fc" strokeWidth="2.5" />
            
            {/* DYNAMIC FACE EXPRESSIONS */}
            {isHappy ? (
              // Happy Eyes & Smile
              <>
                <path d="M100,55 Q106,48 112,55" stroke="#1e0a2e" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M124,55 Q130,48 136,55" stroke="#1e0a2e" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M105,72 Q118,82 131,72" stroke="#1e0a2e" strokeWidth="3" fill="none" strokeLinecap="round" />
              </>
            ) : isBreach ? (
              // Panicked Eyes & Open Mouth
              <>
                <ellipse cx="106" cy="52" rx="9" ry="11" fill="#1e0a2e" />
                <ellipse cx="130" cy="52" rx="9" ry="11" fill="#1e0a2e" />
                <circle cx="104" cy="50" r="2" fill="#f0abfc" />
                <circle cx="128" cy="50" r="2" fill="#f0abfc" />
                <ellipse cx="118" cy="76" rx="8" ry="10" fill="#1e0a2e" />
              </>
            ) : (
              // Default / Alert Eyes (Normal sockets)
              <>
                <ellipse cx="106" cy="52" rx="8" ry="10" fill="#1e0a2e" />
                <ellipse cx="130" cy="52" rx="8" ry="10" fill="#1e0a2e" />
                <circle cx="104" cy="50" r="1.6" fill="#f0abfc" opacity="0.8" />
                <circle cx="128" cy="50" r="1.6" fill="#f0abfc" opacity="0.8" />
                <path d="M101,75 H135" stroke="#1e0a2e" strokeWidth="1.5" />
              </>
            )}
            
            <path d="M114,62 L118,70 L122,62 Z" fill="#1e0a2e" />

            {/* Waving Arm */}
            <g className="wave-arm">
              <path d="M133,95 Q155,85 165,58" stroke="url(#boneGrad)" strokeWidth="9" fill="none" strokeLinecap="round" />
              <circle cx="133" cy="95" r="6" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />
              <circle cx="152" cy="74" r="5" fill="url(#boneGrad)" stroke="#9333ea" strokeWidth="1.5" />
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
      </div>
    </div>
  );
}
