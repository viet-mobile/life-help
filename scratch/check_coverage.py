import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('lib/region/countries.ts', 'r', encoding='utf-8') as f:
    c_content = f.read()
countries = re.findall(r'code:\s*"([A-Z]{2})"', c_content)
print(f'Found countries in countries.ts: {len(countries)}')

with open('lib/region/regions.ts', 'r', encoding='utf-8') as f:
    r_content = f.read()

defaults = re.findall(r'([A-Z]{2}):\s*\{\s*(?:country:\s*"[A-Z]{2}",\s*)?sido:\s*"([^"]+)",\s*gungu:\s*"([^"]+)",\s*dong:\s*"([^"]+)"', r_content)
print(f'Found default country regions: {len(defaults)}')

with open('lib/region/worldRegions.ts', 'r', encoding='utf-8') as f:
    w_content = f.read()

w_keys = re.findall(r'^\s{2}([A-Z]{2}):\s*\[', w_content, re.MULTILINE)
print(f'Found worldRegions country keys: {len(w_keys)}')

dedicated = ['KR', 'VN', 'CN', 'TW', 'JP', 'PH', 'ID']
all_covered = set(dedicated).union(set(w_keys))
missing = set(countries) - all_covered
print(f'Missing from regions: {missing}')

def_keys = set(d[0] for d in defaults)
missing_defaults = set(countries) - def_keys
print(f'Missing from defaults: {missing_defaults}')

print("\n--- Summary of Administrative Divisions by Country ---")
for k in sorted(w_keys):
    pattern = rf'^\s{{2}}{k}:\s*\[(.*?)^\s{{2}}\],'
    match = re.search(pattern, w_content, re.MULTILINE | re.DOTALL)
    if match:
        chunk = match.group(1)
        sidos = re.findall(r'name:\s*"([^"]+)"', chunk)
        print(f"  {k}: {len(sidos)} divisions. Default matches: {any(d[0] == k and d[1] == sidos[0] for d in defaults)}")

