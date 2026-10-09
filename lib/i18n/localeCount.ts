import { locales } from "@/messages";

/** Number of supported UI languages, always derived from the canonical registry (messages/index.ts). */
export const SUPPORTED_LOCALE_COUNT = locales.length;

// Locales whose copy writes numbers in native digits (kept exactly as their translations did before {count}).
const NATIVE_DIGITS: Readonly<Record<string, string>> = { fa: "arabext", bn: "beng", ne: "deva", km: "khmr", my: "mymr" };

/** The supported-language count in the locale's own digit style, for the "{count} languages" copy. */
export function formatLocaleCount(locale: string): string {
  const numberingSystem = NATIVE_DIGITS[locale];
  try {
    return new Intl.NumberFormat(numberingSystem ? `${locale}-u-nu-${numberingSystem}` : "en").format(SUPPORTED_LOCALE_COUNT);
  } catch {
    return String(SUPPORTED_LOCALE_COUNT);
  }
}
