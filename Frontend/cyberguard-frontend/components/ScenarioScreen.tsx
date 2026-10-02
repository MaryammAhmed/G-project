// components/ScenarioScreen.tsx
//
// This is a *reusable* component — it doesn't hardcode any specific
// episode. You pass it any Scenario object, and it renders that episode's
// story, choices, and consequence. Reusable means you write this file
// once, and it works for all 24 episodes later, not just this one.

"use client";
// Required because this component uses useState (a React hook) —
// hooks only work in "client" components in Next.js's App Router.

import { useState } from "react";
import { Scenario } from "@/types/scenario";
import { AGENT_TIERS } from "@/config/characters";
// FIXED: characters.js already uses "export const AGENT_TIERS = {...}",
// which is standard ES module syntax — a normal import handles it fine.
// The old require(...) workaround was solving a problem this file
// never actually had, and TypeScript doesn't recognize require() at all
// without extra Node type definitions, which is what caused the error.

export default function ScenarioScreen({ scenario }: { scenario: Scenario }) {
  // Tracks which choice (if any) the player has clicked.
  // Starts as null = nothing picked yet.
  const [selected, setSelected] = useState<"vulnerable" | "secure" | null>(null);

  // This block looks through AGENT_TIERS (from characters.js) to find
  // the tier whose "id" matches this scenario's "tier" field.
  // Example: scenario.tier is "tier_b" → this finds TIER_B → agent = Zain.
  const tierKey = Object.keys(AGENT_TIERS).find(
    (key) => AGENT_TIERS[key as keyof typeof AGENT_TIERS].id === scenario.tier
  ) as keyof typeof AGENT_TIERS;
  const agent = AGENT_TIERS[tierKey];

  // Once a choice is selected, find that choice's consequence text to display.
  const chosenConsequence = scenario.choices.find((c) => c.id === selected)?.consequence;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 max-w-2xl mx-auto">

      {/* Agent name + stage, pulled from characters.js — never hardcoded here */}
      <p className="text-emerald-400 text-sm mb-2">
        {agent.title} — {agent.stage}
      </p>

      <h1 className="text-2xl font-bold mb-4">{scenario.title}</h1>
      <p className="text-slate-300 mb-6">{scenario.storyText}</p>

      {/* Only show the choice buttons if nothing has been picked yet */}
      {!selected && (
        <div className="flex flex-col gap-3">
          {scenario.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => setSelected(choice.id)}
              className="text-left rounded-lg bg-slate-800 hover:bg-slate-700 p-4 border border-slate-700"
            >
              {choice.label}
            </button>
          ))}
        </div>
      )}

      {/* Once a choice is picked, show its consequence instead of the buttons */}
      {selected && (
        <div className="mt-4 rounded-lg bg-slate-800 p-4 border border-emerald-500">
          <p className="text-slate-100">{chosenConsequence}</p>
        </div>
      )}
    </div>
  );
}
