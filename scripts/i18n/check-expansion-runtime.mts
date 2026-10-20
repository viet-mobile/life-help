import fs from 'node:fs';
import { localize } from '../../lib/think/localize';
import type { ThinkTask } from '../../lib/think/types';
import { localizeEnglishBankQuestion } from '../../lib/learn/content/english-bank';
import type { Question } from '../../lib/learn/types';
import policy from '../../lib/i18n/contentReleasePolicy.json';

const taskFiles = ['math','english','korean'].map(s=>({key:`pilot-${s}`,file:`lib/think/data/${s}.json`}));
for(const file of fs.readdirSync('lib/think/data/extra').filter(f=>f.endsWith('.json')).sort()) taskFiles.push({key:file.slice(0,-5),file:`lib/think/data/extra/${file}`});
const sources = taskFiles.map(item=>({...item,tasks:JSON.parse(fs.readFileSync(item.file,'utf8')) as ThinkTask[]}));
const bank = JSON.parse(fs.readFileSync('lib/learn/content/bank/english-draft.json','utf8')).questions as Question[];
let failed = false;
for(const locale of policy.fullyLocalizedBeforeRelease){
 let thinkingTotal=0,thinkingComplete=0;
 for(const source of sources){
  const path=`lib/think/i18n/${locale}/${source.key}.json`;
  const overlay=fs.existsSync(path)?JSON.parse(fs.readFileSync(path,'utf8')):{};
  for(const task of source.tasks){thinkingTotal++;thinkingComplete+=Number(localize(task,locale,overlay).translated);}
 }
 const path=`scripts/learn/english-bank/kit/${locale}.json`;
 const kit=fs.existsSync(path)?JSON.parse(fs.readFileSync(path,'utf8')):{texts:{}};
 const englishComplete=bank.reduce((n,q)=>n+Number(Boolean(localizeEnglishBankQuestion(q,{templates:{},texts:kit.texts??{}},locale))),0);
 const complete=thinkingComplete===thinkingTotal&&englishComplete===bank.length;
 failed ||= !complete;
 console.log(`${locale}: thinking ${thinkingComplete}/${thinkingTotal}; English bank ${englishComplete}/${bank.length}; ${complete?'PASS':'INCOMPLETE'}`);
}
if(failed) console.error('Expanded-language release requires complete general and thinking translations. English fallback is prohibited. General course/math/Korean-bank completeness is additionally enforced by build-content-assets.mjs.');
process.exitCode=failed?1:0;
