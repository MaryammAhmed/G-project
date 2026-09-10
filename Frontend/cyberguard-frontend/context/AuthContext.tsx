"use client";
// "use client" is required because this file uses React hooks (useState, useEffect)
// and browser APIs (localStorage) — none of that works on the server.

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ============================================================
// 1. DEFINE THE SHAPE OF OUR "BROADCAST"
// ============================================================
// This describes exactly what information/functions any page in our app
// will be able to "tune in" to via useAuth(). Think of it as a contract:
// anything using this context is guaranteed these fields will exist.
type AuthContextType = {
  token: string | null;       // The JWT(JSON Web Token) string, or null if logged out
  ageGroup: string | null;    // "A", "B", or "C" — which training tier
  isLoggedIn: boolean;        // Simple true/false, handy for UI checks
  login: (token: string, ageGroup: string) => void;  // Call this after a successful login/register
  logout: () => void;         // Call this to log the user out everywhere
};

// createContext needs a default value that matches the shape above.
// This default is only ever used if a component tries to useAuth()
// OUTSIDE of an <AuthProvider> — which shouldn't happen if we wire things
// up correctly, but TypeScript needs *something* here regardless.
const AuthContext = createContext<AuthContextType>({
  token: null,
  ageGroup: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

// ============================================================
// 2. THE PROVIDER — this is the actual "radio broadcaster"
// ============================================================
// Any component wrapped inside <AuthProvider>...</AuthProvider> gets
// access to the values below via useAuth(). We'll wrap our ENTIRE app
// with this in layout.tsx, so every page can use it.
export function AuthProvider({ children }: { children: ReactNode }) {
  // These two pieces of state live here ONCE, instead of being
  // re-read from localStorage separately on every single page.
  const [token, setToken] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);

  // On first load of the app (e.g. someone refreshes the page),
  // we need to check: "was this person already logged in before?"
  // localStorage survives page refreshes, so we read from it once,
  // right when the app starts up, and load that into our state.
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedAgeGroup = localStorage.getItem("ageGroup");
    if (storedToken) setToken(storedToken);
    if (storedAgeGroup) setAgeGroup(storedAgeGroup);
  }, []); // The empty [] means "only run this once, when the app first mounts"

  // This function is what login/page.tsx and register/page.tsx will call
  // after a successful backend response. It does two things:
  // 1. Updates our in-memory state (so the UI reacts immediately)
  // 2. Saves to localStorage (so it survives a page refresh)
  const login = (newToken: string, newAgeGroup: string) => {
    setToken(newToken);
    setAgeGroup(newAgeGroup);
    localStorage.setItem("token", newToken);
    localStorage.setItem("ageGroup", newAgeGroup);
  };

  // Clears everything, both in memory and in localStorage.
  const logout = () => {
    setToken(null);
    setAgeGroup(null);
    localStorage.removeItem("token");
    localStorage.removeItem("ageGroup");
  };

  // isLoggedIn is just a convenience — instead of every page checking
  // "is token not null and not an empty string", they can just check
  // this simple boolean.
  const isLoggedIn = !!token;

  // Provider.value is the actual "broadcast" — everything inside {}
  // becomes available to any child component that calls useAuth().
  return (
    <AuthContext.Provider value={{ token, ageGroup, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// 3. THE HOOK — this is how pages "tune in" to the broadcast
// ============================================================
// Instead of every page writing:
//   const auth = useContext(AuthContext)
// we wrap that in a small custom hook so pages can just write:
//   const { isLoggedIn, login } = useAuth()
// This is a common React pattern — it's shorter and easier to read.
export function useAuth() {
  return useContext(AuthContext);
}
