/*
  lib/mission/audio.ts
  ====================
  ALL the sound of the game, made with the browser's built-in Web Audio.
  There are NO audio files to download or license. Everything is generated:
    - sound effects : chime, buzz, evil laugh, virus zap, phone vibrate...
    - music         : a different looping track for each scene

  Browsers refuse to play sound until the player has clicked something.
  ensureAudio() is called from a click, which "unlocks" the sound.

  Want real music later? Put .mp3 files in /public/audio and swap
  startMusic() for an <audio> element. The rest of the game won't change.
*/

/* One music track per scene (the same names the visuals use). */
export type SceneKey = "room" | "network" | "arena" | "lab" | "phone" | "sealed";

let ctx: AudioContext | null = null;

/* Creates the audio system on first use and wakes it up if the browser paused it. */
export function ensureAudio(): AudioContext | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null; // sound is a bonus, it must never break the game
  }
}

/* ------------------------------------------------------------------
   BUILDING BLOCKS
   ------------------------------------------------------------------ */

/* One musical note / beep with a soft fade-in and fade-out. */
function tone(
  freq: number,
  at: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.06,
  dest?: AudioNode,
  attack = 0.005
) {
  const c = ensureAudio();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + at;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); // fade out = no clicking
  osc.connect(gain);
  gain.connect(dest ?? c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/* A short burst of static, used for the "pop" when the virus dies. */
function noise(at: number, dur: number, vol = 0.08) {
  const c = ensureAudio();
  if (!c) return;
  const size = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, size, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
  const src = c.createBufferSource();
  const gain = c.createGain();
  src.buffer = buffer;
  gain.gain.value = vol;
  src.connect(gain);
  gain.connect(c.destination);
  src.start(c.currentTime + at);
}

/* A pitch that slides, used for the zap. */
function sweep(from: number, to: number, at: number, dur: number, type: OscillatorType, vol: number) {
  const c = ensureAudio();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const t0 = c.currentTime + at;
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/* One "ha!" of the evil laugh: a buzzy tone that drops in pitch, through a
   filter that makes it sound a little like a voice. */
function ha(at: number, base: number, dur = 0.14) {
  const c = ensureAudio();
  if (!c) return;
  const osc = c.createOscillator();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();
  const t0 = c.currentTime + at;
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(base, t0);
  osc.frequency.exponentialRampToValueAtTime(base * 0.6, t0 + dur);
  filter.type = "bandpass";
  filter.frequency.value = 750;
  filter.Q.value = 2.2;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(0.16, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/* ------------------------------------------------------------------
   SOUND EFFECTS
   ------------------------------------------------------------------ */
export type SfxKind = "good" | "bad" | "tick" | "unlock" | "win" | "laugh" | "zap" | "buzz";

export function sfx(kind: SfxKind) {
  if (!ensureAudio()) return;
  switch (kind) {
    case "good": // happy two-note chime
      tone(520, 0, 0.12);
      tone(780, 0.1, 0.2);
      break;
    case "bad": // low sad buzz
      tone(160, 0, 0.28, "sawtooth", 0.05);
      tone(120, 0.16, 0.3, "sawtooth", 0.05);
      break;
    case "tick": // tiny click when a clue opens
      tone(900, 0, 0.05, "square", 0.025);
      break;
    case "unlock": // rising "task unlocked"
      tone(440, 0, 0.1);
      tone(660, 0.1, 0.1);
      tone(990, 0.2, 0.22);
      break;
    case "win": // victory arpeggio
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3));
      break;
    case "laugh": // the malware laughing: HA HA HA HA
      ha(0, 340);
      ha(0.2, 320);
      ha(0.4, 300);
      ha(0.62, 260, 0.26);
      break;
    case "zap": // the virus is destroyed
      sweep(1400, 70, 0, 0.35, "sawtooth", 0.07);
      noise(0.28, 0.25, 0.1);
      break;
    case "buzz": // phone vibrating with the alert
      [0, 0.18, 0.36].forEach((t) => tone(140, t, 0.11, "square", 0.05));
      tone(1200, 0.5, 0.08, "sine", 0.05);
      tone(900, 0.6, 0.12, "sine", 0.05);
      break;
  }
}

/* ------------------------------------------------------------------
   MUSIC: one looping track per scene.
   Each track = a chord progression (pad), an optional bass and an arpeggio.
   Chords are written as "semitones away from A4 (440 Hz)".
   ------------------------------------------------------------------ */
const hz = (semi: number) => 440 * Math.pow(2, semi / 12);

interface Track {
  bpm: number;
  wave: OscillatorType;
  chords: number[][]; // the progression, one chord per bar
  bass: "off" | "slow" | "pulse";
  arp: boolean;
  vol: number;
}

const TRACKS: Record<SceneKey, Track> = {
  // Maya's room: calm and a bit lonely, like lo-fi. Am - F - C - G
  room: { bpm: 72, wave: "triangle", chords: [[-12, -9, -5], [-16, -12, -9], [-9, -5, -2], [-14, -10, -7]], bass: "slow", arp: true, vol: 0.9 },
  // The network: tense, a low drone with a ticking pulse. Dm - Dm - Bb - A
  network: { bpm: 96, wave: "sine", chords: [[-19, -12, -8], [-19, -12, -8], [-23, -16, -12], [-24, -17, -12]], bass: "pulse", arp: false, vol: 1 },
  // The arena: urgent and driving. Am - Am - F - E
  arena: { bpm: 128, wave: "sawtooth", chords: [[-24, -12, -9], [-24, -12, -9], [-28, -16, -12], [-29, -17, -13]], bass: "pulse", arp: true, vol: 0.55 },
  // The lab: curious and light. C - Am - F - G
  lab: { bpm: 100, wave: "triangle", chords: [[-9, -5, -2], [-12, -9, -5], [-16, -12, -9], [-14, -10, -7]], bass: "slow", arp: true, vol: 0.9 },
  // The phone: upbeat and techy. F - G - Am - C
  phone: { bpm: 112, wave: "square", chords: [[-16, -12, -9], [-14, -10, -7], [-12, -9, -5], [-9, -5, -2]], bass: "pulse", arp: true, vol: 0.4 },
  // Sealed: warm and triumphant. C - G - Am - F
  sealed: { bpm: 88, wave: "triangle", chords: [[-9, -5, -2], [-14, -10, -7], [-12, -9, -5], [-16, -12, -9]], bass: "slow", arp: true, vol: 1 },
};

let musicGain: GainNode | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;

/* Fades the current track out and stops it. */
export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  const c = ctx;
  const g = musicGain;
  musicGain = null;
  if (c && g) {
    g.gain.cancelScheduledValues(c.currentTime);
    g.gain.setValueAtTime(g.gain.value, c.currentTime);
    g.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.6);
    setTimeout(() => g.disconnect(), 800);
  }
}

