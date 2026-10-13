import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildAudit, readContent, validateCurriculum, validateMappings } from './audit-moe-2022.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const load = subject => JSON.parse(readFileSync(new URL(`../../lib/learn/curriculum/kr/2022/${subject}.json`, import.meta.url), 'utf8'));
for (const [subject, expected] of [['mathematics',435], ['english',270]]) {
  test(`${subject}: all official definitions trace to the source`, () => assert.equal(validateCurriculum(load(subject)).size, expected));
  test(`${subject}: no mapping is not a coverage gap`, () => {
    const report = buildAudit(load(subject), readContent(root, subject));
    assert.equal(report.summary.unreviewed, expected);
    assert.equal(report.summary.gap, 0);
    assert.equal(report.summary.covered, 0);
  });
}
test('reject duplicate definitions', () => {
  const data = load('mathematics'); data.achievement_standards.push(data.achievement_standards[0]);
  assert.throws(() => validateCurriculum(data), /Duplicate standard/);
});
test('reject missing pages and wrong source lines', () => {
  const missing = load('english'); missing.pages.pop();
  assert.throws(() => validateCurriculum(missing), /Missing source pages/);
  const wrong = load('english'); wrong.achievement_standards[0].source.line_start = 1;
  assert.throws(() => validateCurriculum(wrong), /Invalid source line/);
});
test('reject missing code definitions even when referenced only in prose', () => {
  const data = load('mathematics'); data.achievement_standards.pop();
  assert.throws(() => validateCurriculum(data), /no definition/);
});
const code = '4영01-01';
const standards = validateCurriculum(load('english'));
const content = {
  lessons: new Map([['official', { grade:'E3',questionIds:['q1'],skillIds:['s1'] }], ['extra',{grade:'E1',questionIds:['q1'],skillIds:['s1']}]]),
  questions: new Map([['q1',{id:'q1',skillId:'s1',status:'PUBLISHED'}],['unrelated',{id:'unrelated',skillId:'other',status:'PUBLISHED'}]]),
};
const entry = { code,status:'partial',lesson_ids:['official'],question_ids:['q1'],rationale:'Only sound recognition reviewed.',reviewed_by:'test reviewer' };
test('accept evidence-backed partial mapping', () => assert.doesNotThrow(() => validateMappings([entry],standards,content)));
test('reject unknown and duplicate mappings', () => {
  assert.throws(() => validateMappings([{...entry,code:'4영99-99'}],standards,content), /Unknown mapping/);
  assert.throws(() => validateMappings([entry,entry],standards,content), /Duplicate mapping/);
});
test('reject covered status without evidence or rationale', () => {
  assert.throws(() => validateMappings([{...entry,status:'covered',question_ids:[]}],standards,content), /Missing coverage evidence/);
  assert.throws(() => validateMappings([{...entry,rationale:''}],standards,content), /Missing coverage rationale/);
});
test('reject unrelated question evidence', () => assert.throws(() => validateMappings([{...entry,question_ids:['unrelated']}],standards,content), /not linked/));
test('reject E1/E2 English as official grade-band evidence', () => assert.throws(() => validateMappings([{...entry,lesson_ids:['extra']}],standards,content), /enrichment/));
test('explicit gap cannot carry coverage evidence', () => assert.throws(() => validateMappings([{...entry,status:'gap'}],standards,content), /Gap has coverage/));

test('reject duplicated evidence IDs', () => assert.throws(() => validateMappings([{...entry,question_ids:['q1','q1']}],standards,content), /Duplicate evidence/));
test('reject unpublished evidence', () => {
  const unpublished = { ...content, questions: new Map([['q1',{id:'q1',skillId:'s1',status:'DRAFT'}]]) };
  assert.throws(() => validateMappings([entry],standards,unpublished), /Unpublished evidence/);
});
