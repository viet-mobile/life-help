/**
 * Learner TTS preferences (voice per language, speed, repeat count). Browser-level convenience only: kept in localStorage of THIS device
 * (never sent anywhere, never part of progress). Every read/write is guarded: private mode / blocked storage just means defaults.
 * Device speech is a way to HEAR the text; it never measures the learner's own pronunciation.
 */
export interface TtsSettings { rate: number; repeat: 1 | 2 | 3; voices: Record<string, string> }
export const TTS_DEFAULT: TtsSettings = { rate: 1, repeat: 1, voices: {} };
export const RATE_MIN = 0.6, RATE_MAX = 1.3, RATE_STEP = 0.1;
export const TTS_KEY = "life_help_learn_tts_v1";

export const clampRate = (n: unknown): number => {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 1;
  return Math.round(Math.min(RATE_MAX, Math.max(RATE_MIN, v)) * 10) / 10;
};
export const clampRepeat = (n: unknown): 1 | 2 | 3 => (n === 2 || n === 3 ? n : 1);
export const primaryLang = (lang: string) => lang.replace("_", "-").toLowerCase().split("-")[0];

/** Sanitise anything read from storage. */
export function normalizeTts(raw: unknown): TtsSettings {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const voices: Record<string, string> = {};
  if (o.voices && typeof o.voices === "object") for (const [k, v] of Object.entries(o.voices as Record<string, unknown>)) if (typeof v === "string" && v.length <= 300 && /^[a-z]{2,3}$/.test(k)) voices[k] = v;
  return { rate: clampRate(o.rate), repeat: clampRepeat(o.repeat), voices };
}

/** A stable identity for an installed voice: voiceURI alone can be shared by a standard and an enhanced voice of the same name. */
export const voiceKey = (v: { voiceURI?: string; name?: string; lang?: string }) => `${v.voiceURI ?? ""}||${v.name ?? ""}||${v.lang ?? ""}`;

/** The learner's chosen voice for `lang` when it is still installed and speaks that language; otherwise the caller's automatic choice. */
export function pickPreferredVoice<V extends { voiceURI?: string; name?: string; lang: string }>(voices: V[], lang: string, s: TtsSettings, automatic: (vs: V[], lang: string) => V | null): V | null {
  const key = s.voices[primaryLang(lang)];
  if (key) {
    const hit = voices.find((v) => voiceKey(v) === key && primaryLang(v.lang) === primaryLang(lang));
    if (hit) return hit;
  }
  return automatic(voices, lang);
}

let cache: TtsSettings | null = null;
const listeners = new Set<() => void>();
function read(): TtsSettings {
  try { if (typeof window !== "undefined") { const t = window.localStorage.getItem(TTS_KEY); if (t) return normalizeTts(JSON.parse(t)); } } catch { /* storage unavailable or corrupt: defaults */ }
  return TTS_DEFAULT;
}
export function getTtsSettings(): TtsSettings { return (cache ??= read()); }
export function setTtsSettings(patch: Partial<TtsSettings>): TtsSettings {
  const next = normalizeTts({ ...getTtsSettings(), ...patch, voices: { ...getTtsSettings().voices, ...(patch.voices ?? {}) } });
  cache = next;
  try { window.localStorage.setItem(TTS_KEY, JSON.stringify(next)); } catch { /* not persisted: still applies to this page */ }
  listeners.forEach((l) => l());
  return next;
}
export function subscribeTts(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
/** test hook */
export function resetTtsCache() { cache = null; }
