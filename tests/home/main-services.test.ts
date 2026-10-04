import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { translate } from "@/messages";
import { getProblemOptionsForService } from "@/lib/request/problemChecklists";
import { services } from "@/lib/services";
import { SUPPORT_CATEGORIES } from "@/lib/support/supportStore";
import { AIRCON_KEYS, AIRCON_SUBSERVICES, MAIN_SERVICE_KEYS, MAIN_SERVICE_PLACEHOLDERS, STUDY_KEYS } from "@/lib/home/mainServiceKeys";
import { STUDY_SUBJECTS, studyUrl, studyUrls } from "@/lib/home/studyHosts";

const read = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const dict = (l: string) => JSON.parse(read(`messages/${l}.json`)) as Record<string, unknown>;
const get = (o: unknown, path: string): unknown => path.split(".").reduce<unknown>((c, k) => (c && typeof c === "object" ? (c as Record<string, unknown>)[k] : undefined), o);
const ph = (s: string) => (s.match(/\{[A-Za-z0-9_]+\}/g) ?? []).sort().join(",");

const home = read("components/customer/CustomerHome.tsx");
const homeOrder = (() => {
  const block = home.slice(home.indexOf("const allServices"), home.indexOf("const benefits"));
  return [...block.matchAll(/^ {4}id: "(\w+)",/gm)].map((m) => m[1]);
})();

