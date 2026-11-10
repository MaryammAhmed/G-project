/*
  lib/progress.ts
  Talks to the backend progress endpoints. Every call takes the login token.
  With no token, nothing is saved. The level path then uses this browser's
  local list so a demo can still move forward one level at a time.
*/

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const LOCAL_KEY = "cg-level-done";

export interface ModuleProgress {
  module: number;
  scenario: string;
  completed: boolean;
  best_score: number;
  attempts: number;
  unlocked: boolean;
  levels_done?: number;
}

export interface LevelProgress {
  module: number;
  level: number;
  completed: boolean;
  best_score: number;
  attempts: number;
  unlocked: boolean;
  badge: string | null;
  badge_title: string;
  badge_icon: string;
}

export interface EarnedBadge {
  id: string;
  title: string;
  icon: string;
  module: number;
  level: number;
}

export interface ProgressSnapshot {
  modules: ModuleProgress[];
  levels: LevelProgress[];
  badges: EarnedBadge[];
  unlocked: number[];
  total_score: number;
}

function headers(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function localDone(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

/** Remember a finished level on this browser. Used when nobody is signed in. */
export function markLocalLevel(module: number, level: number) {
  if (typeof window === "undefined") return;
  const key = `${module}-${level}`;
  const done = new Set(localDone());
  done.add(key);
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify([...done]));
}

function previousRealmDone(module: number, snap: ProgressSnapshot | null): boolean {
  if (module <= 1) return true;
  if (snap) return snap.modules.some((row) => row.module === module - 1 && row.completed);
  return [1, 2, 3, 4, 5].every((level) => localDone().includes(`${module - 1}-${level}`));
}

/** A realm opens only after the previous realm's five levels are finished.

The server snapshot is the authority when someone is signed in, including an admin
whose realms are all open. Logged-out play still uses this browser's finished levels.
*/
export function moduleStatus(
  module: number,
  snap: ProgressSnapshot | null,
): "completed" | "available" | "locked" {
  if (snap) {
    const row = snap.modules.find((item) => item.module === module);
    if (!row) return module === 1 ? "available" : "locked";
    if (row.completed) return "completed";
    return row.unlocked ? "available" : "locked";
  }
  const finished = [1, 2, 3, 4, 5].every((level) => localDone().includes(`${module}-${level}`));
  if (finished) return "completed";
  return previousRealmDone(module, null) ? "available" : "locked";
}

/** Level 1 of an open realm is open. The next level opens when the previous one is finished. */
export function levelUnlocked(module: number, level: number, snap: ProgressSnapshot | null): boolean {
  if (snap) {
    return !!snap.levels.find((row) => row.module === module && row.level === level)?.unlocked;
  }
  if (!previousRealmDone(module, null)) return false;
  if (level <= 1) return true;
  return localDone().includes(`${module}-${level - 1}`);
}

export function levelDone(module: number, level: number, snap: ProgressSnapshot | null): boolean {
  if (snap) {
    return !!snap.levels.find((row) => row.module === module && row.level === level)?.completed;
  }
  return localDone().includes(`${module}-${level}`);
}

export async function fetchProgress(token: string | null): Promise<ProgressSnapshot | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/progress`, { headers: headers(token) });
    return res.ok ? ((await res.json()) as ProgressSnapshot) : null;
  } catch {
    return null;
  }
}

export async function startAttempt(
  token: string | null,
  module: number,
  scenario: string,
  level = 1,
): Promise<"ok" | "locked"> {
  if (!token) return "ok";
  try {
    const res = await fetch(`${API}/api/progress/start`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ module, scenario, level }),
    });
    return res.status === 403 ? "locked" : "ok";
  } catch {
    return "ok";
  }
}

export async function saveCompletion(
  token: string | null,
  module: number,
  scenario: string,
  score: number,
  level = 1,
): Promise<void> {
  markLocalLevel(module, level);
  if (!token) return;
  try {
    await fetch(`${API}/api/progress/complete`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ module, scenario, level, score: Math.max(0, Math.round(score)) }),
    });
  } catch {
    /* progress saving must never break the game */
  }
}
