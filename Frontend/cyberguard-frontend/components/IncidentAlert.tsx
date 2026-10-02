// components/IncidentAlert.tsx
//
// A breach notice — the "inciting incident" of the episode. Shows before
// the choice, so the player knows WHY a decision is being asked of them.

export default function IncidentAlert({
  text,
  onContinue,
}: {
  text: string;
  onContinue: () => void;
}) {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-panel border border-alert/50 rounded-lg p-5 font-mono animate-pulse-once">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-2 w-2 rounded-full bg-alert animate-pulse" />
          <p className="text-xs text-alert tracking-widest uppercase">incident detected</p>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed mb-5">{text}</p>
        <button
          onClick={onContinue}
          className="w-full bg-alert/10 border border-alert/50 text-alert text-sm font-medium py-2.5 rounded hover:bg-alert/20"
        >
          respond →
        </button>
      </div>
    </div>
  );
}
