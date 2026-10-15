import json
import os

# Helper to create question
def make_review_q(grade, skillId, qnum, prompt, correct, distractors, difficulty, hints, explanation, expected_seconds=35):
    letters = ['a', 'b', 'c', 'd']
    pos = (qnum - 1) % 4
    correct_letter = letters[pos]
    options = []
    d_idx = 0
    for i in range(4):
        if i == pos:
            options.append({"id": letters[i], "text": correct})
        else:
            options.append({"id": letters[i], "text": distractors[d_idx]})
            d_idx += 1
    slug = skillId.replace('.', '-')
    return {
        "id": f"rev-en-{grade.lower()}-{slug}-{str(qnum).zfill(3)}",
        "site": "english",
        "skillId": skillId,
        "type": "multiple_choice",
        "difficulty": difficulty,
        "prompt": prompt.strip(),
        "options": options,
        "answer": {"kind": "choice", "id": correct_letter},
        "hints": [h.strip() for h in hints],
        "explanation": explanation.strip(),
        "family": f"rev-{slug}",
        "role": "sample",
        "expectedSeconds": expected_seconds,
        "tags": ["review-sample", grade.lower()],
        "status": "DRAFT"
    }

# -----------------------------------------------------------------------------
# MIDDLE SCHOOL: 50 DISTINCT QUESTIONS
# -----------------------------------------------------------------------------
middle_qs = []

# M1 Skills (15 questions)
# e.vocab (4)
middle_qs.append(make_review_q("M1", "e.vocab", 1,
    "다음 영영 풀이에 해당하는 알맞은 단어는?\n\"to keep someone or something safe from damage, illness, or injury\"",
    "protect", ["destroy", "pollute", "neglect"], 2,
    ["자연이나 사람을 위험으로부터 지키는 동작을 생각해보세요.", "p로 시작하는 7글자 동사입니다."],
    "'protect'는 '보호하다, 지키다'라는 뜻입니다."))

middle_qs.append(make_review_q("M1", "e.vocab", 2,
    "문맥상 빈칸에 들어갈 알맞은 형용사는?\n\"Minho is very ____; he always shares his books and snacks with his classmates.\"",
    "generous", ["selfish", "stubborn", "jealous"], 2,
    ["자신의 것을 남과 잘 나누는 성품을 나타냅니다.", "'너그러운, 아낌없이 주는'을 뜻하는 단어를 고르세요."],
    "'generous'는 '너그러운, 관대한'을 뜻하여 남과 잘 베푸는 성격을 묘사합니다."))

middle_qs.append(make_review_q("M1", "e.vocab", 3,
    "밑줄 친 단어의 반의어로 가장 알맞은 것은?\n\"The museum exhibited several *ancient* Roman coins.\"",
    "modern", ["historical", "valuable", "classic"], 2,
    ["'ancient'는 '고대의, 아주 오래된'을 뜻합니다.", "현대의 새로운 것을 뜻하는 단어를 고르세요."],
    "'ancient'(고대의)의 반의어는 'modern'(현대의)입니다."))

middle_qs.append(make_review_q("M1", "e.vocab", 4,
    "문맥상 빈칸에 들어갈 알맞은 동사는?\n\"The science team worked hard to ____ a cleaner method for recycling plastic.\"",
    "invent", ["damage", "imitate", "cancel"], 2,
    ["새로운 기술이나 방법을 만들어내는 동작입니다.", "'발명하다, 고안하다'를 뜻하는 동사를 찾으세요."],
    "'invent'는 새로운 해결책이나 기계를 발명하다를 뜻합니다."))

# e.be (3)
middle_qs.append(make_review_q("M1", "e.be", 5,
    "빈칸에 들어갈 알맞은 be동사는?\n\"There ____ a magnificent oak tree standing in front of our school gate.\"",
    "is", ["are", "am", "were"], 2,
    ["There 구문 뒤에 나오는 진주어 'a magnificent oak tree'의 수를 확인하세요.", "단수 명사 앞에는 단수 be동사가 옵니다."],
    "진주어가 단수 명사(a magnificent oak tree)이므로 현재형 단수 be동사 'is'가 알맞습니다."))

middle_qs.append(make_review_q("M1", "e.be", 6,
    "빈칸에 들어갈 알맞은 과거 be동사는?\n\"Yesterday afternoon, Jisu and her cousins ____ at the community center.\"",
    "were", ["was", "are", "is"], 2,
    ["주어가 3인칭 복수(Jisu and her cousins)입니다.", "과거 시점(Yesterday)에 맞는 복수 be동사를 고르세요."],
    "주어가 복수 명사구이고 시제가 과거이므로 'were'가 올바릅니다."))

middle_qs.append(make_review_q("M1", "e.be", 7,
    "수일치상 빈칸에 알맞은 be동사는?\n\"One of my favorite hobbies ____ taking photographs of wild birds.\"",
    "is", ["are", "were", "be"], 2,
    ["'One of + 복수명사'에서 실제 문장의 핵심 주어가 무엇인지 확인하세요.", "주어의 핵은 단수 대명사 'One'입니다."],
    "'One of the hobbies'의 문법적 주어는 'One'(단수)이므로 be동사 'is'가 알맞습니다."))

# e.pres (3)
middle_qs.append(make_review_q("M1", "e.pres", 8,
    "문맥상 빈칸에 알맞은 시제 형태는?\n\"Look at the sky! Dark clouds ____ in from the north right now.\"",
    "are rolling", ["roll", "rolled", "have rolled"], 2,
    ["'Look!'과 'right now'는 현재 눈앞에서 진행 중인 동작을 나타냅니다.", "현재진행형(be + -ing)을 사용하세요."],
    "현재 발화 시점에 진행 중인 동작이므로 복수 주어(Dark clouds)에 맞는 'are rolling'이 정답입니다."))

middle_qs.append(make_review_q("M1", "e.pres", 9,
    "어법상 빈칸에 알맞은 동사 형태는?\n\"Daniel ____ that honest communication solves most misunderstandings.\"",
    "believes", ["is believing", "believe", "are believing"], 2,
    ["동사 'believe'는 상태를 나타내는 신념/인지 동사입니다.", "상태 동사는 일반적으로 진행형을 쓰지 않습니다."],
    "'believe'는 상태를 나타내므로 진행형 대신 단순 현재형 'believes'를 씁니다."))

middle_qs.append(make_review_q("M1", "e.pres", 10,
    "불변의 진리를 나타낼 때 빈칸에 알맞은 것은?\n\"Our science teacher explained that water ____ into ice at 0 degrees Celsius.\"",
    "freezes", ["froze", "is freezing", "will freeze"], 2,
    ["과학적 사실이나 자연 법칙의 시제 규칙을 떠올려보세요.", "주절의 시제와 무관하게 항상 단순 현재 시제를 씁니다."],
    "과학적 사실이나 불변의 진리는 항상 단순 현재형(freezes)으로 표현합니다."))

# e.plural (2)
middle_qs.append(make_review_q("M1", "e.plural", 11,
    "명사 'leaf'의 올바른 복수형은?\n\"In autumn, the golden ____ fall gently from the maple trees.\"",
    "leaves", ["leafs", "leafes", "leavs"], 2,
    ["-f로 끝나는 명사의 복수형 변화 규칙을 생각하세요.", "f를 v로 바꾸고 -es를 붙입니다."],
    "'leaf'의 올바른 복수형은 'leaves'입니다."))

middle_qs.append(make_review_q("M1", "e.plural", 12,
    "단복수 동형 명사로 문맥상 빈칸에 알맞은 것은?\n\"The farmer takes care of twenty healthy ____ on the hill.\"",
    "sheep", ["sheeps", "sheepes", "shoop"], 2,
    ["단수와 복수 형태가 똑같은 명사를 떠올려보세요.", "'sheep'은 복수에도 -s를 붙이지 않습니다."],
    "'sheep'은 단수와 복수의 형태가 같은 단복수 동형 명사입니다."))

# e.order (3)
middle_qs.append(make_review_q("M1", "e.order", 13,
    "빈도부사 'usually'의 위치로 가장 자연스러운 곳은?\n\"Sarah [A] arrives [B] at the library [C] before nine o'clock [D].\"",
    "[A]", ["[B]", "[C]", "[D]"], 2,
    ["빈도부사는 일반동사 앞, be동사/조동사 뒤에 위치합니다.", "일반동사 'arrives'의 위치를 확인하세요."],
    "빈도부사는 일반동사 바로 앞에 위치하므로 [A]가 알맞은 위치입니다."))

middle_qs.append(make_review_q("M1", "e.order", 14,
    "어순상 가장 자연스러운 영어 문장은?",
    "My uncle kindly sent me a fascinating storybook from Sydney.",
    ["My uncle sent kindly me a fascinating storybook from Sydney.",
     "Kindly my uncle sent from Sydney a fascinating storybook me.",
     "My uncle sent me from Sydney kindly a fascinating storybook."], 2,
    ["4형식 수여동사(send)의 어순: [주어 + 부사 + 동사 + 간접목적어 + 직접목적어 + 부사구].", "부사의 위치와 목적어의 순서를 확인하세요."],
    "수여동사 문장에서 간접목적어(me) 뒤에 직접목적어(a fascinating storybook)가 자연스럽게 이어집니다."))

