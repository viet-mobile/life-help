import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const fail = (condition, message) => { if (!condition) throw new Error(message); };
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));

export function validateCurriculum(data) {
  fail(data.schema_version === '1.0.0', 'Unsupported curriculum schema');
  fail(['mathematics', 'english'].includes(data.subject), 'Unknown subject');
  fail(data.pages.length === data.source.pdf_page_count, 'Missing source pages');
  fail(/^[a-f0-9]{64}$/.test(data.source.sha256), 'Invalid source SHA-256');
  const courses = new Map(data.courses.map(c => [c.id, c]));
  fail(courses.size === data.courses.length, 'Duplicate course IDs');
  data.pages.forEach((page, index) => {
    fail(page.pdf_page === index + 1, 'Noncontiguous page numbers');
    fail(typeof page.text === 'string' && typeof page.layout_text === 'string', 'Missing page text');
  });
  const standards = new Map();
  for (const standard of data.achievement_standards) {
    fail(!standards.has(standard.code), `Duplicate standard: ${standard.code}`);
    fail(/^\d+[^\s]+-\d{2}$/.test(standard.code), `Invalid code: ${standard.code}`);
    const page = data.pages[standard.source.pdf_page - 1];
    fail(Boolean(page), `Invalid page: ${standard.code}`);
    fail(page.text.split('\n')[standard.source.line_start - 1]?.startsWith(`[${standard.code}]`), `Invalid source line: ${standard.code}`);
    fail(typeof standard.text === 'string' && standard.text.endsWith('.'), `Incomplete standard: ${standard.code}`);
    fail(standard.raw_text.split('\n').every(line => page.text.includes(line)), `Untraceable statement: ${standard.code}`);
    const course = courses.get(standard.course_id);
    fail(Boolean(course), `Unknown course: ${standard.code}`);
    fail(course.pdf_page_start <= page.pdf_page && page.pdf_page <= course.pdf_page_end, `Wrong course range: ${standard.code}`);
    standards.set(standard.code, standard);
  }
  const referenced = new Set(data.pages.flatMap(page => [...page.text.matchAll(/\[([0-9][^\]\s]*-\d{2})\]/g)].map(match => match[1])));
  fail([...referenced].every(code => standards.has(code)), 'A referenced achievement code has no definition');
  return standards;
}

export function readContent(contentRoot, subject) {
  const site = subject === 'mathematics' ? 'math' : 'english';
  const lessons = new Map();
  const questions = new Map();
  for (const tier of ['elementary', 'demo', 'secondary']) {
    const relative = `lib/learn/content/${tier}/${site}.json`;
    const data = read(resolve(contentRoot, relative));
    for (const q of data.questions) {
      fail(!questions.has(q.id), `Duplicate question: ${q.id}`);
      questions.set(q.id, q);
    }
    for (const course of data.catalog.courses) for (const unit of course.units) for (const lesson of unit.lessons) {
      fail(!lessons.has(lesson.id), `Duplicate lesson: ${lesson.id}`);
      lessons.set(lesson.id, { ...lesson, grade: course.grade, course_id: course.id, content_file: relative });
    }
  }
  for (const lesson of lessons.values()) for (const id of [...lesson.questionIds, ...(lesson.challengeId ? [lesson.challengeId] : [])]) {
    fail(questions.has(id), `Missing lesson question: ${id}`);
  }
  return { lessons, questions };
}

