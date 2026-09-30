/**
 * Speaking / pronunciation interface (Phase 3). No vendor is chosen; the mock
 * makes the flow demonstrable without API keys. Real providers run server-side
 * so keys never reach the browser.
 */
export interface TranscribeResult {
  text: string;
  confidence: number;
}
export interface PronunciationResult {
  /** 0..100 */
  score: number;
  feedback: string;
}
export interface SpeechProvider {
  readonly id: string;
  transcribe(audio: Blob | ArrayBuffer, lang: string): Promise<TranscribeResult>;
  evaluatePronunciation(audio: Blob | ArrayBuffer, referenceText: string, lang: string): Promise<PronunciationResult>;
}

export class MockSpeechProvider implements SpeechProvider {
  readonly id = "mock";
  async transcribe(): Promise<TranscribeResult> {
    return { text: "", confidence: 0 };
  }
  async evaluatePronunciation(): Promise<PronunciationResult> {
    return { score: 0, feedback: "demo mode: pronunciation scoring is not configured" };
  }
}
