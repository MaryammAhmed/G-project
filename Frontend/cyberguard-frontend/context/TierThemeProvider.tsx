"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

type TierTheme = {
  label: string;
  text: string;
  bg: string;
  border: string;
};

const themes: Record<string, TierTheme> = {
  A: { label: "Tier A Agent", text: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500" },
  B: { label: "Tier B Agent", text: "text-blue-400", bg: "bg-blue-500", border: "border-blue-500" },
  C: { label: "Tier C Agent", text: "text-purple-400", bg: "bg-purple-500", border: "border-purple-500" },
};

const defaultTheme: TierTheme = themes.A;

const TierThemeContext = createContext<TierTheme>(defaultTheme);

export function TierThemeProvider({ children }: { children: ReactNode }) {
  const { ageGroup } = useAuth();
  const theme = (ageGroup && themes[ageGroup]) ? themes[ageGroup] : defaultTheme;

  return (
    <TierThemeContext.Provider value={theme}>
      {children}
    </TierThemeContext.Provider>
  );
}

export function useTierTheme() {
  return useContext(TierThemeContext);
}
