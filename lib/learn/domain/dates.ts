import { learnConfig } from "@/lib/learn/config";

/** YYYY-MM-DD for the given instant in the configured timezone. */
export function dayKey(date: Date, timeZone: string = learnConfig.timezone): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts; // en-CA => YYYY-MM-DD
}

function toUtcMs(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `a` to `b` (b - a). */
export function diffDays(a: string, b: string): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / 86_400_000);
}

export function addDays(day: string, n: number): string {
  const d = new Date(toUtcMs(day) + n * 86_400_000);
  return d.toISOString().slice(0, 10);
}
