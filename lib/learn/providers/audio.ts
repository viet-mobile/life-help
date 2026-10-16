import { pickVoice } from "@/lib/learn/listen/speech";
import { getTtsSettings, pickPreferredVoice } from "@/lib/learn/listen/ttsSettings";

/**
 * Listening audio abstraction. Questions carry `audioText` (and later `audioUrl`);
 * how it is played is a provider concern so no vendor is baked into content or UI.
 */
export interface AudioProvider {
  readonly id: string;
  isAvailable(): boolean;
  /** False only when the device reports its voices and none speaks this language (then the UI shows text instead of audio). */
  hasVoice(lang: string): boolean;
  speak(text: string, lang?: string): Promise<void>;
  stop(): void;
}

/** Browser Web Speech API (no keys, no network, nothing leaves the device). No cloud TTS. */
export class BrowserSpeechAudioProvider implements AudioProvider {
  readonly id = "browser-speech";
  isAvailable() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }
  hasVoice(lang: string) {
    if (!this.isAvailable()) return false;
    const voices = window.speechSynthesis.getVoices();
    // An empty list usually means "not loaded yet" (voices arrive asynchronously): do not hide the button on that alone.
    return voices.length === 0 || pickVoice(voices, lang) !== null;
  }
  speak(text: string, lang = "en-US") {
    return new Promise<void>((resolve) => {
      if (!this.isAvailable()) return resolve();
      const settings = getTtsSettings();
      let left = settings.repeat; // the learner's repeat setting: the same text, one after another (a short pause between)
      const once = () => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        const voice = pickPreferredVoice(window.speechSynthesis.getVoices(), lang, settings, pickVoice);
        if (voice) u.voice = voice; // the chosen voice, else a matching voice (ko-KR for Korean) instead of the browser default reading foreign text
        u.rate = Math.min(2, Math.max(0.1, 0.9 * settings.rate));
        const next = () => { left--; if (left > 0) window.setTimeout(once, 600); else resolve(); };
        u.onend = next;
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      };
      window.speechSynthesis.cancel();
      once();
    });
  }
  stop() {
    if (this.isAvailable()) window.speechSynthesis.cancel();
  }
}

/** Register a server/CDN-backed TTS provider here later; UI only depends on AudioProvider. */
let current: AudioProvider = new BrowserSpeechAudioProvider();
export const getAudioProvider = () => current;
export const setAudioProvider = (p: AudioProvider) => {
  current = p;
};
