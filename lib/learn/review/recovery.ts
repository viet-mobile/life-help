/** Recovery tokens travel in the URL fragment, never in server request logs. */
export function recoveryToken(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const token = params.get("token_hash");
  if (params.get("type") !== "recovery" || !token || !/^[a-f0-9]{32,128}$/i.test(token)) return null;
  return token;
}

/** Supabase's native recovery email redirects with an authenticated session fragment. */
export function recoverySession(hash: string): { access_token: string; refresh_token: string } | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const access = params.get("access_token");
  const refresh = params.get("refresh_token");
  if (params.get("type") !== "recovery" || !access || !refresh) return null;
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(access) || !/^[A-Za-z0-9._-]+$/.test(refresh)) return null;
  return { access_token: access, refresh_token: refresh };
}
