"use client";
import { useState } from "react";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

// --- DRAG AND DROP STATE TYPES ---
type DraggableStep = {
  id: string;
  label: string;
  why: string;
  correctSlot: number; // 1, 2, 3, 4, 5, 6
  bad: boolean;
};

const RECOVERY_STEPS: DraggableStep[] = [
  { id: "password", label: "Change the password on the real site", why: "Lock the attacker out immediately.", correctSlot: 1, bad: false },
  { id: "sessions", label: "Log out of all other devices", why: "Kick out the hacker's active sessions.", correctSlot: 2, bad: false },
  { id: "twofa",    label: "Turn on Two-Factor Authentication", why: "Ensure a stolen password isn't enough.", correctSlot: 3, bad: false },
  { id: "reuse",    label: "Change the password on other sites", why: "Stop credential stuffing on other accounts.", correctSlot: 4, bad: false },
  { id: "warn",     label: "Warn your friends your account was hacked", why: "The hacker will phish your contacts next.", correctSlot: 5, bad: false },
  { id: "report",   label: "Report it to the platform or IT", why: "Let the pros trace and stop the attack.", correctSlot: 6, bad: false },
  { id: "reply",    label: "Reply to the sender and demand your account back", why: "NEVER engage. It confirms your account is active.", correctSlot: 0, bad: true },
  { id: "delete",   label: "Delete the email and hope for the best", why: "The damage is done. Ignoring it lets the hacker keep access.", correctSlot: 0, bad: true },
];