export function validateMappings(entries, standards, content) {
  const seen = new Set();
  for (const entry of entries) {
    fail(standards.has(entry.code), `Unknown mapping code: ${entry.code}`);
    fail(!seen.has(entry.code), `Duplicate mapping: ${entry.code}`);
    seen.add(entry.code);
    fail(['unreviewed', 'gap', 'partial', 'covered'].includes(entry.status), `Invalid mapping status: ${entry.code}`);
    fail(Array.isArray(entry.lesson_ids) && Array.isArray(entry.question_ids), `Missing evidence arrays: ${entry.code}`);
    fail(entry.lesson_ids.every(id => content.lessons.has(id)), `Unknown evidence lesson: ${entry.code}`);
    fail(entry.question_ids.every(id => content.questions.has(id)), `Unknown evidence question: ${entry.code}`);
    if (['partial', 'covered'].includes(entry.status)) {
      fail(entry.lesson_ids.length > 0 && entry.question_ids.length > 0, `Missing coverage evidence: ${entry.code}`);
      fail(typeof entry.rationale === 'string' && entry.rationale.trim().length > 0, `Missing coverage rationale: ${entry.code}`);
      fail(typeof entry.reviewed_by === 'string' && entry.reviewed_by.trim().length > 0, `Missing reviewer: ${entry.code}`);
      const linked = new Set(entry.lesson_ids.flatMap(id => {
        const lesson = content.lessons.get(id);
        const skills = new Set(lesson.skillIds);
        return [...lesson.questionIds, ...(lesson.challengeId ? [lesson.challengeId] : []), ...[...content.questions.values()].filter(q => skills.has(q.skillId)).map(q => q.id)];
      }));
      fail(entry.question_ids.every(id => linked.has(id)), `Question not linked to evidence lesson: ${entry.code}`);
      if (standards.get(entry.code).course_id.startsWith('english-')) {
        fail(entry.lesson_ids.every(id => !['E1', 'E2'].includes(content.lessons.get(id).grade)), `E1/E2 English is enrichment, not official grade-band coverage: ${entry.code}`);
      }
    }
    if (entry.status === 'gap') fail(entry.lesson_ids.length === 0 && entry.question_ids.length === 0, `Gap has coverage evidence: ${entry.code}`);
  }
}

export function buildAudit(data, content, entries = []) {
  const standards = validateCurriculum(data);
  validateMappings(entries, standards, content);
  const mappings = new Map(entries.map(entry => [entry.code, entry]));
  const rows = data.achievement_standards.map(standard => ({
    code: standard.code, text: standard.text, grade_band: standard.grade_band,
    course_id: standard.course_id, domain: standard.domain, source: standard.source,
    ...(mappings.get(standard.code) ?? { status: 'unreviewed', lesson_ids: [], question_ids: [], rationale: '', reviewed_by: '' }),
  }));
  const counts = { unreviewed: 0, gap: 0, partial: 0, covered: 0 };
  rows.forEach(row => counts[row.status]++);
  return {
    subject: data.subject, source_sha256: data.source.sha256,
    summary: { source_pages: data.pages.length, standards: rows.length, lessons: content.lessons.size, questions: content.questions.size, ...counts },
    interpretation: 'Unreviewed means no evidence-based mapping has been supplied. It does not mean gap. Covered is a reviewer assertion, not proof of pedagogical completeness.',
    enrichment_lesson_ids: data.subject === 'english' ? [...content.lessons.values()].filter(l => ['E1', 'E2'].includes(l.grade)).map(l => l.id) : [],
    lesson_inventory: [...content.lessons.values()].map(l => ({ id: l.id, title: l.title, grade: l.grade, content_file: l.content_file, skill_ids: l.skillIds, question_ids: l.questionIds, challenge_id: l.challengeId ?? null })),
    standards: rows,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const option = (flag, fallback) => args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
  const contentRoot = resolve(option('--content-root', root));
  const mappingPath = option('--mappings', null);
  const mappings = mappingPath ? read(resolve(mappingPath)) : {};
  const report = { schema_version: '1.0.0', content_revision: option('--content-revision', 'unspecified-working-tree'), curriculum_revision: option('--curriculum-revision', 'unspecified-working-tree'), subjects: [] };
  for (const subject of ['mathematics', 'english']) {
    const data = read(resolve(root, `lib/learn/curriculum/kr/2022/${subject}.json`));
    report.subjects.push(buildAudit(data, readContent(contentRoot, subject), mappings[subject] ?? []));
  }
  const output = option('--output', null);
  if (output) { mkdirSync(dirname(resolve(output)), { recursive: true }); writeFileSync(resolve(output), JSON.stringify(report, null, 2) + '\n'); }
  console.log(JSON.stringify(report.subjects.map(({ subject, summary, enrichment_lesson_ids }) => ({ subject, ...summary, enrichment_lessons: enrichment_lesson_ids.length })), null, 2));
}
