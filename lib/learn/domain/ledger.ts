export const MAX_LEDGER_KEYS = 400;

/**
 * Keep the idempotency-key list bounded. Long-lived keys (first lesson
 * completion, one-time rewards) are always kept; per-session question keys
 * only matter while their session is live so the oldest are dropped.
 */
export function pruneLedgerKeys(keys: string[]): string[] {
  if (keys.length <= MAX_LEDGER_KEYS) return keys;
  const permanent = keys.filter((k) => k.startsWith("lesson_first:") || k.startsWith("diagnostic:"));
  const rest = keys.filter((k) => !(k.startsWith("lesson_first:") || k.startsWith("diagnostic:")));
  return [...permanent, ...rest.slice(-(MAX_LEDGER_KEYS - permanent.length))];
}

