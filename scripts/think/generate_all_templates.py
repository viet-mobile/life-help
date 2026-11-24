# -*- coding: utf-8 -*-
"""
Generates:
1. scripts/think/templates_south_asian.py (14 languages)
2. scripts/think/templates_southeast_east_asian.py (11 languages)
3. scripts/think/templates_african_other.py (17 languages)
"""
import json, sys
from pathlib import Path

ROOT = Path('/Users/juboklee/life-project/life-help')

# -------------------------------------------------------------
# Base Builder Function
# -------------------------------------------------------------
def make_lang_entry(m1_p, m1_e, m1_h,
                    m2_p, m2_e, m2_h,
                    p1_p, p1_e, p1_h, p1_opts,
                    p2_p, p2_e, p2_h,
                    c1_p, c1_e, c1_h,
                    c2_p, c2_e, c2_h, c2_opts,
                    thinking1, goal):
    return {
        "math_Q1": {
            "prompt": m1_p,
            "explain": m1_e,
            "hints": m1_h,
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": m2_p,
            "explain": m2_e,
            "hints": m2_h,
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": p1_p,
            "explain": p1_e,
            "hints": p1_h,
            "options": p1_opts
        },
        "physics_Q2": {
            "prompt": p2_p,
            "explain": p2_e,
            "hints": p2_h,
            "options": [
                "$v = 29.4\\text{ m/s},\\ h = 44.1\\text{ m}$",
                "$v = 19.6\\text{ m/s},\\ h = 19.6\\text{ m}$",
                "$v = 29.4\\text{ m/s},\\ h = 88.2\\text{ m}$",
                "$v = 9.8\\text{ m/s},\\ h = 44.1\\text{ m}$"
            ]
        },
        "chemistry_Q1": {
            "prompt": c1_p,
            "explain": c1_e,
            "hints": c1_h,
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": c2_p,
            "explain": c2_e,
            "hints": c2_h,
            "options": c2_opts
        },
        "thinking1": thinking1,
        "goal": goal
    }

print("Base builder ready.")
