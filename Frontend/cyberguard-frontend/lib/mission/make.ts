/*
  lib/mission/make.ts
  Builds the short beats every level shares: two story lines, three choices,
  one hands-on task, then a single recap. The game judges the choices.
*/

import type { AITaskId, Beat, Choice, LevelSpec, Mission, Mood, PHTaskId, PWTaskId, SETaskId } from "./types";

export type { LevelSpec };

type Opt = { text: string; correct?: boolean; fallback: string; severe?: boolean };

export function story(id: string, say: string, mood: Mood = "calm"): Beat {
  return { id, type: "story", say, mood };
}

/** One correct option. `severe` is only for handing over a password, code, or private file. */
export function decide(id: string, say: string, hint: string, opts: Opt[]): Beat {
  const choices: Choice[] = opts.map((o, i) => ({
    id: String.fromCharCode(97 + i),
    text: o.text,
    correct: !!o.correct,
    fallback: o.fallback,
    severe: o.severe,
  }));
  return { id, type: "decision", say, hint, mood: "alert", choices };
}

export function pw(id: string, say: string, task: PWTaskId): Beat {
  return { id, type: "pw-task", say, task, mood: "alert", hint: "Read the example first. Then it is your turn." };
}

export function ph(id: string, say: string, task: PHTaskId): Beat {
  return { id, type: "ph-task", say, task, mood: "alert", hint: "Read the example first. Then it is your turn." };
}

export function se(id: string, say: string, task: SETaskId): Beat {
  return { id, type: "se-task", say, task, mood: "alert", hint: "Read the example first. Then it is your turn." };
}

export function ai(id: string, say: string, task: AITaskId): Beat {
  return { id, type: "ai-task", say, task, mood: "alert", hint: "Read the example first. Then it is your turn." };
}

export function finish(id: string, recap: string): Beat {
  return { id, type: "complete", say: recap, mood: "safe" };
}

/** One level, ready for MissionPlayer. The badge name is what the profile shelf shows. */
export function missionLevel(mission: Mission, level: number): Mission {
  const spec = mission.levels.find((item) => item.level === level);
  if (!spec) {
    return mission;
  }
  return {
    ...mission,
    title: spec.title,
    badge: spec.badge,
    incident: spec.incident,
    beats: spec.beats,
  };
}
