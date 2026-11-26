import json
import os

with open("lib/standards/data/korean_norms.json", "r", encoding="utf-8") as f:
    raw_norms = json.load(f)

raw_commentaries = {item["id"]: item.get("commentary", "") for item in raw_norms}

with open("lib/standards/data/korean_norms_anchor.json", "r", encoding="utf-8") as f:
    anchor_norms = json.load(f)

# Comprehensive multilingual explanations for all 56 articles across 5 anchor languages (en, vi, zh-Hant, zh-Hans, ja)
# Grounded in official National Institute of Korean Language (국립국어원) commentary.
EXPLANATIONS_I18N = {
    # Part 1: Principles of Standard Korean Determination (제1부 표준어 사정 원칙)
    "p1-a1": {
        "en": "Establishes the foundational standard of Korean for unified and efficient communication. Standard Korean is defined by three pillars: social (modern educated speakers), regional (Seoul dialect), and temporal (modern era). Variants across regions or social strata are unified under single or multiple standard forms, while preserving traditional and rational linguistic norms.",
        "vi": "Xác lập định nghĩa nền tảng của tiếng Hàn tiêu chuẩn nhằm đảm bảo giao tiếp thống nhất và hiệu quả trên toàn quốc. Tiếng Hàn tiêu chuẩn được định nghĩa dựa trên ba yếu tố cốt lõi: tầng lớp xã hội (những người có học thức), khu vực địa lý (tiếng Seoul) và thời đại (thời hiện đại), thống nhất các biến thể phương ngữ thành dạng chuẩn duy nhất hoặc kép.",
        "zh-Hant": "確立韓國標準語之根本定義，旨在保障全體國民高效而統一的溝通交流。標準語由三大要素界定：社會階層（具教養人士）、地域範圍（現代首爾方言）與時代標準（現時代）。將各地域及社會變體整合規範為單數或複數標準形態，兼顧語言傳統性與合理性。",
        "zh-Hans": "确立韩国标准语的根本定义，旨在保障全体国民高效而统一的沟通交流。标准语由三大要素界定：社会阶层（具教养人士）、地域范围（现代首尔方言）与时代标准（现时代）。将各地域及社会变体整合规范为单数或复数标准形态，兼顾语言传统性与合理性。",
        "ja": "国民の円滑で統一された意思疎通を図るため、韓国標準語の基本定義を定めた条項です。社会層（教養のある人々）、地域（ソウル方言）、時代（現代）の3要素を基準とし、地域や階層による多様な方言的変異を単数または複数の標準形として統一・規定しています。"
    },
    "p1-a2": {
        "en": "Specifies that foreign loanwords flowing into Korean are excluded from general standard language determination and are systematically governed by dedicated 'Loanword Orthography (외래어 표기법)' rules established through ongoing academic and linguistic review.",
        "vi": "Quy định rằng các từ vay mượn từ nước ngoài không áp dụng quy tắc xác định tiếng Hàn thông thường, mà được thẩm định và quản lý riêng biệt theo 'Quy tắc phiên âm từ ngoại lai' thông qua các đợt khảo sát và đánh giá ngôn ngữ định kỳ.",
        "zh-Hant": "明定隨國際交流流入之外來語不適用標準語一般審定原則，而是依據持續調查與語言審議，由獨立的《外來語標記法》進行專項審定與規範。",
        "zh-Hans": "明定随国际交流流入的外来语不适用标准语一般审定原则，而是依据持续调查与语言审议，由独立的《外来语标记法》进行专项审定与规范。",
        "ja": "国際交流により流入する外来語は標準語の一般通則とは区別し、言語調査に基づき独立して制定された『外来語表記法』によって別途体系的に査定・規定することを定めています。"
    },
    "p1-a3": {
        "en": "Recognizes words where plain or tense consonants have historically shifted to aspirated consonants (ㅋ, ㅌ, ㅍ, ㅊ) in widespread spoken practice as the sole standard form, discarding the obsolete plain sound forms.",
        "vi": "Công nhận các từ mà trong thực tế sử dụng ngữ âm thông thường đã tự nhiên chuyển đổi từ âm thường/âm căng sang âm bật hơi (như ㅋ, ㅌ, ㅍ, ㅊ) làm dạng chuẩn duy nhất, đồng thời loại bỏ các dạng âm thường cũ.",
        "zh-Hant": "對於在長期言語實踐中平音或緊音已自然轉變為激音（送氣音，如ㅋ、ㅌ、ㅍ、ㅊ）並廣泛定型的詞彙，認可其激音形態為唯一標準語，捨棄舊有的平音形態。",
        "zh-Hans": "对于在长期语言实践中平音或紧音已自然转变为激音（送气音，如ㅋ、ㅌ、ㅍ、ㅊ）并广泛定型的词汇，认可其激音形态为唯一标准语，舍弃旧有的平音形态。",
        "ja": "平音や濃音が実際の言語生活の中で有気音（激音：ㅋ, ㅌ, ㅍ, ㅊ）へと自然に変化し広く定着した語彙について、激音の形態を唯一の標準語として公認し、旧来の平音形を廃止する規定です。"
    },
    "p1-a4": {
        "en": "Standardizes words that maintain plain consonant forms rather than aspirated forms, rejecting unauthorized aspirated colloquial pronunciations.",
        "vi": "Quy định giữ nguyên dạng âm thường đối với các từ chưa có sự biến đổi thành âm bật hơi một cách phổ biến, loại bỏ các cách phát âm bật hơi tùy tiện.",
        "zh-Hant": "針對尚未形成普遍送氣音化之詞彙，規範仍以原有的平音形態為標準語，排除口語中非規範性的送氣音發音。",
        "zh-Hans": "针对尚未形成普遍送气音化之词汇，规范仍以原有的平音形态为标准语，排除口语中非规范性的送气音发音。",
        "ja": "激音化が一般的に定着していない語彙については、依然として平音の形態を標準語として維持し、俗音的な激音発音を標準語から除外する規定です。"
    },
    "p1-a5": {
        "en": "Reflects phonetic drift where the original etymological consciousness has weakened over time, standardizing the modern evolved pronunciation over obsolete etymological spellings.",
        "vi": "Phản ánh sự biến đổi ngữ âm khi ý thức về nguồn gốc từ nguyên đã mờ nhạt theo thời gian, công nhận cách phát âm biến đổi hiện đại làm dạng chuẩn thay vì dạng từ nguyên cổ.",
        "zh-Hant": "詞彙之詞源意識隨時代流逝而淡化、發音已發生實質轉變時，以現代口語實際演變後之發音形態為標準語，不再拘泥於古代字源表記。",
        "zh-Hans": "词汇之词源意识随时光流逝而淡化、发音已发生实质转变时，以现代口语实际演变后之发音形态为标准语，不再拘泥于古代字源标记。",
        "ja": "時間の経過とともに語源意識が薄れ、発音が定着・変化した単語について、旧来の語源的表記ではなく、現代の実際の発音変化を反映した形態を標準語とする条項です。"
    },
    "p1-a6": {
        "en": "Codifies words where phonetic assimilation or sound mutation in following syllables has hardened into standard usage (e.g., numeral suffixes and calendar terms).",
        "vi": "Chuẩn hóa các từ mà âm đầu của âm tiết tiếp theo đã bị biến đổi ngữ âm và cố định thành cách dùng phổ thông trong đời sống hàng ngày.",
        "zh-Hant": "規範接續音節之初聲發生語音同化或異化演變並已固定下來的詞彙形態，確立其現代規範用法。",
        "zh-Hans": "规范后续音节之初声发生语音同化或异化演变并已固定下来的词汇形态，确立其现代规范用法。",
        "ja": "後続する音節の初声が音韻変化を起こし、広く一般に定着した語彙の形態を標準語として規定しています。"
    },
    "p1-a7": {
        "en": "Standardizes the male animal prefix as '수-' in principle. It specifies exceptions where aspirated consonants are induced (수꿩, 수나사, etc.) and limits the prefix '숫-' strictly to only three words: 숫양, 숫염소, and 숫쥐.",
        "vi": "Quy định tiền tố chỉ giống đực theo nguyên tắc là '수-'. Nêu rõ các trường hợp gây ra âm bật hơi (수꿩, 수나사...), và giới hạn tiền tố '숫-' nghiêm ngặt trong đúng 3 từ: 숫양 (cừu đực), 숫염소 (dê đực), 숫쥐 (chuột đực).",
        "zh-Hant": "規範表示雄性之接頭詞原則上統一為'수-'。同時明確規定引發送氣音之特例（如수꿩、수나사等），並將帶收音之接頭詞'숫-'嚴格限制於僅'숫양（公羊）'、'숫염소（公山羊）'與'숫쥐（公鼠）'三詞。",
        "zh-Hans": "规范表示雄性之接头词原则上统一为'수-'。同时明确规定引发送气音之特例（如수꿩、수나사等），并将带收音之接头词'숫-'严格限制于仅'숫양（公羊）'、'숫염소（公山羊）'与'숫쥐（公鼠）'三词。",
        "ja": "雄を表す接頭辞は原則として'수-'に統一します。例外として激音化を引き起こす単語を規定し、'숫-'の形を用いる語は'숫양'、'숫염소'、'숫쥐'の3語のみに厳格に限定しています。"
    },
    "p1-a8": {
        "en": "Standardizes forms where historical positive vowels have shifted to negative vowels due to the weakening of vowel harmony in modern Korean (e.g., 깡충깡충).",
        "vi": "Chuẩn hóa các dạng từ mà nguyên âm dương tính lịch sử đã chuyển thành nguyên âm âm tính do sự suy giảm của quy tắc hài hòa nguyên âm trong tiếng Hàn hiện đại.",
        "zh-Hant": "反映現代韓語中母音和諧律減弱的語言現實，將歷史上的陽性母音轉變為陰性母音並已定型的形態規範為標準語。",
        "zh-Hans": "反映现代韩语中母音和谐律减弱的语言现实，将历史上的阳性母音转变为阴性母音并已定型的形态规范为标准语。",
        "ja": "現代語における母音調和の衰退に伴い、歴史的な陽性母音から陰性母音へと変化して定着した形態を標準語として公認する規定です。"
    },
    "p1-a9": {
        "en": "Regulates 'ㅣ' regressive assimilation (umlaut): generally rejected as non-standard dialectal pronunciation, except for a few entrenched cultural terms like 냄비 and 동댕이치다.",
        "vi": "Quy định về hiện tượng đồng hóa ngược âm 'ㅣ' (umlaut): về nguyên tắc bị coi là phương ngữ phi chuẩn, ngoại trừ một số ít từ đã ăn sâu vào đời sống như 냄비, 동댕이치다.",
        "zh-Hant": "規範'ㅣ'逆行動化（變母音現象）：原則上判定逆行動化為非標準方言發音，但對如냄비（鍋）、동댕이치다等已徹底約定俗成的少數詞彙給予例外認可。",
        "zh-Hans": "规范'ㅣ'逆行动化（变母音现象）：原则上判定逆行动化为非标准方言发音，但对如냄비（锅）、동댕이치다等已彻底约定俗成的少数词汇给予例外认可。",
        "ja": "'ㅣ'逆行同化（ウムラウト現象）に関する規定です。原則として方言的な非標準音として斥けますが、'냄비'や'동댕이치다'など完全に一般定着した例外語彙のみ標準語として認めます。"
    },
    "p1-a10": {
        "en": "Standardizes words where diphthongs or obsolete complex vowels have simplified into monophthongs in contemporary educated speech.",
        "vi": "Chuẩn hóa các từ mà nguyên âm đôi hoặc nguyên âm phức cổ đã được đơn giản hóa thành nguyên âm đơn trong lời nói của người hiện đại.",
        "zh-Hant": "將雙母音或複雜古代母音在現代口語中簡化為單母音並普遍通用的形態規範為唯一標準語。",
        "zh-Hans": "将双母音或复杂古代母音在现代口语中简化为单母音并普遍通用的形态规范为唯一标准语。",
        "ja": "重母音や複雑な母音が、現代の言語生活の中で自然に単母音化して定着した形態を標準語として認定する条項です。"
    },
    "p1-a11": {
        "en": "Codifies standard forms resulting from regular vowel elision, contraction, or syllable reduction in commonly used vocabulary.",
        "vi": "Quy định các dạng chuẩn phát sinh từ hiện tượng lược bỏ nguyên âm, co cụm âm hoặc rút gọn âm tiết trong vốn từ vựng thông dụng.",
        "zh-Hant": "規範常用詞彙在語流中因母音脫落、音節縮略或緊縮而定型的現代標準形態。",
        "zh-Hans": "规范常用词汇在语流中因母音脱落、音节缩略或紧缩而定型的现代标准形态。",
        "ja": "日常の語彙において母音の脱落や音節の縮約が生じ、その短縮形が定着した語を標準語として定める規定です。"
    },
    "p1-a12": {
        "en": "Governs irregular conjugations and verbal ending variations in Korean predicate morphology, standardizing established forms.",
        "vi": "Quy định về các dạng chia động từ bất quy tắc và biến thể đuôi ngữ pháp trong hình thái vị từ tiếng Hàn.",
        "zh-Hant": "規範韓語謂詞活用中之不規則活用及詞尾變化形態，明確標準形態依歸。",
        "zh-Hans": "规范韩语谓词活用中之不规则活用及词尾变化形态，明确标准形态依归。",
        "ja": "用言の不規則活用および語尾変化に伴う形態差について、文法体系と標準的な運用を整理・規定しています。"
    },
    "p1-a13": {
        "en": "Distinguishes the prefixes '웃-' and '윗-': uses '윗-' when there is an upper/lower vertical opposition (e.g., 윗니 vs 아랫니), but uses '웃-' when no vertical counterpart exists (웃돈, 웃어른) or before aspirated/tense sounds (위쪽).",
        "vi": "Phân biệt tiền tố '웃-' và '윗-': dùng '윗-' khi có sự đối lập trên/dưới rõ ràng (윗니 - răng trên vs 아랫니 - răng dưới), nhưng dùng '웃-' khi không có đối lập trên/dưới (웃돈, 웃어른) hoặc trước âm căng/âm bật hơi (위쪽).",
        "zh-Hant": "嚴格區分接頭詞'웃-'與'윗-'：存在上下空間對立時使用'윗-'（如윗니/아랫니）；無上下對立關係時使用'웃-'（如웃돈、웃어른）；在送氣音或緊音前則使用'위-'（如위쪽）。",
        "zh-Hans": "严格区分接头词'웃-'与'윗-'：存在上下空间对立时使用'윗-'（如윗니/아랫니）；无上下对立关系时使用'웃-'（如웃돈、웃어른）；在送气音或紧音前则使用'위-'（如위쪽）。",
        "ja": "接頭辞'웃-'と'윗-'の使い分けを規定します。上下の明確な対立が存在する場合は'윗-'（윗니/아랫니）を用い、上下の対照概念がない場合（웃돈、웃어른）や濃音・激音の前（위쪽）では'웃-'または'위-'を用います。"
    },
    "p1-a14": {
        "en": "Adopts abbreviated forms as the sole standard when the full original forms have become archaic and fallen completely out of spoken use.",
        "vi": "Chọn dạng rút gọn làm chuẩn duy nhất khi dạng đầy đủ ban đầu đã trở thành từ cổ và không còn được sử dụng trong giao tiếp hiện đại.",
        "zh-Hant": "當詞彙之縮略形已完全取代本形態且本形態已完全退出日常口語時，將縮略形態定為唯一標準語。",
        "zh-Hans": "当词汇之缩略形已完全取代本形态且本形态已完全退出日常口语时，将缩略形态定为唯一标准语。",
        "ja": "略語（短縮形）が広く用いられ、元の完全な形態が日常会話から消滅した語彙について、略語のみを標準語として認める条項です。"
    },
    "p1-a15": {
        "en": "Recognizes both the full form and the abbreviated form as dual standards when both are actively and widely utilized by native speakers.",
        "vi": "Công nhận cả dạng đầy đủ và dạng rút gọn làm chuẩn kép khi cả hai đều được người bản xứ sử dụng rộng rãi và có tần suất tương đương.",
        "zh-Hant": "本形態與縮略形態在現代語言實踐中均被廣泛運用且並存不悖時，兩者皆認可為複數標準語（如노을與놀）。",
        "zh-Hans": "本形态与缩略形态在现代语言实践中均被广泛运用且并存不悖时，两者皆认可为复数标准语（如노을与놀）。",
        "ja": "元の形と縮約形がともに言語生活において頻繁に使用され定着している場合、両形態をともに標準語（複数標準語）として公認する規定です。"
    },
    "p1-a16": {
        "en": "Selects the contracted form as standard when spoken efficiency has permanently displaced the cumbersome compound structure.",
        "vi": "Chọn dạng co cụm rút gọn làm chuẩn khi hiệu quả giao tiếp đã thay thế hoàn toàn cấu trúc từ phức cồng kềnh trước đây.",
        "zh-Hant": "因語言表達之高效性，使緊縮形態在口語中徹底佔據優勢並排除複合構造時，將緊縮形定為標準語。",
        "zh-Hans": "因语言表达之高效性，使紧缩形态在口语中彻底占据优势并排除复合构造时，将紧缩形定为标准语。",
        "ja": "言語の経済性により短縮形態が完全に定着し、元の複合的な形を淘汰した場合、短縮形を標準語に選定する規定です。"
    },
    "p1-a17": {
        "en": "Eliminates non-standard phonetic variants, establishing a single authoritative form for words prone to colloquial pronunciation confusion.",
        "vi": "Loại bỏ các biến thể ngữ âm sai lệch trong khẩu ngữ, thiết lập dạng chuẩn duy nhất cho các từ dễ bị nhầm lẫn phát âm.",
        "zh-Hant": "清理易混淆之各類口語語音變體，為發音多樣的詞彙明確唯一權威之單數標準語形態。",
        "zh-Hans": "清理易混淆之各类口语语音变体，为发音多样的词汇明确唯一权威之单数标准语形态。",
        "ja": "発音のゆらぎや俗音が生まれやすい単語について、標準的な単一形態を厳格に指定し、非標準的な変異形を整理する規定です。"
    },
    "p1-a18": {
        "en": "Recognizes multiple standard pronunciations resulting from sound change when differing variants are equally entrenched across standard speech communities.",
        "vi": "Công nhận nhiều cách phát âm chuẩn phát sinh từ biến đổi âm khi các biến thể khác nhau đều đã ăn sâu vững chắc trong cộng đồng người nói tiếng Hàn chuẩn.",
        "zh-Hant": "因語音演變導致不同發音形態在標準語使用者群體中均具不可忽視之廣泛使用度時，認可為複數標準語。",
        "zh-Hans": "因语音演变导致不同发音形态在标准语使用者群体中均具不可忽视之广泛使用度时，认可为复数标准语。",
        "ja": "発音変化の結果、複数の異なる発音形態が教養層の言語生活に均等に定着している場合、それらすべてを標準語として認める条項です。"
    },
    "p1-a19": {
        "en": "Standardizes words that diverged from a common origin but evolved distinct semantic meanings and morphological shapes.",
        "vi": "Chuẩn hóa các từ vốn có chung nguồn gốc từ nguyên nhưng đã phân hóa thành các nghĩa và hình thái riêng biệt trong tiếng Hàn hiện đại.",
        "zh-Hant": "針對系出同源但在歷史演變中分化出各自獨立語義與形態之詞彙，分別賦予各自之標準語地位。",
        "zh-Hans": "针对系出同源但在历史演变中分化出各自独立语义与形态之词汇，分别赋予各自之标准语地位。",
        "ja": "同一起源の語彙が時間の経過とともに意味や形態を分化させ、別々の単語として定着した場合、それぞれを固有の標準語として認定します。"
    },
    "p1-a20": {
        "en": "Discards archaic and dead words that are no longer part of active modern communication, standardizing exclusively living vocabulary.",
        "vi": "Loại bỏ các từ cổ và từ chết không còn được sử dụng trong giao tiếp hiện đại, chỉ chuẩn hóa các từ vựng đang thực sự sống trong ngôn ngữ đương đại.",
        "zh-Hant": "廢止不再具有生命力之古語及死語，僅將現代生活中具有實際交際功能之活躍詞彙納入標準語體系。",
        "zh-Hans": "废止不再具有生命力之古语及死语，仅将现代生活中具有实际交际功能之活跃词汇纳入标准语体系。",
        "ja": "現代の日常言語生活で使用されなくなった古語や死語を標準語から除外し、現代の生きた語彙のみを標準語として公認する規定です。"
    },
    "p1-a21": {
        "en": "Adopts regional dialect words as the nationwide standard when they have gained overwhelming popularity and completely displaced original Seoul terms (e.g., 멍게).",
        "vi": "Công nhận các từ ngữ vốn là phương ngữ vùng miền làm chuẩn toàn quốc khi chúng đã trở nên phổ biến áp đảo và thay thế hoàn toàn từ gốc Seoul.",
        "zh-Hant": "當某一地方方言詞彙在全體國民之實際使用中獲得壓倒性普及並徹底取代原首爾話時，破格吸收該方言為國家標準語（如멍게）。",
        "zh-Hans": "当某一地方方言词汇在全体国民之实际使用中获得压倒性普及并彻底取代原首尔话时，破格吸收该方言为国家标准语（如멍게）。",
        "ja": "元々は地方方言であった語彙が、国民全体に圧倒的に普及して旧来のソウル言葉を完全に駆逐した場合、その方言形を国家標準語に昇格させる条項です。"
    },
    "p1-a22": {
        "en": "Establishes unified standards between native Korean and Sino-Korean competitive word pairs based on actual prevailing usage.",
        "vi": "Thiết lập chuẩn thống nhất giữa các cặp từ thuần Hàn và từ gốc Hán có sự cạnh tranh, dựa trên mức độ sử dụng thực tế chiếm ưu thế.",
        "zh-Hant": "在固有詞與漢字詞競爭並存之詞彙中，依據全體國民日常使用之主導地位，確定權威之單數標準語形態。",
        "zh-Hans": "在固有词与汉字词竞争并存之词汇中，依据全体国民日常使用之主导地位，确定权威之单数标准语形态。",
        "ja": "固有語と漢字語が競合する単語群において、現代人の実際の使用実態に基づき、優勢な語彙を単一の標準語として確定する規定です。"
    },
    "p1-a23": {
        "en": "Differentiates genuine standard terms from competing dialectal forms, selecting standard expressions across general semantic domains.",
        "vi": "Phân biệt rõ ràng giữa từ chuẩn đích thực và các dạng phương ngữ cạnh tranh, lựa chọn dạng chuẩn đại diện trong các lĩnh vực ngữ nghĩa thông thường.",
        "zh-Hant": "在各類方言與標準語之競爭形態中，排查並明確確立通用於規範語境之單數標準語詞彙。",
        "zh-Hans": "在各类方言与标准语之竞争形态中，排查并明确确立通用于规范语境之单数标准语词汇。",
        "ja": "方言と標準語の語形が対立する場合、教養層の普遍的使用実態を調査し、規範的な標準語彙を厳選・明示する条項です。"
    },
    "p1-a24": {
        "en": "Recognizes dialectal terms alongside standard terms when regional forms have acquired distinctive semantic nuances enrichingly distinct from the original term.",
        "vi": "Công nhận cả từ phương ngữ song song với từ chuẩn khi dạng vùng miền đã phát triển được nét nghĩa sắc thái độc đáo làm phong phú thêm cho ngôn ngữ.",
        "zh-Hant": "當某些地方方言詞彙在演變中衍生出有別於原標準語之獨特微妙語義時，同時賦予兩者標準語資格，豐富語言表現力。",
        "zh-Hans": "当某些地方方言词汇在演变中衍生出有别于原标准语之独特微妙语义时，同时赋予两者标准语资格，丰富语言表现力。",
        "ja": "方言起源の語が、元の標準語とは微妙に異なる固有のニュアンスや意味領域を獲得した場合、両者を標準語として認め表現を豊かにする規定です。"
    },
    "p1-a25": {
        "en": "Unifies competitive synonyms and variants into singular authoritative standard forms to prevent linguistic fragmentation.",
        "vi": "Thống nhất các từ đồng nghĩa và biến thể cạnh tranh thành các dạng chuẩn duy nhất để tránh sự phân mảnh và rối loạn ngôn ngữ.",
        "zh-Hant": "對意思大體相同但形態互異之競爭詞彙進行精簡梳理，淘汰劣勢形態，確立高度凝練之單數標準形態。",
        "zh-Hans": "对意思大体相同但形态互异之竞争词汇进行精简梳理，淘汰劣势形态，确立高度凝练之单数标准形态。",
        "ja": "同義・類義の競合語彙を整理し、劣勢となった異形態を排除して、効率的な言語生活のための単一標準語を確定する規定です。"
    },
    "p1-a26": {
        "en": "Authorizes rich multiple standard vocabulary entries when multiple synonymous words are equally prestigious and widespread in modern Korean literature and speech.",
        "vi": "Cho phép công nhận nhiều dạng từ chuẩn phong phú khi các từ đồng nghĩa có uy tín và mức độ phổ biến ngang nhau trong văn học và đời sống hiện đại.",
        "zh-Hant": "規範韓語中最豐富之複數標準語庫。當多個同義詞彙在全民語言生活中地位均等、使用頻率不相上下時，全部認定為合法標準語（如가뭄與가물）。",
        "zh-Hans": "规范韩语中最丰富之复数标准语库。当多个同义词汇在全民语言生活中地位均等、使用频率不相上下时，全部认定为合法标准语（如가뭄与가물）。",
        "ja": "同義語が教養層の言語生活において等しく重用され、優劣を付け難い場合、豊かな表現力を保障するために両者を複数標準語として全面的に公認します。"
    },

    # Part 2: Standard Pronunciation Rules (제2부 표준 발음법)
    "p2-a1": {
        "en": "Enacts the master canon of Korean pronunciation: standard pronunciation follows actual educated usage while respecting the grammatical tradition and rational harmony of the language.",
        "vi": "Ban hành nguyên tắc tối cao của cách phát âm tiếng Hàn: phát âm chuẩn phải tuân theo cách phát âm thực tế của người có học thức, đồng thời tôn trọng tính truyền thống và tính hợp lý của ngữ pháp dân tộc.",
        "zh-Hant": "確立韓國標準發音法之最高大原則：以標準語之實際語音為基準，同時充分尊重國語之歷史傳統性與現代合理性，達到規範與現實之完美平衡。",
        "zh-Hans": "确立韩国标准发音法之最高大原则：以标准语之实际语音为基准，同时充分尊重国语之历史传统性与现代合理性，达到规范与现实之完美平衡。",
        "ja": "韓国語標準発音法の最高原則を規定します。標準語の実際の発音に従うことを大原則としつつ、国語の伝統性と合理性を考慮して規範を制定します。"
    },
    "p2-a2": {
        "en": "Defines the 19 consonant phonemes of modern standard Korean and regulates their canonical phonetic realization across syllables.",
        "vi": "Định nghĩa hệ thống 19 phụ âm của tiếng Hàn tiêu chuẩn hiện đại và quy định cách phát âm chuẩn xác của chúng trong các âm tiết.",
        "zh-Hant": "確立現代標準韓語之19個子音音素體系（平音、激音、緊音），規範其在語流各音節中之標準語音實現。",
        "zh-Hans": "确立现代标准韩语之19个辅音音素体系（平音、激音、紧音），规范其在语流各音节中之标准语音实现。",
        "ja": "現代標準韓国語を構成する19個の子音音素体系を定義し、各音節における正確な調音・発音基準を規定します。"
    },
    "p2-a3": {
        "en": "Establishes the 10 monophthong system (ㅏ, ㅐ, ㅓ, ㅔ, ㅗ, ㅚ, ㅜ, ㅟ, ㅡ, ㅣ), while permitting 'ㅚ' and 'ㅟ' to be pronounced as diphthongs [we] and [wi] in natural speech.",
        "vi": "Thiết lập hệ thống 10 nguyên âm đơn, đồng thời cho phép 'ㅚ' và 'ㅟ' được phát âm linh hoạt như nguyên âm đôi [we] và [wi] trong giao tiếp tự nhiên.",
        "zh-Hant": "確立10個單母音體系，同時因應現代言語實際，寬容允許'ㅚ'與'ㅟ'在口語中實現為雙母音[we]與[wi]。",
        "zh-Hans": "确立10个单母音体系，同时因应现代语言实际，宽容允许'ㅚ'与'ㅟ'在口语中实现为双母音[we]与[wi]。",
        "ja": "10個の単母音体系を規定します。あわせて実際の言語生活における調音実態を考慮し、'ㅚ'と'ㅟ'については二重母音[we]、[wi]としての発音も標準として許容します。"
    },
    "p2-a4": {
        "en": "Specifies the 11 diphthongs of modern Korean and governs their glide articulatory dynamics.",
        "vi": "Quy định hệ thống 11 nguyên âm đôi của tiếng Hàn hiện đại và hướng dẫn động thái phát âm lướt của chúng.",
        "zh-Hant": "規範現代韓語之11個雙母音體系，明確半母音滑音結合之標準動態發音規則。",
        "zh-Hans": "规范现代韩语之11个双母音体系，明确半母音滑音结合之标准动态发音规则。",
        "ja": "現代韓国語の11個の二重母音体系を明示し、半母音と単母音の滑らかな結合発音の基準を定めています。"
    },
    "p2-a5": {
        "en": "Regulates the intricate pronunciations of vowel 'ㅢ': pronounced [ㅣ] after consonants (희망[히망]), permitted as [ㅣ] in non-initial syllables (주의[주의/주이]), and permitted as [ㅔ] when functioning as the possessive particle '의'.",
        "vi": "Quy định quy tắc phát âm chi tiết của nguyên âm 'ㅢ': phát âm là [ㅣ] khi đi sau phụ âm (희망[히망]), cho phép phát âm là [ㅣ] ở âm tiết không phải âm đầu (주의[주이]), và cho phép phát âm là [ㅔ] khi là trợ từ sở hữu '의'.",
        "zh-Hant": "詳細規範母音'ㅢ'之多重標準發音法：有輔音初聲時發為[ㅣ]（如희망[히망]）；非詞首音節允許發為[ㅣ]（如주의[주이]）；作為屬格助詞'의'時允許發為[ㅔ]。",
        "zh-Hans": "详细规范母音'ㅢ'之多重标准发音法：有辅音初声时发为[ㅣ]（如희망[히망]）；非词首音节允许发为[ㅣ]（如주의[주이]）；作为属格助词'의'时允许发为[ㅔ]。",
        "ja": "極めて重要で複雑な母音'ㅢ'の発音基準を定めます。子音初声を持つ場合は[ㅣ]（희망[히망]）、単語の第2音節以降では[ㅣ]（주의[주이]）、所有格助詞の'의'は[ㅔ]と発音することを許容します。"
    },
    "p2-a6": {
        "en": "Codifies the distinction between long and short vowel quantities in standard Korean, which serves a phonemic semantic role in word disambiguation (e.g., 눈[눈ː] snow vs 눈[눈] eye).",
        "vi": "Quy định sự phân biệt độ dài ngắn của nguyên âm trong tiếng Hàn chuẩn, đóng vai trò phân biệt nghĩa của từ (ví dụ: 눈[눈ː] tuyết vs 눈[눈] mắt).",
        "zh-Hant": "規範標準語中母音長短音之辨義功能（如눈[눈ː]雪 vs 눈[눈]眼），確立母音音長之標準區分基準。",
        "zh-Hans": "规范标准语中母音长短音之辨义功能（如눈[눈ː]雪 vs 눈[눈]眼），确立母音音长之标准区分基准。",
        "ja": "単語の意味を弁別する重要な音韻機能である母音の長音と短音の区別（例：雪の눈[눈ː]と目の눈[눈]）を標準発音として規定します。"
    },
    "p2-a7": {
        "en": "Establishes the phonetic rule where long vowels are neutralized and shortened when moved to the second syllable or beyond, with exceptions for lexical compounds.",
        "vi": "Thiết lập quy tắc ngữ âm trong đó nguyên âm dài sẽ bị rút ngắn lại khi nằm ở âm tiết thứ hai trở đi trong từ, kèm các trường hợp ngoại lệ trong từ ghép.",
        "zh-Hant": "確立長音在後續第二音節以下出現時自然縮短為短音的音韻中和律，並規定複合詞等特殊例外情況。",
        "zh-Hans": "确立长音在后续第二音节以下出现时自然缩短为短音的音韵中和律，并规定复合词等特殊例外情况。",
        "ja": "本来は長音である母音であっても、単語の第2音節以降に位置する場合には原則として短音化するという音韻中和則と、その例外を規定しています。"
    },
    "p2-a8": {
        "en": "Enacts the famous 7-representative final consonant (Batchim) rule: only seven consonant sounds [ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ] are pronounced at word endings or before consonants.",
        "vi": "Ban hành quy tắc 7 phụ âm cuối (Batchim) đại diện kinh điển: chỉ có 7 âm [ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ] được thực tế phát âm ở cuối từ hoặc trước phụ âm khác.",
        "zh-Hant": "確立著名的終聲七代表音原則：所有單收音及雙收音在詞尾或輔音前，僅能實現為[ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ]七個代表音之一。",
        "zh-Hans": "确立著名的终声七代表音原则：所有单收音及双收音在词尾或辅音前，仅能实现为[ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ]七个代表音之一。",
        "ja": "韓国語音韻論の基本である終声（パッチム）7代表音原則を定めます。語末または子音の前では、すべてのパッチムは[ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ]の7音のみに中和されます。"
    },
    "p2-a9": {
        "en": "Regulates the neutralization of final consonants 'ㄲ, ㅋ' -> [ㄱ], 'ㅅ, ㅆ, ㅈ, ㅊ, ㅌ' -> [ㄷ], and 'ㅍ' -> [ㅂ] at the end of words or before consonants.",
        "vi": "Quy định sự trung hòa các phụ âm cuối: 'ㄲ, ㅋ' phát âm là [ㄱ], 'ㅅ, ㅆ, ㅈ, ㅊ, ㅌ' phát âm là [ㄷ], và 'ㅍ' phát âm là [ㅂ] khi đứng ở cuối từ hoặc trước phụ âm.",
        "zh-Hant": "明確單收音與雙收音之代表音歸宿：收音'ㄲ, ㅋ'讀作[ㄱ]；'ㅅ, ㅆ, ㅈ, ㅊ, ㅌ'讀作[ㄷ]；'ㅍ'讀作[ㅂ]。",
        "zh-Hans": "明确单收音与双收音之代表音归宿：收音'ㄲ, ㅋ'读作[ㄱ]；'ㅅ, ㅆ, ㅈ, ㅊ, ㅌ'读作[ㄷ]；'ㅍ'读作[ㅂ]。",
        "ja": "パッチム'ㄲ, ㅋ'は[ㄱ]に、'ㅅ, ㅆ, ㅈ, ㅊ, ㅌ'は[ㄷ]に、'ㅍ'は[ㅂ]に代表音化する規則を具体的に例示・規定しています。"
    },
    "p2-a10": {
        "en": "Governs complex double final consonants (겹받침) 'ㄳ', 'ㄵ', 'ㄼ, ㄽ, ㄾ', 'ㅄ': the first consonant is pronounced (e.g., 넓다[널따]), with critical exceptions like 밟다[밥ː따] and specific compounds of 넓- [넙-].",
        "vi": "Quy định cách phát âm các phụ âm kép 'ㄳ', 'ㄵ', 'ㄼ, ㄽ, ㄾ', 'ㅄ': phát âm phụ âm phía trước (ví dụ 넓다[널따]), kèm các ngoại lệ quan trọng như 밟다[밥ː따] và một số từ phái sinh của 넓- [넙-].",
        "zh-Hant": "規範二重雙收音'ㄳ', 'ㄵ', 'ㄼ, ㄽ, ㄾ', 'ㅄ'之簡化發音：原則上發前方輔音（如넓다[널따]），但嚴格規定'밟다'必須讀為[밥ː따]以及넓-之特定衍生詞讀為[넙-]之重大例外。",
        "zh-Hans": "规范二重双收音'ㄳ', 'ㄵ', 'ㄼ, ㄽ, ㄾ', 'ㅄ'之简化发音：原则上发前方辅音（如넓다[널따]），但严格规定'밟다'必须读为[밥ː따]以及넓-之特定衍生词读为[넙-]之重大例外。",
        "ja": "二重パッチム'ㄳ', 'ㄵ', 'ㄼ, ㄽ, ㄾ', 'ㅄ'の発音規定です。原則として前の文字を発音しますが、'밟다'は[밥ː따]、'넓-'の特定の派生語は[넙-]と発音する重要例外を明示します。"
    },
    "p2-a11": {
        "en": "Governs double final consonants 'ㄺ, ㄻ, ㄿ': the second consonant is pronounced (e.g., 닭[닥], 삶[삼]), with the essential predicate exception where 'ㄺ' is pronounced [ㄹ] before a suffix beginning with 'ㄱ' (맑게[말께]).",
        "vi": "Quy định cách phát âm các phụ âm kép 'ㄺ, ㄻ, ㄿ': phát âm phụ âm phía sau (닭[닥], 삶[삼]), với ngoại lệ thiết yếu là khi 'ㄺ' đứng trước đuôi bắt đầu bằng 'ㄱ' thì phát âm là [ㄹ] (맑게[말께]).",
        "zh-Hant": "規範二重雙收音'ㄺ, ㄻ, ㄿ'之發音：原則上發後方輔音（如닭[닥]、삶[삼]），但核心例外為用言詞幹末尾之'ㄺ'在以'ㄱ'起始之詞尾前必須讀作[ㄹ]（如맑게[말께]）。",
        "zh-Hans": "规范二重双收音'ㄺ, ㄻ, ㄿ'之发音：原则上发后方辅音（如닭[닥]、삶[삼]），但核心例外为用言词干末尾之'ㄺ'在以'ㄱ'起始之词尾前必须读作[ㄹ]（如맑게[말께]）。",
        "ja": "二重パッチム'ㄺ, ㄻ, ㄿ'の発音規定です。原則として後ろの文字を発音しますが（닭[닥]）、用言語幹末の'ㄺ'が'ㄱ'で始まる語尾の前にある場合は[ㄹ]と発音する（맑게[말께]）例外を定めます。"
    },
    "p2-a12": {
        "en": "Exhaustively regulates the phonological behaviors of final consonant 'ㅎ': aspiration with plain stops ([ㅎ]+[ㄱ,ㄷ,ㅈ]->[ㅋ,ㅌ,ㅊ]), tensification before 'ㅅ' ([ㅎ]+[ㅅ]->[ㅆ]), nasal assimilation before 'ㄴ', and complete silent elision before vowels.",
        "vi": "Quy định toàn diện hành vi âm vị học của phụ âm cuối 'ㅎ': tạo âm bật hơi khi gặp âm tắc ([ㅎ]+[ㄱ,ㄷ,ㅈ]->[ㅋ,ㅌ,ㅊ]), căng âm hóa trước 'ㅅ' ([ㅎ]+[ㅅ]->[ㅆ]), biến thành âm mũi trước 'ㄴ', và biến mất hoàn toàn trước nguyên âm.",
        "zh-Hant": "全方位規範收音'ㅎ'之複雜音變：與平音相遇產生送氣音激音化（[ㅎ]+[ㄱ,ㄷ,ㅈ]→[ㅋ,ㅌ,ㅊ]）；在'ㅅ'前引發緊音化；在'ㄴ'前鼻音化；在母音詞尾前則徹底脫落不發音。",
        "zh-Hans": "全方位规范收音'ㅎ'之复杂音变：与平音相遇产生送气音激音化（[ㅎ]+[ㄱ,ㄷ,ㅈ]→[ㅋ,ㅌ,ㅊ]）；在'ㅅ'前引发紧音化；在'ㄴ'前鼻音化；在母音词尾前则彻底脱落不发音。",
        "ja": "パッチム'ㅎ'の多様な音韻変化を包括的に規定します。平音との激音化（[ㅎ]+[ㄱ,ㄷ,ㅈ]→[ㅋ,ㅌ,ㅊ]）、'ㅅ'の前での濃音化、'ㄴ'の前での鼻音化、母音語尾の前での完全脱落（無音化）を定めます。"
    },
    "p2-a13": {
        "en": "Establishes the basic liaison (연음) rule: single or double identical final consonants carry over directly to the onset of a following syllable starting with a vowel-initial grammatical morpheme.",
        "vi": "Thiết lập quy tắc nối âm (연음) cơ bản: phụ âm cuối đơn hoặc kép liền kề sẽ được chuyển thẳng sang làm âm đầu của âm tiết tiếp theo bắt đầu bằng nguyên âm trong hình thái từ ngữ pháp.",
        "zh-Hant": "確立基本連音（移聲）法則：單收音或雙收音遇以母音起始之語法形式形態素（助詞、詞尾、接尾辭）時，保留原音值直接移至後字初聲發音。",
        "zh-Hans": "确立基本连音（移声）法则：单收音或双收音遇以母音起始之语法形式形态素（助词、词尾、接尾辞）时，保留原音值直接移至后字初声发音。",
        "ja": "韓国語の基本連音法則を規定します。単パッチムや二重パッチムの後に母音で始まる形式形態素（助詞、語尾、接尾辞）が続く場合、本来の音価のまま次の音節の初声に移して発音します。"
    },
    "p2-a14": {
        "en": "Governs double final consonant liaison: when followed by a vowel-initial grammatical morpheme, the first consonant remains in the coda while only the second consonant transfers to the next onset.",
        "vi": "Quy định quy tắc nối âm đối với phụ âm kép: khi theo sau bởi hình thái ngữ pháp bắt đầu bằng nguyên âm, phụ âm thứ nhất giữ lại làm phụ âm cuối và chỉ phụ âm thứ hai chuyển sang làm âm đầu tiếp theo.",
        "zh-Hant": "規範二重雙收音之連音律：當後接母音起始之形式形態素時，前一輔音留在收音位置，僅將後一輔音移至後字初聲發音（如닭을[달글]）。",
        "zh-Hans": "规范二重双收音之连音律：当后接母音起始之形式形态素时，前一辅音留在收音位置，仅将后一辅音移至后字初声发音（如닭을[달글]）。",
        "ja": "二重パッチムの連音規則です。母音で始まる形式形態素が後続する場合、第1子音は終声に留まり、第2子音のみが次の初声に移って発音されます（例：닭을[달글]）。"
    },
    "p2-a15": {
        "en": "Regulates liaison before substantive morphemes: when followed by a substantive root starting with a vowel, the coda first neutralizes to its 7-representative sound before linking over.",
        "vi": "Quy định quy tắc nối âm trước hình thái từ thực từ: khi đứng trước một từ thực chất bắt đầu bằng nguyên âm, phụ âm cuối phải chuyển về âm đại diện trong 7 âm trước rồi mới nối âm sang.",
        "zh-Hant": "規範實質形態素前之特殊連音：當收音後接以母音起始之實質形態素（如名詞實詞）時，收音必須先簡化為7代表音之一，再移至後字初聲連音發音。",
        "zh-Hans": "规范实质形态素前之特殊连音：当收音后接以母音起始之实质形态素（如名词实词）时，收音必须先简化为7代表音之一，再移至后字初声连音发音。",
        "ja": "実質形態素（自立語）が後続する場合の連音規則です。母音で始まる実質形態素の前では、パッチムは一旦7代表音に中和された後に、その中和された音が後続音節に移って発音されます。"
    },
    "p2-a16": {
        "en": "Governs the conventional pronunciation of Hangeul consonant letter names when followed by vowel particles, codifying traditional colloquial exceptions like 디귿이[디그시].",
        "vi": "Quy định cách phát âm theo quy ước của tên gọi các chữ cái Hangeul khi đi với tiểu từ bắt đầu bằng nguyên âm, ghi nhận các ngoại lệ truyền thống như 디귿이[디그시].",
        "zh-Hant": "專項規範韓語諺文字母名稱後接母音助詞時之讀法，容許並法定化歷史俗成特例（如디귿이讀作[디그시]）。",
        "zh-Hans": "专项规范韩语谚文字母名称后接母音助词时之读法，容许并法定化历史俗成特例（如디귿이读作[디그시]）。",
        "ja": "ハングルの字母名の後に母音助詞が続く場合の慣用的な発音例外を規定します（例：'디귿이'を[디그시]と発音する慣習の公認）。"
    },
    "p2-a17": {
        "en": "Codifies palatalization (구개음화): codas 'ㄷ, ㅌ' followed by grammatical suffix '이' or '히' shift smoothly to postalveolar affricates [ㅈ, ㅊ] (e.g., 굳이[구지], 같이[가치]).",
        "vi": "Quy định hiện tượng vòm hóa (구개음화): phụ âm cuối 'ㄷ, ㅌ' khi đi trước hậu tố '이' hoặc '히' sẽ chuyển phát âm thành [ㅈ, ㅊ] (ví dụ: 굳이[구지], 같이[가치]).",
        "zh-Hant": "確立著名的口蓋音化（顎化）規則：收音'ㄷ, ㅌ'在接尾辭'이'或'히'前，與母音結合順向演變為塞擦音[ㅈ, ㅊ]（如굳이[구지]、같이[가치]）。",
        "zh-Hans": "确立著名的口盖音化（颚化）规则：收音'ㄷ, ㅌ'在接尾辞'이'或'히'前，与母音结合顺向演变为塞擦音[ㅈ, ㅊ]（如굳이[구지]、같이[가치]）。",
        "ja": "口蓋音化の規則を規定します。終声の'ㄷ, ㅌ'が調査や接尾辞の'이'または'히'と出会うと、破擦音の[ㅈ, ㅊ]に変化して発音されます（例：굳이[구지]、같이[가치]）。"
    },
    "p2-a18": {
        "en": "Regulates primary nasal assimilation: stop codas 'ㄱ, ㄷ, ㅂ' shift to nasals [ㅇ, ㄴ, ㅁ] when immediately followed by nasal consonants 'ㄴ, ㅁ' (e.g., 국물[궁물], 밥물[밤물]).",
        "vi": "Quy định quy tắc đồng hóa mũi cơ bản: các âm tắc cuối 'ㄱ, ㄷ, ㅂ' sẽ biến đổi thành âm mũi [ㅇ, ㄴ, ㅁ] khi đứng trước các phụ âm mũi 'ㄴ, ㅁ' (ví dụ: 국물[궁물], 밥물[밤물]).",
        "zh-Hant": "規範第一類鼻音化同化規則：塞音收音'ㄱ, ㄷ, ㅂ'在鼻音輔音'ㄴ, ㅁ'前，調音方式發生同化，分別轉化為鼻音[ㅇ, ㄴ, ㅁ]（如국물[궁물]、밥물[밤물]）。",
        "zh-Hans": "规范第一类鼻音化同化规则：塞音收音'ㄱ, ㄷ, ㅂ'在鼻音辅音'ㄴ, ㅁ'前，调音方式发生同化，分别转化为鼻音[ㅇ, ㄴ, ㅁ]（如국물[궁물]、밥물[밤물]）。",
        "ja": "代表的な鼻音化規則を定めます。パッチム'ㄱ, ㄷ, ㅂ'の後に鼻音'ㄴ, ㅁ'が続く場合、調音方法が同化してそれぞれ[ㅇ, ㄴ, ㅁ]に変化します（例：국물[궁물]、밥물[밤물]）。"
    },
    "p2-a19": {
        "en": "Regulates secondary nasal assimilation: liquid 'ㄹ' shifts to nasal [ㄴ] when preceded by nasal consonants 'ㅁ, ㅇ' or stops (e.g., 침략[침냑], 종로[종노], 백로[뱅노]).",
        "vi": "Quy định quy tắc đồng hóa mũi thứ cấp: âm lướt 'ㄹ' biến thành âm mũi [ㄴ] khi đứng sau các phụ âm mũi 'ㅁ, ㅇ' hoặc âm tắc (ví dụ: 침략[침냑], 종로[종노], 백로[뱅노]).",
        "zh-Hant": "規範第二類鼻音化規則：流音'ㄹ'在鼻音收音'ㅁ, ㅇ'或塞音後，順應弱化為鼻音[ㄴ]發音（如침략[침냑]、종로[종노]）。",
        "zh-Hans": "规范第二类鼻音化规则：流音'ㄹ'在鼻音收音'ㅁ, ㅇ'或塞音后，顺应弱化为鼻音[ㄴ]发音（如침략[침냑]、종로[종노]）。",
        "ja": "流音の鼻音化規則を定めます。鼻音パッチム'ㅁ, ㅇ'の後に'ㄹ'が続く場合、'ㄹ'が[ㄴ]に変化して発音されます（例：침략[침냑]、종로[종노]）。"
    },
    "p2-a20": {
        "en": "Governs liquidization (유음화): nasal 'ㄴ' converts to liquid [ㄹ] when meeting 'ㄹ' either progressively or regressively, producing a smooth [ㄹㄹ] geminate (e.g., 난로[날로], 신라[실라]).",
        "vi": "Quy định quy tắc lưu âm hóa (lỏng âm hóa): âm mũi 'ㄴ' chuyển hóa thành âm lỏng [ㄹ] khi gặp 'ㄹ' từ phía trước hoặc phía sau, tạo thành cặp âm trơn tru [ㄹㄹ] (ví dụ: 난로[날로], 신라[실라]).",
        "zh-Hant": "確立流音化同化規則：鼻音'ㄴ'與流音'ㄹ'相鄰時，無論順向或逆向，'ㄴ'均同化為[ㄹ]，發出平滑的雙重流音[ㄹㄹ]（如난로[날로]、신라[실라]）。",
        "zh-Hans": "确立流音化同化规则：鼻音'ㄴ'与流音'ㄹ'相邻时，无论顺向或逆向，'ㄴ'均同化为[ㄹ]，发出平滑的双重流音[ㄹㄹ]（如난로[날로]、신라[실라]）。",
        "ja": "流音化（側音化）の規則です。'ㄴ'と'ㄹ'が出会うと、前後の位置を問わず'ㄴ'が[ㄹ]に同化し、滑らかな連続音[ㄹㄹ]として調音されます（例：난로[날로]、신라[실라]）。"
    },
    "p2-a21": {
        "en": "Excludes dialectal non-standard velar/bilabial assimilations (e.g., 문법 -> [뭄뻡]x) from standard speech.",
        "vi": "Loại trừ các hiện tượng đồng hóa phương ngữ phi chuẩn (như 문법 phát âm thành [뭄뻡]) ra khỏi phát âm chuẩn.",
        "zh-Hant": "排除口語中過度之後向同化等非標準音（如문법不應讀作[뭄뻡]），維護調音之規範性。",
        "zh-Hans": "排除口语中过度之后向同化等非标准音（如문법不应读作[뭄뻡]），维护调音之规范性。",
        "ja": "口語で生じがちな過度の逆行同化（例：'문법'を[뭄뻡]と発音すること）を非標準的な訛りとして退ける規定です。"
    },
    "p2-a22": {
        "en": "Rejects 'ㅣ' vowel regressive assimilation in pronunciation, upholding the unmutated standard vowel shapes.",
        "vi": "Bác bỏ hiện tượng đồng hóa ngược nguyên âm 'ㅣ' trong cách phát âm, bảo toàn hình thái nguyên âm chuẩn không bị biến âm.",
        "zh-Hant": "在發音法層面嚴格排除'ㅣ'母音逆行動化發音，堅持標準母音之原本音值。",
        "zh-Hans": "在发音法层面严格排除'ㅣ'母音逆行动化发音，坚持标准母音之原本音值。",
        "ja": "発音においても'ㅣ'逆行同化による変母音的発音を非標準とし、本来の正しい母音の調音を維持することを定めます。"
    },
    "p2-a23": {
        "en": "Enacts basic post-stop tensification (경음화): plain stops 'ㄱ, ㄷ, ㅂ, ㅅ, ㅈ' become tense [ㄲ, ㄸ, ㅃ, ㅆ, ㅉ] when following unreleased stop codas 'ㄱ, ㄷ, ㅂ' (e.g., 국밥[국빱]).",
        "vi": "Quy định quy tắc căng âm hóa (căng âm) cơ bản: các âm thường 'ㄱ, ㄷ, ㅂ, ㅅ, ㅈ' trở thành âm căng [ㄲ, ㄸ, ㅃ, ㅆ, ㅉ] khi đứng sau các phụ âm cuối tắc 'ㄱ, ㄷ, ㅂ' (ví dụ: 국밥[국빱]).",
        "zh-Hant": "確立基本硬音化（濃音化）法則：收音'ㄱ, ㄷ, ㅂ'之後，後續平音'ㄱ, ㄷ, ㅂ, ㅅ, ㅈ'無條件硬化為濃音[ㄲ, ㄸ, ㅃ, ㅆ, ㅉ]（如국밥[국빱]）。",
        "zh-Hans": "确立基本硬音化（浓音化）法则：收音'ㄱ, ㄷ, ㅂ'之后，后续平音'ㄱ, ㄷ, ㅂ, ㅅ, ㅈ'无条件硬化为浓音[ㄲ, ㄸ, ㅃ, ㅆ, ㅉ]（如국밥[국빱]）。",
        "ja": "最も基本的かつ普遍的な濃音化（硬音化）規則です。閉鎖音パッチム'ㄱ, ㄷ, ㅂ'の後では、後続する平音'ㄱ, ㄷ, ㅂ, ㅅ, ㅈ'が必ず濃音[ㄲ, ㄸ, ㅃ, ㅆ, ㅉ]に変化します（例：국밥[국빱]）。"
    },
    "p2-a24": {
        "en": "Governs post-nasal tensification in predicates: plain consonants tensify after verb/adjective stem codas 'ㄴ(ㄵ), ㅁ(ㄻ)' (e.g., 신고[신ː꼬], 삼고[삼ː꼬]).",
        "vi": "Quy định hiện tượng căng âm sau âm mũi trong vị từ: phụ âm thường sẽ bị căng âm hóa sau thân động/tính từ kết thúc bằng phụ âm cuối 'ㄴ(ㄵ), ㅁ(ㄻ)' (ví dụ: 신고[신ː꼬], 삼고[삼ː꼬]).",
        "zh-Hant": "規範謂詞詞幹鼻音後之硬音化：動詞及形容詞詞幹收音為'ㄴ(ㄵ), ㅁ(ㄻ)'時，詞尾之平音必須發生濃音化（如신고[신ː꼬]、삼고[삼ː꼬]）。",
        "zh-Hans": "规范谓词词干鼻音后之硬音化：动词及形容词词干收音为'ㄴ(ㄵ), ㅁ(ㄻ)'时，词尾之平音必须发生浓音化（如신고[신ː꼬]、삼고[삼ː꼬]）。",
        "ja": "用言語幹末における濃音化規則です。用言語幹の終声'ㄴ(ㄵ), ㅁ(ㄻ)'に続く語尾の初声は必ず濃音化します（例：신고[신ː꼬]、삼고[삼ː꼬]）。"
    },
    "p2-a25": {
        "en": "Governs post-lateral tensification in predicates: endings beginning with 'ㄱ, ㄷ, ㅅ, ㅈ' tensify after stem codas 'ㄼ, ㄾ' (e.g., 넓게[널께], 핥다[할따]).",
        "vi": "Quy định căng âm sau âm lỏng trong vị từ: đuôi ngữ pháp bắt đầu bằng 'ㄱ, ㄷ, ㅅ, ㅈ' sẽ bị căng âm sau thân vị từ kết thúc bằng 'ㄼ, ㄾ' (ví dụ: 넓게[널께], 핥다[할따]).",
        "zh-Hant": "規範以'ㄼ, ㄾ'收尾之謂詞詞幹後，詞尾平音'ㄱ, ㄷ, ㅅ, ㅈ'必須發生硬音化發音（如넓게[널께]、핥다[할따]）。",
        "zh-Hans": "规范以'ㄼ, ㄾ'收尾之谓词词干后，词尾平音'ㄱ, ㄷ, ㅅ, ㅈ'必须发生硬音化发音（如넓게[널께]、핥다[할따]）。",
        "ja": "語幹末が'ㄼ, ㄾ'で終わる用言の後で、'ㄱ, ㄷ, ㅅ, ㅈ'で始まる語尾が濃音化する発音基準を規定します（例：넓게[널께]、핥다[할따]）。"
    },
    "p2-a26": {
        "en": "Regulates tensification in Sino-Korean vocabulary: consonants 'ㄷ, ㅅ, ㅈ' tensify following coda 'ㄹ' within Hanja compounds (e.g., 갈등[갈뜨등], 발전[발쩐]).",
        "vi": "Quy định hiện tượng căng âm trong từ Hán-Hàn: các phụ âm 'ㄷ, ㅅ, ㅈ' sẽ bị căng âm hóa khi đi sau phụ âm cuối 'ㄹ' trong các từ gốc Hán (ví dụ: 갈등[갈뜨등], 발전[발쩐]).",
        "zh-Hant": "規範漢字詞中之特定硬音化：在漢字詞內部收音'ㄹ'之後，平音'ㄷ, ㅅ, ㅈ'必須發生濃音化（如갈등[갈뜨등]、발전[발쩐]）。",
        "zh-Hans": "规范汉字词中之特定硬音化：在汉字词内部收音'ㄹ'之后，平音'ㄷ, ㅅ, ㅈ'必须发生浓音化（如갈등[갈뜨등]、발전[발쩐]）。",
        "ja": "漢字語における固有の濃音化規則です。漢字音のパッチム'ㄹ'に後続する'ㄷ, ㅅ, ㅈ'は原則として濃音化します（例：갈등[갈뜨등]、발전[발쩐]）。"
    },
    "p2-a27": {
        "en": "Regulates tensification after the prospective adnominal ending '-(으)ㄹ': following initial consonants tensify in noun modification (e.g., 할 것을[할꺼슬]).",
        "vi": "Quy định hiện tượng căng âm sau đuôi định từ tương lai '-(으)ㄹ': phụ âm đầu của từ theo sau sẽ bị căng âm hóa (ví dụ: 할 것을[할꺼슬]).",
        "zh-Hant": "規範冠形詞形（定語）詞尾'-(으)ㄹ'後之硬音化：修飾後續名詞或不完全名詞時，後字初聲平音必須濃音化（如할 것을[할꺼슬]）。",
        "zh-Hans": "规范冠形词形（定语）词尾'-(으)ㄹ'后之硬音化：修饰后续名词或不完全名词时，后字初声平音必须浓音化（如할 것을[할꺼슬]）。",
        "ja": "連体形語尾'-(으)ㄹ'の後に続く平音の濃音化規則です。後続する依存名詞や実質名詞の初声は濃音化して発音されます（例：할 것을[할꺼슬]）。"
    },
    "p2-a28": {
        "en": "Governs Sai-siot glottal tensification in compound nouns: intervocalic plain stops tensify due to historical morpheme juncture boundaries (e.g., 문고리[문꼬리], 밤길[밤낄]).",
        "vi": "Quy định hiện tượng căng âm do âm đệm Sai-siot trong danh từ ghép: phụ âm thường bị căng âm tại ranh giới kết hợp giữa các từ đơn (ví dụ: 문고리[문꼬리], 밤길[밤낄]).",
        "zh-Hant": "規範複合名詞中之'間隙音（사잇소리）'硬音化：合成詞前後語素結合界限處之平音自然引發濃音化（如문고리[문꼬리]、밤길[밤낄]）。",
        "zh-Hans": "规范复合名词中之'间隙音（사잇소리）'硬音化：合成词前后语素结合界限处之平音自然引发浓音化（如문고리[문꼬리]、밤길[밤낄]）。",
        "ja": "合成名詞におけるサイシオッ（間の音）現象による濃音化を規定します。語素の連結境界において平音が濃音化する発音基準です（例：문고리[문꼬리]、밤길[밤낄]）。"
    },
    "p2-a29": {
        "en": "Regulates 'ㄴ' insertion (ㄴ 첨가): when a compound or derived word joins a preceding consonant with a following element starting with '이, 야, 여, 요, 유', an epenthetic [ㄴ] is inserted (e.g., 맨입[맨닙], 솜이불[솜니불]).",
        "vi": "Quy định quy tắc chèn âm 'ㄴ' (ㄴ 첨가): khi từ ghép hoặc từ phái sinh kết hợp giữa phụ âm trước với phần sau bắt đầu bằng '이, 야, 여, 요, 유', âm [ㄴ] sẽ được tự động chèn vào giữa (ví dụ: 맨입[맨닙], 솜이불[솜니불]).",
        "zh-Hant": "確立著名的'ㄴ'添加音則：在合成詞與派生詞中，前字以輔音收音結尾，後字以'이, 야, 여, 요, 유'起始時，中間必自然插入[ㄴ]輔音（如맨입[맨닙]、솜이불[솜니불]）。",
        "zh-Hans": "确立著名的'ㄴ'添加音则：在合成词与派生词中，前字以辅音收音结尾，后字以'이, 야, 여, 요, 유'起始时，中间必自然插入[ㄴ]辅音（如맨입[맨닙]、솜이불[솜니불]）。",
        "ja": "韓国語合成語の代表的な音節間音挿入である'ㄴ'添加（ㄴ 첨가）規則を定めます。前形態素が子音で終わり、後形態素が'이, 야, 여, 요, 유'で始まる場合、[ㄴ]音が挿入されて発音されます（例：맨입[맨닙]、솜이불[솜니불]）。"
    },
    "p2-a30": {
        "en": "Codifies standard pronunciation of orthographic Sai-siot (사이시옷): words spelled with 'ㅅ' are pronounced with post-coda tensification or nasal insertion [ㄴ, ㄴㄴ] according to phonetic environment.",
        "vi": "Quy định cách phát âm chuẩn của từ có chữ Sai-siot (사이시옷): các từ được viết có chữ 'ㅅ' sẽ được phát âm căng âm hóa hoặc chèn âm mũi [ㄴ, ㄴㄴ] tùy theo môi trường ngữ âm.",
        "zh-Hant": "全方位規範帶有書寫符號'사이시옷（中間ㅅ）'之標準發音法：依據後續音節之性質，分別實現為初聲硬音化、單一鼻音[ㄴ]同化或雙重鼻音[ㄴㄴ]插入。",
        "zh-Hans": "全方位规范带有书写符号'사이시옷（中间ㅅ）'之标准发音法：依据后续音节之性质，分别实现为初声硬音化、单一鼻音[ㄴ]同化或双重鼻音[ㄴㄴ]插入。",
        "ja": "正書法上表記された'サイシオッ（中間ㅅ）'を持つ単語の標準発音法を網羅的に定めます。後続する子音に応じ、初声の濃音化、あるいは[ㄴ]、[ㄴㄴ]の鼻音添加音として発音される基準を規定しています。"
    }
}

# Apply to anchor norms
updated_count = 0
for art in anchor_norms:
    art_id = art["id"]
    # Update Korean full commentary
    full_comm = raw_commentaries.get(art_id, "")
    if full_comm:
        art["i18n"]["ko"]["explanation"] = full_comm
    
    # Update foreign language full explanations
    trans_map = EXPLANATIONS_I18N.get(art_id)
    if trans_map:
        for lang in ["en", "vi", "zh-Hant", "zh-Hans", "ja"]:
            if lang in trans_map and trans_map[lang]:
                art["i18n"][lang]["explanation"] = trans_map[lang]
                updated_count += 1

with open("lib/standards/data/korean_norms_anchor.json", "w", encoding="utf-8") as f:
    json.dump(anchor_norms, f, ensure_ascii=False, indent=2)

print(f"Successfully updated all 56 articles with full multilingual explanations! Total language entries: {updated_count}")
