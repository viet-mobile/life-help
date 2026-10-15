import sys

# Generate E2, E3, E4, E5, E6 data cleanly
with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/gen_elementary.py", "a") as f:
    f.write('''
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
            ex = "1인칭 복수 주어 'We'의 일반동사 부정문에는 'don\\'t'를 씁니다."
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
            p = f"빈칸에 알맞은 단어는? (문항 #{k}) 'It is a ____ day outside. Let\\'s go play!'"
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
        p = f"글을 읽고 물음에 답하세요. (문항 #{k})\\n\\\"{name} has a pet {animal}. The {animal} is {color}. It likes to play in the garden.\\\"\\nQ: What color is the {animal}?"
        c = color
        other_colors = [col for col in ["white", "black", "brown", "yellow", "gray", "red", "blue"] if col != color]
        dists = [other_colors[0], other_colors[1], other_colors[2]]
        ex = f"본문에서 '{animal} is {color}'라고 명시되어 있으므로 정답은 '{color}'입니다."
        h = ["지문에서 동물의 색깔을 설명하는 문장을 찾아보세요.", "동물 뒤에 이어지는 색상 단어에 주목하세요."]
        read_items.append((p, c, dists, 1, ex, h))
    add_skill_items("E2", "e.e2.read", read_items)

    print("E2 complete. Total questions:", len(questions))
''')
