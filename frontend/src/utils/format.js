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

// ---------- Dates ----------
// The backend returns ISO strings (with a timezone for event times).

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});
const dayFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const fullFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const toDate = (value) => (value instanceof Date ? value : new Date(value));

export const formatTime = (value) => timeFmt.format(toDate(value));
export const formatDay = (value) => dayFmt.format(toDate(value));
export const formatFullDate = (value) => fullFmt.format(toDate(value));

export function formatRange(start, end) {
  const s = toDate(start);
  const e = toDate(end);
  const sameDay = s.toDateString() === e.toDateString();
  return sameDay
    ? `${formatDay(s)} · ${formatTime(s)} – ${formatTime(e)}`
    : `${formatDay(s)} ${formatTime(s)} – ${formatDay(e)} ${formatTime(e)}`;
}

export function dateParts(value) {
  const d = toDate(value);
  return {
    day: d.getDate(),
    month: d.toLocaleString("en-IN", { month: "short" }).toUpperCase(),
  };
}

export const isPast = (event) => toDate(event.end_at) < new Date();

// "just now", "5m ago", "3h ago", "2d ago", or a date
export function timeAgo(value) {
  const seconds = Math.round((Date.now() - toDate(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDay(value);
}
