import { languages } from "@/messages/registry";

/** Text direction for a locale code (registry-driven: ar, arz, fa, he, ur are rtl). Case-insensitive; unknown -> ltr. */
export function directionForLocale(code: string | null | undefined): "ltr" | "rtl" {
  const lower = (code ?? "").toLowerCase();
  const meta = languages.find((l) => l.code.toLowerCase() === lower);
  return meta?.dir === "rtl" ? "rtl" : "ltr";
}