middle_qs.append(make_review_q("M1", "e.order", 15,
    "빈칸에 빈도부사 'never'가 들어가기에 알맞은 자리는?\n\"The school bus drivers [A] are [B] reckless [C] during rainy days [D].\"",
    "[B]", ["[A]", "[C]", "[D]"], 2,
    ["be동사가 있는 문장에서 빈도부사의 위치를 생각하세요.", "be동사 바로 뒤에 옵니다."],
    "빈도부사는 be동사(are) 뒤에 위치하므로 [B]가 올바릅니다."))

# M2 Skills (18 questions)
# e.m2.perf (4)
middle_qs.append(make_review_q("M2", "e.m2.perf", 16,
    "밑줄 친 현재완료의 용법으로 가장 적절한 것은?\n\"Yuna *has visited* the national maritime museum three times.\"",
    "경험", ["계속", "완료", "결과"], 3,
    ["'three times'(세 번)라는 횟수 표현에 주목하세요.", "과거부터 지금까지 해본 적이 있는 경험을 나타냅니다."],
    "횟수를 나타내는 부사구와 함께 쓰여 과거의 '경험'을 나타냅니다."))

middle_qs.append(make_review_q("M2", "e.m2.perf", 17,
    "밑줄 친 현재완료의 용법으로 알맞은 것은?\n\"Mr. Baker *has lived in Seoul* since he arrived in Korea in 2015.\"",
    "계속", ["경험", "완료", "결과"], 3,
    ["'since'(~이래로)라는 시간의 기점 표현을 확인하세요.", "과거의 상태가 현재까지 쭉 이어짐을 나타냅니다."],
    "'since'와 함께 쓰여 과거부터 현재까지 거주 상태가 지속됨을 나타내는 '계속' 용법입니다."))

middle_qs.append(make_review_q("M2", "e.m2.perf", 18,
    "밑줄 친 현재완료의 용법은?\n\"I *have just finalized* my presentation slides for the science contest.\"",
    "완료", ["경험", "계속", "결과"], 3,
    ["'just'(방금, 막)라는 부사의 의미를 생각하세요.", "동작이 막 끝났음을 나타냅니다."],
    "'just'와 함께 쓰여 동작이 막 완료되었음을 나타내는 '완료' 용법입니다."))

middle_qs.append(make_review_q("M2", "e.m2.perf", 19,
    "문맥상 빈칸에 알맞은 표현은?\n\"Kevin is not here right now; he ____ to Paris for a summer exchange program.\"",
    "has gone", ["has been", "is going to", "goes"], 3,
    ["지금 여기에 없다는 현재의 결과를 나타내는 표현입니다.", "'has gone to'는 가버리고 없다는 결과를 의미합니다."],
    "'has gone to'는 주어가 그곳으로 가버려서 현재 여기에 없다는 '결과'를 나타냅니다."))

# e.m2.pass (4)
middle_qs.append(make_review_q("M2", "e.m2.pass", 20,
    "문맥상 빈칸에 들어갈 알맞은 수동태는?\n\"The iconic suspension bridge ____ by structural engineers in 1937.\"",
    "was designed", ["designed", "was design", "has designed"], 3,
    ["다리(주어)는 설계되는 대상입니다.", "과거 시점(1937)에 맞는 수동태(was + p.p.)를 고르세요."],
    "주어가 행위의 대상이므로 과거 수동태 'was designed'가 알맞습니다."))

middle_qs.append(make_review_q("M2", "e.m2.pass", 21,
    "문맥상 빈칸에 알맞은 수동태 표현은?\n\"The inspiring novel about perseverance ____ by a young local writer.\"",
    "was written", ["wrote", "was write by", "has wrote"], 3,
    ["소설은 작가에 의해 쓰이는 대상입니다.", "수동태의 올바른 과거분사 형태(written)를 확인하세요."],
    "write의 과거분사는 written이므로 'was written'이 정답입니다."))

middle_qs.append(make_review_q("M2", "e.m2.pass", 22,
    "빈칸에 들어갈 알맞은 형태는?\n\"These delicious organic muffins ____ by my aunt every Sunday morning.\"",
    "are baked", ["bake", "are baking", "were bake"], 3,
    ["주어가 복수(These muffins)이고 반복되는 습관(every Sunday)입니다.", "현재 시제 복수 수동태를 고르세요."],
    "복수 주어의 현재 수동태이므로 'are baked'가 올바릅니다."))

middle_qs.append(make_review_q("M2", "e.m2.pass", 23,
    "어법상 올바른 수동태 문장은?",
    "The ancient golden crown was discovered by archaeologists in a tomb.",
    ["The ancient golden crown discovered by archaeologists in a tomb.",
     "The ancient golden crown was discover by archaeologists in a tomb.",
     "The ancient golden crown has discovered by archaeologists in a tomb."], 3,
    ["수동태의 기본 형태인 [be동사 + 과거분사 + by 행위자]를 확인하세요.", "discover의 규칙 과거분사는 discovered입니다."],
    "발견된 대상인 왕관이 주어이므로 'was discovered by'가 올바른 수동태 구조입니다."))

# e.m2.inf (4)
middle_qs.append(make_review_q("M2", "e.m2.inf", 24,
    "빈칸에 알맞은 형태는?\n\"Jihoon decided ____ a computer programming course during the vacation.\"",
    "to take", ["taking", "take", "took"], 3,
    ["동사 'decide'가 목적어로 취하는 준동사 형태를 생각하세요.", "미래 지향적 결정은 to부정사를 목적어로 취합니다."],
    "'decide'는 목적어로 to부정사를 취하는 대표적인 동사입니다."))

middle_qs.append(make_review_q("M2", "e.m2.inf", 25,
    "빈칸에 알맞은 형태는?\n\"My grandparents genuinely enjoy ____ in their rooftop vegetable garden.\"",
    "gardening", ["to garden", "garden", "gardened"], 3,
    ["동사 'enjoy'가 어떤 준동사를 목적어로 취하는지 확인하세요.", "즐기거나 지속하는 행위는 동명사(-ing)를 취합니다."],
    "'enjoy'는 목적어로 동명사만을 취하는 동사이므로 'gardening'이 맞습니다."))

middle_qs.append(make_review_q("M2", "e.m2.inf", 26,
    "문맥상 '잊지 말고 문을 잠가라'는 미래의 당부를 나타낼 때 알맞은 것은?\n\"Please remember ____ the laboratory door when you leave tonight.\"",
    "to lock", ["locking", "lock", "locked"], 3,
    ["앞으로 해야 할 미래의 행동을 기억할 때 쓰는 형태입니다.", "'remember to-v'는 ~할 것을 기억하다입니다."],
    "앞으로 해야 할 일은 'remember to lock'으로 표현합니다. ('remember -ing'는 과거에 한 일을 기억함)"))

middle_qs.append(make_review_q("M2", "e.m2.inf", 27,
    "문맥상 '하던 대화를 멈추다'라는 뜻을 나타내는 형태는?\n\"The students stopped ____ as soon as the teacher entered the classroom.\"",
    "talking", ["to talk", "talk", "talked"], 3,
    ["진행 중이던 동작 자체를 중단하는 의미입니다.", "'stop -ing'는 ~하던 것을 멈추다입니다."],
    "말하던 행동을 멈추었으므로 동명사 'talking'이 알맞습니다. ('stop to talk'는 말하기 위해 멈추다)"))

# e.m2.comp (3)
middle_qs.append(make_review_q("M2", "e.m2.comp", 28,
    "빈칸에 알맞은 원급 비교 형태는?\n\"Liam can solve complex puzzle games as ____ as his high school mentor.\"",
    "skillfully", ["more skillfully", "most skillfully", "skillful"], 3,
    ["동사 'solve'를 수식하는 부사의 원급이 'as ~ as' 사이에 들어가야 합니다.", "as와 as 사이에는 원급이 옵니다."],
    "동사 solve를 수식하는 부사이자 as ~ as 원급 구문이므로 'skillfully'가 알맞습니다."))

middle_qs.append(make_review_q("M2", "e.m2.comp", 29,
    "빈칸에 들어갈 알맞은 비교급 표현은?\n\"The earlier we embark on our journey, the ____ we will reach our destination.\"",
    "sooner", ["soon", "soonest", "more soon"], 3,
    ["'the + 비교급, the + 비교급' 구문을 확인하세요.", "앞의 the earlier에 상응하는 soon의 비교급을 고르세요."],
    "'the + 비교급 ~, the + 비교급 ...' 구문이므로 soon의 비교급 'sooner'가 정답입니다."))

middle_qs.append(make_review_q("M2", "e.m2.comp", 30,
    "빈칸에 비교급 'quieter'를 수식하여 강조할 수 있는 부사는?\n\"This electric bicycle is ____ quieter than our old gasoline scooter.\"",
    "much", ["very", "too", "so"], 3,
    ["비교급을 강조할 수 있는 수식 부사(much, far, still, even, a lot)를 떠올려보세요.", "'very'는 원급만을 수식할 수 있습니다."],
    "비교급 앞에는 강조 부사 'much'를 쓸 수 있으며, 'very'는 비교급을 직접 수식하지 못합니다."))