export default function LiveEmailInspector({
  parts = [],
  onComplete,
}: {
  parts?: { id: string; text: string; isThreat: boolean; correctReason?: string; explanation: string }[];
  onComplete: (score: number, mistakes: number) => void;
}) {
  const [phase, setPhase] = useState<"inspect" | "recover" | "report">(
    parts.length === 0 ? "recover" : "inspect"
  );

  // Phase 1 (Inspection) State
  const [activePart, setActivePart] = useState<typeof parts[0] | null>(null);
  const [verdicts, setVerdicts] = useState<Record<string, { isCorrect: boolean; guessedReason?: string }>>({});
  const [mistakes, setMistakes] = useState(0);

  // Phase 2 (Drag & Drop) State
  const [placedSteps, setPlacedSteps] = useState<(string | null)[]>(Array(6).fill(null));
  const [dcMistakes, setDcMistakes] = useState(0);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // --- PHASE 1 LOGIC ---
  const handleFlag = (reason: string) => {
    if (!activePart) return;
    const isCorrect = activePart.isThreat && activePart.correctReason === reason;
    if (!isCorrect) setMistakes(m => m + 1);
    setVerdicts(prev => ({ ...prev, [activePart.id]: { isCorrect, guessedReason: reason } }));
    setTimeout(() => setActivePart(null), 1500);
  };
  const handleSafe = () => {
    if (!activePart) return;
    const isCorrect = !activePart.isThreat;
    if (!isCorrect) setMistakes(m => m + 1);
    setVerdicts(prev => ({ ...prev, [activePart.id]: { isCorrect } }));
    setTimeout(() => setActivePart(null), 1500);
  };

  const allReviewed = Object.keys(verdicts).length === parts.length;

  // --- PHASE 2 DRAG AND DROP LOGIC ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const step = RECOVERY_STEPS.find(s => s.id === draggedItem)!;
    
    // Check if it's a bad step OR if it's being placed in the wrong slot
    if (step.bad || step.correctSlot !== slotIndex + 1) {
      setDcMistakes(m => m + 1);
      // Flash red briefly (optional UI polish)
    } else {
      // Correct placement
      const newPlaced = [...placedSteps];
      newPlaced[slotIndex] = step.id;
      setPlacedSteps(newPlaced);
    }
    
    setDraggedItem(null);
  };

  // Reset logic to allow re-dragging if they want to change it
  const removeFromSlot = (slotIndex: number) => {
    const newPlaced = [...placedSteps];
    newPlaced[slotIndex] = null;
    setPlacedSteps(newPlaced);
  };

  const allSlotsFilled = placedSteps.every(s => s !== null);

  // --- RENDER: PHASE 1 (INSPECT) ---
  if (phase === "inspect") {
    return (
      <div className="relative flex flex-col h-[550px] w-full rounded-2xl border border-cyan-500/30 bg-[#0b1024] overflow-hidden shadow-2xl font-mono text-sm">
        {/* ... (Keep your existing Phase 1 Inspect UI here, it was working fine) ... */}
        <div className="p-4 flex justify-center border-t border-white/10 bg-[#070711]">
           {allReviewed && (
            <button onClick={() => setPhase("recover")} className="w-full max-w-md rounded-xl bg-cyan-500 px-6 py-4 font-bold text-[#070711] hover:bg-cyan-400 transition-colors">
              Proceed to Recovery Phase
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER: PHASE 3 (REPORT) ---
  if (phase === "report") {
    const totalMistakes = mistakes + dcMistakes;
    const score = Math.max(0, 100 - totalMistakes * 10);
    return (
      <div className="space-y-4 font-mono text-sm max-w-2xl mx-auto">
        <div className="rounded-2xl border border-green-500/40 bg-green-500/5 p-6 text-center">
          <p className="text-xs tracking-[0.25em] text-[#77748c] mb-2">FINAL REPORT</p>
          <p className="text-5xl font-bold text-green-400 mb-1">{score}</p>
          <p className="text-xs text-[#b8b5c9]">out of 100</p>
        </div>
        {/* ... Rest of your report UI ... */}
        <button onClick={() => onComplete(score, totalMistakes)} className="w-full rounded-xl bg-green-500 px-6 py-4 font-bold text-[#070711] hover:bg-green-400 transition-colors">
          Submit Final Report
        </button>
      </div>
    );
  }

  // --- RENDER: PHASE 2 (DAMAGE CONTROL DRAG & DROP) ---
  return (
    <div className="space-y-6 font-mono text-sm max-w-4xl mx-auto">
      
      {/* 1. THE EDUCATIONAL PRIMER */}
      <div className="rounded-xl border border-cyan-500/30 bg-[#111329] p-5">
        <h3 className="text-cyan-400 font-bold mb-2">THE RECOVERY PROTOCOL</h3>
        <p className="text-[#b8b5c9] mb-4">
          When an account is breached, follow the <strong>Stop, Lock, Check</strong> rule. Speed matters, but doing things in the wrong order can actually lock you out while the hacker stays in.
        </p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded bg-[#070711] p-3 border border-white/5">
            <strong className="text-white block mb-1">1. STOP THE BLEEDING</strong>
            <span className="text-[#77748c]">Change the password and kick active sessions immediately.</span>
          </div>
          <div className="rounded bg-[#070711] p-3 border border-white/5">
            <strong className="text-white block mb-1">2. LOCK THE DOOR</strong>
            <span className="text-[#77748c]">Turn on 2FA and secure accounts sharing the same password.</span>
          </div>
          <div className="rounded bg-[#070711] p-3 border border-white/5">
            <strong className="text-white block mb-1">3. CHECK THE FALLOUT</strong>
            <span className="text-[#77748c]">Warn contacts and report the breach to the platform.</span>
          </div>
        </div>
      </div>

      {/* 2. THE GAME (DRAG AND DROP) */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Draggable Pool */}
        <div className="space-y-2">
          <p className="text-xs tracking-[0.25em] text-[#77748c]">AVAILABLE ACTIONS</p>
          <div className="space-y-2">
            {RECOVERY_STEPS.filter(s => !placedSteps.includes(s.id)).map(step => (
              <div
                key={step.id}
                draggable
                onDragStart={(e) => handleDragStart(e, step.id)}
                className={`cursor-grab active:cursor-grabbing rounded-xl border border-white/10 bg-[#181a38] p-3 text-[#f5f3ff] transition hover:border-cyan-400 ${
                  step.bad ? "hover:border-red-400 border-red-500/30" : ""
                }`}
              >
                {step.label}
              </div>
            ))}
          </div>
        </div>

        {/* Drop Zones */}
        <div className="space-y-2">
          <p className="text-xs tracking-[0.25em] text-[#77748c]">YOUR RECOVERY PLAN (IN ORDER)</p>
          {Array.from({ length: 6 }).map((_, i) => {
            const stepId = placedSteps[i];
            const step = RECOVERY_STEPS.find(s => s.id === stepId);

            return (
              <div
                key={i}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, i)}
                className={`min-h-[60px] flex items-center rounded-xl border-2 border-dashed p-3 transition ${
                  step 
                    ? "border-cyan-500 bg-cyan-500/10" 
                    : "border-white/20 bg-[#070711]"
                }`}
              >
                <span className="text-cyan-500/50 font-bold mr-3">{i + 1}</span>
                {step ? (
                  <div className="flex-1 flex justify-between items-center">
                    <p className="text-cyan-300">{step.label}</p>
                    <button onClick={() => removeFromSlot(i)} className="text-xs text-[#77748c] hover:text-white">
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="text-[#77748c] text-xs italic">Drop step here...</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. COMPLETE BUTTON */}
      {allSlotsFilled && (
        <button
          onClick={() => setPhase("report")}
          className="w-full rounded-xl bg-cyan-500 px-6 py-4 font-bold text-[#070711] hover:bg-cyan-400 transition-colors animate-pulse"
        >
          Analyze Recovery Plan →
        </button>
      )}

      {/* Error Feedback Overlay for bad drops */}
      {draggedItem && RECOVERY_STEPS.find(s => s.id === draggedItem)?.bad && (
         <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg">
            Wait, did you just try to drag a bad action? Don't do that!
         </div>
      )}
    </div>
  );
}
