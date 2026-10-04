import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateContentPack } from "@/lib/learn/products/content";
// plain ES module (the same code the CLI runs)
import { LEGACY_PRODUCTS, discover, dryRun, loadRights, namespacedId, normalize, parseNamespacedId, parseSources, report, rightsOf, scanDataBlock, validate } from "../../scripts/learn/study/importer.mjs";

const UI = ["ko", "vi", "en"];
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "legacy-"));
const DATA = `const SITE = {"a":1,"b":[1,2]};
const WORDS = [{"id":"w1","t":"x"},{"id":"w2","t":"y \\" }"},{"id":"w3","t":"z"}];
const NOTES = {"p":"1","q":"2"};
const NOT_JSON = [function(){}];
const SCALAR = 5;
let UNFINISHED = [1,2`;

describe("id namespace: stable, injective, unique across targets", () => {
  it("builds study:<target>:<type>:<legacyId> and round-trips", () => {
    expect(namespacedId("korean", "vocab", "w12")).toBe("study:korean:vocab:w12");
    for (const id of ["w12", "a b", "한글", "x:y", "~tilde", "a~0020b", "100%"]) expect(parseNamespacedId(namespacedId("japanese", "lesson", id)).legacyId).toBe(id);
  });
  it("is injective: an unsafe character can never collide with its own escape text", () => {
    expect(namespacedId("korean", "vocab", "a b")).not.toBe(namespacedId("korean", "vocab", "a~0020b"));
    const ids = ["a b", "a~0020b", "a_b", "a-b", "a.b", "A b", "a  b"].map((x) => namespacedId("korean", "vocab", x));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("never collides across targets or content types for the same legacy id", () => {
    const ids = ["korean", "english", "japanese", "chinese", "indonesian", "vietnamese"].flatMap((t) => ["vocab", "grammar", "lesson", "exercise"].map((c) => namespacedId(t, c, "1")));
    expect(new Set(ids).size).toBe(24);
  });
  it("is deterministic and rejects bad input", () => {
    expect(namespacedId("korean", "vocab", "x")).toBe(namespacedId("korean", "vocab", "x"));
    expect(() => namespacedId("Korean", "vocab", "x")).toThrow();
    expect(() => namespacedId("korean", "word", "x")).toThrow();
    expect(() => namespacedId("korean", "vocab", "")).toThrow();
    expect(() => namespacedId("korean", "vocab", "x".repeat(250))).toThrow(/200/);
    expect(() => parseNamespacedId("korean:vocab:1")).toThrow();
  });
});

describe("parse: measured containers, no code executed", () => {
  it("counts rows and sizes of JSON containers, survives braces inside strings, and reports what it cannot read", () => {
    const c = Object.fromEntries((scanDataBlock(DATA) as { name: string; kind: string; rows: number }[]).map((x) => [x.name, x]));
    expect(c.SITE).toMatchObject({ kind: "object", rows: 2 });
    expect(c.WORDS).toMatchObject({ kind: "array", rows: 3 });
    expect(c.NOTES).toMatchObject({ kind: "object", rows: 2 });
    expect(c.NOT_JSON.kind).toBe("not-json");
    expect(c.SCALAR.kind).toBe("scalar");
    expect(c.UNFINISHED.kind).toBe("unterminated");
  });
  it("never evaluates the file: a side effect in the data block does not run", () => {
    (globalThis as Record<string, unknown>).__ran = false;
    scanDataBlock("const X = [(globalThis.__ran = true)];\nconst Y = [1];");
    expect((globalThis as Record<string, unknown>).__ran).toBe(false);
  });
});

describe("pipeline on a synthetic legacy root: counts come from the files", () => {
  const root = tmp();
  const product = { product: "korean", targetLanguageId: "ko", legacyHost: "study.korean.viet.mobile", newHost: "study.korean.life.help", dataBlocks: ["data/korean.js"], dist: "x" };
  fs.mkdirSync(path.join(root, "data"), { recursive: true });
  const words = Array.from({ length: 7 }, (_, i) => ({ id: `w${i}`, ko: `단어${i}`, vi: `từ ${i}` }));
  fs.writeFileSync(path.join(root, "data/korean.js"), `const WORDS = ${JSON.stringify(words)};\nconst LESSONS = [{"id":"L1","title":"one"}];\nconst EXTRA = [1,2,3];\n`);
  const disc = discover(root, [product]);
  const parsed = parseSources(root, disc);
  const adapters = {
    LESSONS: (rows: { id: string; title: string }[]) => ({ lessons: rows.map((r, i) => ({ id: r.id, targetLanguageId: "ko", level: 1, order: i + 1, title: { ko: r.title }, vocabularyIds: words.map((w) => w.id), grammarIds: [], exerciseIds: [] })) }),
    WORDS: (rows: typeof words) => ({ vocabulary: rows.map((w) => ({ id: w.id, targetLanguageId: "ko", target: w.ko, translations: { vi: w.vi }, partOfSpeech: "noun", level: 1, lessonId: "L1", examples: [], extension: { kind: "ko", hangul: w.ko } })) }),
  };

  it("discover reads size and sha256 from disk, and marks absent files absent", () => {
    expect(disc[0].sources[0]).toMatchObject({ present: true, bytes: fs.statSync(path.join(root, "data/korean.js")).size });
    expect(disc[0].sources[0].sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(discover(root, [{ ...product, dataBlocks: ["nope.js"] }])[0].sources[0].present).toBe(false);
  });
  it("without adapters nothing is imported and every container is reported unmapped with its measured size", () => {
    const n = normalize(parsed);
    expect(n[0].pack.vocabulary).toHaveLength(0);
    expect(n[0].unmapped.map((u: { container: string; rows: number }) => `${u.container}:${u.rows}`).sort()).toEqual(["EXTRA:3", "LESSONS:1", "WORDS:7"]);
  });
  it("adapters produce namespaced, valid packs whose counts equal the file's rows", () => {
    const n = normalize(parsed, adapters, { provenance: { source: "synthetic", licence: "test", importedAt: "2030-01-01T00:00:00Z" } });
    expect(n[0].pack.vocabulary).toHaveLength(7);
    expect(n[0].pack.lessons).toHaveLength(1);
    expect(n[0].pack.vocabulary[0].id).toBe("study:korean:vocab:w0");
    expect(n[0].pack.lessons[0].vocabularyIds[0]).toBe("study:korean:vocab:w0");
    expect(n[0].pack.vocabulary[0].lessonId).toBe("study:korean:lesson:L1");
    expect(n[0].unmapped.map((u: { container: string }) => u.container)).toEqual(["EXTRA"]);
    expect(validate(n, validateContentPack, UI)[0].problems).toEqual([]);
  });
  it("is repeatable: the same files give byte-identical reports", () => {
    const run = () => { const nn = normalize(parseSources(root, discover(root, [product])), adapters); return JSON.stringify(report({ discovered: disc, parsed, normalized: nn, validation: validate(nn, validateContentPack, UI), rights: { version: 1, decisions: {} } })); };
    expect(run()).toBe(run());
  });
  it("a changed file changes the hash and the counts (nothing is cached or typed)", () => {
    const before = discover(root, [product])[0].sources[0].sha256;
    fs.writeFileSync(path.join(root, "data/korean.js"), `const WORDS = ${JSON.stringify(words.slice(0, 2))};\n`);
    const after = discover(root, [product]);
    expect(after[0].sources[0].sha256).not.toBe(before);
    expect(parseSources(root, after)[0].sources[0].containers[0].rows).toBe(2);
  });
});

describe("rights gate and dry run", () => {
  const src = { id: "legacy:korean:data_block.study_korean.js" };
  const pack = (ids: string[]) => ({ product: "korean", pack: { vocabulary: ids.map((id) => ({ id })), grammar: [], lessons: [], exercises: [] }, mapped: [], unmapped: [] });
  it("an unlisted source, or a clearing decision without evidence, is UNCLEARED", () => {
    expect(rightsOf({ version: 1, decisions: {} }, src.id).status).toBe("UNCLEARED");
    expect(rightsOf({ version: 1, decisions: { [src.id]: { status: "LICENSED" } } }, src.id).status).toBe("UNCLEARED");
    expect(rightsOf({ version: 1, decisions: { [src.id]: { status: "RESTRICTED", note: "no" } } }, src.id).status).toBe("RESTRICTED");
    expect(rightsOf({ version: 1, decisions: { [src.id]: { status: "LICENSED", evidence: "contract-7", decidedBy: "legal", decidedAt: "2030-01-01" } } }, src.id).status).toBe("LICENSED");
  });
  it("the committed rights file clears nothing today", () => {
    const rights = loadRights("data/learning-study/rights.json");
    expect(Object.values(rights.decisions).every((d) => (d as { status: string }).status === "UNCLEARED")).toBe(true);
    expect(Object.keys(rights.decisions)).toHaveLength(LEGACY_PRODUCTS.length);
    for (const p of LEGACY_PRODUCTS) expect(rightsOf(rights, `legacy:${p.product}:${p.dataBlocks[0].split("/").pop()}`).status).toBe("UNCLEARED");
  });
  it("the dry run refuses uncleared sources and creates nothing", () => {
    const r = dryRun([pack(["study:korean:vocab:w1"])], { version: 1, decisions: {} }, { korean: [src] });
    expect(r[0]).toMatchObject({ refused: true, wouldImport: null, database: "NOT TOUCHED (dry run)" });
    expect(r[0].reasons[0]).toMatch(/UNCLEARED/);
  });
  it("with a cleared source it plans the rows, and an id collision refuses even then", () => {
    const rights = { version: 1, decisions: { [src.id]: { status: "OWNED", evidence: "authored in-house", decidedBy: "owner", decidedAt: "2030-01-01" } } };
    expect(dryRun([pack(["a", "b"])], rights, { korean: [src] })[0]).toMatchObject({ refused: false, wouldImport: { vocabulary: 2, grammar: 0, lessons: 0, exercises: 0 } });
    const dup = dryRun([pack(["a", "a"])], rights, { korean: [src] })[0];
    expect(dup.refused).toBe(true);
    expect(dup.reasons.join()).toMatch(/id collision/);
  });
});

const REAL = path.join(os.homedir(), "Documents", "viet-project");
describe.skipIf(!fs.existsSync(path.join(REAL, "hoc-tieng-viet-mobile", "data_block.js")))("the real legacy files on this machine", () => {
  it("measures real containers, imports nothing (no adapter, rights uncleared) and refuses all six products", () => {
    const disc = discover(REAL);
    const parsed = parseSources(REAL, disc);
    const rights = loadRights("data/learning-study/rights.json");
    const norm = normalize(parsed);
    const locales = JSON.parse(fs.readFileSync("messages/generated/locale-registry.json", "utf8")).locales;
    const rep = report({ discovered: disc, parsed, normalized: norm, validation: validate(norm, validateContentPack, locales), rights });
    expect(rep.products).toHaveLength(6);
    const vi = rep.products.find((p: { product: string }) => p.product === "vietnamese");
    expect(vi.sources[0].containers).toBeGreaterThan(50);
    expect(vi.sources[0].rowsInContainers).toBeGreaterThan(1000);
    for (const p of rep.products) { expect(Object.values(p.packCounts).reduce((a: number, b) => a + (b as number), 0)).toBe(0); expect(p.validationProblems).toBe(0); }
    const dry = dryRun(norm, rights, Object.fromEntries(disc.map((d: { product: string; sources: unknown[] }) => [d.product, d.sources])));
    expect(dry.every((d: { refused: boolean }) => d.refused)).toBe(true);
  });
});
