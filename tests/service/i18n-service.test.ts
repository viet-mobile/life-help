import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { locales } from "@/messages";

// The locale list comes from the registry (messages/index.ts), never a hard-coded count.
type Dict = { [k: string]: string | Dict };
const load = (l: string) => JSON.parse(readFileSync(join(process.cwd(), "messages", `${l}.json`), "utf8")) as Dict;
const get = (d: Dict, key: string): unknown => key.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Dict)[k] : undefined), d);

const SERVICE_DIRS = ["app", "components", "lib"];
function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (n === "node_modules" || n === ".next") continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(n)) out.push(p);
  }
  return out;
}

const FAMILIES: Record<string, string[]> = {
  "svc.chat.sender.": ["CUSTOMER", "HELPER", "ADMIN", "SYSTEM"],
  "svc.event.": ["NEW_REQUEST_AVAILABLE", "REQUEST_ASSIGNED", "HELPER_ACCEPTED", "NEW_CHAT_MESSAGE", "REQUEST_STARTED", "REQUEST_COMPLETED"],
  "svc.helper.status.": ["PENDING", "APPROVED", "SUSPENDED", "DISABLED"],
  "svc.helper.statusNote.": ["PENDING", "APPROVED", "SUSPENDED", "DISABLED"],
  "svc.status.": ["WAITING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
};

function usedKeys(): string[] {
  const keys = new Set<string>();
  for (const dir of SERVICE_DIRS) for (const f of walk(join(process.cwd(), dir))) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/["'`](svc\.[A-Za-z0-9_.]+)["'`]/g)) if (!m[1].endsWith(".")) keys.add(m[1]);
  }
  for (const [prefix, vals] of Object.entries(FAMILIES)) for (const v of vals) keys.add(prefix + v);
  return [...keys];
}

// words that legitimately stay identical to English in some languages (brand, loanwords)
const SAME_AS_EN_OK = new Set(["svc.chat.sender.ADMIN", "svc.chat.title", "svc.auth.tabLogin"]);
const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힯]/;

describe("service core strings in the canonical locale registry", () => {
  const keys = usedKeys();
  it("finds the keys the UI uses", () => expect(keys.length).toBeGreaterThan(100));
  it("derives the locale list from the registry", () => expect(locales.length).toBeGreaterThanOrEqual(2));

  for (const l of locales) {
    it(`${l}: every svc key exists, is non-empty, keeps placeholders`, () => {
      const d = load(l);
      const en = load("en");
      const missing = keys.filter((k) => typeof get(d, k) !== "string" || !(get(d, k) as string).trim());
      expect(missing).toEqual([]);
      for (const k of keys) {
        const a = get(en, k) as string, b = get(d, k) as string;
        expect([...(a.match(/\{\w+\}/g) ?? [])].sort(), k).toEqual([...(b.match(/\{\w+\}/g) ?? [])].sort());
        if (l !== "ko") expect(HANGUL.test(b), `${l} ${k} has Hangul`).toBe(false);
        if (l !== "en" && l !== "ko" && a === b && !SAME_AS_EN_OK.has(k) && /[A-Za-z]{4,}/.test(a)) {
          // Latin-script languages may share a word; a full sentence identical to English is an untranslated string
          expect(a.split(/\s+/).length, `${l} ${k} is still English`).toBeLessThan(3);
        }
      }
    });
    it(`${l}: the unsupported 15-minute dispatch claim is gone and the language count is derived`, () => {
      const d = load(l);
      expect(get(d, "trustMetrics.dispatch")).toBeUndefined();
      const lang = get(d, "trustMetrics.languages") as string;
      expect(lang).toContain("{count}");
      expect(/\b38\b|\b47\b/.test(lang)).toBe(false);
    });
  }
});
