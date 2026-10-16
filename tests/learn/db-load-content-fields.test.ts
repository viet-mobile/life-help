/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createChainDb, demoSeed } from "./chainDb";

/**
 * Guard for the move from bundled content to database-backed content (LEARN_CONTENT_SOURCE=db): migration 043 added the `figure` column of
 * questions and the `elective` flag of courses, and re-created learn_load_content to return them. These tests read the RPC's raw JSON on a
 * local PGlite database (real migration chain + the demo seed; no network, no remote database) and compare it with the bundled content,
 * so a dropped field can never reach students silently. The same checks are worth repeating against staging before the switch.
 */
let db: PGlite;
type Q = { id: string; figure?: Record<string, unknown> };
type Course = { id: string; grade: string; elective?: boolean };
const load = async (site: string) => (await db.query<{ c: { catalog: { courses: Course[] }; questions: Q[] } }>("select public.learn_load_content($1) as c", [site])).rows[0].c;

beforeAll(async () => {
  db = await createChainDb();
  await db.exec(`set app.allow_demo_seed = 'on'; ${demoSeed()}`);
});
afterAll(async () => {
  await db.close();
});

describe("learn_load_content returns the fields added by migration 043", () => {
  it("figure: every bundled question that has a figure comes back with the same figure object; questions without one carry no key", async () => {
    const { demoContentRepository } = await import("@/lib/learn/content/repository");
    const bundled = await demoContentRepository.getBundle("math");
    const withFigure = bundled.questions.filter((q) => q.figure);
    expect(withFigure.length).toBeGreaterThan(100); // the geometry layer is figure based
    const raw = await load("math");
    const byId = new Map(raw.questions.map((q) => [q.id, q]));
    for (const q of withFigure) expect(byId.get(q.id)?.figure, q.id).toEqual(JSON.parse(JSON.stringify(q.figure)));
    for (const q of bundled.questions.filter((x) => !x.figure)) expect("figure" in (byId.get(q.id) ?? {}), q.id).toBe(false);
  });

  it("elective: elective courses carry elective:true, regular courses carry no key, and english has only its H3 electives course", async () => {
    const { demoContentRepository } = await import("@/lib/learn/content/repository");
    const bundled = await demoContentRepository.getBundle("math");
    const electives = bundled.catalog.courses.filter((c) => c.elective).map((c) => c.id).sort();
    expect(electives.length).toBe(6);
    const raw = await load("math");
    expect(raw.catalog.courses.filter((c) => c.elective === true).map((c) => c.id).sort()).toEqual(electives);
    expect(raw.catalog.courses.filter((c) => !electives.includes(c.id)).every((c) => !("elective" in c))).toBe(true);
    const en = await load("english");
    expect(en.catalog.courses.filter((c) => "elective" in c).map((c) => c.id)).toEqual(["en-h3e-electives"]);
    expect(en.catalog.courses.filter((c) => c.elective === true).length).toBe(1);
  });

  it("an archived figure question is hidden, and the function is service-role only", async () => {
    const raw = await load("math");
    const target = raw.questions.find((q) => q.figure)!;
    await db.query("update public.learn_questions set status = 'ARCHIVED' where code = $1", [target.id]);
    expect((await load("math")).questions.map((q) => q.id)).not.toContain(target.id);
    await db.exec("set role anon");
    await expect(db.query("select public.learn_load_content('math')")).rejects.toThrow();
    await db.exec("reset role");
  });
});
