"use client";
import { useState, useEffect } from "react";                       // ⬅️ CHANGED: added useEffect
import { speak, stopSpeaking } from "@/lib/speech";                 // ⬅️ CHANGED: added stopSpeaking

type FileItem = {
  id: string;
  name: string;
  type: string;
  content: string;
  isThreat: boolean;
  explanation?: string; 
};

type FileResult = {
  name: string;
  isThreat: boolean;
  playerGuessed: "safe" | "threat";
  isCorrect: boolean;
};

export default function CSIInvestigation({ 
  files, 
  onComplete 
}: { 
  files: FileItem[]; 
  onComplete: (score: number, results: FileResult[]) => void; 
}) {
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [verdicts, setVerdicts] = useState<Record<string, "safe" | "threat">>({});
  
  const [feedbackState, setFeedbackState] = useState<{
    file: FileItem;
    guessed: "safe" | "threat";
    isCorrect: boolean;
    aiText: string | null;
  } | null>(null);

  // ⬇️⬇️⬇️ NEW: auto-stop speech the moment the feedback modal closes ⬇️⬇️⬇️
  useEffect(() => {
    if (!feedbackState) return;      // nothing playing → nothing to clean up
    return () => stopSpeaking();     // modal closes → silence the AI voice
  }, [feedbackState]);
  // ⬆️⬆️⬆️ END NEW ⬆️⬆️⬆️

  const handleVerdict = (verdict: "safe" | "threat") => {
    if (!activeFile) return;
    
    const isCorrect = (verdict === "threat" && activeFile.isThreat) || (verdict === "safe" && !activeFile.isThreat);
    
    setVerdicts((prev) => ({ ...prev, [activeFile.id]: verdict }));
    setActiveFile(null);

    let feedbackText = "";
    
    if (isCorrect) {
      if (verdict === "safe") {
        feedbackText = `CORRECT. This is safe because: ${activeFile.explanation?.replace("This is safe. ", "")}`;
      } else {
        feedbackText = `CORRECT. You spotted the trap! ${activeFile.explanation?.replace("This is a threat. ", "")}`;
      }
    } else {
      if (verdict === "safe") {
        feedbackText = `WRONG. You missed a threat! ${activeFile.explanation?.replace("This is a threat. ", "")}`;
      } else {
        feedbackText = `WRONG. This was actually safe. ${activeFile.explanation?.replace("This is safe. ", "")}`;
      }
    }

    setFeedbackState({ file: activeFile, guessed: verdict, isCorrect, aiText: feedbackText });
    
    try {
      speak(feedbackText);
    } catch {}
  };

  const reviewedCount = Object.keys(verdicts).length;
  const allReviewed = reviewedCount === files.length;

  return (
    <div className="flex flex-col h-[550px] w-full rounded-2xl border border-white/10 bg-[#0f1420] overflow-hidden relative shadow-2xl font-mono">
      
      {/* OS Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#070711] px-4 py-2 text-xs text-[#77748c]">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <span>CYBERGUARD_FORENSIC_TERMINAL_v2.0</span>
        <span>{reviewedCount} / {files.length} REVIEWED</span>
      </div>

      {/* Desktop Grid */}
      <div className="flex-1 p-6 relative grid grid-cols-2 lg:grid-cols-4 gap-6 content-start overflow-y-auto">
        {files.map((file) => {
          const verdict = verdicts[file.id];
          return (
            <button
              key={file.id}
              onClick={() => setActiveFile(file)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:scale-105 h-32 ${
                verdict === "threat" ? "border-red-500 bg-red-500/10" :
                verdict === "safe" ? "border-green-500 bg-green-500/10" :
                "border-white/10 bg-white/5 hover:border-cyan-400"
              }`}
            >
              <span className="text-4xl mb-3">
                {file.type === "email" ? "✉️" : file.type === "social" ? "💬" : "📄"}
              </span>
              <span className="text-xs text-center text-[#f5f3ff] line-clamp-2">{file.name}</span>
              {verdict && <span className={`text-[10px] mt-2 font-bold uppercase tracking-widest ${verdict === 'threat' ? 'text-red-400' : 'text-green-400'}`}>{verdict}</span>}
            </button>
          );
        })}
      </div>

      {/* Opened File Modal */}
      {activeFile && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-lg rounded-xl border border-cyan-400/30 bg-[#111329] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-cyan-400">{activeFile.name}</h3>
              <button onClick={() => setActiveFile(null)} className="text-[#77748c] hover:text-white">✕</button>
            </div>
            <div className="rounded bg-[#070711] p-5 text-sm text-[#b8b5c9] whitespace-pre-wrap mb-6 border border-white/5 font-sans leading-relaxed">
              {activeFile.content}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleVerdict("safe")} 
                className="rounded-lg border border-green-500 py-3 text-sm font-bold text-green-500 hover:bg-green-500/10 transition-colors"
              >
                ✓ Approve (Safe)
              </button>
              <button 
                onClick={() => handleVerdict("threat")} 
                className="rounded-lg border border-red-500 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
              >
                🚩 Flag Threat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackState && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className={`w-full max-w-md rounded-xl border p-6 shadow-2xl bg-[#111329] ${
            feedbackState.isCorrect ? "border-green-500/50" : "border-red-500/50"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{feedbackState.isCorrect ? "✅" : "❌"}</span>
              <h3 className="text-lg font-bold text-[#f5f3ff]">
                {feedbackState.isCorrect ? "Correct Call!" : "Wait, look closer..."}
              </h3>
            </div>
            
            <div className={`relative overflow-hidden rounded-xl border-2 p-5 mb-6 transition-all duration-300 ${
              feedbackState.isCorrect 
                ? "border-[#4ade80] bg-[#052e16]/40 shadow-[0_0_30px_rgba(74,222,128,0.15)]" 
                : "border-[#fb4b5b] bg-[#2a0d12]/40 shadow-[0_0_30px_rgba(251,75,91,0.15)]"
            }`}>
              <div className={`absolute top-0 left-0 h-1 w-full animate-pulse ${
                feedbackState.isCorrect ? "bg-[#4ade80]" : "bg-[#fb4b5b]"
              }`} />

              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <p className={`text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 ${feedbackState.isCorrect ? "text-[#4ade80]" : "text-[#fb4b5b]"}`} style={{ fontFamily: "var(--font-mono)" }}>
                  <span className="animate-pulse text-[8px]">●</span> ANALYSIS
                </p>
                <span className="text-[9px] text-[#77748c]" style={{ fontFamily: "var(--font-mono)" }}>
                  {feedbackState.isCorrect ? "STATUS: SECURE" : "STATUS: WARNING"}
                </span>
              </div>

              <p className="text-sm text-[#f5f3ff] leading-relaxed whitespace-pre-wrap font-mono">
                {feedbackState.aiText}
              </p>
            </div>

            <button
              onClick={() => setFeedbackState(null)}
              className="w-full rounded-xl bg-cyan-500 px-6 py-3 font-bold text-[#070711] hover:bg-cyan-400 transition"
            >
              Continue Review
            </button>
          </div>
        </div>
      )}

      {/* Finish Button */}
      {allReviewed && !activeFile && !feedbackState && (
        <div className="p-4 border-t border-white/10 bg-[#070711] text-center animate-in slide-in-from-bottom-4">
          <button 
            onClick={() => {
              stopSpeaking();                                  // ⬅️ NEW: kill any lingering speech
              const results: FileResult[] = [];
              files.forEach(f => {
                const guessed = verdicts[f.id];
                const isCorrect = (guessed === "threat" && f.isThreat) || (guessed === "safe" && !f.isThreat);
                results.push({
                  name: f.name,
                  isThreat: f.isThreat,
                  playerGuessed: guessed,
                  isCorrect
                });
              });
              
              onComplete(0, results);
            }}
            className="rounded-xl bg-cyan-400 px-8 py-3 text-sm font-bold text-[#070711] hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            Finish Scan & Continue
          </button>
        </div>
      )}
    </div>
  );
}
