import json
import re
import urllib.request
import urllib.parse
import concurrent.futures
import time
import os

BASE_DIR = "/Users/juboklee/life-project/life-help"

with open(os.path.join(BASE_DIR, "scripts/standards/raw_commentary_paragraphs.json"), "r", encoding="utf-8") as f:
    data = json.load(f)

# Linguistic terminology post-processing dictionary for high-precision educational accuracy
TERMS = {
    "vi": [
        (r"\bSaishiot\b|\bsaishiot\b|\bSai-siot\b", "sai-siot (chữ 'ㅅ' giữa từ ghép)"),
        (r"\bâm đầu tiên của từ sau\b|\bâm đầu tiên của từ cuối\b", "âm đầu của từ sau"),
        (r"\bâm căng hóa\b|\bkinh âm\b", "âm căng (된소리)"),
        (r"\bâm bật hơi\b|\bkhí âm\b", "âm bật hơi (거센소리)"),
        (r"\bâm thường\b|\bbình âm\b", "âm thường (예사소리)"),
        (r"\bChính tả Hangeul\b", "Quy tắc chính tả Hangeul"),
        (r"\bViện Ngôn ngữ Quốc gia\b", "Viện Ngôn ngữ Quốc gia"),
        (r"\bTừ điển tiếng Hàn chuẩn\b", "Từ điển tiếng Hàn Chuẩn Quốc gia"),
    ],
    "en": [
        (r"\bSaishiot\b|\bsaishiot\b", "sai-siot (intervocalic 'ㅅ')"),
        (r"\blight sound\b|\bplain sound\b", "plain sound (yesasori)"),
        (r"\btensed sound\b|\bhard sound\b|\btension sound\b", "tense sound (doenso-ri)"),
        (r"\baspirated sound\b", "aspirated sound (geosen-sori)"),
        (r"\bHangeul Spelling\b", "Hangeul Orthography"),
        (r"\bStandard Korean Dictionary\b", "Standard Korean Language Dictionary"),
    ],
    "ja": [
        (r"サイシー服|サイシ服", "サイシオッ（間シ服/合成語の'ㅅ'）"),
        (r"裏話の最初の音|最後の単語の最初の音", "後続語の初声"),
        (r"軽音", "濃音（硬音）"),
        (r"ハングルスペル", "ハングル正書法"),
        (r"標準国語大辞典", "『標準国語大辞典』"),
    ],
    "zh-Hans": [
        (r"Saishot|Saishiot|saishiot", "合音‘ㅅ’（间‘ㅅ’/Sai-siot）"),
        (r"最后一个词的第一个音", "后接词的初声"),
        (r"紧张音|紧音", "浓音（紧音）"),
        (r"送气音", "激音（送气音）"),
        (r"韩文拼写法", "《韩文拼写法》"),
        (r"标准韩国语大词典", "《标准国语大词典》"),
    ],
    "zh-Hant": [
        (r"Saishot|Saishiot|saishiot", "合音‘ㅅ’（間‘ㅅ’/Sai-siot）"),
        (r"最後一個詞的第一個音", "後接詞的初聲"),
        (r"緊張音|緊音", "濃音（緊音）"),
        (r"送氣音", "激音（送氣音）"),
        (r"韓文拼寫法", "《韓文拼寫法》"),
        (r"標準韓國語大詞典", "《標準國語大詞典》"),
    ]
}

def clean_translated(text, lang):
    if lang in TERMS:
        for pat, repl in TERMS[lang]:
            text = re.sub(pat, repl, text, flags=re.IGNORECASE)
    return text.strip()

def gtrans(text, tl):
    google_tl = "zh-CN" if tl == "zh-Hans" else ("zh-TW" if tl == "zh-Hant" else tl)
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl={google_tl}&dt=t&q=" + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                translated = "".join([s[0] for s in res[0] if s and s[0]])
                return clean_translated(translated, tl)
        except Exception:
            time.sleep(0.5)
    return text

# Map each paragraph index to translations
# paragraphs_translations: art_id -> list of { "ko": ..., "vi": ..., "en": ..., "ja": ..., "zh-Hans": ..., "zh-Hant": ... }
total_tasks = []
for art_id, item in data.items():
    paras = item["paragraphs"]
    for idx, p in enumerate(paras):
        total_tasks.append((art_id, idx, p))

print(f"Total paragraphs to translate: {len(total_tasks)}")

def process_paragraph(task):
    art_id, idx, p = task
    res = {"ko": p}
    for lang in ["vi", "en", "ja", "zh-Hans", "zh-Hant"]:
        res[lang] = gtrans(p, lang)
    return (art_id, idx, res)

results = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
    future_to_task = {executor.submit(process_paragraph, t): t for t in total_tasks}
    completed = 0
    for future in concurrent.futures.as_completed(future_to_task):
        art_id, idx, res = future.result()
        if art_id not in results:
            results[art_id] = {}
        results[art_id][idx] = res
        completed += 1
        if completed % 25 == 0 or completed == len(total_tasks):
            print(f"Progress: {completed} / {len(total_tasks)} paragraphs translated.")

# Assemble ordered lists
final_structured_commentaries = {}
for art_id, item in data.items():
    paras = item["paragraphs"]
    final_structured_commentaries[art_id] = []
    for idx in range(len(paras)):
        final_structured_commentaries[art_id].append(results[art_id][idx])

output_file = os.path.join(BASE_DIR, "public/standards/commentary_paragraphs.json")
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(final_structured_commentaries, f, ensure_ascii=False, indent=2)

print(f"Successfully saved all paragraph translations to {output_file}!")
