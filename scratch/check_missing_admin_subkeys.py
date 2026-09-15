import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('app/admin/page.tsx', 'r', encoding='utf-8') as f:
    admin_code = f.read()

keys_in_page = set(re.findall(r't\(["\'](admin\.[a-zA-Z0-9_\.]+)["\']\)', admin_code))

with open('messages/ko.json', 'r', encoding='utf-8') as f:
    ko = json.load(f)

admin_obj = ko.get('admin', {})

missing = []
for k in sorted(keys_in_page):
    sub = k.split('admin.', 1)[1]
    if sub not in admin_obj:
        missing.append(sub)

print(f"Missing subkeys in ko.admin ({len(missing)} of {len(keys_in_page)}):")
for m in missing:
    print(f"  {m}")

