# -*- coding: utf-8 -*-
"""
scripts/verify_i18n_completeness.py
Locale completeness audit for the main site. The locale list is ALWAYS read from the canonical registry
(`locales` in messages/registry.ts); English (messages/en.json) is the canonical key set.

Checks (every registry locale)
  LOCALE_FILES_VS_REGISTRY  one messages/<locale>.json per registry locale, no orphan file, one language-menu entry each
  REQUIRED_KEYS             the historical required-key list (kept from the original verifier)
  LOCALE_KEY_PARITY         missing / extra keys and nested-shape mismatches against en
  USED_KEYS                 every literal t("...") key used in app/ components/ lib/ exists in en
  PLACEHOLDER_PARITY        {name}-style placeholders identical to en in every locale
  IDENTICAL_TO_EN           non-en values identical to English (with natural-language words after removing tokens)
  ENGLISH_LEAK              English wording inside a non-English value (Latin-script locales: English function words;
                            other scripts: a run of Latin words); also English-only values in Korean
  KOREAN_LEAK               Hangul in a non-Korean locale
  RTL_METADATA              a locale written in Arabic / Hebrew script has dir "rtl" in `languages`, and only those do
  LEARN_UI                  learning sites (math / english / study.korean): one dictionary per registry locale (ko.ts canonical,
                            lib/learn/i18n/locales/<code>.json), exact key parity, placeholders, script, no Hangul / identical-to-ko
                            values, and every t("...") used by learning code exists (learning code is NOT checked against messages/)
  LEARN_CONTENT             presentation overlays per registry locale and site: korean must be FULL in every locale; math / english
                            must be FULL as well (content/learn-overlays/coverage.json); STRUCT / PARTIAL / MISSING is a finding
  TARGET_LANGUAGE_CONTENT   target-language material is classified, not translated: Korean text inside study.korean overlays must be
                            canonical target text of that item; English target spans of english.life.help survive in every overlay
  HARDCODED_TEXT            user-visible Korean / English literals in app/, components/, lib/ (scripts/i18n/scan_hardcoded.mjs);
                            reported, and gating only with --hardcoded-gate (this branch scopes the gate to the locale files)

Every finding is TRANSLATION_REQUIRED unless scripts/i18n/allowlist.json classifies it; each allowlist entry must carry a
classification from ALLOWED_CLASSES and a non-empty reason (an entry without a reason is itself a finding).
Exit code 1 when anything is unresolved.
Usage: python3 scripts/verify_i18n_completeness.py [--report] [--json out.json] [--hardcoded-gate] [--quiet]
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.join(os.path.dirname(__file__), "..")
MESSAGES_DIR = os.path.join(ROOT, "messages")
OVERLAYS = os.path.join(ROOT, "content", "learn-overlays")
ALLOWLIST_PATH = os.path.join(os.path.dirname(__file__), "i18n", "allowlist.json")

REQUIRED_COMMON = ["detail", "apply", "safeApply", "platformTagline"]
REQUIRED_CUSTOMER = ["priorityEmergency", "lifeSupportTitle", "lifeSupportDesc", "partnerRegisterLink", "reviewLink", "safe050Badge"]
REQUIRED_SERVICE = ["clog", "leakPlumbing", "boiler", "cleaning", "housing", "bankHelp", "insuranceHelp", "jobHelp", "hospitalHelp", "mobileHelp"]
REQUIRED_SERVICE_DESC = REQUIRED_SERVICE
REQUIRED_SERVICE_PROBLEMS = REQUIRED_SERVICE
REQUIRED_SUPPORT = ["badge050", "requestTab", "partnerTab", "safe050Title", "safe050Desc", "phoneInputLabel", "submitBtn"]

ALLOWED_CLASSES = {"LEGITIMATELY_IDENTICAL", "BRAND_OR_PROPER_NOUN", "TECHNICAL_TOKEN", "OFFICIAL_EXTERNAL_LABEL",
                   "TARGET_LANGUAGE_CONTENT", "BILINGUAL_KOREAN", "OFFICIAL_KOREAN_RECORD",
                   # hard-coded literal classes (not UI, or UI through a localizing helper)
                   "DATA_PLACE_NAME", "PER_LOCALE_TABLE", "CANONICAL_KO_DATA", "NON_UI", "STORED_CANONICAL_VALUE"}

HANGUL = re.compile(r"[가-힣ㄱ-ㆎ]")
RTL_SCRIPT = re.compile(r"[֐-׿؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]")
LETTER = re.compile(r"[^\W\d_]", re.U)
PLACEHOLDER = re.compile(r"\{[A-Za-z0-9_]+\}")
LATIN_WORD = re.compile(r"[A-Za-z][A-Za-z'’]{2,}")
LATIN_RUN = re.compile(r"[A-Za-z][A-Za-z'’]{2,}[\s,/-]+[A-Za-z][A-Za-z'’]{2,}")
# English function words: two distinct ones in a Latin-script locale's value is a strong English signal
EN_FUNCTION_WORDS = {"the", "and", "your", "you", "please", "with", "for", "this", "that", "will", "are", "not", "here", "from",
                     "our", "has", "have", "been", "into", "can", "all", "any", "when", "who", "what", "which", "should"}


def registry():
    src = open(os.path.join(MESSAGES_DIR, "registry.ts"), encoding="utf-8").read()
    locales = re.findall(r'"([^"]+)"', re.search(r"export const locales = \[(.*?)\] as const", src, re.S).group(1))
    block = re.search(r"export const languages: readonly LanguageMeta\[\] = \[(.*?)\] as const", src, re.S).group(1)
    languages = {m.group(1): ('dir: "rtl"' in m.group(0)) for m in re.finditer(r'\{ code: "([^"]+)"[^}]*\}', block)}
    return locales, languages


def flatten(obj, prefix=""):
    out = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            out.update(flatten(v, f"{prefix}.{k}" if prefix else k))
    elif isinstance(obj, list):
        out[prefix] = ("__list__", len(obj))
        for i, v in enumerate(obj):
            out.update(flatten(v, f"{prefix}[{i}]"))
    else:
        out[prefix] = obj
    return out


def load(code):
    with open(os.path.join(MESSAGES_DIR, f"{code}.json"), encoding="utf-8") as f:
        return json.load(f)


def strip_tokens(value, tokens):
    """Removes allowlisted tokens (brands, technical tokens) and placeholders; what is left is judged."""
    v = PLACEHOLDER.sub(" ", value)
    for t in sorted(tokens, key=len, reverse=True):
        v = re.sub(rf"(?<![A-Za-z]){re.escape(t)}(?![A-Za-z])", " ", v)
    return v


def is_latin_locale(values):
    letters = "".join(LETTER.findall("".join(values)))
    latin = sum(1 for ch in letters if ch.isascii() or "À" <= ch <= "ɏ" or "Ḁ" <= ch <= "ỿ")
    return bool(letters) and latin / len(letters) > 0.6


def english_signal(value, latin_locale, en_value, tokens):
    rest = strip_tokens(value, tokens)
    words = LATIN_WORD.findall(rest)
    if not words:
        return None
    if en_value is not None and value == en_value:
        return "IDENTICAL_TO_EN"
    if latin_locale:
        return "ENGLISH_WORDING" if len({w.lower() for w in words} & EN_FUNCTION_WORDS) >= 2 else None
    return "LATIN_TEXT_IN_NON_LATIN_LOCALE" if LATIN_RUN.search(rest) else None


LEARN_SURFACES = (os.path.join("app", "study"), os.path.join("components", "learn"), os.path.join("lib", "learn"), os.path.join("app", "manifest.ts"))


def is_learn_file(rel):
    return rel.startswith(LEARN_SURFACES)


def used_keys(learn=False):
    """Literal t("...") keys: marketplace files against messages/, learning files (learn=True) against lib/learn/i18n."""
    keys = {}
    pattern = re.compile(r"\b(?:t|tKo|tBilingual)\(\s*[\"'`]([a-zA-Z]\w*(?:\.\w+)+)[\"'`]")
    for root in ("app", "components", "lib"):
        for dirpath, _, files in os.walk(os.path.join(ROOT, root)):
            for name in files:
                if name.endswith((".ts", ".tsx")):
                    path = os.path.join(dirpath, name)
                    if is_learn_file(os.path.relpath(path, ROOT)) != learn:
                        continue
                    for m in pattern.finditer(open(path, encoding="utf-8").read()):
                        keys.setdefault(m.group(1), os.path.relpath(path, ROOT))
    return keys


SCRIPT_RANGES = {"ar": "؀-ۿ", "arz": "؀-ۿ", "fa": "؀-ۿ", "ur": "؀-ۿ", "he": "֐-׿", "ru": "Ѐ-ӿ", "uk": "Ѐ-ӿ", "kk": "Ѐ-ӿ",
                 "mn": "Ѐ-ӿ", "el": "Ͱ-Ͽ", "hi": "ऀ-ॿ", "mr": "ऀ-ॿ", "ne": "ऀ-ॿ", "bn": "ঀ-৿", "pa": "਀-੿", "gu": "઀-૿",
                 "ta": "஀-௿", "te": "ఀ-౿", "kn": "ಀ-೿", "ml": "ഀ-ൿ", "si": "඀-෿", "th": "฀-๿", "km": "ក-៿", "my": "က-႟",
                 "am": "ሀ-፿", "ja": "぀-ヿ一-鿿", "zh-Hans": "一-鿿", "zh-Hant": "一-鿿"}


def learning_audit(locales, add, result):
    """LEARN_UI / LEARN_CONTENT / TARGET_LANGUAGE_CONTENT (see module docstring)."""
    ko_src = open(os.path.join(ROOT, "lib", "learn", "i18n", "ko.ts"), encoding="utf-8").read()
    ko = dict(re.findall(r'^\s*"([\w.]+)":\s*"((?:[^"\\]|\\.)*)",?\s*$', ko_src, re.M))
    ui = {"LOCALES": len(locales), "KEYS": len(ko), "COMPLETE": 0}
    brand = {k for k in ko if k.startswith("brand.")}
    for code in locales:
        if code == "ko":
            ui["COMPLETE"] += 1
            continue
        path = os.path.join(ROOT, "lib", "learn", "i18n", "locales", f"{code}.json")
        if not os.path.exists(path):
            add("LEARN_UI_MISSING_LOCALE", code)
            continue
        d = json.load(open(path, encoding="utf-8"))
        problems = []
        if set(d) != set(ko):
            problems.append(f"keys missing {sorted(set(ko) - set(d))[:5]} extra {sorted(set(d) - set(ko))[:5]}")
        for k in ko:
            v = d.get(k)
            if not isinstance(v, str) or not v.strip():
                problems.append(f"{k}: empty")
                continue
            if sorted(PLACEHOLDER.findall(v)) != sorted(PLACEHOLDER.findall(ko[k])):
                problems.append(f"{k}: placeholders")
            if HANGUL.search(v):
                problems.append(f"{k}: Hangul")
            if k in brand:
                if v != ko[k]:
                    problems.append(f"{k}: brand changed")
                continue
            letters = re.sub(r"\{\w+\}|[A-Z]{2,}|LIFE\.HELP|XP", "", v)
            if code in SCRIPT_RANGES and len(LETTER.findall(letters)) >= 2 and not re.search(f"[{SCRIPT_RANGES[code]}]", letters):
                problems.append(f"{k}: not in {code} script")
        for p in problems:
            add("LEARN_UI", f"[{code}] {p}")
        if not problems:
            ui["COMPLETE"] += 1
    for key, where in sorted(used_keys(learn=True).items()):
        if key not in ko:
            add("LEARN_UI_USED_KEY_MISSING", f"{key} (used in {where})")
    result["LEARN_UI"] = ui

    # ---- content overlays
    cdir = os.path.join(ROOT, "lib", "learn", "content")
    coverage = json.load(open(os.path.join(OVERLAYS, "coverage.json"), encoding="utf-8"))
    presentation = {"math": "ko", "english": "ko", "korean": "en"}
    table = {}
    for code in locales:
        row = {}
        for site in ("math", "english", "korean"):
            if code == presentation[site]:
                row[site] = "CANONICAL"
            elif code == "vi" and site != "korean":
                row[site] = "FULL"  # generated with the curriculum (scripts/learn/build-*-content.mjs)
            elif site == "korean":
                row[site] = "FULL" if os.path.exists(os.path.join(OVERLAYS, code, "korean.json")) else "MISSING"
            else:
                row[site] = coverage.get(code, {}).get(site, "MISSING")
            if row[site] not in ("FULL", "CANONICAL"):  # every site is FULL in every locale: no STRUCT / PARTIAL fallback
                add("LEARN_CONTENT_MISSING", f"[{code}] {site} {row[site]}")
        table[code] = row
    result["LEARN_CONTENT"] = table

    # ---- target-language material (classified, never translated)
    target = {"KOREAN_TARGET_SPANS": 0, "ENGLISH_TARGET_SPANS": 0}
    korean = json.load(open(os.path.join(cdir, "korean", "korean.json"), encoding="utf-8"))
    hangul_run = re.compile(r"[가-힣ㄱ-ㆎ][가-힣ㄱ-ㆎ\s.,?!·]*")
    canon_text = json.dumps(korean, ensure_ascii=False)
    for code in locales:
        if code in ("en", "ko"):
            continue
        path = os.path.join(OVERLAYS, code, "korean.json")
        if not os.path.exists(path):
            continue
        for run in hangul_run.findall(open(path, encoding="utf-8").read()):
            for word in run.split():
                w = word.strip(".,?!·")
                if not w:
                    continue
                if w in canon_text:
                    target["KOREAN_TARGET_SPANS"] += 1
                else:
                    add("TARGET_LANGUAGE_LEAK", f"[{code}] korean overlay has Korean not in the canonical target material: {w}")
    eng = {}
    for f in ("elementary/english.json", "demo/english.json", "secondary/english.json"):
        for q in json.load(open(os.path.join(cdir, f), encoding="utf-8"))["questions"]:
            eng[q["id"]] = q
    latin = re.compile(r"[A-Za-z][A-Za-z0-9'’\-]*(?: [A-Za-z][A-Za-z0-9'’\-]*)*")
    vi = {}
    for f in ("vi/english.json", "vi/secondary-english.json"):
        vi.update(json.load(open(os.path.join(cdir, f), encoding="utf-8")).get("questions", {}))
    for code in locales:
        path = os.path.join(OVERLAYS, code, "english.json")
        if not os.path.exists(path):
            continue
        for qid, ov in json.load(open(path, encoding="utf-8")).get("questions", {}).items():
            q = eng.get(qid)
            if not q or "prompt" not in ov:
                continue
            for span in latin.findall(re.sub(r"\$[^$]*\$", " ", q["prompt"])):
                if span not in (vi.get(qid, {}).get("prompt") or ""):
                    continue  # the reference translation also rephrased it: not target material
                if span in ov["prompt"]:
                    target["ENGLISH_TARGET_SPANS"] += 1
                else:
                    add("TARGET_LANGUAGE_LEAK", f"[{code}] {qid}: English target '{span}' missing from the prompt")
    result["TARGET_LANGUAGE_CONTENT"] = target


def main():
    report_only = "--report" in sys.argv
    quiet = "--quiet" in sys.argv
    hardcoded_gate = "--hardcoded-gate" in sys.argv
    json_out = sys.argv[sys.argv.index("--json") + 1] if "--json" in sys.argv else None
    allow = json.load(open(ALLOWLIST_PATH, encoding="utf-8"))
    tokens = list(allow.get("tokens", {}).keys())
    entries = {}
    locales, languages = registry()
    result = {"SUPPORTED_LOCALE_COUNT": len(locales), "findings": {}, "per_locale": {}, "unresolved_items": {}}
    F = result["findings"]

    def add(cat, item):
        F.setdefault(cat, []).append(item)

    # ---- allowlist hygiene: every entry needs a known classification and a reason
    for section in ("tokens", "hardcodedFiles", "hardcodedPatterns"):
        for name, spec in allow.get(section, {}).items():
            if not isinstance(spec, dict) or spec.get("classification") not in ALLOWED_CLASSES or not str(spec.get("reason", "")).strip():
                add("ALLOWLIST_ENTRY_WITHOUT_REASON", f"{section}: {name}")
    for e in allow.get("entries", []):
        if e.get("classification") not in ALLOWED_CLASSES or not str(e.get("reason", "")).strip() or not e.get("key") or not e.get("locale"):
            add("ALLOWLIST_ENTRY_WITHOUT_REASON", f"entries: {e.get('locale')}:{e.get('key')}")
            continue
        entries[(e["locale"], e["key"])] = e["classification"]

    def classify(code, key):
        return entries.get((code, key)) or entries.get(("*", key))

    files = sorted(f[:-5] for f in os.listdir(MESSAGES_DIR) if f.endswith(".json"))
    if sorted(locales) != files:
        add("LOCALE_FILES_VS_REGISTRY", {"registry_only": sorted(set(locales) - set(files)), "files_only": sorted(set(files) - set(locales))})
    if sorted(languages) != sorted(locales):
        add("LOCALE_FILES_VS_REGISTRY", {"language_menu_only": sorted(set(languages) - set(locales)), "missing_in_language_menu": sorted(set(locales) - set(languages))})

    en = flatten(load("en"))
    ko = flatten(load("ko"))
    en_strings = {k: v for k, v in en.items() if isinstance(v, str)}
    for key, path in sorted(used_keys().items()):
        if key not in en:
            add("USED_KEY_MISSING", f"{key} (used in {path})")

    totals = {k: 0 for k in ["IDENTICAL_TO_EN_CANDIDATES", "ENGLISH_LEAK_CANDIDATES", "ENGLISH_LEAKS_UNRESOLVED", "KOREAN_LEAK_CANDIDATES",
                             "KOREAN_LEAKS_UNRESOLVED", "IDENTICAL_UNRESOLVED", "LEGITIMATE_EXCEPTIONS"]}
    classified = {}
    result["LOCALE_KEYS_AUDITED"] = len(en_strings) * len(locales)

    for code in locales:
        data = load(code)
        for section, keys in [("common", REQUIRED_COMMON), ("customer", REQUIRED_CUSTOMER), ("service", REQUIRED_SERVICE),
                              ("serviceDesc", REQUIRED_SERVICE_DESC), ("serviceProblems", REQUIRED_SERVICE_PROBLEMS), ("support", REQUIRED_SUPPORT)]:
            for key in keys:
                if not data.get(section, {}).get(key):
                    add("REQUIRED_KEYS", f"[{code}] {section}.{key}")
        flat = flatten(data)
        for key, ev in en.items():
            if key not in flat:
                add("MISSING_KEY", f"[{code}] {key}")
            elif type(ev) is not type(flat[key]) and not (isinstance(ev, str) and isinstance(flat[key], str)):
                add("NESTED_KEY_SHAPE_MISMATCH", f"[{code}] {key}")
            elif isinstance(ev, tuple) and ev != flat[key]:
                add("NESTED_KEY_SHAPE_MISMATCH", f"[{code}] {key}: list length {flat[key][1]} != {ev[1]}")
        for key in flat:
            if key not in en:
                add("EXTRA_KEY", f"[{code}] {key}")

        strings = {k: v for k, v in flat.items() if isinstance(v, str) and k in en_strings}
        latin_locale = is_latin_locale(strings.values())
        # RTL metadata follows the locale's own script
        letters = "".join(LETTER.findall("".join(strings.values())))
        rtl_share = len(RTL_SCRIPT.findall(letters)) / max(1, len(letters))
        if (rtl_share > 0.5) != bool(languages.get(code)):
            add("RTL_METADATA", f"[{code}] script RTL share {rtl_share:.2f} but languages dir rtl = {bool(languages.get(code))}")

        stats = {"TOTAL_KEYS": len(strings), "IDENTICAL_TO_EN_CANDIDATES": 0, "LEGITIMATE_EXCEPTIONS": 0, "UNRESOLVED": 0}
        unresolved = []
        for key, value in strings.items():
            if sorted(PLACEHOLDER.findall(value)) != sorted(PLACEHOLDER.findall(en_strings[key])):
                add("PLACEHOLDER_MISMATCH", f"[{code}] {key}: {PLACEHOLDER.findall(value)} != {PLACEHOLDER.findall(en_strings[key])}")
            if not value.strip():
                add("EMPTY_VALUE", f"[{code}] {key}")
            cls = classify(code, key)
            if code == "en":
                if HANGUL.search(value):
                    totals["KOREAN_LEAK_CANDIDATES"] += 1
                    if cls:
                        stats["LEGITIMATE_EXCEPTIONS"] += 1
                        totals["LEGITIMATE_EXCEPTIONS"] += 1
                        classified[cls] = classified.get(cls, 0) + 1
                    else:
                        totals["KOREAN_LEAKS_UNRESOLVED"] += 1
                        stats["UNRESOLVED"] += 1
                        unresolved.append((key, "KOREAN_LEAK"))
                continue
            problems = []
            if code == "ko":
                rest = strip_tokens(value, tokens)
                if not HANGUL.search(value) and LATIN_RUN.search(rest):
                    totals["ENGLISH_LEAK_CANDIDATES"] += 1
                    problems.append("ENGLISH_IN_KOREAN")
            else:
                if HANGUL.search(value):
                    totals["KOREAN_LEAK_CANDIDATES"] += 1
                    problems.append("KOREAN_LEAK")
                if value == en_strings[key]:
                    stats["IDENTICAL_TO_EN_CANDIDATES"] += 1
                    totals["IDENTICAL_TO_EN_CANDIDATES"] += 1
                sig = english_signal(value, latin_locale, en_strings[key], tokens)
                if sig:
                    totals["ENGLISH_LEAK_CANDIDATES"] += 1
                    problems.append(sig)
            if not problems:
                if code != "ko" and value == en_strings[key]:
                    # identical, but only tokens / numbers / symbols remain once tokens and placeholders are removed
                    stats["LEGITIMATE_EXCEPTIONS"] += 1
                    totals["LEGITIMATE_EXCEPTIONS"] += 1
                    classified["TECHNICAL_TOKEN_ONLY"] = classified.get("TECHNICAL_TOKEN_ONLY", 0) + 1
                continue
            if cls:
                stats["LEGITIMATE_EXCEPTIONS"] += 1
                totals["LEGITIMATE_EXCEPTIONS"] += 1
                classified[cls] = classified.get(cls, 0) + 1
                continue
            stats["UNRESOLVED"] += 1
            if "KOREAN_LEAK" in problems:
                totals["KOREAN_LEAKS_UNRESOLVED"] += 1
            if any(p != "KOREAN_LEAK" for p in problems):
                totals["ENGLISH_LEAKS_UNRESOLVED"] += 1
                if "IDENTICAL_TO_EN" in problems:
                    totals["IDENTICAL_UNRESOLVED"] += 1
            unresolved.append((key, "+".join(problems)))
        stats["TRANSLATED_VALUES"] = stats["TOTAL_KEYS"] - stats["UNRESOLVED"] - stats["LEGITIMATE_EXCEPTIONS"]
        result["per_locale"][code] = stats
        if unresolved:
            result["unresolved_items"][code] = [{"key": k, "problem": p, "value": strings[k], "en": en_strings[k], "ko": ko.get(k)} for k, p in unresolved]
            for k, p in unresolved:
                add("TRANSLATION_REQUIRED", f"[{code}] {k} ({p}): {strings[k][:80]}")

    # ---- hard-coded literals (reported; gating only with --hardcoded-gate)
    try:
        raw = subprocess.run(["node", os.path.join(os.path.dirname(__file__), "i18n", "scan_hardcoded.mjs"), "--json"],
                             cwd=ROOT, capture_output=True, text=True, check=True).stdout
        hits = json.loads(raw)
    except Exception as e:  # node missing etc.
        hits = []
        add("HARDCODED_SCAN_ERROR", str(e)[:200])
    hc_unresolved = []
    for h in hits:
        path = h["file"].replace(os.sep, "/")
        cls = next((s["classification"] for pat, s in allow.get("hardcodedFiles", {}).items() if isinstance(s, dict) and re.fullmatch(pat, path)), None)
        cls = cls or next((s["classification"] for pat, s in allow.get("hardcodedPatterns", {}).items() if isinstance(s, dict) and re.fullmatch(pat, h["text"])), None)
        if cls:
            classified[f"HARDCODED:{cls}"] = classified.get(f"HARDCODED:{cls}", 0) + 1
        else:
            hc_unresolved.append(f"{path}:{h['line']} [{h['lang']}] {h['text'][:100]}")
    result["HARDCODED_TEXT_CANDIDATES"] = len(hits)
    result["HARDCODED_TRANSLATABLE_TEXT_UNRESOLVED"] = len(hc_unresolved)
    result["HARDCODED_GATE"] = "ENFORCED" if hardcoded_gate else "REPORTED_ONLY"
    result["hardcoded_unresolved_items"] = hc_unresolved
    if hardcoded_gate:
        for item in hc_unresolved:
            add("HARDCODED_TEXT", item)

    result.update(totals)
    result["CLASSIFIED"] = classified
    result["MISSING_TRANSLATION_KEYS"] = sum(len(F.get(c, [])) for c in ("MISSING_KEY", "REQUIRED_KEYS", "EMPTY_VALUE", "USED_KEY_MISSING"))
    result["PLACEHOLDER_MISMATCHES"] = len(F.get("PLACEHOLDER_MISMATCH", []))
    result["UNRESOLVED_TRANSLATION_REQUIRED"] = len(F.get("TRANSLATION_REQUIRED", []))

    learning_audit(locales, add, result)
    print("LEARN_UI =", json.dumps(result["LEARN_UI"]))
    print("TARGET_LANGUAGE_CONTENT =", json.dumps(result["TARGET_LANGUAGE_CONTENT"]))
    counts = {}
    for row in result["LEARN_CONTENT"].values():
        for site, kind in row.items():
            counts.setdefault(site, {}).setdefault(kind, 0)
            counts[site][kind] += 1
    print("LEARN_CONTENT =", json.dumps(counts))
    for k in ["SUPPORTED_LOCALE_COUNT", "LOCALE_KEYS_AUDITED", "MISSING_TRANSLATION_KEYS", "PLACEHOLDER_MISMATCHES",
              "IDENTICAL_TO_EN_CANDIDATES", "ENGLISH_LEAK_CANDIDATES", "ENGLISH_LEAKS_UNRESOLVED", "KOREAN_LEAK_CANDIDATES",
              "KOREAN_LEAKS_UNRESOLVED", "LEGITIMATE_EXCEPTIONS", "UNRESOLVED_TRANSLATION_REQUIRED",
              "HARDCODED_TEXT_CANDIDATES", "HARDCODED_TRANSLATABLE_TEXT_UNRESOLVED", "HARDCODED_GATE"]:
        print(f"{k} = {result[k]}")
    print("CLASSIFIED =", json.dumps(classified, ensure_ascii=False))
    print("\nLOCALE    TOTAL_KEYS TRANSLATED IDENTICAL_TO_EN LEGIT_EXCEPTIONS UNRESOLVED")
    for code in locales:
        s = result["per_locale"][code]
        print(f"{code:<9} {s['TOTAL_KEYS']:>10} {s['TRANSLATED_VALUES']:>10} {s['IDENTICAL_TO_EN_CANDIDATES']:>15} {s['LEGITIMATE_EXCEPTIONS']:>16} {s['UNRESOLVED']:>10}")
    for cat, items in F.items():
        print(f"\n{cat}: {len(items)}")
        if not quiet:
            for it in items[:15]:
                print("  -", it)
            if len(items) > 15:
                print(f"  ... and {len(items) - 15} more")
    if json_out:
        json.dump(result, open(json_out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    ok = not F
    print("\nLOCALE_AUDIT =", "PASS" if ok else "FAIL")
    if not ok and not report_only:
        sys.exit(1)


if __name__ == "__main__":
    main()
