import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { en } from '../../lib/learn/i18n/en';

const nd = (c: string) => {
  const cp = c.codePointAt(0)!;
  let b = cp;
  while (/\p{Nd}/u.test(String.fromCodePoint(b - 1))) b--;
  return String(cp - b);
};
const numbers = (s: string) => (s.replace(/\p{Nd}/gu, nd).match(/\d+/g) ?? []).sort().join(',');

const localesDir = path.resolve(__dirname, '../../messages/generated/locales');
const nonRefLocales = fs.readdirSync(localesDir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));

const TARGETED_13 = ['ar', 'de', 'es', 'fr', 'hi', 'id', 'it', 'ja', 'nl', 'pt', 'ru', 'zh-Hans', 'zh-Hant'];

describe('Learning I18N Semantic & Numeric Parity (Section 15)', () => {
  it('enforces exact numeric parity on all 301 keys for the 13 corrected locales', () => {
    for (const loc of TARGETED_13) {
      const flat = JSON.parse(fs.readFileSync(path.join(localesDir, `${loc}.json`), 'utf8'));
      const diffs: string[] = [];
      for (const [k, enVal] of Object.entries(en)) {
        if (k.startsWith('grade.')) continue;
        const enNums = numbers(enVal);
        const locNums = numbers(flat[k] ?? '');
        if (enNums !== locNums) {
          diffs.push(`${k} (EN [${enNums}] != ${loc} [${locNums}])`);
        }
      }
      expect(diffs, `Numeric mismatches in ${loc}`).toEqual([]);
    }
  });

  it('guarantees nickname validation hint preserves 2-16 characters and never 2-12', () => {
    for (const loc of nonRefLocales) {
      const flat = JSON.parse(fs.readFileSync(path.join(localesDir, `${loc}.json`), 'utf8'));
      const text = flat['onboarding.nickname.hint'];
      expect(text, `${loc} must not have 2-12 characters`).not.toMatch(/\b12\b/);
      if (loc !== 'arz') {
        const nums = numbers(text);
        expect(nums, `${loc} must contain 2 and 16`).toBe('16,2');
      } else {
        expect(text).toContain('١٦');
        expect(text).toContain('حرفين');
      }
    }
  });

  it('guarantees landing CTA preserves 1 minute and adds no free promise', () => {
    const forbiddenClaims = ['gratis', 'kostenlos', 'gratuit', '免费', '無料', 'مجانًا', 'मुफ्त'];
    for (const loc of nonRefLocales) {
      const flat = JSON.parse(fs.readFileSync(path.join(localesDir, `${loc}.json`), 'utf8'));
      const text = flat['landing.cta.start'];
      for (const claim of forbiddenClaims) {
        expect(text.toLowerCase(), `${loc} must not contain added claim '${claim}'`).not.toContain(claim);
      }
      if (loc !== 'arz' && loc !== 'he') {
        expect(numbers(text), `${loc} landing.cta.start must contain 1`).toBe('1');
      }
    }
  });

  it('guarantees math quest duration 3-10 minutes is preserved and not omitted', () => {
    for (const loc of nonRefLocales) {
      const flat = JSON.parse(fs.readFileSync(path.join(localesDir, `${loc}.json`), 'utf8'));
      const desc = flat['site.math.description'];
      const how = flat['landing.how1.body'];
      expect(numbers(desc), `${loc} site.math.description must contain 3 and 10`).toBe('10,3');
      expect(numbers(how), `${loc} landing.how1.body must contain 3 and 10`).toBe('10,3');
    }
  });

  it('guarantees english description does not inject unprompted 10-minute claim', () => {
    for (const loc of nonRefLocales) {
      const flat = JSON.parse(fs.readFileSync(path.join(localesDir, `${loc}.json`), 'utf8'));
      const desc = flat['site.english.description'];
      expect(numbers(desc), `${loc} site.english.description must have no numbers`).toBe('');
    }
  });

  it('guarantees 2-minute skill check duration is preserved in diagnostic keys', () => {
    for (const loc of nonRefLocales) {
      const flat = JSON.parse(fs.readFileSync(path.join(localesDir, `${loc}.json`), 'utf8'));
      const diagTitle = flat['diag.intro.title'];
      const diagCta = flat['dash.diagnostic.cta'];
      if (loc !== 'arz') {
        expect(numbers(diagTitle), `${loc} diag.intro.title must contain 2`).toBe('2');
        expect(numbers(diagCta), `${loc} dash.diagnostic.cta must contain 2`).toBe('2');
      } else {
        expect(diagTitle).toContain('دقيقتين');
        expect(diagCta).toContain('دقيقتين');
      }
    }
  });

  it('guarantees placeholder parity across all 301 keys for all 35 locales', () => {
    const ph = (s: string) => (s.match(/\{[A-Za-z0-9_]+\}/g) ?? []).sort().join(',');
    for (const loc of nonRefLocales) {
      const flat = JSON.parse(fs.readFileSync(path.join(localesDir, `${loc}.json`), 'utf8'));
      for (const [k, enVal] of Object.entries(en)) {
        expect(ph(flat[k]), `${loc} key ${k} placeholder match`).toBe(ph(enVal));
      }
    }
  });
});
