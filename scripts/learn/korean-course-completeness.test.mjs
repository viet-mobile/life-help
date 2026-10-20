import test from 'node:test';
import assert from 'node:assert/strict';
import { completeKoreanPresentation } from './korean-course-completeness.mjs';

const bundle={catalog:{skills:[{id:'s',title:'Read Hangul'}],courses:[{id:'c',title:'Course',world:{name:'Garden',tagline:'Read words'},units:[{id:'u',title:'Letters',lessons:[{id:'l',title:'Vowels',concept:'Read each sound.',example:'아 · 어'}]}]}]}};
const questions=new Map([['q',{id:'q',prompt:'Choose what you hear.',hints:['Listen again.'],explanation:'아 is a.',options:[{id:'a',text:'아'},{id:'b',text:'어'}]}]]);
const overlay={skills:{s:'Garsai'},courses:{c:{title:'Kursas',world:{name:'Sodas',tagline:'Skaitykite'}}},units:{u:'Raidės'},lessons:{l:{title:'Balsiai',concept:'Perskaitykite.',example:'아 · 어'}},questions:{q:{prompt:'Pasirinkite.',hints:['Paklausykite.'],explanation:'아 = a',options:{a:'아',b:'어'}}}};
function missing(ov){return completeKoreanPresentation([bundle],questions).filter(([section,id,field])=>{let value=ov[section]?.[id];for(const key of field?field.split('.'):[])value=value?.[key];return typeof value!=='string'||!value.trim();});}
test('explicit Korean learning targets are accepted without translating their spelling',()=>{assert.deepEqual(missing(overlay),[]);});
test('a missing course explanation is rejected instead of using the English presentation',()=>{const partial=structuredClone(overlay);delete partial.lessons.l.concept;assert.deepEqual(missing(partial),[['lessons','l','concept']]);});
test('empty hints and missing meaning/target options cannot count as complete',()=>{const partial=structuredClone(overlay);partial.questions.q.hints[0]=' ';delete partial.questions.q.options.b;assert.deepEqual(missing(partial),[['questions','q','hints.0'],['questions','q','options.b']]);});