# e.m2.read (3)
middle_qs.append(make_review_q("M2", "e.m2.read", 31,
    "다음 글을 읽고 질문에 답하세요.\n\"[The Venus Flytrap]\nThe Venus flytrap is a carnivorous plant native to subtropical wetlands. Because bog soils lack essential nitrogen, the plant traps insects using sensitive trigger hairs on its leaves. Enzymes then dissolve the prey to absorb vital nutrients.\"\n질문: Why does the Venus flytrap catch insects according to the text?",
    "To obtain nitrogen lacking in bog soil",
    ["To avoid direct sunlight", "To drink clean water from air", "To pollinate wetland flowers"], 3,
    ["식물이 서식하는 늪지대 토양의 영양분 한계를 지문에서 확인하세요.", "'lack essential nitrogen' 부분에 주목하세요."],
    "본문에서 늪지 토양에 질소(nitrogen)가 부족하여 곤충을 잡아 영양분을 보충한다고 명시되어 있습니다.", 45))

middle_qs.append(make_review_q("M2", "e.m2.read", 32,
    "다음 글의 중심 내용으로 가장 알맞은 것은?\n\"[Urban Rooftop Gardens]\nUrban rooftop gardens reduce heat absorption in concrete buildings, lowering indoor temperatures during summer. Furthermore, they absorb storm rainwater and provide nectar for urban bees and butterflies.\"",
    "Environmental and energy benefits of rooftop gardens",
    ["The difficulty of building concrete walls",
     "Why butterflies avoid metropolitan parks",
     "The rising prices of summer vegetables"], 3,
    ["옥상 정원이 건물 온도와 환경에 미치는 긍정적 효과들을 아우르는 주제를 찾으세요.", "열 흡수 감소와 빗물 흡수, 생태계 기여를 종합하세요."],
    "옥상 정원의 에너지 절감 및 도시 생태계 보호 혜택을 포괄하는 내용입니다.", 45))

middle_qs.append(make_review_q("M2", "e.m2.read", 33,
    "글의 내용과 일치하지 않는 것은?\n\"[The Rosetta Stone]\nFound in 1799 in Egypt, the Rosetta Stone features the same royal decree written in three distinct scripts: Ancient Egyptian hieroglyphs, Demotic script, and Ancient Greek. Because scholars could read Greek, it served as the master key to deciphering ancient hieroglyphs.\"",
    "The Rosetta Stone was written in only one single language.",
    ["It was discovered in Egypt in 1799.",
     "Greek scholars helped decipher the Egyptian hieroglyphs.",
     "The decree was recorded in three different scripts."], 3,
    ["본문에 제시된 비문 기록 문자의 개수를 확인하세요.", "'written in three distinct scripts'와 선택지를 대조하세요."],
    "로제타석은 3가지 다른 문자(scripts)로 기록되어 있으므로 단 하나의 언어로만 쓰였다는 보기는 사실과 다릅니다.", 45))

# M3 Skills (17 questions)
# e.m3.rel (4)
middle_qs.append(make_review_q("M3", "e.m3.rel", 34,
    "빈칸에 들어갈 알맞은 주격 관계대명사는?\n\"The botanist ____ discovered the rare medicinal orchid received an environmental medal.\"",
    "who", ["which", "whose", "where"], 3,
    ["선행사가 사람(The botanist)입니다.", "뒤따르는 절에서 주어 역할을 하는 관계대명사를 찾으세요."],
    "선행사가 사람이고 뒤의 discovered의 주어 역할을 하므로 'who'가 알맞습니다."))

middle_qs.append(make_review_q("M3", "e.m3.rel", 35,
    "빈칸에 들어갈 알맞은 사물 관계대명사는?\n\"We tested an innovative water filter ____ purifies river water without using electricity.\"",
    "which", ["who", "whom", "where"], 3,
    ["선행사가 사물(an innovative water filter)입니다.", "사물 선행사를 받는 주격 관계대명사를 고르세요."],
    "선행사가 사물이고 주격 관계대명사이므로 'which'(또는 that)가 올바릅니다."))

middle_qs.append(make_review_q("M3", "e.m3.rel", 36,
    "소유격 관계대명사로 빈칸에 알맞은 것은?\n\"I met an extraordinary pianist ____ fingers moved across the keyboard with breathtaking speed.\"",
    "whose", ["who", "which", "whom"], 3,
    ["뒤따르는 명사 'fingers'(손가락)와 선행사 pianist의 소유 관계를 파악하세요.", "~의 손가락을 뜻하는 소유격을 고르세요."],
    "선행사 피아니스트의 손가락을 수식하는 소유격 관계대명사는 'whose'입니다."))

middle_qs.append(make_review_q("M3", "e.m3.rel", 37,
    "관계부사로 빈칸에 가장 알맞은 것은?\n\"The mountain sanctuary is a peaceful retreat ____ endangered brown bears roam freely.\"",
    "where", ["which", "who", "whom"], 3,
    ["선행사가 장소(a peaceful retreat)입니다.", "뒤따르는 절(bears roam freely)이 완전한 절인지 확인하세요."],
    "선행사가 장소이고 뒤에 완전한 1형식 문장이 이어지므로 관계부사 'where'가 정답입니다."))

# e.m3.cond (3)
middle_qs.append(make_review_q("M3", "e.m3.cond", 38,
    "가정법 과거 어법상 빈칸에 알맞은 형태는?\n\"If I ____ wings like a falcon, I would soar above the snowy peaks.\"",
    "had", ["have", "will have", "have had"], 3,
    ["현재 사실의 반대를 상상하는 가정법 과거 구문입니다.", "If절의 동사는 과거형을 씁니다."],
    "현재 사실과 반대되는 가정이므로 If절에 일반동사의 과거형 'had'를 씁니다."))

middle_qs.append(make_review_q("M3", "e.m3.cond", 39,
    "조건을 나타내는 부사절의 시제 규칙상 알맞은 것은?\n\"If it ____ tomorrow, we will relocate the outdoor sports festival to the gymnasium.\"",
    "rains", ["will rain", "rained", "would rain"], 3,
    ["시간이나 조건을 나타내는 부사절의 미래 시제 대체 규칙을 떠올려보세요.", "부사절에서는 현재 시제가 미래를 대신합니다."],
    "조건 부사절에서는 내일(tomorrow)의 일이라도 현재 시제(rains)를 사용합니다."))

middle_qs.append(make_review_q("M3", "e.m3.cond", 40,
    "가정법 과거 be동사 어법상 알맞은 것은?\n\"If Clara ____ in my position, she would make the exact same ethical choice.\"",
    "were", ["is", "was being", "will be"], 3,
    ["가정법 과거에서 be동사는 인칭에 상관없이 특정 형태를 선호합니다.", "문법적으로 'were'가 표준 규범입니다."],
    "가정법 과거에서 주어의 인칭과 수에 관계없이 be동사는 'were'를 씁니다."))

# e.m3.ques (3)
middle_qs.append(make_review_q("M3", "e.m3.ques", 41,
    "두 문장을 간접의문문으로 바르게 결합한 것은?\n[Could you tell me?] + [Where did Minho leave the camera?]",
    "Could you tell me where Minho left the camera?",
    ["Could you tell me where did Minho leave the camera?",
     "Could you tell me where Minho did leave the camera?",
     "Could you tell me did Minho leave the camera where?"], 3,
    ["간접의문문의 기본 어순: [의문사 + 주어 + 동사].", "조동사 did가 사라지며 본동사가 과거형(left)으로 바뀝니다."],
    "간접의문문은 평서문 어순(의문사 + 주어 + 동사)을 취하므로 'where Minho left'가 맞습니다."))

middle_qs.append(make_review_q("M3", "e.m3.ques", 42,
    "어순상 올바른 간접의문문은?",
    "I wonder what time the express bus departs for the airport.",
    ["I wonder what time does the express bus depart for the airport.",
     "I wonder what time is the express bus depart for the airport.",
     "I wonder does what time the express bus depart for the airport."], 3,
    ["wonder의 목적어 절에서 의문문 도치가 풀리는 규칙을 확인하세요.", "[의문사구(what time) + 주어 + 동사]."],
    "간접의문문은 [의문사 + 주어 + 동사]의 평서문 어순을 따릅니다."))

middle_qs.append(make_review_q("M3", "e.m3.ques", 43,
    "생각 동사(think)의 의문사 이동 규칙에 알맞은 문장은?",
    "What do you think is the most pressing environmental challenge?",
    ["Do you think what is the most pressing environmental challenge?",
     "Do you think is what the most pressing environmental challenge?",
     "What you think do is the most pressing environmental challenge?"], 3,
    ["think, believe, suppose, imagine 등의 동사가 쓰일 때 의문사의 위치를 확인하세요.", "의문사가 문장 맨 앞으로 이동합니다."],
    "think 동사의 의문문에서는 의문사(What)가 문두로 도치되어 나옵니다."))

# e.m3.part (3)
middle_qs.append(make_review_q("M3", "e.m3.part", 44,
    "빈칸에 들어갈 분사의 형태로 가장 알맞은 짝은?\n\"The magician's illusion was truly ____, and the audience was thoroughly ____.\"",
    "amazing / amazed",
    ["amazed / amazing", "amazing / amazing", "amazed / amazed"], 3,
    ["감정을 일으키는 사물(마술)은 현재분사(-ing)입니다.", "감정을 직접 느끼는 사람(관객)은 과거분사(-ed)입니다."],
    "사물 주어는 감정을 유발하므로 amazing, 관객은 감정을 느끼므로 amazed가 알맞습니다."))

