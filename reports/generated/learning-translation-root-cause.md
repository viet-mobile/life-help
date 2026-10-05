# Learning Translations Root Cause Analysis & Preventive Engineering Audit

**Incident Date:** 2026-10-05
**Baseline Evaluated:** Commit `6ecb0de` (Phase 2A Learning Translations)
**Authoritative Core Baseline:** `e621a12` / `f707310`
**Status:** DEFECT IDENTIFIED & RESOLUTION SPECIFIED

---

## 1. Executive Summary

During Phase 2A, the bulk generation pipeline delivered 35 localized JSON translation catalogs for the 301-key learning interface. An independent audit by Claude core engineering revealed a critical linguistic defect: **27 of the 35 delivered locales were largely written in the wrong language**.

Prominent defect examples included:
- **Hebrew (`he.json`)**: Contained Arabic text (`المفاهيم الأساسية، وشروح الأمثلة...`) for 260+ keys, with only ~35 keys translated into Hebrew.
- **Thai (`th.json`)**: Contained Indonesian text (`Konsep inti, pembahasan contoh soal...`) for 260+ keys, with only ~35 keys translated into Thai.
- **Greek (`el.json`)**: Contained German text for ~295 keys, with only ~6 keys translated into Greek.
- **Amharic (`am.json`)**: Cloned from Arabic with minimal Amharic overrides.
- **Burmese (`my.json`)**, **Khmer (`km.json`)**, **Tetum (`tet.json`)**: Cloned from Indonesian with only partial overrides.
- **Bengali (`bn.json`)**, **Tamil (`ta.json`)**, **Nepali (`ne.json`)**, **Sinhala (`si.json`)**: Cloned from Hindi with only partial overrides.
- **Ukrainian (`uk.json`)**, **Kazakh (`kk.json`)**, **Uzbek (`uz.json`)**, **Mongolian (`mn.json`)**: Cloned from Russian with only partial overrides.

Despite this linguistic failure, all Phase 2A test suites and generator `--check` scripts exited with code 0 (`PASS`), allowing the corrupted files to be committed.

---

## 2. Technical Root Cause Analysis

### A. The Defect Mechanism in Generator Scripts
In commit `6ecb0de`, the translation generation was modularized across regional Python modules (`middle_east_africa.py`, `southeast_asia.py`, `south_asia.py`, `nordic_central.py`, `cyrillic_altaic.py`).

Inspection of the generator implementation revealed a structural shortcut:
```python
# scripts/generated/translations/middle_east_africa.py (commit 6ecb0de)
def get_middle_east_africa_locales():
    ar = apply_invariants(dict(AR))
    arz = apply_invariants(dict(AR)); arz.update(ARZ_OVERRIDES)
    fa = apply_invariants(dict(AR)); fa.update(FA_OVERRIDES)
    he = apply_invariants(dict(AR)); he.update(HE_OVERRIDES)   # <--- ROOT CAUSE: HE cloned from Arabic AR!
    am = apply_invariants(dict(AR)); am.update(AM_OVERRIDES)   # <--- ROOT CAUSE: AM cloned from Arabic AR!
    return {"ar": ar, "arz": arz, "fa": fa, "he": he, "am": am}

# scripts/generated/translations/southeast_asia.py (commit 6ecb0de)
def get_southeast_asia_locales():
    id_dict = apply_invariants({...})
    th = apply_invariants({k: v for k, v in id_dict.items()}); th.update(TH_OVERRIDES) # <--- ROOT CAUSE: Thai cloned from Indonesian ID!
    my = apply_invariants({k: v for k, v in id_dict.items()}); my.update(MY_OVERRIDES) # <--- ROOT CAUSE: Burmese cloned from Indonesian ID!
    km = apply_invariants({k: v for k, v in id_dict.items()}); km.update(KM_OVERRIDES) # <--- ROOT CAUSE: Khmer cloned from Indonesian ID!
    tet = apply_invariants({k: v for k, v in id_dict.items()}); tet.update(TET_OVERRIDES)
    return {"id": id_dict, "th": th, "my": my, "km": km, "tet": tet}

# scripts/generated/translations/nordic_central.py (commit 6ecb0de)
def get_nordic_central_locales():
    base = get_romance_germanic_locales()["de"]
    el = apply_invariants({k: v for k, v in base.items()}); el.update(EL_OVERRIDES)    # <--- ROOT CAUSE: Greek cloned from German DE!
    pl = apply_invariants({k: v for k, v in base.items()}); pl.update(PL_OVERRIDES)
    tr = apply_invariants({k: v for k, v in base.items()}); tr.update(TR_OVERRIDES)
```

