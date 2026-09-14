# -*- coding: utf-8 -*-
import json
import re

REGIONS_FILE = r"c:\Users\leetr\Documents\life-project\life-help\lib\region\regions.ts"
WORLD_REGIONS_FILE = r"c:\Users\leetr\Documents\life-project\life-help\lib\region\worldRegions.ts"

with open(REGIONS_FILE, "r", encoding="utf-8") as f:
    reg_code = f.read()

with open(WORLD_REGIONS_FILE, "r", encoding="utf-8") as f:
    world_code = f.read()

# Parse worldRegions
# For each country, extract its first sido, gungu, dong
country_blocks = re.findall(r'(\w+):\s*\[\s*\{(.*?)\}\s*,\s*\{', world_code, re.DOTALL)

first_regions = {}
for c, block in country_blocks:
    sido_m = re.search(r'name:\s*"([^"]+)"', block)
    gungu_m = re.search(r'name:\s*"([^"]+)",\s*dongs:\s*\["([^"]+)"', block)
    if sido_m and gungu_m:
        first_regions[c] = {
            "sido": sido_m.group(1),
            "gungu": gungu_m.group(1),
            "dong": gungu_m.group(2)
        }

print(f"Parsed {len(first_regions)} countries from worldRegions.")

# Now let's construct updated DEFAULT_COUNTRY_REGIONS for regions.ts
# Keep KR, VN, JP, CN, TW, ID, PH as they are, and update the others to match worldRegions exactly!
new_defaults = [
    '  KR: { country: "KR", sido: "전북특별자치도", gungu: "익산시", dong: "신동" },',
    '  VN: { country: "VN", sido: "Thành phố Hồ Chí Minh", gungu: "Quận 1", dong: "Bến Nghé" },',
    '  JP: { country: "JP", sido: "東京都", gungu: "新宿区", dong: "西新宿" },',
    '  CN: { country: "CN", sido: "北京市", gungu: "朝阳区", dong: "三里屯街道" },',
    '  TW: { country: "TW", sido: "臺北市", gungu: "信義區", dong: "西村里" },',
    '  ID: { country: "ID", sido: "DKI Jakarta", gungu: "Jakarta Selatan", dong: "Senayan" },',
    '  PH: { country: "PH", sido: "Metro Manila", gungu: "Makati", dong: "Bel-Air" },',
]

for c, info in first_regions.items():
    new_defaults.append(f'  {c}: {{ country: "{c}", sido: "{info["sido"]}", gungu: "{info["gungu"]}", dong: "{info["dong"]}" }},')

defaults_code = "export const DEFAULT_COUNTRY_REGIONS: Record<string, RegionItem> = {\n" + "\n".join(new_defaults) + "\n};"

# Replace in regions.ts
reg_code_new = re.sub(
    r"export const DEFAULT_COUNTRY_REGIONS: Record<string, RegionItem> = \{.*?\n\};",
    defaults_code,
    reg_code,
    flags=re.DOTALL
)

with open(REGIONS_FILE, "w", encoding="utf-8") as f:
    f.write(reg_code_new)

print("Updated DEFAULT_COUNTRY_REGIONS in regions.ts successfully!")

