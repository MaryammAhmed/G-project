"use client"; // Required by Next.js when a page has interactive elements (like a form or buttons)

import { useState } from "react";
import Link from "next/link";

export default function Register() {
  // 1. THE MEMORY BOXES (State)
  // These variables remember what the user types or clicks on the screen.
  // Whenever a user types in the input box, these get updated instantly.
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [ageGroup, setAgeGroup] = useState("A"); // Automatically starts everyone in Group A

  // 2. THE HANDSHAKE (Backend Connection)
  // This function only runs when the user clicks the "Create Account" button.
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // Crucial: Stops the webpage from reloading and erasing the form!

    try {
      // The Fetch command is the bridge. It knocks on Python's door at port 8000.
      const response = await fetch("http://localhost:8000/register", {
        method: "POST", // POST means we are SENDING new data (not just reading it)
        headers: { "Content-Type": "application/json" },
        // We package up our memory boxes and translate them into a format Python understands (JSON)
        body: JSON.stringify({ 
          username: username, 
          password: password,
          ageGroup: ageGroup 
        }),
      });

      // We wait for Python to send a reply back, then unpack it
      const data = await response.json();

      // If Python gave us a thumbs up (response.ok), show the success message!
      if (response.ok) {
        alert("Success! Backend says: " + data.message);
      } else {
        alert("Registration failed!");
      }
    } catch (error) {
      // This only happens if the backend is completely turned off or broken
      alert("Could not reach the Python server. Is Uvicorn running?");
    }
  };

  // 3. THE VISUAL SHELL (UI)
  // Everything below this line is exactly what the user sees on their screen.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
      {/* Visual background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-xl">
        <h2 className="text-3xl font-bold text-center text-emerald-400">Create Account</h2>
        <p className="mt-2 text-center text-sm text-slate-400">Choose your training identity to begin</p>

        {/* When this form is submitted, it triggers our 'handleRegister' function above */}
        <form onSubmit={handleRegister} className="mt-8 space-y-6">
          
          {/* USERNAME INPUT */}
          <div>
            <label className="block text-sm font-semibold text-slate-300">Username</label>
            <input
              type="text"
              required
              value={username} // Ties this visual box to our 'username' memory box
              onChange={(e) => setUsername(e.target.value)} // Updates the memory box on every keystroke
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. Layla_H"
            />
          </div>

          {/* PASSWORD INPUT */}
          <div>
            <label className="block text-sm font-semibold text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password} // Ties this visual box to our 'password' memory box
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          {/* TRAINING TRACK BUTTONS */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Select Your Training Track</label>
            <div className="grid grid-cols-1 gap-3">
              
              {/* Group A Button */}
              <button
                type="button" // Important: type="button" prevents it from accidentally submitting the form
                onClick={() => setAgeGroup("A")} // Changes the memory box to "A"
                // The confusing code below just changes the colors if this group is currently selected
                className={`rounded-lg border p-3 text-left transition-all ${
                  ageGroup === "A"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold">Group A (Ages 16–19)</div>
                <div className="text-xs mt-1">Scenario: School exam portals, gaming accounts, social media.</div>
              </button>

              {/* Group B Button */}
              <button
                type="button"
                onClick={() => setAgeGroup("B")} // Changes the memory box to "B"
                className={`rounded-lg border p-3 text-left transition-all ${
                  ageGroup === "B"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold">Group B (Ages 20–22)</div>
                <div className="text-xs mt-1">Scenario: University portals, campus Wi-Fi, internship applications.</div>
              </button>

              {/* Group C Button */}
              <button
                type="button"
                onClick={() => setAgeGroup("C")} // Changes the memory box to "C"
                className={`rounded-lg border p-3 text-left transition-all ${
                  ageGroup === "C"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold">Group C (Ages 23–25)</div>
                <div className="text-xs mt-1">Scenario: Corporate emails, HR systems, client file security.</div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-all active:scale-95"
          >
            Create Account & Save Profile
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 underline font-semibold">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}