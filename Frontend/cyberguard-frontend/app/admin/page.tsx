"use client"; // Next.js: this page runs in the browser (it uses state, effects and localStorage)

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

// useState    -> stores values that, when changed, re-render the page
// useEffect   -> runs code at certain moments (here: once when the page opens)
// useCallback -> remembers a function so it isn't re-created on every render
import { useCallback, useEffect, useState } from "react";
import Link from "next/link"; // client-side navigation between pages
import { useRouter } from "next/navigation"; // lets us redirect from code (e.g. to /login)
import CyberShell from "@/components/layout/CyberShell"; // your page frame/background
import { TerminalHeader } from "@/components/ui/CyberInteractive"; // the fake terminal title bar
import { API_BASE_URL } from "@/lib/api"; // backend address, kept in one place
import { useT } from "@/context/LanguageContext";

const API = API_BASE_URL; // short alias used when building request URLs

// Style object applied via style={MONO} to give text the monospace "hacker" font
const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* ---------- TYPES (TypeScript: describe the shape of the data) ---------- */

// One row in the users table, as returned by GET /api/admin/users
type UserRow = {
  id: number;
  username: string;
  email: string | null; // can be missing, so it may be null
  is_admin: boolean;
  modules_completed: number; // how many of the 4 realms they finished
};

// One user's detailed progress, as returned by GET /api/admin/users/{id}/progress
type Snap = {
  modules: { module: number; completed: boolean; levels_done: number }[];
  total_score: number;
};

