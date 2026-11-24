# -*- coding: utf-8 -*-
import re

path = 'life-help/scripts/think/build_all_curriculum_translations.py'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Let's inspect imports at the top
head = """# -*- coding: utf-8 -*-
import os, sys, json
from pathlib import Path

# Add current dir to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / 'life-help'))

from scripts.think.templates_romance_germanic import TEMPLATES_GROUP_1
from scripts.think.templates_slavic_baltic_uralic import TEMPLATES_GROUP_2
from scripts.think.templates_middle_eastern_turkic import TEMPLATES_GROUP_3
from scripts.think.templates_south_asian import TEMPLATES_GROUP_4
from scripts.think.templates_southeast_east_asian import TEMPLATES_GROUP_5
from scripts.think.templates_african_other import TEMPLATES_GROUP_6
"""

# Replace top imports
code = re.sub(r'# -\*- coding: utf-8 -\*-\s+import os, sys, json\s+from pathlib import Path', head, code, count=1)

# Now check where TEMPLATES ends and get_trans begins
replacement = """
# Merge all groups into TEMPLATES
EXTRA_GROUPS = [
    TEMPLATES_GROUP_1, TEMPLATES_GROUP_2, TEMPLATES_GROUP_3,
    TEMPLATES_GROUP_4, TEMPLATES_GROUP_5, TEMPLATES_GROUP_6
]
META_EXTRA = {}
for g in EXTRA_GROUPS:
    for l, d in g.items():
        META_EXTRA[l] = {
            "goal": d.get("goal", ""),
            "thinking1": d.get("thinking1", "")
        }
        for subj in ["math", "physics", "chemistry"]:
            for qtype in ["Q1", "Q2"]:
                k = f"{subj}_{qtype}"
                if k in d:
                    TEMPLATES[subj][qtype][l] = d[k]

BASE_META = {
    "ko": {"goal": "{title}의 원리를 적용하여 사고력 문제를 해결합니다.", "thinking1": "논리적 추론 및 분석"},
    "en": {"goal": "Apply principles of {title} to solve the reasoning problem.", "thinking1": "Logical reasoning and analysis"},
    "vi": {"goal": "Áp dụng các nguyên lý của {title} để giải quyết bài toán tư duy.", "thinking1": "Suy luận logic và phân tích"},
    "zh-Hans": {"goal": "应用 {title} 的原理解决思维探索问题。", "thinking1": "逻辑推理与分析"},
    "zh-Hant": {"goal": "應用 {title} 的原理以解決思維探索問題。", "thinking1": "邏輯推理與分析"},
    "ja": {"goal": "{title} の原理を適用して思考力探究問題を解決します。", "thinking1": "論理的推論と分析"},
    "gl": {"goal": "Aplica os principios de {title} para resolver o problema de razoamento.", "thinking1": "Razoamento lóxico e análise"},
    "es": {"goal": "Aplica los principios de {title} para resolver el problema de razonamiento.", "thinking1": "Razonamiento lógico y análisis"},
    "fr": {"goal": "Applique les principes de {title} pour résoudre le problème de raisonnement.", "thinking1": "Raisonnement logique et analyse"},
    "de": {"goal": "Wende die Prinzipien von {title} an, um die Denkaufgabe zu lösen.", "thinking1": "Logisches Denken und Analyse"},
    "ru": {"goal": "Примените принципы темы {title} для решения исследовательской задачи.", "thinking1": "Логическое рассуждение и анализ"},
}

MATH_GRADE_MAP = {
    'E1': 'math-e1-u1', 'E2': 'math-e2-u1', 'E3': 'math-e3-u1',
    'E4': 'math-e4-u1', 'E5': 'math-e5-u1', 'E6': 'math-e6-u1',
    'M1': 'math-m1-linear-eq', 'M2': 'math-m2-unit', 'M3': 'math-m3-unit',
    'H1': 'math-h1-unit', 'H2': 'math-h2-unit', 'H3': 'math-h3-unit',
}

_OVERLAYS_CACHE = {}

def get_native_overlay(lang, subj):
    cache_key = (lang, subj)
    if cache_key in _OVERLAYS_CACHE:
        return _OVERLAYS_CACHE[cache_key]
    p = ROOT / f"content/learn-overlays/{lang}/{subj}.json"
    if p.exists():
        try:
            d = json.load(open(p, "r", encoding="utf-8"))
            _OVERLAYS_CACHE[cache_key] = d.get("units", {})
            return _OVERLAYS_CACHE[cache_key]
        except Exception:
            pass
    _OVERLAYS_CACHE[cache_key] = {}
    return _OVERLAYS_CACHE[cache_key]

def get_trans(subj, qtype, lang, grade, title):
    sub_tmpl = TEMPLATES[subj][qtype]
    if lang in sub_tmpl:
        t = sub_tmpl[lang]
    elif lang in ["pt", "it", "ca"] and "es" in sub_tmpl:
        t = sub_tmpl["es"]
    else:
        t = sub_tmpl["en"]
        
    prompt = t["prompt"].replace("{grade}", grade).replace("{title}", title)
    explain = t["explain"]
    hints = t["hints"]
    options = t["options"]
    return prompt, explain, hints, options

def get_title(subj, grade, lang):
    if lang == "ko":
        return TITLES[subj].get(grade, {}).get("ko", "")
    
    # Check overlays first
    units = get_native_overlay(lang, subj)
    if subj == "physics":
        uk = f"phy-u-{grade.lower()}"
        if uk in units and units[uk]:
            return units[uk]
    elif subj == "chemistry":
        uk = f"chm-u-{grade.lower()}"
        if uk in units and units[uk]:
            return units[uk]
    elif subj == "math":
        uk = MATH_GRADE_MAP.get(grade, f"math-{grade.lower()}-u1")
        if uk in units and units[uk]:
            return units[uk]
            
    # Check TITLES
    sub_titles = TITLES[subj].get(grade, {})
    if lang in sub_titles and sub_titles[lang]:
        return sub_titles[lang]
        
    # Romance fallback
    if lang in ["pt", "it", "ca"]:
        return sub_titles.get("es", sub_titles.get("en", ""))
        
    return sub_titles.get("en", "")
"""

