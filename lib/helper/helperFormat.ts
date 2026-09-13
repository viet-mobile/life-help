// lib/helper/helperFormat.ts

const KNOWN_HELPER_PREFIXES = new Set([
  "헬퍼",
  "helper",
  "specialist",
  "thợ",
  "fachowiec",
  "handwerker",
  "artisan",
  "técnico",
  "tecnico",
  "especialista",
  "전문スタッフ",
  "师傅",
  "師傅",
  "мастер",
  "майстер",
  "teknisi",
  "ช่าง",
  "usta",
  "vakman",
  "håndværker",
  "håndverker",
  "hantverkare",
  "шебер",
  "ባለሙያ",
  "فني متخصص",
  "صنايعي وفني",
  "টেকনিশিয়ান",
  "ειδικός τεχνικός",
  "متخصص",
  "בעل מקצוע",
  "तकनीशियन",
  "ជាងជំនាញ",
  "ကျွမ်းကျင်ပညာရှင်",
  "प्राविधिक",
  "කාර්මික ශිල්පී",
  "வல்லுநர்",
  "tékniku",
]);

/**
 * Formats a helper's display name, dynamically translating auto-generated titles
 * like "헬퍼 (5SJX)" into the active locale's Helper term (e.g. "Fachowiec (5SJX)", "Thợ (5SJX)").
 */
export function formatHelperDisplayName(
  rawName: string | undefined,
  helperTerm: string = "Helper",
  honorificTerm: string = "",
  formatBilingual?: (target: string, ko: string) => string,
  isKorean: boolean = false
): string {
  if (!rawName || !rawName.trim()) {
    const koFallback = "헬퍼 님";
    const targetFallback = helperTerm;
    if (isKorean) return koFallback;
    return formatBilingual ? formatBilingual(targetFallback, koFallback) : targetFallback;
  }

  const trimmed = rawName.trim();

  // Match pattern like "헬퍼 (5SJX)", "Helper (5SJX)", "Thợ (5SJX)", "Fachowiec (5SJX)"
  const codeMatch = trimmed.match(/^(.+?)\s*\(([A-Za-z0-9\-#_]+)\)$/);
  if (codeMatch) {
    const prefix = codeMatch[1].trim();
    const code = codeMatch[2];
    const prefixLower = prefix.toLowerCase();

    const isGenericHelperPrefix =
      !prefix ||
      prefix === "헬퍼" ||
      prefixLower === "helper" ||
      prefixLower === helperTerm.toLowerCase() ||
      KNOWN_HELPER_PREFIXES.has(prefixLower);

    if (isGenericHelperPrefix) {
      const koVersion = `헬퍼 (${code}) 님`;
      const targetVersion = `${helperTerm} (${code})`;

      if (isKorean) {
        return koVersion;
      }

      return formatBilingual ? formatBilingual(targetVersion, koVersion) : targetVersion;
    }
  }

  // For custom personal names (e.g. "김철수", "John")
  if (isKorean) {
    const cleanHon = honorificTerm === "헬퍼님" ? "님" : honorificTerm || "님";
    return `${trimmed} ${cleanHon}`;
  }

  if (honorificTerm && honorificTerm !== "헬퍼님" && honorificTerm !== helperTerm) {
    const formattedHon = formatBilingual ? formatBilingual(honorificTerm, "님") : honorificTerm;
    return `${trimmed} ${formattedHon}`;
  }

  return trimmed;
}
