/**
 * Shared helper to format counselor display names across all languages
 *
 * Rules:
 * 1. Korean (ko):
 *    -> "상담원 (9D8Y)"
 * 2. Non-Korean + Bilingual:
 *    -> "[RoleTitle] 상담원 (9D8Y)" (e.g., "Tư vấn viên 상담원 (9D8Y)")
 * 3. Non-Korean + Monolingual:
 *    -> "[RoleTitle] (9D8Y)" (e.g., "Tư vấn viên (9D8Y)") - Zero Korean
 */
export function formatCounselorName({
  rawName,
  roleTitle,
  locale,
  isBilingual,
}: {
  rawName?: string;
  roleTitle?: string;
  locale: string;
  isBilingual: boolean;
}): string {
  const fallbackRole = locale === "ko" ? "상담원" : "Counselor";
  const role = (roleTitle && roleTitle.trim()) || fallbackRole;

  if (!rawName) {
    if (locale === "ko") return "상담원";
    if (isBilingual) return `${role} 상담원`;
    return role;
  }

  // 1. Check if name contains a 3-12 character alphanumeric/code in parens: e.g. "상담원 (9D8Y)" or "(9D8Y)"
  const codeMatch = rawName.match(/\(([A-Za-z0-9_\-\s]{3,12})\)/);
  if (codeMatch) {
    const code = codeMatch[1].trim();
    if (locale === "ko") {
      return `상담원 (${code})`;
    }
    if (isBilingual) {
      return `${role} 상담원 (${code})`;
    }
    return `${role} (${code})`;
  }

  // 2. Check if name has bilingual name in parens: e.g. "Nguyen Thi Huong (응우옌 티 흐엉)"
  const bilingualMatch = rawName.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (bilingualMatch) {
    const foreignPart = bilingualMatch[1].trim();
    const koreanPart = bilingualMatch[2].trim();
    if (locale === "ko") {
      return `상담원 (${koreanPart || foreignPart})`;
    }
    if (isBilingual) {
      return `${role} 상담원 (${foreignPart})`;
    }
    return `${role} (${foreignPart})`;
  }

  // 3. Generic name string: strip any existing "상담원" or "Counselor"
  const clean = rawName.replace(/^(상담원|counselor)\s*/i, "").trim();
  const idStr = clean.startsWith("(") && clean.endsWith(")") ? clean : `(${clean})`;

  if (locale === "ko") {
    return `상담원 ${idStr}`;
  }
  if (isBilingual) {
    return `${role} 상담원 ${idStr}`;
  }
  return `${role} ${idStr}`;
}
