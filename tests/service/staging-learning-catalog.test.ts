import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { createChainDb } from "../learn/chainDb";

const sql = fs.readFileSync(path.resolve("scripts/staging/learning-catalog-readonly.sql"), "utf8");
type Report = {
  tables: Array<{
    name: string;
    rls: boolean;
    anon_select: boolean;
    anon_write: boolean;
    service_select: boolean;
  }>;
  columns: Array<{
    table: string;
    column: string;
    exists: boolean;
    type: string;
    not_null: boolean;
  }>;
  grade_constraints: Array<{
    table: string;
    column: string;
    checks: Array<{ name: string; validated: boolean; definition: string }>;
  }>;
  staff_policies: Array<{ using: string; with_check: string }>;
  staff_predicate: { exists: boolean; security_definer: boolean; settings: string[] };
  remaining_shim_markers: unknown[];
};
let db: PGlite;
const report = async () => {
  const results = await db.exec(sql);
  return results.flatMap((r) => r.rows).find((r) => "learning_catalog_report" in r)!
    .learning_catalog_report as Report;
};
beforeAll(async () => {
  db = await createChainDb();
}, 120_000);
afterAll(async () => {
  await db?.close();
});

describe("read-only learning catalog supplement on the real migration chain", () => {
  it("returns metadata for all 26 learning tables without reading content rows", async () => {
    const r = await report();
    expect(r.tables).toHaveLength(26);
    expect(
      r.tables.every((t) => t.rls && !t.anon_select && !t.anon_write && t.service_select),
    ).toBe(true);
    expect(r.columns).toEqual(
      expect.arrayContaining([
        {
          table: "learn_questions",
          column: "figure",
          exists: true,
          type: "jsonb",
          not_null: false,
        },
        {
          table: "learn_courses",
          column: "elective",
          exists: true,
          type: "boolean",
          not_null: true,
        },
      ]),
    );
  });
  it("shows deployed grade constraint definitions, private staff policies and removed shim markers", async () => {
    const r = await report();
    expect(r.grade_constraints).toHaveLength(3);
    for (const row of r.grade_constraints) {
      expect(row.checks).toHaveLength(1);
      expect(row.checks[0].validated).toBe(true);
      if (row.column === "grade")
        for (const grade of ["E1", "E2", "E3", "E4", "E5", "E6"])
          expect(row.checks[0].definition).toContain(`'${grade}'`);
      else expect(row.checks[0].definition).toContain("'elementary'");
    }
    expect(r.staff_policies).toHaveLength(14);
    expect(
      r.staff_policies.every(
        (p) =>
          p.using.includes("learn_security.is_staff") &&
          p.with_check.includes("learn_security.is_staff"),
      ),
    ).toBe(true);
    expect(r.staff_predicate.exists && r.staff_predicate.security_definer).toBe(true);
    expect(r.remaining_shim_markers).toEqual([]);
  });
  it("exposes a missing grade constraint instead of inferring 027 from a visible table", async () => {
    await db.exec(
      "alter table public.learn_student_profiles drop constraint learn_student_profiles_grade_check",
    );
    const r = await report();
    expect(r.grade_constraints.find((x) => x.table === "learn_student_profiles")!.checks).toEqual(
      [],
    );
  });
  it("never uses table reads or mutating SQL; its transaction is explicitly read-only", () => {
    const text = sql.replace(/--.*$/gm, "").replace(/'(?:[^']|'')*'/g, "'literal'");
    expect(text).toMatch(/begin transaction read only/i);
    expect(text).not.toMatch(/\b(insert|update|delete|alter|create|drop|truncate|call)\b/i);
    expect(text).not.toMatch(/\bfrom\s+(?:public\.)?learn_/i);
  });
});