/* Starts the loop for a scene (and fades out whatever was playing). */
export function startMusic(scene: SceneKey) {
  stopMusic();
  const c = ensureAudio();
  if (!c) return;
  const track = TRACKS[scene];

  if (!track) {
    // scene isn't in TRACKS — either a typo or a new scene we haven't defined yet
    console.warn("[audio] startMusic: no track for scene", scene);
    return;
  }

  const master = c.createGain();
  master.gain.setValueAtTime(0.0001, c.currentTime);
  master.gain.linearRampToValueAtTime(0.5 * track.vol, c.currentTime + 1.2);
  master.connect(c.destination);
  musicGain = master;
  // ...rest unchanged

  const stepSec = 60 / track.bpm / 2; // one step = an eighth note
  let step = 0;

  const play = () => {
    const bar = Math.floor(step / 8) % track.chords.length;
    const chord = track.chords[bar];
    const inBar = step % 8;

    // PAD: the whole chord, held for the full bar
    if (inBar === 0) {
      chord.forEach((s) => tone(hz(s), 0, stepSec * 8, track.wave, 0.07, master, 0.5));
    }
    // BASS: one low note, slow (every other step) or pulsing (every step)
    if (track.bass === "pulse" || (track.bass === "slow" && inBar % 4 === 0)) {
      tone(hz(chord[0] - 12), 0, stepSec * 0.9, "sine", 0.16, master, 0.01);
    }
    // ARPEGGIO: the chord notes one by one, an octave higher
    if (track.arp && inBar % 2 === 1) {
      tone(hz(chord[(inBar >> 1) % chord.length] + 12), 0, stepSec * 1.6, "triangle", 0.05, master, 0.01);
    }
    step++;
  };

  play();
  musicTimer = setInterval(play, stepSec * 1000);
}
