# Canonical learning i18n (source for the 38-locale expansion)

* Source of truth: `lib/learn/i18n/en.ts` (English) with `ko.ts` (Korean). `vi.ts` is the reviewed Vietnamese. Keys are identical in the three files (compiler + `tests/learn/i18n-canonical.test.ts`).
* Placeholders: `{name}` style only (`{n}`, `{total}`, `{title}`, `{name}`, `{level}`, `{xp}`, `{source}`). Copy them byte-identical; never translate, reorder syntax or split them; no ICU plural/select (rephrase around the number).
* Plain text only: no markup, no line breaks, no `$` (the renderer reads `$...$` as math). Brand names (MATH.LIFE.HELP, ENGLISH.LIFE.HELP), `XP` and emoji stay.
* `locale.*` values are native-script language names and are not translated. English-learning target sentences are content, not UI, and are never translated.
* Groups: brand/site, nav, landing, onboarding, grade, goal, avatar, diagnostic, dashboard, learn, lesson, result, quest, profile, level, mastery, achievements, auth, admin, common, plus the v3 foundation vocabulary (`keyboard.*`, `study.*`, `proficiency.*`, `plan.*`, `cert.*`, `scholarship.*`). The foundation groups are LABELS only: they promise no feature.
* Wording to avoid in any language: "unhackable", "guaranteed", "official CEFR certification", anything that implies money or a prize is certain. Certificates are "cryptographically signed achievement credentials"; verification is "publicly verifiable / tamper-evident".
* RTL locales: ar, arz, fa, he. `en` is the canonical source and not yet a selectable learner locale (`LOCALES` in `index.ts` lists what ships).
