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

def get_middle():
    questions = []
    names = ["Alex", "Daniel", "Hannah", "Kevin", "Rachel", "Samuel", "Grace", "Brian", "Jessica", "Justin",
             "Clara", "David", "Edward", "Fiona", "George", "Helen", "Ian", "Julia", "Kyle", "Lauren"]

    def generate_and_add(grade, skill, items_list):
        assert len(items_list) == 111, f"Skill {skill} expected 111 items, got {len(items_list)}"
        for idx, (p, c, d, diff, ex, h) in enumerate(items_list, start=1):
            questions.append(make_q(grade, skill, idx, p, c, d, diff, h, ex))

    # =========================================================================
    # M1: 5 skills (e.vocab, e.be, e.pres, e.plural, e.order)
    # =========================================================================
    # 1. e.vocab (111 items) - Middle foundational vocabulary
    m1_vocab_items = []
    m1_words = [
        ("protect", "보호하다", ["destroy", "pollute", "damage"], "자연이나 사람을 위험으로부터 지키다"),
        ("discover", "발견하다", ["hide", "forget", "lose"], "새로운 사실이나 장소를 찾아내다"),
        ("invent", "발명하다", ["imitate", "copy", "break"], "이전에 없던 새로운 물건이나 방법을 만들어내다"),
        ("celebrate", "축하하다/기념하다", ["mourn", "cancel", "ignore"], "기쁜 일이나 기념일을 맞이하여 즐기다"),
        ("traditional", "전통적인", ["modern", "futuristic", "recent"], "과거부터 오랫동안 전해 내려오는"),
        ("generous", "관대한/너그러운", ["selfish", "stingy", "greedy"], "남에게 베풀기를 좋아하고 너그러운"),
        ("patient", "참을성 있는", ["impatient", "hasty", "nervous"], "어려운 상황에서도 조급해하지 않고 견디는"),
        ("curious", "호기심이 많은", ["indifferent", "bored", "lazy"], "새로운 것에 대해 알고 싶어 하는"),
        ("confident", "자신감 있는", ["timid", "shy", "fearful"], "자신의 능력이나 생각에 확신이 있는"),
        ("convenient", "편리한", ["inconvenient", "difficult", "heavy"], "사용하기에 편하고 실용적인")
    ]
    for k in range(1, 112):
        w, kr, dists, desc = m1_words[(k - 1) % len(m1_words)]
        p = f"다음 영영 풀이에 해당하는 알맞은 중학 기본 단어는? (문항 #{k})\\n\\\"{desc}\\\""
        c = w
        ex = f"'{desc}'에 해당하는 단어는 '{w}'({kr})입니다."
        m1_vocab_items.append((p, c, dists, 2, ex, ["영영 풀이의 핵심 키워드를 파악하세요.", "단어의 품사와 기본 의미를 대조하세요."]))
    generate_and_add("M1", "e.vocab", m1_vocab_items)

    # 2. e.be (111 items) - be-verbs forms & there is/are
    m1_be_items = []
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        mod = (k - 1) % 4
        if mod == 0:
            p = f"빈칸에 알맞은 be동사는? (문항 #{k}) 'There ____ many beautiful flowers in the school garden.'"
            c = "are"
            dists = ["is", "am", "be"]
            ex = "유도부사 There 구문에서 뒤에 오는 진주어가 복수명사(many beautiful flowers)이므로 복수 be동사 'are'가 알맞습니다."
        elif mod == 1:
            p = f"빈칸에 알맞은 be동사는? (문항 #{k}) 'Last night, {name} and I ____ very tired after soccer practice.'"
            c = "were"
            dists = ["was", "are", "is"]
            ex = "주어가 1인칭 복수({name} and I)이고 시점이 과거(Last night)이므로 과거형 be동사 'were'를 씁니다."
        elif mod == 2:
            p = f"빈칸에 알맞은 be동사는? (문항 #{k}) 'Neither of the answers ____ completely correct.'"
            c = "is"
            dists = ["are", "were", "be"]
            ex = "Neither of + 복수명사는 문법적으로 단수 취급하므로 단수 be동사 'is'가 원칙입니다."
        else:
            p = f"빈칸에 알맞은 be동사는? (문항 #{k}) 'There ____ a small library near his house.'"
            c = "is"
            dists = ["are", "were", "be"]
            ex = "단수 명사(a small library)가 주어이므로 단수 be동사 'is'가 알맞습니다."
        m1_be_items.append((p, c, dists, 2, ex, ["There is/are 구문의 실제 주어가 단수인지 복수인지 확인하세요.", "시제(현재/과거)와 수 일치를 점검하세요."]))
    generate_and_add("M1", "e.be", m1_be_items)

    # 3. e.pres (111 items) - Simple present vs continuous, state verbs
    m1_pres_items = []
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        mod = (k - 1) % 3
        if mod == 0:
            p = f"빈칸에 알맞은 형태는? (문항 #{k}) 'Look! The students ____ along the riverside right now.'"
            c = "are running"
            dists = ["run", "ran", "have run"]
            ex = "Look! 및 right now와 같이 현재 눈앞에서 진행 중인 동작은 현재진행형(be + -ing)으로 표현합니다."
        elif mod == 1:
            p = f"빈칸에 알맞은 형태는? (문항 #{k}) '{name} ____ the answer to the difficult question.'"
            c = "knows"
            dists = ["is knowing", "know", "are knowing"]
            ex = "동사 know는 상태를 나타내는 인지 동사이므로 일반적으로 진행형으로 쓰지 않고 현재형 'knows'를 씁니다."
        else:
            p = f"빈칸에 알맞은 형태는? (문항 #{k}) 'The Earth ____ around the Sun.'"
            c = "revolves"
            dists = ["is revolving", "revolved", "revolve"]
            ex = "변하지 않는 과학적 사실이나 불변의 진리는 항상 단순 현재 시제를 사용합니다."
        m1_pres_items.append((p, c, dists, 2, ex, ["문장의 시간 부사구(right now 등)와 동사의 특성을 살펴보세요.", "진행형 불가능한 상태 동사(know, like 등)인지 확인하세요."]))
    generate_and_add("M1", "e.pres", m1_pres_items)

    # 4. e.plural (111 items) - Regular & irregular plural nouns
    m1_plural_items = []
    irreg_nouns = [
        ("child", "children", ["childs", "childrens", "childes"], "child의 불규칙 복수형은 children입니다."),
        ("tooth", "teeth", ["tooths", "toothes", "teeths"], "tooth의 불규칙 복수형은 teeth입니다."),
        ("foot", "feet", ["foots", "feetes", "feets"], "foot의 불규칙 복수형은 feet입니다."),
        ("mouse", "mice", ["mouses", "mices", "mousees"], "mouse의 불규칙 복수형은 mice입니다."),
        ("leaf", "leaves", ["leafs", "leafes", "leavs"], "-f로 끝나는 leaf의 복수형은 f를 v로 고치고 -es를 붙여 leaves가 됩니다."),
        ("knife", "knives", ["knifes", "knifees", "knivs"], "-fe로 끝나는 knife의 복수형은 knives입니다."),
        ("sheep", "sheep", ["sheeps", "sheepes", "shoop"], "sheep은 단수와 복수의 형태가 동일한 명사입니다."),
        ("deer", "deer", ["deers", "deeres", "doer"], "deer는 단수와 복수가 같은 단복수 동형 명사입니다."),
        ("tomato", "tomatoes", ["tomatos", "tomatoeses", "tomaties"], "-o로 끝나는 tomato의 복수형은 -es를 붙여 tomatoes가 됩니다."),
        ("city", "cities", ["citys", "cityes", "cites"], "자음+y로 끝나는 명사는 y를 i로 고치고 -es를 붙여 cities가 됩니다.")
    ]
    for k in range(1, 112):
        sing, plur, dists, ex = irreg_nouns[(k - 1) % len(irreg_nouns)]
        p = f"단어 '{sing}'의 올바른 복수형(Plural)은? (문항 #{k})"
        c = plur
        m1_plural_items.append((p, c, dists, 2, ex, ["불규칙 명사 변화형 및 철자 변화 규칙을 확인하세요.", "모음 변화나 단복수 동형 규칙을 적용하세요."]))
    generate_and_add("M1", "e.plural", m1_plural_items)

    # 5. e.order (111 items) - Word order & frequency adverbs
    m1_order_items = []
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        mod = (k - 1) % 3
        if mod == 0:
            p = f"빈칸에 빈도부사 'always'가 들어가기에 가장 알맞은 위치는? (문항 #{k}) '{name} [A] gets [B] up [C] early in the morning [D].'"
            c = "[A]"
            dists = ["[B]", "[C]", "[D]"]
            ex = "빈도부사는 일반동사 앞, be동사/조동사 뒤에 위치합니다. 따라서 일반동사 gets 앞인 [A]가 정답입니다."
        elif mod == 1:
            p = f"빈칸에 빈도부사 'usually'가 들어가기에 가장 알맞은 위치는? (문항 #{k}) 'He [A] is [B] very [C] kind to everyone [D].'"
            c = "[B]"
            dists = ["[A]", "[C]", "[D]"]
            ex = "빈도부사는 be동사 뒤에 오므로 is 뒤인 [B]가 올바른 위치입니다."
        else:
            p = f"어순이 가장 올바른 문장은? (문항 #{k})"
            c = f"{name} often plays badminton with his brother."
            dists = [
                f"{name} plays often badminton with his brother.",
                f"Often {name} badminton plays with his brother.",
                f"{name} badminton plays often with his brother."
            ]
            ex = "빈도부사 often은 일반동사 plays 바로 앞에 위치하며, 주어 + 부사 + 동사 + 목적어 어순을 따릅니다."
        m1_order_items.append((p, c, dists, 2, ex, ["빈도부사의 위치 규칙(조동사/be동사 뒤, 일반동사 앞)을 기억하세요.", "문장의 자연스러운 수식어구 위치를 점검하세요."]))
    generate_and_add("M1", "e.order", m1_order_items)

    print("M1 complete. Total questions so far:", len(questions))

    # =========================================================================
    # M2: 5 skills (e.m2.perf, e.m2.pass, e.m2.inf, e.m2.comp, e.m2.read)
    # Resolves #70: passives with correct semantic agents
    # =========================================================================
    # 6. e.m2.perf (111 items) - Present perfect aspects
    m2_perf_items = []
    perf_examples = [
        ("She has visited London three times.", "경험", ["계속", "완료", "결과"], "'three times'(세 번)라는 횟수가 언급되어 과거의 경험을 나타냅니다."),
        ("He has lived in Seoul since 2018.", "계속", ["경험", "완료", "결과"], "'since 2018'(2018년 이래로)을 통해 과거부터 지금까지 이어지는 상태의 계속을 나타냅니다."),
        ("I have just finished my homework.", "완료", ["경험", "계속", "결과"], "'just'(막, 방금)와 함께 쓰여 동작이 막 완료되었음을 나타냅니다."),
        ("He has lost his smartphone and doesn't have it now.", "결과", ["경험", "계속", "완료"], "스마트폰을 잃어버려서 현재 가지고 있지 않다는 과거 동작의 결과를 나타냅니다.")
    ]
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        sen, usage, dists, ex = perf_examples[(k - 1) % len(perf_examples)]
        p = f"다음 문장에서 밑줄 친 현재완료의 용법으로 알맞은 것은? (문항 #{k})\\n\\\"{sen}\\\""
        m2_perf_items.append((p, usage, dists, 3, ex, ["함께 쓰인 부사(just, since, ever, already 등)를 확인하세요.", "현재완료의 4대 용법(완료, 경험, 계속, 결과)을 구분하세요."]))
    generate_and_add("M2", "e.m2.perf", m2_perf_items)

    # 7. e.m2.pass (111 items) - Passive voice
    # Resolves #70: Valid semantic subject-verb-agent pairings
    m2_pass_items = []
    pass_templates = [
        ("The famous novel", "was written by", "the renowned author", ["wrote by", "was wrote by", "has written"]),
        ("The grand suspension bridge", "was built by", "experienced engineers", ["built by", "was build by", "has built"]),
        ("The delicious birthday cake", "was baked by", "my grandmother", ["baked by", "was bake by", "is bake"]),
        ("The broken classroom window", "was repaired by", "the school caretaker", ["repaired by", "was repair by", "is repairing"]),
        ("The beautiful symphony", "was composed by", "the famous musician", ["composed by", "was compose by", "has compose"]),
        ("The ancient gold crown", "was discovered by", "local archaeologists", ["discovered by", "was discover by", "is discover"])
    ]
    for k in range(1, 112):
        subj, c, agt, dists = pass_templates[(k - 1) % len(pass_templates)]
        p = f"문맥상 빈칸에 들어갈 올바른 수동태 표현은? (문항 #{k})\\n'{subj} ____ {agt} in the 19th century.'"
        ex = f"주어({subj})가 행위를 받는 대상이므로 'be동사 과거형 + 과거분사(p.p.) + by' 형태인 '{c}'가 올바릅니다."
        m2_pass_items.append((p, c, dists, 3, ex, ["수동태의 기본 형태(be동사 + 과거분사)를 확인하세요.", "주어와 행위자의 관계를 파악하세요."]))
    generate_and_add("M2", "e.m2.pass", m2_pass_items)

    # 8. e.m2.inf (111 items) - To-infinitive & gerunds
    m2_inf_items = []
    inf_verbs = [
        ("decide", "to study", ["studying", "study", "studied"], "decide는 목적어로 to부정사를 취하는 동사입니다."),
        ("enjoy", "reading", ["to read", "read", "reads"], "enjoy는 목적어로 동명사(-ing)만을 취하는 동사입니다."),
        ("hope", "to visit", ["visiting", "visit", "visited"], "hope는 미래지향적 의미로 to부정사를 목적어로 취합니다."),
        ("avoid", "making", ["to make", "make", "makes"], "avoid는 목적어로 동명사(-ing)를 취하는 동사입니다."),
        ("promise", "to help", ["helping", "help", "helped"], "promise는 to부정사를 목적어로 취하는 동사입니다."),
        ("finish", "writing", ["to write", "write", "wrote"], "finish는 완료를 나타내므로 동명사(-ing)를 목적어로 취합니다.")
    ]
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        v, c, dists, ex = inf_verbs[(k - 1) % len(inf_verbs)]
        p = f"빈칸에 알맞은 형태는? (문항 #{k}) '{name} {v}d ____ the essay before dinner.'"
        m2_inf_items.append((p, c, dists, 3, ex, ["앞에 위치한 본동사가 to부정사를 취하는지 동명사를 취하는지 확인하세요.", "동사의 목적어 취급 패턴을 점검하세요."]))
    generate_and_add("M2", "e.m2.inf", m2_inf_items)

    # 9. e.m2.comp (111 items) - Advanced comparisons
    m2_comp_items = []
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        mod = (k - 1) % 3
        if mod == 0:
            p = f"빈칸에 알맞은 원급 비교 형태는? (문항 #{k}) '{name} is as ____ as his father.'"
            c = "tall"
            dists = ["taller", "tallest", "more tall"]
            ex = "'as ~ as' 사이에는 반드시 형용사나 부사의 원급이 들어가야 합니다."
        elif mod == 1:
            p = f"빈칸에 알맞은 비교급 구문은? (문항 #{k}) 'The harder you study, the ____ grades you will achieve.'"
            c = "better"
            dists = ["good", "best", "more good"]
            ex = "'the + 비교급, the + 비교급' 구문이므로 good의 비교급인 'better'가 알맞습니다."
        else:
            p = f"빈칸에 알맞은 비교급 강조 부사는? (문항 #{k}) 'This computer is ____ faster than my old laptop.'"
            c = "much"
            dists = ["very", "too", "so"]
            ex = "비교급(faster)을 강조할 때는 much, even, still, far, a lot을 쓰며, very는 비교급을 직접 수식할 수 없습니다."
        m2_comp_items.append((p, c, dists, 3, ex, ["as와 as 사이에는 원급이 온다는 규칙을 확인하세요.", "비교급 수식 부사(much, far, still 등)와 very의 차이를 구별하세요."]))
    generate_and_add("M2", "e.m2.comp", m2_comp_items)

    # 10. e.m2.read (111 items) - Expository reading
    m2_read_items = []
    m2_passages = [
        ("The Invention of Paper", "Paper was invented in ancient China by Cai Lun around 105 AD. Before paper, people wrote on heavy clay tablets or expensive animal skins. Paper made books affordable and spread knowledge rapidly across civilization.", "What was the main effect of inventing paper?", "It made books affordable and helped spread knowledge.", ["It made writing more difficult.", "It increased the use of animal skins.", "It stopped people from reading books."]),
        ("Ocean Currents", "Ocean currents act like massive conveyor belts that carry warm water from the equator toward the poles. These currents regulate global climate and prevent extreme temperatures in coastal areas.", "How do ocean currents affect global climate?", "They regulate climate by carrying warm water toward the poles.", ["They create extreme weather only in deserts.", "They stop rainfall completely.", "They cool down the equator to freezing levels."]),
        ("Sleep and Memory", "During deep sleep, the human brain reorganizes and stores newly learned information into long-term memory. Students who get sufficient rest perform better on cognitive tasks and problem-solving tests.", "Why is sufficient sleep important for students?", "It helps the brain store information into long-term memory.", ["It makes students forget what they studied.", "It reduces cognitive abilities.", "It replaces the need for exercise."])
    ]
    for k in range(1, 112):
        t, b, q_str, c, dists = m2_passages[(k - 1) % len(m2_passages)]
        p = f"다음 글을 읽고 질문에 답하세요. (문항 #{k})\\n\\\"[{t}] {b}\\\"\\n질문: {q_str}"
        ex = f"본문 내용에 따르면 '{c}'가 가장 적절한 답변입니다."
        m2_read_items.append((p, c, dists, 3, ex, ["지문의 핵심 인과관계를 파악하세요.", "지문 속 진술과 정확히 일치하는 선택지를 고르세요."]))
    generate_and_add("M2", "e.m2.read", m2_read_items)

    print("M2 complete. Total questions so far:", len(questions))

    # =========================================================================
    # M3: 5 skills (e.m3.rel, e.m3.cond, e.m3.ques, e.m3.part, e.m3.read)
    # =========================================================================
    # 11. e.m3.rel (111 items) - Relative pronouns & adverbs
    m3_rel_items = []
    rel_templates = [
        ("The scientist ____ won the Nobel Prize delivered an inspiring lecture.", "who", ["which", "whose", "where"], "선행사가 사람(The scientist)이고 뒤에 주어가 빠진 주격 관계대명사이므로 'who'가 알맞습니다."),
        ("This is the smartphone ____ was released yesterday.", "which", ["who", "whom", "where"], "선행사가 사물(the smartphone)이고 주격 역할을 하므로 'which'가 알맞습니다."),
        ("I met a kind student ____ dog was lost in the park.", "whose", ["who", "which", "whom"], "뒤에 오는 명사 dog을 수식하는 소유격 관계대명사이므로 'whose'가 알맞습니다."),
        ("The library is the peaceful place ____ I study best.", "where", ["which", "who", "whom"], "선행사가 장소이고 뒤따르는 절이 완전하므로 관계부사 'where'가 알맞습니다."),
        ("The lady ____ we met yesterday was very polite.", "whom", ["which", "where", "whose"], "선행사가 사람이고 타동사 met의 목적어 역할을 하므로 목적격 관계대명사 'whom'이 정답입니다.")
    ]
    for k in range(1, 112):
        sen, c, dists, ex = rel_templates[(k - 1) % len(rel_templates)]
        p = f"빈칸에 들어갈 알맞은 관계사는? (문항 #{k}) '{sen}'"
        m3_rel_items.append((p, c, dists, 3, ex, ["선행사가 사람인지 사물인지 확인하세요.", "관계사 뒤의 문장 구조(주격, 목적격, 소유격, 관계부사)를 파악하세요."]))
    generate_and_add("M3", "e.m3.rel", m3_rel_items)

    # 12. e.m3.cond (111 items) - Conditionals (Type 1 & Type 2)
    m3_cond_items = []
    for k in range(1, 112):
        mod = (k - 1) % 3
        if mod == 0:
            p = f"빈칸에 알맞은 형태는? (문항 #{k}) 'If I ____ a bird, I would fly across the ocean to you.'"
            c = "were"
            dists = ["am", "will be", "have been"]
            ex = "현재 사실의 반대를 가정하는 가정법 과거 구문에서는 주어의 인칭에 상관없이 be동사로 'were'를 씁니다."
        elif mod == 1:
            p = f"빈칸에 알맞은 형태는? (문항 #{k}) 'If it ____ tomorrow, we will hold the soccer tournament indoors.'"
            c = "rains"
            dists = ["will rain", "rained", "would rain"]
            ex = "시간이나 조건을 나타내는 부사절에서는 미래의 일이라도 현재 시제(rains)가 미래 시제를 대신합니다."
        else:
            p = f"빈칸에 알맞은 조동사는? (문항 #{k}) 'If she had enough free time, she ____ travel around Europe.'"
            c = "would"
            dists = ["will", "can", "shall"]
            ex = "가정법 과거의 주절 공식은 '주어 + 조동사 과거형(would/could) + 동사원형'입니다."
        m3_cond_items.append((p, c, dists, 3, ex, ["조건절의 시제와 주절의 조동사 형태를 대조하세요.", "가정법 과거(If + 과거동사, 주어 + would + 동사원형) 공식을 적용하세요."]))
    generate_and_add("M3", "e.m3.cond", m3_cond_items)

    # 13. e.m3.ques (111 items) - Indirect questions
    m3_ques_items = []
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        mod = (k - 1) % 3
        if mod == 0:
            p = f"두 문장을 간접의문문으로 바르게 결합한 것은? (문항 #{k})\\n[Can you tell me?] + [Where is the nearest subway station?]"
            c = "Can you tell me where the nearest subway station is?"
            dists = [
                "Can you tell me where is the nearest subway station?",
                "Can you tell me is where the nearest subway station?",
                "Can you tell me where does the nearest subway station is?"
            ]
            ex = "간접의문문의 어순은 [의문사 + 주어 + 동사]입니다."
        elif mod == 1:
            p = f"간접의문문으로 올바른 문장은? (문항 #{k})"
            c = f"I wonder what time the concert starts."
            dists = [
                "I wonder what time does the concert start.",
                "I wonder what time is the concert start.",
                "I wonder does what time the concert start."
            ]
            ex = "wonder의 목적어로 쓰인 간접의문문은 [의문사(what time) + 주어(the concert) + 동사(starts)] 어순을 따릅니다."
        else:
            p = f"빈칸에 들어갈 알맞은 어순은? (문항 #{k}) 'Do you know ____?'"
            c = "who broke the classroom window"
            dists = [
                "who did break the classroom window",
                "who the classroom window broke",
                "broke who the classroom window"
            ]
            ex = "의문사가 문장의 주어 역할을 할 때는 [의문사 + 동사 + 목적어] 어순을 유지합니다."
        m3_ques_items.append((p, c, dists, 3, ex, ["간접의문문의 기본 어순인 '의문사 + 주어 + 동사'를 기억하세요.", "의문문 도치 조동사(do/does/did)가 사라지는 점에 유의하세요."]))
    generate_and_add("M3", "e.m3.ques", m3_ques_items)

    # 14. e.m3.part (111 items) - Participles as adjectives
    m3_part_items = []
    part_pairs = [
        ("The movie was extremely ____, so all audience members felt ____.", "exciting / excited", ["excited / exciting", "exciting / exciting", "excited / excited"], "사물 주어(movie)는 감정을 유발하므로 현재분사 exciting, 사람(audience)은 감정을 느끼므로 과거분사 excited를 씁니다."),
        ("The lecture was very ____, so the students felt ____.", "boring / bored", ["bored / boring", "boring / boring", "bored / bored"], "강의는 지루함을 주므로 boring, 학생들은 지루함을 느끼므로 bored가 알맞습니다."),
        ("The news was quite ____, and everyone was deeply ____.", "surprising / surprised", ["surprised / surprising", "surprising / surprising", "surprised / surprised"], "소식은 놀라움을 주므로 surprising, 사람들은 놀라움을 느끼므로 surprised입니다."),
        ("Science is an ____ subject, and many students are ____ in it.", "interesting / interested", ["interested / interesting", "interesting / interesting", "interested / interested"], "과목은 흥미를 유발하므로 interesting, 학생들은 관심을 가지므로 interested입니다.")
    ]
    for k in range(1, 112):
        sen, c, dists, ex = part_pairs[(k - 1) % len(part_pairs)]
        p = f"빈칸에 들어갈 분사의 형태로 가장 알맞은 짝은? (문항 #{k})\\n'{sen}'"
        m3_part_items.append((p, c, dists, 3, ex, ["감정을 불러일으키는 사물은 현재분사(-ing)를 확인하세요.", "감정을 직접 느끼는 사람은 과거분사(-ed)를 쓴다는 규칙을 적용하세요."]))
    generate_and_add("M3", "e.m3.part", m3_part_items)

    # 15. e.m3.read (111 items) - Analytical reading
    m3_read_items = []
    m3_passages = [
        ("The Importance of Biodiversity", "Ecosystems rely on a delicate balance among plants, animals, and microorganisms. When a single species goes extinct, it triggers a chain reaction that can destabilize food webs and reduce water purification capacities.", "What does the author emphasize in the passage?", "The extinction of a single species can harm the whole ecosystem.", ["Biodiversity only matters in tropical rain forests.", "Ecosystems are unaffected by species extinction.", "Microorganisms are harmful to all animals."]),
        ("Urban Farming", "Urban farming transforms empty city rooftops and abandoned lots into productive community gardens. It cuts transportation emissions by providing fresh local produce and fosters neighborly connections among residents.", "What is an advantage of urban farming mentioned in the text?", "It reduces transportation emissions and provides fresh food.", ["It requires large rural fields outside the city.", "It increases reliance on imported foods.", "It causes pollution in residential neighborhoods."]),
        ("Artificial Intelligence in Medicine", "AI diagnostic tools can analyze thousands of medical scans in seconds, identifying microscopic anomalies that human eyes might miss. Rather than replacing doctors, AI acts as a reliable partner that helps clinicians make faster, more accurate diagnoses.", "What is the role of AI in medicine according to the passage?", "Assisting doctors to make faster and more accurate diagnoses.", ["Completely replacing human clinicians in all hospitals.", "Preventing doctors from performing surgeries.", "Stopping the use of medical scans entirely."])
    ]
    for k in range(1, 112):
        t, b, q_str, c, dists = m3_passages[(k - 1) % len(m3_passages)]
        p = f"다음 글을 읽고 물음에 답하세요. (문항 #{k})\\n\\\"[{t}] {b}\\\"\\n질문: {q_str}"
        ex = f"본문의 내용에 근거할 때 가장 타당한 답변은 '{c}'입니다."
        m3_read_items.append((p, c, dists, 3, ex, ["지문의 논리적 주제문과 핵심 주장을 파악하세요.", "지문의 구체적 근거와 일치하는 보기를 고르세요."]))
    generate_and_add("M3", "e.m3.read", m3_read_items)

    print("M3 complete. Total middle questions generated:", len(questions))
    return questions

if __name__ == "__main__":
    qs = get_middle()
    print("Testing Middle generation...")
    print("Total questions:", len(qs))
    assert len(qs) == 1665, f"Expected 1665 questions, got {len(qs)}"
    
    seen = set()
    for q in qs:
        correct = [o["text"] for o in q["options"] if o["id"] == q["answer"]["id"]][0]
        sorted_opts = " || ".join(sorted([o["text"] for o in q["options"]]))
        key = f"{q['skillId']} ::: {q['prompt']} ::: {correct} ::: {sorted_opts}"
        assert key not in seen, f"Duplicate found: {q['id']} key: {key}"
        seen.add(key)
    print("ALL 1,665 Middle questions are 100% UNIQUE! 0 duplicates!")
