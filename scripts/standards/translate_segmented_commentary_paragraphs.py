import json
import re
import urllib.request
import urllib.parse
import time
import os
import concurrent.futures

BASE_DIR = "/Users/juboklee/life-project/life-help"
file_path = os.path.join(BASE_DIR, "public/standards/commentary_paragraphs.json")

with open(file_path, "r", encoding="utf-8") as f:
    commentaries = json.load(f)

# Linguistic terminology post-processing for precise translation
TERMS = {
    "vi": [
        (r"\bSaishiot\b|\bsaishiot\b|\bSai-siot\b|âm tiết nối", "sai-siot (chữ 'ㅅ' giữa từ ghép)"),
        (r"\bâm nặng\b", "âm căng (된소리)"),
        (r"\bâm hơi\b", "âm bật hơi (거센소리)"),
        (r"\bâm bình thường\b", "âm thường (예사소리)"),
        (r"\blời nói đằng sau\b|\btừ phía sau\b", "âm đầu từ sau"),
        (r"\bchính tả Hangeul\b", "Quy tắc chính tả Hangeul"),
        (r"\bchuẩn mực ngôn ngữ\b", "quy phạm ngôn ngữ chuẩn"),
    ],
    "en": [
        (r"\bliaison sound\b|\bintervocalic sound\b", "sai-siot (intervocalic 'ㅅ')"),
        (r"\bhard sound\b|\bheavy sound\b", "tense sound (doenso-ri)"),
        (r"\baspirated sound\b", "aspirated sound (geosen-sori)"),
        (r"\bplain sound\b", "plain sound (yesasori)"),
        (r"\bHangeul spelling rules\b", "Hangeul Orthography"),
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

def translate_query(q, tl):
    # Try Google single query with custom agent and client=gtx
    google_tl = "zh-CN" if tl == "zh-Hans" else ("zh-TW" if tl == "zh-Hant" else tl)
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl={google_tl}&dt=t&q=" + urllib.parse.quote(q)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"})
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            res = "".join([s[0] for s in data[0] if s and s[0]])
            return clean_translated(res, tl)
    except Exception:
        pass
    
    # Fallback to MyMemory
    try:
        mm_url = f"https://api.mymemory.translated.net/get?q=" + urllib.parse.quote(q) + f"&langpair=ko|{google_tl}"
        req_mm = urllib.request.Request(mm_url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
        with urllib.request.urlopen(req_mm, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            res = data.get("responseData", {}).get("translatedText")
            if res and not res.startswith("MYMEMORY WARNING"):
                return clean_translated(res, tl)
    except Exception:
        pass

    return q

# Process Article 30 and initial batches
print("Translating Article 30 paragraphs specifically first:")
art30 = commentaries.get("p2-a30", [])
for idx, p in enumerate(art30):
    ko_text = p["ko"]
    for lang in ["vi", "en", "ja", "zh-Hans", "zh-Hant"]:
        if p.get(lang) == ko_text:
            p[lang] = translate_query(ko_text, lang)
            time.sleep(0.3)
    print(f"Art 30 Para {idx} translated: {p['vi'][:60]}...")

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(commentaries, f, ensure_ascii=False, indent=2)

print("Saved Article 30 translations successfully!")
