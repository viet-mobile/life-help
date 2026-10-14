import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderCoverageDoc } from "../learn/curriculum-coverage-doc.mjs";
const coverage = readFileSync(
  new URL("../../docs/learning/curriculum-2022-coverage.md", import.meta.url),
  "utf8",
);
const revision = /검토한 콘텐츠 커밋: `([a-f0-9]+)`/.exec(coverage)[1];
const mappings = () =>
  JSON.parse(
    readFileSync(
      new URL("../../docs/learning/curriculum-mappings/reviewed.json", import.meta.url),
      "utf8",
    ),
  );

test("coverage doc includes all current content and is deterministic", () => {
  const body = renderCoverageDoc(revision);
  assert.equal(
    body,
    readFileSync(
      new URL("../../docs/learning/curriculum-2022-coverage.md", import.meta.url),
      "utf8",
    ),
  );
  assert.match(body, /\| 수학 \| 119 \| 7750 \|/);
  assert.match(body, /\| 영어 \| 64 \| 628 \|/);
  assert.match(body, /\| \*\*합계\*\* \| 435 \| 64 \| 201 \| 170 \| 0 \|/);
  assert.match(body, /\| \*\*합계\*\* \| 270 \| 35 \| 57 \| 178 \| 0 \|/);
});
test("doc generation rejects unknown evidence rather than publishing a table", () => {
  const invalid = mappings();
  invalid.mathematics.find((e) => e.status === "covered").question_ids.push("missing-question");
  assert.throws(() => renderCoverageDoc(revision, invalid), /Unknown evidence question/);
});
test("duplicate mappings cannot silently overwrite one another in the doc", () => {
  const invalid = mappings();
  invalid.english.push(invalid.english[0]);
  assert.throws(() => renderCoverageDoc(revision, invalid), /Duplicate mapping/);
});
test("an unspecified subject cannot be rendered as a reviewed coverage table", () => {
  const invalid = mappings();
  delete invalid.english;
  assert.throws(() => renderCoverageDoc(revision, invalid), /Missing english/);
});
test("rationale-only edits change the fingerprint and make the doc stale", () => {
  const edited = mappings();
  edited.english[0].rationale += " Updated explanation.";
  assert.notEqual(renderCoverageDoc(revision, edited), renderCoverageDoc(revision));
});
test("a report requires an explicit content commit", () =>
  assert.throws(() => renderCoverageDoc("UNKNOWN"), /actual content commit/));
