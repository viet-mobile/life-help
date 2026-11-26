import json
import os

with open("life-help/lib/standards/data/korean_norms.json", "r", encoding="utf-8") as f:
    norms = json.load(f)

# Hierarchy translations
HIERARCHY_I18N = {
    "제1부 표준어 사정 원칙": {
        "en": "Part 1: Principles of Standard Korean Determination",
        "vi": "Phần 1: Nguyên tắc thẩm định tiếng Hàn chuẩn",
        "zh-Hant": "第一部 標準語審定原則",
        "zh-Hans": "第一部 标准语审定原则",
        "ja": "第1部 標準語査定原則"
    },
    "제2부 표준 발음법": {
        "en": "Part 2: Standard Pronunciation Rules",
        "vi": "Phần 2: Quy tắc phát âm chuẩn",
        "zh-Hant": "第二部 標準發音法",
        "zh-Hans": "第二部 标准发音法",
        "ja": "第2部 標準発音法"
    },
    "제1장 총칙": {
        "en": "Chapter 1: General Provisions",
        "vi": "Chương 1: Quy tắc chung",
        "zh-Hant": "第一章 總則",
        "zh-Hans": "第一章 总则",
        "ja": "第1章 総則"
    },
    "제2장 발음 변화에 따른 표준어 규정": {
        "en": "Chapter 2: Standard Language Rules Based on Phonetic Changes",
        "vi": "Chương 2: Quy định tiếng Hàn chuẩn theo biến đổi ngữ âm",
        "zh-Hant": "第二章 依語音變化之標準語規定",
        "zh-Hans": "第二章 依语音变化之标准语规定",
        "ja": "第2章 発音変化に伴う標準語規定"
    },
    "제3장 어휘 선택의 변화에 따른 표준어 규정": {
        "en": "Chapter 3: Standard Language Rules Based on Vocabulary Selection Changes",
        "vi": "Chương 3: Quy định tiếng Hàn chuẩn theo biến đổi lựa chọn từ vựng",
        "zh-Hant": "第三章 依詞彙選擇變化之標準語規定",
        "zh-Hans": "第三章 依词汇选择变化之标准语规定",
        "ja": "第3章 語彙選択の変化に伴う標準語規定"
    },
    "제2장 자음과 모음": {
        "en": "Chapter 2: Consonants and Vowels",
        "vi": "Chương 2: Phụ âm và Nguyên âm",
        "zh-Hant": "第二章 子音與母音",
        "zh-Hans": "第二章 辅音与元音",
        "ja": "第2章 子音と母音"
    },
    "제3장 음의 길이": {
        "en": "Chapter 3: Sound Length (Vowel Quantity)",
        "vi": "Chương 3: Độ dài của âm",
        "zh-Hant": "第三章 音長",
        "zh-Hans": "第三章 音长",
        "ja": "第3章 音の長さ"
    },
    "제4장 받침의 발음": {
        "en": "Chapter 4: Pronunciation of Final Consonants (Batchim)",
        "vi": "Chương 4: Phát âm phụ âm cuối (Batchim)",
        "zh-Hant": "第四章 終聲（收音）之發音",
        "zh-Hans": "第四章 终声（收音）之发音",
        "ja": "第4章 パッチム（終声）の発音"
    },
    "제5장 음의 동화": {
        "en": "Chapter 5: Phonological Assimilation",
        "vi": "Chương 5: Đồng hóa âm",
        "zh-Hant": "第五章 音之同化",
        "zh-Hans": "第五章 音之同化",
        "ja": "第5章 音の同化"
    },
    "제6장 경음화": {
        "en": "Chapter 6: Tensification (Glottalization)",
        "vi": "Chương 6: Căng âm hóa (Phát âm âm căng)",
        "zh-Hant": "第六章 硬音化（濃音化）",
        "zh-Hans": "第六章 硬音化（浓音化）",
        "ja": "第6章 濃音化（硬音化）"
    },
    "제7장 음의 첨가": {
        "en": "Chapter 7: Sound Addition (Epenthesis)",
        "vi": "Chương 7: Thêm âm",
        "zh-Hant": "第七章 音之添加",
        "zh-Hans": "第七章 音之添加",
        "ja": "第7章 音の添加"
    },
    "제1절 자음": {
        "en": "Section 1: Consonants",
        "vi": "Mục 1: Phụ âm",
        "zh-Hant": "第一節 子音",
        "zh-Hans": "第一节 辅音",
        "ja": "第1節 子音"
    },
    "제2절 모음": {
        "en": "Section 2: Vowels",
        "vi": "Mục 2: Nguyên âm",
        "zh-Hant": "第二節 母音",
        "zh-Hans": "第二节 元音",
        "ja": "第2節 母音"
    },
    "제3절 준말": {
        "en": "Section 3: Abbreviations (Contracted Forms)",
        "vi": "Mục 3: Từ rút gọn",
        "zh-Hant": "第三節 縮略詞",
        "zh-Hans": "第三节 缩略词",
        "ja": "第3節 略語"
    },
    "제4절 단수 표준어": {
        "en": "Section 4: Singular Standard Forms",
        "vi": "Mục 4: Tiếng chuẩn đơn nhất",
        "zh-Hant": "第四節 單數標準語",
        "zh-Hans": "第四节 单数标准语",
        "ja": "第4節 単数標準語"
    },
    "제5절 복수 표준어": {
        "en": "Section 5: Multiple Standard Forms",
        "vi": "Mục 5: Tiếng chuẩn đa nguyên",
        "zh-Hant": "第五節 複數標準語",
        "zh-Hans": "第五节 复数标准语",
        "ja": "第5節 複数標準語"
    },
    "제1절 고어": {
        "en": "Section 1: Archaic Words",
        "vi": "Mục 1: Từ cổ",
        "zh-Hant": "第一節 古語",
        "zh-Hans": "第一节 古语",
        "ja": "第1節 古語"
    },
    "제2절 사투리": {
        "en": "Section 2: Dialects",
        "vi": "Mục 2: Phương ngữ (Tiếng địa phương)",
        "zh-Hant": "第二節 方言",
        "zh-Hans": "第二节 方言",
        "ja": "第2節 方言"
    },
    "제3절 단수 표준어": {
        "en": "Section 3: Singular Standard Forms",
        "vi": "Mục 3: Tiếng chuẩn đơn nhất",
        "zh-Hant": "第三節 單數標準語",
        "zh-Hans": "第三节 单数标准语",
        "ja": "第3節 単数標準語"
    }
}

