# -*- coding: utf-8 -*-
with open('scripts/think/build_all_curriculum_translations.py', 'r', encoding='utf-8') as f:
    text = f.read()

res = []
pos = 0
while True:
    idx = text.find('\\frac', pos)
    if idx == -1: break
    if idx == 0 or text[idx-1] != '\\':
        res.append(idx)
    pos = idx + 5

print('Unescaped \\frac count:', len(res))
if res:
    out = []
    last = 0
    for idx in res:
        out.append(text[last:idx])
        out.append('\\\\frac')
        last = idx + 5
    out.append(text[last:])
    fixed_text = ''.join(out)
    with open('scripts/think/build_all_curriculum_translations.py', 'w', encoding='utf-8') as f:
        f.write(fixed_text)
    print('Fixed all unescaped \\frac in build_all_curriculum_translations.py!')
