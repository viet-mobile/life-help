// Minimal helpers for the learning migration tests (this release branch has no marketplace test fixtures).
import fs from "node:fs";

const dir = new URL("../../supabase/migrations/", import.meta.url);
/** Every .sql migration file in this repository, in version order. */
export const MIGRATIONS = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
/** SQL of one migration file (the pgcrypto extension line is dropped: PGlite has gen_random_uuid built in). */
export const sqlOf = (name) => fs.readFileSync(new URL(name, dir), "utf8").replace(/create extension if not exists pgcrypto[^;]*;/gi, "");

export function checker() {
  let failed = 0, passed = 0;
  const check = (name, condition, detail = "") => {
    if (condition) { passed += 1; console.log(`PASS ${name}`); }
    else { failed += 1; console.error(`FAIL ${name}${detail ? ` ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`); }
  };
  const done = () => {
    console.log(`${passed} passed, ${failed} failed`);
    if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");
  };
  return { check, done };
}
