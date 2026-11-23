// API ADDRESS. Every request to the backend starts with this base URL.
// Used by lib/progress.ts (saving progress), lib/speech.ts (narrator voice)
// and by the login / register / OTP pages.
//
// Fallback for development: FastAPI running on your own computer (uvicorn default port 8000).
const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

export const API_BASE_URL = (
  // Use the environment variable when it is set (e.g. the deployed backend URL on Vercel),
  // otherwise use the local address above. Next.js only sends variables that start with
  // NEXT_PUBLIC_ to the browser, so that prefix is required.
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL
// Remove trailing slashes, so `${API_BASE_URL}/api/x` never becomes `//api/x`.
).replace(/\/+$/, "");