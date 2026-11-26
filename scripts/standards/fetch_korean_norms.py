import urllib.request
import re
import json

url = "https://korean.go.kr/kornorms/regltn/regltnView.do?regltn_code=0002"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode("utf-8")

hierarchy_titles = {
    "제1부": "표준어 사정 원칙",
    "제1부>제1장": "총칙",
    "제1부>제2장": "발음 변화에 따른 표준어 규정",
    "제1부>제2장>제1절": "자음",
    "제1부>제2장>제2절": "모음",
    "제1부>제2장>제3절": "준말",
    "제1부>제2장>제4절": "단수 표준어",
    "제1부>제2장>제5절": "복수 표준어",
    "제1부>제3장": "어휘 선택의 변화에 따른 표준어 규정",
    "제1부>제3장>제1절": "고어",
    "제1부>제3장>제2절": "사투리",
    "제1부>제3장>제3절": "단수 표준어",
    "제1부>제3장>제4절": "단수 표준어",
    "제1부>제3장>제5절": "복수 표준어",
    "제2부": "표준 발음법",
    "제2부>제1장": "총칙",
    "제2부>제2장": "자음과 모음",
    "제2부>제3장": "음의 길이",
    "제2부>제4장": "받침의 발음",
    "제2부>제5장": "음의 동화",
    "제2부>제6장": "경음화",
    "제2부>제7장": "음의 첨가"
}

chunks = re.split(r"(<input\s+type=[\"\']checkbox[\"\'][^>]+regltn_path=[\"\'][^\'\"]+[\"\'][^>]*>)", html)

articles = []

for i in range(1, len(chunks), 2):
    tag = chunks[i]
    body = chunks[i+1] if i+1 < len(chunks) else ""
    path_m = re.search(r"regltn_path=[\"\']([^\'\"]+)[\"\']", tag)
    path = path_m.group(1) if path_m else ""
    if "항" not in path:
        continue
    
    parts = path.split(">")
    part_str = parts[0] # 제1부 or 제2부
    part_num = 1 if "1부" in part_str else 2
    part_desc = hierarchy_titles.get(part_str, "")
    part_title = f"{part_str} {part_desc}".strip()

    chapter_str = parts[1] if len(parts) > 1 else ""
    chapter_path = f"{part_str}>{chapter_str}"
    chapter_desc = hierarchy_titles.get(chapter_path, "")
    chapter_title = f"{chapter_str} {chapter_desc}".strip()
    
    section_title = ""
    if len(parts) == 4: # part > chapter > section > article
        section_str = parts[2]
        sec_path = f"{part_str}>{chapter_str}>{section_str}"
        sec_desc = hierarchy_titles.get(sec_path, "")
        section_title = f"{section_str} {sec_desc}".strip()

    art_str = parts[-1] # 제X항
    art_num_m = re.search(r"\d+", art_str)
    art_num = int(art_num_m.group(0)) if art_num_m else 0
    art_id = f"p{part_num}-a{art_num}"

    # Extract Rule
    rule_m = re.search(r"<div class=[\"\']black14_word paddingBox[\"\']>(.*?)</div>", body, re.DOTALL)
    rule_text = ""
    if rule_m:
        rule_raw = rule_m.group(1)
        rule_clean = re.sub(r"<[^>]+>", " ", rule_raw)
        rule_clean = re.sub(r"&nbsp;", " ", rule_clean)
        rule_clean = re.sub(r"\s+", " ", rule_clean).strip()
        rule_clean = re.sub(r"^제\s*\d+\s*항\s*", "", rule_clean)
        rule_text = rule_clean

    # Extract subList (sub-rules / provisions / examples)
    sublist_m = re.findall(r"<div class=[\"\']subList_ex[^\'\"]*[\"\']>(.*?)</div>", body, re.DOTALL)
    sub_texts = []
    for s in sublist_m:
        s_clean = re.sub(r"<[^>]+>", " ", s)
        s_clean = re.sub(r"&nbsp;", " ", s_clean)
        s_clean = re.sub(r"\s+", " ", s_clean).strip()
        if s_clean and s_clean != "해설 해설":
            sub_texts.append(s_clean)

    # Extract Commentary
    exp_m = re.search(r"<div[^>]*class=[\"\']explnaArea[^\'\"]*[\"\']>(.*)", body, re.DOTALL)
    commentary_text = ""
    if exp_m:
        exp_clean = re.sub(r"<[^>]+>", " ", exp_m.group(1))
        exp_clean = re.sub(r"&nbsp;", " ", exp_clean)
        exp_clean = re.sub(r"\s+", " ", exp_clean).strip()
        exp_clean = re.sub(r"^(해설\s*)+", "", exp_clean).strip()
        commentary_text = exp_clean

    item = {
        "id": art_id,
        "path": path,
        "partNum": part_num,
        "partTitle": part_title,
        "chapterTitle": chapter_title,
        "sectionTitle": section_title,
        "articleNum": art_num,
        "articleTitle": art_str,
        "rule": rule_text,
        "details": sub_texts,
        "commentary": commentary_text
    }
    articles.append(item)

print(f"Parsed {len(articles)} articles!")
part1_cnt = len([a for a in articles if a["partNum"] == 1])
part2_cnt = len([a for a in articles if a["partNum"] == 2])
print(f"Part 1: {part1_cnt} articles, Part 2: {part2_cnt} articles")

out_path = "life-help/lib/standards/data/korean_norms.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(articles, f, ensure_ascii=False, indent=2)

print(f"Successfully saved to {out_path}!")
