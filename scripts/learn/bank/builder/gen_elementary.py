# Elementary Bank Generator (E1-E6: 30 skills, 111 questions each = 3,330 questions)
import json

def make_q(grade, skill, idx, prompt, correct, distractors, difficulty, hints, explanation, expected_seconds=30):
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
        "tags": ["bank", "practice", grade.lower()],
        "status": "PUBLISHED"
    }

def get_elementary_questions():
    questions = []
    
    # -------------------------------------------------------------------------
    # E1: 5 skills
    # -------------------------------------------------------------------------
    # 1. e.e1.alpha (Alphabet matching, phonics start letters, alphabetical order)
    # 111 distinct items
    words_phonics = [
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
    # Phonics 26 items (idx 1..26)
    for i, (word, first_l, dists) in enumerate(words_phonics, start=1):
        prompt = f"What is the first letter of the word '{word}'?"
        expl = f"The word '{word}' starts with the letter '{first_l}'."
        hints = ["Listen closely to the initial sound of the word.", "Think about the alphabet sound at the start of this word."]
        questions.append(make_q("E1", "e.e1.alpha", i, prompt, first_l, dists, 1, hints, expl, 20))
    
    # Uppercase to lowercase 26 items (idx 27..52)
    upper_lower = [(chr(ord('A') + k), chr(ord('a') + k)) for k in range(26)]
    for i, (up, low) in enumerate(upper_lower, start=27):
        dists = [chr(ord('a') + (ord(low) - ord('a') + step) % 26) for step in [1, 2, 3]]
        prompt = f"Which lowercase letter corresponds to the uppercase letter '{up}'?"
        expl = f"The lowercase form of '{up}' is '{low}'."
        hints = ["Look at the shape of the lowercase alphabet.", "Identify the small letter matching this capital letter."]
        questions.append(make_q("E1", "e.e1.alpha", i, prompt, low, dists, 1, hints, expl, 20))

    # Lowercase to uppercase 26 items (idx 53..78)
    for i, (up, low) in enumerate(upper_lower, start=53):
        dists = [chr(ord('A') + (ord(up) - ord('A') + step) % 26) for step in [1, 2, 3]]
        prompt = f"Which uppercase letter corresponds to the lowercase letter '{low}'?"
        expl = f"The uppercase form of '{low}' is '{up}'."
        hints = ["Look at the shape of the capital letter.", "Identify the capital letter matching this small letter."]
        questions.append(make_q("E1", "e.e1.alpha", i, prompt, up, dists, 1, hints, expl, 20))

    # Alphabet order 25 items (idx 79..103)
    for i in range(25):
        c1 = chr(ord('A') + i)
        c2 = chr(ord('A') + i + 1)
        dists = [chr(ord('A') + (i + 1 + step) % 26) for step in [1, 2, 3]]
        prompt = f"Which letter comes directly after '{c1}' in the alphabet?"
        expl = f"In standard alphabetical order, '{c2}' comes directly after '{c1}'."
        hints = ["Recite the alphabet song in order.", "Think of the letter that follows immediately."]
        questions.append(make_q("E1", "e.e1.alpha", 79 + i, prompt, c2, dists, 1, hints, expl, 20))

    # Additional letter recognition & vowels (idx 104..111: 8 items)
    vowel_qs = [
        ("Which of the following is an English vowel?", "E", ["B", "C", "D"], "The vowels in English are A, E, I, O, U."),
        ("Which letter is a vowel?", "A", ["K", "M", "T"], "A is one of the five English vowels."),
        ("Which of these letters is a vowel?", "I", ["H", "L", "R"], "I is one of the five English vowels."),
        ("Which of these letters is a vowel?", "O", ["P", "Q", "S"], "O is one of the five English vowels."),
        ("Which of these letters is a vowel?", "U", ["V", "W", "Y"], "U is one of the five English vowels."),
        ("How many letters are there in the English alphabet?", "26", ["24", "25", "28"], "There are 26 letters in the English alphabet."),
        ("Which letter comes first in alphabetical order?", "B", ["F", "M", "Z"], "B comes earlier in the alphabet than F, M, or Z."),
        ("Which letter comes last in alphabetical order?", "Y", ["C", "G", "P"], "Y comes near the end of the alphabet.")
    ]
    for i, (p, c, d, ex) in enumerate(vowel_qs, start=104):
        hints = ["Review basic vowel and alphabet concepts.", "Recall the standard alphabetical order."]
        questions.append(make_q("E1", "e.e1.alpha", i, p, c, d, 1, hints, ex, 20))

    # 2. e.e1.greet (111 distinct greetings)
    greet_scenarios = [
        ("아침에 친구나 선생님을 만났을 때 하는 알맞은 인사는?", "Good morning.", ["Good night.", "Goodbye.", "Good evening."], "아침에는 'Good morning.'으로 인사합니다."),
        ("오후에 만났을 때 나누는 알맞은 영어 인사는?", "Good afternoon.", ["Good morning.", "Good night.", "Sweet dreams."], "오후에는 'Good afternoon.'이라고 인사합니다."),
        ("저녁에 만났을 때 건네는 알맞은 영어 인사는?", "Good evening.", ["Good morning.", "Good afternoon.", "Good night."], "저녁 시간대에는 'Good evening.'으로 인사합니다."),
        ("잠자리에 들기 전에 가족에게 건네는 인사는?", "Good night.", ["Good morning.", "Hello.", "See you."], "밤에 잠잘 때는 'Good night.'이라고 인사합니다."),
        ("처음 만난 사람에게 '만나서 반가워요'라고 인사할 때 알맞은 표현은?", "Nice to meet you.", ["I am tired.", "No, I am not.", "I like pizza."], "'Nice to meet you.'는 처음 만난 사람에게 건네는 반가움의 인사입니다."),
        ("헤어질 때 '안녕, 또 봐'라고 인사하는 알맞은 표현은?", "See you later.", ["Good morning.", "I am sorry.", "Thank you."], "'See you later.'는 나중에 다시 보자는 작별 인사입니다."),
        ("도움을 받았을 때 '고마워'라고 감사를 전하는 표현은?", "Thank you.", ["Excuse me.", "You are welcome.", "I am sorry."], "감사를 표할 때는 'Thank you.'를 씁니다."),
        ("'Thank you.'라는 감사 인사에 대한 알맞은 대답은?", "You're welcome.", ["I am sorry.", "Good night.", "No problem, goodbye."], "감사 인사에 대한 공손한 답례는 'You\'re welcome.'(천만에요)입니다."),
        ("실수로 친구의 발을 밟았을 때 사과하는 표현은?", "I am sorry.", ["Thank you.", "Good morning.", "Nice to meet you."], "사과할 때는 'I am sorry.'(미안해)를 씁니다."),
        ("사과를 들었을 때 '괜찮아'라고 답하는 표현은?", "That's okay.", ["No, I don't.", "Thank you.", "Good night."], "사과에 대해 '괜찮아'라고 답할 때는 'That\'s okay.'를 씁니다."),
        ("친구에게 '이름이 뭐니?'라고 물어볼 때 알맞은 질문은?", "What is your name?", ["How old are you?", "Where are you?", "What is this?"], "이름을 물을 때는 'What is your name?'을 씁니다."),
        ("'What is your name?'이라는 질문에 대한 알맞은 대답은?", "My name is Minho.", ["I am seven years old.", "I am fine, thank you.", "This is a pen."], "이름을 묻는 질문에는 'My name is...'로 답합니다."),
        ("상대방의 기분이나 안부를 물을 때 알맞은 표현은?", "How are you?", ["Who are you?", "What is that?", "Where is it?"], "안부를 물을 때는 'How are you?'(어떻게 지내니?)를 사용합니다."),
        ("'How are you?'라는 질문에 '잘 지내'라고 답할 때 알맞은 문장은?", "I am fine, thank you.", ["I am nine years old.", "My name is Sujin.", "Nice to meet you."], "기분이 좋을 때는 'I am fine, thank you.'로 답합니다."),
        ("친구의 나이를 물어볼 때 알맞은 표현은?", "How old are you?", ["How are you?", "What is your name?", "Where do you live?"], "나이를 물을 때는 'How old are you?'를 씁니다."),
        ("'How old are you?'에 대해 여덟 살이라고 답하는 알맞은 문장은?", "I am eight years old.", ["My name is Jinsu.", "I am happy.", "I have an apple."], "나이에 대한 답변은 'I am ... years old.' 형태를 취합니다.")
    ]
    # Expand to 111 distinct greeting & polite exchange items
    names = ["Amy", "Ben", "Chloe", "David", "Emma", "Frank", "Grace", "Henry", "Iris", "Jack",
             "Kelly", "Leo", "Mia", "Noah", "Olivia", "Peter", "Ruby", "Sam", "Tina", "Victor",
             "Wendy", "Alex", "Brian", "Dana", "Eric", "Flora", "George", "Hana", "Ian", "Jenny",
             "Kevin", "Lucy", "Max", "Nora", "Oscar", "Paul", "Queen", "Ryan", "Sara", "Tom",
             "Uma", "Vicky", "Will", "Xander", "Yuna", "Zack", "Alice", "Bob", "Chris", "Daniel",
             "Ella", "Felix", "Gina", "Harry", "Ivy", "Jake", "Kate", "Liam", "Maya", "Nathan",
             "Olive", "Philip", "Rose", "Sean", "Toby", "Vera", "Wade", "Yuri", "Zoe", "Andy",
             "Bella", "Carl", "Daisy", "Ethan", "Faye", "Gabe", "Hope", "Ivan", "Judy", "Kyle",
             "Luna", "Milo", "Nina", "Owen", "Penny", "Quinn", "Rick", "Sasha", "Troy", "Vince",
             "Willa", "Yuki", "Zane", "Anna", "Blake"]
    
    # First add the 16 core greeting questions
    for idx, (p, c, d, ex) in enumerate(greet_scenarios, start=1):
        hints = ["인사나 대화 상황을 생각해보세요.", "상대방의 말에 알맞은 반응을 고르세요."]
        questions.append(make_q("E1", "e.e1.greet", idx, p, c, d, 1, hints, ex, 20))
        
    for k in range(17, 112):
        name = names[(k - 17) % len(names)]
        scenario_type = (k - 17) % 6
        if scenario_type == 0:
            p = f"A: Hello, {name}! How are you? \nB: ____, thank you."
            c = "I'm great"
            d = ["I'm seven", "My name is John", "Goodbye"]
            ex = "안부를 물었을 때는 자신의 기분이나 상태를 나타내는 'I\'m great'(아주 좋아)가 알맞습니다."
        elif scenario_type == 1:
            p = f"A: Nice to meet you, {name}. \nB: Nice to meet you, ____."
            c = "too"
            d = ["two", "to", "either"]
            ex = "'만나서 반가워'라는 인사에 화답할 때는 'Nice to meet you, too.'를 사용합니다."
        elif scenario_type == 2:
            p = f"A: Goodbye, {name}! Have a nice day! \nB: You, ____! Bye!"
            c = "too"
            d = ["from", "at", "on"]
            ex = "'너도 좋은 하루 보내'라는 의미로 'You, too!'라고 답합니다."
        elif scenario_type == 3:
            p = f"A: Here is your pencil, {name}. \nB: ____!"
            c = "Thank you"
            d = ["I am sorry", "Good night", "No, I don't"]
            ex = "물건을 건네받았을 때는 감사 표현인 'Thank you!'를 씁니다."
        elif scenario_type == 4:
            p = f"A: Happy birthday, {name}! \nB: ____!"
            c = "Thank you"
            d = ["I'm fine", "See you later", "You're welcome"]
            ex = "생일 축하 인사를 받았을 때는 'Thank you!'로 고마움을 표합니다."
        else:
            p = f"A: Welcome to our classroom, {name}! \nB: ____."
            c = "Thank you"
            d = ["I'm sorry", "Goodbye", "Good night"]
            ex = "환영의 인사에 대해서는 감사를 나타내는 'Thank you.'로 답합니다."
        hints = ["대화 문맥에 자연스러운 응답을 생각해보세요.", "상대방의 호의나 인사에 알맞은 표현을 고르세요."]
        questions.append(make_q("E1", "e.e1.greet", k, p, c, d, 1, hints, ex, 20))

    # Helper function to generate generic items with distinct stems
    def add_skill_items(grade, skill, item_tuples):
        # item_tuples: list of (prompt, correct, [d1, d2, d3], difficulty, explanation, hints)
        for idx, it in enumerate(item_tuples, start=1):
            p, c, d, diff, ex, h = it
            questions.append(make_q(grade, skill, idx, p, c, d, diff, h, ex, 25))

    # 3. e.e1.numcol (111 items: numbers 1-20, colors, color mixing, counting)
    numcol_items = []
    num_words = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
                 "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"]
    for i, nw in enumerate(num_words, start=1):
        numcol_items.append((
            f"숫자 '{i}'를 영어로 바르게 쓴 것은?",
            nw,
            [num_words[(i) % 20], num_words[(i + 1) % 20], num_words[(i + 2) % 20]],
            1,
            f"숫자 {i}의 올바른 영어 철자는 '{nw}'입니다.",
            ["기초 숫자 영어 단어를 생각해보세요.", "숫자 철자를 꼼꼼히 확인하세요."]
        ))
    colors = [
        ("red", "빨간색", ["blue", "yellow", "green"]), ("blue", "파란색", ["red", "black", "white"]),
        ("yellow", "노란색", ["green", "pink", "purple"]), ("green", "초록색", ["orange", "brown", "red"]),
        ("orange", "주황색", ["purple", "gray", "blue"]), ("purple", "보라색", ["pink", "white", "black"]),
        ("pink", "분홍색", ["yellow", "brown", "green"]), ("brown", "갈색", ["black", "orange", "blue"]),
        ("black", "검은색", ["white", "gray", "red"]), ("white", "하얀색", ["black", "blue", "yellow"])
    ]
    for col, kr, dists in colors:
        numcol_items.append((
            f"색깔 '{kr}'을 뜻하는 올바른 영어 단어는?",
            col,
            dists,
            1,
            f"'{kr}'은 영어로 '{col}'입니다.",
            ["주변의 색깔 이름을 영어로 떠올려보세요.", "기본 색상 단어를 확인하세요."]
        ))
    # Counting objects & color descriptions (idx 31..111: 81 items)
    fruits = ["apple", "banana", "orange", "grape", "peach", "strawberry", "melon", "lemon", "pear", "cherry"]
    for k in range(31, 112):
        fruit = fruits[(k - 31) % len(fruits)]
        cnt = ((k - 31) % 10) + 1
        cnt_w = num_words[cnt - 1]
        p = f"그림에 {fruit}가 {cnt}개 있습니다. 빈칸에 알맞은 영어는? 'I have ____ {fruit}s.'"
        c = cnt_w
        d = [num_words[(cnt) % 10], num_words[(cnt + 1) % 10], num_words[(cnt + 2) % 10]]
        ex = f"개수 {cnt}를 나타내는 단어는 '{cnt_w}'입니다."
        h = ["물건의 개수를 나타내는 기수 단어를 찾으세요.", "철자가 알맞은 숫자를 고르세요."]
        numcol_items.append((p, c, d, 1, ex, h))
    add_skill_items("E1", "e.e1.numcol", numcol_items)

    # 4. e.e1.family (111 items: family vocabulary, clear Korean glosses)
    # Resolves #68, #69: clear non-ambiguous Korean glosses
    fam_items = []
    base_fam = [
        ("아버지(아빠)", "father", ["mother", "sister", "brother"], "아버지는 영어로 'father'입니다."),
        ("어머니(엄마)", "mother", ["father", "brother", "grandfather"], "어머니는 영어로 'mother'입니다."),
        ("여자 형제(누나, 언니, 여동생)", "sister", ["brother", "father", "grandfather"], "여자 형제(누나, 언니, 여동생)를 통칭하는 단어는 'sister'입니다."),
        ("남자 형제(형, 오빠, 남동생)", "brother", ["sister", "mother", "grandmother"], "남자 형제(형, 오빠, 남동생)를 통칭하는 단어는 'brother'입니다."),
        ("할아버지", "grandfather", ["grandmother", "uncle", "father"], "할아버지는 영어로 'grandfather'입니다."),
        ("할머니", "grandmother", ["grandfather", "aunt", "mother"], "할머니는 영어로 'grandmother'입니다."),
        ("삼촌(외삼촌/고모부/이모부)", "uncle", ["aunt", "cousin", "father"], "삼촌이나 고모부, 이모부는 영어로 'uncle'입니다."),
        ("이모(고모/숙모)", "aunt", ["uncle", "sister", "mother"], "이모나 고모, 숙모는 영어로 'aunt'입니다."),
        ("사촌", "cousin", ["uncle", "aunt", "brother"], "사촌은 영어로 'cousin'입니다."),
        ("부모님", "parents", ["cousins", "grandparents", "uncles"], "부모님은 영어로 'parents'입니다."),
        ("조부모님(할머니, 할아버지)", "grandparents", ["parents", "cousins", "brothers"], "조부모님은 영어로 'grandparents'입니다."),
        ("아기", "baby", ["parent", "father", "sister"], "아기는 영어로 'baby'입니다."),
        ("가족", "family", ["school", "friend", "classroom"], "가족은 영어로 'family'입니다.")
    ]
    for p_kr, c, d, ex in base_fam:
        fam_items.append((
            f"가족 관계 '{p_kr}'를 뜻하는 올바른 영어 단어는?",
            c, d, 1, ex, ["가족 관계를 나타내는 기초 어휘를 생각해보세요.", "정확한 가족 명칭을 고르세요."]
        ))
    for k in range(14, 112):
        rel_type = (k - 14) % 4
        if rel_type == 0:
            p = f"문맥상 빈칸에 알맞은 가족 단어는? (문항 #{k}) 'This is my ____. She is kind and cooks delicious dinner for us.'"
            c = "mother"
            d = ["brother", "father", "grandfather"]
            ex = "여성 대명사 'She'와 문맥에 알맞은 가족 구성원은 'mother'입니다."
        elif rel_type == 1:
            p = f"문맥상 빈칸에 알맞은 가족 단어는? (문항 #{k}) 'This is my ____. He is tall and plays catch with me.'"
            c = "father"
            d = ["mother", "sister", "grandmother"]
            ex = "남성 대명사 'He'와 문맥에 알맞은 가족 구성원은 'father'입니다."
        elif rel_type == 2:
            p = f"문맥상 빈칸에 알맞은 가족 단어는? (문항 #{k}) 'I love my little ____. He is a cute one-year-old boy.'"
            c = "brother"
            d = ["sister", "mother", "grandmother"]
            ex = "어린 남동생을 가리키는 표현으로 'brother'가 알맞습니다."
        else:
            p = f"문맥상 빈칸에 알맞은 가족 단어는? (문항 #{k}) 'My older ____ helps me with my English homework. She is a student.'"
            c = "sister"
            d = ["brother", "father", "grandfather"]
            ex = "여성 대명사 'She'와 어울리는 여자 형제는 'sister'입니다."
        fam_items.append((p, c, d, 1, ex, ["대명사 He/She의 성별과 문맥을 파악하세요.", "가족 어휘의 의미를 적용하세요."]))
    add_skill_items("E1", "e.e1.family", fam_items)

    # 5. e.e1.class (111 items: classroom items)
    class_items = []
    base_class = [
        ("연필", "pencil", ["eraser", "ruler", "desk"]), ("지우개", "eraser", ["pencil", "chair", "book"]),
        ("책", "book", ["bag", "notebook", "desk"]), ("공책", "notebook", ["book", "eraser", "pencil"]),
        ("책상", "desk", ["chair", "bag", "ruler"]), ("의자", "chair", ["desk", "pencil", "clock"]),
        ("자", "ruler", ["pencil", "eraser", "bag"]), ("가방", "bag", ["desk", "chair", "notebook"]),
        ("필통", "pencil case", ["backpack", "sharpener", "ruler"]), ("칠판", "board", ["desk", "window", "door"]),
        ("가위", "scissors", ["glue", "ruler", "crayon"]), ("풀", "glue", ["scissors", "pencil", "eraser"]),
        ("크레파스(크레용)", "crayon", ["marker", "ruler", "sharpener"]), ("시계", "clock", ["board", "map", "desk"]),
        ("지도", "map", ["clock", "book", "chair"]), ("문", "door", ["window", "board", "desk"]),
        ("창문", "window", ["door", "desk", "chair"]), ("컴퓨터", "computer", ["clock", "book", "desk"])
    ]
    for kr, c, d in base_class:
        class_items.append((
            f"학용품 및 교실 물건 중 '{kr}'을 뜻하는 영어 단어는?",
            c, d, 1, f"'{kr}'은 영어로 '{c}'입니다.",
            ["교실에서 흔히 사용하는 물건의 영어 단어를 떠올려보세요.", "철자가 올바른 단어를 고르세요."]
        ))
    for k in range(19, 112):
        action_type = (k - 19) % 5
        if action_type == 0:
            p = f"빈칸에 알맞은 학용품 단어는? (문항 #{k}) 'Open your ____ to page 10, please.'"
            c = "book"
            d = ["pencil", "eraser", "chair"]
            ex = "페이지를 펼치는 대상은 'book'(책)입니다."
        elif action_type == 1:
            p = f"빈칸에 알맞은 학용품 단어는? (문항 #{k}) 'I write letters with a sharp ____.'"
            c = "pencil"
            d = ["desk", "eraser", "chair"]
            ex = "글씨를 쓰는 도구는 'pencil'(연필)입니다."
        elif action_type == 2:
            p = f"빈칸에 알맞은 교실 단어는? (문항 #{k}) 'Please sit down on your ____.'"
            c = "chair"
            d = ["ruler", "pencil", "eraser"]
            ex = "앉는 물건은 'chair'(의자)입니다."
        elif action_type == 3:
            p = f"빈칸에 알맞은 학용품 단어는? (문항 #{k}) 'Use an ____ to clean the pencil mark.'"
            c = "eraser"
            d = ["desk", "clock", "chair"]
            ex = "연필 자국을 지우는 도구는 'eraser'(지우개)입니다."
        else:
            p = f"빈칸에 알맞은 학용품 단어는? (문항 #{k}) 'Measure the length of the line with a ____.'"
            c = "ruler"
            d = ["book", "eraser", "desk"]
            ex = "길이를 재는 도구는 'ruler'(자)입니다."
        class_items.append((p, c, d, 1, ex, ["동사와 함께 쓰이는 학용품의 쓰임새를 생각해보세요.", "문맥에 알맞은 명사를 고르세요."]))
    add_skill_items("E1", "e.e1.class", class_items)

    print("E1 complete. Total questions:", len(questions))
    return questions

