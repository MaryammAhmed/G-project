"use client"; 
// Instructs Next.js that this module is a Client Component, 
// which is required because we access browser APIs (localStorage) and React hooks (useState, useEffect).

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Defines the shape/contract of the authentication state and functions available throughout the app.
type AuthContextType = {
  token: string | null;       // JWT authentication token (null if logged out)
  ageGroup: string | null;    // User's assigned age demographic tier (e.g., "A", "B", "C")
  email: string | null;       // User's verified email address (used in scenario labs/2FA practice)
  isLoggedIn: boolean;        // Convenience boolean indicating active authentication status
  isLoading: boolean;         // Prevents premature rendering while reading state from localStorage on startup
  login: (token: string, ageGroup: string, email: string) => void;  // Updates state + localStorage on successful login
  logout: () => void;         // Clears session state and wipes browser storage
};

// Initializes the React Context with default fallback values before the provider mounts.
const AuthContext = createContext<AuthContextType>({
  token: null,
  ageGroup: null,
  email: null,
  isLoggedIn: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

// Wrapper component that stores authentication state and provides it to all child components.
export function AuthProvider({ children }: { children: ReactNode }) {
  // State variables for in-memory session data
  const [token, setToken] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  
  // Tracks initial session rehydration status to prevent flash of unauthenticated UI on page load
  const [isLoading, setIsLoading] = useState(true);

  // Runs once on initial browser load to rehydrate state from persisted browser storage (localStorage)
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedAgeGroup = localStorage.getItem("ageGroup");
    const storedEmail = localStorage.getItem("email");

    if (storedToken) setToken(storedToken);
    if (storedAgeGroup) setAgeGroup(storedAgeGroup);
    if (storedEmail) setEmail(storedEmail);

    setIsLoading(false); // Session check completed
  }, []);

  // Called after successful authentication (login/verify-otp) to store credentials in memory and persistent storage
  const login = (newToken: string, newAgeGroup: string, newEmail: string) => {
    // 1. Update active React state
    setToken(newToken);
    setAgeGroup(newAgeGroup);
    setEmail(newEmail);

    // 2. Persist to localStorage so sessions survive page refreshes
    localStorage.setItem("token", newToken);
    localStorage.setItem("ageGroup", newAgeGroup);
    localStorage.setItem("email", newEmail);
  };

  // Called on explicit logout or session termination to wipe all user session data
  const logout = () => {
    // 1. Clear active React state
    setToken(null);
    setAgeGroup(null);
    setEmail(null);

    // 2. Clear persisted items from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("ageGroup");
    localStorage.removeItem("email");
  };

  // Derived boolean helper: returns true if a token exists, false otherwise
  const isLoggedIn = !!token;

  // Exposes all context fields and actions to any descendant component inside <AuthProvider>
  return (
    <AuthContext.Provider value={{ token, ageGroup, email, isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook helper so page components can consume context easily via `useAuth()` instead of `useContext(AuthContext)`
export function useAuth() {
  return useContext(AuthContext);
}
