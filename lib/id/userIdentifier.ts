// lib/id/userIdentifier.ts
"use client";

/**
 * Generates a unique 4-character random uppercase alphanumeric string
 * avoiding visually ambiguous characters (0, O, 1, I).
 */
export function generateRandomCode(length: number = 4): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates an anonymous customer identifier, e.g. "CST-7A29"
 */
export function generateCustomerId(): string {
  return `CST-${generateRandomCode(4)}`;
}

/**
 * Generates an anonymous helper identifier, e.g. "HLP-3814"
 */
export function generateHelperId(): string {
  return `HLP-${generateRandomCode(4)}`;
}

const CUSTOMER_ID_KEY = "life_help_auto_customer_id";
const HELPER_ID_KEY = "life_help_auto_helper_id";

/**
 * Retrieves the persistent customer ID for this browser/device, or creates and stores a new one.
 */
export function getOrCreateCustomerId(): string {
  if (typeof window === "undefined") {
    return generateCustomerId();
  }
  try {
    let id = localStorage.getItem(CUSTOMER_ID_KEY);
    if (!id || !id.startsWith("CST-")) {
      id = generateCustomerId();
      localStorage.setItem(CUSTOMER_ID_KEY, id);
    }
    return id;
  } catch {
    return generateCustomerId();
  }
}

/**
 * Retrieves the persistent helper ID for this browser/device, or creates and stores a new one.
 */
export function getOrCreateHelperId(): string {
  if (typeof window === "undefined") {
    return generateHelperId();
  }
  try {
    let id = localStorage.getItem(HELPER_ID_KEY);
    if (!id || !id.startsWith("HLP-")) {
      id = generateHelperId();
      localStorage.setItem(HELPER_ID_KEY, id);
    }
    return id;
  } catch {
    return generateHelperId();
  }
}

// Display-name formatting lives in an environment-neutral module so server routes can share it.
export { formatCustomerDisplayName } from "./customerDisplayName";

/**
 * Formats helper display name adhering to rule: NO parentheses () in Korean text.
 * e.g. "헬퍼 · HLP-4291"
 */
export function formatHelperIdentifier(
  helperId: string,
  locale: string = "ko",
  helperTerm: string = "Helper",
  formatBilingual?: (target: string, ko: string) => string
): string {
  const cleanId = helperId.startsWith("HLP-") ? helperId : `HLP-${helperId}`;
  const koText = `헬퍼 · ${cleanId}`;

  if (locale === "ko") return koText;

  const targetText = `${helperTerm || "Helper"} · ${cleanId}`;
  return formatBilingual ? formatBilingual(targetText, koText) : targetText;
}