describe("home grid order", () => {
  it("puts Study immediately before job help, and mobile -> aircon -> boiler", () => {
    expect(homeOrder[0]).toBe("study");
    expect(homeOrder.indexOf("study") + 1).toBe(homeOrder.indexOf("jobHelp"));
    const m = homeOrder.indexOf("mobileHelp");
    expect(homeOrder.slice(m, m + 3)).toEqual(["mobileHelp", "aircon", "boiler"]);
    expect(homeOrder).toEqual(["study", "jobHelp", "mobileHelp", "aircon", "boiler", "housing", "cleaning", "hospitalHelp", "clog", "leakPlumbing", "bankHelp", "insuranceHelp"]);
    expect(new Set(homeOrder).size).toBe(homeOrder.length);
  });
  it("derives the tab counts from the list instead of hard-coding them", () => {
    expect(home).toContain("allServices.length");
    expect(home).toContain('countOf("repair")');
    expect(home).toContain('countOf("support")');
    expect(home).not.toMatch(/^\s+(10|5)\n\s+<\/span>/m);
  });
  it("makes the Study card a chooser, not a route: no /study link anywhere in the home or the chooser", () => {
    expect(home).toMatch(/kind === "study"/);
    for (const src of [home, read("components/customer/StudyChooser.tsx"), read("lib/home/studyHosts.ts")]) expect(src).not.toMatch(/href=["'`]\/study|["'`]\/study\/|life\.help\/study/);
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

describe("aircon is the 11th core service everywhere the closed catalogue exists", () => {
  const slugsIn = (text: string, from: string, to: string) => [...text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from))).matchAll(/"([a-z]+(?:-[a-z]+)*)"/g)].map((m) => m[1]);
  const CORE = ["clog-clearing", "leak-plumbing", "boiler", "cleaning", "housing", "bank-help", "insurance-help", "job-help", "hospital-help", "mobile-help", "aircon"];
  it("core slug list, DB type, migration constraints, services list, request page, themes and support catalogue agree", () => {
    expect(slugsIn(read("lib/request/serverRequest.ts"), "export const CORE_SERVICE_SLUGS", "];")).toEqual(CORE);
    expect(slugsIn(read("lib/db/schema.ts"), "export type CoreServiceSlug", ";")).toEqual(CORE);
    const sql = read("supabase/migrations/202610050028_aircon_service.sql");
    expect((sql.match(/'aircon'/g) ?? []).length).toBeGreaterThanOrEqual(6);
    for (const slug of CORE) expect(sql, slug).toContain(`'${slug}'`);
    expect(services.map((s) => s.slug).slice(0, 11)).toEqual(["clog-clearing", "leak-plumbing", "boiler", "cleaning", "housing", "bank-help", "insurance-help", "job-help", "hospital-help", "mobile-help", "aircon"]);
    const req = read("app/request/page.tsx");
    expect(slugsIn(req, "const ORDERED_SERVICE_SLUGS", "] as const")).toEqual(["job-help", "mobile-help", "aircon", "boiler", "housing", "cleaning", "hospital-help", "clog-clearing", "leak-plumbing", "bank-help", "insurance-help"]);
    expect(req).toMatch(/"aircon": \{\n\s+colorName: "시안"/);
    expect(read("components/support/SupportServiceView.tsx")).toMatch(/"aircon": \{\n\s+colorName: "시안"/);
    expect(SUPPORT_CATEGORIES.aircon.slug).toBe("aircon");
    expect(services.find((s) => s.slug === "study")).toBeUndefined();
  });
  it("study is not a marketplace service: not in the core slugs, the services list or the migration", () => {
    expect(read("lib/request/serverRequest.ts")).not.toMatch(/"study"/);
    expect(read("supabase/migrations/202610050028_aircon_service.sql")).not.toMatch(/study/i);
  });
  it("the request checklist (the existing request fields) offers install / repair / cleaning / access options in five languages and is never the default list", () => {
    const ko = getProblemOptionsForService("aircon", "ko");
    expect(ko.length).toBeGreaterThanOrEqual(12);
    expect(new Set(ko.map((o) => o.id)).size).toBe(ko.length);
    expect(ko.every((o) => o.id.startsWith("ac-"))).toBe(true);
    for (const tag of ["[설치]", "[수리]", "[청소]", "[접근]"]) expect(ko.some((o) => o.label.startsWith(tag)), tag).toBe(true);
    for (const loc of ["en", "vi", "zh-Hans", "zh-Hant", "fr"]) {
      const list = getProblemOptionsForService("aircon", loc);
      expect(list.map((o) => o.id)).toEqual(ko.map((o) => o.id));
      expect(list.every((o) => o.label.length > 0)).toBe(true);
    }
    expect(getProblemOptionsForService("aircon", "fr")[0].label).toMatch(/^\[Install\]/); // locales without a translation fall back to English, never Korean
    expect(getProblemOptionsForService("boiler", "ko")[0].id).toBe("bl-1");
    expect(getProblemOptionsForService("job-help", "ko")[0].id).not.toMatch(/^ac-/);
  });
  it("no price anywhere in the aircon copy, and the sub-services are exactly install / repair / cleaning", () => {
    expect(AIRCON_SUBSERVICES).toEqual(["aircon-install", "aircon-repair", "aircon-cleaning"]);
    const text = JSON.stringify([...AIRCON_KEYS].flatMap((k) => ["ko", "en", "vi"].map((l) => get(dict(l), k)))) + JSON.stringify(SUPPORT_CATEGORIES.aircon);
    expect(text).not.toMatch(/\d[\d,.]*\s*(USD|KRW|원|₩|\$|만원|won)/i);
  });
});

describe("main-service canonical i18n (MAIN_SERVICE_I18N)", () => {
  it(`has every one of the ${MAIN_SERVICE_KEYS.length} keys, non-empty, in Korean, English and Vietnamese`, () => {
    expect(MAIN_SERVICE_KEYS).toHaveLength(21);
    for (const l of ["ko", "en", "vi"]) for (const k of MAIN_SERVICE_KEYS) { const v = get(dict(l), k); expect(typeof v, `${l}:${k}`).toBe("string"); expect((v as string).trim().length, `${l}:${k}`).toBeGreaterThan(0); }
  });
  it("uses only the {site} placeholder, with the same placeholders in all three languages", () => {
    for (const k of MAIN_SERVICE_KEYS) {
      const ko = get(dict("ko"), k) as string;
      expect(ph(get(dict("en"), k) as string), k).toBe(ph(ko));
      expect(ph(get(dict("vi"), k) as string), k).toBe(ph(ko));
      for (const p of (ko.match(/\{(\w+)\}/g) ?? [])) expect(MAIN_SERVICE_PLACEHOLDERS.map((x) => `{${x}}`)).toContain(p);
    }
  });
  it("English has no Korean, Vietnamese has no Korean, and no string carries markup or a line break", () => {
    for (const k of MAIN_SERVICE_KEYS) {
      for (const l of ["en", "vi"]) expect(get(dict(l), k) as string, `${l}:${k}`).not.toMatch(/[가-힯]/);
      for (const l of ["ko", "en", "vi"]) expect(get(dict(l), k) as string, `${l}:${k}`).not.toMatch(/[<>\n]|\$/);
    }
  });
  it("Study copy claims only what exists: no payment, scholarship, certification, ranking or 'official' wording", () => {
    for (const k of STUDY_KEYS) for (const l of ["ko", "en", "vi"]) expect(get(dict(l), k) as string, `${l}:${k}`).not.toMatch(/certif|scholar|official|\bpaid\b|price|premium|ranking|prize|인증|장학|공식|유료|결제|상금|순위|chứng nhận|học bổng|chính thức|trả phí/i);
  });
  it("the canonical table in docs/learning/main-service-i18n.md equals the messages (no drift between the handoff and the code)", () => {
    const rows = [...read("docs/learning/main-service-i18n.md").matchAll(/^\| ((?:service|serviceBadge|serviceDesc|serviceProblems|serviceSubitems|supportChecklist|study)\.[\w.-]+) \| (.+?) \| (.+?) \|$/gm)];
    expect(rows.map((r) => r[1])).toEqual([...MAIN_SERVICE_KEYS]);
    for (const [, key, ko, en] of rows) { expect(get(dict("ko"), key), key).toBe(ko); expect(get(dict("en"), key), key).toBe(en); }
  });
  it("falls back to English (never Korean) in locales that have no translation yet, and the existing 38-locale coverage keys are untouched", () => {
    for (const loc of ["ja", "fr", "ar"] as const) {
      expect(translate(loc, "study.chooser.title")).toBe("What would you like to study?");
      expect(translate(loc, "service.aircon")).toBe("Air Conditioner Installation, Repair & Cleaning");
      expect(translate(loc, "service.study")).not.toMatch(/[가-힯]/);
    }
    expect(translate("ko", "service.study")).toBe("영어/수학 공부");
    expect(translate("ko", "service.aircon")).toBe("에어컨 설치, 수리, 청소");
    expect(translate("ko", "service.boiler")).toBe("보일러 설치, 시공, 수리");
  });
});
