import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * English site: every stage (E1..H3) names its world in the learner's language with the English name immediately to the right
 * in parentheses - "<learner language> (<English>)". English learners see the English name once.
 */
const root = process.cwd();
const ENGLISH: Record<string, string> = {
  "english-e1": "Alphabet Garden",
  "english-e2": "Word Pond",
  "english-e3": "Sentence Station",
  "english-e4": "Grammar Garden",
  "english-e5": "Comparison Cliffs",
  "english-e6": "Bridge to Middle School",
  "en-m1-basics": "Word Village",
  "en-m2-grammar-reading": "Sentence Garden",
  "en-m3-grammar-reading": "Deep in the Sentence Forest",
  "en-h1-grammar-reading": "Bridge of Logic",
  "en-h2-advanced-grammar-logic": "Tower of Rhetoric",
  "en-h3-reading-summary": "Exam Summit",
};
type WorldBundle = { courses: Record<string, { world: { name: string } }> };
const readJson = (rel: string) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));

describe("english site world names are '<learner language> (English)'", () => {
  it("canonical Korean bundle", () => {
    const names = new Map<string, string>();
    for (const f of ["elementary", "demo", "secondary"]) {
      for (const c of readJson(`lib/learn/content/${f}/english.json`).catalog.courses) names.set(c.id, c.world.name);
    }
    for (const [id, en] of Object.entries(ENGLISH)) {
      const name = names.get(id)!;
      expect(name.endsWith(` (${en})`), id).toBe(true);
      expect(/[가-힣]/.test(name.slice(0, -en.length - 3)), `${id} Korean part`).toBe(true);
    }
  });

  const locales = fs.readdirSync(path.join(root, "content/learn-overlays")).filter((d) => fs.existsSync(path.join(root, "content/learn-overlays", d, "english.json")));
  it("covers every overlay locale (all but ko and the generated vi)", () => expect(locales.length).toBeGreaterThanOrEqual(45));
  for (const loc of locales) {
    it(`overlay ${loc}`, () => {
      const { courses } = readJson(`content/learn-overlays/${loc}/english.json`) as WorldBundle;
      for (const [id, en] of Object.entries(ENGLISH)) {
        const name = courses[id].world.name;
        if (loc === "en") {
          expect(name, id).toBe(en);
        } else {
          expect(name.endsWith(` (${en})`), `${loc} ${id}: ${name}`).toBe(true);
          expect(name.slice(0, -en.length - 3).trim().length, `${loc} ${id} learner part`).toBeGreaterThan(0);
        }
      }
    });
  }

  it("generated Vietnamese overlays", () => {
    for (const f of ["english", "secondary-english"]) {
      for (const [id, c] of Object.entries((readJson(`lib/learn/content/vi/${f}.json`) as WorldBundle).courses)) {
        expect(c.world.name.endsWith(` (${ENGLISH[id]})`), id).toBe(true);
      }
    }
  });
});
