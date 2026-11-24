# -*- coding: utf-8 -*-
"""
Constructs authentic localized templates for Groups 4, 5, and 6.
Group 4: hi, ne, bn, mr, gu, pa, ta, te, kn, ml, si, as, ur, sd
Group 5: th, my, km, id, ms, tl, ceb, jv, su, tet, yue
Group 6: sw, am, so, om, ha, yo, ig, zu, xh, sn, sg, mg, pcm, el, ka, eu, sq
"""
import os, sys, json

def make_template(t):
    return {
        "math_Q1": {
            "prompt": t["m1_p"],
            "explain": t["m1_e"],
            "hints": t["m1_h"],
            "options": ["$1$", "$2$", "$3$", "$4$"]
        },
        "math_Q2": {
            "prompt": t["m2_p"],
            "explain": t["m2_e"],
            "hints": t["m2_h"],
            "options": ["$14$", "$15$", "$16$", "$17$"]
        },
        "physics_Q1": {
            "prompt": t["p1_p"],
            "explain": t["p1_e"],
            "hints": t["p1_h"],
            "options": t["p1_opts"]
        },
        "physics_Q2": {
            "prompt": t["p2_p"],
            "explain": t["p2_e"],
            "hints": t["p2_h"],
            "options": ["$v = 29.4\\text{ m/s},\\ h = 44.1\\text{ m}$", "$v = 19.6\\text{ m/s},\\ h = 19.6\\text{ m}$", "$v = 29.4\\text{ m/s},\\ h = 88.2\\text{ m}$", "$v = 9.8\\text{ m/s},\\ h = 44.1\\text{ m}$"]
        },
        "chemistry_Q1": {
            "prompt": t["c1_p"],
            "explain": t["c1_e"],
            "hints": t["c1_h"],
            "options": ["$2.45\\text{ L}$", "$4.90\\text{ L}$", "$9.80\\text{ L}$", "$12.25\\text{ L}$"]
        },
        "chemistry_Q2": {
            "prompt": t["c2_p"],
            "explain": t["c2_e"],
            "hints": t["c2_h"],
            "options": t["c2_opts"]
        },
        "thinking1": t["t1"],
        "goal": t["goal"]
    }

print("make_template helper ready")
