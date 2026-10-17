"use client";
import { useState } from "react";

type FileItem = {
  id: string;
  name: string;
  type: "email" | "social" | "file";
  content: string;
  isThreat: boolean;
  explanation: string;
};

export default function CSIInvestigation({ 
  files, 
  onComplete 
}: { 
  files: FileItem[]; 
  onComplete: (score: number) => void; 
}) {
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [verdicts, setVerdicts] = useState<Record<string, "safe" | "threat">>({});

  const handleVerdict = (verdict: "safe" | "threat") => {
    if (!activeFile) return;
    setVerdicts((prev) => ({ ...prev, [activeFile.id]: verdict }));
    setTimeout(() => setActiveFile(null), 600); 
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

      {/* Finish Button */}
      {allReviewed && !activeFile && (
        <div className="p-4 border-t border-white/10 bg-[#070711] text-center animate-in slide-in-from-bottom-4">
          <button 
            onClick={() => {
              let score = 0;
              files.forEach(f => {
                if ((verdicts[f.id] === "threat" && f.isThreat) || (verdicts[f.id] === "safe" && !f.isThreat)) {
                  score += 100 / files.length;
                }
              });
              onComplete(score);
            }}
            className="rounded-xl bg-cyan-400 px-8 py-3 text-sm font-bold text-[#070711] hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            Submit Investigation Report
          </button>
        </div>
      )}
    </div>
  );
}
