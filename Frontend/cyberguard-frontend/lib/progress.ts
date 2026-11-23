import { API_BASE_URL } from "@/lib/api";

/*
  lib/progress.ts
  Talks to the backend progress endpoints. Every call takes the login token.
  With no token, nothing is saved. The level path then uses this browser's
  local list so a demo can still move forward one level at a time.
*/

const API = API_BASE_URL;  // backend address (see lib/api.ts)
const LOCAL_KEY = "cg-level-done";  // localStorage key that remembers finished levels when nobody is signed in, e.g. ["1-1","1-2"]

// THE DATA SHAPES BELOW mirror what the backend sends from GET /api/progress (progress_snapshot() in main.py).
// If you change a field on one side, change it on the other.
//
// ModuleProgress = one realm (Vault, Mirage, Whisper, Oracle).
export interface ModuleProgress {
  module: number;
  scenario: string;
  completed: boolean;
  best_score: number;
  attempts: number;
  unlocked: boolean;
  levels_done?: number;
}

// LevelProgress = one level inside a realm (5 per realm). badge / badge_title / badge_icon come from the server's BADGE_CATALOG.
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

// EarnedBadge = a badge the player has earned (shown on the profile shelf).
export interface EarnedBadge {
  id: string;
  title: string;
  icon: string;
  module: number;
  level: number;
}

// ProgressSnapshot = the whole answer: all realms, all levels, earned badges, unlocked realm numbers, total score, finale status and is_admin.
export interface ProgressSnapshot {
  modules: ModuleProgress[];
  levels: LevelProgress[];
  badges: EarnedBadge[];
  unlocked: number[];
  total_score: number;
  finale?: { unlocked: boolean; completed: boolean };
  is_admin?: boolean;
}

/** The Takeover opens when all four realms are finished (or the server says so for admins). */
export function finaleStatus(snap: ProgressSnapshot | null): "completed" | "available" | "locked" {
  // Case 1: the server sent a finale flag (newer backend) -> trust it.
  if (snap?.finale) {
    if (snap.finale.completed) return "completed";
    return snap.finale.unlocked ? "available" : "locked";
  }
  // Case 2: the server answered but has no finale flag -> work it out from the four realms.
  if (snap) {
    const allDone = [1, 2, 3, 4].every((module) =>
      snap.modules.some((row) => row.module === module && row.completed),
    );
    return allDone ? "available" : "locked";
  }
  // Case 3: signed out -> look at this browser's own list of finished levels.
  const localAll = [1, 2, 3, 4].every((module) =>
    [1, 2, 3, 4, 5].every((level) => localDone().includes(`${module}-${level}`)),
  );
  if (localDone().includes("5-1")) return "completed";
  return localAll ? "available" : "locked";
}

// Headers for every signed-in call: JSON body + the login token as "Authorization: Bearer <token>" (read by get_current_user in main.py).
function headers(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

// Reads the browser's list of finished levels (for signed-out play). Always returns an array, never crashes.
function localDone(): string[] {
  // localStorage only exists in the browser. Next.js also runs this code on the server first, where there is no window.
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    // Convert the saved text back into a list. Keep only text items, so damaged data cannot break the game.
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  // Broken JSON or blocked storage: behave as if nothing is saved.
  } catch {
    return [];
  }
}

/** Remember a finished level on this browser. Used when nobody is signed in. */
export function markLocalLevel(module: number, level: number) {
  if (typeof window === "undefined") return;
  // Called by saveCompletion() every time, signed in or not.
  const key = `${module}-${level}`;  // e.g. "2-3" = module 2, level 3
  const done = new Set(localDone());  // a Set cannot hold duplicates
  done.add(key);
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify([...done]));
}

// Is the realm BEFORE this one fully finished (all five levels)? Realm 1 has no previous realm, so it is always open.
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
  // Signed in: the SERVER decides which realms are open (it also opens everything for admins).
  if (snap) {
    const row = snap.modules.find((item) => item.module === module);
    // No row for this realm yet: only realm 1 is open.
    if (!row) return module === 1 ? "available" : "locked";
    if (row.completed) return "completed";
    return row.unlocked ? "available" : "locked";
  }
  // Signed out: a realm is finished when all five of its levels are in the local list.
  const finished = [1, 2, 3, 4, 5].every((level) => localDone().includes(`${module}-${level}`));
  if (finished) return "completed";
  return previousRealmDone(module, null) ? "available" : "locked";
}

/** Level 1 of an open realm is open. The next level opens when the previous one is finished. */
export function levelUnlocked(module: number, level: number, snap: ProgressSnapshot | null): boolean {
  // Signed in: use the server's unlocked flag for this level.
  if (snap) {
    // ?. avoids an error when the row is missing; !! turns the result into a strict true/false.
    return !!snap.levels.find((row) => row.module === module && row.level === level)?.unlocked;
  }
  // Signed out: the whole realm must be open first, then level 1 is open and each later level needs the one before it.
  if (!previousRealmDone(module, null)) return false;
  if (level <= 1) return true;
  return localDone().includes(`${module}-${level - 1}`);
}

export function levelDone(module: number, level: number, snap: ProgressSnapshot | null): boolean {
  // Signed in: ask the server's snapshot whether this level is completed.
  if (snap) {
    return !!snap.levels.find((row) => row.module === module && row.level === level)?.completed;
  }
  return localDone().includes(`${module}-${level}`);
}

// GET /api/progress: the whole progress snapshot. Returns null when signed out or when anything fails (null = "use local mode").
export async function fetchProgress(token: string | null): Promise<ProgressSnapshot | null> {
  if (!token) return null;
  try {
    // The login token is sent in the headers; the server finds the user from it.
    const res = await fetch(`${API}/api/progress`, { headers: headers(token) });
    return res.ok ? ((await res.json()) as ProgressSnapshot) : null;
  // Network problem or sleeping backend: return null so the game still works.
  } catch {
    return null;
  }
}

// POST /api/progress/start: tells the server a level was opened (adds +1 attempt). Returns "locked" only when the server says 403.
export async function startAttempt(
  token: string | null,
  module: number,
  scenario: string,
  level = 1,
): Promise<"ok" | "locked"> {
  // Signed out: let the player play (nothing is saved).
  if (!token) return "ok";
  try {
    const res = await fetch(`${API}/api/progress/start`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ module, scenario, level }),
    });
    // 403 = the server says this level is still locked. Any other result, even an error, lets the player continue.
    return res.status === 403 ? "locked" : "ok";
  // Server unreachable: do not block the player.
  } catch {
    return "ok";
  }
}

// POST /api/progress/complete: called when the final beat of a level is reached. Saves score, badge and unlocks on the server.
export async function saveCompletion(
  token: string | null,
  module: number,
  scenario: string,
  score: number,
  level = 1,
): Promise<void> {
  // Always remember it locally first, even if the server call fails or nobody is signed in.
  markLocalLevel(module, level);
  // Signed out: stop here (the local copy above is all that is saved).
  if (!token) return;
  try {
    await fetch(`${API}/api/progress/complete`, {
      method: "POST",
      headers: headers(token),
      // The score is rounded to a whole number and never below 0. The server also caps it at 5000 and chooses the badge itself.
      body: JSON.stringify({ module, scenario, level, score: Math.max(0, Math.round(score)) }),
    });
  } catch {
    /* progress saving must never break the game */
  }
}
