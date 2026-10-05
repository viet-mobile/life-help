import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MAIN_SERVICE_KEYS } from "../../lib/home/mainServiceKeys";
import { runMainService, verifyMainServiceLocale } from "../../scripts/learn/i18n/verify-main-service-locales.mjs";

/** Synthetic fixtures (no real translation) reproducing the defect classes: wrong language, missing/extra keys, lost {site}, Hangul, markup, copied locales. */
const flatten = (o: Record<string, unknown>, p = ""): [string, string][] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flatten(v as Record<string, unknown>, `${p}${k}.`) : [[`${p}${k}`, String(v)] as [string, string]]));
const en = Object.fromEntries(flatten(JSON.parse(fs.readFileSync("messages/en.json", "utf8"))));
const pseudo = (ch: string) => Object.fromEntries(MAIN_SERVICE_KEYS.map((k) => [k, en[k].split(/(\{site\})/).map((p, i) => (i % 2 ? p : p.replace(/\p{L}/gu, ch))).join("")]));

describe("main-service locale verifier", () => {
  it("accepts a structurally clean pseudo-translation in the locale's own script", () => {
    expect(verifyMainServiceLocale("th", pseudo("ก")).problems).toEqual([]);
  });
  it("covers exactly the 21 canonical keys and {site} is the only placeholder", () => {
    expect(MAIN_SERVICE_KEYS).toHaveLength(21);
    expect(MAIN_SERVICE_KEYS.filter((k) => en[k].includes("{site}"))).toEqual(["study.chooser.goTo"]);
  });
  it("flags a locale in the wrong script", () => {
    expect(verifyMainServiceLocale("th", pseudo("a")).problems.join("\n")).toMatch(/WRONG LANGUAGE/);
  });
  it("flags missing and extra keys, lost {site}, Hangul and markup", () => {
    const f: Record<string, string> = pseudo("ก");
    delete f["service.study"]; f["extra.key"] = "x";
    f["study.chooser.goTo"] = "เปิด"; f["study.chooser.close"] = "한국어"; f["study.chooser.math"] = "a<b>\n$x$";
    const p = verifyMainServiceLocale("th", f).problems.join("\n");
    for (const re of [/missing 1/, /extra 1/, /site 1/, /hangul 1/, /markup 1/]) expect(p).toMatch(re);
  });
  it("flags copying between languages, a generated reference locale and missing files", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ms-"));
    try {
      for (const l of ["th", "ja", "ko"]) fs.writeFileSync(path.join(dir, `${l}.json`), JSON.stringify(pseudo("ก")));
      const r = runMainService(dir);
      const all = r.problems.join("\n");
      expect(all).toMatch(/copied between languages/);
      expect(all).toMatch(/ko: reference locale must not be generated/);
      expect(all).toMatch(/missing file/);
      expect(runMainService(path.join(dir, "none")).problems.length).toBeGreaterThanOrEqual(35);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});
