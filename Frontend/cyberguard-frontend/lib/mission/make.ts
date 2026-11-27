/** Randomly shuffle an array in-place. */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
/*
  lib/mission/make.ts
  Builds the short beats every level shares: two story lines, three choices,
  one hands-on task, then a single recap. The game judges the choices.
*/

// Type-only imports: they are erased at build time and only help TypeScript check the code.
import type { AITaskId, Beat, Choice, LevelSpec, Mission, Mood, PHTaskId, PWTaskId, SETaskId } from "./types";

// Re-export, so the level files can import LevelSpec from this file together with the helper functions.
export type { LevelSpec };

// Opt = ONE answer option as a level author writes it:
//   text     what the player reads
//   correct  true for the single right option (leave it out for wrong ones)
//   fallback the teaching sentence for this option (also sent to the AI feedback route as teaching_point)
//   severe   true when the option hands over a password, code or private file
type Opt = { text: string; correct?: boolean; fallback: string; severe?: boolean };

// story(): a narration beat. The player reads it and the narrator voice speaks it. mood = how the scene feels (calm / alert / breach / safe).
export function story(id: string, say: string, mood: Mood = "calm"): Beat {
  return { id, type: "story", say, mood };
}

/** One correct option. `severe` is only for handing over a password, code, or private file. */
export function decide(id: string, say: string, hint: string, opts: Opt[]): Beat {
  // Turn each author-written option into a full Choice object.
  const choices: Choice[] = opts.map((o, i) => ({
    id: String.fromCharCode(97 + i),  // 97 is the character code of "a", so the options get ids a, b, c, d
    text: o.text,
    correct: !!o.correct,  // !! turns "missing" (undefined) into false
    fallback: o.fallback,
    severe: o.severe,
  }));
  // The finished decision beat. The GAME decides if the pick is right (the AI only explains afterwards).
  return { id, type: "decision", say, hint, mood: "alert", choices };
}

// pw / ph / se / ai: beats that launch a hands-on mini-game. The last argument (the task id) picks which one.
//   pw = Vault tasks, ph = Mirage tasks, se = Whisper tasks, ai = Oracle tasks.
// A practice round from lib/mission/briefs.ts is shown before the real task starts.
export function pw(id: string, say: string, task: PWTaskId): Beat {
  return { id, type: "pw-task", say, task, mood: "alert", hint: "Read the example first. Then it is your turn." };
}

export function ph(id: string, say: string, task: PHTaskId): Beat {
  return { id, type: "ph-task", say, task, mood: "alert", hint: "Read the example first. Then it is your turn." };
}

export function se(id: string, say: string, task: SETaskId): Beat {
  return { id, type: "se-task", say, task, mood: "alert", hint: "Read the example first. Then it is your turn." };
}

// phishScale(): helper function to generate a phish-scale beat for TackleBox.
export function phishScale(id: string, say: string, mood: Mood = "alert"): Beat {
  return { id, type: "phish-scale", say, mood, hint: "Tap each card to reveal the NIST Phish Scale clues." };
}

export function ai(id: string, say: string, task: AITaskId): Beat {
  return { id, type: "ai-task", say, task, mood: "alert", hint: "Read the example first. Then it is your turn." };
}

// finish(): the LAST beat of a level (the recap). Reaching it is what makes the game save the completion (see lib/progress.ts).
export function finish(id: string, recap: string): Beat {
  return { id, type: "complete", say: recap, mood: "safe" };
}

/** One level, ready for MissionPlayer. The badge name is what the profile shelf shows. */
export function missionLevel(mission: Mission, level: number): Mission {
  // Look up the requested level (1-5) in this mission.
  const spec = mission.levels.find((item) => item.level === level);
  // Unknown level number: return the mission unchanged instead of crashing.
  if (!spec) {
    return mission;
  }
  return {
    // Copy every field of the mission, then replace these four with the chosen level's own values.
    ...mission,
    title: spec.title,
    badge: spec.badge,
    incident: spec.incident,
    beats: spec.beats,
  };
}
