import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('app/admin/page.tsx', 'r', encoding='utf-8') as f:
    admin_code = f.read()

keys_in_page = set(re.findall(r't\(["\'](admin\.[a-zA-Z0-9_\.]+)["\']\)', admin_code))
print(f'Total admin keys found in page: {len(keys_in_page)}')

with open('messages/ko.json', 'r', encoding='utf-8') as f:
    ko_data = json.load(f)

missing = [k for k in sorted(keys_in_page) if k not in ko_data]
print(f'Missing in ko.json ({len(missing)}):')
for m in missing:
    print(' ', m)

