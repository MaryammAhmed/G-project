// lib/speech.ts
//
// Thin wrapper around the browser's built-in text-to-speech (Web
// Speech API). No API key, no network call, runs entirely client-side.
// One shared function so every page sounds consistent.

export function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel(); // stop any previous line first
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
