/**
 * Machine translation of chat text and request descriptions. The original is always kept next to it; a failed translation is a
 * failure (ok: false), never a successful-looking copy of the original. Only genuine provider answers are ok.
 */
export type TranslationResult = { ok: true; text: string; provider: string } | { ok: false; reason: string };
export interface Translator {
  translate(text: string, from: string, to: string): Promise<TranslationResult>;
}

const MYMEMORY_CODE: Record<string, string> = { "zh-Hans": "zh-CN", "zh-Hant": "zh-TW" };
/** MyMemory reports quota / language errors INSIDE a 200-looking translatedText; none of that is a translation. */
const MYMEMORY_ERROR_TEXT = /MYMEMORY WARNING|INVALID (SOURCE|TARGET) LANGUAGE|QUERY LENGTH LIMIT|PLEASE SELECT TWO DISTINCT LANGUAGES|NO QUERY SPECIFIED|IS AN INVALID/i;

export class MyMemoryTranslator implements Translator {
  constructor(private fetchImpl: typeof fetch = fetch, private timeoutMs = 3500) {}
  async translate(text: string, from: string, to: string): Promise<TranslationResult> {
    const source = text.trim();
    if (!source) return { ok: false, reason: "empty" };
    if (source.length > 500) return { ok: false, reason: "too_long" }; // MyMemory's free per-request limit
    const pair = `${MYMEMORY_CODE[from] ?? from}|${MYMEMORY_CODE[to] ?? to}`;
    try {
      const res = await this.fetchImpl(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(source)}&langpair=${encodeURIComponent(pair)}`, {
        headers: { "User-Agent": "LIFE.HELP-Translator/1.0" },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) return { ok: false, reason: `http_${res.status}` };
      const json = (await res.json()) as { responseStatus?: number | string; responseData?: { translatedText?: unknown } };
      const out = json?.responseData?.translatedText;
      if (Number(json?.responseStatus) !== 200 || typeof out !== "string" || !out.trim() || MYMEMORY_ERROR_TEXT.test(out)) return { ok: false, reason: "provider_rejected" };
      return { ok: true, text: out.trim(), provider: "mymemory" };
    } catch {
      return { ok: false, reason: "unavailable" };
    }
  }
}

/** Deterministic offline translator for local runs / tests ONLY (never selected in production). "[[fail]]" in the text simulates an outage. */
export class FakeTranslator implements Translator {
  calls: Array<{ text: string; from: string; to: string }> = [];
  async translate(text: string, from: string, to: string): Promise<TranslationResult> {
    this.calls.push({ text, from, to });
    if (text.includes("[[fail]]")) return { ok: false, reason: "fake_failure" };
    return { ok: true, text: `[${to}] ${text}`, provider: "fake" };
  }
}