target = """def get_trans(subj, qtype, lang, grade, title):
    sub_tmpl = TEMPLATES[subj][qtype]
    # Check if direct translation exists for lang
    if lang in sub_tmpl:
        t = sub_tmpl[lang]
    elif lang in ["pt", "it", "ca"]:
        t = sub_tmpl["es"]
    else:
        t = sub_tmpl["en"]
        
    prompt = t["prompt"].replace("{grade}", grade).replace("{title}", title)
    explain = t["explain"]
    hints = t["hints"]
    options = t["options"]
    return prompt, explain, hints, options

def get_title(subj, grade, lang):
    sub_titles = TITLES[subj].get(grade, {})
    if lang in sub_titles:
        return sub_titles[lang]
    if lang in ["pt", "it", "ca"]:
        return sub_titles.get("es", sub_titles.get("en", ""))
    return sub_titles.get("en", sub_titles.get("ko", ""))"""

code = code.replace(target, replacement)

# Replace entry generation for goal and thinking.1
old_entry = """                    entry = {
                        "title": loc_title,
                        "topic": loc_title,
                        "goal": f"Apply principles of {loc_title} to solve the reasoning problem." if lang == "en" else f"{loc_title}의 원리를 적용하여 사고력 문제를 해결합니다." if lang == "ko" else f"{loc_title}",
                        "material": loc_prompt,
                        "thinking.0": f"{loc_title}",
                        "thinking.1": "Logical reasoning and analysis\","""

new_entry = """                    goal_txt = f"{loc_title}"
                    th1_txt = "Logical reasoning and analysis"
                    if lang in BASE_META:
                        goal_txt = BASE_META[lang]["goal"].replace("{title}", loc_title)
                        th1_txt = BASE_META[lang]["thinking1"]
                    elif lang in META_EXTRA:
                        goal_txt = META_EXTRA[lang]["goal"].replace("{title}", loc_title)
                        th1_txt = META_EXTRA[lang]["thinking1"]

                    entry = {
                        "title": loc_title,
                        "topic": loc_title,
                        "goal": goal_txt,
                        "material": loc_prompt,
                        "thinking.0": f"{loc_title}",
                        "thinking.1": th1_txt,"""

code = code.replace(old_entry, new_entry)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Successfully patched build_all_curriculum_translations.py")
