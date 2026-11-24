# -*- coding: utf-8 -*-
"""
Scan and fix all LaTeX escapes in scripts/think/*.py
LaTeX commands like \text, \times, \tau, \theta, \frac, \nu, \alpha, \beta, etc.
must be written with double backslashes \\text, \\times, etc., so they do not become
tabs (\t), newlines (\n), formfeeds (\f), etc. in Python string literals!
"""
import glob, os, sys

FILES = glob.glob('scripts/think/templates_*.py') + ['scripts/think/build_all_curriculum_translations.py']

LATEX_COMMANDS = ['text', 'times', 'tau', 'theta', 'frac', 'rho', 'nu', 'mu', 'lambda', 'beta', 'alpha', 'Delta', 'cdot', 'ge', 'le', 'circ']

for p in FILES:
    with open(p, 'r', encoding='utf-8') as f:
        text = f.read()

    changed = False
    for cmd in LATEX_COMMANDS:
        # Look for single backslash + cmd not preceded by another backslash
        # e.g., \text{ but not \\text{
        pos = 0
        while True:
            idx = text.find('\\' + cmd, pos)
            if idx == -1: break
            if idx == 0 or text[idx-1] != '\\':
                text = text[:idx] + '\\\\' + cmd + text[idx+1+len(cmd):]
                changed = True
                pos = idx + 2 + len(cmd)
            else:
                pos = idx + 1 + len(cmd)

    if changed:
        print(f"Fixed LaTeX escapes in {p}")
        with open(p, 'w', encoding='utf-8') as f:
            f.write(text)
    else:
        print(f"Clean: {p}")

print("Scan and fix complete.")
