"use client";

/*
  app/verify-otp/page.tsx
  =======================
  THE DECRYPTION DIAL: six tumblers around a vault lock light up as you type the code.
  Right code: the dial turns emerald, the shackle opens, and you sail to the map.
  Wrong code: the dial turns red and shakes.

  LOGIC IS UNCHANGED: same /api/verify-otp and /api/resend-otp calls, same login(token, email), same /map redirect.

  WHAT CHANGED IN THIS VERSION (layout only):
    1. NO SCROLL: the page is locked to the screen height (100dvh). Every size (dial, digit boxes,
       text, spacing) uses clamp() so it shrinks smoothly on short screens and phones.
    2. NO SCROLLBAR: the white scrollbar is hidden everywhere. If a really tiny screen (like a phone
       in landscape) cannot fit everything, the card can still be swiped, but no bar is ever drawn.
    3. SYMMETRICAL BUTTON: the digit boxes and the Verify button now share the SAME width and are
       centred together, so the button lines up perfectly with the boxes. It is also a bit taller.
    4. RESPONSIVE: the digit boxes stretch to fill the row (flex-1) instead of a fixed 56px each.
*/

import { Suspense, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CyberShell from "@/components/layout/CyberShell";
import PageCompanion from "@/components/layout/PageCompanion";
import { AUTH_CSS, AuthRain } from "@/components/ui/moduleMarks";
import { API_BASE_URL } from "@/lib/api";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const CODE_LEN = 6;
const R = 48;                       // dial radius
const CIRC = 2 * Math.PI * R;       // dial circumference

/*
  FIT_CSS: everything that makes the page fit the screen.
  It is scoped under .fit-root so it cannot leak into other pages.
  (!important is used on the card only to beat the older .auth-fill-narrow rule inside AUTH_CSS.)
*/
const FIT_CSS = `
/* hide the scrollbar on the whole page (Chrome/Safari/Edge + Firefox) */
html, body { scrollbar-width: none; -ms-overflow-style: none; }
html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }

/* the card never grows taller than the screen; if it ever must scroll, the bar stays invisible */
.fit-root .auth-fill-narrow {
  width: min(100%, 30rem) !important;
  height: auto !important;
  max-height: calc(100dvh - 1.5rem) !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.fit-root .auth-fill-narrow::-webkit-scrollbar { display: none; }

/* padding and vertical rhythm shrink with the screen height */
.fit-root .fit-pad   { padding: clamp(.9rem, 2.6dvh, 2.25rem) clamp(1rem, 4vw, 2.25rem); }
.fit-root .fit-stack > * + * { margin-top: clamp(.5rem, 1.9dvh, 1.5rem); }

/* the big title scales with height too */
.fit-root .fit-title { font-size: clamp(1.25rem, 2.2dvh + .8rem, 2.1rem); line-height: 1.15; }

/* the symmetrical column: digit boxes, error, and button all share this exact width */
.fit-root .otp-col { width: 100%; max-width: 22rem; margin-inline: auto; }

/* the Verify button: full column width, centred label, a bit taller than before */
.fit-root .ax-verify {
  display: flex; align-items: center; justify-content: center; gap: .5rem;
  width: 100%;
  height: clamp(3rem, 7.5dvh, 3.75rem);
  padding: 0 1.25rem;
  border-radius: .9rem;
  font-size: clamp(.95rem, 1.2dvh + .5rem, 1.1rem);
  line-height: 1;
  text-align: center;
}

/* hide the less important bits when the screen is short */
@media (max-height: 700px) { .fit-root .fit-hide-short { display: none !important; } }
@media (max-height: 520px) { .fit-root .fit-hide-tiny  { display: none !important; } }
`;

function VerifyOtpInner() {
  const [code, setCode] = useState("");     // what the user is typing into the box
  const [error, setError] = useState("");   // holds an error message, if any

  /* UI-only state */
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);                 // true after the right code
  const [info, setInfo] = useState("");                // "new code sent" message
  const [cool, setCool] = useState(0);                 // resend cooldown (seconds)
  const [left, setLeft] = useState(300);               // code lifetime (seconds)
  const inputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();               // lets us redirect after success
  const searchParams = useSearchParams();   // reads values from the page's URL

  // Pulls "username" out of the URL, e.g. /verify-otp?username=Layla_H
  // Falls back to "" if it's somehow missing, so the page never crashes
  const username = searchParams.get("username") ?? "";

  // Your AuthContext exposes "login": it stores the token and email centrally.
  const { login } = useAuth();

  /* LAYOUT: lock the page itself so the browser never shows a page-level scrollbar.
     The old overflow values are put back when the user leaves this page. */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  /* countdown timers */
  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft((s) => Math.max(0, s - 1));
      setCool((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const color = ok ? "#34D399" : error ? "#fb4b5b" : "#22D3EE";
  const mm = String(Math.floor(left / 60)).padStart(1, "0");
  const ss = String(left % 60).padStart(2, "0");

  const submit = async () => {
    if (busy || ok) return;
    if (code.length < CODE_LEN) { setError(`Enter all ${CODE_LEN} digits.`); return; }
    setError("");
    setBusy(true);
    try {
      // Send the typed code + username to the backend for checking
      const res = await fetch(`${API_BASE_URL}/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, code }),
      });
      const data = await res.json(); // read the backend's response

      if (res.ok) {
        // Correct code: backend sent back token and email. login(...) stores both centrally.
        login(data.token, data.email);
        localStorage.setItem("username", data.username);

        setOk(true);
        window.setTimeout(() => router.push("/map"), 900); // short success animation, then into the app
      } else {
        // Wrong/expired code: show whatever message the backend gave us
        setError(typeof data.detail === "string" ? data.detail : "Invalid code");
      }
    } catch {
      setError("Could not reach the server. Is it running?");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cool > 0) return;
    setError("");
    setInfo("");
    try {
      // Just triggers a new code. The user will wait for the new email.
      await fetch(`${API_BASE_URL}/api/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      setInfo("A new code is on its way.");
      setCode("");
      setLeft(300);
      setCool(30);
      inputRef.current?.focus();
    } catch {
      setError("Could not request a new code.");
    }
  };

  return (
    <CyberShell variant="center" accent="cyan">
      {/* fit-root = the scope for all the layout rules in FIT_CSS */}
      <div className="ax-root fit-root contents">
        <style>{AUTH_CSS}</style>
        <style>{FIT_CSS}</style>
        <AuthRain words={["123456", "CODE?", "VERIFY", "2FA", "ENTER", "KEY", "SECRET", "5:00"]} />
        <PageCompanion
          mood={ok ? "safe" : error ? "breach" : "calm"}
          message={
            ok ? "Access granted. Setting sail..."
            : error ? "That code didn't work. Check your email and try again."
            : left === 0 ? "This code has expired. Request a new one."
            : "Check your email, agent. Never share this code with anyone."
          }
        />

        {/* the card: fit-pad / fit-stack replace the old fixed p-10 and space-y-7 */}
        <div className="auth-fill-narrow cg-glass ax-card ax-scan ax-in fit-pad fit-stack relative z-10 flex w-full flex-col justify-center text-center" style={{ "--c": color } as CSSProperties}>
          <div className="fit-hide-tiny flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-brick" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ms-auto text-[10px] tracking-[0.2em]" style={{ ...MONO, color }}>2-STEP CHECK</span>
          </div>

          {/* the dial: six tumblers light up as digits are typed.
              Its size follows the screen height (smaller on short screens, hidden on tiny ones). */}
          <div key={error} className={`fit-hide-tiny mx-auto aspect-square ${error ? "ax-shake" : ""}`} style={{ height: "clamp(6rem, 22dvh, 12rem)" }}>
            <svg viewBox="0 0 120 120" className="h-full w-full" role="img" aria-label={`${code.length} of ${CODE_LEN} digits entered`}>
              <circle cx="60" cy="60" r="56" fill="none" stroke={color} strokeOpacity=".2" strokeDasharray="2 6" />
              {Array.from({ length: CODE_LEN }).map((_, i) => (
                <circle key={i} cx="60" cy="60" r={R} fill="none" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${CIRC / CODE_LEN - 8} ${CIRC}`} transform={`rotate(${i * 60 - 87} 60 60)`} style={{ stroke: i < code.length || ok ? color : "rgba(255,255,255,.12)", transition: "stroke .25s" }} />
              ))}
              <g style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
                <path d="M46 56 V46 a14 14 0 0 1 28 0 V56" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" style={{ transform: `translateY(${ok ? -9 : 0}px)`, transition: "transform .4s" }} />
                <rect x="40" y="55" width="40" height="32" rx="7" fill="#0b1018" stroke={color} strokeWidth="4" />
                <circle cx="60" cy="68" r="4.5" fill={color} /><rect x="58.5" y="70" width="3" height="9" fill={color} />
              </g>
            </svg>
          </div>

          <div>
            <p className="cg-kicker fit-hide-short mb-1">{"// VERIFY YOUR IDENTITY"}</p>
            <h1 className="cg-title fit-title font-bold" style={{ color }}>Enter the code sent to your email</h1>
            <p className="mt-1 text-xs text-text-secondary font-hud">
              {left > 0 ? <>Code expires in <span style={{ color }}>{mm}:{ss}</span></> : <span className="text-brick">Code expired. Request a new one.</span>}
            </p>
          </div>

          {/* six digit boxes; one invisible real input sits on top, so typing, pasting and mobile keyboards all work.
              otp-col gives the row the SAME width as the button below, so everything lines up. */}
          <div className="otp-col relative flex" style={{ gap: "clamp(.25rem, 1.8vw, .5rem)" }} onClick={() => inputRef.current?.focus()}>
            {Array.from({ length: CODE_LEN }).map((_, i) => {
              const filled = i < code.length;
              const active = i === code.length && !ok;
              return (
                <div
                  key={i}
                  className="grid min-w-0 flex-1 place-items-center rounded-xl border-2 font-bold transition"
                  style={{
                    ...MONO,
                    height: "clamp(2.9rem, 9dvh, 4.5rem)",          /* box height follows screen height */
                    fontSize: "clamp(1.4rem, 3.6dvh + .3rem, 2.25rem)",
                    borderColor: active ? color : filled ? `${color}99` : "rgba(255,255,255,.15)",
                    background: filled ? `${color}12` : "rgba(7,7,17,.6)",
                    boxShadow: active ? `0 0 14px ${color}55` : "none",
                  }}
                >
                  {filled ? code[i] : active ? <span className="ax-blink" style={{ color }}>_</span> : ""}
                </div>
              );
            })}
            <input
              ref={inputRef}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LEN)); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              maxLength={CODE_LEN}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              aria-label={`${CODE_LEN}-digit code`}
              className="absolute inset-0 h-full w-full cursor-text opacity-0"
            />
          </div>

          {error && <p className="otp-col ax-in rounded-lg border border-brick/50 bg-brick/10 px-3 py-2 text-xs text-brick" style={MONO} role="alert">&#10005; {error}</p>}
          {info && !error && <p className="otp-col ax-in text-xs text-emerald-300" style={MONO} role="status">&#10003; {info}</p>}

          {/* the Verify button: same width as the digit row (otp-col), centred label, a bit taller (ax-verify) */}
          <div className="otp-col">
            <button onClick={submit} disabled={busy || ok} className="cg-btn ax-verify font-hud uppercase font-bold tracking-wider disabled:cursor-wait disabled:opacity-60">
              {ok ? "ACCESS GRANTED" : busy ? "VERIFYING..." : "Verify"}
            </button>
          </div>

          <button onClick={resend} disabled={cool > 0} className="text-xs text-text-secondary underline disabled:no-underline disabled:opacity-60" style={MONO}>
            {cool > 0 ? `Resend code in ${cool}s` : "Resend code"}
          </button>
        </div>
      </div>
    </CyberShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading…
      </main>
    }>
      <VerifyOtpInner />
    </Suspense>
  );
}
