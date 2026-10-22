// app/profile/page.tsx  (or wherever your profile route lives)
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type ModuleProgress = {
  module: number;
  scenario: string;
  completed: boolean;
  best_score: number;
  attempts: number;
  unlocked: boolean;
};

type ProgressResponse = {
  modules: ModuleProgress[];
  unlocked: number[];
  total_score: number;
};

const MODULE_META: Record<number, { icon: string; title: string }> = {
  1: { icon: "🔐", title: "The Vault" },
  2: { icon: "🎣", title: "Spot the Phish" },
  3: { icon: "🎭", title: "Social Engineering" },
  4: { icon: "🤖", title: "Safe AI" },
};

export default function ProfilePage() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch progress
    fetch(`${API}/api/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (r.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then(setProgress)
      .catch((e) => setError(String(e)));

    // Username — you may already have this in AuthContext; use it if so
    const stored = localStorage.getItem("username");
    if (stored) setUsername(stored);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "This will permanently delete your account, all progress, and all data. This cannot be undone. Continue?"
      )
    )
      return;

    setBusy(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/api/account`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setBusy(false);

    if (res.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      router.push("/login");
    } else {
      const body = await res.json().catch(() => ({}));
      alert("Delete failed: " + (body.detail || res.status));
    }
  };

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!progress) return <div className="p-6">Loading profile…</div>;

  const completedCount = progress.modules.filter((m) => m.completed).length;
  const totalAttempts = progress.modules.reduce((s, m) => s + m.attempts, 0);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">👤 {username || "Agent"}</h1>
        <p className="text-gray-500">CyberGuard profile</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Total XP" value={progress.total_score} />
        <Stat label="Modules" value={`${completedCount} / 4`} />
        <Stat label="Attempts" value={totalAttempts} />
      </div>

      {/* Module cards */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Your Modules</h2>
        {progress.modules.map((m) => {
          const meta = MODULE_META[m.module];
          const status = m.completed
            ? "✅ Completed"
            : m.unlocked
            ? "🔓 Unlocked"
            : "🔒 Locked";
          return (
            <div
              key={m.module}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">
                  {meta.icon} Module {m.module}: {meta.title}
                </div>
                <div className="text-sm text-gray-600">{status}</div>
              </div>
              <div className="text-right text-sm">
                <div>Best: {m.best_score} XP</div>
                <div className="text-gray-500">Attempts: {m.attempts}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badges (optional) */}
      {completedCount > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Badges</h2>
          <div className="flex gap-3 flex-wrap">
            {progress.modules[0]?.completed && <Badge icon="🏆" label="First Steps" />}
            {progress.modules[1]?.completed && <Badge icon="🎯" label="Sharp Eye" />}
            {progress.modules[2]?.completed && <Badge icon="🕵️" label="Trust No One" />}
            {progress.modules[3]?.completed && <Badge icon="🤖" label="AI Aware" />}
            {completedCount === 4 && <Badge icon="⭐" label="CyberGuard" />}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t">
        <button
          onClick={() => router.push("/map")}
          className="px-4 py-2 border rounded"
        >
          🔙 Back to Map
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-2 border rounded"
        >
          🚪 Logout
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="px-4 py-2 border rounded border-red-500 text-red-600 ml-auto"
        >
          {busy ? "Deleting…" : "⚠️ Delete Account"}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border rounded-lg p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function Badge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-300 rounded-full text-sm">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
