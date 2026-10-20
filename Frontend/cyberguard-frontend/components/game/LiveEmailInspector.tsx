"use client";

import { useState } from "react";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import { speak, stopSpeaking } from "@/lib/speech";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const API = "http://127.0.0.1:8000"; // FastAPI backend

/*
  LiveEmailInspector: The Attack Chain (Free-Click + AI Debrief)
  =============================================================
  The player can click ANY part of the email. 
  Some are real flags, some are just normal email features.
  The AI reviews their findings and explains the difference between 
  a real warning sign and normal email formatting.
*/

// The email Sarah received.
const EMAIL = {
  fromName: "Elmwood High IT Desk",
  fromAddress: "support@elmwood-helpdesk.com", // Flag 1: Fake domain
  to: "sarah.j@elmwood.edu",
  subject: "Action Required: Password Expiration Notice",
  date: "Today, 8:14 AM",
  body1: "Dear Sarah,", // Flag 2: Generic greeting (mild)
  body2: "This is an automated notice from the Elmwood High IT Department.",
  body3: "Your school network password is set to expire today. To maintain access to your student portal, email, and Wi-Fi, you must verify your identity and update your password immediately.", // Flag 3: Urgency
  body4: "Please click the secure link below to keep your current password and avoid account suspension.",
  ctaText: "Update Password Now",
  ctaUrl: "http://elmwood-portal.verify-login.top/auth", // Flag 4: Hidden dangerous link
  footer: "© 2026 Elmwood High School IT Department. All rights reserved.\nNeed help? Contact the main office at (555) 019-2834.",
};

// These are the real red flags. If they click anything else, it's a "safe" click.
type FlagType = "sender" | "urgency" | "link" | "greeting";
const SAFE_ELEMENTS = ["date", "body1_safe", "body2", "footer"];

