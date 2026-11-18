/** Thinking tasks are public client-side review material, never account data or secrets. */
const cache = new Map<string, Promise<unknown>>();
export async function loadThinkAsset<T>(hash: string): Promise<T> {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("Invalid thinking asset hash");
  let promise = cache.get(hash);
  if (!promise) {
    promise = (async () => {
      const response = await fetch(`/think-assets/${hash}.json`);
      if (!response.ok) throw new Error(`Thinking asset HTTP ${response.status}`);
      const data = await response.arrayBuffer();
      if (data.byteLength > 8 * 1024 * 1024) throw new Error("Thinking asset too large");
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)), (b) => b.toString(16).padStart(2, "0")).join("");
      if (digest !== hash) throw new Error("Thinking asset integrity mismatch");
      return JSON.parse(new TextDecoder().decode(data));
    })();
    cache.set(hash, promise);
    void promise.catch(() => cache.delete(hash));
  }
  return promise as Promise<T>;
}
