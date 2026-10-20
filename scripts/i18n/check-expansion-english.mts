// Bundle with esbuild for Node, then run from the repository root with an output report path.
// Uses the actual localization boundary. A partial kit never counts as a completed language.
import fs from 'node:fs';
import { localizeEnglishBankQuestion } from '../../lib/learn/content/english-bank';
import type { Question } from '../../lib/learn/types';
import policy from '../../lib/i18n/contentReleasePolicy.json';

const output = process.argv[2];
if (!output) throw new Error('Pass a coverage report destination');
const source = JSON.parse(fs.readFileSync('lib/learn/content/bank/english-draft.json','utf8')).questions as Question[];
const locales: Record<string,unknown> = {};
let pass = true;
for (const locale of policy.fullyLocalizedBeforeRelease) {
 const file = `scripts/learn/english-bank/kit/${locale}.json`;
 const exists = fs.existsSync(file);
 const kit = exists ? JSON.parse(fs.readFileSync(file,'utf8')) : {texts:{}};
 const missing: {id:string;reason:string}[] = [];
 let available = 0;
 for (const question of source) {
  const trace: {reason?:string} = {};
  const result = localizeEnglishBankQuestion(question,{templates:{},texts:kit.texts??{}},locale,trace);
  if (result) available++;
  else missing.push({id:question.id,reason:trace.reason??'unavailable'});
 }
 const complete = exists && missing.length === 0;
 pass &&= complete;
 locales[locale] = {kitExists:exists,sourceQuestions:source.length,localizableQuestions:available,missingCount:missing.length,complete,missing};
}
fs.writeFileSync(output,JSON.stringify({coveragePass:pass,scope:'ALL_ENGLISH_BANK_SOURCE_IDS',meaningReview:'NOT_ESTABLISHED_BY_THIS_CHECK',locales},null,2)+'\n');
console.log(JSON.stringify({coveragePass:pass,locales:Object.fromEntries(Object.entries(locales).map(([locale,value])=>{const {missing,...summary}=value as {missing:unknown[]};return [locale,summary];}))},null,2));
process.exitCode = pass ? 0 : 1;
