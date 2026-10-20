import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { locales } from '@/messages/registry';
import { detectDeviceLocale } from '@/messages';
import { parseLocale } from '@/lib/learn/i18n';
import { localeFromSegment, splitLocalePrefix } from '@/lib/learn/i18n/path';
import { COUNTRIES, getCountryInfo } from '@/lib/region/countries';
import { COUNTRY_SLUG_TO_CODE, getCountryRegions, DEFAULT_COUNTRY_REGIONS } from '@/lib/region/regions';
import { loadMessages } from '@/lib/learn/i18n/catalog';

describe('active language expansion and retired Sango migration', () => {
 it('has 53 active languages and preserves French migration and Tagalog aliases', () => {
  expect(locales).toHaveLength(53);
  expect(readdirSync('messages').filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5)).sort()).toEqual([...locales].sort());
  expect(locales).not.toContain('sg');
  for (const l of ['pcm','tl','ro','fi','cs','hu','af']) expect(locales).toContain(l);
  expect(parseLocale('sg')).toBe('fr');
  expect(detectDeviceLocale(['sg-CF'])).toBe('fr');
  expect(detectDeviceLocale(['fil-PH'])).toBe('tl');
  expect(localeFromSegment('sg')).toBe('fr');
  expect(splitLocalePrefix('/sg/lesson/example')).toEqual({locale:'fr',rest:'/lesson/example'});
  expect(localeFromSegment('fil')).toBe('tl');
 });
 it('keeps Congo unambiguously CG, Singapore SG, and new regions free of fabricated addresses', () => {
  expect(COUNTRY_SLUG_TO_CODE.congo).toBe('CG');
  expect(getCountryInfo('CG').nameEn).toBe('Republic of the Congo');
  expect(getCountryInfo('SG').slug).toBe('singapore');
  expect(COUNTRIES).toHaveLength(65);
  for(const code of ['RO','FI','CZ','HU','ZM','UG','CG'] as const) {
   expect(getCountryRegions(code)).toEqual([]);
   expect(DEFAULT_COUNTRY_REGIONS[code]).toEqual({country:code,sido:'',gungu:'',dong:''});
  }
 });
 it('loads actual complete learning UI dictionaries for all seven new languages', async () => {
  const source = await loadMessages('en');
  for (const l of ['pcm','tl','ro','fi','cs','hu','af'] as const) {
   const dict = await loadMessages(l);
   expect(Object.keys(dict).sort(),l).toEqual(Object.keys(source).sort());
   expect(dict['lesson.next'],l).toBeTruthy();
   expect(dict['profile.privacy'],l).not.toBe(source['profile.privacy']);
  }
 });
});