middle_qs.append(make_review_q("M3", "e.m3.part", 45,
    "명사를 수식하는 분사의 형태로 알맞은 것은?\n\"The rescue workers helped several people trapped inside the ____ building.\"",
    "damaged", ["damaging", "damage", "damages"], 3,
    ["건물(building)이 파손을 가한 것인지 파손된 것인지 수동 관계를 따지세요.", "피해를 입은 건물이므로 과거분사를 씁니다."],
    "건물이 지진 등으로 파손을 입은 수동의 상태이므로 과거분사 'damaged'가 명사를 수식합니다."))

middle_qs.append(make_review_q("M3", "e.m3.part", 46,
    "문맥상 빈칸에 알맞은 감정 분사는?\n\"Listening to the steady sound of falling raindrops is very ____.\"",
    "relaxing", ["relaxed", "relaxes", "relax"], 3,
    ["빗소리를 듣는 행위가 편안함을 주는지, 스스로 편안함을 느끼는지 파악하세요.", "감정을 불러일으키는 원인은 현재분사입니다."],
    "빗소리를 듣는 행위가 편안함을 유발하므로 현재분사 'relaxing'이 올바릅니다."))

# e.m3.read (4)
middle_qs.append(make_review_q("M3", "e.m3.read", 47,
    "다음 글의 요지로 가장 적절한 것은?\n\"[The Social Life of Elephants]\nElephants maintain deep matriarchal social bonds across generations. Older matriarchs memorize distant watering holes during severe droughts, guiding their herds to survival. When an elder passes away, the herd exhibits collective mourning rituals, caressing the bones of deceased kin.\"",
    "Elephants rely on matriarchal leadership and possess profound social memory.",
    ["Elephants prefer solitary living over herd cooperation.",
     "Young calves lead older elephants to watering holes.",
     "Droughts have zero impact on savannah ecosystems."], 3,
    ["암컷 우두머리(matriarch)의 인도와 집단적 기억력, 유대감에 주목하세요.", "코끼리의 사회적 구조와 기억력을 요약한 보기를 고르세요."],
    "코끼리가 모계 중심의 깊은 사회적 유대와 기억을 통해 생존하고 애도한다는 점을 설명합니다.", 45))

middle_qs.append(make_review_q("M3", "e.m3.read", 48,
    "다음 글에서 'dark sky reserves'의 설치 목적으로 언급된 것은?\n\"[Combating Light Pollution]\nExcessive artificial nighttime lighting disrupts nocturnal wildlife and human circadian melatonin production. In response, international conservationists are designating 'dark sky reserves' where outdoor lighting is shielded and minimized to preserve pristine night darkness.\"",
    "To minimize artificial light and preserve natural night darkness",
    ["To generate solar energy during midnight",
     "To attract migratory daylight birds into cities",
     "To test newly developed industrial stadium lamps"], 3,
    ["지문 마지막 문장에서 dark sky reserves의 지정 취지를 확인하세요.", "'where outdoor lighting is shielded and minimized'를 대조하세요."],
    "인공조명을 차단하고 본래의 밤하늘 어둠을 보존하기 위해 지정된다고 설명되어 있습니다.", 45))

middle_qs.append(make_review_q("M3", "e.m3.read", 49,
    "글을 읽고 빈칸에 들어갈 알맞은 말은?\n\"[Hydroponics]\nHydroponic farming grows vegetables in nutrient-rich water solutions without natural soil. Because water circulates in a closed loop, hydroponic facilities consume up to 90 percent less water than conventional agriculture while producing higher yields per square meter.\"\nQ: What is a major resource advantage of hydroponics?",
    "It uses substantially less water through closed-loop recirculation.",
    ["It requires vast expanses of fertile rural soil.",
     "It depends entirely on natural outdoor rainfall.",
     "It produces fewer vegetables per square meter."], 3,
    ["수경재배가 사용하는 물의 양과 재순환 방식에 대한 언급을 찾으세요.", "'up to 90 percent less water'를 확인하세요."],
    "폐쇄형 순환 구조를 통해 기존 농업보다 물을 최대 90% 적게 소비한다는 점이 장점입니다.", 45))

middle_qs.append(make_review_q("M3", "e.m3.read", 50,
    "글의 내용과 일치하지 않는 것은?\n\"[The Voyager Golden Record]\nIn 1977, NASA launched the Voyager spacecraft carrying a gold-plated phonograph record. The record contains greetings in 55 human languages, sounds of thunder and birds, and musical compositions from Bach to traditional folk songs, designed to communicate the story of human civilization to potential extraterrestrial intelligence.\"",
    "The record contains audio recordings in only one standardized language.",
    ["It was sent into space aboard the Voyager spacecraft in 1977.",
     "It includes diverse natural sounds such as thunder and bird calls.",
     "It was intended to communicate human culture to extraterrestrial life."], 3,
    ["보이저 레코드에 수록된 인간 언어의 수를 확인하세요.", "'greetings in 55 human languages'와 선택지를 대조하세요."],
    "55개 언어의 인사가 수록되어 있으므로 단 하나의 표준 언어만 수록되었다는 보기는 일치하지 않습니다.", 45))

# -----------------------------------------------------------------------------
# HIGH SCHOOL: 50 DISTINCT QUESTIONS
# -----------------------------------------------------------------------------
high_qs = []

# H1 Skills (17 questions)
# e.h1.tense (3)
high_qs.append(make_review_q("H1", "e.h1.tense", 1,
    "시제 어법상 빈칸에 들어갈 가장 알맞은 형태는?\n\"By the time the diplomatic summit concluded, the ambassadors ____ already finalized the bilateral trade treaty.\"",
    "had", ["have", "was", "will have"], 4,
    ["과거의 기준 시점(concluded)보다 앞서 완료된 동작을 나타냅니다.", "대과거/과거완료(had + p.p.)를 사용하세요."],
    "과거 시점보다 이전에 완료된 동작이므로 과거완료 'had'가 정답입니다."))

high_qs.append(make_review_q("H1", "e.h1.tense", 2,
    "미래완료 시제상 빈칸에 알맞은 것은?\n\"By the end of this semester, Professor Thorne ____ completed her ten-year longitudinal study on cognitive resilience.\"",
    "will have", ["has", "had", "would have"], 4,
    ["미래의 특정 기준 시점(By the end of this semester)까지 완료될 연구입니다.", "미래완료(will have + p.p.)를 고르세요."],
    "미래 기준 시점까지 지속되거나 완료될 동작을 나타내는 미래완료 'will have'가 알맞습니다."))

high_qs.append(make_review_q("H1", "e.h1.tense", 3,
    "시제 일치 어법상 빈칸에 알맞은 것은?\n\"The statistical analyst confirmed that the data anomalies ____ detected during the secondary trial run.\"",
    "were", ["are", "is being", "will be"], 4,
    ["주절 동사가 과거(confirmed)입니다.", "복수 주어(data anomalies)에 상응하는 과거 시제 동사를 선택하세요."],
    "주절의 과거 시제에 맞춰 종속절의 동사도 과거형 복수 'were'로 일치시킵니다."))

# e.h1.clause (4)
high_qs.append(make_review_q("H1", "e.h1.clause", 4,
    "문맥상 빈칸에 들어갈 알맞은 명사절 접속사는?\n\"The parliamentary committee fiercely debated ____ the proposed algorithmic taxation should take effect this fiscal quarter.\"",
    "whether", ["that", "what", "which"], 4,
    ["찬반 논의나 불확실성을 수반하는 명사절을 이끄는 접속사입니다.", "'~인지 아닌지'의 의미를 지닌 단어를 고르세요."],
    "불확실한 정책의 시행 여부를 논의하는 자리이므로 'whether'가 가장 적절합니다."))

high_qs.append(make_review_q("H1", "e.h1.clause", 5,
    "어법상 빈칸에 들어갈 알맞은 관계대명사는?\n\"____ genuinely intrigued the neuroscientists was the subject's ability to maintain cognitive focus under severe sensory overload.\"",
    "What", ["That", "Which", "Whether"], 4,
    ["주어 역할을 하며 선행사를 포함하는 관계대명사를 찾으세요.", "'~한 것'이라는 뜻을 지닙니다."],
    "선행사가 없고 주어 역할을 하는 절을 이끄는 관계대명사는 'What'입니다."))

high_qs.append(make_review_q("H1", "e.h1.clause", 6,
    "동격절을 이끄는 접속사로 알맞은 것은?\n\"Astrophysicists confirmed the groundbreaking hypothesis ____ gravitational waves propagate at the precise speed of light.\"",
    "that", ["which", "what", "where"], 4,
    ["추상명사(the hypothesis)의 구체적 내용을 설명하는 완전한 절을 이끕니다.", "동격을 나타내는 접속사를 선택하세요."],
    "뒤에 완전한 문장이 이어지며 hypothesis와 동격을 이루므로 접속사 'that'이 올바릅니다."))

