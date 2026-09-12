import ko from "./ko.json";
import vi from "./vi.json";
export const locales = ["vi", "ko"] as const;
export type Locale = (typeof locales)[number];
const dictionaries = { ko, vi } as const;
export function translate(locale: Locale, key: string): string {
  const value = key
    .split(".")
    .reduce<unknown>(
      (current, segment) =>
        typeof current === "object" && current !== null && segment in current
          ? (current as Record<string, unknown>)[segment]
          : undefined,
      dictionaries[locale],
    );
  return typeof value === "string" ? value : key;
}
