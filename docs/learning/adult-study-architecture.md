# Adult language study: product architecture (core types in `lib/learn/products/**`)

## Two families, three independent axes
| | SCHOOL | ADULT_LANGUAGE |
|---|---|---|
| hosts | `math.life.help`, `english.life.help` | `study.<slug>.life.help` |
| what is learned | `schoolSubject` (math / english) | `targetLanguage` (from the host) |
| learner level | `studentGrade` E1..H3 (bank ladder 1..10 from E3) | proficiency L1..L10 per dimension (reading, listening, speaking, writing, vocabulary, grammar, practicalInformation) |
| UI language | `uiLocale` (independent) | `uiLocale` (independent) |

`english.life.help` (school English, grade based) and `study.english.life.help` (target language English, any UI locale) never share routing, grades or progress: `schoolContext` / `adultContext` refuse the other family.

## Hosts
production `study.<slug>.life.help`; staging `study-<slug>-staging.life.help` (one label); local `study.<slug>.localhost`. The slug must exist in the registry (no wildcard, no default language).
Legacy (exact host, permanent redirect): study.korean.viet.mobile -> study.korean.life.help; study.english.viet.mobile -> study.english.life.help; study.japanese.viet.mobile -> study.japanese.life.help; zhong.wen.viet.mobile -> study.chinese.life.help; bahasa.indonesia.viet.mobile -> study.indonesian.life.help; hoc.tieng.viet.mobile -> study.vietnamese.life.help. Redirect only; legacy code is not copied.

**Infrastructure risk (before any production DNS step):** `study.<slug>.life.help` has TWO labels before `life.help`. A `*.life.help` wildcard certificate does NOT cover it (a wildcard matches one label). Production needs per-host certificates (Cloudflare Advanced Certificate Manager / custom hostnames) and explicit Worker routes. Staging deliberately uses one label so the existing wildcard works. No DNS or route is changed by this work.

## Registry
`lib/learn/products/registry.ts` holds the schema, validation (derived host, unique id / slug / legacy host, exact legacy hosts, content kinds, LIVE needs a UI locale) and lookup, but no language list. The 38-language data is generated from `locales` in `messages/index.ts` by the bulk track (`registry.generated.ts`), then passed to `createTargetRegistry` at integration. Fields: id, slug, nativeName, englishName, host, writingSystem, rtl, status, legacyHosts, availableContent, availableUiLocales.

## Proficiency
Internal L1..L10, no school grade for adults. Overall = rounded mean of the dimension levels (a weak dimension stays visible). External frameworks (CEFR, ACTFL, TOPIK, JLPT, HSK) are optional metadata with `official: false` (type-level); text is always "approximately ... an estimate, not an official ... result".

## Shared adult-study engine (design, not yet built)
One engine, one content model per target: lesson = ordered tasks of `ContentKind`; tasks carry a reasoning profile and ladder level exactly like the school bank; progress per (account, targetLanguageId, dimension); entitlement checks are server side (see `docs/learning/trust-architecture.md`). The six legacy sites are audited (framework, content model, auth, progress storage, locale architecture, reusable components, duplication) before any content is imported; inventories are mechanical counts (bulk track), the decisions are core.