high_qs.append(make_review_q("H1", "e.h1.clause", 7,
    "부사절 접속사로 빈칸에 알맞은 것은?\n\"The engineering laboratory maintains backup generators in case ____ the municipal power grid suffers an unexpected blackout.\"",
    "that", ["which", "what", "whom"], 4,
    ["'만약 ~할 경우에 대비하여'를 뜻하는 'in case (that)' 구문입니다.", "뒤따르는 완전한 절을 연결합니다."],
    "'in case (that)' 뒤에 절이 이어져 만약의 사태에 대비함을 나타냅니다."))

# e.h1.partc (3)
high_qs.append(make_review_q("H1", "e.h1.partc", 8,
    "어법상 빈칸에 알맞은 완료분사구문은?\n\"____ all initial clinical trials, the medical team submitted their drug formulation to the regulatory agency for approval.\"",
    "Having completed", ["Completing", "Completed", "Have completed"], 4,
    ["주절의 동작(submitted)보다 먼저 일어난 완료된 행위입니다.", "완료분사구문(Having + p.p.)을 적용하세요."],
    "주절의 시점보다 앞서 완료된 동작이므로 완료분사구문 'Having completed'가 정답입니다."))

high_qs.append(make_review_q("H1", "e.h1.partc", 9,
    "수동 분사구문으로 빈칸에 알맞은 것은?\n\"____ by sudden volcanic tremors, the remote village residents evacuated toward designated coastal shelters.\"",
    "Alarmed", ["Alarming", "Having alarmed", "To alarm"], 4,
    ["주민들(residents)이 지진에 의해 불안과 경각심을 느낀 수동적 상황입니다.", "과거분사로 시작하는 수동 분사구문을 고르세요."],
    "주어가 경각심을 받은 수동의 입장이므로 과거분사 'Alarmed'가 알맞습니다."))

high_qs.append(make_review_q("H1", "e.h1.partc", 10,
    "독립분사구문 관용표현으로 알맞은 것은?\n\"Strictly ____, viruses cannot replicate independently without commandeering the metabolic machinery of a host cell.\"",
    "speaking", ["spoken", "speak", "to speak"], 4,
    ["'엄격히 말해서'라는 관용적 독립분사구문 표현입니다.", "관용어 'Strictly speaking'을 확인하세요."],
    "관용적인 독립분사구문 표현은 'Strictly speaking'입니다."))

# e.h1.conn (4)
high_qs.append(make_review_q("H1", "e.h1.conn", 11,
    "문맥상 빈칸에 들어갈 가장 알맞은 연결부사는?\n\"The research team faced numerous funding cuts and laboratory equipment malfunctions; ____, they persevered and synthesized the novel compound.\"",
    "nevertheless", ["furthermore", "consequently", "for example"], 4,
    ["어려움에도 불구하고 연구를 완수했다는 역접의 논리 관계입니다.", "'그럼에도 불구하고'를 뜻하는 연결사를 찾으세요."],
    "앞선 난관에도 불구하고 성과를 달성했으므로 역접의 연결부사 'nevertheless'가 알맞습니다."))

high_qs.append(make_review_q("H1", "e.h1.conn", 12,
    "문맥상 빈칸에 들어갈 연결부사는?\n\"The new solar installation reduced carbon emissions; ____, it generated substantial surplus revenue by feeding clean energy back into the city grid.\"",
    "furthermore", ["nevertheless", "instead", "on the contrary"], 4,
    ["앞 문장의 혜택에 더해 또 다른 긍정적 결과를 덧붙이고 있습니다.", "'게다가, 더욱이'를 뜻하는 첨가 연결사를 고르세요."],
    "추가적인 이점을 첨가하여 설명하므로 'furthermore'가 가장 자연스럽습니다."))

high_qs.append(make_review_q("H1", "e.h1.conn", 13,
    "문맥상 빈칸에 들어갈 인과 연결사는?\n\"Prolonged summer droughts severely depleted groundwater reservoirs; ____, municipal authorities enforced emergency agricultural water rations.\"",
    "consequently", ["however", "otherwise", "nevertheless"], 4,
    ["원인(가뭄과 저수량 고갈)에 뒤따르는 필연적인 결과(배급제 시행)입니다.", "'결과적으로, 따라서'를 뜻하는 연결어를 고르세요."],
    "원인에 따른 결과를 이끄는 연결부사이므로 'consequently'가 정답입니다."))

high_qs.append(make_review_q("H1", "e.h1.conn", 14,
    "문맥상 빈칸에 들어갈 대조 연결사는?\n\"Classical mechanics assumes deterministic predictability; ____, quantum physics reveals inherent probabilistic indeterminacy at subatomic scales.\"",
    "in contrast", ["likewise", "furthermore", "therefore"], 4,
    ["고전역학의 결정론과 양자물리학의 확률론적 비결정론 간의 극명한 대비입니다.", "'대조적으로'를 뜻하는 표현을 찾으세요."],
    "두 물리학적 패러다임의 현저한 차이점을 대조하므로 'in contrast'가 알맞습니다."))

# e.h1.main (3)
high_qs.append(make_review_q("H1", "e.h1.main", 15,
    "다음 글의 핵심 요지로 가장 적절한 것은?\n\"Scientific progress does not thrive within insulated disciplinary silos. Breakthroughs in synthetic biology, environmental engineering, and artificial intelligence increasingly emerge when researchers from disparate traditions synthesize their methodologies. Dismantling intellectual boundaries fosters innovative heuristics capable of resolving complex global dilemmas.\"",
    "Interdisciplinary collaboration is essential for solving complex modern challenges.",
    ["Single-discipline specialization guarantees superior breakthrough innovations.",
     "Computational engineering renders biological research obsolete.",
     "Scientific laboratories should restrict cross-departmental dialogue."], 4,
    ["단일 학문 고립의 한계와 학제 간 융합의 필요성에 주목하세요.", "학제 간 협력(Interdisciplinary collaboration)의 중요성을 요약한 보기를 고르세요."],
    "서로 다른 학문 간의 융합과 협력이 현대의 복합적 난제를 해결하는 핵심이라는 주장입니다.", 50))

high_qs.append(make_review_q("H1", "e.h1.main", 16,
    "다음 글의 주제로 가장 적절한 것은?\n\"Over half of the world's indigenous languages face catastrophic extinction within the coming century. Mobile linguistic field recordings and open-access digital phonological corpora provide crucial instruments to document dying dialects. These collaborative repositories empower native communities to revitalize cultural heritage while advancing scientific linguistics.\"",
    "The significance of digital archiving in preserving endangered indigenous languages",
    ["The inevitable obsolescence of minority languages in a global economy",
     "Why written literature is superior to oral linguistic heritage",
     "The financial costs of establishing digital recording archives in universities"], 4,
    ["소멸 위기 언어 기록을 위한 디지털 아카이빙의 역할과 문화적 가치를 파악하세요.", "언어 보존 및 부흥의 의의를 담은 보기를 선택하세요."],
    "디지털 아카이빙을 통해 소멸 위기 고유 언어를 보존하고 문화적 유산을 되살리는 의의를 다룬 글입니다.", 50))

high_qs.append(make_review_q("H1", "e.h1.main", 17,
    "다음 글의 요지로 가장 적절한 것은?\n\"When automated algorithmic filters evaluate loan applications or job candidates, they inevitably ingest historical biases embedded within training datasets. Without transparent ethical auditing and proactive algorithmic correction, automated convenience risks calcifying systemic societal inequalities beneath an illusion of mathematical neutrality.\"",
    "Automated algorithms require ethical auditing to prevent entrenching historical biases.",
    ["Algorithms are mathematically neutral and free from human prejudice.",
     "Modern organizations should replace all human managers with automated neural networks.",
     "Historical training datasets reflect completely fair and egalitarian social structures."], 4,
    ["알고리즘이 과거 데이터의 편향을 학습하여 증폭할 위험성에 주목하세요.", "윤리적 감사와 투명성의 필요성을 강조한 보기를 고르세요."],
    "알고리즘의 수학적 중립성 착각을 경계하고, 편향 방지를 위한 윤리적 감사의 필수성을 강조하고 있습니다.", 50))

# H2 Skills (17 questions)
# e.h2.inv (4)
high_qs.append(make_review_q("H2", "e.h2.inv", 18,
    "어법상 빈칸에 알맞은 부정어 도치 구문은?\n\"Hardly ____ the laboratory cleanroom when the volatile atmospheric sensors detected a containment breach.\"",
    "had the technicians entered",
    ["the technicians had entered", "did the technicians entered", "have the technicians entered"], 4,
    ["Hardly가 문두에 올 때 [Hardly + had + 주어 + p.p. ~ when] 도치 구문을 확인하세요.", "과거완료 도치 어순을 적용하세요."],
    "부정어 Hardly가 문두로 나가면서 주어와 조동사가 도치된 'had the technicians entered'가 올바릅니다."))

high_qs.append(make_review_q("H2", "e.h2.inv", 19,
    "어법상 빈칸에 알맞은 도치 형태는?\n\"Seldom ____ such remarkable unanimity among rival political factions on major constitutional amendments.\"",
    "have historians documented",
    ["historians have documented", "did historians documented", "historians documented"], 4,
    ["부정 부사 Seldom이 문두에 위치할 때의 어순을 생각하세요.", "조동사 have가 주어 앞으로 도치됩니다."],
    "부정어 Seldom이 문두에 오므로 [조동사 have + 주어 historians + p.p. documented]로 도치됩니다."))

