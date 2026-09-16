"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

// Shape of one chat message — who sent it, and what they said.
type Message = {
  role: "user" | "mentor";
  text: string;
};

export default function ChatPage() {
  // Pulled straight from AuthContext — exactly the tier your backend needs.
  const { ageGroup } = useAuth();

  // Grows as the conversation continues; starts empty.
  const [messages, setMessages] = useState<Message[]>([]);

  // Tracks what's currently typed in the text box.
  const [input, setInput] = useState("");

  // Tracks whether we're waiting on a reply, so we can show "Mentor is thinking..."
  const [loading, setLoading] = useState(false);

  // Hardcoded to 1 on purpose for now — Phase 4 will make this dynamic
  // once real scenarios exist, but there's nothing to hook it to yet.
  const currentModule = 1;

  const sendMessage = async () => {
    // Skip empty messages.
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input };

    // Add the user's own message instantly, so it appears on screen
    // without waiting for the AI to reply first.
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Same fetch pattern as your login/register pages.
      const res = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          tier: ageGroup,
          module: currentModule,
        }),
      });

      const data = await res.json();

      // Append the mentor's reply once it comes back.
      setMessages((prev) => [...prev, { role: "mentor", text: data.reply }]);
    } catch (err) {
      // Friendly fallback instead of a silent break if the fetch fails.
      setMessages((prev) => [
        ...prev,
        { role: "mentor", text: "Could not reach the mentor. Is uvicorn running?" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-slate-950 text-white p-6">
        <h1 className="text-2xl font-bold text-emerald-400 mb-4">CyberGuard AI Mentor</h1>

        <div className="flex-1 space-y-3 overflow-y-auto mb-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-lg rounded-lg p-3 ${
                msg.role === "user"
                  ? "ml-auto bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-100"
              }`}
            >
              {msg.text}
            </div>
          ))}

          {/* Short-circuit: only renders while loading is true */}
          {loading && <div className="text-slate-400 text-sm">Mentor is thinking...</div>}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={sendMessage}
            className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Send
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
