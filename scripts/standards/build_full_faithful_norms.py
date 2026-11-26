import json
import os
import re

BASE_DIR = "/Users/juboklee/life-project/life-help"

# Load base norms
with open(os.path.join(BASE_DIR, "lib/standards/data/korean_norms.json"), "r", encoding="utf-8") as f:
    raw_norms = json.load(f)

# Load existing anchor norms
with open(os.path.join(BASE_DIR, "public/standards/korean_norms_anchor.json"), "r", encoding="utf-8") as f:
    anchor_norms = json.load(f)

# Load word meanings and note translations
with open(os.path.join(BASE_DIR, "public/standards/word_meanings.json"), "r", encoding="utf-8") as f:
    word_meanings = json.load(f)

with open(os.path.join(BASE_DIR, "public/standards/note_translations.json"), "r", encoding="utf-8") as f:
    note_translations = json.load(f)

raw_commentaries = {}
for item in raw_norms:
    comm = item.get("commentary", "")
    comm = re.sub(r'[\s\n\r]*(?:연\s*북|북\s*연|연|북)[\s\n\r]*$', '', comm).strip()
    raw_commentaries[item["id"]] = comm

print(f"Loaded {len(raw_commentaries)} cleaned commentaries.")

# Attach meanings and note translations directly into each table of structuredExamples
for art in anchor_norms:
    art_id = art["id"]
    
    # 1. Ensure Korean explanation is the full official commentary
    if art_id in raw_commentaries and raw_commentaries[art_id]:
        art["i18n"]["ko"]["explanation"] = raw_commentaries[art_id]

    # 2. Add meanings and notes to tables
    if "structuredExamples" in art:
        for block in art["structuredExamples"]:
            if block.get("type") == "table":
                block["meanings"] = {}
                block["notesI18n"] = {}
                is_comp = "ㄱ" in block.get("headers", [])
                for row in block.get("rows", []):
                    if len(row) > 0 and row[0].strip():
                        w = row[0].strip()
                        if w in word_meanings:
                            block["meanings"][w] = word_meanings[w]
                    # Check note
                    note_text = ""
                    if is_comp and len(row) > 2 and row[2].strip():
                        note_text = row[2].strip()
                    elif not is_comp and len(row) > 1 and row[1].strip():
                        note_text = row[1].strip()
                    if note_text and note_text in note_translations:
                        block["notesI18n"][note_text] = note_translations[note_text]

print("Structured tables enriched with meanings and notes.")

# Specific fix for Article 13 & Article 12 alignment:
# Article 12: 웃- / 윗-
art12 = next((a for a in anchor_norms if a["id"] == "p1-a12"), None)
if art12:
    art12["i18n"]["vi"]["rule"] = "Thống nhất dùng tiền tố '윗-' theo danh từ '위' (trên), và dùng '웃-' khi không có thế đối lập trên/dưới."
    art12["i18n"]["vi"]["explanation"] = """Điều 12 quy định phân biệt rạch ròi giữa tiền tố '웃-' và '윗-' vốn thường bị nhầm lẫn trong thực tế sử dụng.
1. Về nguyên tắc, khi có sự đối lập rõ ràng về khái niệm giữa '위' (trên) và '아래' (dưới), tiền tố chuẩn được dùng là '윗-' (như 윗목 - góc nhà trên vs 아랫목 - góc nhà dưới; 윗니 - răng trên vs 아랫니 - răng dưới; 윗도리 - áo trên).
2. Trường hợp đặc biệt (Ngoại lệ 1): Trước các phụ âm căng (된소리: ㄲ, ㄸ, ㅃ, ㅆ, ㅉ) hoặc phụ âm bật hơi (거센소리: ㅋ, ㅌ, ㅍ, ㅊ), theo quy tắc chính tả Hangeul Điều 30 về sai-siot, không thêm 받침 'ㅅ' mà chỉ dùng dạng '위-' (như 위쪽, 위층, 위채, 위턱).
3. Trường hợp ngoại lệ 2: Đối với những từ không tồn tại khái niệm đối lập 'dưới' (아래), tiền tố bắt buộc phải viết và đọc là '웃-' (như 웃돈 - tiền trả thêm/tiền thưởng; 웃어른 - bậc trưởng bối; 웃옷 - áo khoác ngoài cùng)."""

    art12["i18n"]["en"]["rule"] = "Unify the prefix as '윗-' based on the noun '위' (above/upper), but use '웃-' when there is no upper/lower conceptual contrast."
    art12["i18n"]["en"]["explanation"] = """Article 12 governs the proper distinction between '웃-' and '윗-', which are frequently confused in daily usage.
1. As a rule, when there is a clear conceptual contrast between 'above' (위) and 'below' (아래), '윗-' is established as the standard prefix (e.g., 윗목 vs 아랫목, 윗니 vs 아랫니, 윗도리).
2. Exception 1: Before tense consonants (ㄲ, ㄸ, ㅃ, ㅆ, ㅉ) or aspirated consonants (ㅋ, ㅌ, ㅍ, ㅊ), sai-siot is omitted in accordance with Article 30 of the Hangeul Orthography, adopting the plain form '위-' (e.g., 위쪽, 위층, 위채, 위턱).
3. Exception 2: For words that do not have an antonymous concept of 'lower' (아래), the standard prefix is strictly '웃-' (e.g., 웃돈 - premium/bonus, 웃어른 - elders/superiors, 웃옷 - outer garment)."""

