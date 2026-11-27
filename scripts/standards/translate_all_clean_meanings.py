import json
import re

file_path = "public/standards/word_meanings.json"
with open(file_path, "r", encoding="utf-8") as f:
    wm = json.load(f)

# Translation dictionary for Korean dictionary glosses
# Extract raw Korean gloss without any meta prefix
GLOSS_PATTERNS = [
    # General words & specific nouns
    ("개다리-소반", {
        "ko": "상다리 모양이 개의 다리처럼 휜 막치 소반",
        "vi": "mâm cơm thấp nhỏ có chân uốn cong giống như chân chó",
        "en": "small low portable dining table with curved dog-leg shaped legs",
        "ja": "犬の脚のように曲がった脚を持つ小膳（犬脚小膳）",
        "zh-Hans": "腿部弯曲如狗腿般的小饭桌（狗腿小盘）",
        "zh-Hant": "腿部彎曲如狗腿般的小飯桌（狗腿小盤）"
    }),
    ("휴지", {
        "ko": "하던 것을 멈추고 쉼",
        "vi": "tạm dừng công việc đang làm để nghỉ ngơi",
        "en": "pause, intermission, temporary cessation of work",
        "ja": "していたことを一時中止して休むこと（休止）",
        "zh-Hans": "中止进行中的事情并休息（休止）",
        "zh-Hant": "中止進行中的事情並休息（休止）"
    }),
    ("수-은행나무", {
        "ko": "수꽃만 피고 열매는 맺지 못하는 은행나무",
        "vi": "cây bạch quả chỉ nở hoa đực và không kết quả",
        "en": "male ginkgo tree that produces only pollen flowers and no fruit",
        "ja": "雄花のみが咲き実を結ばない雄のイチョウ",
        "zh-Hans": "只开雄花不结果的雄性银杏树",
        "zh-Hant": "只開雄花不結果的雄性銀杏樹"
    }),
    ("수-캉아지", {
        "ko": "강아지의 수컷",
        "vi": "chó con giống đực",
        "en": "male puppy",
        "ja": "雄の子犬",
        "zh-Hans": "公小狗",
        "zh-Hant": "公小狗"
    }),
    ("수-키와", {
        "ko": "두 암키와 사이를 엎어 잇는 기와",
        "vi": "ngói đực (ngói úp giữa hai viên ngói cái)",
        "en": "convex round ridge tile covering the joint between two concave tiles",
        "ja": "平瓦と平瓦の継ぎ目に伏せて葺く丸瓦（男瓦）",
        "zh-Hans": "筒瓦，扣在两块板瓦之间的公瓦",
        "zh-Hant": "筒瓦，扣在兩塊板瓦之間的公瓦"
    }),
    ("수-톨쩌귀", {
        "ko": "문짝에 박아서 문설주 암톨쩌귀에 꽂는 뾰족한 촉 달린 돌쩌귀",
        "vi": "bản lề cối đực (phần có chốt cắm vào cối cái)",
        "en": "male pintle hinge with a pin inserted into the female gudgeon",
        "ja": "戸枠の牝蝶番に差し込む軸が付いた雄蝶番",
        "zh-Hans": "合页的公榫部分（插在母合页上的门轴）",
        "zh-Hant": "合頁的公榫部分（插在母合頁上的門軸）"
    }),
    ("-둥이", {
        "ko": "그러한 성질이 있거나 그와 긴밀한 관련이 있는 사람을 나타내는 접미사",
        "vi": "người có đặc điểm hoặc gắn liền với tính chất đó",
        "en": "person characterized by or associated with that attribute",
        "ja": "そのような性質や関連を持つ人を表す接尾語",
        "zh-Hans": "指具有该特征或与之密切相关的人",
        "zh-Hant": "指具有該特徵或與之密切相關的人"
    }),
    ("발가-숭이", {
        "ko": "옷을 모두 벗은 알몸뚱이",
        "vi": "người trần như nhộng, cởi truồng hoàn toàn",
        "en": "naked body, naked child without clothes",
        "ja": "丸裸の人、素っ裸",
        "zh-Hans": "光屁股的人，赤身裸体者",
        "zh-Hant": "光屁股的人，赤身裸體者"
    }),
    ("보퉁이", {
        "ko": "물건을 보에 싸서 꾸려 놓은 것",
        "vi": "bọc đồ, gói hành lý bọc bằng vải bọc",
        "en": "cloth bundle, package wrapped in wrapping cloth (bojagi)",
        "ja": "風呂敷に包んだ荷物・包み",
        "zh-Hans": "布包袱，包裹",
        "zh-Hant": "布包袱，包裹"
    }),
    ("봉죽", {
        "ko": "일을 꾸려 나가는 사람을 곁에서 거들어 도와줌",
        "vi": "việc đứng bên cạnh đỡ đần, phụ giúp người lo toan công việc",
        "en": "assisting or supporting the person managing the affairs",
        "ja": "仕事を切り盛りする人を傍らで手助けすること",
        "zh-Hans": "在旁照料、帮衬操办事务的人",
        "zh-Hant": "在旁照料、幫襯操辦事務的人"
    }),
    ("뻗정-다리", {
        "ko": "오그라지지 아니하고 꼿꼿하게 뻗친 다리",
        "vi": "chân bị đơ cứng không co lại được",
        "en": "stiff leg that does not bend",
        "ja": "曲がらずにピンと張った硬直した脚",
        "zh-Hans": "直挺无法弯曲的腿",
        "zh-Hant": "直挺無法彎曲的腿"
    }),
    ("주추", {
        "ko": "기둥 밑에 괴는 돌",
        "vi": "đá kê chân cột nhà",
        "en": "foundation stone placed beneath a wooden pillar",
        "ja": "柱の下に据える礎石（礎・いしずえ）",
        "zh-Hans": "柱础，垫在柱底的石础",
        "zh-Hant": "柱礎，墊在柱底的石礎"
    }),
    ("동댕이-치다", {
        "ko": "메어쳐서 땅에 곤두박히게 하다",
        "vi": "ném mạnh/quật mạnh xuống đất",
        "en": "throw or slam down violently onto the ground",
        "ja": "地面に叩きつける、投げ落とす",
        "zh-Hans": "狠摔在地上，掷落",
        "zh-Hant": "狠摔在地上，擲落"
    })
]

