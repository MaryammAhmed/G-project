// components/TierGate.tsx
//
// Wraps an episode page and checks: does the logged-in user's tier
// match the tier this episode is written for? If not, redirect them
// to the map instead of letting them see content meant for another
// age group. Reusable — pass the required tier, works for any episode.

"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TierGate({
  requiredTier,
  children,
}: {
  requiredTier: "A" | "B" | "C";
  children: React.ReactNode;
}) {
  const { ageGroup, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until we've actually checked localStorage (isLoading from
    // AuthContext) before deciding anything — otherwise we'd redirect
    // everyone away on the first render, before ageGroup is even read.
    if (isLoading) return;

    if (ageGroup !== requiredTier) {
      router.push("/map"); // wrong tier — send them back to pick a sector they're actually allowed in
    }
  }, [isLoading, ageGroup, requiredTier, router]);

  // While checking, or if the tier is wrong and we're about to redirect,
  // show nothing rather than flashing the real content first.
  if (isLoading || ageGroup !== requiredTier) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <p className="text-cyan font-mono text-sm">verifying clearance...</p>
      </div>
    );
  }

  return <>{children}</>;
}
