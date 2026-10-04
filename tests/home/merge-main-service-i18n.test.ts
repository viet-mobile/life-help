import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MAIN_SERVICE_KEYS } from "@/lib/home/mainServiceKeys";
// plain ES module (the same code the CLI runs)
import { run, validateLocaleFile } from "../../scripts/home/merge-main-service-i18n.mjs";

const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
const get = (o: unknown, p: string): unknown => p.split(".").reduce<unknown>((c, k) => (c && typeof c === "object" ? (c as Record<string, unknown>)[k] : undefined), o);
/** SYNTHETIC translations (marked with the locale code): they only exercise the merge, they are not translations */
const synth = (locale: string, over: Record<string, string> = {}) => ({ ...Object.fromEntries(MAIN_SERVICE_KEYS.map((k) => [k, `${locale.toUpperCase()}~${String(get(en, k))}`])), ...over });
function sandbox(locales: string[]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "msi-"));
  const messages = path.join(root, "messages"), generated = path.join(root, "generated");
  fs.mkdirSync(messages); fs.mkdirSync(generated);
  fs.copyFileSync("messages/en.json", path.join(messages, "en.json"));
  for (const l of locales) fs.copyFileSync(`messages/${l}.json`, path.join(messages, `${l}.json`));
  return { messages, generated };
}
const write = (dir: string, locale: string, flat: unknown) => fs.writeFileSync(path.join(dir, `${locale}.json`), JSON.stringify(flat));

describe("main-service translation merge", () => {
  it("does nothing when there is no generated package", () => {
    const s = sandbox([]);
    expect(run({ generatedDir: path.join(s.generated, "missing"), messagesDir: s.messages, check: false }).merged).toEqual([]);
  });
  it("merges an accepted file into messages/<locale>.json, keeps the file's line endings and every other key, and is idempotent", () => {
    const s = sandbox(["ja", "de"]);
    const before = fs.readFileSync(path.join(s.messages, "ja.json"), "utf8");
    write(s.generated, "ja", synth("ja"));
    const r = run({ generatedDir: s.generated, messagesDir: s.messages, check: false });
    expect(r.merged).toEqual(["ja"]);
    const after = fs.readFileSync(path.join(s.messages, "ja.json"), "utf8");
    expect(after.includes("\r\n")).toBe(before.includes("\r\n"));
    const dict = JSON.parse(after), old = JSON.parse(before);
    for (const k of MAIN_SERVICE_KEYS) expect(get(dict, k)).toBe(`JA~${String(get(en, k))}`);
    expect(dict.customer.tagline).toBe(old.customer.tagline);
    expect(fs.readFileSync(path.join(s.messages, "de.json"), "utf8")).toBe(fs.readFileSync("messages/de.json", "utf8"));
    expect(run({ generatedDir: s.generated, messagesDir: s.messages, check: false }).merged).toEqual(["ja"]);
    expect(fs.readFileSync(path.join(s.messages, "ja.json"), "utf8")).toBe(after);
  });
  it("--check merges nothing and reports stale locales", () => {
    const s = sandbox(["ja"]);
    write(s.generated, "ja", synth("ja"));
    const before = fs.readFileSync(path.join(s.messages, "ja.json"), "utf8");
    expect(run({ generatedDir: s.generated, messagesDir: s.messages, check: true }).stale).toEqual(["ja"]);
    expect(fs.readFileSync(path.join(s.messages, "ja.json"), "utf8")).toBe(before);
    run({ generatedDir: s.generated, messagesDir: s.messages, check: false });
    expect(run({ generatedDir: s.generated, messagesDir: s.messages, check: true }).stale).toEqual([]);
  });
  it("rejects the WHOLE file on any broken rule and merges nothing from it", () => {
    const bad: Record<string, Record<string, unknown>> = {
      missing: (() => { const f = synth("ja"); delete (f as Record<string, string>)["service.aircon"]; return f; })(),
      extra: synth("ja", { "service.unknown": "x" }),
      empty: synth("ja", { "study.chooser.close": "  " }),
      placeholder: synth("ja", { "study.chooser.goTo": "Open {host}" }),
      lostPlaceholder: synth("ja", { "study.chooser.goTo": "Open" }),
      markup: synth("ja", { "service.aircon": "<b>x</b>" }),
      hangul: synth("ja", { "service.aircon": "에어컨" }),
      english: Object.fromEntries(MAIN_SERVICE_KEYS.map((k) => [k, String(get(en, k))])),
    };
    for (const [name, flat] of Object.entries(bad)) {
      const s = sandbox(["ja"]);
      const before = fs.readFileSync(path.join(s.messages, "ja.json"), "utf8");
      write(s.generated, "ja", flat);
      const r = run({ generatedDir: s.generated, messagesDir: s.messages, check: false });
      expect(r.rejected.map((x: { locale: string }) => x.locale), name).toEqual(["ja"]);
      expect(r.merged, name).toEqual([]);
      expect(fs.readFileSync(path.join(s.messages, "ja.json"), "utf8"), name).toBe(before);
    }
  });
  it("never overwrites the reviewed canonical locales (ko, en, vi) and ignores locales that have no messages file", () => {
    const s = sandbox(["ko", "vi"]);
    for (const l of ["ko", "en", "vi"]) write(s.generated, l, synth(l));
    write(s.generated, "xx", synth("xx"));
    const r = run({ generatedDir: s.generated, messagesDir: s.messages, check: false });
    expect(r.merged).toEqual([]);
    expect(r.rejected.map((x: { locale: string }) => x.locale).sort()).toEqual(["en", "ko", "vi", "xx"]);
    expect(fs.readFileSync(path.join(s.messages, "ko.json"), "utf8")).toBe(fs.readFileSync("messages/ko.json", "utf8"));
  });
  it("validateLocaleFile accepts a complete package and reports leftovers as warnings", () => {
    expect(validateLocaleFile("ja", synth("ja"), en).problems).toEqual([]);
    const left = validateLocaleFile("ja", synth("ja", { "study.chooser.close": String(get(en, "study.chooser.close")) }), en);
    expect(left.problems).toEqual([]);
    expect(left.warnings.join()).toMatch(/left identical to English/);
  });
});
