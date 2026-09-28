/**
 * Airwallex amounts are decimal major units (e.g. 100.5 USD); the LIFE.HELP ledger uses integer minor units.
 * Exact string arithmetic only (no floats). The minor-unit exponents mirror the ledger's
 * public.currency_minor_exponent(): an unlisted currency is refused, never guessed.
 */
const EXPONENT: Record<string, number> = { KRW: 0, JPY: 0, USD: 2, EUR: 2 };

export function currencyExponent(currency: string): number {
  const e = EXPONENT[currency];
  if (e === undefined) throw new Error(`CURRENCY_UNSUPPORTED:${currency}`);
  return e;
}

/** 60000n KRW -> "60000"; 1050n USD -> "10.50". */
export function toMajorString(minor: bigint, currency: string): string {
  const e = currencyExponent(currency);
  if (minor <= BigInt(0)) throw new Error("AMOUNT_NOT_POSITIVE");
  const digits = minor.toString().padStart(e + 1, "0");
  return e === 0 ? digits : `${digits.slice(0, -e)}.${digits.slice(-e)}`;
}

/** "10.5" / 10.5 USD -> 1050n; more decimals than the currency allows -> refused (never rounded). */
export function toMinor(major: string | number, currency: string): bigint {
  const e = currencyExponent(currency);
  const text = typeof major === "number" ? (Number.isFinite(major) ? major.toString() : "") : String(major).trim();
  const m = text.match(/^(\d+)(?:\.(\d+))?$/);
  if (!m) throw new Error("AMOUNT_INVALID");
  const fraction = (m[2] ?? "").replace(/0+$/, "");
  if (fraction.length > e) throw new Error("AMOUNT_PRECISION_EXCEEDS_CURRENCY");
  return BigInt(m[1]) * BigInt(10) ** BigInt(e) + BigInt((fraction + "0".repeat(e)).slice(0, e) || "0");
}
