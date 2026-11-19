"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TakeoverBattle from "@/components/mission/TakeoverBattle";
import { useAuth } from "@/context/AuthContext";
import { fetchProgress, finaleStatus } from "@/lib/progress";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export default function TakeoverPage() {
  const { token } = useAuth();
  const [gate, setGate] = useState<"check" | "ok" | "locked">("check");
  const [won, setWon] = useState(false);

  useEffect(() => {
    fetchProgress(token).then((snap) => {
      const status = finaleStatus(snap);
      setWon(status === "completed");
      setGate(status === "locked" ? "locked" : "ok");
    });
  }, [token]);

  if (gate === "check") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070711] text-xs tracking-[0.3em] text-[#b8b5c9]" style={MONO}>
        CHECKING CLEARANCE...
      </div>
    );
  }

  if (gate === "locked") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070711] p-6 text-[#f5f3ff]">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/15 bg-[#111329] p-6 text-center">
          <h1 className="text-2xl font-bold" style={MONO}>FINALE LOCKED</h1>
          <p className="text-sm text-[#b8b5c9]">Finish all four realms first. Then the rogue AI opens the last fight.</p>
          <Link href="/map" className="inline-block rounded-xl bg-[#fb4b5b] px-6 py-3 text-sm font-semibold text-[#070711]">
            Back to map
          </Link>
        </div>
      </div>
    );
  }

  return <TakeoverBattle token={token} alreadyWon={won} />;
}