export default function LiveEmailInspector({
  onComplete,
}: {
  parts?: any[]; 
  onComplete: (score: number, mistakes: number) => void;
}) {
  const [foundFlags, setFoundFlags] = useState<FlagType[]>([]);
  const [safeClicks, setSafeClicks] = useState<string[]>([]);
  const [gameState, setGameState] = useState<"investigate" | "debrief" | "action">("investigate");
  const [aiText, setAiText] = useState<string | null>(null);
  
  function snd(kind: "tick" | "bad" | "good") {
    try { ensureAudio(); sfx(kind); } catch {}
  }

  function toggleFlag(type: FlagType) {
    if (foundFlags.includes(type)) {
      setFoundFlags((prev) => prev.filter((f) => f !== type)); // Un-flag
    } else {
      setFoundFlags((prev) => [...prev, type]);
    }
    snd("tick");
  }

  function logSafeClick(id: string) {
    if (!safeClicks.includes(id)) {
      setSafeClicks((prev) => [...prev, id]);
      snd("tick");
    }
  }

  async function getAIFeedback() {
    stopSpeaking(); // Stop the dialogue box voice from overlapping
    setGameState("debrief");
    setAiText(null);
    
    const foundNames = foundFlags.map((f) => {
      if (f === "sender") return "Fake sender address (support@elmwood-helpdesk.com)";
      if (f === "urgency") return "Artificial urgency (expires today)";
      if (f === "link") return "Hidden link (verify-login.top)";
      if (f === "greeting") return "Generic greeting (Dear Sarah)";
      return "";
    });

    const safeNames = safeClicks.map((s) => {
      if (s === "date") return "The date";
      if (s === "body1_safe") return "The normal part of the text";
      if (s === "body2") return "The standard IT introduction";
      if (s === "footer") return "The footer and phone number";
      return "";
    });

        const prompt = `
      You are an expert cybersecurity mentor teaching a high school student.
      The player just analyzed a phishing email. Here is what they clicked:
      - Real Red Flags they found: ${foundNames.length > 0 ? foundNames.join(", ") : "None"}.
      - Safe/False Alarms they clicked: ${safeNames.length > 0 ? safeNames.join(", ") : "None"}.
      
      Write a 3-sentence response directly to the player.
      RULE 1: If they found the fake sender or fake link, praise them for checking the technical details. If they missed them, explain that the attacker changed the domain (elmwood-helpdesk.com instead of elmwood.edu).
      RULE 2: If they clicked "safe" things (like the footer or date), gently explain that while it's good to be careful, those parts are standard, and the real danger is the link.
      RULE 3: End by explaining that the attacker used urgency ("expires today") to make them panic.
      Do not just give a grade. Explain the reasoning.
    `;

    try {
      const res = await fetch(`${API}/api/scenario-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: 2,
          incident: "Phishing email analysis",
          choice_text: foundNames.join(", ") + " | Safe clicks: " + safeNames.join(", "),
          correct: true,
        }),
      });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      if (data.feedback) {
        setAiText(data.feedback);
        speak(data.feedback); // <--- ADDED THIS LINE
        return;
      }
     let fallbackText = "";
      if (foundFlags.length === 0) {
        fallbackText = "You didn't flag anything dangerous. Attackers rely on this—look at the sender's domain and the hidden link. Real IT uses @elmwood.edu.";
      } else if (!foundFlags.includes("link") || !foundFlags.includes("sender")) {
        fallbackText = "You caught the story, but the technical clues are how you actually stop the attack. Check the sender's email and where the link really goes.";
      } else {
        fallbackText = "You found the technical indicators—the fake domain and the malicious link. Attackers use urgency so you don't stop to inspect the URL. Catching that is how you break the chain.";
      }
      
      setAiText(fallbackText);
      speak(fallbackText);
    } catch (error) {
      const fallbackText =
        "I couldn't reach the AI mentor, but the danger signs are clear: the sender is fake and the link is malicious. Report the email and do not click it.";
      setAiText(fallbackText);
      speak(fallbackText);
    }
  }
  


  function finish(action: "report" | "click") {
    // Score = 100 - (15 points per real flag missed) - (5 points per safe click) - (50 points if they clicked the link)
    const missedFlags = 4 - foundFlags.length; 
    const penalty = (missedFlags * 15) + (safeClicks.length * 5) + (action === "click" ? 50 : 0);
    const score = Math.max(0, 100 - penalty);
    
    onComplete(score, Math.floor(penalty / 10));
  }

  /* ---------------- RENDER: DEBRIEF ---------------- */
  if (gameState === "debrief") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 font-mono text-sm">
        <div className="rounded-2xl border border-[#8b5cf6]/40 bg-[#111329] p-6 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
          <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
            <span className="text-2xl">🤖</span>
            <h3 className="text-[#8b5cf6] font-bold tracking-widest uppercase">AI Mentor Debrief</h3>
          </div>
          
          {aiText === null ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-full"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
              <div className="h-4 bg-white/10 rounded w-4/6"></div>
            </div>
          ) : (
            <p className="text-[#f5f3ff] leading-relaxed text-base">{aiText}</p>
          )}

          {aiText !== null && (
            <div className="mt-8">
              <button
                onClick={() => setGameState("action")}
                className="rounded-xl bg-[#8b5cf6] px-6 py-3 font-bold text-white hover:bg-[#7c3aed] transition"
              >
                Decide what to do next →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- RENDER: ACTION ---------------- */
  if (gameState === "action") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 font-mono text-sm">
        <div className="rounded-2xl border border-cyan-500/30 bg-[#111329] p-6">
          <h3 className="text-cyan-400 font-bold mb-2">The Bait is Set</h3>
          <p className="text-[#b8b5c9] mb-6">
            Sarah is hovering over the button. What is the safest move to protect the school?
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button 
              onClick={() => finish("click")}
              className="text-left rounded-xl border border-white/10 bg-[#181a38] p-4 hover:border-red-400 transition"
            >
              <p className="font-bold text-[#f5f3ff]">Click the link to see</p>
              <p className="text-xs text-[#77748c] mt-1">You'll get hacked.</p>
            </button>
            <button 
              onClick={() => finish("report")}
              className="text-left rounded-xl border border-green-500 bg-green-500/10 p-4 hover:bg-green-500/20 transition"
            >
              <p className="font-bold text-green-400">Report & Delete</p>
              <p className="text-xs text-[#4ade80] mt-1">Break the chain.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- RENDER: INVESTIGATE ---------------- */
  return (
    <div className="mx-auto max-w-5xl space-y-6 font-mono text-sm">
      
      <div className="rounded-xl border border-cyan-500/30 bg-[#111329] p-4">
        <h3 className="text-cyan-400 font-bold mb-1">FORENSIC ANALYSIS</h3>
        <p className="text-[#b8b5c9]">
          Click on anything in the email that looks suspicious to you. When you are ready, ask the AI to review your findings.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Left: The Email (EVERYTHING is clickable) */}
        <div className="rounded-xl border border-white/10 bg-white text-black overflow-hidden font-sans shadow-xl">
          {/* Mock email header */}
          <div className="bg-[#f3f4f6] p-4 border-b border-[#e5e7eb]">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 select-none">{EMAIL.subject}</h2>
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-full bg-[#15803d] text-white flex items-center justify-center font-bold text-lg cursor-pointer"
                onClick={() => toggleFlag("sender")} // Logo is part of the sender flag
              >
                E
              </div>
              <div className="flex-1">
                <div 
                  onClick={() => toggleFlag("sender")}
                  className={`cursor-pointer inline-block px-1 -ml-1 rounded transition ${
                    foundFlags.includes("sender") ? "bg-red-200 outline-2 outline-red-400" : "hover:bg-gray-200"
                  }`}
                >
                  <span className="font-bold text-gray-900">{EMAIL.fromName}</span>
                  <span className="text-gray-500 text-sm ml-1">&lt;{EMAIL.fromAddress}&gt;</span>
                </div>
                <div className="text-gray-500 text-sm select-none">to {EMAIL.to}</div>
              </div>
              <div 
                onClick={() => logSafeClick("date")}
                className={`cursor-pointer px-1 -ml-1 rounded transition ${
                  safeClicks.includes("date") ? "bg-yellow-200 outline-2 outline-yellow-400" : "hover:bg-gray-200"
                }`}
              >
                <div className="text-gray-400 text-sm select-none">{EMAIL.date}</div>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="p-6 text-[15px] leading-relaxed text-gray-800">
            <div 
              onClick={() => toggleFlag("greeting")}
              className={`cursor-pointer inline-block px-1 -ml-1 rounded transition ${
                foundFlags.includes("greeting") ? "bg-red-200 outline-2 outline-red-400" : "hover:bg-gray-200"
              }`}
            >
              {EMAIL.body1}
            </div>
            
            <p 
              onClick={() => logSafeClick("body2")}
              className={`mt-4 cursor-pointer rounded p-1 -m-1 transition ${
                safeClicks.includes("body2") ? "bg-yellow-200 outline-2 outline-yellow-400" : "hover:bg-gray-200"
              }`}
            >
              {EMAIL.body2}
            </p>
            
            <p 
              onClick={() => toggleFlag("urgency")}
              className={`mt-4 cursor-pointer rounded p-1 -m-1 transition ${
                foundFlags.includes("urgency") ? "bg-red-200 outline-2 outline-red-400" : "hover:bg-gray-200"
              }`}
            >
              {EMAIL.body3}
            </p>
            
            <p 
              onClick={() => logSafeClick("body4")}
              className={`mt-4 cursor-pointer rounded p-1 -m-1 transition ${
                safeClicks.includes("body4") ? "bg-yellow-200 outline-2 outline-yellow-400" : "hover:bg-gray-200"
              }`}
            >
              {EMAIL.body4}
            </p>

            {/* The Button */}
            <div className="mt-8 mb-8">
              <div 
                onClick={() => toggleFlag("link")}
                className={`inline-block cursor-pointer rounded transition ${
                  foundFlags.includes("link") ? "ring-4 ring-red-400 ring-offset-2" : ""
                }`}
              >
                <button className="bg-[#15803d] text-white px-6 py-3 rounded font-bold hover:bg-[#166534]">
                  {EMAIL.ctaText}
                </button>
              </div>
              {foundFlags.includes("link") && (
                <p className="text-red-600 text-xs mt-2 font-mono bg-red-50 p-2 rounded border border-red-200">
                  ⚠️ Revealed URL: {EMAIL.ctaUrl}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div 
            onClick={() => logSafeClick("footer")}
            className={`bg-[#f9fafb] p-4 text-xs text-gray-500 border-t border-[#e5e7eb] whitespace-pre-wrap cursor-pointer transition ${
              safeClicks.includes("footer") ? "bg-yellow-50 outline-2 outline-yellow-400" : "hover:bg-gray-200"
            }`}
          >
            {EMAIL.footer}
          </div>
        </div>

        {/* Right: Console */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-[#111329] p-5">
            <h4 className="text-[#f5f3ff] font-bold mb-4 flex justify-between">
              <span>YOUR FINDINGS</span>
            </h4>
            
            <div className="space-y-3 text-sm">
              {foundFlags.length === 0 && safeClicks.length === 0 && (
                <p className="text-[#77748c] italic">Click parts of the email to log them here.</p>
              )}
              
              {/* Real Flags */}
              {foundFlags.includes("sender") && <div className="text-red-400">🚩 Flagged: Sender Address</div>}
              {foundFlags.includes("greeting") && <div className="text-red-400">🚩 Flagged: Generic Greeting</div>}
              {foundFlags.includes("urgency") && <div className="text-red-400">🚩 Flagged: Artificial Urgency</div>}
              {foundFlags.includes("link") && <div className="text-red-400">🚩 Flagged: Hidden Link Address</div>}

              {/* Safe Clicks */}
              {safeClicks.includes("date") && <div className="text-yellow-400">🟡 Clicked: Date</div>}
              {safeClicks.includes("body2") && <div className="text-yellow-400">🟡 Clicked: Intro Text</div>}
              {safeClicks.includes("body4") && <div className="text-yellow-400">🟡 Clicked: Body Text</div>}
              {safeClicks.includes("footer") && <div className="text-yellow-400">🟡 Clicked: Footer</div>}
            </div>
          </div>

          <button
            onClick={getAIFeedback}
            disabled={foundFlags.length === 0 && safeClicks.length === 0}
            className="w-full rounded-xl bg-[#8b5cf6] px-6 py-4 font-bold text-white hover:bg-[#7c3aed] disabled:opacity-30 disabled:cursor-not-allowed transition shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          >
            Analyze Findings with AI →
          </button>
        </div>
      </div>
    </div>
  );
}
