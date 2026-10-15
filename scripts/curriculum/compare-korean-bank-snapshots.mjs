// Node 24+: node --experimental-strip-types scripts/curriculum/compare-korean-bank-snapshots.mjs <legacy-commit>
// Read-only comparison. Exact equality does not establish semantic novelty or teaching quality.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { expandKoreanBank } from '../../lib/learn/content/korean-bank.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ref = process.argv[2];
if (!ref || ref.startsWith('-')) throw new Error('Supply the legacy bank commit');
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 }).toString();
const revision = git('rev-parse', '--verify', `${ref}^{commit}`).trim();
const bankPath = 'lib/learn/content/bank/korean.json';
const legacyBytes = git('show', `${revision}:${bankPath}`);
const legacy = JSON.parse(legacyBytes);
if (legacy.site !== 'korean' || !Array.isArray(legacy.questions)) throw new Error('Legacy source must be a discrete Korean question bank');
const currentBytes = fs.readFileSync(path.join(root, bankPath), 'utf8');
const current = JSON.parse(currentBytes);
if (current.format !== 2 || current.site !== 'korean') throw new Error('Current source must be a format-2 Korean bank');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const enKit = { ...read('lib/learn/content/bank/korean-kit.en.json'), texts: {} };
const koKit = read('content/learn-overlays/ko/korean.json').bank;
const norm = s => String(s ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
const answer = q => q.answer.kind === 'choice'
  ? norm(q.options?.find(o => o.id === q.answer.id)?.text ?? q.answer.id)
  : q.answer.kind === 'order'
    ? q.answer.ids.map(id => norm(q.options?.find(o => o.id === id)?.text ?? id))
    : q.answer.value;
const key = q => JSON.stringify([q.type, norm(q.prompt), norm(q.target?.text ?? q.audioText), answer(q), (q.options ?? []).map(o => norm(o.text)).sort()]);
const old = new Set(legacy.questions.map(key));
const comparisons = Object.fromEntries(Object.entries({ en: enKit, ko: koKit }).map(([locale, kit]) => {
  const questions = expandKoreanBank(current, kit, null);
  const keys = new Set(questions.map(key));
  return [locale, { ids: questions.length, unique: keys.size, exact_overlap_with_legacy: [...old].filter(k => keys.has(k)).length }];
}));
const items = Object.values(current.skills).flatMap(skill => skill.items);
const targets = new Set(items.map(item => norm(item.ko)));
const oldKoreanAnswers = new Set(legacy.questions.map(answer).filter(s => typeof s === 'string' && /[가-힣]/.test(s)));
console.log(JSON.stringify({
  current_revision: git('rev-parse', 'HEAD').trim(), legacy_revision: revision,
  bank_sha256: createHash('sha256').update(currentBytes).digest('hex'),
  legacy_sha256: createHash('sha256').update(legacyBytes).digest('hex'),
  comparison: 'type + normalized prompt + target/audio + answer content + sorted options; ignores skill IDs and option order',
  legacy: { ids: legacy.questions.length, unique: old.size }, current: comparisons,
  learning_items: items.filter(item => item.c !== 'syl').length,
  syllable_items: items.filter(item => item.c === 'syl').length,
  shared_korean_answer_strings: [...oldKoreanAnswers].filter(s => targets.has(s)).length,
  interpretation: 'Different wording, presentation languages and distractors conceal semantic overlap. Exact non-overlap is not evidence of useful new items. Do not add legacy counts to the approved bank without independent semantic review.',
}, null, 2));
