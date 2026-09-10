"use client";
// Needs to run in the browser — we use localStorage below.

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// This file is a shared "notice board" for login info.
// Instead of every page checking localStorage separately,
// they all read from this one shared place.

// The shape of what the notice board holds:
type AuthContextType = {
  token: string | null;       // JWT, or null if logged out
  ageGroup: string | null;    // "A", "B", or "C"
  isLoggedIn: boolean;        // quick true/false check
  isLoading: boolean;         // true until we've checked localStorage once
  login: (token: string, ageGroup: string) => void;
  logout: () => void;
};

// Create the empty board (default values, nothing real yet).
const AuthContext = createContext<AuthContextType>({
  token: null,
  ageGroup: null,
  isLoggedIn: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

// The component that actually writes to the board.
// Wrap your whole app in this (done in layout.tsx).
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);

  // Starts true: "haven't checked localStorage yet."
  // Flips to false once the check below finishes.
  // Without this, other components might ask "logged in?" too early
  // and get a wrong "no" before we've actually looked.
  const [isLoading, setIsLoading] = useState(true);

  // Runs once on app load. localStorage survives refreshes,
  // so we check it here to restore login state after a refresh.
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedAgeGroup = localStorage.getItem("ageGroup");
    if (storedToken) setToken(storedToken);
    if (storedAgeGroup) setAgeGroup(storedAgeGroup);
    setIsLoading(false); // done checking now
  }, []);

  // Call this after a successful login/register.
  // Updates live state AND saves to localStorage.
  const login = (newToken: string, newAgeGroup: string) => {
    setToken(newToken);
    setAgeGroup(newAgeGroup);
    localStorage.setItem("token", newToken);
    localStorage.setItem("ageGroup", newAgeGroup);
  };

  // Clears everything, in memory and in localStorage.
  const logout = () => {
    setToken(null);
    setAgeGroup(null);
    localStorage.removeItem("token");
    localStorage.removeItem("ageGroup");
  };

  const isLoggedIn = !!token;

  // Broadcast all of this to every page inside {children}.
  return (
    <AuthContext.Provider value={{ token, ageGroup, isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Shortcut so pages can write useAuth() instead of useContext(AuthContext).
export function useAuth() {
  return useContext(AuthContext);
}
