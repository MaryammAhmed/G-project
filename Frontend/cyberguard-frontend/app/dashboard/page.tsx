"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useTierTheme } from "@/context/TierThemeProvider";
import Link from "next/link";

export default function Dashboard() {
  const theme = useTierTheme();

  return (
    <ProtectedRoute>
      <div className="p-8 bg-slate-950 min-h-screen text-white">
        <h1 className={`text-2xl font-bold ${theme.text}`}>
          Welcome, {theme.label}
        </h1>

        {/* This is the actual fix — the Link now lives INSIDE the
            component's return statement, where it can actually render. */}
        <Link href="/map" className="mt-4 inline-block bg-cyan text-void font-mono text-sm px-5 py-2.5 rounded">
          enter the map →
        </Link>
      </div>
    </ProtectedRoute>
  );
}
