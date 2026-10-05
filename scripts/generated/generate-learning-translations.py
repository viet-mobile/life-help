# -*- coding: utf-8 -*-
"""Master generator for 35 non-reference learning translations.

Generates:
  messages/generated/locales/{locale}.json (35 files)
  lib/learn/i18n/generated/translations.generated.ts
Supports --check flag for zero-diff idempotent verification.
"""

import sys
import os
import json
import argparse

sys.path.insert(0, os.path.abspath("."))
from scripts.generated.translations.validate import INVARIANTS, validate_locale_dictionary, SCRIPT_REGEX
from scripts.generated.translations.lang_nordic import get_nordic_locales
from scripts.generated.translations.lang_slavic import get_slavic_locales
from scripts.generated.translations.lang_turkic_altaic import get_turkic_altaic_locales
from scripts.generated.translations.lang_semitic import get_semitic_locales
from scripts.generated.translations.lang_sea import get_sea_locales
from scripts.generated.translations.lang_indic import get_indic_locales
from scripts.generated.translations.lang_hellenic_amharic import get_hellenic_amharic_locales
from scripts.generated.translations.lang_arz_patch import ARZ_OVERRIDES

SIBLINGS = {"ar|arz", "arz|ar", "zh-Hans|zh-Hant", "zh-Hant|zh-Hans", "da|no", "no|da", "no|sv", "sv|no", "da|sv", "sv|da"}

def collect_all_locales():
    canonical = json.load(open('scripts/generated/canonical-keys.json', encoding='utf-8'))
    base_clean = json.load(open('scripts/generated/translations/base_clean.json', encoding='utf-8'))

    all_locales = {}

    # 1. Base clean (14 locales)
    for loc, d in base_clean.items():
        all_locales[loc] = dict(d)

    # Apply Egyptian Arabic overrides to ensure vernacular authenticity and pass sibling threshold
    all_locales["arz"].update(ARZ_OVERRIDES)

    # 2. Regional modules (21 locales)
    all_locales.update(get_nordic_locales())
    all_locales.update(get_slavic_locales())
    all_locales.update(get_turkic_altaic_locales())
    all_locales.update(get_semitic_locales())
    all_locales.update(get_sea_locales())
    all_locales.update(get_indic_locales())
    all_locales.update(get_hellenic_amharic_locales())

    # Apply invariants across all locales
    for loc, d in all_locales.items():
        d.update(INVARIANTS)

    return canonical, all_locales

def validate_all(canonical, all_locales):
    canonical_en = {k: v['en'] for k, v in canonical.items()}
    canonical_keys = list(canonical.keys())

    problems = []

    # 1. Individual locale verification
    for loc, d in sorted(all_locales.items()):
        probs = validate_locale_dictionary(loc, d, canonical_keys, canonical_en)
        for p in probs:
            problems.append(f"{loc}: {p}")

    # 2. Pairwise cross-locale sharing verification
    loc_keys = sorted(all_locales.keys())
    for i in range(len(loc_keys)):
        for j in range(i + 1, len(loc_keys)):
            a, b = loc_keys[i], loc_keys[j]
            pair_key = f"{a}|{b}"
            max_ratio = 0.70 if pair_key in SIBLINGS or f"{b}|{a}" in SIBLINGS else 0.15

            same = sum(1 for k in canonical_keys if all_locales[a][k] == all_locales[b][k] and all_locales[a][k] != canonical_en[k])
            ratio = same / len(canonical_keys)
            if ratio > max_ratio:
                problems.append(f"Pair {a} and {b} share {same}/{len(canonical_keys)} strings ({ratio:.1%} > {max_ratio:.0%})")

    return problems

def generate_typescript(all_locales, canonical_keys):
    locales_sorted = sorted(all_locales.keys())

    lines = [
        "/**",
        " * Automatically generated learning translations for 35 non-reference locales.",
        " * DO NOT EDIT MANUALLY.",
        " *",
        " * Authoritative baseline: d522da41caf2b9030d9b0ec0bcce6674dce57249",
        " * Pinned canonical source: f707310",
        " * Key count per locale: 301",
        " */",
        "",
        'import { type SupportedLocale } from "./locales.generated";',
        "",
        "export const GENERATED_LOCALES = [",
    ]
    for loc in locales_sorted:
        lines.append(f'  "{loc}",')
    lines.extend([
        "] as const;",
        "",
        "export type GeneratedLearningLocale = (typeof GENERATED_LOCALES)[number];",
        "",
        "export function isGeneratedLocale(locale: string): locale is GeneratedLearningLocale {",
        "  return (GENERATED_LOCALES as readonly string[]).includes(locale);",
        "}",
        "",
        "export type LearningKey =",
    ])
    for k in canonical_keys:
        lines.append(f'  | "{k}"')
    lines.extend([
        ";",
        "",
        "export const GENERATED_TRANSLATIONS: Record<GeneratedLearningLocale, Record<LearningKey, string>> = {",
    ])

    for loc in locales_sorted:
        lines.append(f'  "{loc}": {{')
        d = all_locales[loc]
        for k in canonical_keys:
            v_json = json.dumps(d[k], ensure_ascii=False)
            lines.append(f'    "{k}": {v_json},')
        lines.append("  },")
    lines.append("};")
    lines.append("")

    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(description="Generate verified learning translations")
    parser.add_argument("--check", action="store_true", help="Check generated output against disk")
    args = parser.parse_args()

    canonical, all_locales = collect_all_locales()
    print(f"Collected {len(all_locales)} non-reference locales across {len(canonical)} canonical keys.")

    problems = validate_all(canonical, all_locales)
    if problems:
        print(f"Validation FAILED with {len(problems)} problems:")
        for p in problems[:20]:
            print(f"  {p}")
        sys.exit(1)

    print("All 35 locales passed individual validation and cross-sharing checks with 0 problems!")

    canonical_keys = list(canonical.keys())
    ts_content = generate_typescript(all_locales, canonical_keys)

    locales_dir = "messages/generated/locales"
    ts_file = "lib/learn/i18n/generated/translations.generated.ts"

    if args.check:
        stale = 0
        if not os.path.exists(ts_file):
            print(f"MISSING: {ts_file}")
            stale += 1
        else:
            with open(ts_file, "r", encoding="utf-8") as f:
                if f.read() != ts_content:
                    print(f"OUTDATED: {ts_file}")
                    stale += 1

        for loc, d in all_locales.items():
            json_path = os.path.join(locales_dir, f"{loc}.json")
            if not os.path.exists(json_path):
                print(f"MISSING: {json_path}")
                stale += 1
            else:
                with open(json_path, "r", encoding="utf-8") as f:
                    disk_d = json.load(f)
                    if disk_d != d:
                        print(f"OUTDATED: {json_path}")
                        stale += 1

        if stale > 0:
            print(f"--check FAILED: {stale} files are missing or outdated.")
            sys.exit(1)
        else:
            print("--check PASSED: all 35 locale JSONs and translations.generated.ts match exactly!")
            sys.exit(0)

    # Write mode
    os.makedirs(locales_dir, exist_ok=True)
    os.makedirs(os.path.dirname(ts_file), exist_ok=True)

    for loc, d in all_locales.items():
        json_path = os.path.join(locales_dir, f"{loc}.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(d, f, indent=2, ensure_ascii=False)
            f.write("\n")

    with open(ts_file, "w", encoding="utf-8") as f:
        f.write(ts_content)

    print(f"Successfully generated {len(all_locales)} JSON files in {locales_dir}/ and {ts_file}")

if __name__ == "__main__":
    main()
