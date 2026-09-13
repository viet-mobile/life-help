# scripts/apply_all_translations.py
import json
import os
import re
import sys

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MESSAGES_DIR = os.path.join(ROOT_DIR, "messages")

sys.path.append(os.path.join(ROOT_DIR, "scripts"))
import dict_weekdays
import dict_calendar
import dict_all_remaining
import dict_european
import dict_asian
import dict_remaining_languages

# Re-run build_el_pt_complete to ensure baseline pt and el are fresh
try:
    import build_el_pt_complete
except Exception as e:
    print("build_el_pt_complete notice:", e)

# Spacing fixes: specific patterns where numbers and words were concatenated without a space
SPACING_REPLACEMENTS = [
    (re.compile(r"(\d+)(ngày)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(lĩnh)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(tháng)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(dias)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(meses)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(dni)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(miesiące|miesięcy)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(Tage|Tagen)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(Monate|Monaten)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(jours)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(mois)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(giorni)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(mesi)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(dagen)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(maanden)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(dage)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(måneder)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(dagar)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(månader)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(дней|дня)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(месяцев|месяца)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(днів|дні)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(місяців|місяці)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(gün)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(ay)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(hari)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(bulan)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(days)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(months)", re.IGNORECASE), r"\1 \2"),
    (re.compile(r"(\d+)(categories)", re.IGNORECASE), r"\1 \2"),
]

def fix_spacing_in_value(val):
    if not isinstance(val, str):
        return val
    s = val
    for pattern, repl in SPACING_REPLACEMENTS:
        s = pattern.sub(repl, s)
    return s

def fix_spacing_dict(d):
    res = {}
    for k, v in d.items():
        if isinstance(v, dict):
            res[k] = fix_spacing_dict(v)
        elif isinstance(v, str):
            res[k] = fix_spacing_in_value(v)
        else:
            res[k] = v
    return res

def apply_all():
    locales = [f.replace(".json", "") for f in os.listdir(MESSAGES_DIR) if f.endswith(".json")]
    print(f"Applying dictionary updates to all {len(locales)} message files...")

    for loc in sorted(locales):
        filepath = os.path.join(MESSAGES_DIR, f"{loc}.json")
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        data.setdefault("workspace", {})
        data.setdefault("tech", {})

        # 1. Weekdays
        if loc in dict_weekdays.WEEKDAYS_ALL:
            data["workspace"].update(dict_weekdays.WEEKDAYS_ALL[loc])

        # 2. Calendar
        if loc in dict_calendar.CALENDAR_ALL:
            data["workspace"].update(dict_calendar.CALENDAR_ALL[loc])

        # 3. dict_all_remaining
        if loc in dict_all_remaining.ALL_TECH_WS:
            for sec, kv in dict_all_remaining.ALL_TECH_WS[loc].items():
                data.setdefault(sec, {}).update(kv)

        # 4. dict_european
        if loc in dict_european.EUROPEAN_TECH_WS:
            for sec, kv in dict_european.EUROPEAN_TECH_WS[loc].items():
                data.setdefault(sec, {}).update(kv)

        # 5. dict_asian
        if loc in dict_asian.ASIAN_TECH_WS:
            for sec, kv in dict_asian.ASIAN_TECH_WS[loc].items():
                data.setdefault(sec, {}).update(kv)

        # 6. dict_remaining_languages
        if loc in dict_remaining_languages.REMAINING_TECH_WS:
            for sec, kv in dict_remaining_languages.REMAINING_TECH_WS[loc].items():
                data.setdefault(sec, {}).update(kv)

        # Apply spacing fix
        cleaned_data = fix_spacing_dict(data)

        # Save back
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(cleaned_data, f, ensure_ascii=False, indent=2)
            f.write("\n")

    print("All message files successfully updated and saved!")

if __name__ == "__main__":
    apply_all()

