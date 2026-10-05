# -*- coding: utf-8 -*-
"""Validation utilities for generated learning translations."""

import re

BRANDS = ["MATH.LIFE.HELP", "ENGLISH.LIFE.HELP"]
INVARIANTS = {
    "brand.math": "MATH.LIFE.HELP",
    "brand.english": "ENGLISH.LIFE.HELP",
    "dash.xp": "XP",
    "locale.ko": "한국어",
    "locale.vi": "Tiếng Việt",
    "grade.E1": "E1",
    "grade.E2": "E2",
    "grade.E3": "E3",
    "grade.E4": "E4",
    "grade.E5": "E5",
    "grade.E6": "E6",
    "grade.M1": "M1",
    "grade.M2": "M2",
    "grade.M3": "M3",
    "grade.H1": "H1",
    "grade.H2": "H2",
    "grade.H3": "H3",
}

SCRIPT_REGEX = {
    "ar": re.compile(r"[\u0600-\u06FF\u0750-\u077F]"),
    "arz": re.compile(r"[\u0600-\u06FF\u0750-\u077F]"),
    "fa": re.compile(r"[\u0600-\u06FF\u0750-\u077F]"),
    "he": re.compile(r"[\u0590-\u05FF]"),
    "th": re.compile(r"[\u0E00-\u0E7F]"),
    "km": re.compile(r"[\u1780-\u17FF]"),
    "my": re.compile(r"[\u1000-\u109F]"),
    "ja": re.compile(r"[\u3040-\u30FF\u4E00-\u9FFF]"),
    "zh-Hans": re.compile(r"[\u4E00-\u9FFF]"),
    "zh-Hant": re.compile(r"[\u4E00-\u9FFF]"),
    "ru": re.compile(r"[\u0400-\u04FF]"),
    "uk": re.compile(r"[\u0400-\u04FF]"),
    "kk": re.compile(r"[\u0400-\u04FF]"),
    "mn": re.compile(r"[\u0400-\u04FF]"),
    "el": re.compile(r"[\u0370-\u03FF]"),
    "hi": re.compile(r"[\u0900-\u097F]"),
    "ne": re.compile(r"[\u0900-\u097F]"),
    "bn": re.compile(r"[\u0980-\u09FF]"),
    "ta": re.compile(r"[\u0B80-\u0BFF]"),
    "si": re.compile(r"[\u0D80-\u0DFF]"),
    "am": re.compile(r"[\u1200-\u137F]"),
}

LETTER_REGEX = re.compile(r"[a-zA-Z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u0900-\u097F\u0980-\u09FF\u0B80-\u0BFF\u0D80-\u0DFF\u0E00-\u0E7F\u1000-\u109F\u1200-\u137F\u1780-\u17FF\u3040-\u30FF\u4E00-\u9FFF]")
HANGUL_REGEX = re.compile(r"[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]")

def extract_placeholders(s):
    return sorted(re.findall(r"\{[A-Za-z0-9_]+\}", s))

def script_share(locale, s):
    reg = SCRIPT_REGEX.get(locale)
    if not reg:
        return None
    cleaned = re.sub(r"\{[A-Za-z0-9_]+\}", "", s)
    cleaned = re.sub(r"MATH\.LIFE\.HELP|ENGLISH\.LIFE\.HELP|XP|Lv\.?|\bO\b|\bX\b", "", cleaned)
    letters = len(LETTER_REGEX.findall(cleaned))
    if letters < 4:
        return None
    in_script = len(reg.findall(cleaned))
    return in_script / letters

def validate_locale_dictionary(locale, d, canonical_keys, canonical_en):
    problems = []
    keys = set(d.keys())
    expected_keys = set(canonical_keys)

    missing = expected_keys - keys
    extra = keys - expected_keys
    if missing:
        problems.append(f"{locale}: missing {len(missing)} keys: {list(missing)[:5]}")
    if extra:
        problems.append(f"{locale}: extra {len(extra)} keys: {list(extra)[:5]}")

    for k, v in INVARIANTS.items():
        if d.get(k) != v:
            problems.append(f"{locale}: invariant {k} changed: '{d.get(k)}' != '{v}'")

    wrong_script_count = 0
    for k in canonical_keys:
        v = d.get(k, "")
        if not isinstance(v, str) or not v.strip():
            problems.append(f"{locale}: empty key {k}")
            continue

        # Placeholders
        en_ph = extract_placeholders(canonical_en[k])
        loc_ph = extract_placeholders(v)
        if en_ph != loc_ph:
            problems.append(f"{locale}: placeholder mismatch on {k}: {en_ph} != {loc_ph}")

        # Markup / raw newlines / math delimiter $
        if re.search(r"[<>\r\n]|\$", v):
            problems.append(f"{locale}: forbidden markup/newline/$ in {k}: '{v}'")

        # Hangul
        if k != "locale.ko" and HANGUL_REGEX.search(v):
            problems.append(f"{locale}: forbidden Hangul in {k}: '{v}'")

        # Brands
        for b in BRANDS:
            if b in canonical_en[k] and b not in v:
                problems.append(f"{locale}: brand token {b} missing in {k}")

        # Script share
        sh = script_share(locale, v)
        if sh is not None and sh < 0.6:
            wrong_script_count += 1

    if locale in SCRIPT_REGEX and wrong_script_count > len(canonical_keys) * 0.1:
        problems.append(f"{locale}: WRONG LANGUAGE? {wrong_script_count}/{len(canonical_keys)} strings not in own script")

    return problems
