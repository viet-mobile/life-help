import bundle from "./english.json";
import viOverlay from "@/lib/learn/content/vi/reading-english.json";
import type { ContentBundle, Course, Skill, Question } from "@/lib/learn/types";
import type { ContentOverlay } from "@/lib/learn/content/overlay";

export const advancedReadingBundle = bundle as unknown as ContentBundle;
export const advancedReadingViOverlay = viOverlay as unknown as ContentOverlay;
export const ADVANCED_READING_COURSES: Course[] = bundle.catalog.courses as unknown as Course[];
export const ADVANCED_READING_SKILLS: Skill[] = bundle.catalog.skills as unknown as Skill[];
export const ADVANCED_READING_QUESTIONS: Question[] = bundle.questions as unknown as Question[];

export const ADVANCED_READING_OVERLAY_LOCALES = [
  "am", "ar", "arz", "bn", "da", "de", "el", "en", "es", "fa", "fr", "gu", "he", "hi", "id", "it",
  "ja", "kk", "km", "kn", "ml", "mn", "mr", "my", "ne", "nl", "no", "pa", "pl", "pt", "ru", "sg",
  "si", "sv", "sw", "ta", "te", "tet", "th", "tr", "uk", "ur", "uz", "vi", "zh-Hans", "zh-Hant"
] as const;

export function getAdvancedReadingOverlay(locale: string): ContentOverlay | null {
  if (locale === "vi") return advancedReadingViOverlay;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(`./overlays/${locale}.json`) as ContentOverlay;
  } catch {
    return null;
  }
}