export default function AdminPage() {
  const router = useRouter(); // used to redirect to /login if there is no token
  const t = useT();

  /* ---------- STATE (the page's memory) ---------- */
  const [loading, setLoading] = useState<boolean>(true); // true while the user list loads
  const [denied, setDenied] = useState<boolean>(false); // true if user is not an admin / request failed
  const [users, setUsers] = useState<UserRow[]>([]); // the list shown in the table
  const [openId, setOpenId] = useState<number | null>(null); // which user's progress panel is open
  const [snap, setSnap] = useState<Snap | null>(null); // the progress data of that user
  const [notice, setNotice] = useState<string>(""); // yellow message box (e.g. "User deleted")
  const [busyId, setBusyId] = useState<number | null>(null); // which user is being deleted right now

  /* ---------- LOAD: check admin rights, then fetch the user list ---------- */
  const load = useCallback(
    function () {
      // The login token is saved in the browser; it proves who the user is
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login"); // not logged in -> go to login
        return;
      }

      // STEP 1: ask the server about the current user (does it have is_admin = true?)
      fetch(API + "/api/progress", { headers: { Authorization: "Bearer " + token } })
        .then(function (res) {
          return res.ok ? res.json() : null; // parse JSON, or null if the request failed
        })
        // STEP 2: if not admin -> show "Admin only"; otherwise request the users list
        .then(function (me) {
          if (!me || !me.is_admin) {
            setDenied(true);
            setLoading(false);
            return null; // null tells the next .then() to stop
          }
          return fetch(API + "/api/admin/users", {
            headers: { Authorization: "Bearer " + token },
          });
        })
        // STEP 3: turn the users response into JSON
        .then(function (res) {
          if (!res) return null; // previous step stopped (not admin)
          if (!res.ok) throw new Error("admin list failed"); // jumps to .catch below
          return res.json();
        })
        // STEP 4: save the users in state so the table renders
        .then(function (data) {
          if (data) {
            setUsers(data.users || []);
          }
          setLoading(false);
        })
        // Any error in the chain -> treat as denied
        .catch(function () {
          setDenied(true);
          setLoading(false);
        });
    },
    [router]
  );

  // Run load() once when the page first opens
  useEffect(
    function () {
      load();
    },
    [load]
  );

  /* ---------- VIEW PROGRESS: fetch one user's detailed progress ---------- */
  function viewProgress(id: number) {
    const token = localStorage.getItem("token");
    setOpenId(id); // open the progress panel for this user
    setSnap(null); // clear old data so "Loading..." shows
    fetch(API + "/api/admin/users/" + id + "/progress", {
      headers: { Authorization: "Bearer " + token },
    })
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (data) {
        setSnap(data); // store the progress to display it
      })
      .catch(function () {
        setSnap(null);
      });
  }

  /* ---------- DELETE USER ---------- */
  function removeUser(u: UserRow) {
    // Browser confirmation popup; if admin clicks Cancel we stop here
    if (!window.confirm(t("admin.confirmDelete", { username: u.username }))) return;

    const token = localStorage.getItem("token");
    setBusyId(u.id); // disables that row's delete button and shows "..."

    fetch(API + "/api/admin/users/" + u.id, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    })
      .then(function (res) {
        if (!res.ok) throw new Error("delete failed");
        setNotice(t("admin.deleted", { username: u.username }));
        // Remove the deleted user from the table without reloading the page
        setUsers(function (rows) {
          return rows.filter(function (r) {
            return r.id !== u.id;
          });
        });
        // If that user's progress panel was open, close it
        if (openId === u.id) {
          setOpenId(null);
          setSnap(null);
        }
      })
      .catch(function () {
        setNotice(t("admin.deleteFailed"));
      })
      .finally(function () {
        setBusyId(null); // re-enable buttons whether it worked or not
      });
  }

  /* ---------- "ACCESS DENIED" SCREEN (shown to non-admins) ---------- */
  if (denied) {
    return (
      <CyberShell variant="app" accent="brick">
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-red-500/40 bg-[#0c0e22] p-6 text-center">
          <p className="text-[10px] font-bold tracking-[0.3em] text-red-300" style={MONO}>
            {t("admin.restricted")}
          </p>
          <h1 className="mt-2 text-lg font-bold text-white">{t("admin.adminOnly")}</h1>
          <p className="mt-1 text-xs text-slate-400">{t("admin.noClearance")}</p>
          <Link
            href="/map"
            className="mt-4 inline-block rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-cyan-500"
            style={MONO}
          >
            {t("admin.backToMap")}
          </Link>
        </div>
      </CyberShell>
    );
  }

  /* ---------- MAIN ADMIN SCREEN ---------- */
  return (
    <CyberShell variant="app" accent="amber">
      {/* Terminal-style title bar with a MAP button on the right */}
      <TerminalHeader
        title={t("admin.header")}
        right={
          <Link
            href="/map"
            className="rounded-full border border-amber-300/40 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-amber-100 hover:border-amber-200"
            style={MONO}
          >
            {t("admin.map")}
          </Link>
        }
      />

      {/* The big dark card that holds everything */}
      {/* max-w-5xl = the card can grow up to ~64rem wide (was max-w-3xl = ~48rem).
       This is what removes the sideways scrollbar on desktop. */}
        <div className="mx-auto mt-6 max-w-5xl rounded-2xl border border-white/10 bg-[#0c0e22]/90 p-4 sm:p-6">
        <p className="text-[10px] font-bold tracking-[0.3em] text-amber-300" style={MONO}>
          {t("admin.kicker")}
        </p>
        <h1 className="mt-1 text-xl font-bold text-white">{t("admin.title")}</h1>
        <p className="mt-1 text-xs text-slate-400">
          {t("admin.intro")}
        </p>

        {/* Yellow message box, only rendered when `notice` is not empty */}
        {notice && (
          <p
            className="mt-3 rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs text-amber-200"
            role="status"
          >
            {notice}
          </p>
        )}

        {/* While loading show text, otherwise show the table */}
        {loading ? (
          <p className="mt-6 text-xs text-slate-400" style={MONO}>
            {t("admin.loadingRoster")}
          </p>
        ) : (
          // overflow-x-auto = FIX #3: on very narrow screens the table scrolls sideways
          // instead of squeezing the buttons. rounded + border keeps the card look.
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-start text-xs">
              {/* ----- Table header ----- */}
              <thead>
                <tr className="bg-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-400" style={MONO}>
                  {/* whitespace-nowrap = FIX #4: headers stay on ONE line (no more "REALMS / DONE") */}
                  <th className="whitespace-nowrap px-3 py-2">{t("admin.colAgent")}</th>
                  <th className="whitespace-nowrap px-3 py-2">{t("admin.colEmail")}</th>
                  <th className="whitespace-nowrap px-3 py-2">{t("admin.colRealms")}</th>
                  <th className="whitespace-nowrap px-3 py-2 text-end">{t("admin.colActions")}</th>
                </tr>
              </thead>

              {/* ----- Table body: one row per user ----- */}
              <tbody>
                {users.map(function (u) {
                  return (
                    // key = unique id so React can track each row efficiently
                    <tr key={u.id} className="border-t border-white/5">
                      {/* Username + ADMIN badge if the user is an admin */}
                      <td className="px-3 py-2 font-bold text-white">
                        {u.username}
                        {u.is_admin && (
                          <span className="ms-2 rounded bg-amber-300/20 px-1 text-[9px] text-amber-200" style={MONO}>
                            {t("admin.adminBadge")}
                          </span>
                        )}
                      </td>

                      {/* Email, or a dash if there is none.
                          FIX #5: a real "—" character. The old "&mdash;" showed as literal text
                          because HTML entities don't work inside JavaScript strings. */}
                      {/* break-all on small screens lets a long email wrap onto a second line instead of
                      stretching the table; sm:break-normal turns that off on bigger screens
                      where there is enough room to show the email on one line. */}
                      <td className="break-all px-3 py-2 text-slate-400 sm:break-normal" dir="ltr">{u.email || "—"}</td>
                      {/* How many realms (modules) the user completed, out of 4 */}
                      <td className="whitespace-nowrap px-3 py-2 text-slate-300"><span dir="ltr">{u.modules_completed} / 4</span></td>

                      {/* ACTIONS CELL
                          whitespace-nowrap = text inside can never wrap to a new line.
                          The flex <div> is the main FIX #1: it puts both buttons in ONE row,
                          justify-end pushes them to the right, gap-2 adds space between them.
                          (The flex goes on a <div> inside the <td>, not on the <td> itself,
                          because making a <td> flex would break the table layout.) */}
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          {/* PROGRESS button: opens the detail panel below the table */}
                          <button
                            onClick={function () {
                              viewProgress(u.id);
                            }}
                            className="whitespace-nowrap rounded border border-cyan-300/40 px-2 py-1 text-[10px] font-bold tracking-widest text-cyan-100 hover:border-cyan-200"
                            style={MONO}
                          >
                            {t("admin.progress")}
                          </button>

                          {/* DELETE button: disabled and shows "..." while this user is being deleted */}
                          <button
                            onClick={function () {
                              removeUser(u);
                            }}
                            disabled={busyId === u.id}
                            className="whitespace-nowrap rounded border border-red-400/40 px-2 py-1 text-[10px] font-bold tracking-widest text-red-200 hover:border-red-300 disabled:opacity-50"
                            style={MONO}
                          >
                            {busyId === u.id ? "..." : t("admin.delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ----- PROGRESS DETAIL PANEL: only shown after clicking PROGRESS on a user ----- */}
        {openId !== null && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-[10px] font-bold tracking-[0.25em] text-slate-400" style={MONO}>
              {t("admin.progressDetail")}
            </p>

            {/* No data yet -> still fetching */}
            {!snap && <p className="mt-2 text-xs text-slate-400">{t("admin.loading")}</p>}

            {/* Data arrived -> list each realm and the total score */}
            {snap && (
              <div className="mt-2 space-y-1">
                {snap.modules.map(function (mod) {
                  return (
                    <p key={mod.module} className="text-xs text-slate-300" style={MONO}>
                      {t("admin.realmLine", { n: mod.module, status: mod.completed ? t("admin.complete") : t("admin.levelsDone", { done: mod.levels_done }) })}
                    </p>
                  );
                })}
                <p className="pt-1 text-xs font-bold text-amber-200" style={MONO}>
                  {t("admin.totalScore", { score: snap.total_score })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </CyberShell>
  );
}