# -*- coding: utf-8 -*-
import json
import re

REGIONS_FILE = r"c:\Users\leetr\Documents\life-project\life-help\lib\region\regions.ts"
WORLD_REGIONS_FILE = r"c:\Users\leetr\Documents\life-project\life-help\lib\region\worldRegions.ts"

with open(REGIONS_FILE, "r", encoding="utf-8") as f:
    reg_code = f.read()

with open(WORLD_REGIONS_FILE, "r", encoding="utf-8") as f:
    world_code = f.read()

# Extract DEFAULT_COUNTRY_REGIONS
def_match = re.search(r"export const DEFAULT_COUNTRY_REGIONS: Record<string, RegionItem> = {([^}]+)};", reg_code, re.DOTALL)
if not def_match:
    print("Could not find DEFAULT_COUNTRY_REGIONS")
    exit(1)

def_block = def_match.group(1)
entries = re.findall(r'(\w+):\s*\{\s*country:\s*"([^"]+)",\s*sido:\s*"([^"]+)",\s*gungu:\s*"([^"]+)",\s*dong:\s*"([^"]+)"\s*\}', def_block)

print(f"Found {len(entries)} DEFAULT_COUNTRY_REGIONS entries.")
for key, country, sido, gungu, dong in entries:
    if country in ["KR", "VN", "CN", "TW", "JP", "PH", "ID"]:
        continue
    # Check if sido is in worldRegions
    # Look for country in world_code
    c_match = re.search(rf'{country}:\s*\[(.*?)\]\s*,?\s*(?:\n\s*[A-Z]{{2}}:|\s*}};)', world_code, re.DOTALL)
    if not c_match:
        print(f"Missing country in worldRegions: {country}")
        continue
    c_body = c_match.group(1)
    if f'name: "{sido}"' not in c_body:
        # Find the first sido in that country
        first_sido_match = re.search(r'name:\s*"([^"]+)"', c_body)
        first_sido = first_sido_match.group(1) if first_sido_match else "None"
        print(f"[{country}] Sido mismatch: '{sido}' not in worldRegions. (First Sido in worldRegions: '{first_sido}')")


