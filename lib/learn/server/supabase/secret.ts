/**
 * The learning platform's trusted server key. The ONLY reader of LEARN_SUPABASE_SECRET_KEY.
 * Imported by ./service.ts (server-only) and by the server runtime; never by client code or the proxy.
 * No fallback to any generic marketplace credential name.
 */
type Env = Record<string, string | undefined>;

export function readLearnSecretKey(env: Env = process.env): string | undefined {
  const value = (env.LEARN_SUPABASE_SECRET_KEY ?? "").trim().replace(/^(["'])(.*)\1$/, "$2");
  return value || undefined;
}
