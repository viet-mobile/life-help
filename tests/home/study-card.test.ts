import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { STUDY_KEYS, STUDY_PLACEHOLDERS } from "@/lib/home/mainServiceKeys";
import { STUDY_SUBJECTS, studyUrl, studyUrls } from "@/lib/home/studyHosts";

const read = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const dict = (l: string) => JSON.parse(read(`messages/${l}.json`)) as Record<string, unknown>;
const get = (o: unknown, path: string): unknown => path.split(".").reduce<unknown>((c, k) => (c && typeof c === "object" ? (c as Record<string, unknown>)[k] : undefined), o);
const ph = (s: string) => (s.match(/\{[A-Za-z0-9_]+\}/g) ?? []).sort().join(",");
const LOCALES = readdirSync("messages").filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));

const home = read("components/customer/CustomerHome.tsx");
const homeOrder = (() => {
  const block = home.slice(home.indexOf("const allServices"), home.indexOf("const benefits"));
  return [...block.matchAll(/^ {4}id: "(\w+)",/gm)].map((m) => m[1]);
})();

describe("home grid (learning-only release): the existing ten services plus the Study card", () => {
  it("puts Study immediately before job help and leaves the ten existing cards in their order", () => {
    expect(homeOrder).toEqual(["study", "jobHelp", "mobileHelp", "boiler", "housing", "cleaning", "hospitalHelp", "clog", "leakPlumbing", "bankHelp", "insuranceHelp"]);
    expect(homeOrder.indexOf("study") + 1).toBe(homeOrder.indexOf("jobHelp"));
  });
  it("derives the tab counts from the list", () => {
    expect(home).toContain("allServices.length");
    expect(home).toContain('countOf("repair")');
    expect(home).toContain('countOf("support")');
  });
  it("makes the Study card a chooser, not a route: no /study link in the home, the chooser or the host table", () => {
    expect(home).toMatch(/kind === "study"/);
    for (const src of [home, read("components/customer/StudyChooser.tsx"), read("lib/home/studyHosts.ts")]) expect(src).not.toMatch(/href=["'`]\/study|["'`]\/study\//);
  });
  it("does not carry the deferred Aircon service (no card, no slug, no copy, no migration)", () => {
    for (const p of ["components/customer/CustomerHome.tsx", "lib/services.ts", "components/customer/StudyChooser.tsx", "lib/home/mainServiceKeys.ts"]) expect(read(p), p).not.toMatch(/aircon/i);
    for (const l of LOCALES) expect(JSON.stringify(dict(l)), l).not.toMatch(/aircon/i);
    expect(readdirSync("supabase/migrations").filter((f) => /aircon|202610050028/.test(f))).toEqual([]);
  });
});

describe("study destinations follow the environment and never fall into production by accident", () => {
  it("production, staging and local hosts", () => {
    expect(studyUrls("life.help")).toEqual({ math: "https://math.life.help", english: "https://english.life.help" });
    expect(studyUrls("korea.life.help")).toEqual({ math: "https://math.life.help", english: "https://english.life.help" });
    expect(studyUrls("localhost", "3100")).toEqual({ math: "http://math.localhost:3100", english: "http://english.localhost:3100" });
    expect(studyUrl("math", "app.localhost", "3000")).toBe("http://math.localhost:3000");
    expect(studyUrls("life-help-staging.example.workers.dev")).toEqual({ math: "https://math-staging.life.help", english: "https://english-staging.life.help" });
    expect(studyUrl("english", "evil.example.com")).toBe("https://english-staging.life.help");
    expect(STUDY_SUBJECTS).toEqual(["math", "english"]);
  });
});

describe("Study copy in every main-site locale", () => {
  it("has all 11 keys, non-empty, in all 38 locale files", () => {
    expect(LOCALES).toHaveLength(38);
    for (const l of LOCALES) for (const k of STUDY_KEYS) { const v = get(dict(l), k); expect(typeof v, `${l}:${k}`).toBe("string"); expect((v as string).trim().length, `${l}:${k}`).toBeGreaterThan(0); }
  });
  it("uses only the {site} placeholder, with the same placeholder as Korean in every locale, no markup or line break", () => {
    for (const l of LOCALES) for (const k of STUDY_KEYS) {
      const v = get(dict(l), k) as string, ko = get(dict("ko"), k) as string;
      expect(ph(v), `${l}:${k}`).toBe(ph(ko));
      for (const p of v.match(/\{(\w+)\}/g) ?? []) expect(STUDY_PLACEHOLDERS.map((x) => `{${x}}`)).toContain(p);
      expect(v, `${l}:${k}`).not.toMatch(/[<>\n]|\$/);
    }
  });
  it("Korean appears only in the Korean file; English copy is English; no locale left an English string untranslated except brand-like ones", () => {
    for (const l of LOCALES.filter((x) => x !== "ko")) for (const k of STUDY_KEYS) expect(get(dict(l), k) as string, `${l}:${k}`).not.toMatch(/[가-힯]/);
    for (const l of LOCALES.filter((x) => !["en", "ko", "vi"].includes(x))) expect(get(dict(l), "study.chooser.title"), l).not.toBe(get(dict("en"), "study.chooser.title"));
  });
  it("claims only what exists: no payment, scholarship, certification, ranking or 'official' wording (ko, en, vi)", () => {
    for (const k of STUDY_KEYS) for (const l of ["ko", "en", "vi"]) expect(get(dict(l), k) as string, `${l}:${k}`).not.toMatch(/certif|scholar|official|\bpaid\b|price|prize|ranking|공식|장학|인증|상금|chính thức|học bổng/i);
  });
});
