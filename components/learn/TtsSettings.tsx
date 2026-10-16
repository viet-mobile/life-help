"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Translator } from "@/lib/learn/i18n";
import { getAudioProvider } from "@/lib/learn/providers/audio";
import { RATE_MAX, RATE_MIN, RATE_STEP, TTS_DEFAULT, getTtsSettings, primaryLang, setTtsSettings, subscribeTts, voiceKey } from "@/lib/learn/listen/ttsSettings";

type Voice = { voiceURI: string; name: string; lang: string };
const SAMPLE: Record<string, string> = { ko: "안녕하세요. 만나서 반갑습니다.", en: "Hello. Nice to meet you." };

/** Installed device voices of one language (re-read when the browser reports new voices: they load asynchronously). */
function useVoices(lang: string): { voices: Voice[]; ready: boolean } {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) { setReady(true); return; }
    const s = window.speechSynthesis;
    const read = () => { setVoices(s.getVoices().filter((v) => primaryLang(v.lang) === primaryLang(lang))); setReady(true); };
    read();
    if (typeof s.addEventListener === "function") { s.addEventListener("voiceschanged", read); return () => s.removeEventListener("voiceschanged", read); }
  }, [lang]);
  return { voices, ready };
}

/**
 * Voice choice, speed, repeat count and device help for one target language (ko-KR / en-US). Saved in this browser only.
 * Device speech reads text aloud: nothing here measures the learner's own pronunciation, and the panel says so.
 */
export function TtsSettingsPanel({ t, code, speech }: { t: Translator; code: "ko" | "en"; speech: string }) {
  const settings = useSyncExternalStore(subscribeTts, getTtsSettings, () => TTS_DEFAULT);
  const { voices, ready } = useVoices(speech);
  const langName = t(`tts.lang.${code}` as never);
  const key = primaryLang(speech);
  const chosen = settings.voices[key] ?? "";
  const provider = getAudioProvider();
  const noVoice = ready && provider.isAvailable() && voices.length === 0;
  return (
    <details className="l-tts" data-testid="tts-settings">
      <summary className="l-link">⚙ {t("tts.title")}</summary>
      <div className="l-stack" style={{ marginTop: 8 }}>
        {!provider.isAvailable() ? (
          <p className="l-muted" role="note">{t("listen.unavailable")}</p>
        ) : (
          <>
            <label className="l-stack">
              <span style={{ fontWeight: 700 }}>{t("tts.voice")}</span>
              <select className="l-input" data-testid="tts-voice" value={chosen} onChange={(e) => setTtsSettings({ voices: { [key]: e.target.value } })} disabled={voices.length === 0}>
                <option value="">{t("tts.voice.auto")}</option>
                {voices.map((v) => <option key={voiceKey(v)} value={voiceKey(v)}>{v.name} ({v.lang})</option>)}
              </select>
            </label>
            <label className="l-stack">
              <span style={{ fontWeight: 700 }}>{t("tts.rate")} · {settings.rate.toFixed(1)}×</span>
              <input type="range" data-testid="tts-rate" min={RATE_MIN} max={RATE_MAX} step={RATE_STEP} value={settings.rate} onChange={(e) => setTtsSettings({ rate: Number(e.target.value) })} />
            </label>
            <div role="radiogroup" aria-label={t("tts.repeat")} className="l-stack">
              <span style={{ fontWeight: 700 }}>{t("tts.repeat")}</span>
              <div className="l-options" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {([1, 2, 3] as const).map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={settings.repeat === n} data-selected={settings.repeat === n} data-testid={`tts-repeat-${n}`} className="l-option" onClick={() => setTtsSettings({ repeat: n })}>
                    {t("tts.repeat.n", { n })}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="l-btn" data-testid="tts-test" onClick={() => void provider.speak(SAMPLE[code], speech)}>🔊 {t("tts.test")}</button>
            <p className="l-muted" style={{ fontSize: "0.85rem" }}>{t("tts.saved")} {t("tts.disclaimer")}</p>
          </>
        )}
        {noVoice && <p className="l-target-note" role="note" data-testid="tts-no-voice">{t("tts.voice.none", { lang: langName })}</p>}
        <TtsHelp t={t} langName={langName} open={noVoice} />
      </div>
    </details>
  );
}

/** What to check when nothing is heard, and how to install a voice per device. Short, always the same steps, no nationality guesses. */
export function TtsHelp({ t, langName, open }: { t: Translator; langName: string; open?: boolean }) {
  return (
    <details className="l-tts-help" data-testid="tts-help" open={open}>
      <summary className="l-link">{t("tts.help.title", { lang: langName })}</summary>
      <div className="l-stack" style={{ marginTop: 8 }}>
        <strong>{t("tts.help.checks")}</strong>
        <ul>
          <li>{t("tts.help.check.volume")}</li>
          <li>{t("tts.help.check.mute")}</li>
          <li>{t("tts.help.check.browser")}</li>
        </ul>
        <strong>{t("tts.help.install", { lang: langName })}</strong>
        <ul>
          <li>{t("tts.help.ios", { lang: langName })}</li>
          <li>{t("tts.help.android", { lang: langName })}</li>
          <li>{t("tts.help.windows", { lang: langName })}</li>
          <li>{t("tts.help.mac", { lang: langName })}</li>
        </ul>
        <p className="l-muted">{t("tts.help.restart")} {t("tts.help.menus")}</p>
        <p className="l-muted">{t("tts.help.alt")}</p>
      </div>
    </details>
  );
}
