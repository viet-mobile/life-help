/**
 * Reads a PostgREST RPC response. A function that RETURNS void answers with an empty successful body (HTTP 204, or 200 with no content),
 * a function that returns a value answers with JSON. The caller says which it expects:
 *   default       a value is required: an empty success is an error (e.g. learn_grant_entitlement must hand back the new id)
 *   allowEmpty    an empty success is fine and yields null (e.g. learn_revoke_entitlement returns void)
 * A non-empty body must be valid JSON; a malformed one is an error, never swallowed. Errors name the function and the HTTP status only.
 */
export async function readRpc(res: Response, fn: string, opts: { allowEmpty?: boolean } = {}): Promise<unknown> {
  if (res.status < 200 || res.status >= 300) {
    const code = await res.json().then((b: { code?: unknown }) => (typeof b?.code === "string" ? ` (${b.code})` : "")).catch(() => "");
    throw new Error(`${fn}: HTTP ${res.status}${code}`);
  }
  const text = res.status === 204 || res.status === 205 ? "" : await res.text();
  if (!text.trim()) {
    if (opts.allowEmpty) return null;
    throw new Error(`${fn}: HTTP ${res.status} with an empty body, but a result was expected`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${fn}: HTTP ${res.status} but the body is not valid JSON (${text.length} characters)`);
  }
}
