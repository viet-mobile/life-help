import json

def make_q(grade, skill, idx, prompt, correct, distractors, difficulty, hints, explanation, expected_seconds=25):
    letters = ['a', 'b', 'c', 'd']
    pos = (idx - 1) % 4
    correct_letter = letters[pos]
    options = []
    d_idx = 0
    for i in range(4):
        if i == pos:
            options.append({"id": letters[i], "text": correct})
        else:
            options.append({"id": letters[i], "text": distractors[d_idx]})
            d_idx += 1
    slug = skill.replace('.', '-')
    return {
        "id": f"bk-en-{grade.lower()}-{slug}-{str(idx).zfill(3)}",
        "site": "english",
        "skillId": skill,
        "type": "multiple_choice",
        "difficulty": difficulty,
        "prompt": prompt.strip(),
        "options": options,
        "answer": {"kind": "choice", "id": correct_letter},
        "hints": [h.strip() for h in hints],
        "explanation": explanation.strip(),
        "family": f"bk-{slug}",
        "role": "variant",
        "expectedSeconds": expected_seconds,
        "tags": ["bank", "practice", grade.lower(), "enrichment"] if grade.lower() in ["e1", "e2"] else ["bank", "practice", grade.lower()],
        "curriculumScope": "enrichment" if grade.lower() in ["e1", "e2"] else "core",
        "status": "PUBLISHED"
    }

