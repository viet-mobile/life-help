// Translation authoring inputs, never public assets. Existing task IDs/answers remain unchanged.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { flatten, flattenLearnerExtras, needsTranslation } from '../../lib/think/flat';
import { labels } from '../../components/think/labels';
import { HUB, ELECTIVE_NAMES } from '../../components/think/hubLabels';
import { FLOW } from '../../components/think/flowLabels';
import type { ThinkTask } from '../../lib/think/types';
const out = process.argv[2];if(!out)throw Error('Pass private authoring output directory');fs.mkdirSync(out,{recursive:true});
const hash=(s:string)=>crypto.createHash('sha256').update(s).digest('hex');
const files=['math','english','korean'].map(x=>({key:'pilot-'+x,file:'lib/think/data/'+x+'.json'}));
for(const f of fs.readdirSync('lib/think/data/extra').filter(f=>f.endsWith('.json')).sort())files.push({key:f.slice(0,-5),file:'lib/think/data/extra/'+f});
const seen=new Set<string>();const counts:Record<string,{tasks:number,sourcePositions:number,sourceCharacters:number}>={};const inventory=[];
for(const {key,file} of files){
 const tasks=JSON.parse(fs.readFileSync(file,'utf8')) as ThinkTask[];const rows=[];
 for(const task of tasks){if(seen.has(task.id))throw Error('Duplicate source task '+task.id);seen.add(task.id);const flat={...flatten(task),...flattenLearnerExtras(task)};const group=counts[task.subject]??={tasks:0,sourcePositions:0,sourceCharacters:0};group.tasks++;
  for(const [field,source] of Object.entries(flat)){if(!source.trim())continue;const required=needsTranslation(task.subject,source);rows.push({id:task.id,path:field,source,sourceHash:hash(source),role:required?'LOCALIZE_WITH_CONTEXT':'PROTECTED_TARGET_OR_SYMBOL_REVIEW',contextFile:file,authoringContext:(task as ThinkTask & {authoringContext?:unknown}).authoringContext??null});if(required){group.sourcePositions++;group.sourceCharacters+=source.length;}}
 }
 const text=JSON.stringify({purpose:'AUTHORING_INPUT_NOT_TRANSLATION',key,contextFile:file,rows},null,2)+'\n';fs.writeFileSync(path.join(out,key+'.json'),text);inventory.push({key,sha256:hash(text),tasks:tasks.length,positions:rows.length});
}
const chrome={player:labels('en'),hub:HUB.en,flow:{...FLOW.en,title:FLOW.en.title(Number.NaN).replace('NaN','{n}')},electives:Object.fromEntries(Object.entries(ELECTIVE_NAMES).map(([k,v])=>[k,v.en]))};
fs.writeFileSync(path.join(out,'thinking-ui-source.json'),JSON.stringify(chrome,null,2)+'\n');
fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify({format:1,locales:['pcm','tl','ro','fi','cs','hu','af'],scope:'ALL_THINKING_TASKS','englishFallbackAllowed':false,counts,files:inventory,policy:'Target English/Korean remains unchanged; role flags are candidates requiring contextual review. Never infer entity gender from names. Authoring inputs include internal context and must not be copied to public assets.'},null,2)+'\n');
console.log(JSON.stringify({taskCount:seen.size,files:files.length,counts},null,2));