high_qs.append(make_review_q("H2", "e.h2.inv", 20,
    "도치 어법상 빈칸에 알맞은 것은?\n\"Not only ____ the prestigious mathematics prize, but she also secured tenure at the university.\"",
    "did the researcher win",
    ["the researcher won", "had the researcher won", "the researcher did win"], 4,
    ["Not only가 문두에 위치할 때 일반동사 과거형의 도치 규칙을 적용하세요.", "[did + 주어 + 동사원형]."],
    "Not only 도치 구문에서 일반동사 과거형은 조동사 did를 주어 앞에 놓아 'did the researcher win'이 됩니다."))

high_qs.append(make_review_q("H2", "e.h2.inv", 21,
    "도치 어법상 빈칸에 알맞은 것은?\n\"Only after the forensic investigators re-examined the encrypted ledger ____ the financial discrepancy.\"",
    "did they uncover",
    ["they uncovered", "they did uncover", "have they uncovered"], 4,
    ["'Only + 부사절'이 문두에 올 때 주절의 도치 어순을 확인하세요.", "과거 시제이므로 [did + 주어 + 동사원형]이 됩니다."],
    "'Only after ~' 절이 문두에 위치하여 주절에 [did + 주어 they + 동사원형 uncover] 도치가 일어납니다."))

# e.h2.subj (3)
high_qs.append(make_review_q("H2", "e.h2.subj", 22,
    "당위성 어법상 빈칸에 알맞은 형태는?\n\"The bioethics committee demanded that the pharmaceutical corporation ____ all clinical trial data transparently.\"",
    "(should) disclose", ["discloses", "disclosed", "will disclose"], 4,
    ["요구/제안 동사(demanded) 뒤의 that절에서 당위성을 나타내는 형태를 확인하세요.", "'(should) + 동사원형'을 씁니다."],
    "주장·요구 동사 demand 뒤의 that절에는 당위성을 표현하는 '(should) + 동사원형'인 disclose가 와야 합니다."))

high_qs.append(make_review_q("H2", "e.h2.subj", 23,
    "가정법 어법상 빈칸에 알맞은 것은?\n\"The senior diplomat spoke as if he ____ privy to the confidential cabinet negotiations.\"",
    "were", ["is", "was being", "has been"], 4,
    ["현재 사실의 반대를 상상하는 'as if + 가정법 과거' 구문입니다.", "be동사는 인칭에 상관없이 'were'를 씁니다."],
    "'as if' 가정법 과거에서 be동사는 표준 문법 규범상 'were'를 사용합니다."))

high_qs.append(make_review_q("H2", "e.h2.subj", 24,
    "가정법 과거완료 표현으로 알맞은 것은?\n\"I wish that we ____ the environmental warning signs before the reservoir dried up completely.\"",
    "had recognized", ["recognized", "have recognized", "would recognize"], 4,
    ["과거 사실에 대한 아쉬움이나 유감을 나타내는 'I wish' 구문입니다.", "과거 사실의 반대는 가정법 과거완료(had + p.p.)를 씁니다."],
    "과거에 알아차리지 못했던 사실에 대한 유감이므로 'had recognized'가 알맞습니다."))

# e.h2.wh (3)
high_qs.append(make_review_q("H2", "e.h2.wh", 25,
    "어법상 빈칸에 들어갈 알맞은 복합관계대명사는?\n\"The university will award the research fellowship to ____ demonstrates extraordinary promise in quantum chemistry.\"",
    "whoever", ["whomever", "whichever", "whatever"], 4,
    ["전치사 to 뒤의 명사절 내부에서 동사 demonstrates의 주어 역할을 합니다.", "주격 복합관계대명사를 선택하세요."],
    "절 내부에서 주어 역할을 수행하므로 주격 'whoever'가 정답입니다."))

high_qs.append(make_review_q("H2", "e.h2.wh", 26,
    "양보 부사절에서 빈칸에 알맞은 것은?\n\"____ strenuous the mountain expedition proved to be, the botanists persevered to collect floral specimens.\"",
    "However", ["Whatever", "Whenever", "Wherever"], 4,
    ["형용사(strenuous)를 수식하여 양보 부사절을 이끄는 형태를 찾으세요.", "'However + 형용사/부사 + 주어 + 동사'."],
    "형용사를 수식하며 '아무리 ~할지라도'를 뜻하는 양보 부사절 접속사는 'However'입니다."))

high_qs.append(make_review_q("H2", "e.h2.wh", 27,
    "복합관계형용사로 빈칸에 알맞은 것은?\n\"You are welcome to select ____ research topic aligns most coherently with your academic interests.\"",
    "whichever", ["whoever", "whatever", "however"], 4,
    ["정해진 범위 내에서 명사 topic을 수식하는 복합관계형용사입니다.", "'어느 ~이든'의 선택적 의미를 가집니다."],
    "선택 범위가 주어졌을 때 명사를 수식하는 복합관계형용사는 'whichever'입니다."))

# e.h2.vocab (4)
high_qs.append(make_review_q("H2", "e.h2.vocab", 28,
    "문맥상 밑줄 친 단어의 동의어로 가장 알맞은 것은?\n\"The clinical laboratory trial yielded *significant* statistical correlations between dietary fiber and cardiovascular health.\"",
    "meaningful and substantial",
    ["trivial and negligible", "artificial and synthetic", "temporary and fleeting"], 4,
    ["'significant'가 학술 연구 및 통계 문맥에서 갖는 의미를 생각하세요.", "'유의미한, 상당한'을 뜻합니다."],
    "학술 연구에서 통계적으로 유의하고 가치 있는 결과를 뜻하므로 'meaningful and substantial'이 동의어입니다."))

high_qs.append(make_review_q("H2", "e.h2.vocab", 29,
    "문맥상 밑줄 친 어휘의 동의어로 알맞은 것은?\n\"The abrupt collapse of the international trading bank threatened to *precipitate* a nationwide credit contraction.\"",
    "accelerate and trigger",
    ["postpone and delay", "conceal and disguise", "remedy and alleviate"], 4,
    ["'precipitate'는 위기나 급격한 변화를 촉발하다를 뜻합니다.", "'가속화하다, 유발하다'의 의미를 찾으세요."],
    "'precipitate'는 사태를 재촉하거나 촉발함을 뜻하므로 'accelerate and trigger'가 동의어입니다."))

high_qs.append(make_review_q("H2", "e.h2.vocab", 30,
    "밑줄 친 단어의 문맥상 동의어는?\n\"Rapid innovations in solid-state battery technology may render traditional fuel cells *obsolete* within decades.\"",
    "outdated and superseded",
    ["indispensable and vital", "resilient and durable", "transparent and evident"], 4,
    ["'obsolete'는 더 나은 기술이 나와 구식이 되고 쓰이지 않게 됨을 뜻합니다.", "'시대에 뒤처진'을 고르세요."],
    "'obsolete'는 '구식의, 쓸모없어진'을 뜻하므로 'outdated and superseded'가 알맞습니다."))

high_qs.append(make_review_q("H2", "e.h2.vocab", 31,
    "문맥상 밑줄 친 어휘의 의미와 가장 가까운 것은?\n\"Subsequent archaeological excavations thoroughly *corroborated* the historical validity of the royal chronicle.\"",
    "confirmed and substantiated",
    ["contradicted and undermined", "dismissed and ignored", "fabricated and invented"], 4,
    ["'corroborate'는 새로운 증거로 사실이나 주장을 확증함을 뜻합니다.", "'뒷받침하다, 입증하다'를 고르세요."],
    "'corroborate'는 '확증하다, 입증하다'를 뜻하므로 'confirmed and substantiated'가 정답입니다."))

# e.h2.logic (3)
high_qs.append(make_review_q("H2", "e.h2.logic", 32,
    "다음 글의 전체 흐름과 관계없는 문장은?\n\"Quantum key distribution utilizes photon polarization states to construct tamper-proof cryptography. [A] Any unauthorized interceptor measuring a quantum particle irreversibly perturbs its quantum state, immediately exposing the intrusion. [B] Consequently, financial conglomerates are piloting quantum channels to protect interbank asset settlements. [C] Commercial jet aircraft require meticulous aerodynamic inspections before transoceanic passenger flights. [D] This fundamental law of physics ensures uncompromised long-term cybersecurity.\"",
    "[C]", ["[A]", "[B]", "[D]"], 4,
    ["글의 중심 제재(양자 암호통신의 물리적 원리와 보안성)를 파악하세요.", "상업용 비행기 정비 점검을 언급하는 문장을 가려내세요."],
    "양자 암호통신의 원리를 설명하는 글에서 [C]의 비행기 공기역학 점검은 전체 흐름과 무관합니다.", 50))

high_qs.append(make_review_q("H2", "e.h2.logic", 33,
    "다음 글의 전체 흐름과 관계없는 문장은?\n\"Human circadian rhythms are entrained by ambient daylight spectrums. [A] Morning blue-wavelength exposure suppresses melatonin synthesis, fostering alert cognitive states. [B] Conversely, nocturnal screen illumination impairs sleep architecture and metabolic recovery. [C] Vintage vinyl record enthusiasts frequently trade acoustic jazz discs at weekend swap meets. [D] Aligning lifestyle schedules with biological circadian timing optimizes hormonal equilibrium.\"",
    "[C]", ["[A]", "[B]", "[D]"], 4,
    ["생체 시계(circadian rhythms)와 빛의 관계를 설명하는 글입니다.", "LP 음반 수집 취미를 다루는 문장을 찾으세요."],
    "생체 리듬과 빛의 상관관계를 다루는 본문에서 [C]의 레코드 음반 교환은 논리적으로 무관합니다.", 50))

