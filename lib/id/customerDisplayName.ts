// lib/id/customerDisplayName.ts
// Pure (environment-neutral) customer identifier helpers, shared by client UI and server routes.

/**
 * Pseudonymous customer identifier format produced by generateCustomerId(), e.g. "CST-7A29".
 * This is a display/pseudonym value only — never treat it as an authentication credential.
 */
export const CUSTOMER_ID_PATTERN = /^[A-Z]{8}$/;

/**
 * Formats customer display name adhering to rule: NO parentheses () in Korean text.
 * e.g. "고객 · CST-8392"
 */
export function formatCustomerDisplayName(
  customerId: string,
  locale: string = "ko",
  formatBilingual?: (target: string, ko: string) => string
): string {
  const cleanId = customerId;
  const koText = `사용자 ID · ${cleanId}`;

  if (locale === "ko") return koText;

  let targetTerm = "User ID";
  if (locale === "vi") targetTerm = "ID người dùng";
  else if (locale === "ja") targetTerm = "お客様";
  else if (locale === "zh-Hans") targetTerm = "客户";
  else if (locale === "zh-Hant") targetTerm = "客戶";
  else if (locale === "ru") targetTerm = "Клиент";
  else if (locale === "th") targetTerm = "ลูกค้า";
  else if (locale === "id") targetTerm = "Pelanggan";

  const targetText = `${targetTerm} · ${cleanId}`;
  return formatBilingual ? formatBilingual(targetText, koText) : targetText;
}
