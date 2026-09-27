"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function VerifyOtpPage() {
  const [code, setCode] = useState("");     // what the user is typing into the box
  const [error, setError] = useState("");   // holds an error message, if any

  const router = useRouter();               // lets us redirect after success
  const searchParams = useSearchParams();   // reads values from the page's URL

  // Pulls "username" out of the URL, e.g. /verify-otp?username=Layla_H
  // Falls back to "" if it's somehow missing, so the page never crashes
  const username = searchParams.get("username") ?? "";

  // FIXED: your AuthContext exposes "login", not "setToken" — same
  // function your register page already uses to store the token centrally
  const { login } = useAuth();

  const submit = async () => {
    // Send the typed code + username to the backend for checking
    const res = await fetch("http://127.0.0.1:8000/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, code }),
    });

    const data = await res.json(); // read the backend's response

    if (res.ok) {
      // Correct code — backend sent back a real token + age_group.
      // login(...) stores both centrally, same as a normal login would.
      login(data.token, data.age_group);
      router.push("/dashboard"); // send the user into the app
    } else {
      // Wrong/expired code — show whatever message the backend gave us
      setError(data.detail || "Invalid code");
    }
  };

  const resend = async () => {
    // Just triggers a new code — no response handling needed here,
    // the user will simply wait for a new email/terminal print
    await fetch("http://127.0.0.1:8000/api/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-xl mb-4">Enter the code sent to your email</h1>

      {/* Controlled input — "code" state updates on every keystroke */}
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
        className="text-center text-2xl tracking-widest bg-slate-900 border border-slate-700 rounded-lg p-3 mb-4"
      />

      {/* Only renders if there's an actual error message to show */}
      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

      <button onClick={submit} className="bg-emerald-500 px-4 py-2 rounded-lg font-semibold text-slate-950 mb-2">
        Verify
      </button>

      <button onClick={resend} className="text-slate-400 text-sm underline">
        Resend code
      </button>
    </div>
  );
}
