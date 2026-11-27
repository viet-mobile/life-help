import json
import os

BASE_DIR = "/Users/juboklee/life-project/life-help"
file_path = os.path.join(BASE_DIR, "public/standards/commentary_paragraphs.json")

with open(file_path, "r", encoding="utf-8") as f:
    commentaries = json.load(f)

# Article 30 authoritative 8-paragraph educational translation across all 5 anchor languages
art30_data = [
    {
        "ko": "이 조항은 사이시옷이 표기된 단어의 발음에 대한 규정이다. 첨가된 자음의 종류에 따라 3개의 하위 조항으로 구성되어 있다. 각각의 하위 조항은 ‘ㄷ’이 첨가된 경우, ‘ㄴ’이 첨가된 경우, ‘ㄴㄴ’이 첨가된 경우로 구분할 수 있다.",
        "vi": "Điều này quy định về cách phát âm của các từ được viết có chữ sai-siot (ㅅ). Tùy thuộc vào loại phụ âm được chèn thêm, điều khoản này gồm 3 khoản phụ. Mỗi khoản phụ lần lượt phân chia thành các trường hợp chèn thêm âm 'ㄷ', chèn thêm âm 'ㄴ', và chèn thêm âm 'ㄴㄴ'.",
        "en": "This article governs the pronunciation of words written with sai-siot ('ㅅ'). Depending on the type of consonant inserted, it consists of three sub-clauses. Each sub-clause is classified respectively into cases where 'ㄷ' is added, where 'ㄴ' is added, and where 'ㄴㄴ' is added.",
        "ja": "本条項はサイシオッ（間シ服の'ㅅ'）が表記された単語の発音に関する規定である。添加される子音の種類に応じて3つの下位条項から構成されている。それぞれの下位条項は「ㄷ」が添加される場合、「ㄴ」が添加される場合、「ㄴㄴ」が添加される場合に区分できる。",
        "zh-Hans": "本条是关于带有合音‘ㅅ’（间‘ㅅ’）标记的词汇发音之规定。根据添加辅音的种类由3个子条款构成。各子条款分别区分为添加‘ㄷ’的情形、添加‘ㄴ’的情形以及添加‘ㄴㄴ’的情形。",
        "zh-Hant": "本條是關於帶有合音‘ㅅ’（間‘ㅅ’）標記的詞彙發音之規定。根據添加輔音的種類由3個子條款構成。各子條款分別區分為添加‘ㄷ’的情形、添加‘ㄴ’的情形以及添加‘ㄴㄴ’的情形。"
    },
    {
        "ko": "1. ‘ㄷ’이 첨가되는 경우로 사이시옷이 [ㄷ]으로 발음된 것이다. 사이시옷을 표기한 것은 뒷말의 첫소리가 경음으로 발음되기 때문이다. 사이시옷은 [ㄷ]으로 발음하는 경우와 사이시옷을 발음하지 않는 경우 모두 표준 발음으로 인정하되, 발음하지 않는 쪽을 원칙으로 삼고 [ㄷ]으로 발음하는 것도 허용하고 있다. 즉 ‘깃발’의 경우 [기빨]이 원칙이고 [긷빨]도 허용하는 것이다. 이처럼 사이시옷을 발음하지 않는 쪽을 원칙으로 삼은 이유는 크게 두 가지이다.",
        "vi": "1. Trường hợp thêm âm 'ㄷ', tức là chữ sai-siot được phát âm thành [ㄷ]. Sở dĩ viết chữ sai-siot là vì âm đầu của từ sau được phát âm thành âm căng. Sai-siot được công nhận là phát âm chuẩn trong cả trường hợp phát âm thành [ㄷ] lẫn trường hợp không phát âm sai-siot, nhưng lấy việc không phát âm làm nguyên tắc chính và cho phép cả cách phát âm thành [ㄷ]. Nghĩa là với từ '깃발' (lá cờ), phát âm [기빨] là nguyên tắc và phát âm [긷빨] cũng được cho phép. Việc lấy cách không phát âm sai-siot làm nguyên tắc chính xuất phát từ hai lý do lớn sau đây.",
        "en": "1. In cases where 'ㄷ' is added, the sai-siot is pronounced as [ㄷ]. The reason sai-siot is written orthographically is that the initial sound of the subsequent word is pronounced as a tense consonant. Both pronouncing sai-siot as [ㄷ] and not pronouncing sai-siot at all are recognized as standard pronunciation; however, non-pronunciation is established as the primary principle while pronouncing [ㄷ] is also permitted. That is, for '깃발' (flag), [기빨] is the rule and [긷빨] is also permissible. There are two major reasons for establishing non-pronunciation as the primary rule.",
        "ja": "1.「ㄷ」が添加される場合で、サイシオッが[ㄷ]として発音されるものである。サイシオッを表記したのは後続語の初声が濃音で発音されるためである。サイシオッは[ㄷ]として発音する場合とサイシオッを発音しない場合の両方を標準発音として認めるが、発音しない方を原則とし、[ㄷ]として発音することも許容している。すなわち「깃발（旗）」の場合、[기빨]が原則であり、[긷빨]も許容される。このようにサイシオッを発音しない方を原則とした理由は大きく2つある。",
        "zh-Hans": "1. 属于添加‘ㄷ’的情形，即合音‘ㅅ’被发音为[ㄷ]。之所以标记合音‘ㅅ’，是因为后接词的初声读作浓音（紧音）。对于合音‘ㅅ’，无论是发音为[ㄷ]还是不发音，均认可为标准发音；但以不发音为原则，同时也允许发音为[ㄷ]。即以‘깃발（旗帜）’为例，[기빨]为原则发音，[긷빨]亦属允许发音。像这样将不发音合音‘ㅅ’作为原则的理由主要有两点。",
        "zh-Hant": "1. 屬於添加‘ㄷ’的情形，即合音‘ㅅ’被發音為[ㄷ]。之所以標記合音‘ㅅ’，是因為後接詞的初聲讀作濃音（緊音）。對於合音‘ㅅ’，無論是發音為[ㄷ]還是不發音，均認可為標準發音；但以不發音為原則，同時也允許發音為[ㄷ]。即以‘깃발（旗幟）’為例，[기빨]為原則發音，[긷빨]亦屬允許發音。像這樣將不發音合音‘ㅅ’作為原則的理由主要有兩點。"
    },
    {
        "ko": "첫째, 한글 맞춤법의 사이시옷 표기 규정(제30항)에 따르면 사이시옷을 표기하는 이유 중 하나는 합성어를 이루는 뒷말의 첫소리가 경음으로 발음되기 때문이지 음이 첨가되었기 때문은 아니다. 한글 맞춤법 조항과의 충돌을 피하기 위해서는 사이시옷을 발음하지 않는 형태를 원칙으로 삼는 것이 유리하다.",
        "vi": "Thứ nhất, theo quy định viết sai-siot trong Quy tắc chính tả Hangeul (Điều 30), một trong những lý do ghi chữ sai-siot là vì âm đầu của từ sau tạo nên từ ghép được phát âm thành âm căng, chứ không phải vì có âm được chèn thêm. Để tránh xung đột với các điều khoản của Quy tắc chính tả Hangeul, việc lấy dạng không phát âm sai-siot làm nguyên tắc sẽ hợp lý và thuận lợi hơn.",
        "en": "First, according to the sai-siot orthography rules in Hangeul Orthography (Article 30), one of the reasons for writing sai-siot is that the initial sound of the following word in the compound is pronounced as a tense consonant, not because an extra sound was phonemically added. In order to avoid conflict with the Hangeul Orthography provisions, it is advantageous to establish the non-pronounced form as the primary rule.",
        "ja": "第一に、ハングル正書法のサイシオッ表記規定（第30項）によれば、サイシオッを表記する理由の一つは、合成語を成す後続語の初声が濃音で発音されるためであり、音が添加されたためではない。ハングル正書法条項との衝突を避けるためには、サイシオッを発音しない形態を原則とすることが合理的である。",
        "zh-Hans": "第一，根据《韩文拼写法》关于合音‘ㅅ’的标记规定（第30条），标记合音‘ㅅ’的理由之一是构成复合词的后接词初声发为浓音，而并非因为添加了额外音素。为了避免与《韩文拼写法》条款发生冲突，以不发音合音‘ㅅ’的形态为原则更为有利。",
        "zh-Hant": "第一，根據《韓文拼寫法》關於合音‘ㅅ’的標記規定（第30條），標記合音‘ㅅ’的理由之一是構成複合詞的後接詞初聲發為濃音，而並非因為添加了額外音素。為了避免與《韓文拼寫法》條款發生衝突，以不發音合音‘ㅅ’的形態為原則更為有利。"
    },
    {
        "ko": "둘째, 현실 발음에서 사이시옷을 [ㄷ]으로 발음하지 않는 형태가 빈번하게 나타나기 때문에 사이시옷을 발음하지 않는 형태를 원칙으로 삼았다.",
        "vi": "Thứ hai, trong thực tế phát âm hàng ngày, dạng không phát âm sai-siot thành [ㄷ] xuất hiện rất thường xuyên, do đó dạng không phát âm sai-siot đã được chọn làm nguyên tắc chính.",
        "en": "Second, in actual spoken reality, the form where sai-siot is not pronounced as [ㄷ] occurs with great frequency; therefore, the non-pronounced form was designated as the primary standard rule.",
        "ja": "第二に、現実の発音においてサイシオッを[ㄷ]として発音しない形態が頻繁に現れるため、サイシオッを発音しない形態を原則とした。",
        "zh-Hans": "第二，在现实日常发音中，不将合音‘ㅅ’读作[ㄷ]的形态极为频繁出现，因此将不发音合音‘ㅅ’的形态确立为原则。",
        "zh-Hant": "第二，在現實日常發音中，不將合音‘ㅅ’讀作[ㄷ]的形態極為頻繁出現，因此將不發音合音‘ㅅ’的形態確立為原則。"
    },
    {
        "ko": "2. ‘ㄴ’이 첨가되는 경우로 사이시옷이 음절 종성에서 [ㄷ]으로 바뀐 후 뒤에 오는 비음에 동화된 결과이다. 표면적으로는 ‘ㄴ’이 첨가되었지만 실제로는 사이시옷이 [ㄷ]으로 발음되는 것과 관련되므로 앞선 1과 통하는 바가 있다. 단, 1에서는 사이시옷을 발음하지 않는 것이 원칙이고 [ㄷ]으로 발음하는 것도 허용했음에 비해 이 조항의 경우 사이시옷을 반드시 [ㄷ]으로 발음해야만 ‘ㄴ’으로 동화될 수 있다는 점에서 차이가 있다.",
        "vi": "2. Trường hợp thêm âm 'ㄴ', là kết quả sau khi chữ sai-siot đổi thành [ㄷ] ở phụ âm cuối âm tiết (jongseong) rồi bị đồng hóa bởi âm mũi đi liền sau. Về mặt bề ngoài thì thấy thêm 'ㄴ', nhưng trên thực tế lại liên quan trực tiếp đến việc sai-siot phát âm thành [ㄷ], do đó có sự tương thông với Khoản 1 ở trên. Tuy nhiên, điểm khác biệt là ở Khoản 1 thì không phát âm sai-siot là nguyên tắc và cho phép đọc [ㄷ], trong khi ở điều khoản này thì sai-siot bắt buộc phải phát âm thành [ㄷ] thì mới có thể đồng hóa thành 'ㄴ'.",
        "en": "2. In cases where 'ㄴ' is added, this is the result of sai-siot shifting to [ㄷ] in the syllable coda (jongseong) and subsequently assimilating to the nasal consonant that follows. On the surface an 'ㄴ' appears to be added, but fundamentally it relates to sai-siot being pronounced as [ㄷ], thereby sharing common ground with Clause 1 above. However, while Clause 1 sets non-pronunciation as the primary rule and allows [ㄷ], this clause differs in that sai-siot must strictly be pronounced as [ㄷ] in order to assimilate into 'ㄴ'.",
        "ja": "2.「ㄴ」が添加される場合で、サイシオッが音節末尾（終声）で[ㄷ]に変わった後、後続の鼻音に同化された結果である。表面的には「ㄴ」が添加されているが、実際にはサイシオッが[ㄷ]として発音されることに関連するため、前述の1と通底する部分がある。ただし、1ではサイシオッを発音しないことが原則であり[ㄷ]と発音することも許容されたのに対し、本条項の場合はサイシオッを必ず[ㄷ]として発音してこそ「ㄴ」に同化され得るという点で相違がある。",
        "zh-Hans": "2. 属于添加‘ㄴ’的情形，这是合音‘ㅅ’在音节尾音（终声）变为[ㄷ]后，同化于后随鼻音的结果。表面上看是添加了‘ㄴ’，但实际上与合音‘ㅅ’读作[ㄷ]密切相关，因而与上述第1条相通。不同之处在于，第1条以不发音合音‘ㅅ’为原则且允许读作[ㄷ]，而本条则必须将合音‘ㅅ’发音为[ㄷ]，才能同化为‘ㄴ’。",
        "zh-Hant": "2. 屬於添加‘ㄴ’的情形，這是合音‘ㅅ’在音節尾音（終聲）變為[ㄷ]後，同化於後隨鼻音的結果。表面上看是添加了‘ㄴ’，但實際上與合音‘ㅅ’讀作[ㄷ]密切相關，因而與上述第1條相通。不同之處在於，第1條以不發音合音‘ㅅ’為原則且允許讀作[ㄷ]，而本條則必須將合音‘ㅅ’發音為[ㄷ]，才能同化為‘ㄴ’。"
    },
    {
        "ko": "3. ‘ㄴㄴ’이 첨가되는 경우로 앞선 1이나 2와 달리 뒷말이 ‘이’ 또는 반모음 ‘ㅣ[j]’로 시작해야 한다는 조건이 있다. 규정에 따르면 첨가된 ‘ㄴㄴ’은 여러 단계를 거쳐 나오게 된다. ‘베갯잇[베갣닏→베갠닏]’에서 보듯이 사이시옷이 먼저 첨가된 후 ‘ㄴ’이 첨가되고(표준 발음법 제29항 참조) 다시 자음 동화를 거친 결과 ‘ㄴㄴ’으로 발음되는 것이다. ‘ㄴㄴ’이 첨가되는 사례에는 제시된 것 이외에 ‘훗일[훈ː닐], 뒷일[뒨ː닐]’과 같은 예가 있다.",
        "vi": "3. Trường hợp thêm âm 'ㄴㄴ', khác với Khoản 1 hay 2 ở trên, có điều kiện bắt buộc là từ sau phải bắt đầu bằng nguyên âm '이' hoặc bán nguyên âm 'ㅣ[j]'. Theo quy định, âm 'ㄴㄴ' được chèn thêm trải qua nhiều giai đoạn ngữ âm. Như thấy trong từ '베갯잇[베갣닏→베갠닏]' (vỏ gối), chữ sai-siot được thêm vào trước rồi âm 'ㄴ' được chèn thêm (tham khảo Điều 29 Quy tắc phát âm chuẩn), sau đó trải qua đồng hóa phụ âm mà phát âm thành 'ㄴㄴ'. Ngoài các từ nêu trên, còn có các ví dụ chèn 'ㄴㄴ' như '훗일[훈ː닐]', '뒷일[뒨ː닐]'.",
        "en": "3. In cases where 'ㄴㄴ' is added, unlike Clauses 1 and 2 above, there is a mandatory condition that the following word must begin with '이' or the semivowel 'ㅣ[j]'. According to the rule, the added 'ㄴㄴ' emerges through several stages. As shown in '베갯잇[베갣닏→베갠닏]' (pillowcase), sai-siot is added first, followed by the insertion of 'ㄴ' (cf. Standard Pronunciation Rule Article 29), and through subsequent consonant assimilation it is pronounced as 'ㄴㄴ'. Beyond the presented examples, cases of 'ㄴㄴ' addition include '훗일[훈ː닐]' (future work) and '뒷일[뒨ː닐]' (aftermath).",
        "ja": "3.「ㄴㄴ」が添加される場合で、前述の1や2とは異なり、後続語が「이」または半母音「ㅣ[j]」で始まらなければならないという条件がある。規定によれば、添加された「ㄴㄴ」はいくつかの段階を経て生じる。「베갯잇[베갣닏→베갠닏]（枕カバー）」に見られるように、サイシオッがまず添加された後に「ㄴ」が添加され（標準発音法第29項参照）、さらに子音同化を経た結果「ㄴㄴ」として発音されるのである。「ㄴㄴ」が添加される事例には、提示されたもののほかに「훗일[훈ː닐]（後日の事）」「뒷일[뒨ː닐]（後始末）」のような用例がある。",
        "zh-Hans": "3. 属于添加‘ㄴㄴ’的情形，与上述第1条或第2条不同，其必要条件是后接词必须以‘이’或半元音‘ㅣ[j]’开头。根据规定，添加的‘ㄴㄴ’是经过多个语音演化阶段产生的。正如‘베갯잇[베갣닏→베갠닏]（枕套）’所示，先添加合音‘ㅅ’，其后添加‘ㄴ’（参见《标准发音法》第29条），再经过辅音同化，最终发音为‘ㄴㄴ’。添加‘ㄴㄴ’的例子除所示词汇外，还有‘훗일[훈ː닐]（后事）’、‘뒷일[뒨ː닐]（后事/善后）’等。",
        "zh-Hant": "3. 屬於添加‘ㄴㄴ’的情形，與上述第1條或第2條不同，其必要條件是後接詞必須以‘이’或半元音‘ㅣ[j]’開頭。根據規定，添加的‘ㄴㄴ’是經過多個語音演化階段產生的。正如‘베갯잇[베갣닏→베갠닏]（枕套）’所示，先添加合音‘ㅅ’，其後添加‘ㄴ’（參見《標準發音法》第29條），再經過輔音同化，最終發音為‘ㄴㄴ’。添加‘ㄴㄴ’的例子除所示詞彙外，還有‘훗일[훈ː닐]（後事）’、‘뒷일[뒨ː닐]（後事/善後）’等。"
    },
    {
        "ko": "더 알아보기 ‘ㄴ’ 첨가 현상 보충 설명 ‘베갯잇’과 같이 표면상 두 개의 ‘ㄴ’이 첨가되는 것에 대해 사이시옷이 먼저 첨가된 후 ‘ㄴ’이 첨가된다고 설명하는데, 이에 대해서는 반론도 있다. 사이시옷이 첨가되기 위해서는 뒤에 오는 말이 경음으로 바뀔 수 있는 평음으로 시작하거나, 비음으로 시작해야 한다. 그런데 ‘ㄴㄴ’이 첨가되는 예들은 뒷말이 ‘이’나 반모음 ‘ㅣ[j]’로 시작하므로 이러한 조건을 충족하지 못한다. 그럴 경우 사이시옷이 첨가될 수 없으며 사이시옷이 첨가되지 못하면 ‘ㄴ’도 첨가될 수 없다. ‘ㄴㄴ’이 첨가되는 예들 중 ‘깻잎, 나뭇잎’은 ‘잎’이 예전에 ‘닢’이었으므로 실제로는 2의 ‘ㄴ’ 첨가와 별반 다를 바가 없다. 즉 역사적으로 ‘깻닢, 나뭇닢’에서 ‘[깬닙], [나문닙]’으로 변한 것이다.",
        "vi": "Tìm hiểu thêm: Giải thích bổ sung về hiện tượng chèn âm 'ㄴ'. Về việc trên bề mặt xuất hiện hai âm 'ㄴ' được chèn thêm như trong từ '베갯잇', có cách giải thích rằng sai-siot được thêm vào trước rồi 'ㄴ' mới thêm vào sau, nhưng cũng có ý kiến phản bác. Để sai-siot có thể được thêm vào, từ theo sau phải bắt đầu bằng âm thường có thể biến đổi thành âm căng, hoặc phải bắt đầu bằng âm mũi. Tuy nhiên, các ví dụ chèn 'ㄴㄴ' lại có từ sau bắt đầu bằng '이' hoặc bán nguyên âm 'ㅣ[j]', do đó không đáp ứng điều kiện này. Khi đó sai-siot không thể thêm vào, và nếu sai-siot không thêm vào thì 'ㄴ' cũng không thể chèn thêm. Trong các ví dụ chèn 'ㄴㄴ', các từ như '깻잎', '나뭇잎' vốn có từ '잎' trong lịch sử là '닢', nên thực chất không khác gì hiện tượng chèn 'ㄴ' ở Khoản 2. Nghĩa là về mặt lịch sử, từ '깻닢, 나뭇닢' đã biến đổi thành '[깬닙], [나문닙]'.",
        "en": "Learn More: Supplementary explanation on the 'ㄴ' addition phenomenon. Regarding the apparent addition of two 'ㄴ' sounds as in '베갯잇', it is traditionally explained that sai-siot is added first followed by the addition of 'ㄴ', but counterarguments exist. For sai-siot to be added, the following word must begin with a plain consonant that can become tense, or with a nasal consonant. However, words where 'ㄴㄴ' is added start with '이' or the semivowel 'ㅣ[j]', failing to meet this criterion. In that case, sai-siot cannot be inserted, and without sai-siot, 'ㄴ' cannot be added either. Among words with 'ㄴㄴ' addition, '깻잎' (sesame leaf) and '나뭇잎' (tree leaf) historically had '잎' as '닢', making them fundamentally no different from the 'ㄴ' addition in Clause 2. That is, historically '깻닢, 나뭇닢' naturally evolved into '[깬닙], [나문닙]'.",
        "ja": "さらに詳しく：「ㄴ」添加現象の補足説明。「베갯잇」のように表面上2つの「ㄴ」が添加されることについて、サイシオッがまず添加された後に「ㄴ」が添加されると説明されるが、これには反論もある。サイシオッが添加されるためには、後続語が濃音に変化し得る平音で始まるか、鼻音で始まらなければならない。しかし「ㄴㄴ」が添加される用例は後続語が「이」や半母音「ㅣ[j]」で始まるため、この条件を満たさない。その場合サイシオッは添加され得ず、サイシオッが添加されなければ「ㄴ」も添加され得ない。「ㄴㄴ」が添加される用例のうち「깻잎（エゴマの葉）」「나뭇잎（木の葉）」は「잎（葉）」がかつて「닢」であったため、実際には2の「ㄴ」添加と本質的な違いはない。すなわち歴史的に「깻닢, 나뭇닢」から「[깬닙], [나문닙]」へと変化したものである。",
        "zh-Hans": "深入了解：关于‘ㄴ’添加现象的补充说明。对于像‘베갯잇’这样表面上添加两个‘ㄴ’的现象，通常解释为先添加合音‘ㅅ’后再添加‘ㄴ’，但对此也存在学术反论。添加合音‘ㅅ’的前提是后接词必须以可转变为浓音的平音开头，或者以鼻音开头。然而添加‘ㄴㄴ’的例子由于后接词以‘이’或半元音‘ㅣ[j]’开头，并未满足该条件。在这种情况下合音‘ㅅ’无法添加，若合音‘ㅅ’未能添加则‘ㄴ’亦无法添加。在添加‘ㄴㄴ’的例子中，‘깻잎（苏子叶）’、‘나뭇잎（树叶）’中的‘잎’古代写作‘닢’，因此实质上与第2条的‘ㄴ’添加并无二致。即历史上是由‘깻닢、나뭇닢’演变为‘[깬닙]、[나문닙]’的。",
        "zh-Hant": "深入了解：關於‘ㄴ’添加現象的補充說明。對於像‘베갯잇’這樣表面上添加兩個‘ㄴ’的現象，通常解釋為先添加合音‘ㅅ’後再添加‘ㄴ’，但對此也存在學術反論。添加合音‘ㅅ’的前提是後接詞必須以可轉變為濃音的平音開頭，或者以鼻音開頭。然而添加‘ㄴㄴ’的例子由於後接詞以‘이’或半元音‘ㅣ[j]’開頭，並未滿足該條件。在這種情況下合音‘ㅅ’無法添加，若合音‘ㅅ’未能添加則‘ㄴ’亦無法添加。在添加‘ㄴㄴ’的例子中，‘깻잎（蘇子葉）’、‘나뭇잎（樹葉）’中的‘잎’古代寫作‘닢’，因此實質上與第2條的‘ㄴ’添加並無二致。即歷史上是由‘깻닢、나뭇닢’演變為‘[깬닙]、[나문닙]’的。"
    },
    {
        "ko": "그러나 ‘잎’이 결합되지 않은 ‘베갯잇, 도리깻열, 뒷윷’ 등에서는 어떤 과정으로 ‘ㄴㄴ’이 첨가되었는지를 명확히 알기는 어렵다.",
        "vi": "Tuy nhiên, đối với các từ không kết hợp với '잎' như '베갯잇, 도리깻열, 뒷윷', thì rất khó để biết chính xác âm 'ㄴㄴ' đã được chèn thêm qua tiến trình cụ thể nào.",
        "en": "However, in words not combined with '잎', such as '베갯잇', '도리깻열', and '뒷윷', it remains difficult to ascertain with certainty through what exact historical process 'ㄴㄴ' was inserted.",
        "ja": "しかし「잎」が結合していない「베갯잇」「도리깻열」「뒷윷」などにおいては、どのような過程で「ㄴㄴ」が添加されたのかを明確に解明することは困難である。",
        "zh-Hans": "然而，对于未结合‘잎’的‘베갯잇、도리깻열、뒷윷’等词汇，究竟是通过何种演化过程添加了‘ㄴㄴ’，目前尚难以明确考证。",
        "zh-Hant": "然而，對於未結合‘잎’的‘베갯잇、도리깻열、뒷윷’等詞彙，究竟是通過何種演化過程添加了‘ㄴㄴ’，目前尚難以明確考證。"
    }
]

commentaries["p2-a30"] = art30_data

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(commentaries, f, ensure_ascii=False, indent=2)

print("Article 30 authoritative 8 paragraphs saved!")