# Article 13: 한자 '구(句)'의 음을 '구'로 통일
art13 = next((a for a in anchor_norms if a["id"] == "p1-a13"), None)
if art13:
    art13["i18n"]["vi"]["rule"] = "Các từ gốc Hán chứa chữ '句' (Cú) thống nhất đọc và viết là '구' (gu), không công nhận cách đọc '귀' (gwi) ngoại trừ số ít quán ngữ cố định."
    art13["i18n"]["vi"]["explanation"] = """Điều 13 thống nhất âm đọc của chữ Hán '句' (Cú) thành '구' (gu) đối với các từ vốn từng bị nhầm lẫn nhiều giữa '구' và '귀'.
1. Do đó, các từ như '귀절, 대귀, 인용귀, 결귀, 경귀' đều phải chuẩn hóa thành '구절 (câu đoạn/cụm từ), 대구 (phép đối ngẫu), 인용구 (câu trích dẫn), 결구 (kết câu), 경구 (danh ngôn/cảnh ngữ)'.
2. Tuy nhiên, quy định thừa nhận hai ngoại lệ bắt buộc:
   - Khi chỉ một câu văn hoặc đoạn văn quen thuộc thì giữ nguyên dạng '글귀' (câu chữ, ý văn).
   - Trong thể loại thơ chữ Hán (Hán thi), khi chỉ bài thơ được cấu tạo mỗi cụm hai nhịp thì giữ nguyên dạng '귀글'."""

    art13["i18n"]["en"]["rule"] = "Words composed with the Chinese character '句' (phrase/verse) are uniformly pronounced and written as '구' (gu) rather than '귀' (gwi), with specific traditional exceptions."
    art13["i18n"]["en"]["explanation"] = """Article 13 unifies the Sino-Korean pronunciation of '句' as '구' (gu) in words where pronunciation was historically divided between '구' and '귀'.
1. Accordingly, forms such as '귀절, 대귀, 인용귀, 결귀, 경귀' must all be written and pronounced as '구절' (passage/phrase), '대구' (antithesis/parallelism), '인용구' (quotation), '결구' (conclusion), and '경구' (aphorism).
2. However, two historical idioms are preserved as exceptions:
   - '글귀' (a written phrase/passage).
   - '귀글' (a traditional classical Chinese poem composed of paired couplets)."""

    art13["i18n"]["ja"]["rule"] = "漢字「句」が付いてできた単語は「귀」と読むことを認めず、「구」に統一する。"
    art13["i18n"]["ja"]["explanation"] = """第13項は、従来「구」と「귀」で混同が甚だしかった漢字「句」の音を「구」に統一した規定です。
1. したがって、「귀절, 대귀, 인용귀, 결귀, 경귀」などはすべて「구절（句節・一節）, 대구（対句）, 인용구（引用句）, 결구（結句）, 경구（警句）」と表記・発音しなければなりません。
2. ただし、例外として以下の二語は「귀」の音を認めます：
   - 文章の句や節を指す場合は「글귀（字句・文句）」
   - 漢詩などで二句が一塊となるように作られた詩句を指す場合は「귀글」"""

    art13["i18n"]["zh-Hans"]["rule"] = "带有汉字‘句’构成的词汇，不再认可读作‘귀’，统一读作并规范为‘구’。"
    art13["i18n"]["zh-Hans"]["explanation"] = """第13条将过去在‘구’和‘귀’之间混淆严重的汉字‘句’统一规范为‘구’。
1. 因此，以往写作‘귀절、대귀、인용귀、결귀、경귀’等词，必须一律统一为‘구절（章节/字句）、대구（对偶/对句）、인용구（引文/引用句）、결구（结句）、경구（警句）’。
2. 但是，作为法定特例保留以下两词：
   - 指称文章的字句或短语时称作‘글귀’（字句）。
   - 在汉诗等体裁中指称以两节为一整块写就的诗句时称作‘귀글’。"""

    art13["i18n"]["zh-Hant"]["rule"] = "帶有漢字‘句’構成的詞彙，不再認可讀作‘귀’，統一讀作並規範為‘구’。"
    art13["i18n"]["zh-Hant"]["explanation"] = """第13條將過去在‘구’與‘귀’之間混淆嚴重的漢字‘句’統一規範為‘구’。
1. 因此，以往寫作‘귀절、대귀、인용귀、결귀、경귀’等詞，必須一律統整為‘구절（章節/字句）、대구（對偶/對句）、인용구（引文/引用句）、결구（結句）、경구（警句）’。
2. 但是，作為法定特例保留以下兩詞：
   - 指稱文章的字句或短語時稱作‘글귀’（字句）。
   - 在漢詩等體裁中指稱以兩節為一整塊寫就的詩句時稱作‘귀글’。"""

print("Article 12 and 13 perfectly validated and aligned.")

# Write to both target JSON locations
out_public = os.path.join(BASE_DIR, "public/standards/korean_norms_anchor.json")
out_lib = os.path.join(BASE_DIR, "lib/standards/data/korean_norms_anchor.json")

with open(out_public, "w", encoding="utf-8") as f:
    json.dump(anchor_norms, f, ensure_ascii=False, indent=2)

with open(out_lib, "w", encoding="utf-8") as f:
    json.dump(anchor_norms, f, ensure_ascii=False, indent=2)

print(f"Successfully saved {len(anchor_norms)} articles to {out_public} and {out_lib}")
