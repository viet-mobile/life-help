import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
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

export function contentSourceFiles(contentRoot, subject) {
  const site = subject === 'mathematics' ? 'math' : 'english';
  const files = ['elementary', 'demo', 'secondary'].map(tier => `lib/learn/content/${tier}/${site}.json`);
  const bank = `lib/learn/content/bank/${site}.json`;
  if (existsSync(resolve(contentRoot, bank))) files.push(bank);
  return files;
}

/** Canonical expansion matches lib/learn/content/bank.ts without importing runtime code into this Node tool. */
export function expandAuditBank(data, skills, contentFile) {
  fail(data.format === 1 && ['math', 'english'].includes(data.site), 'Unsupported bank format/site');
  fail(Array.isArray(data.sets), 'Missing bank sets');
  const questions = new Map(), sets = new Map();
  const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (match, name) => name in vars ? String(vars[name]) : match).replace(/\}\}/g, '} }').replace(/\{\{/g, '{ {');
  for (const set of data.sets) {
    fail(typeof set.id === 'string' && set.id.length > 0 && !sets.has(set.id), `Duplicate/invalid bank set: ${set.id}`);
    fail(skills.has(set.skillId), `Unknown bank skill: ${set.skillId}`);
    fail(Number.isInteger(set.difficulty) && set.difficulty >= 1 && set.difficulty <= 5, `Invalid bank difficulty: ${set.id}`);
    fail(set.tolerance === undefined || typeof set.tolerance === 'number' && Number.isFinite(set.tolerance) && set.tolerance >= 0, `Invalid bank tolerance: ${set.id}`);
    fail(Array.isArray(set.cols) && new Set(set.cols).size === set.cols.length && set.cols.every(c => typeof c === 'string' && c !== 'ans'), `Invalid bank columns: ${set.id}`);
    fail(Array.isArray(set.rows) && set.rows.length > 0, `Empty bank set: ${set.id}`);
    const template = data.templates?.[set.template];
    fail(template && typeof template.prompt === 'string' && typeof template.explanation === 'string' && Array.isArray(template.hints) && template.hints.every(h => typeof h === 'string'), `Missing/invalid bank template: ${set.id}`);
    const ids = [];
    set.rows.forEach((row, index) => {
      fail(Array.isArray(row) && row.length === set.cols.length + 1, `Invalid bank row width: ${set.id}-${index + 1}`);
      const vars = Object.fromEntries(set.cols.map((col, i) => {
        const value = row[i];
        fail(typeof value === 'string' || typeof value === 'number' && Number.isFinite(value), `Invalid bank variable: ${set.id}.${col}`);
        if (typeof value === 'string' && value.startsWith('#')) {
          fail(typeof data.texts?.[value.slice(1)] === 'string', `Unknown bank text: ${value}`);
          return [col, data.texts[value.slice(1)]];
        }
        return [col, value];
      }));
      const answer = row[set.cols.length];
      fail(typeof answer === 'number' && Number.isFinite(answer), `Invalid bank answer: ${set.id}-${index + 1}`);
      vars.ans = answer;
      const id = `${set.id}-${String(index + 1).padStart(3, '0')}`;
      fail(!questions.has(id), `Duplicate bank question: ${id}`);
      ids.push(id);
      questions.set(id, {
        id, site: data.site, skillId: set.skillId, type: 'numeric', difficulty: set.difficulty,
        prompt: fill(template.prompt, vars), answer: { kind: 'numeric', value: answer, ...(set.tolerance ? { tolerance: set.tolerance } : {}) },
        hints: template.hints.map(h => fill(h, vars)), explanation: fill(template.explanation, vars),
        family: set.family, role: 'variant', expectedSeconds: 60, tags: ['bank'], status: 'PUBLISHED',
        bank_source: { content_file: contentFile, set_id: set.id, row_number: index + 1 },
      });
    });
    sets.set(set.id, { ...set, content_file: contentFile, question_ids: ids });
  }
  return { questions, sets };
}

export function readContent(contentRoot, subject) {
  const site = subject === 'mathematics' ? 'math' : 'english';
  const lessons = new Map();
  const questions = new Map();
  const skills = new Set();
  for (const tier of ['elementary', 'demo', 'secondary']) {
    const relative = `lib/learn/content/${tier}/${site}.json`;
    const data = read(resolve(contentRoot, relative));
    for (const skill of data.catalog.skills) skills.add(skill.id);
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
  const canonicalQuestions = questions.size;
  const bankSets = new Map();
  const bankFile = `lib/learn/content/bank/${site}.json`;
  if (existsSync(resolve(contentRoot, bankFile))) {
    const data = read(resolve(contentRoot, bankFile));
    fail(data.site === site, `Wrong bank subject: ${bankFile}`);
    const expanded = expandAuditBank(data, skills, bankFile);
    for (const [id, question] of expanded.questions) {
      fail(!questions.has(id), `Duplicate question: ${id}`);
      questions.set(id, question);
    }
    for (const [id, set] of expanded.sets) bankSets.set(id, set);
  }
  return { lessons, questions, bankSets, canonicalQuestions, source_files: contentSourceFiles(contentRoot, subject) };
}

export function validateMappings(entries, standards, content) {
  const seen = new Set();
  for (const entry of entries) {
    fail(standards.has(entry.code), `Unknown mapping code: ${entry.code}`);
    fail(!seen.has(entry.code), `Duplicate mapping: ${entry.code}`);
    seen.add(entry.code);
    fail(['unreviewed', 'gap', 'partial', 'covered'].includes(entry.status), `Invalid mapping status: ${entry.code}`);
    fail(Array.isArray(entry.lesson_ids) && Array.isArray(entry.question_ids), `Missing evidence arrays: ${entry.code}`);
    fail(new Set(entry.lesson_ids).size === entry.lesson_ids.length && new Set(entry.question_ids).size === entry.question_ids.length, `Duplicate evidence ID: ${entry.code}`);
    fail(entry.lesson_ids.every(id => content.lessons.has(id)), `Unknown evidence lesson: ${entry.code}`);
    fail(entry.question_ids.every(id => content.questions.has(id)), `Unknown evidence question: ${entry.code}`);
    if (['partial', 'covered'].includes(entry.status)) {
      fail(entry.question_ids.every(id => content.questions.get(id).status === 'PUBLISHED'), `Unpublished evidence question: ${entry.code}`);
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

/** Validate references and provenance; never promote reviewed status based on a candidate label. */
export function validateBankEvidence(document, standards, content, mappings = []) {
  fail(document.bank?.sets === content.bankSets?.size && document.bank?.questions === content.questions.size - content.canonicalQuestions, 'Stale bank evidence inventory');
  fail(Array.isArray(document.standards), 'Missing bank evidence standards');
  const reviewed = new Map(mappings.map(e => [e.code, e]));
  const seen = new Set(), effects = { none: 0, strengthens: 0, could_upgrade: 0 }, candidates = [];
  for (const entry of document.standards) {
    fail(standards.has(entry.code) && !seen.has(entry.code), `Unknown/duplicate bank evidence code: ${entry.code}`);
    seen.add(entry.code);
    fail(Object.hasOwn(effects, entry.effect), `Invalid bank evidence effect: ${entry.code}`);
    fail(['unreviewed','gap','partial','covered'].includes(entry.status), `Invalid bank evidence status: ${entry.code}`);
    if (reviewed.has(entry.code)) fail(reviewed.get(entry.code).status === entry.status, `Stale bank evidence status: ${entry.code}`);
    fail(Array.isArray(entry.bank_sets) && Array.isArray(entry.sample_question_ids), `Missing bank evidence IDs: ${entry.code}`);
    fail(new Set(entry.bank_sets).size === entry.bank_sets.length && new Set(entry.sample_question_ids).size === entry.sample_question_ids.length, `Duplicate bank evidence IDs: ${entry.code}`);
    fail(typeof entry.rationale === 'string' && entry.rationale.trim().length > 0, `Missing bank evidence rationale: ${entry.code}`);
    fail(entry.bank_sets.every(id => content.bankSets.has(id)), `Unknown bank evidence set: ${entry.code}`);
    for (const id of entry.sample_question_ids) {
      const question = content.questions.get(id);
      fail(question?.status === 'PUBLISHED' && entry.bank_sets.includes(question.bank_source?.set_id), `Invalid bank sample or set membership: ${entry.code}: ${id}`);
    }
    fail(entry.effect === 'none' ? entry.bank_sets.length === 0 && entry.sample_question_ids.length === 0 : entry.bank_sets.length > 0 && entry.sample_question_ids.length > 0, `Missing/unexpected bank evidence: ${entry.code}`);
    effects[entry.effect]++;
    if (entry.effect === 'could_upgrade') {
      const bankSkills = new Set(entry.bank_sets.map(id => content.bankSets.get(id).skillId));
      const lessonIds = [...content.lessons.values()].filter(lesson => lesson.skillIds.some(id => bankSkills.has(id))).map(lesson => lesson.id);
      candidates.push({ code: entry.code, current_status: entry.status, bank_sets: entry.bank_sets, lesson_ids: lessonIds, question_ids: entry.sample_question_ids, rationale: entry.rationale, status_changed: false });
    }
  }
  fail(seen.size === standards.size, 'Missing bank evidence standard');
  return { effects, candidates, interpretation: 'Valid references do not prove educational coverage. Candidate statuses are not applied automatically.' };
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
    summary: { source_pages: data.pages.length, standards: rows.length, lessons: content.lessons.size, questions: content.questions.size, canonical_questions: content.canonicalQuestions ?? content.questions.size, bank_questions: content.questions.size - (content.canonicalQuestions ?? content.questions.size), bank_sets: content.bankSets?.size ?? 0, ...counts },
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
  const bankEvidencePath = option('--bank-evidence', null);
  if (bankEvidencePath) {
    const data = read(resolve(root, 'lib/learn/curriculum/kr/2022/mathematics.json'));
    report.bank_evidence = validateBankEvidence(read(resolve(bankEvidencePath)), validateCurriculum(data), readContent(contentRoot, 'mathematics'), mappings.mathematics ?? []);
  }
  const output = option('--output', null);
  if (output) { mkdirSync(dirname(resolve(output)), { recursive: true }); writeFileSync(resolve(output), JSON.stringify(report, null, 2) + '\n'); }
  if (report.bank_evidence) console.log(JSON.stringify({bank_evidence: report.bank_evidence.effects}, null, 2));
  console.log(JSON.stringify(report.subjects.map(({ subject, summary, enrichment_lesson_ids }) => ({ subject, ...summary, enrichment_lessons: enrichment_lesson_ids.length })), null, 2));
}
