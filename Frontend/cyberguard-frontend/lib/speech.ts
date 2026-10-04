// lib/speech.ts
//
// Tiny wrapper around the browser's built-in text-to-speech (Web Speech API).
// Runs entirely client-side without external network requests or API keys.

/**
 * Speaks the provided text using the browser's native text-to-speech engine.
 * 
 * IMPORTANT: speak() intentionally does NOT call window.speechSynthesis.cancel() 
 * before playing. The Web Speech API naturally QUEUES multiple speak() calls. 
 * If AI feedback or a mentor message is still speaking when the next beat appears, 
 * the second utterance waits its turn in queue instead of cutting off the first one. 
 * 
 * Calling cancel() before speak() causes fast-sequenced messages to abruptly 
 * terminate mid-sentence.
 */
export function speak(text: string) {
  // Guard clause: ensure code is running in a client-side browser environment with Speech API support
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  // Create a new utterance instance with the input text
  const utterance = new SpeechSynthesisUtterance(text);

  // Configure pitch and speed rate (1 is standard default)
  utterance.rate = 1;
  utterance.pitch = 1;

  // Enqueue the utterance to be spoken by the browser
  window.speechSynthesis.speak(utterance);
}

/**
 * Immediately stops all active and queued speech utterances across the app.
 * 
 * Called explicitly when a user toggles the "mute" button or navigates away 
 * from the active scenario page.
 */
export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