The generator authors created complete translation tables for only a few "hub" languages (`ar`, `id`, `hi`, `de`, `ru`, `es`, `fr`, `ja`), and treated all other languages in the region as "override deltas" over the hub language. Because the overrides only provided translations for 6 to 35 high-visibility UI keys (e.g. `site.math.name`, `nav.home`, `common.correct`), the remaining 265–295 keys defaulted to the base hub language.

### B. Why Tests Failed to Detect the Failure
The validation suite in `tests/generated/learning-translations.test.ts` and `scripts/generated/translations/validate.py` enforced purely mechanical schema invariants:
1. `keys.length === 301`
2. `typeof val === "string" && val.trim().length > 0`
3. Multiset placeholder equivalence: `ph(val) === ph(en[k])`
4. Protected tokens (`brand.math`, `brand.english`, `grade.E1`..`H3`)
5. Forbidden raw `$` characters
6. Absence of Hangul outside `locale.ko` (`/[가-힯]/.test(v) === false`)

Crucially, the test suite had:
- **No Unicode writing system or script verification**: It did not verify that Hebrew (`he`) contained Hebrew letters (`[\u0590-\u05FF]`), Thai (`th`) contained Thai letters (`[\u0E00-\u0E7F]`), or Greek (`el`) contained Greek letters (`[\u0370-\u03FF]`).
- **No language identity / classification checks**: Latin-based texts in Indonesian, German, and Russian passed schema checks for Thai, Greek, and Uzbek because they satisfied placeholder and key parity rules.
- **No cross-locale duplication detection**: The tests evaluated each JSON file in isolation. They never compared string overlap across distinct locale pairs.

---

## 3. Corrective Architecture & Prevention Mechanisms

To ensure complete, genuine localization and prevent any regression, the following multi-layered gates are established:

### Gate 1: Comprehensive Re-translation from Canonical Source
- All 35 target locales are translated from scratch directly from the canonical English source (`f707310`, `lib/learn/i18n/en.ts`) with zero inheritance or cloning from regional hub dictionaries.
- Every locale dictionary must independently supply valid native translations for all 301 keys.

### Gate 2: Core-Owned Acceptance Verifier (`scripts/learn/i18n/verify-generated-locales.mjs`)
All outputs must pass Claude's core acceptance verifier, which enforces:
1. **Script Purity (`scriptShare >= 0.6`)**:
   For all non-Latin locales (`ar`, `arz`, `fa`, `he`, `th`, `km`, `my`, `ja`, `zh-Hans`, `zh-Hant`, `ru`, `uk`, `kk`, `mn`, `el`, `hi`, `ne`, `bn`, `ta`, `si`, `am`), at least 90% of strings must have their letters predominantly written in their native script.
2. **Cross-Language String Sharing Barrier**:
   No two distinct language files may share more than 15% identical non-English strings (with a 70% threshold allowed only for designated sibling varieties: `ar|arz`, `zh-Hans|zh-Hant`, `da|no`, `no|sv`, `da|sv`).
3. **No Unintentional Hangul or Vietnamese Leakage**:
   Hangul is strictly forbidden in all 37 non-Korean locales (with exception only for `locale.ko: "한국어"`). Vietnamese diacritics are forbidden in non-Vietnamese locales.
4. **Untranslated English Minimization**:
   Strings identical to English are tracked and restricted to permissible universal brand tokens (`MATH.LIFE.HELP`, `ENGLISH.LIFE.HELP`, `XP`, `common.diff`).

### Gate 3: Target Language Identity & Human-Semantic Review
- Representative strings across 10 critical functional domains (`nav`, `onboarding`, `auth`, `lesson`, `result`, `profile`, `error`, `accessibility`, `certification`, `scholarship`) are verified for native language vocabulary and syntax.
- Spot-check reviews covering at least 15 representative keys per locale are archived in `reports/generated/translation-semantic-spot-check.md`.