# Accurate Translations Dictionary for all 56 Articles
# Each item has rule translation and concise summary explanation in 5 foreign anchor languages
ARTICLES_I18N = {
    # Part 1: Articles 1 ~ 26
    "p1-a1": {
        "en": {
            "rule": "Standard Korean shall, as a rule, be defined as the modern Seoul dialect widely used by educated speakers.",
            "exp": "Establishes the foundational standard of Korean based on modern educated Seoul speech for unified communication."
        },
        "vi": {
            "rule": "Tiếng Hàn chuẩn theo nguyên tắc là tiếng Seoul hiện đại được những người có học thức sử dụng rộng rãi.",
            "exp": "Quy định định nghĩa nền tảng của tiếng Hàn chuẩn dựa trên tiếng Seoul hiện đại của người có học vấn để giao tiếp thống nhất."
        },
        "zh-Hant": {
            "rule": "標準語原則上定為有教養的人普遍使用的現代首爾話。",
            "exp": "確立韓國標準語之根本定義，以現代首爾具教養階層所通用的語言為準則，旨在保障全國高效統一之交流。"
        },
        "zh-Hans": {
            "rule": "标准语原则上定为有教养的人普遍使用的现代首尔话。",
            "exp": "确立韩国标准语的根本定义，以现代首尔具教养阶层通用的语言为准则，旨在保障全国高效统一的交流。"
        },
        "ja": {
            "rule": "標準語は、教養のある人々が広く用いる現代のソウル言葉とすることを原則とする。",
            "exp": "効率的で統一された意思疎通のため、教養層が広く使用する現代ソウル言葉を標準語の基準として定めた基本条項です。"
        }
    },
    "p1-a2": {
        "en": {
            "rule": "Loanwords shall be determined through separate specific regulations.",
            "exp": "Specifies that foreign loanwords are governed by dedicated foreign word orthography rules rather than general standard Korean rules."
        },
        "vi": {
            "rule": "Từ ngoại lai sẽ được thẩm định theo quy định riêng.",
            "exp": "Quy định rằng các từ mượn tiếng nước ngoài được xử lý theo quy tắc chính tả từ ngoại lai riêng biệt."
        },
        "zh-Hant": {
            "rule": "外來語另行審定規定。",
            "exp": "規定隨國際交流湧入之外來語不適用本通則，另由專門的外來語表記法獨立規範。"
        },
        "zh-Hans": {
            "rule": "外来语另行审定规定。",
            "exp": "规定随国际交流涌入的外来语不适用本通则，另由专门的外来语标记法独立规范。"
        },
        "ja": {
            "rule": "外来語は別途査定する。",
            "exp": "国際交流により流入する外来語は本則とは別に、外来語表記法等の独立した規則で定めることを規定しています。"
        }
    },
    "p1-a3": {
        "en": {
            "rule": "The aspirated consonant form shall be adopted as the standard form for words where aspirated sounds have become established.",
            "exp": "Adopts forms with aspirated sounds (e.g., ㅋ, ㅌ, ㅍ, ㅊ) as standard when plain or tense sounds have historically shifted to aspirated sounds in common usage."
        },
        "vi": {
            "rule": "Chọn dạng có âm bật hơi làm từ chuẩn đối với những từ mà âm bật hơi đã trở nên cố định phổ biến.",
            "exp": "Chấp nhận các từ có âm bật hơi làm từ chuẩn khi âm thường hoặc âm căng đã chuyển thành âm bật hơi trong thực tế sử dụng."
        },
        "zh-Hant": {
            "rule": "以下詞彙以帶有送氣音（激音）之形態定為標準語，捨棄平音形態。",
            "exp": "當平音或濃音在言語實踐中自然演變為送氣音並已約定俗成時，確認以送氣音形態為唯一標準語。"
        },
        "zh-Hans": {
            "rule": "以下词汇以带有送气音（激音）之形态定为标准语，舍弃平音形态。",
            "exp": "当平音或浓音在语言实践中自然演变为送气音并已约定俗成时，确认为送气音形态为唯一标准语。"
        },
        "ja": {
            "rule": "激音（有気音）に変化して定着した語は、激音の形態を標準語とする。",
            "exp": "平音や濃音が自然な言語変化により激音として定着した単語について、激音形を標準語として認める条項です。"
        }
    },
    "p1-a4": {
        "en": {
            "rule": "Words that are not pronounced with aspirated sounds in modern usage shall take the non-aspirated form as standard.",
            "exp": "Standardizes the plain sound form when previously aspirated sounds have shifted to plain sounds in actual spoken practice."
        },
        "vi": {
            "rule": "Chọn dạng không có âm bật hơi làm từ chuẩn đối với các từ không phát âm bật hơi trong thực tế.",
            "exp": "Chuẩn hóa dạng âm thường khi âm bật hơi trước đây đã chuyển thành âm thường trong đời sống ngôn ngữ hiện đại."
        },
        "zh-Hant": {
            "rule": "以下詞彙以不發送氣音之形態定為標準語，捨棄送氣音形態。",
            "exp": "與第3項相對應，在實際語言生活中若送氣音已退化為平音並廣泛通用，則以平音形態為標準語。"
        },
        "zh-Hans": {
            "rule": "以下词汇以不发送气音之形态定为标准语，舍弃送气音形态。",
            "exp": "与第3项相对应，在实际语言生活中若送气音已退化为平音并广泛通用，则以平音形态为标准语。"
        },
        "ja": {
            "rule": "激音で発音されない形態が定着した語は、激音ではない平音形態を標準語とする。",
            "exp": "第3項とは逆に、かつて激音だったものが現代の実際の使用で平音として定着した語を標準語とする規定です。"
        }
    },
    "p1-a5": {
        "en": {
            "rule": "Words that have deviated from their etymological origin and become firmly established in modern usage shall be taken as standard.",
            "exp": "Recognizes language reality by standardizing common altered forms over historically literal etymological forms."
        },
        "vi": {
            "rule": "Các từ đã xa rời nguồn gốc từ nguyên nhưng được sử dụng phổ biến và cố định sẽ được chọn làm từ chuẩn.",
            "exp": "Tôn trọng thực tế sử dụng ngôn ngữ khi công nhận các dạng biến âm đã phổ biến thay vì gượng ép giữ dạng từ nguyên cổ."
        },
        "zh-Hant": {
            "rule": "已遠離詞源形態並約定俗成、廣泛使用之詞彙，以該約定形態定為標準語。",
            "exp": "尊重語言實踐發展，即使在學術上可考證詞源，若大眾已普遍接受變異後之形態，則以通行形態為標準語。"
        },
        "zh-Hans": {
            "rule": "已远离词源形态并约定俗成、广泛使用之词汇，以该约定形态定为标准语。",
            "exp": "尊重语言实践发展，即使在学术上可考证词源，若大众已普遍接受变异后的形态，则以通行形态为标准语。"
        },
        "ja": {
            "rule": "語源から離れた形で定着し広く用いられている語は、その定着した形を標準語とする。",
            "exp": "語源が学術的に分かっていても、人々の意識が薄れて変化した形が定着している場合は、その現代形を標準語と定めます。"
        }
    },
    "p1-a6": {
        "en": {
            "rule": "For words that do not carry semantic differences, only a single established form shall be recognized as standard.",
            "exp": "Prevents lexical confusion by unifying duplicate variant forms that have identical meanings into a single standard word."
        },
        "vi": {
            "rule": "Các từ không có sự phân biệt về ý nghĩa sẽ chỉ chọn duy nhất một dạng làm từ chuẩn.",
            "exp": "Tránh gây bối rối bằng cách thống nhất các biến thể từ vựng có cùng ý nghĩa thành một dạng chuẩn duy nhất."
        },
        "zh-Hant": {
            "rule": "以下意義無差別之多種形態詞彙，僅取一種形態定為標準語。",
            "exp": "為避免語言使用上的混亂，對於同義而僅有細微語音差歧之重複詞彙，統一定為單一標準形態。"
        },
        "zh-Hans": {
            "rule": "以下意义无差别之多种形态词汇，仅取一种形态定为标准语。",
            "exp": "为避免语言使用上的混乱，对于同义而仅有细微语音差歧之重复词汇，统一定为单一标准形态。"
        },
        "ja": {
            "rule": "意味の区別がない類語は、単一の形態のみを標準語として定める。",
            "exp": "意味上の差異がない複数の形態が存在する場合、言語の混乱を防ぐために単一の形態を標準語として統合します。"
        }
    },
    "p1-a7": {
        "en": {
            "rule": "The prefix denoting male animals shall be unified as '수-' (su-), discarding irregular variants.",
            "exp": "Unifies the male gender prefix to '수-' across animal vocabulary, setting systematic rules for rare exceptions."
        },
        "vi": {
            "rule": "Tiền tố chỉ giống đực của động vật được thống nhất là '수-' (su-).",
            "exp": "Thống nhất tiền tố giống đực cho động vật thành '수-', hạn chế các biến thể bất quy tắc gây nhầm lẫn."
        },
        "zh-Hant": {
            "rule": "表示雄性動物之前綴統一定為「수-」（雄性），捨棄非規範形態。",
            "exp": "統一規範動物雄性前綴為「수-」，並對特定少數語音條件下的例外規則予以明確界定。"
        },
        "zh-Hans": {
            "rule": "表示雄性动物之前缀统一定为「수-」（雄性），舍弃非规范形态。",
            "exp": "统一规范动物雄性前缀为「수-」，并对特定少数语音条件下的例外规则予以明确界定。"
        },
        "ja": {
            "rule": "動物の雄を表す接頭辞は「수-」に統一する。",
            "exp": "雄の動物を表す接頭辞を原則として「수-」に統一し、不規則な表現を整理・標準化した規定です。"
        }
    },
    "p1-a8": {
        "en": {
            "rule": "Words where bright (positive) vowels have historically shifted to dark (negative) vowels and solidified shall adopt the dark vowel form as standard.",
            "exp": "Reflects the historical breakdown of vowel harmony by adopting established dark vowel forms (e.g., ㅏ/ㅗ -> ㅓ/ㅜ)."
        },
        "vi": {
            "rule": "Các từ có nguyên âm dương đã chuyển biến thành nguyên âm âm tính và cố định sẽ lấy dạng nguyên âm âm tính làm chuẩn.",
            "exp": "Phản ánh hiện thực biến đổi hài hòa nguyên âm khi công nhận dạng nguyên âm âm tính đã phổ cập trong đời sống."
        },
        "zh-Hant": {
            "rule": "陽性母音演變為陰性母音並已約定俗成之詞彙，以陰性母音形態定為標準語。",
            "exp": "反映現代韓語母音和諧規律的歷史變遷，對於陽性母音轉變為陰性母音並已固化的詞彙，確認陰性母音為標準語。"
        },
        "zh-Hans": {
            "rule": "阳性母音演变为阴性母音并已约定俗成之词汇，以阴性母音形态定为标准语。",
            "exp": "反映现代韩语母音和谐规律的历史变迁，对于阳性母音转变为阴性母音并已固化的词汇，确认阴性母音为标准语。"
        },
        "ja": {
            "rule": "陽性母音から陰性母音へと変化して定着した語は、陰性母音の形態を標準語とする。",
            "exp": "母音調和の崩壊という歴史的言語変化を反映し、陰性母音化して定着した現代語の形態を標準語として認めた条項です。"
        }
    },
    "p1-a9": {
        "en": {
            "rule": "Pronunciation caused by 'ㅣ' regressive assimilation (umlaut) is generally not recognized as standard, except for words where it has become permanently fixed.",
            "exp": "Umlauted pronunciation (e.g., 아비 -> 애비) is non-standard in principle, but fully lexicalized exceptions (e.g., 냄비, 멋쟁이) are approved."
        },
        "vi": {
            "rule": "Phát âm do hiện tượng đồng hóa ngược âm 'ㅣ' (Umlaut) về nguyên tắc không được công nhận là tiếng chuẩn, ngoại trừ các từ đã cố định hoàn toàn.",
            "exp": "Về cơ bản không chấp nhận biến âm lùi 'ㅣ' làm chuẩn, nhưng công nhận một số ít từ đã trở thành danh từ cố định trong từ điển."
        },
        "zh-Hant": {
            "rule": "由「ㅣ」逆行動化現象（變音）引起之發音原則上不承認為標準發音，但已徹底固化為獨立詞彙者除外。",
            "exp": "「ㅣ」逆行動化（如아비變為애비）原則上屬於方言或非標準音，但如「냄비（鍋）」等已完全取代原詞之特定詞彙予以例外認可。"
        },
        "zh-Hans": {
            "rule": "由「ㅣ」逆行动化现象（变音）引起之发音原则上不承认为标准发音，但已彻底固化为独立词汇者除外。",
            "exp": "「ㅣ」逆行动化（如아비变为애비）原则上属于方言或非标准音，但如「냄비（锅）」等已完全取代原词之特定词汇予以例外认可。"
        },
        "ja": {
            "rule": "「ㅣ」逆行同化（ウムラウト）による発音は原則として標準発音と認めないが、完全に定着した語は例外として認める。",
            "exp": "逆行同化による発音崩れは原則非標準としますが、「냄비（鍋）」のように原語を完全に駆逐して定着した語のみ例外として標準語とします。"
        }
    },
    "p1-a10": {
        "en": {
            "rule": "Words in which diphthongs have simplified into monophthongs in common usage shall take the simplified monophthong form as standard.",
            "exp": "Standardizes simplified monophthong forms where complex vowel glides have naturally simplified over time."
        },
        "vi": {
            "rule": "Các từ có nguyên âm đôi đã đơn giản hóa thành nguyên âm đơn sẽ lấy dạng nguyên âm đơn giản hóa làm chuẩn.",
            "exp": "Chuẩn hóa các nguyên âm đơn khi các nguyên âm đôi phức tạp đã được phát âm giản lược thành nguyên âm đơn trong thực tế."
        },
        "zh-Hant": {
            "rule": "雙母音（二重母音）在實際語言中已簡化為單母音之詞彙，以簡化後之母音形態定為標準語。",
            "exp": "對於歷史上之複合二重母音已自然簡化為單純母音之通用詞彙，順應言語現實以簡化形態為標準規範。"
        },
        "zh-Hans": {
            "rule": "双母音（二重母音）在实际语言中已简化为单母音之词汇，以简化后之母音形态定为标准语。",
            "exp": "对于历史上之复合二重母音已自然简化为单纯母音之通用词汇，顺应语言现实以简化形态为标准规范。"
        },
        "ja": {
            "rule": "二重母音から単母音へと単純化して定着した語は、単純化された形態を標準語とする。",
            "exp": "複雑な二重母音が日常発音で単母音化し、それが現代語として広く定着した場合に単純化された形を標準語と定めます。"
        }
    },
    "p1-a11": {
        "en": {
            "rule": "Vowel pronunciation shifts shall be recognized, adopting established changed forms as standard.",
            "exp": "Validates specific irregular vowel shifts that have established broad consensus among modern native speakers."
        },
        "vi": {
            "rule": "Công nhận sự biến đổi phát âm nguyên âm, lấy các dạng đã biến đổi và cố định làm từ chuẩn.",
            "exp": "Xác nhận các dạng biến âm nguyên âm cụ thể đã được cộng đồng người bản ngữ sử dụng rộng rãi và đồng thuận."
        },
        "zh-Hant": {
            "rule": "承認母音之發音轉移變化，以語音轉變後約定俗成之形態定為標準語。",
            "exp": "不屬於前述特定音變規則，但在歷史演進中母音已穩固轉移之常用詞彙，確認其現代定型形態為標準語。"
        },
        "zh-Hans": {
            "rule": "承认母音之发音转移变化，以语音转变后约定俗成之形态定为标准语。",
            "exp": "不属于前述特定音变规则，但在历史演进中母音已稳固转移之常用词汇，确认其现代定型形态为标准语。"
        },
        "ja": {
            "rule": "母音の発音変化を認め、変化して定着した形態を標準語とする。",
            "exp": "前述の各条項に該当しない個別の母音変化であっても、現代語として完全に定着している場合は変化形を標準語とします。"
        }
    },
    "p1-a12": {
        "en": {
            "rule": "The prefixes '웃-' and '윗-' shall be differentiated: '윗-' is unified for upper/lower pairs ('위' vs '아래'), while '웃-' is used when no lower counterpart exists.",
            "exp": "Clear semantic distinction: use '윗-' when there is an opposing '아랫-' (e.g., 윗니 vs 아랫니), and '웃-' when no opposition exists (e.g., 웃돈, 웃어른)."
        },
        "vi": {
            "rule": "Phân biệt tiền tố '웃-' và '윗-': dùng '윗-' khi có sự đối lập trên/dưới ('위' và '아래'), và dùng '웃-' khi không có đối lập trên/dưới.",
            "exp": "Quy định phân biệt rõ ràng: dùng '윗-' nếu tồn tại từ đối lập '아랫-' (ví dụ: răng trên - răng dưới), dùng '웃-' nếu không có khái niệm bên dưới."
        },
        "zh-Hant": {
            "rule": "區分前綴「웃-」與「윗-」：凡與「아래（下）」構成上下相對立概念者統一用「윗-」；無上下對立概念者用「웃-」。",
            "exp": "極為重要的語義區分規則：有上下對稱詞（如윗니/아랫니）用「윗-」；無下級對稱詞（如웃돈額外錢、웃어른長輩）則用「웃-」。"
        },
        "zh-Hans": {
            "rule": "区分前缀「웃-」与「윗-」：凡与「아래（下）」构成上下相对立概念者统一定为「윗-」；无上下对立概念者用「웃-」。",
            "exp": "极为重要的语义区分规则：有上下对称词（如윗니/아랫니）用「윗-」；无下级对称词（如웃돈额外钱、웃어른长辈）则用「웃-」。"
        },
        "ja": {
            "rule": "接頭辞「웃-」と「윗-」を区別し、上下の対立が存在する場合は「윗-」に統一し、対立がない場合は「웃-」を用いる。",
            "exp": "「上・下」の対立概念がある場合（윗니/아랫니）は「윗-」を用い、対立概念がない場合（웃돈、웃어른）は「웃-」を用いる重要な弁別規定です。"
        }
    },
    "p1-a13": {
        "en": {
            "rule": "Words formed with the Chinese character '句' (gu) shall be read and written as '구', not recognized as '귀', except for rare lexicalized idioms.",
            "exp": "Standardizes Sino-Korean '句' to its canonical reading '구' (e.g., 어구, 문구), allowing '귀' only in historical set phrases (e.g., 글귀, 귀글)."
        },
        "vi": {
            "rule": "Các từ gốc Hán chứa chữ '句' (Cú) thống nhất đọc là '구' (gu), không công nhận cách đọc '귀' (gwi) ngoại trừ số ít quán ngữ cố định.",
            "exp": "Thống nhất âm Hán-Hàn chuẩn của chữ '句' là '구' (ví dụ: 문구), chỉ giữ lại '귀' trong một vài thành ngữ cổ như 글귀."
        },
        "zh-Hant": {
            "rule": "含有漢字「句」之詞彙統一定讀為「구」，不認可「귀」音，少數約定成俗之成語除外。",
            "exp": "將漢字「句」之韓語音統一定為正音「구」（如문구文句），僅在如「글귀（字句）」等極少數傳統成語中保留古音「귀」。"
        },
        "zh-Hans": {
            "rule": "含有汉字「句」之词汇统一定读为「구」，不认可「귀」音，少数约定成俗之成语除外。",
            "exp": "将汉字「句」之韩语音统一定为正音「구」（如문구文句），仅在如「글귀（字句）」等极少数传统成语中保留古音「귀」。"
        },
        "ja": {
            "rule": "漢字「句」を含む語は「구」と読むことを原則とし、「귀」と読む例外は慣用表現のみに限定する。",
            "exp": "漢字「句」の漢字音を本来の「구」に統一し、「글귀」等のごく限られた慣用表現を除いて「귀」の発音を排除した規定です。"
        }
    },
    "p1-a14": {
        "en": {
            "rule": "When an abbreviated (contracted) form is widely used and the original full form is rarely used, only the abbreviated form shall be the standard.",
            "exp": "Eliminates obsolete full forms when modern everyday communication predominantly uses the shortened form."
        },
        "vi": {
            "rule": "Trường hợp từ rút gọn được sử dụng rộng rãi còn từ gốc ít dùng, chỉ công nhận từ rút gọn làm từ chuẩn.",
            "exp": "Loại bỏ các từ gốc đã lỗi thời khi cộng đồng chủ yếu sử dụng dạng rút gọn trong giao tiếp hàng ngày."
        },
        "zh-Hant": {
            "rule": "當縮略詞已廣泛使用而本詞罕用時，僅以縮略形態定為標準語。",
            "exp": "順應語言經濟原則，當簡化縮略形態在日常生活中已具備壓倒性使用優勢時，廢止罕用之繁複原詞。"
        },
        "zh-Hans": {
            "rule": "当缩略词已广泛使用而本词罕用时，仅以缩略形态定为标准语。",
            "exp": "顺应语言经济原则，当简化缩略形态在日常生活中已具备压倒性使用优势时，废止罕用之繁复原词。"
        },
        "ja": {
            "rule": "略語（短縮形）が広く用いられ本語（原形）があまり使われない場合は、略語のみを標準語とする。",
            "exp": "言語の経済性に基づき、省略形が完全に一般化して原形が使われなくなった場合は省略形のみを標準語として認める条項です。"
        }
    },
    "p1-a15": {
        "en": {
            "rule": "Even if an abbreviated form is in use, if the full form remains widely and predominantly used, the full form shall be the standard.",
            "exp": "Maintains the full formal expression as standard when shortened slang or colloquial forms lack general acceptance."
        },
        "vi": {
            "rule": "Dù từ rút gọn có được dùng, nhưng nếu từ gốc vẫn được sử dụng rộng rãi áp đảo thì vẫn lấy từ gốc làm từ chuẩn.",
            "exp": "Duy trì từ gốc chuẩn mực khi các dạng viết tắt chỉ mang tính khẩu ngữ hoặc chưa đạt độ phổ cập chuẩn tắc."
        },
        "zh-Hant": {
            "rule": "即使存在縮略形態，但本詞仍佔壓倒性廣泛使用地位者，以本詞形態定為標準語。",
            "exp": "維護標準語言之規範性與莊重性，若口語縮略語尚未具備正式代表性，仍堅守通用本詞為標準語。"
        },
        "zh-Hans": {
            "rule": "即使存在缩略形态，但本词仍占压倒性广泛使用地位者，以本词形态定为标准语。",
            "exp": "维护标准语言之规范性与庄重性，若口语缩略语尚未具备正式代表性，仍坚守通用本词为标准语。"
        },
        "ja": {
            "rule": "略語が使われていても、本語（原形）が依然として広く使われている場合は、本語を標準語とする。",
            "exp": "俗語的な短縮形があっても、伝統的で品格ある原形が主流である場合は原形を標準語として維持する規定です。"
        }
    },
    "p1-a16": {
        "en": {
            "rule": "When both the abbreviated form and the full form are widely used and each has distinct communicative utility, both shall be recognized as standard.",
            "exp": "Permits dual standard forms when both shortened and full variants serve valid stylistic and communicative roles."
        },
        "vi": {
            "rule": "Khi cả từ rút gọn và từ gốc đều được sử dụng rộng rãi và có hiệu quả giao tiếp rõ ràng, cả hai đều được công nhận là từ chuẩn.",
            "exp": "Công nhận tiêu chuẩn kép khi cả dạng rút gọn và dạng đầy đủ đều có giá trị biểu đạt riêng biệt trong thực tế."
        },
        "zh-Hant": {
            "rule": "當縮略詞與本詞均廣泛通用且各自具備顯著實用價值時，二者並列承認為複數標準語。",
            "exp": "兼顧語言表現之多樣性與實用價值，當簡略形態與完整形態在修辭與語境中各展所長時，皆列為規範標準語。"
        },
        "zh-Hans": {
            "rule": "当缩略词与本词均广泛通用且各自具备显著实用价值时，二者并列承认为复数标准语。",
            "exp": "兼顾语言表现之多样性与实用价值，当简略形态与完整形态在修辞与语境中各展所长时，皆列为规范标准语。"
        },
        "ja": {
            "rule": "略語と本語が双方とも広く用いられ、双方の有用性が認められるものは、両方を標準語とする。",
            "exp": "短縮形と原形の双方が豊かな表現力を持ち、文脈に応じて双方が定着している場合は、両方を複数標準語として認可します。"
        }
    },
    "p1-a17": {
        "en": {
            "rule": "When multiple phonetically similar forms are in use with identical meaning and one is predominantly used, only that predominant form shall be standard.",
            "exp": "Eliminates minor dialectal and phonetic variations to establish a clean singular standard."
        },
        "vi": {
            "rule": "Khi có nhiều dạng phát âm tương tự nhau cùng nghĩa mà một dạng được dùng áp đảo, chỉ lấy dạng áp đảo đó làm chuẩn duy nhất.",
            "exp": "Loại bỏ các dị bản ngữ âm không cần thiết để thiết lập một tiêu chuẩn chuẩn mực và rõ ràng."
        },
        "zh-Hant": {
            "rule": "發音相似且意義毫無差別之多種形態中，若其中一種佔壓倒性多數使用，則僅以該形態為單數標準語。",
            "exp": "掃除語音相近但無意義區別之冗餘形態，確立壓倒性多數形態為單一標準語，簡化言語規範。"
        },
        "zh-Hans": {
            "rule": "发音相似且意义毫无差别之多种形态中，若其中一种占压倒性多数使用，则仅以该形态为单数标准语。",
            "exp": "扫除语音相近但无意义区别之冗余形态，确立压倒性多数形态为单一标准语，简化语言规范。"
        },
        "ja": {
            "rule": "似た発音の複数形態があり意味に差異がない場合、圧倒的に優勢な一つの形態のみを標準語とする。",
            "exp": "発音が類似したバリエーションのうち、現代の言語生活で圧倒的に広く使われている単一形態のみを標準語として固定します。"
        }
    },
    "p1-a18": {
        "en": {
            "rule": "For specified vocabulary pairs, the primary form (A) is the rule, while the secondary variant (B) is also permitted.",
            "exp": "Provides standard flexibility by setting a primary standard while formally permitting a recognized secondary variant."
        },
        "vi": {
            "rule": "Đối với các cặp từ được quy định, dạng chính (A) là nguyên tắc nhưng dạng phụ (B) cũng được chấp nhận.",
            "exp": "Tạo tính linh hoạt cho ngôn ngữ khi quy định dạng chuẩn ưu tiên đồng thời cho phép sử dụng dạng biến thể phổ biến."
        },
        "zh-Hant": {
            "rule": "指定詞彙以主要形態（甲）為原則，同時亦認可容許次要形態（乙）。",
            "exp": "賦予規範彈性，在確立首選主導標準形態的同時，亦正式容許兼納次要通行形態，擴大包容度。"
        },
        "zh-Hans": {
            "rule": "指定词汇以主要形态（甲）为原则，同时亦认可容许次要形态（乙）。",
            "exp": "赋予规范弹性，在确立首选主导标准形态的同时，亦正式容许兼纳次要通行形态，扩大包容度。"
        },
        "ja": {
            "rule": "特定の語彙群について、第1形態（甲）を原則としつつ、第2形態（乙）の使用も許容する。",
            "exp": "原則となる標準語を定めつつ、国民の言語習慣に配慮して派生形態も公式に許容した柔軟な規定です。"
        }
    },
    "p1-a19": {
        "en": {
            "rule": "When phonetically similar words carry distinct nuances of tone, feeling, or connotation and are widely used, each form shall be recognized as standard.",
            "exp": "Enriches the language by preserving distinct phonetic nuances, vowel coloring, and emotional tones as independent standard words."
        },
        "vi": {
            "rule": "Các từ phát âm tương tự mang sắc thái cảm nhận khác nhau được dùng rộng rãi đều được công nhận là từ chuẩn.",
            "exp": "Làm phong phú vốn từ tiếng Hàn bằng cách duy trì các sắc thái biểu cảm, sắc thái âm thanh tinh tế khác biệt."
        },
        "zh-Hant": {
            "rule": "發音相近但承載細微語感、感情色彩或語境差異之詞彙，均承認為各自獨立之標準語。",
            "exp": "充實韓語表現力，針對母音輕重、子音濃淡所帶來之細微語感差異詞群，皆承認為合法規範標準語。"
        },
        "zh-Hans": {
            "rule": "发音相近但承载细微语感、感情色彩或语境差异之词汇，均承认为各自独立之标准语。",
            "exp": "充实韩语表现力，针对母音轻重、子音浓淡所带来之细微语感差异词群，皆承认为合法规范标准语。"
        },
        "ja": {
            "rule": "発音が類似していても微妙な語感や感情のニュアンスの違いを表す語群は、各々を独立した標準語とする。",
            "exp": "語感やニュアンスの差異を表す豊かな語彙体系を尊重し、各表現の文化的・文学的価値を標準語として認める条項です。"
        }
    },
    "p1-a20": {
        "en": {
            "rule": "Words that have become dead words (archaisms) and fallen out of use shall be treated as archaic words, standardizing currently used active words.",
            "exp": "Formally retires dead vocabulary from standard language dictionaries in favor of living, active modern words."
        },
        "vi": {
            "rule": "Các từ đã trở thành tử ngữ không còn được sử dụng sẽ xếp vào từ cổ, chuẩn hóa các từ hiện đại đang được dùng rộng rãi.",
            "exp": "Loại bỏ các từ cổ không còn sức sống trong giao tiếp hiện đại để tập trung vào hệ thống từ vựng đang sinh động phát triển."
        },
        "zh-Hant": {
            "rule": "已淪為死語、完全不再使用之詞彙列為古語處理，僅以現代廣泛使用之存活詞為標準語。",
            "exp": "明確清理已退出日常歷史舞台之死語古詞，確認現代生命力充沛之替代詞彙為法定標準語。"
        },
        "zh-Hans": {
            "rule": "已沦为死语、完全不再使用之词汇列为古语处理，仅以现代广泛使用之存活词为标准语。",
            "exp": "明确清理已退出日常历史舞台之死语古词，确认现代生命力充沛之替代词汇为法定标准语。"
        },
        "ja": {
            "rule": "死語となり使われなくなった語は古語として扱い、現在広く用いられている語を標準語とする。",
            "exp": "言語の歴史的交代を認め、死語となった表現を標準語から除外して現代の生きた語彙を標準語に指定します。"
        }
    },
    "p1-a21": {
        "en": {
            "rule": "When a native Korean word is widely used and its corresponding Sino-Korean counterpart has fallen out of use, the native word shall be the standard.",
            "exp": "Prioritizes living native Korean words over obsolete, archaic Sino-Korean terminology."
        },
        "vi": {
            "rule": "Khi từ thuần Hàn được dùng rộng rãi và từ gốc Hán tương ứng đã mất công dụng, từ thuần Hàn sẽ là từ chuẩn.",
            "exp": "Ưu tiên tôn vinh từ thuần Hàn sinh động khi các từ gốc Hán tương đương không còn được đại chúng sử dụng."
        },
        "zh-Hant": {
            "rule": "當固有詞被普遍廣泛使用，而其對應之漢字詞已喪失日常功用時，以固有詞為標準語。",
            "exp": "弘揚本土語言活力，當本土固有詞在語言競爭中勝出、漢字詞退化淘汰時，確認固有詞為唯一標準。"
        },
        "zh-Hans": {
            "rule": "当固有词被普遍广泛使用，而其对应之汉字词已丧失日常功用时，以固有词为标准语。",
            "exp": "弘扬本土语言活力，当本土固有词在语言竞争中胜出、汉字词退化淘汰时，确认固有词为唯一标准。"
        },
        "ja": {
            "rule": "固有語が広く用いられ、対応する漢字語が使われなくなった場合は、固有語を標準語とする。",
            "exp": "生きた固有語の優位性を認め、使われなくなった形式的な漢字語を排して固有語を標準語として保護・公認します。"
        }
    },
    "p1-a22": {
        "en": {
            "rule": "When a native Korean word has lost its vitality and its corresponding Sino-Korean counterpart is predominantly used, the Sino-Korean word shall be the standard.",
            "exp": "Objectively reflects linguistic reality by standardizing Sino-Korean words when native equivalents have genuinely become obsolete."
        },
        "vi": {
            "rule": "Khi từ thuần Hàn mất dần sức sống và từ gốc Hán tương ứng được dùng áp đảo, từ gốc Hán sẽ là từ chuẩn.",
            "exp": "Phản ánh khách quan thực tế khi các từ mượn gốc Hán đã thay thế hoàn toàn các từ thuần Hàn cổ xưa."
        },
        "zh-Hant": {
            "rule": "當固有詞已喪失生命力，而對應之漢字詞已普及並廣泛使用時，以漢字詞為標準語。",
            "exp": "實事求是反映語言更替現實，若部分固有詞在歷史上演化衰亡，而漢字詞深植人心，則以漢字詞為法定標準。"
        },
        "zh-Hans": {
            "rule": "当固有词已丧失生命力，而对应之汉字词已普及并广泛使用时，以汉字词为标准语。",
            "exp": "实事求是反映语言更替现实，若部分固有词在历史演化衰亡，而汉字词深植人心，则以汉字词为法定标准。"
        },
        "ja": {
            "rule": "固有語が活力を失い、対応する漢字語が広く用いられるようになった場合は、漢字語を標準語とする。",
            "exp": "固有語であっても実際に使われなくなり漢字語が一般化している現実を客観的に反映し、漢字語側を標準語と定めます。"
        }
    },
    "p1-a23": {
        "en": {
            "rule": "When a regional dialect word has become significantly more prevalent than the original standard word, that dialect word shall be adopted as the new standard.",
            "exp": "Embraces dialect-to-standard evolution, legitimizing regional words that have successfully conquered modern national usage."
        },
        "vi": {
            "rule": "Từ vốn là phương ngữ nay được dùng phổ biến hơn từ chuẩn ban đầu sẽ được chọn làm từ chuẩn mới.",
            "exp": "Ghi nhận sự phát triển tự nhiên của ngôn ngữ khi nâng cấp các từ địa phương đã trở thành ngôn ngữ toàn dân thành từ chuẩn."
        },
        "zh-Hant": {
            "rule": "原屬方言之詞彙在演進中比原標準語更廣泛通用者，收納該方言詞為新標準語。",
            "exp": "體現標準語動態包容之精神，當地方方言詞彙憑藉強大表現力通行全國時，正式扶正並升格為法定標準語。"
        },
        "zh-Hans": {
            "rule": "原属方言之词汇在演进中比原标准语更广泛通用者，收纳该方言词为新标准语。",
            "exp": "体现标准语动态包容之精神，当地方方言词汇凭借强大表现力通行全国时，正式扶正并升格为法定标准语。"
        },
        "ja": {
            "rule": "かつて方言であった語が従来の標準語より広く使われるようになった場合は、その方言の語を標準語とする。",
            "exp": "方言の持つ生命力を評価し、全国的に広く浸透して従来の標準語を凌駕した方言彙を新たに標準語に格上げする規定です。"
        }
    },
    "p1-a24": {
        "en": {
            "rule": "When a dialect word has completely superseded a former standard word to the point that the old standard is no longer used, the former standard is discarded and the dialect word becomes the sole standard.",
            "exp": "Completes the replacement process by retiring obsolete historical standards and crowning prevailing dialect words."
        },
        "vi": {
            "rule": "Khi từ phương ngữ thay thế hoàn toàn từ chuẩn cũ khiến từ chuẩn cũ không còn được dùng, từ phương ngữ sẽ trở thành từ chuẩn duy nhất.",
            "exp": "Chính thức công nhận sự thay thế hoàn toàn của phương ngữ đối với các từ chuẩn cũ đã thoái hóa."
        },
        "zh-Hant": {
            "rule": "方言詞彙普及致使舊標準語完全廢棄不用者，廢止舊標準語，以該方言詞為唯一標準語。",
            "exp": "完成語言更替之法定確認程序，徹底淘汰被時代遺忘之舊標準語，賦予勝出之方言詞唯一法定地位。"
        },
        "zh-Hans": {
            "rule": "方言词汇普及致使旧标准语完全废弃不用者，废止旧标准语，以该方言词为唯一标准语。",
            "exp": "完成语言更替之法定确认程序，彻底淘汰被时代遗忘之旧标准语，赋予胜出之方言词唯一法定地位。"
        },
        "ja": {
            "rule": "方言が定着した結果、従来の標準語が完全に廃れた場合は、従来の標準語を廃して方言由来の語を唯一の標準語とする。",
            "exp": "かつての標準語が完全に使われなくなった世代交代を確定させ、浸透した新語形を単独標準語として公認します。"
        }
    },
    "p1-a25": {
        "en": {
            "rule": "When several synonymous forms exist and one form is overwhelmingly and predominantly used, only that dominant form shall be designated as the standard.",
            "exp": "Consolidates multiple identical synonyms by establishing the overwhelming consensus form as the single official standard."
        },
        "vi": {
            "rule": "Khi có nhiều dạng từ có cùng ý nghĩa mà một dạng được sử dụng áp đảo tuyệt đối, chỉ chọn dạng áp đảo đó làm chuẩn duy nhất.",
            "exp": "Thống nhất các từ đồng nghĩa tuyệt đối về một dạng chuẩn phổ biến nhất nhằm chuẩn hóa từ vựng."
        },
        "zh-Hant": {
            "rule": "同義之多種詞彙形態中，若其中一種佔據壓倒性普及優勢者，僅以該形態為單數標準語。",
            "exp": "整肅繁複同義詞群，確立具備壓倒性國民共識之單一詞形為正統，減少學習與應用負擔。"
        },
        "zh-Hans": {
            "rule": "同义之多种词汇形态中，若其中一种占据压倒性普及优势者，仅以该形态为单数标准语。",
            "exp": "整肃繁复同义词群，确立具备压倒性国民共识之单一词形为正统，减少学习与应用负担。"
        },
        "ja": {
            "rule": "同一の意味を表す複数の形態のうち、圧倒的に優勢なものがある場合は、その優勢な形態のみを標準語とする。",
            "exp": "同義語が乱立している場合、国民の大多数に広く支持されている圧倒的優勢語を唯一の標準語として絞り込みます。"
        }
    },
    "p1-a26": {
        "en": {
            "rule": "When multiple forms expressing the same meaning are widely used and all conform to standard language rules, all such forms shall be recognized as multiple standard forms (co-standards).",
            "exp": "Officially sanctions synonyms as co-standards, enriching literary and stylistic diversity in modern Korean."
        },
        "vi": {
            "rule": "Khi nhiều dạng từ cùng biểu đạt một ý nghĩa đều được sử dụng rộng rãi và phù hợp quy tắc, tất cả các dạng đó đều được công nhận là từ chuẩn đa nguyên (chuẩn kép).",
            "exp": "Tôn trọng sự phong phú của tiếng Hàn bằng cách công nhận nhiều từ đồng nghĩa chuẩn cùng tồn tại song song."
        },
        "zh-Hant": {
            "rule": "表示同一意義之數種詞彙均廣泛流通且合乎標準語規範者，並列承認為複數標準語。",
            "exp": "現代韓語極具代表性之開放規範：不強求一律，當多種同義詞各具生命力且符合語法時，全數列為合法標準語。"
        },
        "zh-Hans": {
            "rule": "表示同一意义之数种词汇均广泛流通且合乎标准语规范者，并列承认为复数标准语。",
            "exp": "现代韩语极具代表性之开放规范：不强求一律，当多种同义词各具生命力且符合语法时，全数列为合法标准语。"
        },
        "ja": {
            "rule": "同一の意味を表す複数の形態がともに広く用いられ規範に合致する場合は、すべてを複数標準語として認める。",
            "exp": "一つの意味に対して国民に愛用されている複数の表現がある場合、それらすべてを複数標準語として対等に公認する豊かな規定です。"
        }
    },

    # Part 2: Articles 1 ~ 30 (Standard Pronunciation Rules)
    "p2-a1": {
        "en": {
            "rule": "Standard pronunciation shall follow the actual spoken pronunciation of Standard Korean, while taking into account the historical tradition and rational systematicity of the Korean language.",
            "exp": "Establishes the fundamental governing principle of Korean pronunciation: balancing real-world usage with linguistic rationality."
        },
        "vi": {
            "rule": "Phát âm chuẩn tuân theo phát âm thực tế của tiếng Hàn chuẩn, đồng thời xem xét tính truyền thống và tính hợp lý của tiếng Hàn.",
            "exp": "Xác lập nguyên tắc cơ bản của phát âm tiếng Hàn: cân bằng giữa thói quen thực tế và tính hợp lý của hệ thống ngữ âm học."
        },
        "zh-Hant": {
            "rule": "標準發音法遵循標準語之實際發音，同時兼顧國語之傳統性與合理性原則制定。",
            "exp": "確立韓國標準發音之最高指導綱領：立足於首爾現代音之言語現實，兼顧語音演變傳統與語音系統內部之理性邏輯。"
        },
        "zh-Hans": {
            "rule": "标准发音法遵循标准语之实际发音，同时兼顾国语之传统性与合理性原则制定。",
            "exp": "确立韩国标准发音之最高指导纲领：立足于首尔现代音之语言现实，兼顾语音演变传统与语音系统内部之理性逻辑。"
        },
        "ja": {
            "rule": "標準発音法は標準語の実際の発音に従うものとし、国語の伝統性と合理性を考慮して定める。",
            "exp": "韓国語発音の根本憲章です。実際の音声現実を尊重しながら、歴史的伝統と音韻体系の合理性を融合して規定しています。"
        }
    },
    "p2-a2": {
        "en": {
            "rule": "The standard consonants shall consist of the following 19 consonants: ㄱ, ㄲ, ㄴ, ㄷ, ㄸ, ㄹ, ㅁ, ㅂ, ㅃ, ㅅ, ㅆ, ㅇ, ㅈ, ㅉ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ.",
            "exp": "Defines the 19 standard consonant phonemes of modern Korean phonology."
        },
        "vi": {
            "rule": "Phụ âm tiếng Hàn chuẩn bao gồm 19 phụ âm: ㄱ, ㄲ, ㄴ, ㄷ, ㄸ, ㄹ, ㅁ, ㅂ, ㅃ, ㅅ, ㅆ, ㅇ, ㅈ, ㅉ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ.",
            "exp": "Xác định danh sách chuẩn mực gồm 19 âm vị phụ âm trong hệ thống ngữ âm tiếng Hàn hiện đại."
        },
        "zh-Hant": {
            "rule": "標準語之子音定為以下19個：ㄱ, ㄲ, ㄴ, ㄷ, ㄸ, ㄹ, ㅁ, ㅂ, ㅃ, ㅅ, ㅆ, ㅇ, ㅈ, ㅉ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ。",
            "exp": "法定確立現代韓語子音音位系統之19個標準子音體系（平音、濃音、激音完整構架）。"
        },
        "zh-Hans": {
            "rule": "标准语之辅音定为以下19个：ㄱ, ㄲ, ㄴ, ㄷ, ㄸ, ㄹ, ㅁ, ㅂ, ㅃ, ㅅ, ㅆ, ㅇ, ㅈ, ㅉ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ。",
            "exp": "法定确立现代韩语辅音音位系统之19个标准辅音体系（平音、浓音、激音完整构架）。"
        },
        "ja": {
            "rule": "標準語の子音は次の19個とする：ㄱ, ㄲ, ㄴ, ㄷ, ㄸ, ㄹ, ㅁ, ㅂ, ㅃ, ㅅ, ㅆ, ㅇ, ㅈ, ㅉ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ。",
            "exp": "現代韓国語の音韻体系における19の標準子音（平音・濃音・激音）を法的に定義した条項です。"
        }
    },
    "p2-a3": {
        "en": {
            "rule": "The standard vowels shall consist of the following 21 vowels: ㅏ, ㅐ, ㅑ, ㅒ, ㅓ, ㅔ, ㅕ, ㅖ, ㅗ, ㅘ, ㅙ, ㅚ, ㅛ, ㅜ, ㅝ, ㅞ, ㅟ, ㅠ, ㅡ, ㅢ, ㅣ.",
            "exp": "Defines the complete inventory of 21 standard vowel letters used in modern Korean orthography."
        },
        "vi": {
            "rule": "Nguyên âm tiếng Hàn chuẩn bao gồm 21 nguyên âm: ㅏ, ㅐ, ㅑ, ㅒ, ㅓ, ㅔ, ㅕ, ㅖ, ㅗ, ㅘ, ㅙ, ㅚ, ㅛ, ㅜ, ㅝ, ㅞ, ㅟ, ㅠ, ㅡ, ㅢ, ㅣ.",
            "exp": "Quy định đầy đủ 21 ký tự nguyên âm chuẩn mực trong hệ thống văn tự tiếng Hàn hiện đại."
        },
        "zh-Hant": {
            "rule": "標準語之母音定為以下21個：ㅏ, ㅐ, ㅑ, ㅒ, ㅓ, ㅔ, ㅕ, ㅖ, ㅗ, ㅘ, ㅙ, ㅚ, ㅛ, ㅜ, ㅝ, ㅞ, ㅟ, ㅠ, ㅡ, ㅢ, ㅣ。",
            "exp": "法規劃定現代韓文字母體系中21個標準母音之完整清單。"
        },
        "zh-Hans": {
            "rule": "标准语之元音定为以下21个：ㅏ, ㅐ, ㅑ, ㅒ, ㅓ, ㅔ, ㅕ, ㅖ, ㅗ, ㅘ, ㅙ, ㅚ, ㅛ, ㅜ, ㅝ, ㅞ, ㅟ, ㅠ, ㅡ, ㅢ, ㅣ。",
            "exp": "法规划定现代韩文字母体系中21个标准元音之完整清单。"
        },
        "ja": {
            "rule": "標準語の母音は次の21個とする：ㅏ, ㅐ, ㅑ, ㅒ, ㅓ, ㅔ, ㅕ, ㅖ, ㅗ, ㅘ, ㅙ, ㅚ, ㅛ, ㅜ, ㅝ, ㅞ, ㅟ, ㅠ, ㅡ, ㅢ, ㅣ。",
            "exp": "現代ハングルで用いられる全21個の標準母音を公式に定めた基本条項です。"
        }
    },
    "p2-a4": {
        "en": {
            "rule": "The vowels 'ㅏ, ㅐ, ㅓ, ㅔ, ㅗ, ㅚ, ㅜ, ㅟ, ㅡ, ㅣ' shall be pronounced as monophthongs. (Note: 'ㅚ' and 'ㅟ' may also be permitted as diphthongs).",
            "exp": "Classifies the 10 monophthongs of Korean, providing realistic leeway to pronounce ㅚ and ㅟ as diphthongs [we] and [wi]."
        },
        "vi": {
            "rule": "Các nguyên âm 'ㅏ, ㅐ, ㅓ, ㅔ, ㅗ, ㅚ, ㅜ, ㅟ, ㅡ, ㅣ' phát âm là nguyên âm đơn. (Cho phép phát âm 'ㅚ' và 'ㅟ' như nguyên âm đôi).",
            "exp": "Quy định 10 nguyên âm đơn, đồng thời cho phép ngoại lệ thực tế phát âm 'ㅚ' và 'ㅟ' như nguyên âm đôi phổ biến."
        },
        "zh-Hant": {
            "rule": "「ㅏ, ㅐ, ㅓ, ㅔ, ㅗ, ㅚ, ㅜ, ㅟ, ㅡ, ㅣ」發音為單母音。（附則：『ㅚ』與『ㅟ』亦容許發音為雙母音）。",
            "exp": "確立韓語10個單母音體系，並對在現代口語中難以維持純單音的「ㅚ([we])」和「ㅟ([wi])」作出雙母音容許規定。"
        },
        "zh-Hans": {
            "rule": "「ㅏ, ㅐ, ㅓ, ㅔ, ㅗ, ㅚ, ㅜ, ㅟ, ㅡ, ㅣ」发音为单元音。（附则：『ㅚ』与『ㅟ』亦容许发音为双母音）。",
            "exp": "确立韩语10个单母音体系，并对在现代口语中难以维持纯单音的「ㅚ([we])」和「ㅟ([wi])」作出双母音容许规定。"
        },
        "ja": {
            "rule": "「ㅏ, ㅐ, ㅓ, ㅔ, ㅗ, ㅚ, ㅜ, ㅟ, ㅡ, ㅣ」は単母音として発音する。（但し、「ㅚ」と「ㅟ」は二重母音としての発音も許容する）。",
            "exp": "韓国語の10単母音を規定し、現代の口語現実を考慮して「ㅚ」と「ㅟ」の二重母音発音も公式に許容した実用規定です。"
        }
    },
    "p2-a5": {
        "en": {
            "rule": "The vowels 'ㅑ, ㅒ, ㅕ, ㅖ, ㅘ, ㅙ, ㅛ, ㅝ, ㅞ, ㅠ, ㅢ' shall be pronounced as diphthongs, with specific detailed rules for 'ㅢ' and 'ㅖ'.",
            "exp": "Governs diphthong pronunciation, noting that 'ㅢ' can be pronounced as [ㅣ] or [ㅔ] depending on whether it carries an initial consonant or serves as a genitive particle."
        },
        "vi": {
            "rule": "Các nguyên âm 'ㅑ, ㅒ, ㅕ, ㅖ, ㅘ, ㅙ, ㅛ, ㅝ, ㅞ, ㅠ, ㅢ' phát âm là nguyên âm đôi, kèm quy tắc cụ thể cho 'ㅢ' và 'ㅖ'.",
            "exp": "Quy định phát âm 11 nguyên âm đôi, đặc biệt hướng dẫn quy tắc biến âm linh hoạt của 'ㅢ' thành [ㅣ] hoặc [ㅔ]."
        },
        "zh-Hant": {
            "rule": "「ㅑ, ㅒ, ㅕ, ㅖ, ㅘ, ㅙ, ㅛ, ㅝ, ㅞ, ㅠ, ㅢ」發音為雙母音，並對『ㅢ』及『ㅖ』等特例發音作出詳盡規定。",
            "exp": "規範11個雙母音之滑音結合，特別對發音極具彈性之「ㅢ」（在首音、字中或屬格助詞時分別讀作[ㅢ]、[ㅣ]或[ㅔ]）作出明確指引。"
        },
        "zh-Hans": {
            "rule": "「ㅑ, ㅒ, ㅕ, ㅖ, ㅘ, ㅙ, ㅛ, ㅝ, ㅞ, ㅠ, ㅢ」发音为双元音，并对『ㅢ』及『ㅖ』等特例发音作出详尽规定。",
            "exp": "规范11个双元音之滑音结合，特别对发音极具弹性的「ㅢ」（在首音、字中或属格助词时分别读作[ㅢ]、[ㅣ]或[ㅔ]）作出明确指引。"
        },
        "ja": {
            "rule": "「ㅑ, ㅒ, ㅕ, ㅖ, ㅘ, ㅙ, ㅛ, ㅝ, ㅞ, ㅠ, ㅢ」は二重母音として発音し、「ㅢ」や「ㅖ」の例外発音を詳細に規定する。",
            "exp": "11個の二重母音を定め、特に子音を伴う「ㅢ」の[ㅣ]発音や、助詞の「의」の[ㅔ]許容など重要な特例を定めた規定です。"
        }
    },
    "p2-a6": {
        "en": {
            "rule": "Vowel length (long vs. short) shall be distinguished in pronunciation, with the rule that long vowels occur only in the first syllable of a word.",
            "exp": "Establishes phonemic vowel quantity in Korean, noting that long vowels shorten when shifted away from the initial syllable through prefixation or compounding."
        },
        "vi": {
            "rule": "Phân biệt phát âm nguyên âm dài và ngắn, theo nguyên tắc âm dài chỉ xuất hiện ở âm tiết đầu tiên của từ.",
            "exp": "Quy định về trường âm và đoản âm: âm dài chỉ xuất hiện ở âm tiết đầu tiên, và trở thành âm ngắn khi chuyển sang vị trí sau."
        },
        "zh-Hant": {
            "rule": "母音發音應區分長音與短音，原則上長音僅出現在單詞之第一音節。",
            "exp": "規範韓語傳統音長辨義體系，規定長音原則上僅能置於首音節，一旦因複合或派生移至第二音節即自然縮短為短音。"
        },
        "zh-Hans": {
            "rule": "元音发音应区分长音与短音，原则上长音仅出现在单词之第一音节。",
            "exp": "规范韩语传统音长辨义体系，规定长音原则上仅能置于首音节，一旦因复合或派生移至第二音节即自然缩短为短音。"
        },
        "ja": {
            "rule": "母音の長短を区別して発音し、長音は単語の第1音節にのみ現れることを原則とする。",
            "exp": "韓国語の長母音・短母音の弁別機能を規定し、複合語化等で第2音節以降に移った長音は短音化する原則を定めています。"
        }
    },
    "p2-a7": {
        "en": {
            "rule": "Even syllables with long vowels shall be pronounced short in designated grammatical conditions, such as verbal conjugation or affixation.",
            "exp": "Outlines systematic shortening conditions where long vowels become short before certain vowel-initial endings."
        },
        "vi": {
            "rule": "Dù âm tiết vốn có âm dài, nhưng trong các trường hợp chia đuôi từ hoặc biến hình cụ thể sẽ phát âm thành âm ngắn.",
            "exp": "Quy định các trường hợp âm dài chuyển hóa thành âm ngắn khi kết hợp với các vĩ tố liên kết cụ thể."
        },
        "zh-Hant": {
            "rule": "即使原本具有長音之音節，在指定之特定語法條件（活用形結合等）下亦應發短音。",
            "exp": "詳列長音縮短之特定音韻環境（如動詞活用形遇母音語尾、被動使動接尾辭結合時之縮短規律）。"
        },
        "zh-Hans": {
            "rule": "即使原本具有长音之音节，在指定之特定语法条件（活用形结合等）下亦应发短音。",
            "exp": "详列长音缩短之特定音韵环境（如动词活用形遇母音语尾、被动使动接尾辞结合时之缩短规律）。"
        },
        "ja": {
            "rule": "長音を持つ音節であっても、特定の活用や語尾結合等の条件下では短く発音する。",
            "exp": "用言の活用形や接尾辞の結合において、本来長音である語幹が短音化する具体的環境を定めた規定です。"
        }
    },
    "p2-a8": {
        "en": {
            "rule": "Only the 7 consonants 'ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ' shall be pronounced in syllable-final (Batchim) position.",
            "exp": "The fundamental 7-consonant coda rule of Korean phonology: all coda consonants neutralize into one of these 7 representative sounds."
        },
        "vi": {
            "rule": "Ở vị trí phụ âm cuối (Batchim), chỉ phát âm 7 phụ âm: 'ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ'.",
            "exp": "Quy tắc 7 phụ âm cuối đại diện kinh điển trong ngữ âm tiếng Hàn: mọi phụ âm cuối đều quy về 7 âm thanh này."
        },
        "zh-Hant": {
            "rule": "收音（終聲）發音時，僅能發出『ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ』等7個代表子音。",
            "exp": "韓語終聲中和化之核心法則：無論拼寫寫作何種複雜子音，在音節末尾實際發音時均嚴格歸併為此7個代表音之一。"
        },
        "zh-Hans": {
            "rule": "收音（终声）发音时，仅能发出『ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ』等7个代表辅音。",
            "exp": "韩语终声中和化之核心法则：无论拼写写作何种复杂子音，在音节末尾实际发音时均严格归并为此7个代表音之一。"
        },
        "ja": {
            "rule": "パッチム（終声）音としては、「ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ」の7子音のみを発音する。",
            "exp": "韓国語音節末の中和（7終声法）を定めた最重要原則です。表記に関わらず実際の発音はこの7つの代表音に収束します。"
        }
    },
    "p2-a9": {
        "en": {
            "rule": "Batchim 'ㄲ, ㅋ', 'ㅅ, ㅆ, ㅈ, ㅊ, ㅌ', and 'ㅍ' are pronounced as [ㄱ], [ㄷ], and [ㅂ] respectively at word ends or before consonants.",
            "exp": "Neutralization of single/double coda consonants into their respective unreleased stop counterparts [k̚], [t̚], [p̚]."
        },
        "vi": {
            "rule": "Các phụ âm cuối 'ㄲ, ㅋ' phát âm là [ㄱ]; 'ㅅ, ㅆ, ㅈ, ㅊ, ㅌ' phát âm là [ㄷ]; 'ㅍ' phát âm là [ㅂ] khi ở cuối từ hoặc trước phụ âm.",
            "exp": "Quy tắc trung hòa phụ âm đơn và phụ âm đôi thành các âm tắc tương ứng [ㄱ, ㄷ, ㅂ]."
        },
        "zh-Hant": {
            "rule": "終聲『ㄲ, ㅋ』在詞尾或子音前發作[ㄱ]；『ㅅ, ㅆ, ㅈ, ㅊ, ㅌ』發作[ㄷ]；『ㅍ』發作[ㅂ]。",
            "exp": "規定單子音及雙子音收音在音節末或子音前中和歸納為三個主要塞音代表音[ㄱ, ㄷ, ㅂ]之具體映射規則。"
        },
        "zh-Hans": {
            "rule": "终声『ㄲ, ㅋ』在词尾或辅音前发作[ㄱ]；『ㅅ, ㅆ, ㅈ, ㅊ, ㅌ』发作[ㄷ]；『ㅍ』发作[ㅂ]。",
            "exp": "规定单辅音及双辅音收音在音节末或辅音前中和归纳为三个主要塞音代表音[ㄱ, ㄷ, ㅂ]之具体映射规则。"
        },
        "ja": {
            "rule": "パッチム「ㄲ, ㅋ」は[ㄱ]、「ㅅ, ㅆ, ㅈ, ㅊ, ㅌ」は[ㄷ]、「ㅍ」は[ㅂ]として語末または子音の前で発音する。",
            "exp": "単子音・二重子音のパッチムが子音の前または語末で、代表音[ㄱ, ㄷ, ㅂ]へと中和（内破音化）する個別対応規則です。"
        }
    },
    "p2-a10": {
        "en": {
            "rule": "Complex double Batchim 'ㄳ', 'ㄵ', 'ㄼ, ㄽ, ㄾ', and 'ㅄ' are pronounced as [ㄱ], [ㄴ], [ㄹ], and [ㅂ] respectively at word ends or before consonants.",
            "exp": "First consonant retention rule for complex coda clusters (with the famous exception that 'ㄼ' in '밟다' and '넓죽하다' is pronounced [ㅂ])."
        },
        "vi": {
            "rule": "Phụ âm ghép 'ㄳ', 'ㄵ', 'ㄼ, ㄽ, ㄾ', 'ㅄ' lần lượt phát âm là [ㄱ], [ㄴ], [ㄹ], [ㅂ] khi ở cuối từ hoặc trước phụ âm.",
            "exp": "Quy tắc giữ lại âm phụ âm đứng trước đối với nhóm phụ âm ghép, ngoại lệ 'ㄼ' trong '밟다' phát âm là [ㅂ]."
        },
        "zh-Hant": {
            "rule": "複合收音『ㄳ』, 『ㄵ』, 『ㄼ, ㄽ, ㄾ』, 『ㅄ』在詞尾或子音前分別發作[ㄱ], [ㄴ], [ㄹ], [ㅂ]（前音保留）。",
            "exp": "規定首類複合收音之後音脫落、保留前音子音之發音規則，並標註「밟다[밥따]」等著名特殊例外。"
        },
        "zh-Hans": {
            "rule": "复合收音『ㄳ』, 『ㄵ』, 『ㄼ, ㄽ, ㄾ』, 『ㅄ』在词尾或辅音前分别发作[ㄱ], [ㄴ], [ㄹ], [ㅂ]（前音保留）。",
            "exp": "规定首类复合收音之后音脱落、保留前音辅音之发音规则，并标注「밟다[밥따]」等著名特殊例外。"
        },
        "ja": {
            "rule": "二重パッチム「ㄳ」「ㄵ」「ㄼ, ㄽ, ㄾ」「ㅄ」は、語末または子音の前で各々[ㄱ, ㄴ, ㄹ, ㅂ]と発音する（前の音を残す）。",
            "exp": "二重パッチムのうち前側の子音が残るグループの規則です（「밟다」が[밥따]となる例外を含む）。"
        }
    },
    "p2-a11": {
        "en": {
            "rule": "Complex double Batchim 'ㄺ, ㄻ, ㄿ' are pronounced as [ㄱ, ㅁ, ㅂ] respectively at word ends or before consonants.",
            "exp": "Second consonant retention rule: the preceding 'ㄹ' drops, leaving the second consonant (with 'ㄺ' pronounced [ㄹ] before an ending starting with 'ㄱ')."
        },
        "vi": {
            "rule": "Phụ âm ghép 'ㄺ, ㄻ, ㄿ' lần lượt phát âm là [ㄱ, ㅁ, ㅂ] khi ở cuối từ hoặc trước phụ âm.",
            "exp": "Quy tắc giữ lại âm đứng sau: lược bỏ 'ㄹ', ngoại lệ 'ㄺ' trước đuôi từ bắt đầu bằng 'ㄱ' thì phát âm là [ㄹ]."
        },
        "zh-Hant": {
            "rule": "複合收音『ㄺ, ㄻ, ㄿ』在詞尾或子音前分別發作[ㄱ, ㅁ, ㅂ]（後音保留）。",
            "exp": "規定次類複合收音之前音『ㄹ』脫落、保留後音之規則，唯動詞詞幹『ㄺ』遇『-고』等ㄱ開頭語尾時反轉發作[ㄹ]（如읽고[일꼬]）。"
        },
        "zh-Hans": {
            "rule": "复合收音『ㄺ, ㄻ, ㄿ』在词尾或辅音前分别发作[ㄱ, ㅁ, ㅂ]（后音保留）。",
            "exp": "规定次类复合收音之前音『ㄹ』脱落、保留后音之规则，唯动词词干『ㄺ』遇『-고』等ㄱ开头语尾时反转发作[ㄹ]（如읽고[일꼬]）。"
        },
        "ja": {
            "rule": "二重パッチム「ㄺ, ㄻ, ㄿ」は、語末または子音の前で各々[ㄱ, ㅁ, ㅂ]と発音する（後ろの音を残す）。",
            "exp": "前側の子音「ㄹ」が脱落するグループの規則です（用言語幹の「ㄺ」が「ㄱ」の前で[ㄹ]になる重要例外を含む）。"
        }
    },
    "p2-a12": {
        "en": {
            "rule": "Batchim 'ㅎ' undergoes aspiration, neutralization, or elision depending on the following sound: merges with ㄱ, ㄷ, ㅈ into aspirated [ㅋ, ㅌ, ㅊ], elides before vowels, and assimilates with ㄴ into [ㄴ].",
            "exp": "The complete phonetic behavior of Batchim 'ㅎ': aspiration with stops, tensification with 'ㅅ', and silent deletion before vowels."
        },
        "vi": {
            "rule": "Phụ âm cuối 'ㅎ' biến đổi thành âm bật hơi, biến đổi hoặc biến mất tùy theo âm tiếp theo: gộp với ㄱ, ㄷ, ㅈ thành [ㅋ, ㅌ, ㅊ], biến mất trước nguyên âm.",
            "exp": "Quy tắc toàn diện của phụ âm cuối 'ㅎ': bật hơi hóa với âm tắc, căng hóa với 'ㅅ', và triệt tiêu trước nguyên âm."
        },
        "zh-Hant": {
            "rule": "收音『ㅎ』視後續音產生激音化、脫落或同化：遇ㄱ, ㄷ, ㅈ時激音化為[ㅋ, ㅌ, ㅊ]，遇母音時脫落不發音，遇ㄴ時同化為[ㄴ]。",
            "exp": "極為核心的『ㅎ』收音動態變音法典：與平音結合產生送氣音，在形式母音前完全靜音脫落。"
        },
        "zh-Hans": {
            "rule": "收音『ㅎ』视后续音产生激音化、脱落或同化：遇ㄱ, ㄷ, ㅈ时激音化为[ㅋ, ㅌ, ㅊ]，遇元音时脱落不发音，遇ㄴ时同化为[ㄴ]。",
            "exp": "极为核心的『ㅎ』收音动态变音法典：与平音结合产生送气音，在形式元音前完全静音脱落。"
        },
        "ja": {
            "rule": "パッチム「ㅎ」は後続音に応じて激音化・脱落・同化する：ㄱ, ㄷ, ㅈと合わさって[ㅋ, ㅌ, ㅊ]となり、母音の前では脱落する。",
            "exp": "韓国語学習者が最もつまずきやすい「ㅎ」パッチムの挙動（激音化、母音前での脱落、ㄴの前での鼻音化）を総括した規定です。"
        }
    },
    "p2-a13": {
        "en": {
            "rule": "When a single or double Batchim is followed by a vowel-initial grammatical morpheme (particle, ending, suffix), it resyllabifies directly to the onset of the next syllable.",
            "exp": "The primary liaison (resyllabification) rule: sounds move directly into the empty onset without neutralization (e.g., 옷이 [오시], 깎아 [까까])."
        },
        "vi": {
            "rule": "Khi phụ âm cuối đơn hoặc phụ âm đôi đứng trước hình thái tố ngữ pháp bắt đầu bằng nguyên âm (trợ từ, đuôi từ, tiếp vị ngữ), âm đó sẽ nối trực tiếp lên đầu âm tiết sau.",
            "exp": "Quy tắc nối âm cơ bản: giữ nguyên âm gốc nối sang âm tiết sau mà không qua trung hòa (ví dụ: 옷이 [오시])."
        },
        "zh-Hant": {
            "rule": "單收音或雙收音遇母音開頭之形式形態素（助詞、語尾、接尾辭）時，保留原音直接連音至下一音節初聲。",
            "exp": "最根本之連音（連讀）規則：在文法助詞或語尾前不發生終聲中和，原音直接移至後字發音（如옷이[오시]）。"
        },
        "zh-Hans": {
            "rule": "单收音或双收音遇元音开头之形式形态素（助词、语尾、接尾辞）时，保留原音直接连音至下一音节初声。",
            "exp": "最根本之连音（连读）规则：在文法助词或语尾前不发生终声中和，原音直接移至后字发音（如옷이[오시]）。"
        },
        "ja": {
            "rule": "単パッチム・二重パッチムが母音で始まる形式形態素（助詞、語尾、接尾辞）と結合する場合、元の音のまま次の初声に連音する。",
            "exp": "連音化（リエゾン）の基本条項です。助詞や語尾の前では中和せず、パッチム本来の音がそのまま後ろの音節の頭に移ります。"
        }
    },
    "p2-a14": {
        "en": {
            "rule": "When a complex double Batchim is followed by a vowel-initial grammatical morpheme, the second consonant resyllabifies to the next syllable.",
            "exp": "Liaison of complex codas: the first consonant stays in the coda, while the second moves to the following onset (e.g., 닭을 [달글], 앉아 [안자])."
        },
        "vi": {
            "rule": "Khi phụ âm ghép đứng trước hình thái tố ngữ pháp bắt đầu bằng nguyên âm, chỉ có phụ âm thứ hai nối tiếp sang âm tiết sau.",
            "exp": "Quy tắc nối âm của phụ âm ghép: âm đầu giữ lại ở phụ âm cuối, âm sau nối sang âm tiết tiếp theo (ví dụ: 닭을 [달글])."
        },
        "zh-Hant": {
            "rule": "複合收音遇母音開頭之形式形態素時，前音保留在終聲，後音連音至下一音節初聲。",
            "exp": "複合收音連音規則：前字保留前一個子音，後一個子音移入後字初聲發音（如닭을[달글]、앉아[안자]）。"
        },
        "zh-Hans": {
            "rule": "复合收音遇元音开头之形式形态素时，前音保留在终声，后音连音至下一音节初声。",
            "exp": "复合收音连音规则：前字保留前一个辅音，后一个辅音移入后字初声发音（如닭을[달글]、앉아[안자]）。"
        },
        "ja": {
            "rule": "二重パッチムが母音で始まる形式形態素と結合する場合、後ろ側の子音のみを次の音節の初声に移して発音する。",
            "exp": "二重パッチムの連音化規則です。前側の子音はそのままパッチムに残り、後ろ側の子音が次音節の頭へ移動します。"
        }
    },
    "p2-a15": {
        "en": {
            "rule": "When a Batchim is followed by a substantive (content) morpheme starting with vowels 'ㅏ, ㅓ, ㅗ, ㅜ, ㅟ', it first neutralizes to its representative sound, then resyllabifies.",
            "exp": "Crucial distinction between content vs. grammatical morphemes: neutralization occurs before liaison (e.g., 밭 아래 -> [바다래], 겉옷 -> [거돋])."
        },
        "vi": {
            "rule": "Khi phụ âm cuối đứng trước hình thái tố thực chất bắt đầu bằng nguyên âm 'ㅏ, ㅓ, ㅗ, ㅜ, ㅟ', âm đó trước tiên trung hòa thành âm đại diện rồi mới nối âm.",
            "exp": "Quy tắc then chốt phân biệt từ thực chất: trung hòa âm trước khi nối âm (ví dụ: 겉옷 phát âm thành [거돋] thay vì [거톧])."
        },
        "zh-Hant": {
            "rule": "收音遇母音『ㅏ, ㅓ, ㅗ, ㅜ, ㅟ』開頭之實質形態素時，先變換為代表音[ㄱ, ㄷ, ㅂ]，再連音至下一音節。",
            "exp": "韓語發音最關鍵之語法分野：後接詞彙若為具備實質意義之單詞（而非單純助詞），收音必須先代表音中和再連音（如겉옷[거돋]）。"
        },
        "zh-Hans": {
            "rule": "收音遇元音『ㅏ, ㅓ, ㅗ, ㅜ, ㅟ』开头之实质形态素时，先变换为代表音[ㄱ, ㄷ, ㅂ]，再连音至下一音节。",
            "exp": "韩语发音最关键之语法分野：后接词汇若为具备实质意义之单词（而非单纯助词），收音必须先代表音中和再连音（如겉옷[거돋]）。"
        },
        "ja": {
            "rule": "パッチムの後ろに実質形態素（単語）が続く場合、まず代表音[ㄱ, ㄷ, ㅂ]に中和してから後ろの初声に連音する。",
            "exp": "助詞の場合と異なり、意味のある単語が続く場合はまずパッチムが代表音に変わってから連音する（절음現象）重要規則です。"
        }
    },
    "p2-a16": {
        "en": {
            "rule": "The names of Korean alphabet letters resyllabify their final consonants, with specific traditional exceptions for 'ㄷ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ'.",
            "exp": "Special historic pronunciation for letter names before vowel particles (e.g., 디귿이 [디그시], 지읒이 [지으시])."
        },
        "vi": {
            "rule": "Tên các chữ cái Hangeul khi nối âm sẽ phát âm theo quy tắc riêng biệt, đặc biệt là các chữ 'ㄷ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ'.",
            "exp": "Quy tắc phát âm truyền thống đặc thù khi đọc tên chữ cái kèm trợ từ nguyên âm (ví dụ: 디귿이 phát âm là [디그시])."
        },
        "zh-Hant": {
            "rule": "諺文字母名稱遇母音助詞連音時，對『ㄷ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ』等字母保留專屬歷史慣用發音。",
            "exp": "字母讀音之特殊規定：디귿이讀作[디그시]、지읒이讀作[지으시]等，尊重長期約定俗成之字母呼稱慣例。"
        },
        "zh-Hans": {
            "rule": "谚文字母名称遇元音助词连音时，对『ㄷ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ』等字母保留专属历史惯用发音。",
            "exp": "字母读音之特殊规定：디귿이读作[디그시]、지읒이读作[지으시]等，尊重长期约定俗成之字母呼称惯例。"
        },
        "ja": {
            "rule": "ハングル字母の名称は、助詞が続く際にパッチム音を連音するが、「ㄷ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ」には伝統的な固有発音を適用する。",
            "exp": "字母の名称（ディグッ、チウッ等）に助詞「이」が付く場合の特殊な歴史的発音慣習（디귿이[디그시]等）を定めた規定です。"
        }
    },
    "p2-a17": {
        "en": {
            "rule": "Batchim 'ㄷ, ㅌ(ㄾ)' palatalizes to [ㅈ, ㅊ] when followed by a particle or suffix beginning with 'ㅣ' or '히'.",
            "exp": "The classic Korean palatalization (구개음화) rule: 굳이 [구지], 같이 [가치], 닫히다 [다치다]."
        },
        "vi": {
            "rule": "Phụ âm cuối 'ㄷ, ㅌ(ㄾ)' kết hợp với trợ từ hoặc tiếp vị ngữ bắt đầu bằng 'ㅣ' hoặc '히' sẽ vòm hóa phát âm thành [ㅈ, ㅊ].",
            "exp": "Hiện tượng vòm hóa âm (Palatalization) kinh điển: 굳이 [구지], 같이 [가치]."
        },
        "zh-Hant": {
            "rule": "收音『ㄷ, ㅌ(ㄾ)』遇助詞或接尾辭母音『ㅣ』或『히』時，顎化發音為[ㅈ, ㅊ]。",
            "exp": "經典之顎化規則（Palatalization）：舌尖塞音遇到高元音時自然轉移為齶音（如굳이[구지]、같이[가치]）。"
        },
        "zh-Hans": {
            "rule": "收音『ㄷ, ㅌ(ㄾ)』遇助词或接尾辞元音『ㅣ』或『히』时，颚化发音为[ㅈ, ㅊ]。",
            "exp": "经典之颚化规则（Palatalization）：舌尖塞音遇到高元音时自然转移为腭音（如굳이[구지]、같이[가치]）。"
        },
        "ja": {
            "rule": "パッチム「ㄷ, ㅌ(ㄾ)」が助詞や接尾辞の「ㅣ」または「히」と結合する場合、口蓋音化して[ㅈ, ㅊ]と発音する。",
            "exp": "韓国語の代表的な音韻規則である口蓋音化（굳이[구지]、같이[가치]）を定めた重要条項です。"
        }
    },
    "p2-a18": {
        "en": {
            "rule": "Batchim stop consonants 'ㄱ, ㄷ, ㅂ' nasalize to [ㅇ, ㄴ, ㅁ] when followed by nasal consonants 'ㄴ, ㅁ'.",
            "exp": "The primary nasal assimilation (비음화) rule: 밥물 [밤물], 국물 [궁물], 닫는 [단는]."
        },
        "vi": {
            "rule": "Các phụ âm cuối 'ㄱ, ㄷ, ㅂ' biến đổi thành âm mũi [ㅇ, ㄴ, ㅁ] khi đứng trước các âm mũi 'ㄴ, ㅁ'.",
            "exp": "Quy tắc mũi hóa (Nasalization) cơ bản: 밥물 phát âm là [밤물], 국물 phát âm là [궁물]."
        },
        "zh-Hant": {
            "rule": "塞音收音『ㄱ, ㄷ, ㅂ』在鼻音『ㄴ, ㅁ』之前同化鼻音化為[ㅇ, ㄴ, ㅁ]。",
            "exp": "基礎鼻音化規則：塞音在鼻音前順應發音經濟，同化轉變為發音部位一致之鼻音（如국물[궁물]、밥물[밤물]）。"
        },
        "zh-Hans": {
            "rule": "塞音收音『ㄱ, ㄷ, ㅂ』在鼻音『ㄴ, ㅁ』之前同化鼻音化为[ㅇ, ㄴ, ㅁ]。",
            "exp": "基础鼻音化规则：塞音在鼻音前顺应发音经济，同化转变为发音部位一致之鼻音（如국물[궁물]、밥물[밤물]）。"
        },
        "ja": {
            "rule": "閉鎖音パッチム「ㄱ, ㄷ, ㅂ」は、鼻音「ㄴ, ㅁ」の前で[ㅇ, ㄴ, ㅁ]へと鼻音化して発音する。",
            "exp": "必須の鼻音化規則（국물[궁물]、밥물[밤물]）を規定したもので、スムーズな発音移行を実現します。"
        }
    },
    "p2-a19": {
        "en": {
            "rule": "The liquid consonant 'ㄹ' assimilates to nasal [ㄴ] when following nasal consonants 'ㅁ, ㅇ'.",
            "exp": "Liquid-to-nasal assimilation: 종로 [종노], 침략 [침냑], and stop+ㄹ chains: 백로 -> 백노 -> [뱅노]."
        },
        "vi": {
            "rule": "Phụ âm 'ㄹ' đứng sau các phụ âm cuối mũi 'ㅁ, ㅇ' sẽ phát âm biến đổi thành [ㄴ].",
            "exp": "Quy tắc biến đổi 'ㄹ' thành [ㄴ] sau âm mũi: 종로 phát âm là [종노], 침략 là [침냑]."
        },
        "zh-Hant": {
            "rule": "流音『ㄹ』接在鼻音收音『ㅁ, ㅇ』之後時，同化發音為鼻音[ㄴ]。",
            "exp": "流音鼻音化法則：舌尖流音在鼻音後順應鼻腔共鳴轉變為[ㄴ]（如종로[종노]、침략[침냑]）。"
        },
        "zh-Hans": {
            "rule": "流音『ㄹ』接在鼻音收音『ㅁ, ㅇ』之后时，同化发音为鼻音[ㄴ]。",
            "exp": "流音鼻音化法则：舌尖流音在鼻音后顺应鼻腔共鸣转变为[ㄴ]（如종로[종노]、침략[침냑]）。"
        },
        "ja": {
            "rule": "パッチム「ㅁ, ㅇ」の後ろに続く「ㄹ」は、鼻音化して[ㄴ]と発音する。",
            "exp": "鼻音の後で流音「ㄹ」が発音しやすさのために鼻音[ㄴ]へと変化する規則（종로[종노]）です。"
        }
    },
    "p2-a20": {
        "en": {
            "rule": "Nasal 'ㄴ' assimilates to liquid [ㄹ] before or after 'ㄹ'.",
            "exp": "The mutual lateralization (유음화) rule: 난로 [날로], 신라 [실라], 칼날 [칼랄]."
        },
        "vi": {
            "rule": "Phụ âm 'ㄴ' phát âm thành [ㄹ] khi đứng trước hoặc đứng sau 'ㄹ'.",
            "exp": "Quy tắc lỏng hóa âm (Lateralization): 난로 phát âm là [날로], 신라 phát âm là [실라]."
        },
        "zh-Hant": {
            "rule": "『ㄴ』在『ㄹ』之前或之後時，受同化發音為流音[ㄹ]。",
            "exp": "流音化法則（Lateralization）：鼻音ㄴ與流音ㄹ相鄰時，ㄴ順同化或逆同化為ㄹ（如난로[날로]、신라[실라]）。"
        },
        "zh-Hans": {
            "rule": "『ㄴ』在『ㄹ』之前或之后时，受同化发音为流音[ㄹ]。",
            "exp": "流音化法则（Lateralization）：鼻音ㄴ与流音ㄹ相邻时，ㄴ顺同化或逆同化为ㄹ（如난로[날로]、신라[실라]）。"
        },
        "ja": {
            "rule": "「ㄴ」は「ㄹ」の前または後ろで、流音化して[ㄹ]と発音する。",
            "exp": "流音化規則（신라[실라]、난로[날로]）を定めたもので、舌の位置を揃えて滑らかに発音するための原則です。"
        }
    },
    "p2-a21": {
        "en": {
            "rule": "Consonant assimilations other than those explicitly specified above (such as velarization or labialization) are not recognized as standard pronunciation.",
            "exp": "Disallows non-standard assimilations like 감기 [강기] or 문법 [뭄뻡] to maintain standard phonological clarity."
        },
        "vi": {
            "rule": "Các hiện tượng đồng hóa phụ âm ngoài các quy định nêu trên không được công nhận là phát âm chuẩn.",
            "exp": "Không công nhận các đồng hóa khẩu ngữ tự do như phát âm 감기 thành [강기] nhằm giữ gìn chuẩn mực."
        },
        "zh-Hant": {
            "rule": "除上述明確規定之子音同化外，其餘過度同化現象（如軟齶化、唇音化）均不承認為標準發音。",
            "exp": "嚴格限定同化範疇，遏止如감기讀成[강기]、문법讀成[뭄뻡]等隨意口語過度同化現象，維護標準語尊嚴。"
        },
        "zh-Hans": {
            "rule": "除上述明确规定之辅音同化外，其余过度同化现象（如软腭化、唇音化）均不承认为标准发音。",
            "exp": "严格限定同化范畴，遏止如감기读成[강기]、문법读成[뭄뻡]等随意口语过度同化现象，维护标准语尊严。"
        },
        "ja": {
            "rule": "上記で規定されたもの以外の子音同化（軟口蓋音化や両唇音化等）は、標準発音と認めない。",
            "exp": "「감기」を[강기]とするような過剰な口語の同化現象を排除し、規範的な発音の秩序を守る条項です。"
        }
    },
    "p2-a22": {
        "en": {
            "rule": "Verbal endings following specific vowels shall be pronounced as [어] by default, while pronunciation as [여] is also permitted.",
            "exp": "Permits glide insertion [j] in endings after high vowels (e.g., 되어 -> [되어]/[되여], 피어 -> [피어]/[피여])."
        },
        "vi": {
            "rule": "Đuôi từ của vị từ sau các nguyên âm cụ thể về nguyên tắc phát âm là [어], nhưng cũng cho phép phát âm là [여].",
            "exp": "Cho phép chèn bán nguyên âm [j] một cách tự nhiên trong văn nói (ví dụ: 되어 phát âm là [되어] hoặc [되여])."
        },
        "zh-Hant": {
            "rule": "特定母音後之用言語尾原則上發音為[어]，同時亦容許發音為[여]。",
            "exp": "容許半母音[j]之自然插入現象：如되어可讀為[되어]或[되여]，피어可讀為[피어]或[피여]，兼顧口語現實。"
        },
        "zh-Hans": {
            "rule": "特定母音后之用言语尾原则上发音为[어]，同时亦容许发音为[여]。",
            "exp": "容许半元音[j]之自然插入现象：如되어可读为[되어]或[되여]，피어可读为[피어]或[피여]，兼顾口语现实。"
        },
        "ja": {
            "rule": "特定の母音に続く用言の語尾は[어]を原則としつつ、[여]としての発音も許容する。",
            "exp": "「피어」を[피여]、「되어」を[되여]と発音する半母音添加現象を、口語の自然な流れとして公式に許容した規定です。"
        }
    },
    "p2-a23": {
        "en": {
            "rule": "Plain stop/affricate/fricative consonants 'ㄱ, ㄷ, ㅂ, ㅅ, ㅈ' tensify to [ㄲ, ㄸ, ㅃ, ㅆ, ㅉ] when following unreleased stop Batchim 'ㄱ, ㄷ, ㅂ'.",
            "exp": "The mandatory tensification (경음화) rule after obstruent stops: 국밥 [국빱], 깎다 [깍따], 옷고름 [옫꼬름]."
        },
        "vi": {
            "rule": "Các phụ âm 'ㄱ, ㄷ, ㅂ, ㅅ, ㅈ' sẽ căng âm hóa phát âm thành [ㄲ, ㄸ, ㅃ, ㅆ, ㅉ] khi đứng sau các phụ âm cuối tắc 'ㄱ, ㄷ, ㅂ'.",
            "exp": "Quy tắc căng âm hóa bắt buộc sau âm tắc: 국밥 phát âm là [국빱], 깎다 phát âm là [깍따]."
        },
        "zh-Hant": {
            "rule": "平音『ㄱ, ㄷ, ㅂ, ㅅ, ㅈ』在塞音收音『ㄱ, ㄷ, ㅂ』之後，強制硬音化（濃音化）發音為[ㄲ, ㄸ, ㅃ, ㅆ, ㅉ]。",
            "exp": "最基礎之障礙音硬音化法則：在塞音收音形成的閉塞氣流下，後續平音必須強化為濃音（如국밥[국빱]）。"
        },
        "zh-Hans": {
            "rule": "平音『ㄱ, ㄷ, ㅂ, ㅅ, ㅈ』在塞音收音『ㄱ, ㄷ, ㅂ』之后，强制硬音化（浓音化）发音为[ㄲ, ㄸ, ㅃ, ㅆ, ㅉ]。",
            "exp": "最基础之障碍音硬音化法则：在塞音收音形成的闭塞气流下，后续平音必须强化为浓音（如국밥[국빱]）。"
        },
        "ja": {
            "rule": "平音「ㄱ, ㄷ, ㅂ, ㅅ, ㅈ」は、閉鎖音パッチム「ㄱ, ㄷ, ㅂ」の後ろで濃音[ㄲ, ㄸ, ㅃ, ㅆ, ㅉ]として発音する。",
            "exp": "最も基本的な濃音化（硬音化）規則です。閉鎖音パッチムの後で気流が緊張し、後続音が濃音へと変化します（국밥[국빱]）。"
        }
    },
    "p2-a24": {
        "en": {
            "rule": "In verb/adjective stems ending in nasal Batchim 'ㄴ(ㄵ), ㅁ(ㄻ)', following endings starting with 'ㄱ, ㄷ, ㅅ, ㅈ' tensify to [ㄲ, ㄸ, ㅆ, ㅉ].",
            "exp": "Stem-ending nasal tensification: 신다 [신따], 앉고 [안꼬], 닮다 [담따]."
        },
        "vi": {
            "rule": "Đuôi từ bắt đầu bằng 'ㄱ, ㄷ, ㅅ, ㅈ' đứng sau phụ âm cuối gốc vị từ 'ㄴ(ㄵ), ㅁ(ㄻ)' sẽ phát âm thành âm căng [ㄲ, ㄸ, ㅆ, ㅉ].",
            "exp": "Căng âm hóa sau gốc động/tính từ kết thúc bằng âm mũi: 신다 phát âm là [신따], 닮고 là [담꼬]."
        },
        "zh-Hant": {
            "rule": "以鼻音收音『ㄴ(ㄵ), ㅁ(ㄻ)』結尾之用言詞幹後，語尾初聲『ㄱ, ㄷ, ㅅ, ㅈ』硬音化發音為[ㄲ, ㄸ, ㅆ, ㅉ]。",
            "exp": "用言語幹專屬硬音化：僅限於動詞、形容詞詞幹鼻音後之語尾發生硬音化（如신다[신따]、닮고[담꼬]），名詞後不適用。"
        },
        "zh-Hans": {
            "rule": "以鼻音收音『ㄴ(ㄵ), ㅁ(ㄻ)』结尾之用言词干后，语尾初声『ㄱ, ㄷ, ㅅ, ㅈ』硬音化发音为[ㄲ, ㄸ, ㅆ, ㅉ]。",
            "exp": "用言词干专属硬音化：仅限于动词、形容词词干鼻音后之语尾发生硬音化（如신다[신따]、닮고[담꼬]），名词后不适用。"
        },
        "ja": {
            "rule": "用言語幹末尾の鼻音パッチム「ㄴ(ㄵ), ㅁ(ㄻ)」に続く語尾の初声「ㄱ, ㄷ, ㅅ, ㅈ」は濃音化する。",
            "exp": "用言（動詞・形容詞）特有の濃音化規則です（신다[신따]、닮다[담따]）。名詞では起きない文法形態素特有の音変です。"
        }
    },
    "p2-a25": {
        "en": {
            "rule": "In verb/adjective stems ending in liquid Batchim 'ㄼ, ㄾ', following endings starting with 'ㄱ, ㄷ, ㅅ, ㅈ' tensify to [ㄲ, ㄸ, ㅆ, ㅉ].",
            "exp": "Stem-ending liquid cluster tensification: 넓다 [널따], 핥다 [할따]."
        },
        "vi": {
            "rule": "Đuôi từ bắt đầu bằng 'ㄱ, ㄷ, ㅅ, ㅈ' đứng sau phụ âm cuối gốc vị từ 'ㄼ, ㄾ' sẽ phát âm thành âm căng [ㄲ, ㄸ, ㅆ, ㅉ].",
            "exp": "Căng âm hóa sau gốc vị từ kết thúc bằng 'ㄼ, ㄾ': 넓다 phát âm là [널따], 핥다 là [할따]."
        },
        "zh-Hant": {
            "rule": "以收音『ㄼ, ㄾ』結尾之用言詞幹後，語尾初聲『ㄱ, ㄷ, ㅅ, ㅈ』硬音化發音為[ㄲ, ㄸ, ㅆ, ㅉ]。",
            "exp": "流音複合收音詞幹之語尾硬音化：動詞形容詞詞幹遇語尾時引發規則性音變（如넓다[널따]、핥다[할따]）。"
        },
        "zh-Hans": {
            "rule": "以收音『ㄼ, ㄾ』结尾之用言词干后，语尾初声『ㄱ, ㄷ, ㅅ, ㅈ』硬音化发音为[ㄲ, ㄸ, ㅆ, ㅉ]。",
            "exp": "流音复合收音词干之语尾硬音化：动词形容词词干遇语尾时引发规则性音变（如넓다[널따]、핥다[할따]）。"
        },
        "ja": {
            "rule": "パッチム「ㄼ, ㄾ」で終わる用言語幹に続く語尾の初声「ㄱ, ㄷ, ㅅ, ㅈ」は濃音化する。",
            "exp": "流音複合パッチムを持つ用言語幹（넓다[널따]、핥다[할따]）において、語尾が規則的に濃音化する現象を規定しています。"
        }
    },
    "p2-a26": {
        "en": {
            "rule": "In Sino-Korean words, consonants 'ㄷ, ㅅ, ㅈ' following Batchim 'ㄹ' tensify to [ㄸ, ㅆ, ㅉ].",
            "exp": "Sino-Korean tensification: 갈등 [갈뜨ng], 발전 [발쩐], 일시 [일씨] (Note: 'ㄱ, ㅂ' do not tensify)."
        },
        "vi": {
            "rule": "Trong các từ gốc Hán, các phụ âm 'ㄷ, ㅅ, ㅈ' đứng sau phụ âm cuối 'ㄹ' sẽ phát âm thành âm căng [ㄸ, ㅆ, ㅉ].",
            "exp": "Căng âm hóa trong từ Hán-Hàn: 갈등 phát âm là [갈뜽], 발전 là [발쩐] (không áp dụng cho 'ㄱ, ㅂ')."
        },
        "zh-Hant": {
            "rule": "在漢字詞中，接在收音『ㄹ』之後的『ㄷ, ㅅ, ㅈ』硬音化發音為[ㄸ, ㅆ, ㅉ]。",
            "exp": "漢字詞專屬硬音化規律：漢字音『ㄹ』收音之後特定齒齦音與破擦音產生硬音化（如갈등[갈뜽]、발전[발쩐]）。"
        },
        "zh-Hans": {
            "rule": "在汉字词中，接在收音『ㄹ』之后的『ㄷ, ㅅ, ㅈ』硬音化发音为[ㄸ, ㅆ, ㅉ]。",
            "exp": "汉字词专属硬音化规律：汉字音『ㄹ』收音之后特定齿龈音与破擦音产生硬音化（如갈등[갈뜽]、발전[발쩐]）。"
        },
        "ja": {
            "rule": "漢字語において、パッチム「ㄹ」の後ろに続く「ㄷ, ㅅ, ㅈ」は濃音[ㄸ, ㅆ, ㅉ]として発音する。",
            "exp": "漢字語に特有の濃音化規則です（갈등[갈뜽]、발전[발쩐]）。「ㄱ」や「ㅂ」は濃音化しない点も特徴的です。"
        }
    },
    "p2-a27": {
        "en": {
            "rule": "Consonants 'ㄱ, ㄷ, ㅂ, ㅅ, ㅈ' following the adnominal ending '-(으)ㄹ' tensify to [ㄲ, ㄸ, ㅃ, ㅆ, ㅉ].",
            "exp": "Prosodic tensification after prospective adnominal marker: 할 것을 [할꺼슬], 갈 데가 [갈떼가]."
        },
        "vi": {
            "rule": "Các phụ âm 'ㄱ, ㄷ, ㅂ, ㅅ, ㅈ' đứng sau đuôi định từ '-(으)ㄹ' sẽ phát âm thành âm căng [ㄲ, ㄸ, ㅃ, ㅆ, ㅉ].",
            "exp": "Căng âm hóa sau vĩ tố định từ tương lai '-(으)ㄹ': 할 것을 phát âm là [할꺼슬], 갈 곳 là [갈꼳]."
        },
        "zh-Hant": {
            "rule": "在冠形詞形語尾『-(으)ㄹ』之後相連之『ㄱ, ㄷ, ㅂ, ㅅ, ㅈ』硬音化發音為[ㄲ, ㄸ, ㅃ, ㅆ, ㅉ]。",
            "exp": "冠形詞形未來時態標記引起之連帶硬音化：如할 것을[할꺼슬]、갈 데가[갈떼가]，兼具節奏與斷句功能。"
        },
        "zh-Hans": {
            "rule": "在冠形词形语尾『-(으)ㄹ』之后相连之『ㄱ, ㄷ, ㅂ, ㅅ, ㅈ』硬音化发音为[ㄲ, ㄸ, ㅃ, ㅆ, ㅉ]。",
            "exp": "冠形词形未来时态标记引起之连带硬音化：如할 것을[할꺼슬]、갈 데가[갈떼가]，兼具节奏与断句功能。"
        },
        "ja": {
            "rule": "連体形語尾「-(으)ㄹ」の後ろに続く「ㄱ, ㄷ, ㅂ, ㅅ, ㅈ」は濃音として発音する。",
            "exp": "未来連体形の後ろで後続の名詞等の初声が規則的に濃音化する規則です（할 것을[할꺼슬]、갈 곳[갈꼳]）。"
        }
    },
    "p2-a28": {
        "en": {
            "rule": "In compound words where an underlying Sai-siot (intervocalic -s-) exists functionally even if not written, the following plain consonant tensifies.",
            "exp": "Syntactic compounding tensification: 문고리 [문꼬리], 눈동자 [눈똥자], 길가 [길까]."
        },
        "vi": {
            "rule": "Trong từ ghép, dù không viết chữ Sai-siot nhưng nếu có chức năng liên kết ngữ nghĩa thì phụ âm sau sẽ phát âm thành âm căng.",
            "exp": "Căng âm hóa trong từ ghép do sự hiện diện của âm nối ngầm: 문고리 phát âm là [문꼬리], 눈동자 là [눈똥자]."
        },
        "zh-Hant": {
            "rule": "在合成詞中，即使拼寫上未書寫間隔S（사이시옷），若實質具備修飾功能之音韻停頓，後續子音發濃音。",
            "exp": "複合名詞內部之潛在間隔音硬音化：拼寫上未體現사이시옷但實際口語自然產生濃音化（如문고리[문꼬리]、길가[길까]）。"
        },
        "zh-Hans": {
            "rule": "在合成词中，即使拼写上未书写间隔S（사이시옷），若实质具备修饰功能之音韵停顿，后续辅音发浓音。",
            "exp": "复合名词内部之潜在间隔音硬音化：拼写上未体现사이시옷但实际口语自然产生浓音化（如문고리[문꼬리]、길가[길까]）。"
        },
        "ja": {
            "rule": "合成語において、表記上サイシオッがなくても機能上介在する場合は、後続の子音を濃音として発音する。",
            "exp": "表記には現れない「潜在的な間の音（サイシオッ）」によって、合成語の後半が濃音化する現象（문고리[문꼬리]）を規定しています。"
        }
    },
    "p2-a29": {
        "en": {
            "rule": "In compound and derived words where the first element ends in a consonant and the second begins with '이, 야, 여, 요, 유', an epenthetic [ㄴ] is inserted, resulting in [니, 냐, 녀, 뇨, 뉴].",
            "exp": "The celebrated 'ㄴ-addition' (ㄴ 첨가) rule: 솜이불 -> [솜니불], 맨입 -> [맨닙], 물약 -> 물냑 -> [물략]."
        },
        "vi": {
            "rule": "Trong từ ghép và từ phái sinh, khi từ trước kết thúc bằng phụ âm và từ sau bắt đầu bằng '이, 야, 여, 요, 유', âm [ㄴ] sẽ được chèn vào phát âm thành [니, 냐, 녀, 뇨, 뉴].",
            "exp": "Hiện tượng thêm âm [ㄴ] (ㄴ-addition) nổi tiếng: 솜이불 phát âm là [솜니불], 맨입 là [맨닙]."
        },
        "zh-Hant": {
            "rule": "在合成詞及派生詞中，前詞以子音結尾且後詞以『이, 야, 여, 요, 유』開頭時，添加[ㄴ]發音為[니, 냐, 녀, 뇨, 뉴]。",
            "exp": "最重要之『ㄴ添加』音韻法則：在複合詞交界處高元音前插入鼻音[ㄴ]（如솜이불[솜니불]、맨입[맨닙]、물약[물략]）。"
        },
        "zh-Hans": {
            "rule": "在合成词及派生词中，前词以辅音结尾且后词以『이, 야, 여, 요, 유』开头时，添加[ㄴ]发音为[니, 냐, 녀, 뇨, 뉴]。",
            "exp": "最重要之『ㄴ添加』音韵法则：在复合词交界处高元音前插入鼻音[ㄴ]（如솜이불[솜니불]、맨입[맨닙]、물약[물략]）。"
        },
        "ja": {
            "rule": "合成語や派生語で、前が子音で終わり後ろが「이, 야, 여, 요, 유」で始まる場合、[ㄴ]音を添加して[니, 냐, 녀, 뇨, 뉴]と発音する。",
            "exp": "韓国語の「ㄴ添加」と呼ばれる極めて重要な音素添加現象（솜이불[솜니불]、물약[물략]）を定めた条項です。"
        }
    },
    "p2-a30": {
        "en": {
            "rule": "Words spelled with Sai-siot (intervocalic -s-) shall be pronounced with tensification of following consonants, or pronounced as [ㄷ] or nasalized to [ㄴ, ㄴㄴ] depending on phonetic environment.",
            "exp": "Comprehensive pronunciation rules for written Sai-siot words: 냇가 [내까]/[낻까], 콧날 [콘날], 깻잎 [깬닙]."
        },
        "vi": {
            "rule": "Các từ viết có chữ Sai-siot sẽ phát âm căng hóa phụ âm sau, hoặc phát âm thành [ㄷ] hay đồng hóa thành [ㄴ, ㄴㄴ] tùy theo môi trường ngữ âm.",
            "exp": "Quy tắc phát âm toàn diện của từ có chữ Sai-siot: 냇가 phát âm là [내까]/[낻까], 콧날 là [콘날], 깻잎 là [깬닙]."
        },
        "zh-Hant": {
            "rule": "帶有拼寫『間隔S（사이시옷）』之詞彙，依環境使後續子音硬音化（可讀[ㄷ]），遇鼻音同化為[ㄴ]，遇母音複合添加為[ㄴㄴ]。",
            "exp": "完整規範書面사이시옷之立體發音：如냇가讀[내까/낻까]、콧날讀[콘날]、깻잎讀[깬닙]之多元環境法則。"
        },
        "zh-Hans": {
            "rule": "带有拼写『间隔S（사이시옷）』之词汇，依环境使后续辅音硬音化（可读[ㄷ]），遇鼻音同化为[ㄴ]，遇元音复合添加为[ㄴㄴ]。",
            "exp": "完整规范书面사이시옷之立体发音：如냇가读[내까/낻까]、콧날读[콘날]、깻잎读[깬닙]之多元环境法则。"
        },
        "ja": {
            "rule": "サイシオッ（間記のㅅ）が付いた語は、後続音を濃音化して発音し、環境に応じて[ㄷ]や[ㄴ, ㄴㄴ]として発音する。",
            "exp": "サイシオッ表記を伴う合成語の全発音パターン（냇가[내까/낻까]、콧날[콘날]、깻잎[깬닙]）を網羅的に定めた規則です。"
        }
    }
}

