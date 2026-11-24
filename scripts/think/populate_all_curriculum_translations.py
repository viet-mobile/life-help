#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys, json, re
from pathlib import Path

ROOT = Path('/Users/juboklee/life-project/life-help')
EXTRA_DIR = ROOT / 'lib/think/data/extra'
I18N_DIR = ROOT / 'lib/think/i18n'

PHYSICS_FILES = [f'physics-d{i:02d}.json' for i in range(1, 7)]
CHEMISTRY_FILES = [f'chemistry-d{i:02d}.json' for i in range(1, 7)]
MATH_FILES = [f'math-d{i:02d}.json' for i in range(1, 7)]

with open(ROOT / 'messages/registry.ts', 'r', encoding='utf-8') as f:
    text = f.read()
ALL_LOCALES = [l.strip().strip('"').strip("'") for l in re.search(r'export const locales = \[(.*?)\] as const;', text, re.DOTALL).group(1).split(',') if l.strip().strip('"').strip("'")]

sys.path.insert(0, str(ROOT / 'scripts/think'))
import build_all_curriculum_translations as base_b

TITLES = base_b.TITLES
BASE_TEMPLATES = base_b.TEMPLATES

# Load native titles from learn-overlays
def get_native_title(subj, grade, lang):
    sub_titles = TITLES[subj].get(grade, {})
    if lang in sub_titles and sub_titles[lang]:
        return sub_titles[lang]
    overlay_path = ROOT / f'content/learn-overlays/{lang}/{subj}.json'
    if overlay_path.exists():
        try:
            d = json.load(open(overlay_path, 'r', encoding='utf-8'))
            u = d.get('units', {})
            if subj == 'physics':
                k = f'phy-u-{grade.lower()}'
                if u.get(k): return u[k]
            elif subj == 'chemistry':
                k = f'chm-u-{grade.lower()}'
                if u.get(k): return u[k]
            elif subj == 'math':
                k = f'math-{grade.lower()}-u1'
                if u.get(k): return u[k]
        except Exception:
            pass
    if lang in ['pt', 'it', 'ca']:
        return sub_titles.get('es', sub_titles.get('en', ''))
    return sub_titles.get('en', sub_titles.get('ko', ''))

print(f'Populator ready for {len(ALL_LOCALES)} languages.')
