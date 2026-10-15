import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  readContent,
  validateCurriculum,
  validateMappings,
  expandAuditBank,
  validateBankEvidence,
  contentSourceFiles,
} from "./audit-moe-2022.mjs";
const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (file) => JSON.parse(readFileSync(resolve(root, file), "utf8"));
const data = read("lib/learn/curriculum/kr/2022/mathematics.json");
const standards = validateCurriculum(data);
const content = readContent(root, "mathematics");
const mappings = read("docs/learning/curriculum-mappings/reviewed.json").mathematics;
const evidence = () => read("docs/learning/curriculum-mappings/bank-evidence.json");
const fixture = () => ({
  format: 1,
  site: "math",
  templates: {
    test: { prompt: "{x} and $a^{n}$", hints: ["hint {x}"], explanation: "answer {ans}" },
  },
  texts: { word: "value" },
  sets: [
    {
      id: "b-test",
      skillId: "s",
      family: "test",
      template: "test",
      difficulty: 2,
      cols: ["x"],
      rows: [[3, 6]],
    },
  ],
});

test("loads all 6,672 bank questions in addition to 1,078 canonical questions", () => {
  assert.equal(content.questions.size, 7750);
  assert.equal(content.canonicalQuestions, 1078);
  assert.equal(content.bankSets.size, 194);
  assert.equal(content.questions.get("b-e3-ari1-addthree1-001").bank_source.row_number, 1);
  assert(contentSourceFiles(root, "mathematics").includes("lib/learn/content/bank/math.json"));
  assert.equal(readContent(root, "english").questions.size, 628);
});
test("accepts published bank evidence linked to the same lesson skill", () => {
  validateMappings(
    [
      {
        code: "4수01-03",
        status: "partial",
        lesson_ids: ["math-e3-ari1"],
        question_ids: ["b-e3-ari1-addthree1-001"],
        rationale: "Three-digit practice evidence only.",
        reviewed_by: "test",
      },
    ],
    standards,
    content,
  );
});
test("rejects unrelated bank skills and nonexistent row IDs", () => {
  const entry = {
    code: "4수01-03",
    status: "partial",
    lesson_ids: ["math-e1-l1"],
    question_ids: ["b-e3-ari1-addthree1-001"],
    rationale: "test",
    reviewed_by: "test",
  };
  assert.throws(() => validateMappings([entry], standards, content), /not linked/);
  for (const id of ["b-e3-ari1-addthree1-000", "b-e3-ari1-addthree1-999"])
    assert.throws(
      () => validateMappings([{ ...entry, question_ids: [id] }], standards, content),
      /Unknown evidence question/,
    );
});
test("validates all 435 evidence rows and 20 candidates without changing reviewed statuses", () => {
  const before = JSON.stringify(mappings);
  const result = validateBankEvidence(evidence(), standards, content, mappings);
  assert.deepEqual(result.effects, { none: 276, strengthens: 139, could_upgrade: 20 });
  assert.equal(result.candidates.length, 20);
  assert(result.candidates.every((c) => c.status_changed === false));
  assert.equal(JSON.stringify(mappings), before);
});
test("rejects stale bank inventory and reviewed status", () => {
  const inventory = evidence();
  inventory.bank.questions--;
  assert.throws(
    () => validateBankEvidence(inventory, standards, content, mappings),
    /Stale bank evidence inventory/,
  );
  const stale = evidence();
  stale.standards[0].status = "gap";
  assert.throws(
    () => validateBankEvidence(stale, standards, content, mappings),
    /Stale bank evidence status/,
  );
});
test("rejects samples from another set, duplicate codes and missing standards", () => {
  const wrong = evidence();
  wrong.standards[0].sample_question_ids = ["b-e3-ari1-addthree1-001"];
  assert.throws(() => validateBankEvidence(wrong, standards, content, mappings), /set membership/);
  const duplicate = evidence();
  duplicate.standards.push(duplicate.standards[0]);
  assert.throws(
    () => validateBankEvidence(duplicate, standards, content, mappings),
    /duplicate bank evidence code/,
  );
  const missing = evidence();
  missing.standards.pop();
  assert.throws(
    () => validateBankEvidence(missing, standards, content, mappings),
    /Missing bank evidence standard/,
  );
});
test("preserves literal math braces and resolves canonical text references", () => {
  const bank = fixture();
  bank.sets[0].rows = [["#word", 6]];
  const q = expandAuditBank(bank, new Set(["s"]), "bank.json").questions.get("b-test-001");
  assert.equal(q.prompt, "value and $a^{n}$");
  assert.deepEqual(q.answer, { kind: "numeric", value: 6 });
});
test("rejects unknown skills, templates, duplicate sets and malformed rows", () => {
  const unknown = fixture();
  unknown.sets[0].skillId = "missing";
  assert.throws(() => expandAuditBank(unknown, new Set(["s"]), "bank.json"), /Unknown bank skill/);
  const template = fixture();
  template.templates = {};
  assert.throws(() => expandAuditBank(template, new Set(["s"]), "bank.json"), /bank template/);
  const duplicate = fixture();
  duplicate.sets.push(duplicate.sets[0]);
  assert.throws(
    () => expandAuditBank(duplicate, new Set(["s"]), "bank.json"),
    /Duplicate\/invalid bank set/,
  );
  const row = fixture();
  row.sets[0].rows = [[3]];
  assert.throws(() => expandAuditBank(row, new Set(["s"]), "bank.json"), /row width/);
  const answer = fixture();
  answer.sets[0].rows = [[3, null]];
  assert.throws(() => expandAuditBank(answer, new Set(["s"]), "bank.json"), /Invalid bank answer/);
});
test("old snapshots without banks remain readable, collisions fail", () => {
  const dir = mkdtempSync(resolve(tmpdir(), "curriculum-bank-test-"));
  const put = (name, value) => {
    const file = resolve(dir, name);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(value));
  };
  try {
    for (const tier of ["elementary", "demo", "secondary"])
      put(`lib/learn/content/${tier}/math.json`, {
        catalog: { skills: tier === "elementary" ? [{ id: "s" }] : [], courses: [] },
        questions: [],
      });
    assert.equal(readContent(dir, "mathematics").questions.size, 0);
    assert.equal(readContent(dir, "mathematics").source_files.length, 3);
    put("lib/learn/content/bank/math.json", fixture());
    assert.equal(readContent(dir, "mathematics").questions.size, 1);
    put("lib/learn/content/elementary/math.json", {
      catalog: { skills: [{ id: "s" }], courses: [] },
      questions: [{ id: "b-test-001", skillId: "s" }],
    });
    assert.throws(() => readContent(dir, "mathematics"), /Duplicate question/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
