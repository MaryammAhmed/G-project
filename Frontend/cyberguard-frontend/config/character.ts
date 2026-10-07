/*
  CHARACTER CONFIG
  ----------------
  Plain data about the main character, kept in one place so that
  changing her name or images later means editing ONE file.
  A .ts file holds data and types only: no JSX, no CSS.
*/

// The moods the character can show. Each mood has its own image.
export type CharacterMood = "idle" | "talking" | "alert";

// Her name. Change it here once and use it everywhere.
export const CHARACTER_NAME = "Maya";

// Mood -> image file inside /public/characters/
// All three files must exist and have transparent backgrounds.
export const characterImages: Record<CharacterMood, string> = {
  idle: "/characters/maya-idle.png",
  talking: "/characters/maya-talking.png",
  alert: "/characters/maya-alert.png",
};