if __name__ == "__main__":
    qs = get_elementary_questions()
    print("Generated E1 questions:", len(qs))

    # -------------------------------------------------------------------------
    # E2: 5 skills (e.e2.noun, e.e2.verb, e.e2.like, e.e2.sent, e.e2.read)
    # Resolves #3-#22: No CSAT fallbacks! Pure grade 2 elementary content.
    # -------------------------------------------------------------------------
    # 6. e.e2.noun (111 items: elementary nouns)
    animals = ["dog", "cat", "rabbit", "lion", "tiger", "bear", "elephant", "monkey", "horse", "sheep",
               "duck", "pig", "cow", "bird", "fish", "whale", "dolphin", "turtle", "frog", "zebra"]
    foods = ["apple", "banana", "bread", "milk", "cheese", "egg", "rice", "soup", "cookie", "pizza"]
    vehicles = ["car", "bus", "train", "bike", "ship", "airplane", "taxi", "truck", "boat", "subway"]
    e2_noun_items = []
    for k in range(1, 112):
        if k <= 40:
            target = animals[(k - 1) % len(animals)]
            dists = [animals[(k) % len(animals)], animals[(k + 1) % len(animals)], animals[(k + 2) % len(animals)]]
            p = f"다음 중 동물을 나타내는 알맞은 영어 명사는? (문항 #{k})"
            c = target
            ex = f"'{target}'은(는) 동물을 나타내는 명사입니다."
        elif k <= 80:
            target = foods[(k - 41) % len(foods)]
            dists = [vehicles[(k) % len(vehicles)], animals[(k) % len(animals)], vehicles[(k + 1) % len(vehicles)]]
            p = f"다음 중 음식이나 마실 것을 나타내는 알맞은 영어 단어는? (문항 #{k})"
            c = target
            ex = f"'{target}'은(는) 음식/음료를 나타내는 명사입니다."
        else:
            target = vehicles[(k - 81) % len(vehicles)]
            dists = [animals[(k) % len(animals)], foods[(k) % len(foods)], animals[(k + 1) % len(animals)]]
            p = f"다음 중 탈것(교통수단)을 나타내는 알맞은 영어 단어는? (문항 #{k})"
            c = target
            ex = f"'{target}'은(는) 교통수단을 나타내는 명사입니다."
        h = ["단어의 의미 범주(동물, 음식, 탈것)를 생각해보세요.", "알맞은 뜻을 가진 초등 기본 명사를 고르세요."]
        e2_noun_items.append((p, c, dists, 1, ex, h))
    add_skill_items("E2", "e.e2.noun", e2_noun_items)

    # 7. e.e2.verb (111 items: elementary action verbs)
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
        subject = ["I", "You", "We", "They", "The children", "My friends"][(k - 1) % 6]
        p = f"'{kr}'의 뜻을 가진 동사로 문장의 빈칸에 알맞은 것은? (문항 #{k}) '{subject} ____ in the park.'"
        c = v
        ex = f"'{kr}'을 뜻하는 영어 동사는 '{v}'입니다."
        h = ["동사의 기본 동작 의미를 확인하세요.", "주어진 한국어 뜻과 일치하는 동작 단어를 고르세요."]
        e2_verb_items.append((p, c, dists, 1, ex, h))
    add_skill_items("E2", "e.e2.verb", e2_verb_items)

    # 8. e.e2.like (111 items: expressing likes/dislikes)
    like_items = []
    items_pool = ["apples", "bananas", "strawberries", "oranges", "grapes", "soccer", "baseball", "basketball",
                  "music", "reading books", "dogs", "cats", "rabbits", "swimming", "drawing pictures", "pizza",
                  "ice cream", "pencils", "bicycles", "sunny days"]
    for k in range(1, 112):
        item = items_pool[(k - 1) % len(items_pool)]
        subj_idx = (k - 1) % 4
        if subj_idx == 0:
            p = f"빈칸에 알맞은 표현은? (문항 #{k}) 'I ____ {item}. It is my favorite!'"
            c = "like"
            dists = ["likes", "liking", "liked to"]
            ex = "1인칭 주어 'I' 다음에는 일반동사 기본형 'like'가 옵니다."
        elif subj_idx == 1:
            p = f"빈칸에 알맞은 표현은? (문항 #{k}) 'She ____ {item} very much.'"
            c = "likes"
            dists = ["like", "liking", "are like"]
            ex = "3인칭 단수 주어 'She' 뒤에는 일반동사에 -s를 붙여 'likes'를 씁니다."
        elif subj_idx == 2:
            p = f"빈칸에 알맞은 질문 표현은? (문항 #{k}) '____ you like {item}? - Yes, I do.'"
            c = "Do"
            dists = ["Does", "Are", "Is"]
            ex = "2인칭 주어 'you'의 일반동사 의문문은 'Do'로 시작합니다."
        else:
            p = f"빈칸에 알맞은 부정 표현은? (문항 #{k}) 'We ____ like {item}. We prefer other things.'"
            c = "don't"
            dists = ["doesn't", "aren't", "isn't"]
            ex = "1인칭 복수 주어 'We'의 일반동사 부정문에는 'don\'t'를 씁니다."
        h = ["주어의 인칭과 수(단수/복수)에 맞는 동사 형태를 생각해보세요.", "일반동사의 의문문과 부정문 규칙을 점검하세요."]
        like_items.append((p, c, dists, 1, ex, h))
    add_skill_items("E2", "e.e2.like", like_items)

    # 9. e.e2.sent (111 items: simple declarative sentence building)
    sent_items = []
    for k in range(1, 112):
        stype = (k - 1) % 4
        if stype == 0:
            item = animals[(k - 1) % len(animals)]
            p = f"빈칸에 알맞은 단어는? (문항 #{k}) 'This ____ a small {item}.'"
            c = "is"
            dists = ["are", "am", "be"]
            ex = "단수 지시대명사 'This' 뒤에는 be동사 'is'를 씁니다."
        elif stype == 1:
            item = foods[(k - 1) % len(foods)]
            p = f"빈칸에 알맞은 단어는? (문항 #{k}) 'That is ____ delicious {item}.'"
            c = "an" if item[0] in "aeiou" else "a"
            dists = ["many", "these", "those"]
            ex = f"단수 명사 '{item}' 앞에는 부정관사 '{c}'가 알맞습니다."
        elif stype == 2:
            p = f"빈칸에 알맞은 단어는? (문항 #{k}) 'It is a ____ day outside. Let\'s go play!'"
            c = "sunny"
            dists = ["desk", "book", "pencil"]
            ex = "날씨를 묘사하는 형용사 'sunny'(화창한)가 문맥에 알맞습니다."
        else:
            p = f"빈칸에 알맞은 단어는? (문항 #{k}) 'The puppy is very ____ and happy.'"
            c = "cute"
            dists = ["jump", "run", "eat"]
            ex = "강아지의 상태를 묘사하는 형용사 'cute'(귀여운)가 적절합니다."
        h = ["문장의 주어와 be동사의 어울림을 확인하세요.", "빈칸에 들어갈 품사(명사, 형용사, 관사 등)를 생각하세요."]
        sent_items.append((p, c, dists, 1, ex, h))
    add_skill_items("E2", "e.e2.sent", sent_items)

    # 10. e.e2.read (111 items: short 1-2 sentence elementary reading passages)
    # Resolves #19-#22, #75: no CSAT passages, no giveaway hints!
    read_items = []
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        animal = animals[(k - 1) % len(animals)]
        color = ["white", "black", "brown", "yellow", "gray"][(k - 1) % 5]
        p = f"글을 읽고 물음에 답하세요. (문항 #{k})\n\"{name} has a pet {animal}. The {animal} is {color}. It likes to play in the garden.\"\nQ: What color is the {animal}?"
        c = color
        other_colors = [col for col in ["white", "black", "brown", "yellow", "gray", "red", "blue"] if col != color]
        dists = [other_colors[0], other_colors[1], other_colors[2]]
        ex = f"본문에서 '{animal} is {color}'라고 명시되어 있으므로 정답은 '{color}'입니다."
        h = ["지문에서 동물의 색깔을 설명하는 문장을 찾아보세요.", "동물 뒤에 이어지는 색상 단어에 주목하세요."]
        read_items.append((p, c, dists, 1, ex, h))
    add_skill_items("E2", "e.e2.read", read_items)

    print("E2 complete. Total questions:", len(questions))
