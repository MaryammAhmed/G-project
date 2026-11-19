"use client";

/*
  app/admin/page.tsx
  ==================
  ADMIN CONSOLE: the manage-users and view-progress use cases from the
  report, finally reachable from the product. The backend endpoints existed;
  nothing in the browser called them. This page wires them up:

    GET    /api/admin/users                 list every user + progress summary
    GET    /api/admin/users/{id}/progress   one user full progress snapshot
    DELETE /api/admin/users/{id}            remove a user (their rows cascade)

  Access is server-enforced (get_current_admin). The page also checks the
  is_admin flag from /api/progress so non-admins never see the console.
*/

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CyberShell from "@/components/layout/CyberShell";
import { TerminalHeader } from "@/components/ui/CyberInteractive";
import { API_BASE_URL } from "@/lib/api";

const API = API_BASE_URL;
const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

type UserRow = {
  id: number;
  username: string;
  email: string | null;
  is_admin: boolean;
  modules_completed: number;
};

type Snap = {
  modules: { module: number; completed: boolean; levels_done: number }[];
  total_score: number;
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [denied, setDenied] = useState<boolean>(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [snap, setSnap] = useState<Snap | null>(null);
  const [notice, setNotice] = useState<string>("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(function () {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch(API + "/api/progress", { headers: { Authorization: "Bearer " + token } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (me) {
        if (!me || !me.is_admin) { setDenied(true); setLoading(false); return null; }
        return fetch(API + "/api/admin/users", { headers: { Authorization: "Bearer " + token } });
      })
      .then(function (res) {
        if (!res) return null;
        if (!res.ok) throw new Error("admin list failed");
        return res.json();
      })
      .then(function (data) {
        if (data) { setUsers(data.users || []); }
        setLoading(false);
      })
      .catch(function () {
        setDenied(true);
        setLoading(false);
      });
  }, [router]);

  useEffect(function () { load(); }, [load]);

  function viewProgress(id: number) {
    const token = localStorage.getItem("token");
    setOpenId(id);
    setSnap(null);
    fetch(API + "/api/admin/users/" + id + "/progress", { headers: { Authorization: "Bearer " + token } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { setSnap(data); })
      .catch(function () { setSnap(null); });
  }

  function removeUser(u: UserRow) {
    if (!window.confirm("Delete " + u.username + " and all their progress? This cannot be undone.")) return;
    const token = localStorage.getItem("token");
    setBusyId(u.id);
    fetch(API + "/api/admin/users/" + u.id, { method: "DELETE", headers: { Authorization: "Bearer " + token } })
      .then(function (res) {
        if (!res.ok) throw new Error("delete failed");
        setNotice("User " + u.username + " deleted.");
        setUsers(function (rows) { return rows.filter(function (r) { return r.id !== u.id; }); });
        if (openId === u.id) { setOpenId(null); setSnap(null); }
      })
      .catch(function () { setNotice("Could not delete that user."); })
      .finally(function () { setBusyId(null); });
  }

  if (denied) {
    return (
      <CyberShell variant="app" accent="brick">
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-red-500/40 bg-[#0c0e22] p-6 text-center">
          <p className="text-[10px] font-bold tracking-[0.3em] text-red-300" style={MONO}>{"// ACCESS RESTRICTED"}</p>
          <h1 className="mt-2 text-lg font-bold text-white">Admin only</h1>
          <p className="mt-1 text-xs text-slate-400">Your account does not have administrator clearance.</p>
          <Link href="/map" className="mt-4 inline-block rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-cyan-500" style={MONO}>Back to map</Link>
        </div>
      </CyberShell>
    );
  }

  return (
    <CyberShell variant="app" accent="amber">
      <TerminalHeader title="CONTROL ROOM" right={
        <Link href="/map" className="rounded-full border border-amber-300/40 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-amber-100 hover:border-amber-200" style={MONO}>MAP</Link>
      } />

      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/10 bg-[#0c0e22]/90 p-4 sm:p-6">
        <p className="text-[10px] font-bold tracking-[0.3em] text-amber-300" style={MONO}>{"// ADMINISTRATOR"}</p>
        <h1 className="mt-1 text-xl font-bold text-white">Control Room</h1>
        <p className="mt-1 text-xs text-slate-400">
          Manage players and inspect their progress. Deleting a user also deletes their progress (GDPR erasure).
        </p>

        {notice && (
          <p className="mt-3 rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs text-amber-200" role="status">{notice}</p>
        )}

        {loading ? (
          <p className="mt-6 text-xs text-slate-400" style={MONO}>LOADING ROSTER...</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-400" style={MONO}>
                  <th className="px-3 py-2">Agent</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Realms done</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(function (u) {
                  return (
                    <tr key={u.id} className="border-t border-white/5">
                      <td className="px-3 py-2 font-bold text-white">
                        {u.username}
                        {u.is_admin && <span className="ml-2 rounded bg-amber-300/20 px-1 text-[9px] text-amber-200" style={MONO}>ADMIN</span>}
                      </td>
                      <td className="px-3 py-2 text-slate-400">{u.email || "&mdash;"}</td>
                      <td className="px-3 py-2 text-slate-300">{u.modules_completed} / 4</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={function () { viewProgress(u.id); }}
                          className="mr-2 rounded border border-cyan-300/40 px-2 py-1 text-[10px] font-bold tracking-widest text-cyan-100 hover:border-cyan-200" style={MONO}
                        >
                          PROGRESS
                        </button>
                        <button
                          onClick={function () { removeUser(u); }}
                          disabled={busyId === u.id}
                          className="rounded border border-red-400/40 px-2 py-1 text-[10px] font-bold tracking-widest text-red-200 hover:border-red-300 disabled:opacity-50" style={MONO}
                        >
                          {busyId === u.id ? "..." : "DELETE"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {openId !== null && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-[10px] font-bold tracking-[0.25em] text-slate-400" style={MONO}>{"// PROGRESS DETAIL"}</p>
            {!snap && <p className="mt-2 text-xs text-slate-400">Loading...</p>}
            {snap && (
              <div className="mt-2 space-y-1">
                {snap.modules.map(function (mod) {
                  return (
                    <p key={mod.module} className="text-xs text-slate-300" style={MONO}>
                      Realm {mod.module}: {mod.completed ? "COMPLETE" : mod.levels_done + "/5 levels"}
                    </p>
                  );
                })}
                <p className="pt-1 text-xs font-bold text-amber-200" style={MONO}>Total score: {snap.total_score} XP</p>
              </div>
            )}
          </div>
        )}
      </div>
    </CyberShell>
  );
}
