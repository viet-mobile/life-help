import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Math site: every stage names its world in the learner's language only (no English, no parentheses). */
const root = process.cwd();
const ENGLISH = ["Number Meadow", "Multiply Mountain", "Fraction Island", "Big Number Canyon", "Prime Peak", "Ratio Reef", "Algebra Forest"];
const readJson = (rel: string) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
type Courses = Record<string, { world: { name: string } }>;

describe("math site world names are learner-language only", () => {
  it("canonical Korean bundle has no English world names", () => {
    for (const f of ["elementary", "demo", "secondary"]) {
      for (const c of readJson(`lib/learn/content/${f}/math.json`).catalog.courses) {
        expect(c.world.name, c.id).toMatch(/[가-힣]/);
        expect(c.world.name, c.id).not.toMatch(/[A-Za-z]/);
      }
    }
  });
  const locales = fs.readdirSync(path.join(root, "content/learn-overlays")).filter((d) => fs.existsSync(path.join(root, "content/learn-overlays", d, "math.json")));
  for (const loc of locales) {
    it(`overlay ${loc}`, () => {
      const courses = readJson(`content/learn-overlays/${loc}/math.json`).courses as Courses;
      for (const [id, c] of Object.entries(courses)) {
        if (loc !== "en") expect(ENGLISH, `${loc} ${id}`).not.toContain(c.world.name);
        expect(c.world.name, `${loc} ${id}`).not.toMatch(/\([A-Za-z ]+\)$/);
      }
    });
  }
});
