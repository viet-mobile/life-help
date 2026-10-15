/** Recovery tokens travel in the URL fragment, never in server request logs. */
export function recoveryToken(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const token = params.get("token_hash");
  if (params.get("type") !== "recovery" || !token || !/^[a-f0-9]{32,128}$/i.test(token)) return null;
  return token;
}