high_qs.append(make_review_q("H2", "e.h2.logic", 34,
    "다음 글의 전체 흐름과 관계없는 문장은?\n\"Mycorrhizal fungi form mutualistic networks with terrestrial plant roots. [A] The fungal hyphae absorb scarce soil phosphorus and deliver it directly to host trees. [B] In return, photosynthetic plants transfer carbon-rich sugars to nourish the underground fungal web. [C] High-speed optical fiber cables facilitate seamless transcontinental internet communication. [D] This underground symbiosis underpins the ecological stability of ancient forest biomes.\"",
    "[C]", ["[A]", "[B]", "[D]"], 4,
    ["식물 뿌리와 균류 간의 균근(mycorrhizae) 공생 네트워크를 다루는 글입니다.", "광섬유 인터넷 케이블을 언급하는 문장을 식별하세요."],
    "산림 생태계의 균근 공생 관계를 설명하는 글에서 [C]의 해저 광케이블 통신은 무관한 문장입니다.", 50))

# H3 Skills (16 questions)
# e.h3.par (3)
high_qs.append(make_review_q("H3", "e.h3.par", 35,
    "주어진 글 다음에 이어질 글의 순서로 가장 적절한 것은?\n\"Transitioning toward renewable energy requires cost-effective long-duration electrical storage.\n(A) Consequently, energy engineers are accelerating development of grid-scale iron-air batteries.\n(B) However, seasonal meteorological lulls create prolonged multi-day deficits in solar and wind generation.\n(C) These scalable iron-air systems discharge energy continuously over 100-hour spans, bridging weather-induced supply valleys.\"",
    "(B) - (A) - (C)",
    ["(A) - (C) - (B)", "(C) - (B) - (A)", "(B) - (C) - (A)"], 5,
    ["재생에너지의 기상 제약 한계(B) 제시 -> 이에 따른 배터리 기술 개발(A) -> 배터리의 방전 특성(C) 연결.", "However와 Consequently의 논리적 순서를 확인하세요."],
    "재생에너지의 간헐성 문제(B)를 제시한 뒤, 그 해결책으로 배터리 개발(A)을 언급하고, 그 배터리의 구체적 작동 방식(C)으로 이어지는 (B)-(A)-(C)가 자연스럽습니다.", 55))

high_qs.append(make_review_q("H3", "e.h3.par", 36,
    "주어진 글 다음에 이어질 글의 순서로 가장 적절한 것은?\n\"Fossilized trackways provide extraordinary empirical windows into the locomotive behaviors of extinct dinosaurs.\n(A) By calculating stride length and footprint depth, paleobiologists estimate running velocities and gait mechanics.\n(B) Such functional insights illuminate how massive sauropods supported colossal body masses without joint collapse.\n(C) Prior to high-resolution digital photogrammetry, researchers were forced to rely on imprecise hand measurements.\"",
    "(C) - (A) - (B)",
    ["(A) - (B) - (C)", "(B) - (C) - (A)", "(C) - (B) - (A)"], 5,
    ["과거의 기술적 한계(C) -> 최신 디지털 분석을 통한 보폭·깊이 추정(A) -> 거대 공룡의 관절 지탱 통찰(B).", "기술 발전 이전의 상황에서 정밀 분석 및 통찰로 나아가는 순서를 따지세요."],
    "디지털 기술 도입 이전의 한계(C)를 짚고, 최신 기술을 통한 정밀 계산(A), 그리고 이를 통한 고생물학적 통찰(B)로 흐르는 (C)-(A)-(B)가 논리적입니다.", 55))

high_qs.append(make_review_q("H3", "e.h3.par", 37,
    "주어진 글 다음에 이어질 글의 순서로 가장 적절한 것은?\n\"The human immune system distinguishes self-tissues from foreign antigens through major histocompatibility complexes.\n(A) In autoimmune pathology, however, regulatory T-cells fail to suppress self-reactive lymphocytes.\n(B) Normal thymic selection eliminates immature lymphocytes that bind strongly to self-peptides.\n(C) This breakdown leads to chronic inflammation and systemic destruction of healthy host organs.\"",
    "(B) - (A) - (C)",
    ["(A) - (C) - (B)", "(C) - (A) - (B)", "(B) - (C) - (A)"], 5,
    ["정상적인 면역 관용 선택 과정(B) -> 자가면역 질환에서의 실패(A) -> 이로 인한 조직 파괴 결과(C).", "정상 메커니즘에서 병리적 파괴로 이어지는 논리적 단계를 추적하세요."],
    "정상적인 자기 펩티드 제거 메커니즘(B)을 설명한 후, 자가면역 질환에서의 조절 실패(A)와 그에 따른 만성 염증(C)으로 전개되는 (B)-(A)-(C)가 타당합니다.", 55))

# e.h3.tone (3)
high_qs.append(make_review_q("H3", "e.h3.tone", 38,
    "다음 글에 드러난 필자의 어조로 가장 적절한 것은?\n\"It is frankly grotesque that pharmaceutical executives monetize critical pediatric insulin with five-hundred percent markups while uttering sanctimonious platitudes about patient welfare. Disguising predatory corporate extortion behind the rhetoric of research innovation represents an unmitigated moral bankruptcy.\"",
    "scathing and fiercely indignant",
    ["detached and clinically objective",
     "playful and lightly satirical",
     "resigned and complacent"], 5,
    ["'grotesque', 'extortion', 'moral bankruptcy' 등의 강한 비판적 어휘를 분석하세요.", "필자의 격앙된 분노와 신랄한 고발 태도를 파악하세요."],
    "극도로 신랄하고 분개한(scathing and fiercely indignant) 어조로 제약사의 폭리를 규탄하고 있습니다.", 50))

high_qs.append(make_review_q("H3", "e.h3.tone", 39,
    "다음 학술 지문의 전반적인 어조는?\n\"Stable isotope ratio mass spectrometry reveals a variance of 0.32 per mil in marine carbonate samples across the Paleocene-Eocene boundary. When adjusted for oceanic salinity gradients, atmospheric carbon isotope fractionation indicates accelerated benthic warming within calculated standard error parameters.\"",
    "detached, objective, and analytical",
    ["alarmist and impassioned", "cynical and sarcastic", "sentimental and nostalgic"], 5,
    ["감정적 수식어 없이 정량적 수치와 실험 데이터만을 객관적으로 기술하고 있습니다.", "과학 학술문의 전형적인 분석적 태도를 찾으세요."],
    "감정이 배제된 객관적이고 분석적인(detached, objective, and analytical) 학술적 어조입니다.", 50))

high_qs.append(make_review_q("H3", "e.h3.tone", 40,
    "다음 글의 어조로 가장 알맞은 것은?\n\"To imagine that thirty minutes of mindful meditation in an ergonomic chair will eradicate systemic employee burnout born of eighty-hour workweeks is delightful corporate theater. How touching that employers offer guided breathing sessions while systematically denying overtime compensation!\"",
    "ironic and biting",
    ["sincere and laudatory", "somber and sorrowful", "enthusiastic and encouraging"], 5,
    ["'delightful corporate theater', 'How touching' 등의 반어적 표현에 주목하세요.", "풍자와 조롱의 뉘앙스를 파악하세요."],
    "겉으로는 칭찬하는 척하며 기업의 기만적인 복지를 비꼬는 반어적이고 신랄한(ironic and biting) 어조입니다.", 50))

# e.h3.ins (3)
high_qs.append(make_review_q("H3", "e.h3.ins", 41,
    "글의 흐름으로 보아, 주어진 문장이 들어가기에 가장 적절한 곳은?\n[주어진 문장: However, such uncritical algorithmic curation rapidly polarizes political discourse into entrenched echo chambers.]\n\"Modern social media feeds optimize automated user engagement by amplifying tailored ideological content. [A] Readers encounter viewpoints that validate their pre-existing convictions while filtering out conflicting interpretations. [B] Over time, constructive civic compromise dissolves into mutual suspicion and hostility. [C] Overcoming this societal fragmentation requires deliberate cross-partisan exposure and algorithmic transparency. [D]\"",
    "[B]", ["[A]", "[C]", "[D]"], 5,
    ["삽입 문장의 However와 극단화(polarizes discourse)를 확인하세요.", "맞춤형 소비([A]) 직후와 정치적 적대감([C]) 발생 직전 사이를 찾으세요."],
    "알고리즘의 확증 편향 소비([A]) 직후에 역접으로 극단화를 짚는 [B]가 들어가야 뒤의 정치적 적대감([C])으로 매끄럽게 연결됩니다.", 55))

