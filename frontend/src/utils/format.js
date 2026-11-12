// Helpers for formatting and deterministic colours.

export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Community / avatar tints from the design system, picked by id so the
// same community always gets the same colour.
export const TONES = ["violet", "sage", "sky", "sun", "rose"];

export function toneFor(seed) {
  const n =
    typeof seed === "number"
      ? seed
      : String(seed)
          .split("")
          .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return TONES[Math.abs(n) % TONES.length];
}
