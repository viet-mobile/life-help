import { describe, expect, it } from 'vitest';
import { gradeLabel } from '@/lib/think/grades';
import { fieldInfo, MATH_AREAS, LANG_FIELDS } from '@/lib/think/areas';
import { levelName, KOREAN_FIRST_TEXT } from '@/lib/think/korean-levels';
import { BOSS_TEXT } from '@/lib/think/bosses';
import { labels } from '@/components/think/labels';
import { HUB, ELECTIVE_NAMES } from '@/components/think/hubLabels';
import { FLOW } from '@/components/think/flowLabels';
import { EXPANDED_THINK_LANGS, thinkLangFor, TASK_LANGS } from '@/lib/think/lang';
describe('new-language thinking interface',()=>{
 it('keeps all seven UI locales rather than resolving them to English',()=>{
  expect(TASK_LANGS).toHaveLength(53);
  expect(TASK_LANGS).not.toContain('sg');
  for(const locale of EXPANDED_THINK_LANGS){
   expect(thinkLangFor(locale,'math')).toBe(locale);
   expect(gradeLabel('E1',locale)).not.toContain('undefined');
   expect(gradeLabel('M3',locale)).toContain('3');
   for(const area of MATH_AREAS) expect(fieldInfo('math',area,locale).full).toBeTruthy();
   for(const field of LANG_FIELDS) expect(fieldInfo('english',field,locale).full).toBeTruthy();
   for(let n=1;n<=6;n++) expect(levelName(n,locale)).toContain(String(n));
   expect(KOREAN_FIRST_TEXT[locale].toggle('TEST')).toContain('TEST');
   expect(BOSS_TEXT[locale].locked(2,8)).not.toMatch(/\{\w+\}|undefined/);
   expect(BOSS_TEXT[locale].title('TEST')).toContain('TEST');
   const l=labels(locale);
   expect(Object.keys(l).sort()).toEqual(Object.keys(labels('en')).sort());
   expect(l.uncertainty).toBeTruthy();
   expect(l.surfaceNote).toBeTruthy();
   expect(l.nextTask).toBeTruthy();
   expect(HUB[locale].notTranslated).toBeTruthy();
   expect(FLOW[locale].title(10)).toContain('10');
   expect(FLOW[locale].title(10)).not.toContain('{n}');
   for(const course of Object.values(ELECTIVE_NAMES)) expect(course[locale]).toBeTruthy();
  }
 });
});