high_qs.append(make_review_q("H3", "e.h3.ins", 42,
    "글의 흐름으로 보아, 주어진 문장이 들어가기에 가장 적절한 곳은?\n[주어진 문장: In the absence of these apex carnivores, overabundant ungulates overgraze riparian willow thickets.]\n\"Gray wolves function as classic keystone regulators within western temperate wilderness zones. [A] By exerting predation pressure on elk herds, wolves restrict herbivore browsing time along vulnerable stream banks. [B] Consequently, native willow and aspen groves regenerate, providing essential habitats for songbirds and dam-building beavers. [C] Thus, an entire multi-trophic river valley ecosystem flourishes under apex predator stewardship. [D]\"",
    "[B]", ["[A]", "[C]", "[D]"], 5,
    ["포식자 부재 시 과잉 방목이 발생한다는 대조적 가정을 확인하세요.", "늑대의 초식동물 제어([A]) 직후이자 버드나무의 회복([C]) 직전 위치를 찾으세요."],
    "늑대의 포식 압력([A]) 뒤에 포식자가 없을 때의 문제점을 대비시키는 [B]가 위치해야 뒤의 회복([C])과 자연스럽게 호응합니다.", 55))

high_qs.append(make_review_q("H3", "e.h3.ins", 43,
    "글의 흐름으로 보아, 주어진 문장이 들어가기에 가장 적절한 곳은?\n[주어진 문장: Conversely, prolonged exposure to blue-wavelength illumination late at night profoundly suppresses nocturnal melatonin synthesis.]\n\"The human circadian pacemaker relies on ambient retinal sunlight cues to synchronize neuroendocrine cycles. [A] Morning daylight stimulates cortisol production, elevating body temperature and promoting acute daytime vigilance. [B] As a result, individuals experience delayed sleep latency, chronic sleep fragmentation, and impaired metabolic recovery. [C] Health professionals advise dimming artificial devices at least two hours before sleep. [D]\"",
    "[B]", ["[A]", "[C]", "[D]"], 5,
    ["Conversely(반대로)와 야간 청색광의 멜라토닌 억제를 확인하세요.", "낮의 각성 촉진([A])과 밤의 수면 장애 결과([C]) 사이의 전환 지점을 찾으세요."],
    "낮 시간의 각성 촉진([A])과 대조를 이루며 야간의 멜라토닌 억제를 설명하는 [B]에 들어가야 뒤이어 수면 장애 결과([C])로 연결됩니다.", 55))

# e.h3.col (3)
high_qs.append(make_review_q("H3", "e.h3.col", 44,
    "학술 연어 어법상 빈칸에 알맞은 전치사는?\n\"The newly identified neural biomarker substantially contributes ____ our diagnostic comprehension of early-stage neurodegeneration.\"",
    "to", ["with", "for", "against"], 4,
    ["동사 'contribute'와 결합하여 기여 대상을 나타내는 전치사를 생각하세요.", "'contribute to'는 대표적인 학술 고정 연어입니다."],
    "'contribute to'는 '~에 기여하다'라는 뜻으로 전치사 to를 취합니다."))

high_qs.append(make_review_q("H3", "e.h3.col", 45,
    "학술 연어 어법상 빈칸에 알맞은 전치사는?\n\"Adolescents under severe peer pressure are particularly prone ____ engaging in impulsive and hazardous decision-making.\"",
    "to", ["with", "of", "about"], 4,
    ["형용사 'prone'과 결합하여 경향성을 나타내는 전치사입니다.", "'be prone to' 구문을 확인하세요."],
    "'be prone to'는 '~하기 쉽다, ~의 경향이 있다'를 뜻하며 to는 전치사입니다."))

high_qs.append(make_review_q("H3", "e.h3.col", 46,
    "학술 연어 어법상 빈칸에 알맞은 전치사는?\n\"Environmental historians attribute the abrupt abandonment of the ancient city-state ____ prolonged regional megadroughts.\"",
    "to", ["with", "from", "for"], 4,
    ["'attribute A to B' (A를 B의 탓/원인으로 돌리다) 구문을 확인하세요.", "원인을 이끄는 전치사는 to입니다."],
    "'attribute A to B' 구문에서 결과를 원인에 귀속시킬 때 전치사 'to'를 씁니다."))

# e.h3.sum (4)
high_qs.append(make_review_q("H3", "e.h3.sum", 47,
    "다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\"For decades, conventional neurology claimed that the adult mammalian brain was genetically immutable and incapable of generating new neurons. However, rigorous neurobiological investigations over the past quarter-century demonstrated that sustained aerobic exercise and complex learning stimulate substantial hippocampal neurogenesis throughout maturity.\"\n요약문: Contrary to the outdated dogma that the mature brain is structurally (A)____, modern research confirms its lifelong capacity for neural (B)____.",
    "(A) immutable / (B) plasticity",
    ["(A) flexible / (B) degeneration",
     "(A) vulnerable / (B) decay",
     "(A) dynamic / (B) stagnation"], 5,
    ["과거의 정적 통념(immutable, 고정된)과 현대 연구의 신경 재생(plasticity, 가소성)의 대조를 파악하세요.", "빈칸 (A)와 (B)의 상반된 개념 쌍을 찾으세요."],
    "성인 뇌가 불변이라는(immutable) 과거 통념과 달리, 성인기에도 지속적으로 신경 가소성(plasticity)을 보인다는 요약이 알맞습니다.", 55))

high_qs.append(make_review_q("H3", "e.h3.sum", 48,
    "다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\"Universal state funding for municipal optical fiber broadband produces profound compounding socio-economic multipliers. Untethering intellectual labor from congested capitals revitalizes rural economies, democratizes specialized education, and narrows inter-provincial income gaps.\"\n요약문: Public investment in broadband functions as an economic (A)____ that decisively mitigates regional (B)____.",
    "(A) catalyst / (B) disparities",
    ["(A) obstacle / (B) development",
     "(A) burden / (B) equality",
     "(A) byproduct / (B) cohesion"], 5,
    ["초고속 인터넷망 투자가 경제적 촉진제(catalyst) 역할을 하며 지역적 격차(disparities)를 해소한다는 논지를 확인하세요.", "긍정적 촉진과 격차 완화의 어휘 쌍을 고르세요."],
    "광대역 투자가 경제 촉매제(catalyst)로서 지역 간 격차(disparities)를 완화한다는 요약이 정답입니다.", 55))

high_qs.append(make_review_q("H3", "e.h3.sum", 49,
    "다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\"Commercial wellness industries frequently peddle individual mindfulness apps and retail supplements as cures for systemic workplace exhaustion. In truth, employee burnout is predominantly driven by chronic understaffing, impossible deadlines, and toxic management cultures.\"\n요약문: Workplace burnout is fundamentally a (A)____ organizational pathology rather than an individual (B)____ deficit.",
    "(A) systemic / (B) mindfulness",
    ["(A) superficial / (B) technological",
     "(A) temporary / (B) financial",
     "(A) genetic / (B) emotional"], 5,
    ["번아웃의 진짜 원인이 개인의 결핍이 아닌 조직적/구조적(systemic) 문제라는 대조를 파악하세요.", "(A)에 구조적 문제, (B)에 개인적 차원을 대조하는 어휘를 고르세요."],
    "번아웃은 개인의 마음챙김 부족이 아니라 조직의 구조적(systemic) 병폐에서 비롯된다는 요약이 타당합니다.", 55))

high_qs.append(make_review_q("H3", "e.h3.sum", 50,
    "다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\"Traditional economic paradigms presumed that market participants operate as fully rational agents optimizing utility. Conversely, behavioral economics demonstrates that human choices are systematically swayed by cognitive shortcuts, framing effects, and emotional loss aversion.\"\n요약문: Behavioral economics illustrates that human decision-making is characterized by bounded (A)____ due to pervasive cognitive (B)____.",
    "(A) rationality / (B) biases",
    ["(A) volatility / (B) clarity",
     "(A) flexibility / (B) neutrality",
     "(A) uncertainty / (B) objectivity"], 5,
    ["인간의 의사결정이 완전한 합리성(rationality)을 갖추지 못하고 인지적 편향(biases)에 의해 제한된다는 점을 확인하세요.", "제한된 합리성과 인지 편향의 짝을 찾으세요."],
    "인간의 의사결정은 완전하지 않고 인지적 편향(biases)에 의해 제한된 합리성(bounded rationality)을 보인다는 요약이 알맞습니다.", 55))

# Save review bundle
review_bundle = {
    "metadata": {
        "title": "Reviewable English Question Bank Sample (100 Distinct Questions)",
        "purpose": "Authoritative sample for Claude independent content and pedagogy review prior to mass generation",
        "middleCount": len(middle_qs),
        "highCount": len(high_qs),
        "totalCount": len(middle_qs) + len(high_qs),
        "normalizationRules": "Strictly unique stems, options, and explanations with NO question numbering tags, NO duplicate templates, NO giveaways."
    },
    "middleSchoolQuestions": middle_qs,
    "highSchoolQuestions": high_qs
}

os.makedirs("/Users/juboklee/life-project/life-help/docs/learning/content-review", exist_ok=True)
json_path = "/Users/juboklee/life-project/life-help/docs/learning/content-review/english-review-bundle-100.json"
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(review_bundle, f, indent=2, ensure_ascii=False)

print(f"Generated {json_path}: {len(middle_qs)} Middle + {len(high_qs)} High = {len(middle_qs)+len(high_qs)} questions")
python3 /Users/juboklee/life-project/life-help/scripts/learn/bank/builder/generate_100_review_bundle.py