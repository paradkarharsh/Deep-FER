import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx and tailwind-merge.
 * Handles conditional classes and deduplication of conflicting utilities.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ------------------------------------------------------------------ */
/*  Emotion maps (Apple HIG — muted, desaturated palette)              */
/* ------------------------------------------------------------------ */

const EMOTION_LABELS: Record<string, string> = {
  angry: "Angry",
  disgust: "Disgust",
  fear: "Fear",
  happy: "Happy",
  neutral: "Neutral",
  sad: "Sad",
  surprise: "Surprise",
};

const EMOTION_COLORS: Record<string, string> = {
  angry: "#B35454",
  disgust: "#6B9B6B",
  fear: "#8B6BAD",
  happy: "#C8873E",
  neutral: "#8E8E93",
  sad: "#6B7FA0",
  surprise: "#C4884D",
};

const EMOTION_DESCRIPTIONS: Record<string, string> = {
  angry: "The subject appears to be expressing anger or frustration.",
  disgust: "The subject appears to be expressing disgust or distaste.",
  fear: "The subject appears to be expressing fear or anxiety.",
  happy: "The subject appears to be expressing happiness or joy.",
  neutral: "The subject appears to have a neutral or calm expression.",
  sad: "The subject appears to be expressing sadness or sorrow.",
  surprise: "The subject appears to be expressing surprise or astonishment.",
};

const EMOTION_RESPONSES: Record<string, string> = {
  angry: "Allow space and approach calmly.",
  disgust: "Acknowledge the reaction respectfully.",
  fear: "Provide reassurance and safety.",
  happy: "Maintain positive engagement.",
  neutral: "Continue with balanced interaction.",
  sad: "Offer empathy and support.",
  surprise: "Give time to process the unexpected.",
};

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

/** Format a 0-1 confidence value as a percentage string. */
export function formatConfidence(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Format milliseconds into a human-readable processing time. */
export function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/** Generate a unique identifier. */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Truncate a string and append an ellipsis. */
export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "…" : str;
}

/* ------------------------------------------------------------------ */
/*  Emotion lookups                                                    */
/* ------------------------------------------------------------------ */

export function getEmotionLabel(emotion: string): string {
  return EMOTION_LABELS[emotion.toLowerCase()] ?? emotion;
}

export function getEmotionColor(emotion: string): string {
  return EMOTION_COLORS[emotion.toLowerCase()] ?? "#8E8E93";
}

export function getEmotionDescription(emotion: string): string {
  return (
    EMOTION_DESCRIPTIONS[emotion.toLowerCase()] ?? "Unknown emotion detected."
  );
}

export function getEmotionResponse(emotion: string): string {
  return (
    EMOTION_RESPONSES[emotion.toLowerCase()] ?? "Proceed with normal interaction."
  );
}

/** Return all known emotion labels. */
export function getAllEmotions(): string[] {
  return Object.keys(EMOTION_LABELS);
}
