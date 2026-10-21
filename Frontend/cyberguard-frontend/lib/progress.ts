/*
  lib/progress.ts
  ===============
  Talks to the backend progress endpoints (see "PROGRESS TRACKING" at the end of Backend/main.py).
  Every function takes the login token. With NO token (preview mode, not logged in) nothing is
  saved and nothing is locked, so the game still works for a quick demo.
  If the server can't be reached, the game keeps working (it never blocks on a network error).
*/

const API = "http://127.0.0.1:8000";

export interface ModuleProgress {
  module: number;
  scenario: string;
  completed: boolean;
  best_score: number;
  attempts: number;
  unlocked: boolean;
}
export interface ProgressSnapshot {
  modules: ModuleProgress[];
  unlocked: number[];
  total_score: number;
}

function headers(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

/* Map page: all four modules and which are unlocked. null = not logged in or server down. */
export async function fetchProgress(token: string | null): Promise<ProgressSnapshot | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/progress`, { headers: headers(token) });
    return res.ok ? ((await res.json()) as ProgressSnapshot) : null;
  } catch {
    return null;
  }
}

/* Mission opens: counts an attempt. "locked" only when the SERVER says 403. */
export async function startAttempt(token: string | null, module: number, scenario: string): Promise<"ok" | "locked"> {
  if (!token) return "ok";
  try {
    const res = await fetch(`${API}/api/progress/start`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ module, scenario }),
    });
    return res.status === 403 ? "locked" : "ok";
  } catch {
    return "ok";
  }
}

/* Final beat reached: save completion and the score (XP). Fire and forget. */
export async function saveCompletion(token: string | null, module: number, scenario: string, score: number): Promise<void> {
  if (!token) return;
  try {
    await fetch(`${API}/api/progress/complete`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ module, scenario, score: Math.max(0, Math.round(score)) }),
    });
  } catch {
    /* progress saving must never break the game */
  }
}
