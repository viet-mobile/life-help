import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RATE_MAX, RATE_MIN, TTS_DEFAULT, TTS_KEY, clampRate, clampRepeat, getTtsSettings, normalizeTts, pickPreferredVoice, resetTtsCache, setTtsSettings, voiceKey } from "@/lib/learn/listen/ttsSettings";
import { pickVoice } from "@/lib/learn/listen/speech";

const V = (name: string, lang: string, uri = name, def = false) => ({ name, lang, voiceURI: uri, default: def });

describe("TTS settings: voice, speed, repeat (device-only preference, never an assessment)", () => {
  beforeEach(() => { resetTtsCache(); });
  afterEach(() => { vi.unstubAllGlobals(); });
  it("clamps speed to the allowed range and repeat to 1..3; garbage falls back to defaults", () => {
    expect(clampRate(0.1)).toBe(RATE_MIN); expect(clampRate(9)).toBe(RATE_MAX); expect(clampRate("x")).toBe(1); expect(clampRate(0.84)).toBe(0.8);
    expect(clampRepeat(2)).toBe(2); expect(clampRepeat(7)).toBe(1); expect(clampRepeat("3")).toBe(1);
    expect(normalizeTts(null)).toEqual(TTS_DEFAULT);
    expect(normalizeTts({ rate: 99, repeat: 3, voices: { ko: "a||b||ko-KR", "../x": "evil", en: 5 } })).toEqual({ rate: RATE_MAX, repeat: 3, voices: { ko: "a||b||ko-KR" } });
  });
  it("persists to localStorage when available and still works (this page) when storage throws", () => {
    const store: Record<string, string> = {};
    vi.stubGlobal("window", { localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; } } });
    setTtsSettings({ rate: 0.8, repeat: 2, voices: { ko: "k||Yuna||ko-KR" } });
    expect(JSON.parse(store[TTS_KEY])).toEqual({ rate: 0.8, repeat: 2, voices: { ko: "k||Yuna||ko-KR" } });
    setTtsSettings({ voices: { en: "e||Sam||en-US" } });
    expect(getTtsSettings().voices).toEqual({ ko: "k||Yuna||ko-KR", en: "e||Sam||en-US" }); // per-language voices merge
    resetTtsCache();
    expect(getTtsSettings().rate).toBe(0.8); // read back from storage
    vi.stubGlobal("window", { localStorage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } } });
    resetTtsCache();
    expect(getTtsSettings()).toEqual(TTS_DEFAULT);
    expect(() => setTtsSettings({ repeat: 3 })).not.toThrow();
    expect(getTtsSettings().repeat).toBe(3);
  });
  it("the chosen voice wins only while it is installed and speaks the language; otherwise the automatic choice", () => {
    const voices = [V("Yuna", "ko-KR", "same-uri"), V("Yuna Enhanced", "ko-KR", "same-uri"), V("Sam", "en-US", "e", true), V("Kyoko", "ja-JP")];
    const s = { ...TTS_DEFAULT, voices: { ko: voiceKey(voices[1]) } };
    expect(pickPreferredVoice(voices, "ko-KR", s, pickVoice)?.name).toBe("Yuna Enhanced"); // same voiceURI, different tier: the key keeps them apart
    expect(pickPreferredVoice(voices, "ko-KR", { ...TTS_DEFAULT, voices: { ko: "gone||X||ko-KR" } }, pickVoice)?.name).toBe("Yuna"); // uninstalled: automatic
    expect(pickPreferredVoice(voices, "ko-KR", { ...TTS_DEFAULT, voices: { ko: voiceKey(voices[3]) } }, pickVoice)?.lang).toBe("ko-KR"); // a Japanese voice is never used for Korean
    expect(pickPreferredVoice(voices, "fr-FR", s, pickVoice)).toBeNull(); // no French voice: null, the caller decides
  });
});