# Combine and build master database
master_data = []

for item in norms:
    aid = item["id"]
    part_title = item["partTitle"]
    chap_title = item["chapterTitle"]
    sec_title = item["sectionTitle"]
    art_title = item["articleTitle"]
    
    trans_entry = ARTICLES_I18N.get(aid, {})

    entry = {
        "id": aid,
        "path": item["path"],
        "partNum": item["partNum"],
        "articleNum": item["articleNum"],
        "articleTitle": art_title,
        "details": item["details"],
        "i18n": {
            "ko": {
                "part": part_title,
                "chapter": chap_title,
                "section": sec_title,
                "title": art_title,
                "rule": item["rule"],
                "explanation": item["commentary"][:250] + ("..." if len(item["commentary"]) > 250 else "")
            }
        }
    }

    # Add other 5 anchor languages
    for lang in ["en", "vi", "zh-Hant", "zh-Hans", "ja"]:
        hier_part = HIERARCHY_I18N.get(part_title, {}).get(lang, part_title)
        hier_chap = HIERARCHY_I18N.get(chap_title, {}).get(lang, chap_title)
        hier_sec = HIERARCHY_I18N.get(sec_title, {}).get(lang, sec_title)
        
        art_t_trans = {
            "en": f"Article {item['articleNum']}",
            "vi": f"Điều {item['articleNum']}",
            "zh-Hant": f"第{item['articleNum']}條",
            "zh-Hans": f"第{item['articleNum']}条",
            "ja": f"第{item['articleNum']}項"
        }.get(lang, art_title)

        lang_rule_exp = trans_entry.get(lang, {})
        entry["i18n"][lang] = {
            "part": hier_part,
            "chapter": hier_chap,
            "section": hier_sec,
            "title": art_t_trans,
            "rule": lang_rule_exp.get("rule", item["rule"]),
            "explanation": lang_rule_exp.get("exp", "")
        }

    master_data.append(entry)

out_file = "life-help/lib/standards/data/korean_norms_anchor.json"
with open(out_file, "w", encoding="utf-8") as f:
    json.dump(master_data, f, ensure_ascii=False, indent=2)

print(f"Master Anchor Translations generated for all {len(master_data)} articles at {out_file}!")
