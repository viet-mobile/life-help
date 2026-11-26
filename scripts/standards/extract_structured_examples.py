import urllib.request
import re
import json

url = "https://korean.go.kr/kornorms/regltn/regltnView.do?regltn_code=0002"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode("utf-8")

def parse_html_table(table_html):
    caption_m = re.search(r'<caption[^>]*>(.*?)</caption>', table_html, re.DOTALL)
    caption = re.sub(r'<[^>]+>', '', caption_m.group(1)).strip() if caption_m else ''
    
    headers = []
    th_matches = re.findall(r'<th[^>]*>(.*?)</th>', table_html, re.DOTALL)
    for th in th_matches:
        h = re.sub(r'<[^>]+>', ' ', th).strip()
        headers.append(h)
    
    rows = []
    tbody_m = re.search(r'<tbody[^>]*>(.*?)</tbody>', table_html, re.DOTALL)
    content = tbody_m.group(1) if tbody_m else table_html
    tr_matches = re.findall(r'<tr[^>]*>(.*?)</tr>', content, re.DOTALL)
    for tr in tr_matches:
        td_matches = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.DOTALL)
        if not td_matches:
            continue
        row = []
        for td in td_matches:
            val = re.sub(r'<br\s*/?>', '\n', td)
            val = re.sub(r'<[^>]+>', ' ', val)
            val = val.replace('&nbsp;', ' ')
            val = re.sub(r'[ \t]+', ' ', val).strip()
            row.append(val)
        rows.append(row)
    
    return {'type': 'table', 'caption': caption, 'headers': headers, 'rows': rows}

def parse_html_ul(ul_html):
    li_matches = re.findall(r'<li[^>]*>(.*?)</li>', ul_html, re.DOTALL)
    items = []
    for li in li_matches:
        item = re.sub(r'<br\s*/?>', ' ', li)
        item = re.sub(r'<[^>]+>', ' ', item)
        item = item.replace('&nbsp;', ' ')
        item = re.sub(r'\s+', ' ', item).strip()
        if item:
            items.append(item)
    return {'type': 'list', 'items': items}

def parse_sublist_content(sub_html):
    if 'class="explnaArea"' in sub_html or "class='explnaArea'" in sub_html:
        sub_html = re.sub(r'<div[^>]*class=[\"\']explnaArea[^\'\"]*[\"\'].*', '', sub_html, flags=re.DOTALL)
    
    pattern = re.compile(r'(<table[^>]*>.*?</table>|<ul[^>]*>.*?</ul>)', re.DOTALL)
    tokens = pattern.split(sub_html)
    
    blocks = []
    for tok in tokens:
        tok_strip = tok.strip()
        if not tok_strip:
            continue
        if tok_strip.startswith('<table'):
            tbl = parse_html_table(tok_strip)
            if tbl['rows']:
                blocks.append(tbl)
        elif tok_strip.startswith('<ul'):
            ulist = parse_html_ul(tok_strip)
            if ulist['items']:
                blocks.append(ulist)
        else:
            clean = re.sub(r'<[^>]+>', ' ', tok_strip)
            clean = clean.replace('&nbsp;', ' ')
            clean = re.sub(r'\s+', ' ', clean).strip()
            clean = re.sub(r'^(해설\s*)+', '', clean).strip()
            if clean and clean != '해설':
                blocks.append({'type': 'text', 'content': clean})
    return blocks

chunks = re.split(r'(<input\s+type=[\"\']checkbox[\"\'][^>]+regltn_path=[\"\'][^\'\"]+[\"\'][^>]*>)', html)

articles_map = {}

for i in range(1, len(chunks), 2):
    tag = chunks[i]
    body = chunks[i+1] if i+1 < len(chunks) else ''
    path_m = re.search(r'regltn_path=[\"\']([^\'\"]+)[\"\']', tag)
    path = path_m.group(1) if path_m else ''
    if '항' not in path:
        continue

    parts = path.split('>')
    part_num = 1 if '1부' in parts[0] else 2
    art_str = parts[-1]
    art_num_m = re.search(r'\d+', art_str)
    art_num = int(art_num_m.group(0)) if art_num_m else 0
    art_id = f"p{part_num}-a{art_num}"

    sublist_m = re.findall(r'<div class=[\"\']subList_ex[^\'\"]*[\"\']>(.*?)</div>', body, re.DOTALL)
    blocks = []
    for s in sublist_m:
        blks = parse_sublist_content(s)
        blocks.extend(blks)

    articles_map[art_id] = blocks

# Now update korean_norms_anchor.json
anchor_file = "lib/standards/data/korean_norms_anchor.json"
with open(anchor_file, "r", encoding="utf-8") as f:
    norms_data = json.load(f)

table_count = 0
list_count = 0
text_count = 0

for art in norms_data:
    art_id = art["id"]
    blks = articles_map.get(art_id, [])
    art["structuredExamples"] = blks
    for b in blks:
        if b["type"] == "table":
            table_count += 1
        elif b["type"] == "list":
            list_count += 1
        elif b["type"] == "text":
            text_count += 1

with open(anchor_file, "w", encoding="utf-8") as f:
    json.dump(norms_data, f, ensure_ascii=False, indent=2)

print(f"Updated {len(norms_data)} articles with structuredExamples!")
print(f"Extracted {table_count} tables, {list_count} lists, {text_count} text blocks.")
