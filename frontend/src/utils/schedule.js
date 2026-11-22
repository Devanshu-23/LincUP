import { toDate } from "./format";

export const byStart = (a, b) => toDate(a.start_at) - toDate(b.start_at);

// Ids of events whose time range overlaps at least one other event.
// Sort by start, then sweep while tracking the latest end time seen so far.
export function findConflicts(events) {
  const sorted = [...events].sort(byStart);
  const clashing = new Set();
  let latest = null; // the event with the latest end time so far

  for (const ev of sorted) {
    if (latest && toDate(ev.start_at) < toDate(latest.end_at)) {
      clashing.add(ev.id);
      clashing.add(latest.id);
    }
    if (!latest || toDate(ev.end_at) > toDate(latest.end_at)) latest = ev;
  }
  return clashing;
}

// [{ key: "Mon Nov 17 2026", date: Date, events: [...] }, ...] in order
export function groupByDay(events) {
  const groups = new Map();
  for (const ev of [...events].sort(byStart)) {
    const date = toDate(ev.start_at);
    const key = date.toDateString();
    if (!groups.has(key)) groups.set(key, { key, date, events: [] });
    groups.get(key).events.push(ev);
  }
  return [...groups.values()];
}

export function dayLabel(date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return null;
}

// Events that overlap the given day, so a trek from 10pm to 8am is on both days.
// One that ends exactly at midnight doesn't count for the day that starts then.
export function eventsOnDay(events, date) {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return events
    .filter((e) => toDate(e.start_at) < dayEnd && toDate(e.end_at) > dayStart)
    .sort(byStart);
}