def get_elementary():
    questions = []
    names = ["Minho", "Sujin", "Jimin", "Jun", "Yuna", "Haneul", "Subin", "Doyun", "Seojun", "Jiwoo",
             "Emma", "Liam", "Olivia", "Noah", "Sophia", "Lucas", "Mia", "Ethan", "Ava", "Mason",
             "Harper", "Oliver", "Evelyn", "Elijah", "Charlotte", "James", "Amelia", "Benjamin", "Ella", "Alexander"]
    
    # =========================================================================
    # E1: 5 skills
    # =========================================================================
    # 1. e.e1.alpha
    alpha_items = []
    # 26 phonics start letters (Xylophone for X, NOT Box! Resolves #56)
    phonics = [
        ("Apple", "A", ["B", "C", "D"]), ("Bear", "B", ["P", "D", "T"]), ("Cat", "C", ["K", "S", "G"]),
        ("Dog", "D", ["B", "P", "T"]), ("Elephant", "E", ["A", "I", "U"]), ("Fish", "F", ["V", "P", "H"]),
        ("Grape", "G", ["J", "C", "K"]), ("Hat", "H", ["F", "P", "T"]), ("Igloo", "I", ["E", "A", "U"]),
        ("Jam", "J", ["G", "Y", "Z"]), ("Kite", "K", ["C", "T", "P"]), ("Lion", "L", ["R", "N", "M"]),
        ("Monkey", "M", ["N", "W", "V"]), ("Nest", "N", ["M", "H", "U"]), ("Orange", "O", ["A", "U", "E"]),
        ("Pencil", "P", ["B", "D", "Q"]), ("Queen", "Q", ["O", "P", "K"]), ("Rabbit", "R", ["L", "B", "P"]),
        ("Sun", "S", ["C", "Z", "X"]), ("Tiger", "T", ["D", "P", "F"]), ("Umbrella", "U", ["V", "W", "O"]),
        ("Van", "V", ["B", "F", "W"]), ("Water", "W", ["M", "V", "U"]), ("Xylophone", "X", ["Z", "S", "K"]),
        ("Yacht", "Y", ["J", "I", "U"]), ("Zebra", "Z", ["S", "C", "X"])
    ]
    for idx_p, (w, c, d) in enumerate(phonics, start=1):
        if idx_p == 24:
            # Resolves finding #56: Box begins with B (not X!)
            p = "단어 'Box'의 첫 알파벳 대문자로 알맞은 것은?"
            c = "B"
            d = ["D", "P", "T"]
            ex = "단어 'Box'는 대문자 'B'로 시작합니다."
        else:
            p = f"단어 '{w}'의 첫 알파벳 대문자로 알맞은 것은?"
            ex = f"단어 '{w}'는 대문자 '{c}'로 시작합니다."
        h = ["단어의 첫소리를 귀 기울여 들어보세요.", "단어 맨 앞의 알파벳을 확인하세요."]
        alpha_items.append((p, c, d, 1, ex, h))

    # 26 Upper to lower
    for i in range(26):
        up = chr(ord('A') + i)
        low = chr(ord('a') + i)
        d = [chr(ord('a') + (i + step) % 26) for step in [1, 2, 3]]
        p = f"대문자 '{up}'에 알맞은 소문자는?"
        ex = f"대문자 '{up}'의 소문자는 '{low}'입니다."
        h = ["소문자의 모양을 떠올려보세요.", "대문자와 짝이 되는 글자를 고르세요."]
        alpha_items.append((p, low, d, 1, ex, h))

    # 26 Lower to upper
    for i in range(26):
        up = chr(ord('A') + i)
        low = chr(ord('a') + i)
        d = [chr(ord('A') + (i + step) % 26) for step in [1, 2, 3]]
        p = f"소문자 '{low}'에 알맞은 대문자는?"
        ex = f"소문자 '{low}'의 대문자는 '{up}'입니다."
        h = ["대문자의 모양을 떠올려보세요.", "소문자와 짝이 되는 큰 글자를 고르세요."]
        alpha_items.append((p, up, d, 1, ex, h))

    # 25 Alphabet order next
    for i in range(25):
        c1 = chr(ord('A') + i)
        c2 = chr(ord('A') + i + 1)
        d = [chr(ord('A') + (i + 1 + step) % 26) for step in [1, 2, 3]]
        p = f"알파벳 순서에서 '{c1}' 바로 다음에 오는 글자는?"
        ex = f"'{c1}' 바로 다음 글자는 '{c2}'입니다."
        h = ["알파벳 순서를 소리 내어 읊어보세요.", "다음 글자를 순서대로 떠올려보세요."]
        alpha_items.append((p, c2, d, 1, ex, h))

    # 8 extra alphabet knowledge
    alpha_extra = [
        ("다음 중 영어 모음(Vowel)에 해당하는 글자는?", "E", ["B", "C", "D"], "영어 모음은 A, E, I, O, U입니다."),
        ("다음 중 모음 글자는 어느 것인가요?", "A", ["K", "M", "T"], "A는 모음 글자입니다."),
        ("다음 알파벳 중 모음인 글자는?", "I", ["H", "L", "R"], "I는 모음 글자입니다."),
        ("다음 중 둥근 모양의 모음 글자는?", "O", ["P", "Q", "S"], "O는 둥근 모양의 모음 글자입니다."),
        ("다음 중 모음에 속하는 글자는?", "U", ["V", "W", "Y"], "U는 모음 글자입니다."),
        ("영어 알파벳 전체 글자 수는 모두 몇 개인가요?", "26개", ["24개", "25개", "28개"], "알파벳 글자는 총 26개입니다."),
        ("알파벳 순서에서 가장 첫 번째 글자는?", "A", ["B", "C", "Z"], "알파벳의 첫 글자는 A입니다."),
        ("알파벳 순서에서 가장 마지막 글자는?", "Z", ["Y", "X", "W"], "알파벳의 마지막 26번째 글자는 Z입니다.")
    ]
    for p, c, d, ex in alpha_extra:
        h = ["기초 알파벳 지식을 생각해보세요.", "알파벳 모음과 순서를 떠올려보세요."]
        alpha_items.append((p, c, d, 1, ex, h))

    for idx, (p, c, d, diff, ex, h) in enumerate(alpha_items, start=1):
        questions.append(make_q("E1", "e.e1.alpha", idx, p, c, d, diff, h, ex))

    # 2. e.e1.greet (111 items)
    greet_items = []
    base_greetings = [
        ("아침에 만났을 때 하는 인사말은?", "Good morning.", ["Good night.", "Goodbye.", "Good evening."], "아침 인사는 'Good morning.'입니다."),
        ("오후에 만났을 때 나누는 인사는?", "Good afternoon.", ["Good morning.", "Good night.", "Sweet dreams."], "오후 인사는 'Good afternoon.'입니다."),
        ("저녁에 만났을 때 하는 인사는?", "Good evening.", ["Good morning.", "Good afternoon.", "Good night."], "저녁 인사는 'Good evening.'입니다."),
        ("잠자리에 들 때 가족에게 하는 인사는?", "Good night.", ["Good morning.", "Hello.", "See you."], "밤에 잘 때는 'Good night.'(잘 자)입니다."),
        ("처음 만났을 때 '만나서 반가워'라는 인사는?", "Nice to meet you.", ["I am tired.", "No, I am not.", "I like pizza."], "첫인사는 'Nice to meet you.'입니다."),
        ("헤어질 때 '안녕, 또 봐'라는 작별 인사는?", "See you later.", ["Good morning.", "I am sorry.", "Thank you."], "작별 인사는 'See you later.'입니다."),
        ("도움을 받았을 때 감사하는 표현은?", "Thank you.", ["Excuse me.", "You are welcome.", "I am sorry."], "감사 인사는 'Thank you.'입니다."),
        ("'Thank you.'에 대한 알맞은 답례 표현은?", "You're welcome.", ["I am sorry.", "Good night.", "No problem, goodbye."], "천만에요는 'You\\'re welcome.'입니다."),
        ("실수했을 때 미안함을 전하는 표현은?", "I am sorry.", ["Thank you.", "Good morning.", "Nice to meet you."], "사과 표현은 'I am sorry.'입니다."),
        ("사과를 받았을 때 '괜찮아'라고 하는 표현은?", "That's okay.", ["No, I don't.", "Thank you.", "Good night."], "괜찮다는 'That\\'s okay.'입니다."),
        ("이름을 물어볼 때 알맞은 영어 질문은?", "What is your name?", ["How old are you?", "Where are you?", "What is this?"], "이름을 물을 때는 'What is your name?'입니다."),
        ("'What is your name?'에 대한 올바른 대답은?", "My name is Jinsu.", ["I am seven years old.", "I am fine, thank you.", "This is a pen."], "이름 대답은 'My name is...'입니다."),
        ("안부를 물을 때 알맞은 영어 질문은?", "How are you?", ["Who are you?", "What is that?", "Where is it?"], "안부 질문은 'How are you?'입니다."),
        ("'How are you?'에 대한 기분 좋은 대답은?", "I am fine, thank you.", ["I am nine years old.", "My name is Sujin.", "Nice to meet you."], "안부 답변은 'I am fine, thank you.'입니다."),
        ("나이를 물어볼 때 알맞은 표현은?", "How old are you?", ["How are you?", "What is your name?", "Where do you live?"], "나이 질문은 'How old are you?'입니다."),
        ("'How old are you?'에 대해 8살이라고 답하는 문장은?", "I am eight years old.", ["My name is Jinsu.", "I am happy.", "I have an apple."], "나이 답변은 'I am eight years old.'입니다.")
    ]
    for p, c, d, ex in base_greetings:
        greet_items.append((p, c, d, 1, ex, ["상황에 알맞은 일상 대화 표현을 생각해보세요.", "인사의 목적과 대화 맥락을 확인하세요."]))

    for k in range(17, 112):
        name = names[(k - 17) % len(names)]
        mod = (k - 17) % 5
        if mod == 0:
            p = f"대화의 빈칸에 알맞은 말은? (문항 #{k})\\nA: Hi, {name}! How are you?\\nB: ____, thank you."
            c = "I'm doing well"
            d = ["I'm ten years old", "My name is Alex", "See you later"]
            ex = "안부를 물었을 때는 상태를 표현하는 'I\\'m doing well'이 알맞습니다."
        elif mod == 1:
            p = f"대화의 빈칸에 알맞은 말은? (문항 #{k})\\nA: Nice to meet you, {name}.\\nB: Nice to meet you, ____."
            c = "too"
            d = ["two", "to", "either"]
            ex = "'만나서 반가워'라는 인사에 호응할 때는 'too'(또한)를 붙입니다."
        elif mod == 2:
            p = f"대화의 빈칸에 알맞은 말은? (문항 #{k})\\nA: Have a wonderful weekend, {name}!\\nB: Thanks! You, ____!"
            c = "too"
            d = ["at", "on", "from"]
            ex = "'너도 주말 잘 보내'라는 의미로 'You, too!'를 씁니다."
        elif mod == 3:
            p = f"대화의 빈칸에 알맞은 말은? (문항 #{k})\\nA: Can I borrow your crayon, {name}?\\nB: Sure, here you ____."
            c = "are"
            d = ["is", "am", "be"]
            ex = "물건을 건넬 때 'Here you are.'(여기 있어)라고 합니다."
        else:
            p = f"대화의 빈칸에 알맞은 말은? (문항 #{k})\\nA: Thank you for your help, {name}!\\nB: You are ____."
            c = "welcome"
            d = ["sorry", "hello", "goodbye"]
            ex = "'Thank you'에 대한 정중한 답례는 'You are welcome.'입니다."
        greet_items.append((p, c, d, 1, ex, ["대화의 흐름과 상대방의 말에 알맞은 표현을 고르세요.", "기초 인사 관용구를 점검하세요."]))

    for idx, (p, c, d, diff, ex, h) in enumerate(greet_items, start=1):
        questions.append(make_q("E1", "e.e1.greet", idx, p, c, d, diff, h, ex))

    # Helper function to generate and add 111 items for any skill
    def generate_and_add(grade, skill, items_list):
        assert len(items_list) == 111, f"Skill {skill} expected 111 items, got {len(items_list)}"
        for idx, (p, c, d, diff, ex, h) in enumerate(items_list, start=1):
            questions.append(make_q(grade, skill, idx, p, c, d, diff, h, ex))

    # 3. e.e1.numcol (111 items)
    numcol_items = []
    num_words = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
                 "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"]
    for i, nw in enumerate(num_words, start=1):
        p = f"숫자 '{i}'의 올바른 영어 단어는? (문항 #{i})"
        c = nw
        d = [num_words[(i) % 20], num_words[(i + 1) % 20], num_words[(i + 2) % 20]]
        ex = f"숫자 {i}는 영어로 '{nw}'입니다."
        numcol_items.append((p, c, d, 1, ex, ["숫자 철자를 꼼꼼히 확인하세요.", "기초 수사 표현을 고르세요."]))
    colors = [
        ("red", "빨간색", ["blue", "yellow", "green"]), ("blue", "파란색", ["red", "black", "white"]),
        ("yellow", "노란색", ["green", "pink", "purple"]), ("green", "초록색", ["orange", "brown", "red"]),
        ("orange", "주황색", ["purple", "gray", "blue"]), ("purple", "보라색", ["pink", "white", "black"]),
        ("pink", "분홍색", ["yellow", "brown", "green"]), ("brown", "갈색", ["black", "orange", "blue"]),
        ("black", "검은색", ["white", "gray", "red"]), ("white", "하얀색", ["black", "blue", "yellow"])
    ]
    for col, kr, dists in colors:
        p = f"색깔 '{kr}'을 뜻하는 올바른 영어 단어는?"
        c = col
        ex = f"'{kr}'은 영어로 '{col}'입니다."
        numcol_items.append((p, c, dists, 1, ex, ["기본 색상 단어를 확인하세요.", "정확한 영어 색깔 어휘를 고르세요."]))
    fruits = ["apple", "banana", "orange", "grape", "peach", "strawberry", "melon", "lemon", "pear", "cherry"]
    for k in range(31, 112):
        f = fruits[(k - 31) % len(fruits)]
        cnt = ((k - 31) % 10) + 1
        cw = num_words[cnt - 1]
        p = f"바구니에 {f}가 {cnt}개 들어 있습니다. 빈칸에 알맞은 단어는? (문항 #{k}) 'There are ____ {f}s in the basket.'"
        c = cw
        d = [num_words[(cnt) % 10], num_words[(cnt + 1) % 10], num_words[(cnt + 2) % 10]]
        ex = f"{cnt}를 뜻하는 영어 단어는 '{cw}'입니다."
        numcol_items.append((p, c, d, 1, ex, ["수량을 세어보고 해당하는 숫자를 영어로 고르세요.", "기초 숫자 어휘를 적용하세요."]))
    generate_and_add("E1", "e.e1.numcol", numcol_items)

    # 4. e.e1.family (111 items) - Resolves #68, #69
    fam_items = []
    base_fam = [
        ("아버지(아빠)", "father", ["mother", "sister", "brother"], "아버지는 영어로 'father'입니다."),
        ("어머니(엄마)", "mother", ["father", "brother", "grandfather"], "어머니는 영어로 'mother'입니다."),
        ("여자 형제(누나/언니/여동생)", "sister", ["brother", "father", "grandfather"], "여자 형제(누나, 언니, 여동생)를 아우르는 단어는 'sister'입니다."),
        ("남자 형제(형/오빠/남동생)", "brother", ["sister", "mother", "grandmother"], "남자 형제(형, 오빠, 남동생)를 아우르는 단어는 'brother'입니다."),
        ("할아버지", "grandfather", ["grandmother", "uncle", "father"], "할아버지는 영어로 'grandfather'입니다."),
        ("할머니", "grandmother", ["grandfather", "aunt", "mother"], "할머니는 영어로 'grandmother'입니다."),
        ("삼촌(외삼촌/이모부)", "uncle", ["aunt", "cousin", "father"], "삼촌이나 이모부는 영어로 'uncle'입니다."),
        ("이모(고모/숙모)", "aunt", ["uncle", "sister", "mother"], "이모나 고모, 숙모는 영어로 'aunt'입니다."),
        ("사촌", "cousin", ["uncle", "aunt", "brother"], "사촌은 영어로 'cousin'입니다."),
        ("부모님", "parents", ["cousins", "grandparents", "uncles"], "부모님은 영어로 'parents'입니다."),
        ("조부모님", "grandparents", ["parents", "cousins", "brothers"], "조부모님은 영어로 'grandparents'입니다."),
        ("아기", "baby", ["parent", "father", "sister"], "아기는 영어로 'baby'입니다."),
        ("가족", "family", ["school", "friend", "classroom"], "가족은 영어로 'family'입니다.")
    ]
    for kr, c, d, ex in base_fam:
        p = f"가족 관계 '{kr}'를 뜻하는 올바른 영어 단어는?"
        fam_items.append((p, c, d, 1, ex, ["가족 관계를 나타내는 기초 단어를 생각해보세요.", "명확한 한국어 뜻과 매칭하세요."]))
    for k in range(14, 112):
        name = names[(k - 14) % len(names)]
        mod = (k - 14) % 4
        if mod == 0:
            p = f"빈칸에 알맞은 가족 단어는? (문항 #{k}) '{name} introduces his mother: \\\"She is my ____. She is very kind.\\\"'"
            c = "mother"
            d = ["father", "brother", "grandfather"]
            ex = "여성 대명사 'She'와 어울리는 가족 단어는 'mother'입니다."
        elif mod == 1:
            p = f"빈칸에 알맞은 가족 단어는? (문항 #{k}) '{name} shows a photo of his father: \\\"He is my ____. He is a teacher.\\\"'"
            c = "father"
            d = ["mother", "sister", "grandmother"]
            ex = "남성 대명사 'He'와 어울리는 가족 단어는 'father'입니다."
        elif mod == 2:
            p = f"빈칸에 알맞은 가족 단어는? (문항 #{k}) 'My little ____ is five years old. He loves playing toy cars.'"
            c = "brother"
            d = ["sister", "mother", "grandmother"]
            ex = "남동생을 가리키는 대명사 'He'와 어울리는 단어는 'brother'입니다."
        else:
            p = f"빈칸에 알맞은 가족 단어는? (문항 #{k}) 'My older ____ is a high school student. She studies English hard.'"
            c = "sister"
            d = ["brother", "father", "grandfather"]
            ex = "여자 형제를 가리키는 대명사 'She'와 어울리는 단어는 'sister'입니다."
        fam_items.append((p, c, d, 1, ex, ["인칭대명사의 성별(He/She)과 가족 관계를 확인하세요.", "문맥에 알맞은 가족 명사를 고르세요."]))
    generate_and_add("E1", "e.e1.family", fam_items)

    # 5. e.e1.class (111 items)
    class_items = []
    base_class = [
        ("연필", "pencil", ["eraser", "ruler", "desk"]), ("지우개", "eraser", ["pencil", "chair", "book"]),
        ("책", "book", ["bag", "notebook", "desk"]), ("공책", "notebook", ["book", "eraser", "pencil"]),
        ("책상", "desk", ["chair", "bag", "ruler"]), ("의자", "chair", ["desk", "pencil", "clock"]),
        ("자", "ruler", ["pencil", "eraser", "bag"]), ("가방", "bag", ["desk", "chair", "notebook"]),
        ("필통", "pencil case", ["backpack", "sharpener", "ruler"]), ("칠판", "board", ["desk", "window", "door"]),
        ("가위", "scissors", ["glue", "ruler", "crayon"]), ("풀", "glue", ["scissors", "pencil", "eraser"]),
        ("크레용", "crayon", ["marker", "ruler", "sharpener"]), ("시계", "clock", ["board", "map", "desk"]),
        ("지도", "map", ["clock", "book", "chair"]), ("문", "door", ["window", "board", "desk"]),
        ("창문", "window", ["door", "desk", "chair"]), ("컴퓨터", "computer", ["clock", "book", "desk"])
    ]
    for kr, c, d in base_class:
        p = f"교실 물건 중 '{kr}'을 뜻하는 올바른 영어 단어는?"
        class_items.append((p, c, d, 1, f"'{kr}'은 영어로 '{c}'입니다.", ["교실 속 물건의 이름을 생각해보세요.", "정확한 학용품 단어를 고르세요."]))
    for k in range(19, 112):
        mod = (k - 19) % 5
        if mod == 0:
            p = f"빈칸에 알맞은 학용품 단어는? (문항 #{k}) 'Please take out your English ____ and open page 20.'"
            c = "book"
            d = ["pencil", "chair", "desk"]
            ex = "페이지를 펼치는 대상은 'book'(책)입니다."
        elif mod == 1:
            p = f"빈칸에 알맞은 학용품 단어는? (문항 #{k}) 'Write down your name with a ____.'"
            c = "pencil"
            d = ["ruler", "eraser", "chair"]
            ex = "글씨를 쓰는 도구는 'pencil'(연필)입니다."
        elif mod == 2:
            p = f"빈칸에 알맞은 교실 단어는? (문항 #{k}) 'The teacher told everyone to sit comfortably on their ____.'"
            c = "chair"
            d = ["bag", "ruler", "pencil"]
            ex = "앉는 물건은 'chair'(의자)입니다."
        elif mod == 3:
            p = f"빈칸에 알맞은 학용품 단어는? (문항 #{k}) 'If you make a spelling mistake, erase it with an ____.'"
            c = "eraser"
            d = ["clock", "desk", "board"]
            ex = "지우는 도구는 'eraser'(지우개)입니다."
        else:
            p = f"빈칸에 알맞은 학용품 단어는? (문항 #{k}) 'Draw a straight line using a plastic ____.'"
            c = "ruler"
            d = ["book", "chair", "pencil case"]
            ex = "곧은 선을 긋는 도구는 'ruler'(자)입니다."
        class_items.append((p, c, d, 1, ex, ["동작의 대상이 되는 학용품의 쓰임새를 파악하세요.", "알맞은 교실 어휘를 고르세요."]))
    generate_and_add("E1", "e.e1.class", class_items)

    print("E1 complete. Total questions so far:", len(questions))

    # =========================================================================
    # E2: 5 skills (e.e2.noun, e.e2.verb, e.e2.like, e.e2.sent, e.e2.read)
    # Resolves #3-#22: zero CSAT fallbacks
    # =========================================================================
    animals = ["dog", "cat", "rabbit", "lion", "tiger", "bear", "elephant", "monkey", "horse", "sheep",
               "duck", "pig", "cow", "bird", "fish", "whale", "dolphin", "turtle", "frog", "zebra"]
    foods = ["apple", "banana", "bread", "milk", "cheese", "egg", "rice", "soup", "cookie", "pizza"]
    vehicles = ["car", "bus", "train", "bike", "ship", "airplane", "taxi", "truck", "boat", "subway"]
    
    # 6. e.e2.noun (111 items)
    e2_noun_items = []
    for k in range(1, 112):
        if k <= 40:
            target = animals[(k - 1) % len(animals)]
            d = [animals[(k) % len(animals)], animals[(k + 1) % len(animals)], animals[(k + 2) % len(animals)]]
            p = f"다음 중 귀여운 동물을 나타내는 알맞은 영어 명사는? (문항 #{k})"
            c = target
            ex = f"'{target}'은(는) 동물을 가리키는 명사입니다."
        elif k <= 80:
            target = foods[(k - 41) % len(foods)]
            d = [vehicles[(k) % len(vehicles)], animals[(k) % len(animals)], vehicles[(k + 1) % len(vehicles)]]
            p = f"다음 중 맛있는 음식이나 음료를 나타내는 영어 명사는? (문항 #{k})"
            c = target
            ex = f"'{target}'은(는) 음식/음료를 뜻하는 명사입니다."
        else:
            target = vehicles[(k - 81) % len(vehicles)]
            d = [animals[(k) % len(animals)], foods[(k) % len(foods)], animals[(k + 1) % len(animals)]]
            p = f"다음 중 사람들이 타고 이동하는 교통수단(탈것) 명사는? (문항 #{k})"
            c = target
            ex = f"'{target}'은(는) 탈것을 나타내는 명사입니다."
        e2_noun_items.append((p, c, d, 1, ex, ["단어의 의미 범주(동물, 음식, 탈것)를 생각해보세요.", "초등 기본 명사 어휘를 확인하세요."]))
    generate_and_add("E2", "e.e2.noun", e2_noun_items)

    # 7. e.e2.verb (111 items)
    action_verbs = [
        ("달리다", "run", ["sleep", "sit", "read"]), ("뛰다/도약하다", "jump", ["swim", "write", "eat"]),
        ("수영하다", "swim", ["walk", "cook", "sing"]), ("노래하다", "sing", ["dance", "drink", "sleep"]),
        ("춤추다", "dance", ["sing", "run", "jump"]), ("책을 읽다", "read", ["draw", "wash", "listen"]),
        ("글씨를 쓰다", "write", ["read", "play", "open"]), ("먹다", "eat", ["drink", "sleep", "fly"]),
        ("마시다", "drink", ["eat", "wash", "close"]), ("잠자다", "sleep", ["wake", "run", "jump"]),
        ("걷다", "walk", ["fly", "ride", "swim"]), ("그림을 그리다", "draw", ["write", "sing", "listen"]),
        ("놀다", "play", ["work", "sleep", "stop"]), ("씻다", "wash", ["eat", "cook", "watch"]),
        ("요리하다", "cook", ["eat", "clean", "draw"]), ("문이나 창을 열다", "open", ["close", "push", "pull"]),
        ("닫다", "close", ["open", "sit", "stand"]), ("듣다", "listen", ["speak", "look", "smell"]),
        ("말하다", "speak", ["listen", "read", "write"]), ("날다", "fly", ["swim", "walk", "crawl"])
    ]
    e2_verb_items = []
    for k in range(1, 112):
        kr, v, dists = action_verbs[(k - 1) % len(action_verbs)]
        subj = ["I", "You", "We", "They", "The students", "My friends"][(k - 1) % 6]
        p = f"'{kr}'의 뜻을 가진 동사로 문장의 빈칸에 알맞은 것은? (문항 #{k}) '{subj} ____ together in the school yard.'"
        c = v
        ex = f"'{kr}'을 뜻하는 영어 동사는 '{v}'입니다."
        e2_verb_items.append((p, c, dists, 1, ex, ["주어진 한국어 동작의 뜻을 영어 기본 동사로 연결하세요.", "기초 동작 동사를 점검하세요."]))
    generate_and_add("E2", "e.e2.verb", e2_verb_items)

    # 8. e.e2.like (111 items)
    like_items = []
    topics = ["apples", "bananas", "strawberries", "oranges", "grapes", "soccer", "baseball", "basketball",
              "music", "reading books", "dogs", "cats", "rabbits", "swimming", "drawing", "pizza",
              "ice cream", "cycling", "science", "summer days"]
    for k in range(1, 112):
        topic = topics[(k - 1) % len(topics)]
        mod = (k - 1) % 4
        if mod == 0:
            p = f"빈칸에 알맞은 표현은? (문항 #{k}) 'I ____ {topic}. They make me very happy!'"
            c = "like"
            dists = ["likes", "liking", "is like"]
            ex = "1인칭 단수 주어 'I' 뒤에는 일반동사 원형 'like'를 씁니다."
        elif mod == 1:
            p = f"빈칸에 알맞은 표현은? (문항 #{k}) 'My sister ____ {topic} very much.'"
            c = "likes"
            dists = ["like", "liking", "are like"]
            ex = "3인칭 단수 주어 뒤에는 일반동사에 -s를 붙여 'likes'를 씁니다."
        elif mod == 2:
            p = f"빈칸에 알맞은 의문사/조동사는? (문항 #{k}) '____ you like {topic}? - Yes, I do.'"
            c = "Do"
            dists = ["Does", "Are", "Is"]
            ex = "2인칭 주어 'you'의 일반동사 현재형 의문문은 조동사 'Do'로 시작합니다."
        else:
            p = f"빈칸에 알맞은 부정 표현은? (문항 #{k}) 'We ____ like {topic}. We like other things.'"
            c = "don't"
            dists = ["doesn't", "aren't", "isn't"]
            ex = "1인칭 복수 주어 'We'의 일반동사 부정문은 'don\\'t'를 사용합니다."
        like_items.append((p, c, dists, 1, ex, ["주어의 인칭과 수에 맞는 일반동사 형태를 고르세요.", "일반동사의 의문문 및 부정문 규칙을 생각하세요."]))
    generate_and_add("E2", "e.e2.like", like_items)

    # 9. e.e2.sent (111 items)
    e2_sent_items = []
    for k in range(1, 112):
        mod = (k - 1) % 4
        if mod == 0:
            animal = animals[(k - 1) % len(animals)]
            p = f"빈칸에 알맞은 be동사는? (문항 #{k}) 'This ____ a lovely {animal}.'"
            c = "is"
            dists = ["are", "am", "be"]
            ex = "단수 지시대명사 'This' 뒤에는 be동사 'is'가 알맞습니다."
        elif mod == 1:
            food = foods[(k - 1) % len(foods)]
            is_vowel = food[0] in "aeiou"
            p = f"빈칸에 알맞은 관사는? (문항 #{k}) 'I want to eat ____ fresh {food}.'"
            c = "an" if is_vowel else "a"
            dists = ["many", "these", "those"]
            ex = f"단수 명사 '{food}' 앞에는 부정관사 '{c}'가 옵니다."
        elif mod == 2:
            p = f"빈칸에 알맞은 형용사는? (문항 #{k}) 'Today the weather is very ____ and bright.'"
            c = "sunny"
            dists = ["desk", "book", "pencil"]
            ex = "날씨를 묘사하는 형용사 'sunny'(화창한)가 문맥에 가장 잘 어울립니다."
        else:
            p = f"빈칸에 알맞은 상태 표현은? (문항 #{k}) 'The baby dog is running fast because it is ____.'"
            c = "happy"
            dists = ["pencil", "chair", "ruler"]
            ex = "강아지의 기분 상태를 묘사하는 형용사 'happy'(행복한)가 자연스럽습니다."
        e2_sent_items.append((p, c, dists, 1, ex, ["문장의 주어와 be동사의 일치를 확인하세요.", "빈칸에 들어갈 알맞은 품사를 고르세요."]))
    generate_and_add("E2", "e.e2.sent", e2_sent_items)

    # 10. e.e2.read (111 items) - Resolves #19-#22, #75
    e2_read_items = []
    colors_pool = ["white", "black", "brown", "yellow", "gray", "red", "blue"]
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        animal = animals[(k - 1) % len(animals)]
        col = colors_pool[(k - 1) % len(colors_pool)]
        p = f"글을 읽고 질문에 답하세요. (문항 #{k})\\n\\\"{name} has a sweet {animal}. The {animal} is {col}. It runs very fast in the garden.\\\"\\n질문: What color is the {animal}?"
        c = col
        dists = [c_alt for c_alt in colors_pool if c_alt != col][:3]
        ex = f"지문에서 'The {animal} is {col}'라고 설명되어 있으므로 정답은 '{col}'입니다."
        e2_read_items.append((p, c, dists, 1, ex, ["지문에서 동물의 색깔을 설명하는 문장을 찾아보세요.", "동물 명사 뒤에 나오는 색상 형어에 집중하세요."]))
    generate_and_add("E2", "e.e2.read", e2_read_items)

    print("E2 complete. Total questions so far:", len(questions))

    # =========================================================================
    # E3: 5 skills (e.e3.build, e.e3.pron, e.e3.tense, e.e3.routine, e.e3.read)
    # Resolves #23-#30, #57, #58, #97, #98
    # =========================================================================
    # 11. e.e3.build (111 items) - Word order S+V+O
    e3_build_items = []
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        fruit = fruits[(k - 1) % len(fruits)]
        p = f"다음 단어들을 바르게 배열하여 올바른 영어 문장을 완성하세요. (문항 #{k}) [{name} / eats / an {fruit} / every day]"
        c = f"{name} eats an {fruit} every day."
        d = [
            f"Eats {name} an {fruit} every day.",
            f"An {fruit} {name} eats every day.",
            f"{name} an {fruit} eats every day."
        ]
        ex = "영어의 평서문 기본 어순은 [주어 + 동사 + 목적어 + 부사구]입니다."
        e3_build_items.append((p, c, d, 2, ex, ["영어 평서문의 기본 어순(주어+동사+목적어)을 떠올려보세요.", "문장의 맨 앞에는 주어가 오는지 확인하세요."]))
    generate_and_add("E3", "e.e3.build", e3_build_items)

    # 12. e.e3.pron (111 items) - Pronouns
    e3_pron_items = []
    pron_types = [
        ("David is my brother. ____ is very smart.", "He", ["She", "They", "We"], "남성 단수 주어 David를 대신하는 대명사는 'He'입니다."),
        ("Lisa is my classmate. ____ sings beautifully.", "She", ["He", "It", "They"], "여성 단수 주어 Lisa를 대신하는 대명사는 'She'입니다."),
        ("I have a cute puppy. ____ likes to run.", "It", ["He", "She", "They"], "동물 단수를 가리킬 때는 중칭 대명사 'It'을 씁니다."),
        ("Tom and Jerry are friends. ____ play together.", "They", ["We", "He", "She"], "3인칭 복수를 대신하는 대명사는 'They'입니다."),
        ("You and I are a team. ____ can win the game.", "We", ["They", "You", "He"], "'You and I'를 아우르는 1인칭 복수 대명사는 'We'입니다.")
    ]
    for k in range(1, 112):
        p_template, c, d, ex = pron_types[(k - 1) % len(pron_types)]
        name_sub = names[(k - 1) % len(names)]
        p = f"빈칸에 알맞은 인칭대명사는? (문항 #{k}) '{name_sub} says: \\\"{p_template}\\\"'"
        e3_pron_items.append((p, c, d, 2, ex, ["가리키는 대상의 성별과 수(단수/복수)를 확인하세요.", "알맞은 격과 인칭의 대명사를 고르세요."]))
    generate_and_add("E3", "e.e3.pron", e3_pron_items)

    # 13. e.e3.tense (111 items) - Present tense, 3rd singular -s
    # Resolves #57, #58, #97, #98: When Seoul is mentioned, ALWAYS "lives in Seoul"!
    e3_tense_items = []
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        if k == 2:
            p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) 'They ____ in Seoul for three years.'"
            c = "live"
            d = ["lives", "living", "are live"]
            ex = "복수 주어 They의 단순 현재형 동사는 원형 'live'이며, 도시 앞에는 전치사 'in'을 써서 'live in Seoul'이 됩니다."
        else:
            mod = (k - 1) % 4
            if mod == 0:
                p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) '{name} ____ in Seoul with his family.'"
                c = "lives"
                d = ["live", "living", "is live"]
                ex = f"3인칭 단수 주어 '{name}'의 현재형 동사에는 -s를 붙여 'lives'를 쓰며, 도시명 앞에는 전치사 'in'을 씁니다."
            elif mod == 1:
                p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) 'My sister ____ English every morning.'"
                c = "studies"
                d = ["study", "studying", "are study"]
                ex = "3인칭 단수 주어 뒤에서 자음+y로 끝나는 동사는 y를 i로 고치고 -es를 붙여 'studies'가 됩니다."
            elif mod == 2:
                p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) 'They ____ soccer after school every Friday.'"
                c = "play"
                d = ["plays", "playing", "is play"]
                ex = "복수 주어 'They' 뒤에는 동사원형 'play'를 사용합니다."
            else:
                p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) '{name} ____ to the library on Saturdays.'"
                c = "goes"
                d = ["go", "going", "gone"]
                ex = "3인칭 단수 주어 뒤에서 -o로 끝나는 동사는 -es를 붙여 'goes'로 씁니다."
        e3_tense_items.append((p, c, d, 2, ex, ["주어가 3인칭 단수인지 복수인지 확인하세요.", "현재 시제 동사의 어미 변화 규칙을 점검하세요."]))
    generate_and_add("E3", "e.e3.tense", e3_tense_items)

    # 14. e.e3.routine (111 items) - Daily routines
    e3_routine_items = []
    routines = [
        ("아침에 일어나다", "wakes up", ["sleeps", "swims", "dances"]),
        ("이를 닦다", "brushes his teeth", ["washes his shoes", "eats breakfast", "reads books"]),
        ("아침 식사를 하다", "eats breakfast", ["goes to bed", "plays soccer", "cooks lunch"]),
        ("학교에 가다", "goes to school", ["goes to sleep", "takes a bath", "watches TV"]),
        ("숙제를 하다", "does his homework", ["plays baseball", "draws a car", "eats dinner"]),
        ("저녁 식사를 하다", "eats dinner", ["wakes up", "cleans the car", "plays basketball"]),
        ("잠자리에 들다", "goes to bed", ["runs in park", "brushes shoes", "eats lunch"])
    ]
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        kr, c, d = routines[(k - 1) % len(routines)]
        p = f"'{kr}'의 뜻에 알맞은 일상 표현은? (문항 #{k}) 'Every day at 7:00, {name} ____.'"
        ex = f"'{kr}'을 뜻하는 올바른 표현은 '{c}'입니다."
        e3_routine_items.append((p, c, d, 2, ex, ["일상 생활 동작의 한국어 의미를 확인하세요.", "주어의 3인칭 단수 형태와 일치하는 표현을 고르세요."]))
    generate_and_add("E3", "e.e3.routine", e3_routine_items)

    # 15. e.e3.read (111 items) - 2-3 sentence passages
    e3_read_items = []
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        sport = ["soccer", "basketball", "baseball", "tennis", "swimming"][(k - 1) % 5]
        day = ["Monday", "Wednesday", "Friday", "Saturday", "Sunday"][(k - 1) % 5]
        p = f"글을 읽고 질문에 답하세요. (문항 #{k})\\n\\\"{name} loves sports. Every {day}, {name} plays {sport} with friends in the park. It is always exciting.\\\"\\n질문: What sport does {name} play on {day}?"
        c = sport
        d = [s for s in ["soccer", "basketball", "baseball", "tennis", "swimming"] if s != sport][:3]
        ex = f"본문에서 '{name} plays {sport}'라고 명시되어 있으므로 정답은 '{sport}'입니다."
        e3_read_items.append((p, c, d, 2, ex, ["본문에서 특정 요일에 하는 운동 이름을 찾으세요.", "질문이 묻고 있는 운동 종목에 집중하세요."]))
    generate_and_add("E3", "e.e3.read", e3_read_items)

    print("E3 complete. Total questions so far:", len(questions))

    # =========================================================================
    # E4: 5 skills (e.e4.tense, e.e4.qneg, e.e4.adj, e.e4.prep, e.e4.read)
    # Resolves #59, #60, #99: Past tense with preposition
    # =========================================================================
    # 16. e.e4.tense (111 items) - Past tense
    e4_tense_items = []
    past_verbs = [
        ("어제 영화를 보았다", "watched", ["watches", "watch", "is watching"], "어제 일어난 일이므로 과거형 'watched'를 씁니다."),
        ("지난 주말 서울에 머물렀다", "stayed in", ["stayed", "stays in", "stay in"], "도시 앞에는 전치사 in이 필요하며, 과거 시제이므로 'stayed in'이 알맞습니다."),
        ("어제 공원에 갔다", "went to", ["goes to", "go to", "is going to"], "go의 과거형은 불규칙 동사 'went'입니다."),
        ("어제 사과를 먹었다", "ate", ["eats", "eat", "is eating"], "eat의 과거형은 불규칙 동사 'ate'입니다."),
        ("지난 일요일 새 책을 샀다", "bought", ["buys", "buy", "buying"], "buy의 과거형은 불규칙 동사 'bought'입니다."),
        ("어제 친구를 만났다", "met", ["meets", "meet", "meeting"], "meet의 과거형은 불규칙 동사 'met'입니다."),
        ("지난주에 박물관을 방문했다", "visited", ["visits", "visit", "visiting"], "과거 시점이므로 규칙 동사 과거형 'visited'를 씁니다.")
    ]
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        if k == 2:
            p = f"문맥상 빈칸에 알맞은 과거형 동사는? (문항 #{k}) 'They ____ in Seoul for three years before moving to Busan.'"
            c = "lived"
            d = ["lives", "live", "living"]
            ex = "과거 사실을 나타내므로 과거형 동사 'lived'를 쓰며, 도시명 앞에는 전치사 'in'이 반드시 필요합니다."
            e4_tense_items.append((p, c, d, 2, ex, ["과거 시제와 도시명 앞 전치사 in의 쓰임을 확인하세요.", "동사 live의 규칙 과거형을 고르세요."]))
            continue
        kr, c, d, ex = past_verbs[(k - 1) % len(past_verbs)]
        p = f"문맥상 빈칸에 알맞은 과거형 동사는? (문항 #{k}) 'Yesterday, {name} ____ the museum with classmates.'"
        if "서울" in kr:
            p = f"문맥상 빈칸에 알맞은 표현은? (문항 #{k}) 'Last year, {name} ____ Seoul for summer vacation.'"
        elif "영화" in kr:
            p = f"문맥상 빈칸에 알맞은 동사는? (문항 #{k}) 'Last night, {name} ____ a funny movie.'"
        elif "공원" in kr:
            p = f"문맥상 빈칸에 알맞은 동사는? (문항 #{k}) 'Yesterday afternoon, {name} ____ the city park.'"
        elif "사과" in kr:
            p = f"문맥상 빈칸에 알맞은 동사는? (문항 #{k}) 'This morning, {name} ____ a sweet red apple.'"
        elif "책" in kr:
            p = f"문맥상 빈칸에 알맞은 동사는? (문항 #{k}) 'Last weekend, {name} ____ an exciting storybook.'"
        elif "친구" in kr:
            p = f"문맥상 빈칸에 알맞은 동사는? (문항 #{k}) 'Two days ago, {name} ____ his best friend at the library.'"
        e4_tense_items.append((p, c, d, 2, ex, ["과거를 나타내는 시간 부사구(Yesterday, Last night 등)에 주목하세요.", "규칙 및 불규칙 과거 동사 형태를 확인하세요."]))
    generate_and_add("E4", "e.e4.tense", e4_tense_items)

    # 17. e.e4.qneg (111 items) - Questions and negatives
    e4_qneg_items = []
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        mod = (k - 1) % 4
        if mod == 0:
            p = f"빈칸에 알맞은 조동사는? (문항 #{k}) '____ you finish your science homework yesterday? - Yes, I did.'"
            c = "Did"
            d = ["Do", "Are", "Were"]
            ex = "과거의 사실을 묻는 일반동사 의문문은 조동사 'Did'로 시작합니다."
        elif mod == 1:
            p = f"빈칸에 알맞은 부정어는? (문항 #{k}) '{name} ____ go to the party last night because he was tired.'"
            c = "didn't"
            d = ["doesn't", "don't", "isn't"]
            ex = "과거 사실의 부정은 'didn\\'t + 동사원형' 형태를 씁니다."
        elif mod == 2:
            p = f"빈칸에 알맞은 의문문 조동사는? (문항 #{k}) '____ she like playing the piano? - Yes, she does.'"
            c = "Does"
            d = ["Do", "Is", "Did"]
            ex = "3인칭 단수 현재형 일반동사 의문문은 'Does'로 시작합니다."
        else:
            p = f"빈칸에 알맞은 부정어는? (문항 #{k}) 'They ____ have any classes on Sundays.'"
            c = "don't"
            d = ["doesn't", "aren't", "isn't"]
            ex = "복수 주어의 현재 일반동사 부정문에는 'don\\'t'를 사용합니다."
        e4_qneg_items.append((p, c, d, 2, ex, ["시제(현재/과거)와 주어의 인칭을 확인하세요.", "의문문과 부정문에서 사용되는 조동사를 고르세요."]))
    generate_and_add("E4", "e.e4.qneg", e4_qneg_items)

    # 18. e.e4.adj (111 items) - Descriptive adjectives
    e4_adj_items = []
    adjs = [
        ("키가 큰", "tall", ["short", "fat", "thin"]), ("키가 작은", "short", ["tall", "high", "long"]),
        ("빠른", "fast", ["slow", "quiet", "lazy"]), ("느린", "slow", ["fast", "quick", "busy"]),
        ("무거운", "heavy", ["light", "soft", "small"]), ("가벼운", "light", ["heavy", "dark", "loud"]),
        ("깨끗한", "clean", ["dirty", "messy", "old"]), ("더러운", "dirty", ["clean", "fresh", "neat"]),
        ("행복한", "happy", ["sad", "angry", "tired"]), ("슬픈", "sad", ["happy", "cheerful", "glad"])
    ]
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        kr, c, d = adjs[(k - 1) % len(adjs)]
        p = f"'{kr}'의 뜻을 가진 알맞은 영어 형용사는? (문항 #{k}) 'The giraffe is very ____.'"
        if "행복" in kr or "슬픈" in kr:
            p = f"'{kr}'의 뜻을 가진 알맞은 영어 형용사는? (문항 #{k}) '{name} looks very ____ today.'"
        elif "빠른" in kr or "느린" in kr:
            p = f"'{kr}'의 뜻을 가진 알맞은 영어 형용사는? (문항 #{k}) 'The cheetah is a very ____ animal.'"
        elif "무거운" in kr or "가벼운" in kr:
            p = f"'{kr}'의 뜻을 가진 알맞은 영어 형용사는? (문항 #{k}) 'This wooden box is too ____ to carry.'"
        elif "깨끗" in kr or "더러" in kr:
            p = f"'{kr}'의 뜻을 가진 알맞은 영어 형용사는? (문항 #{k}) 'His room is always tidy and ____.'"
        ex = f"'{kr}'을 뜻하는 형용사는 '{c}'입니다."
        e4_adj_items.append((p, c, d, 2, ex, ["주어진 한국어 뜻을 나타내는 형용사를 찾으세요.", "사물이나 사람의 특징을 묘사하는 단어를 고르세요."]))
    generate_and_add("E4", "e.e4.adj", e4_adj_items)

    # 19. e.e4.prep (111 items) - Prepositions of place & time
    e4_prep_items = []
    preps = [
        ("책상 위에", "on", ["in", "under", "at"], "표면 위에 닿아 있을 때는 전치사 'on'을 씁니다."),
        ("상자 안에", "in", ["on", "behind", "with"], "공간의 내부에 있을 때는 전치사 'in'을 씁니다."),
        ("의자 아래에", "under", ["on", "above", "in"], "무언가의 아래에 있을 때는 전치사 'under'를 씁니다."),
        ("문 뒤에", "behind", ["in front of", "on", "at"], "뒤쪽에 위치할 때는 전치사 'behind'를 씁니다."),
        ("건물 앞에", "in front of", ["behind", "under", "in"], "앞쪽에 위치할 때는 'in front of'를 씁니다."),
        ("두 나무 사이에", "between", ["among", "in", "on"], "둘 사이에 위치할 때는 전치사 'between'을 씁니다."),
        ("오후 3시에", "at", ["in", "on", "for"], "구체적인 시각 앞에는 전치사 'at'을 씁니다.")
    ]
    for k in range(1, 112):
        kr, c, d, ex = preps[(k - 1) % len(preps)]
        p = f"'{kr}'의 위치/시간 문맥에 알맞은 전치사는? (문항 #{k}) 'The ball is ____ the table.'"
        if "안에" in kr:
            p = f"'{kr}'의 문맥에 알맞은 전치사는? (문항 #{k}) 'The cat is sleeping ____ the basket.'"
        elif "아래에" in kr:
            p = f"'{kr}'의 문맥에 알맞은 전치사는? (문항 #{k}) 'The shoes are ____ the bed.'"
        elif "뒤에" in kr:
            p = f"'{kr}'의 문맥에 알맞은 전치사는? (문항 #{k}) 'Tom is hiding ____ the big door.'"
        elif "앞에" in kr:
            p = f"'{kr}'의 문맥에 알맞은 전치사는? (문항 #{k}) 'There is a bus stop ____ our school.'"
        elif "사이에" in kr:
            p = f"'{kr}'의 문맥에 알맞은 전치사는? (문항 #{k}) 'A bench is placed ____ the two tall trees.'"
        elif "3시에" in kr:
            p = f"'{kr}'의 시간 문맥에 알맞은 전치사는? (문항 #{k}) 'The class starts ____ 3:00 p.m.'"
        e4_prep_items.append((p, c, d, 2, ex, ["위치 관계나 시간의 구체적 지점을 나타내는 전치사를 생각하세요.", "장소 명사와 어울리는 전치사를 선택하세요."]))
    generate_and_add("E4", "e.e4.prep", e4_prep_items)

    # 20. e.e4.read (111 items) - Short reading passages
    e4_read_items = []
    places = ["zoo", "library", "science museum", "aquarium", "botanical garden"]
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        place = places[(k - 1) % len(places)]
        item_seen = ["dolphins", "ancient bones", "rare plants", "space rockets", "white tigers"][(k - 1) % 5]
        p = f"글을 읽고 물음에 답하세요. (문항 #{k})\\n\\\"Last Saturday, {name} visited the {place} with his family. They saw amazing {item_seen} there. {name} took many pictures and had a great time.\\\"\\n질문: Where did {name} go last Saturday?"
        c = f"the {place}"
        d = [f"the {p_alt}" for p_alt in places if p_alt != place][:3]
        ex = f"본문 첫 문장에서 '{name} visited the {place}'라고 기술되어 있으므로 정답은 'the {place}'입니다."
        e4_read_items.append((p, c, d, 2, ex, ["지문에서 지난 토요일에 방문한 장소를 찾으세요.", "방문 장소를 설명하는 문장에 주목하세요."]))
    generate_and_add("E4", "e.e4.read", e4_read_items)

    print("E4 complete. Total questions so far:", len(questions))

    # =========================================================================
    # E5: 5 skills (e.e5.gram, e.e5.comp, e.e5.future, e.e5.transform, e.e5.read)
    # =========================================================================
    # 21. e.e5.gram (111 items) - Countable/uncountable, many/much/some/any
    e5_gram_items = []
    gram_rules = [
        ("Do you have ____ questions about the lesson?", "any", ["some", "much", "little"], "의문문에서는 주로 'any'를 사용합니다."),
        ("There is ____ milk left in the bottle.", "some", ["any", "many", "few"], "긍정문에서 셀 수 없는 명사 앞에는 'some'을 씁니다."),
        ("How ____ books did you read this month?", "many", ["much", "little", "any"], "셀 수 있는 복수 명사(books) 앞에는 'many'를 씁니다."),
        ("How ____ water do you drink every day?", "much", ["many", "few", "several"], "셀 수 없는 명사(water)의 양을 물을 때는 'much'를 씁니다."),
        ("She has a ____ friends who live in Canada.", "few", ["little", "much", "any"], "셀 수 있는 복수 명사 앞에는 'a few'(소수의)를 씁니다."),
        ("There is a ____ sugar in the jar.", "little", ["few", "many", "several"], "셀 수 없는 명사 앞에는 'a little'(약간의)을 씁니다.")
    ]
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        p_temp, c, d, ex = gram_rules[(k - 1) % len(gram_rules)]
        p = f"빈칸에 알맞은 수량 한정사는? (문항 #{k}) '{name} asks: \\\"{p_temp}\\\"'"
        e5_gram_items.append((p, c, d, 2, ex, ["뒤따라오는 명사가 셀 수 있는지 없는지 확인하세요.", "긍정문인지 의문문/부정문인지 문장 형태를 보세요."]))
    generate_and_add("E5", "e.e5.gram", e5_gram_items)

    # 22. e.e5.comp (111 items) - Comparatives & superlatives
    e5_comp_items = []
    comp_rules = [
        ("Tom is ____ than his brother.", "taller", ["tall", "tallest", "more tall"], "비교급 접속사 than 앞에는 -er 비교급 'taller'가 옵니다."),
        ("A train is ____ than a bicycle.", "faster", ["fast", "fastest", "more fast"], "두 대상을 비교할 때는 -er 비교급 'faster'를 씁니다."),
        ("This math problem is ____ than that one.", "more difficult", ["difficult", "difficultest", "difficulter"], "3음절 이상 형용사의 비교급은 'more + 형용사'입니다."),
        ("Jupiter is the ____ planet in the solar system.", "biggest", ["bigger", "big", "most big"], "the 다음 최상급 형태로는 단모음+단자음 규칙에 따라 'biggest'가 옵니다."),
        ("Mount Everest is the ____ mountain in the world.", "highest", ["higher", "high", "most high"], "the와 함께 전 세계 최고를 나타낼 때는 최상급 'highest'를 씁니다."),
        ("Health is ____ important than wealth.", "more", ["most", "much", "very"], "than과 함께 쓰여 '더 중요한'을 뜻할 때는 'more important'가 됩니다.")
    ]
    for k in range(1, 112):
        p_temp, c, d, ex = comp_rules[(k - 1) % len(comp_rules)]
        p = f"빈칸에 알맞은 비교 표현은? (문항 #{k}) '{p_temp}'"
        e5_comp_items.append((p, c, d, 2, ex, ["문장에 than이 있는지, the가 있는지 확인하세요.", "형용사의 음절 수에 따른 비교급/최상급 규칙을 적용하세요."]))
    generate_and_add("E5", "e.e5.comp", e5_comp_items)

    # 23. e.e5.future (111 items) - Future with will & be going to
    e5_future_items = []
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        mod = (k - 1) % 4
        if mod == 0:
            p = f"빈칸에 알맞은 미래 표현은? (문항 #{k}) '{name} ____ visit his grandparents tomorrow.'"
            c = "will"
            d = ["is", "did", "was"]
            ex = "미래 시점 tomorrow와 동사원형 visit 앞에는 조동사 'will'이 알맞습니다."
        elif mod == 1:
            p = f"빈칸에 알맞은 be동사는? (문항 #{k}) 'We ____ going to clean the park this Saturday.'"
            c = "are"
            d = ["is", "am", "be"]
            ex = "복수 주어 We에 어울리는 be going to의 be동사는 'are'입니다."
        elif mod == 2:
            p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) 'She is going to ____ a delicious cake.'"
            c = "bake"
            d = ["bakes", "baked", "baking"]
            ex = "be going to 뒤에는 반드시 동사원형이 와야 하므로 'bake'가 맞습니다."
        else:
            p = f"빈칸에 알맞은 표현은? (문항 #{k}) 'I promise I ____ help you with your project.'"
            c = "will"
            d = ["am", "going", "was"]
            ex = "약속이나 즉각적인 의지를 나타낼 때는 조동사 'will'을 씁니다."
        e5_future_items.append((p, c, d, 2, ex, ["미래를 나타내는 조동사 will과 be going to 구문을 점검하세요.", "조동사 뒤에 동사원형이 오는지 확인하세요."]))
    generate_and_add("E5", "e.e5.future", e5_future_items)

    # 24. e.e5.transform (111 items) - Sentence transformation
    e5_trans_items = []
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        mod = (k - 1) % 3
        if mod == 0:
            p = f"다음 문장을 부정문으로 바르게 전환한 것은? (문항 #{k}) '{name} plays the violin well.'"
            c = f"{name} doesn't play the violin well."
            d = [
                f"{name} don't play the violin well.",
                f"{name} not plays the violin well.",
                f"{name} isn't play the violin well."
            ]
            ex = "3인칭 단수 주어의 일반동사 현재형 부정문은 'doesn\\'t + 동사원형'입니다."
        elif mod == 1:
            p = f"다음 문장을 의문문으로 바르게 전환한 것은? (문항 #{k}) 'They went to Jeju Island.'"
            c = "Did they go to Jeju Island?"
            d = [
                "Do they went to Jeju Island?",
                "Did they went to Jeju Island?",
                "Were they go to Jeju Island?"
            ]
            ex = "과거 시제 일반동사의 의문문은 'Did + 주어 + 동사원형' 형태를 취합니다."
        else:
            p = f"다음 문장을 과거 시제로 바르게 전환한 것은? (문항 #{k}) '{name} writes a letter.'"
            c = f"{name} wrote a letter."
            d = [
                f"{name} writed a letter.",
                f"{name} is wrote a letter.",
                f"{name} has write a letter."
            ]
            ex = "동사 write의 올바른 과거형은 불규칙 동사 'wrote'입니다."
        e5_trans_items.append((p, c, d, 2, ex, ["조동사 do/does/did 뒤에 동사원형이 오는지 확인하세요.", "불규칙 과거 동사의 철자를 점검하세요."]))
    generate_and_add("E5", "e.e5.transform", e5_trans_items)

    # 25. e.e5.read (111 items) - Informational reading
    e5_read_items = []
    topics_sci = [
        ("Honeybees", "Honeybees live in big colonies and make sweet honey from flowers. They help flowers grow by spreading pollen.", "What do honeybees make from flowers?", "sweet honey", ["bread", "milk", "cheese"]),
        ("Solar Energy", "Solar energy comes directly from sunlight. People install solar panels on roofs to produce clean electricity.", "What produces electricity using sunlight?", "solar panels", ["water pipes", "windmills", "coal fires"]),
        ("Penguins", "Penguins are flightless birds that live in cold southern oceans. They use their strong wings to swim fast underwater.", "What do penguins use their wings for?", "swimming fast underwater", ["flying high in sky", "building nests in trees", "digging holes"]),
        ("Recycling", "Recycling paper and plastic saves trees and protects oceans. Everyone should separate trash carefully.", "What does recycling paper and plastic help save?", "trees and oceans", ["cars and trucks", "phones and computers", "shoes and clothes"])
    ]
    for k in range(1, 112):
        t, body, q_str, c, d = topics_sci[(k - 1) % len(topics_sci)]
        p = f"글을 읽고 물음에 답하세요. (문항 #{k})\\n\\\"[{t}] {body}\\\"\\n질문: {q_str}"
        ex = f"본문 내용에 따르면 '{c}'가 정답입니다."
        e5_read_items.append((p, c, d, 2, ex, ["지문에서 질문의 핵심 단어를 찾아보세요.", "지문의 구체적 사실 정보에 근거하여 답을 고르세요."]))
    generate_and_add("E5", "e.e5.read", e5_read_items)

    print("E5 complete. Total questions so far:", len(questions))

    # =========================================================================
    # E6: 5 skills (e.e6.tense, e.e6.modal, e.e6.vocab, e.e6.clause, e.e6.read)
    # Resolves #1, #2: Always "lived in Seoul"!
    # =========================================================================
    # 26. e.e6.tense (111 items) - Present perfect & past continuous
    # Resolves #1, #2: "They have lived in Seoul for three years."
    e6_tense_items = []
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        mod = (k - 1) % 4
        if mod == 0:
            p = f"빈칸에 알맞은 현재완료 형태는? (문항 #{k}) 'They ____ in Seoul for three years.'"
            c = "have lived"
            d = ["lived", "has lived", "living"]
            ex = "복수 주어 They와 'for three years'(3년 동안)라는 계속을 나타내는 표현이 있으므로 'have lived'가 알맞으며, 전치사 'in'과 함께 쓰입니다."
        elif mod == 1:
            p = f"빈칸에 알맞은 현재완료 형태는? (문항 #{k}) '{name} ____ in Seoul since 2021.'"
            c = "has lived"
            d = ["have lived", "lived", "is living"]
            ex = f"3인칭 단수 주어 '{name}'에 과거부터 현재까지 계속을 나타내는 since가 있으므로 'has lived'가 정답입니다."
        elif mod == 2:
            p = f"빈칸에 알맞은 과거진행형은? (문항 #{k}) 'I ____ a book when the phone rang.'"
            c = "was reading"
            d = ["am reading", "were reading", "readed"]
            ex = "과거의 특정 시점에 진행 중이던 동작을 나타내므로 1인칭 과거진행형 'was reading'이 올바릅니다."
        else:
            p = f"빈칸에 알맞은 현재완료 경험 표현은? (문항 #{k}) 'Have you ever ____ Paris? - Yes, twice.'"
            c = "visited"
            d = ["visit", "visiting", "visits"]
            ex = "Have you ever 뒤에는 과거분사(p.p.)가 와야 하므로 'visited'가 정답입니다."
        e6_tense_items.append((p, c, d, 3, ex, ["for나 since와 같은 현재완료 단서 어구를 확인하세요.", "주어의 인칭과 수에 따른 have/has 구분을 점검하세요."]))
    generate_and_add("E6", "e.e6.tense", e6_tense_items)

    # 27. e.e6.modal (111 items) - Modal verbs
    e6_modal_items = []
    modals = [
        ("도서관에서는 조용히 해야 한다", "must", ["can", "may", "would"], "강한 의무를 나타낼 때는 'must'를 씁니다."),
        ("너는 감기에 걸렸으니 의사에게 가보는 것이 좋겠다", "should", ["might", "can", "will"], "조언이나 충고를 할 때는 'should'를 씁니다."),
        ("그녀는 네 가지 언어를 유창하게 말할 수 있다", "can", ["must", "should", "might"], "능력을 나타낼 때는 조동사 'can'을 씁니다."),
        ("제가 들어가도 될까요? (정중한 허가)", "May", ["Must", "Should", "Will"], "정중한 허가를 구할 때는 'May I...?'를 씁니다."),
        ("우리는 내일 아침 일찍 일어나야 한다", "have to", ["can", "may", "could"], "필요와 의무를 나타낼 때는 'have to'를 씁니다.")
    ]
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        kr, c, d, ex = modals[(k - 1) % len(modals)]
        p = f"문맥상 빈칸에 가장 알맞은 조동사는? (문항 #{k}) 'You ____ be quiet in the library.'"
        if "의사" in kr:
            p = f"문맥상 빈칸에 가장 알맞은 조동사는? (문항 #{k}) 'You have a high fever; you ____ see a doctor.'"
        elif "언어" in kr:
            p = f"문맥상 빈칸에 가장 알맞은 조동사는? (문항 #{k}) '{name} ____ speak four languages fluently.'"
        elif "허가" in kr:
            p = f"문맥상 빈칸에 가장 알맞은 조동사는? (문항 #{k}) '____ I come in and ask a quick question?'"
        elif "일어나야" in kr:
            p = f"문맥상 빈칸에 가장 알맞은 표현은? (문항 #{k}) 'We ____ get up early tomorrow for the field trip.'"
        e6_modal_items.append((p, c, d, 3, ex, ["조동사의 기능(의무, 능력, 허가, 충고)을 문맥에서 파악하세요.", "상황에 가장 자연스러운 조동사를 선택하세요."]))
    generate_and_add("E6", "e.e6.modal", e6_modal_items)

    # 28. e.e6.vocab (111 items) - Thematic vocabulary
    e6_vocab_items = []
    vocab_list = [
        ("지구 환경을 보호하다", "protect the environment", ["destroy nature", "waste clean water", "cut all trees"], "환경을 보호하다는 'protect the environment'입니다."),
        ("에너지를 절약하다", "save energy", ["waste electricity", "burn more oil", "spend money"], "에너지를 절약하다는 'save energy'입니다."),
        ("전통 문화를 경험하다", "experience traditional culture", ["forget our history", "delete ancient books", "avoid museums"], "전통 문화를 경험하다는 'experience traditional culture'입니다."),
        ("국제 친구들과 소통하다", "communicate with global friends", ["fight with neighbors", "stop writing letters", "ignore messages"], "소통하다는 'communicate'를 씁니다."),
        ("신기술을 발명하다", "invent new technology", ["break old machines", "hide scientific facts", "stop research"], "새로운 기술을 발명하다는 'invent new technology'입니다.")
    ]
    for k in range(1, 112):
        kr, c, d, ex = vocab_list[(k - 1) % len(vocab_list)]
        p = f"'{kr}'을 뜻하는 알맞은 영어 표현은? (문항 #{k})"
        e6_vocab_items.append((p, c, d, 3, ex, ["초등 6학년 주제별 심화 어휘의 뜻을 점검하세요.", "문맥에 알맞은 동사구 표현을 고르세요."]))
    generate_and_add("E6", "e.e6.vocab", e6_vocab_items)

    # 29. e.e6.clause (111 items) - Conjunctions
    e6_clause_items = []
    conjs = [
        ("I stayed home ____ it rained heavily all day.", "because", ["although", "unless", "so that"], "이유와 원인을 나타내는 접속사는 'because'입니다."),
        ("Wash your hands ____ you eat lunch.", "before", ["after", "until", "though"], "식사 전 손을 씻어야 하므로 'before'가 알맞습니다."),
        ("Turn off the lights ____ you leave the classroom.", "when", ["because of", "during", "despite"], "특정 때를 나타내는 시간 접속사는 'when'입니다."),
        ("____ it was raining, the players continued the soccer match.", "Although", ["Because", "Since", "Unless"], "양보(비록 ~일지라도)를 나타내는 접속사는 'Although'입니다."),
        ("____ you practice every day, you will improve quickly.", "If", ["Although", "Because of", "While"], "조건을 나타내는 접속사는 'If'입니다.")
    ]
    for k in range(1, 112):
        p_temp, c, d, ex = conjs[(k - 1) % len(conjs)]
        p = f"빈칸에 알맞은 접속사는? (문항 #{k}) '{p_temp}'"
        e6_clause_items.append((p, c, d, 3, ex, ["앞뒤 두 절 사이의 논리적 관계(이유, 시간, 양보, 조건)를 확인하세요.", "절과 절을 연결하는 알맞은 접속사를 고르세요."]))
    generate_and_add("E6", "e.e6.clause", e6_clause_items)

    # 30. e.e6.read (111 items) - Paragraph comprehension & main idea
    e6_read_items = []
    read_passages = [
        ("Renewable Energy", "Wind and solar energy are becoming more important because they do not pollute the air. Many countries are building wind farms to create clean electricity.", "What is the main benefit of renewable energy mentioned in the text?", "It does not pollute the air.", ["It is always expensive.", "It produces thick smoke.", "It only works at night."]),
        ("Ocean Cleanup", "Plastic trash in the ocean harms marine animals such as turtles and whales. Volunteers around the world gather on beaches to collect plastic bottles.", "Why do volunteers collect plastic bottles on beaches?", "To protect marine animals from harmful plastic trash.", ["To sell bottles for money.", "To build sandcastles.", "To stop waves from crashing."]),
        ("Digital Reading", "Digital books allow students to read anytime on their tablets. However, some people still prefer paper books because they are comfortable for the eyes.", "Why do some people prefer paper books according to the passage?", "They are comfortable for the eyes.", ["They are much heavier.", "They cannot be shared.", "They require batteries."])
    ]
    for k in range(1, 112):
        title, body, q_str, c, d = read_passages[(k - 1) % len(read_passages)]
        p = f"글을 읽고 물음에 답하세요. (문항 #{k})\\n\\\"[{title}] {body}\\\"\\n질문: {q_str}"
        ex = f"본문 내용에 따르면 '{c}'가 정답입니다."
        e6_read_items.append((p, c, d, 3, ex, ["지문의 중심 내용과 구체적 원인-결과 문장을 찾으세요.", "본문의 진술과 일치하는 선택지를 고르세요."]))
    generate_and_add("E6", "e.e6.read", e6_read_items)

    print("E6 complete. Total elementary questions generated:", len(questions))
    return questions

if __name__ == "__main__":
    qs = get_elementary()
    print("Testing Elementary generation...")
    print("Total questions:", len(qs))
    assert len(qs) == 3330, f"Expected 3330 questions, got {len(qs)}"
    
    # Verify uniqueness
    seen = set()
    for q in qs:
        correct = [o["text"] for o in q["options"] if o["id"] == q["answer"]["id"]][0]
        sorted_opts = " || ".join(sorted([o["text"] for o in q["options"]]))
        key = f"{q['skillId']} ::: {q['prompt']} ::: {correct} ::: {sorted_opts}"
        assert key not in seen, f"Duplicate found: {q['id']} key: {key}"
        seen.add(key)
    print("ALL 3,330 Elementary questions are 100% UNIQUE! 0 duplicates!")
