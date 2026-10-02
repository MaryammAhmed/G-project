// components/AgentFileCard.tsx
//
// The "case file" intro screen shown before an episode starts.
// Reusable — pass it any agent object from characters.js, and it
// renders that character's dossier. Field names (title, stage, bio,
// alert) match characters.js exactly — no renaming happens here.

type Agent = {
  title: string;  // e.g. "Agent Zain" — matches characters.js
  stage: string;  // e.g. "University" — matches characters.js
  bio: string;
  alert: string;
};

export default function AgentFileCard({
  agent,
  onBegin,
}: {
  agent: Agent;
  onBegin: () => void;
}) {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-void border border-cyan/30 rounded-lg p-5 shadow-[0_0_24px_rgba(34,211,238,0.1)_inset]">

        <div className="flex justify-between font-mono text-[10px] text-cyan tracking-widest uppercase mb-4">
          <span>agent file</span>
          <span>{agent.stage}</span>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="w-16 h-16 rounded-md border border-cyan bg-panel flex items-center justify-center text-cyan text-2xl">
            👤
          </div>
          <div>
            <p className="font-medium text-white">{agent.title}</p>
            <span className="inline-block mt-1 bg-violet/10 text-violet font-mono text-[10px] px-2 py-0.5 rounded border border-violet/40">
              clearance: {agent.stage}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-4">{agent.bio}</p>

        <div className="bg-alert/5 border border-alert/30 rounded p-3 mb-4">
          <p className="font-mono text-[10px] text-alert tracking-wide mb-1">security alert</p>
          <p className="text-xs text-red-300">{agent.alert}</p>
        </div>

        <button
          onClick={onBegin}
          className="w-full bg-cyan text-void font-mono text-sm font-medium py-2.5 rounded"
        >
          access case file →
        </button>
      </div>
    </div>
  );
}
