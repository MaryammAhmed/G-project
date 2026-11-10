/*
  lib/speech.ts
  Speaks one line at a time with the Piper voice from the backend.
  The browser's robot voice is used only when the server did not return a wav.
*/

import { ensureAudio } from "@/lib/mission/audio";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const pending: string[] = [];
const cache = new Map<string, ArrayBuffer>();
let current: AudioBufferSourceNode | null = null;
let element: HTMLAudioElement | null = null;
let held: { wav: ArrayBuffer; token: number } | null = null;
let busy = false;
let generation = 0;

function unlockAudio() {
  const ctx = ensureAudio();
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

// A click has to unlock sound before the wav comes back from the server.
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointerdown",
    () => {
      unlockAudio();
      if (!held || held.token !== generation) return;
      const waiting = held;
      held = null;
      void playWav(waiting.wav.slice(0), waiting.token);
    },
    { capture: true },
  );
}

function browserSpeak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

async function fetchWav(text: string): Promise<ArrayBuffer | null> {
  const cached = cache.get(text);
  if (cached) return cached.slice(0);
  try {
    const res = await fetch(`${API}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 500) }),
    });
    if (!res.ok) return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength < 44) return null;
    cache.set(text, bytes);
    return bytes.slice(0);
  } catch {
    return null;
  }
}

function playElement(bytes: ArrayBuffer, token: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (token !== generation) {
      resolve(true);
      return;
    }
    const url = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
    const audio = new Audio(url);
    element = audio;
    const finish = (ok: boolean) => {
      URL.revokeObjectURL(url);
      if (element === audio) element = null;
      resolve(ok);
    };
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    audio.play().catch(() => finish(false));
  });
}

/** Play the Piper wav. Never substitutes the browser voice when the file itself arrived. */
async function playWav(bytes: ArrayBuffer, token: number): Promise<boolean> {
  const ctx = ensureAudio();
  if (ctx && token === generation) {
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* the audio element below is the second route */
      }
    }
    if (ctx.state === "running") {
      try {
        const decoded = await ctx.decodeAudioData(bytes.slice(0));
        if (token !== generation) return true;
        const source = ctx.createBufferSource();
        source.buffer = decoded;
        source.connect(ctx.destination);
        current = source;
        source.start();
        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
        });
        if (current === source) current = null;
        return true;
      } catch {
        /* a bad decode still gets one try as a plain audio file */
      }
    }
  }
  return playElement(bytes, token);
}

async function drain(token: number) {
  if (busy) return;
  busy = true;
  while (pending.length && token === generation) {
    const text = pending.shift() as string;
    const wav = await fetchWav(text);
    if (token !== generation) break;
    if (!wav) {
      await browserSpeak(text);
      continue;
    }
    const played = await playWav(wav.slice(0), token);
    if (token !== generation) break;
    if (!played) held = { wav, token };
  }
  busy = false;
  if (pending.length && token === generation) drain(token);
}

/** Queue a line. A new line waits until the one already speaking finishes. */
export function speak(text: string) {
  if (typeof window === "undefined" || !text.trim()) return;
  unlockAudio();
  pending.push(text);
  drain(generation);
}

/** Stop the current line and drop the rest. Used by mute and by leaving a beat. */
export function stopSpeaking() {
  generation += 1;
  pending.length = 0;
  held = null;
  busy = false;
  if (element) {
    element.pause();
    element = null;
  }
  if (current) {
    try {
      current.stop();
    } catch {
      /* already finished */
    }
    current = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
