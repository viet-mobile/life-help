import type { Utterance } from "./queue";

/**
 * Provider-neutral speech layer. The default engine is the browser's own Speech Synthesis: no key, no network, no server, nothing recorded,
 * and no lesson text leaves the device. Nothing here touches `window` until a method is called on the client.
 */
export interface SpeechEngine {
  isAvailable(): boolean;
  supportsPause(): boolean;
  /** speak one utterance; `done` is called exactly once, with an error flag when the engine failed (a cancel is not an error) */
  speak(u: { text: string; lang: string; rate: number }, done: (error: boolean) => void): void;
  cancel(): void;
  pause(): void;
  resume(): void;
}

/** Best installed voice for a language: exact (en-US) first, then the same primary language (en-GB, en-AU ...), preferring the default voice. */
export function pickVoice<V extends { lang: string; default?: boolean }>(voices: V[], lang: string): V | null {
  const norm = (s: string) => s.replace("_", "-").toLowerCase();
  const want = norm(lang), primary = want.split("-")[0];
  const exact = voices.filter((v) => norm(v.lang) === want);
  const same = voices.filter((v) => norm(v.lang).split("-")[0] === primary);
  const pool = exact.length ? exact : same;
  return pool.find((v) => v.default) ?? pool[0] ?? null;
}

export class BrowserSpeechEngine implements SpeechEngine {
  private voices: SpeechSynthesisVoice[] = [];
  private wired = false;

  private get synth(): SpeechSynthesis | null {
    return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined" ? window.speechSynthesis : null;
  }
  private refreshVoices() {
    const s = this.synth;
    if (!s) return;
    this.voices = s.getVoices();
    if (!this.wired && typeof s.addEventListener === "function") {
      this.wired = true;
      // voices load asynchronously in most browsers
      s.addEventListener("voiceschanged", () => { this.voices = s.getVoices(); });
    }
  }
  isAvailable() { return this.synth !== null; }
  supportsPause() { return this.synth !== null && typeof this.synth.pause === "function"; }
  speak(u: { text: string; lang: string; rate: number }, done: (error: boolean) => void) {
    const s = this.synth;
    if (!s) return done(true);
    this.refreshVoices();
    const utter = new SpeechSynthesisUtterance(u.text);
    utter.lang = u.lang;
    utter.rate = u.rate;
    const voice = pickVoice(this.voices, u.lang);
    if (voice) utter.voice = voice; // no voice for the language: the browser's default for utter.lang applies
    let finished = false;
    const finish = (error: boolean) => { if (!finished) { finished = true; done(error); } };
    utter.onend = () => finish(false);
    utter.onerror = (e) => finish(!(e.error === "canceled" || e.error === "interrupted"));
    s.speak(utter);
  }
  cancel() { this.synth?.cancel(); }
  pause() { this.synth?.pause(); }
  resume() { this.synth?.resume(); }
}

export type PlayerStatus = "idle" | "playing" | "paused";
export interface PlayerState {
  status: PlayerStatus;
  /** the segment being spoken (for the highlight) */
  segmentId: string | null;
  segmentIndex: number | null;
  /** set when the last session ended because the engine failed */
  error: boolean;
}

/**
 * Plays an utterance queue strictly one after another. Starting a new session, `stop()` or an unmount cancels the previous one first, so two
 * voices never overlap. A stale callback of a cancelled session is ignored by its session token.
 */
export class ListenPlayer {
  private token = 0;
  private listeners = new Set<(s: PlayerState) => void>();
  state: PlayerState = { status: "idle", segmentId: null, segmentIndex: null, error: false };

  constructor(private engine: SpeechEngine) {}

  subscribe(fn: (s: PlayerState) => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private set(next: Partial<PlayerState>) { this.state = { ...this.state, ...next }; this.listeners.forEach((l) => l(this.state)); }

  isAvailable() { return this.engine.isAvailable(); }
  supportsPause() { return this.engine.supportsPause(); }

  play(queue: Utterance[], rate = 1) {
    this.stop();
    if (!queue.length || !this.engine.isAvailable()) return;
    const mine = ++this.token;
    this.set({ status: "playing", error: false });
    const next = (i: number) => {
      if (mine !== this.token) return;
      if (i >= queue.length) return this.set({ status: "idle", segmentId: null, segmentIndex: null });
      const u = queue[i];
      this.set({ segmentId: u.segmentId, segmentIndex: u.segmentIndex });
      this.engine.speak({ text: u.text, lang: u.lang, rate }, (error) => {
        if (mine !== this.token) return;
        if (error) { this.token++; return this.set({ status: "idle", segmentId: null, segmentIndex: null, error: true }); }
        next(i + 1);
      });
    };
    next(0);
  }
  stop() {
    this.token++;
    this.engine.cancel();
    if (this.state.status !== "idle" || this.state.segmentId) this.set({ status: "idle", segmentId: null, segmentIndex: null });
  }
  pause() { if (this.state.status === "playing" && this.engine.supportsPause()) { this.engine.pause(); this.set({ status: "paused" }); } }
  resume() { if (this.state.status === "paused") { this.engine.resume(); this.set({ status: "playing" }); } }
}

let shared: ListenPlayer | null = null;
/** One player per page: every listening control shares it, so starting anything cancels whatever was speaking. Created on first use (client only). */
export function getListenPlayer(): ListenPlayer {
  if (!shared) shared = new ListenPlayer(new BrowserSpeechEngine());
  return shared;
}
/** test hook */
export function setListenPlayer(p: ListenPlayer | null) { shared = p; }
