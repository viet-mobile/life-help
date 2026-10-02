import { ko, type MessageKey } from "./ko";

export type LearnLocale = "ko";
export type { MessageKey };

const dictionaries: Record<LearnLocale, Record<MessageKey, string>> = { ko };

export type Translator = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function createTranslator(locale: LearnLocale = "ko"): Translator {
  const dict = dictionaries[locale] ?? ko;
  return (key, vars) => {
    let text: string = dict[key] ?? ko[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
    return text;
  };
}

export const t: Translator = createTranslator("ko");
