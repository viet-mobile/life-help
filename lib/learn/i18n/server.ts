import "server-only";
import { cookies } from "next/headers";
import { createTranslator, LOCALE_COOKIE, parseLocale, type LearnLocale, type Translator } from "./index";

/** The learner's locale for this request (cookie set by the language switch; Korean when absent or unknown). */
export async function getLocale(): Promise<LearnLocale> {
  try {
    return parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  } catch {
    return "ko";
  }
}

export async function getServerT(): Promise<{ locale: LearnLocale; t: Translator }> {
  const locale = await getLocale();
  return { locale, t: createTranslator(locale) };
}