for w, defs in GLOSS_PATTERNS:
    wm[w] = defs

# Function to strictly remove all prefix boilerplate like:
# "nghĩa từ vựng '개다리소반':" -> remove! Keep only the actual translated definition!
def strip_all_prefixes(text):
    if not text:
        return text
    # Remove Korean prefix:
    text = re.sub(r"^표준어\s*어휘\s*['‘\"][^'’\"]+['’\"]\s*", "", text)
    # Remove Vietnamese prefix:
    text = re.sub(r"^(?:nghĩa\s*từ\s*vựng|thực\s*vật/cây(?:/loài\s*cỏ)?|hậu\s*tố|tiền\s*tố|đuôi\s*ngữ\s*pháp|hành\s*động/sự\s*việc)\s*['‘\"][^'’\"]+['’\"]\s*:\s*", "", text)
    # Remove English prefix:
    text = re.sub(r"^(?:lexical\s*meaning\s*of|plant/botanical\s*species|suffix|prefix|grammatical\s*ending|action/matter)\s*['‘\"][^'’\"]+['’\"]\s*:\s*", "", text)
    # Remove Japanese prefix:
    text = re.sub(r"^(?:語彙「[^」]+」の定義|植物・樹木「[^」]+」|接尾辞「[^」]+」|接頭辞「[^」]+」|語尾「[^」]+」|行為・事柄「[^」]+」)\s*：\s*", "", text)
    # Remove Chinese prefix:
    text = re.sub(r"^(?:词汇\s*['‘\"][^'’\"]+['’\"]\s*的词义|詞彙\s*['‘\"][^'’\"]+['’\"]\s*的詞義|植物/花木\s*['‘\"][^'’\"]+['’\"]|后缀\s*['‘\"][^'’\"]+['’\"]|後綴\s*['‘\"][^'’\"]+['’\"]|前缀\s*['‘\"][^'’\"]+['’\"]|前綴\s*['‘\"][^'’\"]+['’\"]|词尾\s*['‘\"][^'’\"]+['’\"]|詞尾\s*['‘\"][^'’\"]+['’\"]|行为/事物\s*['‘\"][^'’\"]+['’\"]|行為/事物\s*['‘\"][^'’\"]+['’\"])\s*：\s*", "", text)
    return text.strip()

for k, lang_map in wm.items():
    for lang, txt in lang_map.items():
        lang_map[lang] = strip_all_prefixes(txt)

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(wm, f, ensure_ascii=False, indent=2)

print("Saved cleaned word_meanings.json without any metadata prefix!")
