# -*- coding: utf-8 -*-
"""
Generates:
- scripts/think/templates_south_asian.py
- scripts/think/templates_southeast_east_asian.py
- scripts/think/templates_african_other.py
"""
import json, sys

def make_obj(title_m, title_p, title_c,
             m1_prompt, m1_explain, m1_hints,
             m2_prompt, m2_explain, m2_hints,
             p1_prompt, p1_explain, p1_hints, p1_opt0, p1_opt1, p1_opt2, p1_opt3,
             p2_prompt, p2_explain, p2_hints,
             c1_prompt, c1_explain, c1_hints,
             c2_prompt, c2_explain, c2_hints, c2_opt0, c2_opt1, c2_opt2, c2_opt3,
             thinking1, goal):
    return {
        "math_Q1": {
            "prompt": m1_prompt,
            "explain": m1_explain,
            "hints": m1_hints,
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": m2_prompt,
            "explain": m2_explain,
            "hints": m2_hints,
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": p1_prompt,
            "explain": p1_explain,
            "hints": p1_hints,
            "options": [p1_opt0, p1_opt1, p1_opt2, p1_opt3]
        },
        "physics_Q2": {
            "prompt": p2_prompt,
            "explain": p2_explain,
            "hints": p2_hints,
            "options": [
                "$v = 29.4\\text{ m/s},\\ h = 44.1\\text{ m}$",
                "$v = 19.6\\text{ m/s},\\ h = 19.6\\text{ m}$",
                "$v = 29.4\\text{ m/s},\\ h = 88.2\\text{ m}$",
                "$v = 9.8\\text{ m/s},\\ h = 44.1\\text{ m}$"
            ]
        },
        "chemistry_Q1": {
            "prompt": c1_prompt,
            "explain": c1_explain,
            "hints": c1_hints,
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": c2_prompt,
            "explain": c2_explain,
            "hints": c2_hints,
            "options": [c2_opt0, c2_opt1, c2_opt2, c2_opt3]
        },
        "thinking1": thinking1,
        "goal": goal
    }

print("Generator functions defined.")
