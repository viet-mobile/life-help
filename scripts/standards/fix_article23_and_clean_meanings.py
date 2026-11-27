import json
import os
import re
import urllib.request
import urllib.parse
import time

BASE_DIR = "/Users/juboklee/life-project/life-help"

# 1. Fix Article 23 rule translation
with open(os.path.join(BASE_DIR, "public/standards/korean_norms_anchor.json"), "r", encoding="utf-8") as f:
    norms = json.load(f)

for art in norms:
    if art["id"] == "p1-a23":
        # Ensure complete KO rule
        art["i18n"]["ko"]["rule"] = "방언이던 단어가 표준어보다 더 널리 쓰이게 된 것은, 그것을 표준어로 삼는다. 이 경우, 원래의 표준어는 그대로 표준어로 남겨 두는 것을 원칙으로 한다.(ㄱ을 표준어로 삼고, ㄴ도 표준어로 남겨 둠.)"
        
        art["i18n"]["vi"]["rule"] = "Từ vốn là phương ngữ nay được dùng phổ biến hơn từ chuẩn ban đầu sẽ được chọn làm từ chuẩn mới. Trong trường hợp này, theo nguyên tắc, từ chuẩn ban đầu vẫn được giữ lại làm từ chuẩn song hành. (ㄱ được chọn làm từ chuẩn mới, và ㄴ cũng được giữ lại làm từ chuẩn.)"
        
        art["i18n"]["en"]["rule"] = "When a word that was originally a regional dialect has become more widely used than the original standard word, it shall be adopted as a standard word. In this case, as a rule, the original standard word is also retained as a standard word. (Adopt ㄱ as standard, and retain ㄴ as standard as well.)"
        
        art["i18n"]["ja"]["rule"] = "方言であった単語が標準語よりも広く使われるようになったものは、それを標準語とする。この場合、本来の標準語はそのまま標準語として残すことを原則とする。（ㄱを標準語とし、ㄴも標準語として残す。）"
        
        art["i18n"]["zh-Hans"]["rule"] = "原属方言的词汇比原标准语使用更为广泛者，将其定为标准语。在此情况下，原则上原标准语仍保留为标准语。（以ㄱ为标准语，同时保留ㄴ为标准语。）"
        
        art["i18n"]["zh-Hant"]["rule"] = "原屬方言之詞彙比原標準語使用更為廣泛者，將其定為標準語。在此情況下，原則上原標準語仍保留為標準語。（以ㄱ為標準語，同時保留ㄴ為標準語。）"

with open(os.path.join(BASE_DIR, "public/standards/korean_norms_anchor.json"), "w", encoding="utf-8") as f:
    json.dump(norms, f, ensure_ascii=False, indent=2)

with open(os.path.join(BASE_DIR, "lib/standards/data/korean_norms_anchor.json"), "w", encoding="utf-8") as f:
    json.dump(norms, f, ensure_ascii=False, indent=2)

print("Article 23 rule translation updated with full text across all anchor languages!")

# 2. Clean word_meanings: remove prefixes like "nghĩa từ vựng '개다리소반':" completely!
with open(os.path.join(BASE_DIR, "public/standards/word_meanings.json"), "r", encoding="utf-8") as f:
    wm = json.load(f)

def clean_meaning_val(val, lang):
    if not val:
        return val
    v = val.strip()
    
    # Remove all meta prefix templates in all languages:
    # Vietnamese prefixes:
    v = re.sub(r"^(?:nghĩa\s*từ\s*vựng|thực\s*vật/cây(?:/loài\s*cỏ)?|hậu\s*tố|tiền\s*tố|đuôi\s*ngữ\s*pháp|hành\s*động/sự\s*việc)\s*['‘\"][^'’\"]+['’\"]\s*:\s*", "", v)
    
    # English prefixes:
    v = re.sub(r"^(?:lexical\s*meaning\s*of|plant/botanical\s*species|suffix|prefix|grammatical\s*ending|action/matter)\s*['‘\"][^'’\"]+['’\"]\s*:\s*", "", v)
    
    # Japanese prefixes:
    v = re.sub(r"^(?:語彙「[^」]+」の定義|植物・樹木「[^」]+」|接尾辞「[^」]+」|接頭辞「[^」]+」|語尾「[^」]+」|行為・事柄「[^」]+」)\s*：\s*", "", v)
    
    # Chinese prefixes:
    v = re.sub(r"^(?:词汇\s*['‘\"][^'’\"]+['’\"]\s*的词义|詞彙\s*['‘\"][^'’\"]+['’\"]\s*的詞義|植物/花木\s*['‘\"][^'’\"]+['’\"]|后缀\s*['‘\"][^'’\"]+['’\"]|後綴\s*['‘\"][^'’\"]+['’\"]|前缀\s*['‘\"][^'’\"]+['’\"]|前綴\s*['‘\"][^'’\"]+['’\"]|词尾\s*['‘\"][^'’\"]+['’\"]|詞尾\s*['‘\"][^'’\"]+['’\"]|行为/事物\s*['‘\"][^'’\"]+['’\"]|行為/事物\s*['‘\"][^'’\"]+['’\"])\s*：\s*", "", v)

    # Korean fallback prefixes:
    v = re.sub(r"^표준어\s*어휘\s*['‘\"][^'’\"]+['’\"]\s*", "", v)

    return v.strip()

cleaned_count = 0
for k, defs in wm.items():
    for lang in ["ko", "vi", "en", "ja", "zh-Hans", "zh-Hant"]:
        if lang in defs:
            orig = defs[lang]
            cleaned = clean_meaning_val(orig, lang)
            if cleaned != orig:
                defs[lang] = cleaned
                cleaned_count += 1

print(f"Cleaned {cleaned_count} prefix templates from word_meanings.json.")

with open(os.path.join(BASE_DIR, "public/standards/word_meanings.json"), "w", encoding="utf-8") as f:
    json.dump(wm, f, ensure_ascii=False, indent=2)

print("Saved clean public/standards/word_meanings.json successfully!")
