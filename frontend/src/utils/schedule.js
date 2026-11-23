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

const overlap = (a, b) =>
  toDate(a.start_at) < toDate(b.end_at) && toDate(b.start_at) < toDate(a.end_at);

// event id -> the other events it overlaps with
export function clashPartners(events) {
  const partners = new Map();
  const sorted = [...events].sort(byStart);
  for (let i = 0; i < sorted.length; i++) {
    // sorted by start, so once one starts after this ends, the rest do too
    for (let j = i + 1; j < sorted.length && toDate(sorted[j].start_at) < toDate(sorted[i].end_at); j++) {
      const [a, b] = [sorted[i], sorted[j]];
      partners.set(a.id, [...(partners.get(a.id) || []), b]);
      partners.set(b.id, [...(partners.get(b.id) || []), a]);
    }
  }
  return partners;
}

// The events in `plans` that `event` would overlap with
export const overlapsWith = (event, plans) =>
  plans.filter((p) => p.id !== event.id && overlap(event, p));

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

// true if two of the events overlap at some point during that day
export const hasClashOn = (events, date) => findConflicts(eventsOnDay(events, date)).size > 0;

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
