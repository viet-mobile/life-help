/**
 * Listening audio abstraction. Questions carry `audioText` (and later `audioUrl`);
 * how it is played is a provider concern so no vendor is baked into content or UI.
 */
export interface AudioProvider {
  readonly id: string;
  isAvailable(): boolean;
  speak(text: string, lang?: string): Promise<void>;
  stop(): void;
}

/** Browser Web Speech API (no keys, no network). Good enough for the MVP. */
export class BrowserSpeechAudioProvider implements AudioProvider {
  readonly id = "browser-speech";
  isAvailable() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }
  speak(text: string, lang = "en-US") {
    return new Promise<void>((resolve) => {
      if (!this.isAvailable()) return resolve();
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.9;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
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
