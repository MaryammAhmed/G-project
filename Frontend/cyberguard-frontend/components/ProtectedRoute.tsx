"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
// Update this path if AuthContext.tsx lives somewhere else.

// A bouncer for pages. Wrap it around a page like this:
//   <ProtectedRoute><YourPage /></ProtectedRoute>
// If nobody's logged in, it redirects to /login instead of showing the page.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  // Only decide once loading is done. Otherwise we might redirect
  // someone who's actually logged in, just because we checked too early.
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  // Show a placeholder while checking, or right before redirecting —
  // never flash real page content to someone not logged in.
  if (isLoading || !isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Redirecting to login...
      </div>
    );
  }

  // Logged in — show the real page.
  return <>{children}</>;
}
