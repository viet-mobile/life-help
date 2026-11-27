import json
import re
import urllib.request
import urllib.parse
import time
import os

BASE_DIR = "/Users/juboklee/life-project/life-help"

with open(os.path.join(BASE_DIR, "scripts/standards/raw_commentary_paragraphs.json"), "r", encoding="utf-8") as f:
    data = json.load(f)

# Linguistic terminology post-processing dictionary for high-precision educational accuracy
TERMS = {
    "vi": [
        (r"\bSaishiot\b|\bsaishiot\b|\bSai-siot\b|âm tiết nối|liên từ", "sai-siot (chữ 'ㅅ' giữa từ ghép)"),
        (r"âm nặng", "âm căng (된소리)"),
        (r"âm hơi", "âm bật hơi (거센소리)"),
        (r"âm bình thường|âm mềm", "âm thường (예사소리)"),
        (r"từ phía sau|từ đằng sau", "âm đầu từ sau"),
        (r"quy tắc chính tả", "Quy tắc chính tả Hangeul"),
    ],
    "en": [
        (r"\bliaison sound\b|\bintervocalic sound\b", "sai-siot (intervocalic 'ㅅ')"),
        (r"\bhard sound\b|\bheavy sound\b", "tense sound (doenso-ri)"),
        (r"\baspirated sound\b", "aspirated sound (geosen-sori)"),
        (r"\bplain sound\b", "plain sound (yesasori)"),
        (r"\bHangeul spelling rules\b", "Hangeul Orthography (제30항)"),
    ],
    "ja": [
        (r"サイシオス|サイシ옷|サイシー服", "サイシオッ（間シ服）"),
        (r"硬音|濁音", "濃音（硬音）"),
        (r"激音", "激音（有気音）"),
        (r"平音", "平音"),
        (r"ハングルスペル", "ハングル正書法"),
    ],
    "zh-Hans": [
        (r"收音连接音|连接词尾音|连接音", "合音‘ㅅ’（间‘ㅅ’/Sai-siot）"),
        (r"浊音|紧张音", "浓音（紧音）"),
        (r"激音|送气音", "激音（送气音）"),
        (r"韩文拼写规范|韩文拼写法", "《韩文拼写法》"),
    ],
    "zh-Hant": [
        (r"連接詞尾「ㅅ」|連接音", "合音‘ㅅ’（間‘ㅅ’/Sai-siot）"),
        (r"濁音|緊張音", "濃音（緊音）"),
        (r"激音|送氣音", "激音（送氣音）"),
        (r"韓文拼寫規範|韓文拼寫法", "《韓文拼寫法》"),
    ]
}

def clean_translated(text, lang):
    if not text:
        return text
    if lang in TERMS:
        for pat, repl in TERMS[lang]:
            text = re.sub(pat, repl, text, flags=re.IGNORECASE)
    return text.strip()

def translate_text(text, tl):
    langpair = f"ko|{tl}"
    url = "https://api.mymemory.translated.net/get?q=" + urllib.parse.quote(text) + f"&langpair={langpair}"
    req = urllib.request.Request(url, headers={"User-Agent": "LIFE.HELP Educational Portal / 1.0 (info@life.help)"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                trans = res.get("responseData", {}).get("translatedText")
                if trans and not trans.startswith("MYMEMORY WARNING"):
                    return clean_translated(trans, tl)
        except Exception:
            time.sleep(0.3)
    return text

# Progress check and cache file
cache_file = os.path.join(BASE_DIR, "public/standards/commentary_paragraphs.json")
cached_data = {}
if os.path.exists(cache_file):
    try:
        with open(cache_file, "r", encoding="utf-8") as f:
            cached_data = json.load(f)
    except Exception:
        cached_data = {}

total_paras = sum(len(item["paragraphs"]) for item in data.values())
print(f"Translating {total_paras} paragraphs across 56 articles with MyMemory API...")

final_structured_commentaries = {}
done_count = 0

for art_id, item in data.items():
    paras = item["paragraphs"]
    art_res = []
    
    # Check if already fully and accurately translated
    cached_art = cached_data.get(art_id, [])
    
    for idx, p in enumerate(paras):
        # If already cached with genuine non-Korean translations
        if idx < len(cached_art):
            c_p = cached_art[idx]
            if c_p.get("vi") and c_p["vi"] != p and c_p.get("en") and c_p["en"] != p:
                art_res.append(c_p)
                done_count += 1
                continue

        p_dict = {"ko": p}
        for lang_code, mymemory_code in [("vi", "vi"), ("en", "en"), ("ja", "ja"), ("zh-Hans", "zh-CN"), ("zh-Hant", "zh-TW")]:
            # If paragraph is very long, chunk it
            if len(p) > 300:
                sub_sentences = [s.strip() for s in re.split(r'(?<=[.?!])\s+', p) if s.strip()]
                sub_trans = []
                for s in sub_sentences:
                    t = translate_text(s, mymemory_code)
                    sub_trans.append(t)
                    time.sleep(0.15)
                p_dict[lang_code] = " ".join(sub_trans)
            else:
                p_dict[lang_code] = translate_text(p, mymemory_code)
                time.sleep(0.15)

        art_res.append(p_dict)
        done_count += 1
        if done_count % 10 == 0 or done_count == total_paras:
            print(f"Translated {done_count} / {total_paras} paragraphs...")
            # Save incrementally
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump({**cached_data, **final_structured_commentaries, art_id: art_res}, f, ensure_ascii=False, indent=2)

    final_structured_commentaries[art_id] = art_res

with open(cache_file, "w", encoding="utf-8") as f:
    json.dump(final_structured_commentaries, f, ensure_ascii=False, indent=2)

print(f"Successfully finished all {total_paras} paragraphs in {cache_file}!")
