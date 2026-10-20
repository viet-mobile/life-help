import { describe, expect, it } from 'vitest';
import { flatten } from '@/lib/think/flat';
import { localizeFor, checksOffFor } from '@/lib/think/localize';
import originals from '@/lib/think/data/math.json';
import type { ThinkTask } from '@/lib/think/types';
import policy from '@/lib/i18n/contentReleasePolicy.json';
const task = {id:'policy-fixture',subject:'math',title:'모양 비교',goal:'다른 모양을 비교하세요.',material:'크기를 비교하세요.',thinking:[],prerequisites:[],steps:[]} as unknown as ThinkTask;
const flat = flatten(task);
const translated = Object.fromEntries(Object.keys(flat).map(k=>[k,'Localized fixture text']));
describe('user-selected complete translation before expansion release',()=>{
 it('localizes every learner field of the reviewed first task without altering grading rules',async()=>{
  const original=originals.find(t=>t.id==='m-01') as unknown as ThinkTask;
  for(const locale of policy.fullyLocalizedBeforeRelease){
   const overlay=(await import(`../../lib/think/i18n/${locale}/pilot-math.json`)).default;
   const result=localizeFor(original,locale,{primary:overlay,fallback:{}});
   expect(result.translated,locale).toBe(true);
   expect(result.task.id).toBe(original.id);
   expect(result.task.levelLabel).not.toBe(original.levelLabel);
   expect(checksOffFor(result.task,locale)).toBe(true);
   for(let i=0;i<original.steps.length;i++){
    const before=original.steps[i],after=result.task.steps[i];
    expect(after.kind).toBe(before.kind);
    if(before.kind==='build'&&after.kind==='build'){
     expect(after.vars.map(v=>v.name)).toEqual(before.vars.map(v=>v.name));
     expect(after.constraints.map(c=>c.expr)).toEqual(before.constraints.map(c=>c.expr));
    }
    if(before.kind==='write'&&after.kind==='write'){
     expect(after.checks.map(c=>c.patterns)).toEqual(before.checks.map(c=>c.patterns));
    }
   }
  }
 });
 it('requires all seven locales, general questions and thinking tasks',()=>{
  expect([...policy.fullyLocalizedBeforeRelease].sort()).toEqual(['pcm','tl','ro','fi','cs','hu','af'].sort());
  expect(policy.allowEnglishContentFallback).toBe(false);
  expect(policy.scope).toContain('general-bank');
  expect(policy.scope).toContain('thinking-tasks');
 });
 it('does not call a complete English fallback a new-language translation',()=>{
  for(const locale of policy.fullyLocalizedBeforeRelease){
   const result=localizeFor(task,locale,{primary:{},fallback:{[task.id]:translated}});
   expect(result.translated,locale).toBe(false);
   expect(result.lang,locale).toBe(locale);
  }
 });
 it('does not skip a one-word instruction in new Korean-subject translations',()=>{
  const korean={...task,subject:'korean',title:'Why?'} as ThinkTask;
  const partial={...translated};delete partial.title;
  expect(localizeFor(korean,'fi',{primary:{[task.id]:partial},fallback:{}}).translated).toBe(false);
 });
 it('requires learner-visible metadata and leaves existing check patterns untouched',()=>{
  const withLevel={...task,levelLabel:'Beginner'} as ThinkTask;
  const missing=localizeFor(withLevel,'ro',{primary:{[task.id]:translated},fallback:{}});
  expect(missing.translated).toBe(false);
  const complete=localizeFor(withLevel,'ro',{primary:{[task.id]:{...translated,'meta.levelLabel':'Începător'}},fallback:{}});
  expect(complete.translated).toBe(true);
  expect(complete.task.levelLabel).toBe('Începător');
 });
 it('accepts a complete primary overlay without changing task identity',()=>{
  for(const locale of policy.fullyLocalizedBeforeRelease){
   const result=localizeFor(task,locale,{primary:{[task.id]:translated},fallback:{}});
   expect(result.translated,locale).toBe(true);
   expect(result.lang,locale).toBe(locale);
   expect(result.task.id).toBe(task.id);
  }
 });
});
