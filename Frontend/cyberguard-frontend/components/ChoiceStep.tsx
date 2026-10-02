// components/ChoiceStep.tsx
//
// Shows 2-3 options after the incident alert. Picking one does NOT
// reveal anything by itself — it triggers a call to /api/scenario-feedback,
// which asks the AI mentor to react to this specific choice. This is
// what keeps feedback dynamic instead of a fixed pre-written line.

"use client";

export type Choice = {
  id: string;
  text: string;     // the option shown as a button
  correct: boolean; // used to tell the backend which "verdict" to feed the AI
};

export default function ChoiceStep({
  choices,
  onPick,
}: {
  choices: Choice[];
  onPick: (choice: Choice) => void; // episode page handles the actual AI call
}) {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-panel border border-cyan/30 rounded-lg p-5 font-mono">
        <p className="text-xs text-cyan mb-4">what does zain do with this passphrase?</p>
        <div className="space-y-3">
          {choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => onPick(choice)}
              className="w-full text-left bg-void border border-cyan/30 rounded px-4 py-3 text-sm text-slate-200 hover:border-cyan transition-colors"
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
