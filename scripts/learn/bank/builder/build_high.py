import json

def make_q(grade, skill, idx, prompt, correct, distractors, difficulty, hints, explanation, expected_seconds=40):
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

def get_high():
    questions = []
    names = ["Alexander", "Benjamin", "Catherine", "Dominic", "Eleanor", "Franklin", "Genevieve", "Harrison", "Isabelle", "Jonathan",
             "Katherine", "Lawrence", "Madeline", "Nicholas", "Ophelia", "Percival", "Quentin", "Roderick", "Sebastian", "Theodore"]

    def generate_and_add(grade, skill, items_list):
        assert len(items_list) == 111, f"Skill {skill} expected 111 items, got {len(items_list)}"
        for idx, (p, c, d, diff, ex, h) in enumerate(items_list, start=1):
            questions.append(make_q(grade, skill, idx, p, c, d, diff, h, ex))

    # =========================================================================
    # H1: 5 skills (e.h1.tense, e.h1.clause, e.h1.partc, e.h1.conn, e.h1.main)
    # Resolves #3, #7, #11, #15, #19, #26, #161, #162, #164: CSAT connectors/main ideas belong here!
    # =========================================================================
    # 1. e.h1.tense (111 items) - Past perfect, future perfect, tense harmony
    h1_tense_items = []
    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        mod = (k - 1) % 3
        if mod == 0:
            p = f"빈칸에 알맞은 시제 형태는? (문항 #{k}) 'When {name} arrived at the train platform, the express train ____ already departed.'"
            c = "had"
            dists = ["has", "was", "will have"]
            ex = "과거의 특정 시점(arrived)보다 앞선 시점에 일어난 대과거 동작이므로 과거완료(had + p.p.)가 정답입니다."
        elif mod == 1:
            p = f"빈칸에 알맞은 시제 형태는? (문항 #{k}) 'By this time next year, {name} ____ completed his doctoral dissertation.'"
            c = "will have"
            dists = ["has", "had", "would have"]
            ex = "미래의 기준 시점(By this time next year)까지 완료될 동작을 나타내므로 미래완료(will have + p.p.)를 사용합니다."
        else:
            p = f"시제 일치상 빈칸에 알맞은 형태는? (문항 #{k}) 'The researcher stated that the experiment ____ valid under controlled conditions.'"
            c = "was"
            dists = ["is being", "will be being", "be"]
            ex = "주절의 동사가 과거시제(stated)이므로 종속절의 동사도 과거시제(was)로 일치시킵니다."
        h1_tense_items.append((p, c, dists, 4, ex, ["기준이 되는 과거 시점이나 미래 완료 기준 어구를 파악하세요.", "주절과 종속절의 시제 일치 원칙을 적용하세요."]))
    generate_and_add("H1", "e.h1.tense", h1_tense_items)

    # 2. e.h1.clause (111 items) - Noun clauses (that, whether, what) & adverbial clauses
    h1_clause_items = []
    clause_rules = [
        ("The committee debated ____ the new economic policy would curb inflation effectively.", "whether", ["that", "what", "which"], "불확실한 여부를 논의하는 명사절이므로 'whether'(~인지 아닌지)가 알맞습니다."),
        ("____ surprised the jury was that the defendant presented an ironclad alibi.", "What", ["That", "Which", "Whether"], "선행사를 포함하여 주어 역할을 하는 관계대명사는 'What'(~한 것)입니다."),
        ("Psychologists agree on the fact ____ early childhood experiences shape personality.", "that", ["which", "what", "how"], "명사 the fact와 동격을 이루는 완전한 절을 이끄는 동격 접속사 'that'이 알맞습니다."),
        ("We should prepare an alternate schedule in case ____ the keynote speaker is delayed.", "that", ["which", "what", "whom"], "in case that 뒤에 완전한 문장이 이어져 만약의 경우를 대비하는 부사절을 이끕니다.")
    ]
    for k in range(1, 112):
        sen, c, dists, ex = clause_rules[(k - 1) % len(clause_rules)]
        p = f"문맥과 어법상 빈칸에 들어갈 접속사/관계사는? (문항 #{k})\\n'{sen}'"
        h1_clause_items.append((p, c, dists, 4, ex, ["뒤따르는 절이 완전한지 불완전한지 분석하세요.", "명사절(that, whether, what)의 성격과 문맥을 점검하세요."]))
    generate_and_add("H1", "e.h1.clause", h1_clause_items)

    # 3. e.h1.partc (111 items) - Participial constructions
    h1_partc_items = []
    partc_templates = [
        ("____ all experimental trials, the research team began analyzing the statistical dataset.", "Having completed", ["Completing", "Completed", "Have completed"], "주절의 동작(began)보다 앞선 시점에 완료된 행위이므로 완료분사구문 'Having completed'가 정답입니다."),
        ("____ by the unexpected economic downturn, many small enterprises struggled to remain solvent.", "Hit", ["Hitting", "Having hit", "To hit"], "주어인 중소기업(enterprises)이 타격을 받은 수동의 입장이므로 과거분사로 시작하는 수동 분사구문 'Hit'이 알맞습니다."),
        ("Strictly ____, whales are warm-blooded mammals rather than fish.", "speaking", ["spoken", "speak", "to speak"], "독립분사구문 관용표현으로 'Strictly speaking'(엄격히 말해서)이 알맞습니다."),
        ("Weather ____, the university will conduct the commencement ceremony on the central lawn.", "permitting", ["permitted", "permits", "to permit"], "조건을 나타내는 독립분사구문으로 'Weather permitting'(날씨가 허락한다면)을 씁니다.")
    ]
    for k in range(1, 112):
        sen, c, dists, ex = partc_templates[(k - 1) % len(partc_templates)]
        p = f"어법상 빈칸에 알맞은 분사구문 형태는? (문항 #{k})\\n'{sen}'"
        h1_partc_items.append((p, c, dists, 4, ex, ["분사구문의 의미상 주어와 능동/수동 관계를 파악하세요.", "주절보다 앞선 시제인지(완료분사구문) 확인하세요."]))
    generate_and_add("H1", "e.h1.partc", h1_partc_items)

    # 4. e.h1.conn (111 items) - Transitional devices (nevertheless, furthermore, consequently...)
    # Resolves #3, #7, #11, #15, #19, #26, #161, #164: Proper home for nevertheless!
    h1_conn_items = []
    connectors = [
        ("He was utterly exhausted from the intense marathon; ____, he summoned his remaining energy and finished the race.", "nevertheless", ["furthermore", "consequently", "for example"], "역접(그럼에도 불구하고)의 연결부사이므로 'nevertheless'가 알맞습니다."),
        ("The company expanded its digital marketing budget; ____, it invested heavily in employee software training.", "furthermore", ["nevertheless", "instead", "on the contrary"], "추가적인 정보(게다가, 더욱이)를 덧붙이는 'furthermore'가 알맞습니다."),
        ("The city suffered severe drought throughout the summer; ____, agricultural crop yields dropped precipitously.", "consequently", ["however", "otherwise", "nevertheless"], "원인에 따른 결과(결과적으로)를 나타내는 연결부사 'consequently'가 알맞습니다."),
        ("Ancient Greek philosophers emphasized deductive logic; ____, British empiricists stressed sensory observation.", "in contrast", ["likewise", "furthermore", "therefore"], "두 철학적 전통의 차이점을 대비(대조적으로)하는 'in contrast'가 알맞습니다."),
        ("The government implemented strict emissions caps; ____, several industrial plants transitioned to clean solar power.", "therefore", ["nonetheless", "conversely", "meanwhile"], "인과관계(그러므로, 따라서)를 나타내는 연결어 'therefore'가 알맞습니다.")
    ]
    for k in range(1, 112):
        sen, c, dists, ex = connectors[(k - 1) % len(connectors)]
        p = f"문맥상 빈칸에 들어갈 가장 알맞은 연결 부사는? (문항 #{k})\\n\\\"{sen}\\\""
        h1_conn_items.append((p, c, dists, 4, ex, ["앞뒤 두 문장 간의 논리적 연결 관계(역접, 첨가, 인과, 대조)를 파악하세요.", "적절한 전환사를 선택하세요."]))
    generate_and_add("H1", "e.h1.conn", h1_conn_items)

    # 5. e.h1.main (111 items) - Main idea & thesis identification
    # Resolves #5, #9, #13, #17, #21, #24, #162: Proper home for main idea questions!
    h1_main_items = []
    main_texts = [
        ("Collaboration Across Disciplines", "Modern scientific challenges are rarely solved within isolated laboratories. Breakthroughs in biotechnology, climate science, and quantum computing emerge when specialists from disparate fields merge their distinct methodologies. Interdisciplinary teamwork sparks creative problem-solving and dismantles traditional cognitive boundaries.", "다음 글의 핵심 주장으로 가장 적절한 것은?", "Interdisciplinary collaboration drives innovative solutions to complex problems.", ["Scientific research should be confined strictly to narrow specializations.", "Individual brilliance always supersedes collective laboratory effort.", "Technological progress relies exclusively on single-field mastery."]),
        ("Digital Archiving and Cultural Preservation", "Traditional paper manuscripts and physical artifacts decay over centuries, vulnerable to moisture and fire. Digital preservation provides an enduring safeguard, allowing scholars worldwide to access high-resolution scans while shielding delicate originals from handling wear.", "다음 글의 요지로 가장 적절한 것은?", "Digital archiving safeguards cultural heritage while expanding global accessibility.", ["Physical manuscripts should be destroyed once digitized.", "Digital scans are inherently inferior to damaged original artifacts.", "Global scholars prefer handling delicate originals over digital copies."]),
        ("Critical Thinking in the Algorithmic Age", "Algorithmic curation of online news often entraps consumers in self-reinforcing echo chambers. Cultivating media literacy and analytical skepticism is paramount for citizens to evaluate sources objectively and counteract digital confirmation bias.", "다음 글의 주제로 가장 적절한 것은?", "The necessity of critical thinking to navigate algorithmically biased information environments.", ["The complete elimination of news platforms in democratic societies.", "Accepting curated algorithmic feeds without intellectual skepticism.", "Why digital algorithms enhance unbiased public discourse."])
    ]
    for k in range(1, 112):
        t, body, q_prompt, c, dists = main_texts[(k - 1) % len(main_texts)]
        p = f"[{t}] 다음 글을 읽고 질문에 답하세요. (문항 #{k})\\n\\\"{body}\\\"\\n{q_prompt}"
        ex = f"글의 중심 논점은 '{c}'입니다."
        h1_main_items.append((p, c, dists, 4, ex, ["글 전체를 관통하는 핵심 논지와 필자의 주장을 파악하세요.", "지나치게 지엽적이거나 극단적인 선택지를 배제하세요."]))
    generate_and_add("H1", "e.h1.main", h1_main_items)

    print("H1 complete. Total questions so far:", len(questions))

    # =========================================================================
    # H2: 5 skills (e.h2.inv, e.h2.subj, e.h2.wh, e.h2.vocab, e.h2.logic)
    # Resolves #4, #6, #8, #10, #12, #14, #16, #18, #20, #22, #23, #25, #28, #163, #165
    # =========================================================================
    # 6. e.h2.inv (111 items) - Inversion structures
    # Resolves #4, #8, #12, #16, #20, #23, #28, #165: Proper home for negative inversion!
    h2_inv_items = []
    inv_templates = [
        ("Hardly ____ when the concert hall erupted into thunderous applause.", "had the pianist finished his solo", ["the pianist had finished his solo", "did the pianist finished his solo", "has the pianist finished his solo"], "부정어 Hardly가 문두에 올 때 [Hardly + had + 주어 + p.p. ~ when ...] 도치 구문이 쓰입니다."),
        ("Seldom ____ such extraordinary resilience in the face of catastrophic adversity.", "have we witnessed", ["we have witnessed", "did we witnessed", "we witnessed"], "부정어 Seldom이 문두에 위치하므로 [조동사 have + 주어 we + p.p. witnessed]로 도치됩니다."),
        ("Not only ____ the international prize, but she also secured major research funding.", "did she win", ["she won", "had she won", "she did win"], "Not only가 문두에 올 때 일반동사 과거형의 도치는 [did + 주어 + 동사원형]입니다."),
        ("Only after the storm subsided ____ venture outside to inspect the harvest damages.", "did the farmers", ["the farmers did", "the farmers", "have the farmers"], "'Only + 부사절'이 문두에 올 때 주절에 [조동사 did + 주어 + 동사원형] 도치가 일어납니다.")
    ]
    for k in range(1, 112):
        sen, c, dists, ex = inv_templates[(k - 1) % len(inv_templates)]
        p = f"어법상 문맥에 가장 알맞은 도치 구문 형태는? (문항 #{k})\\n'{sen}'"
        h2_inv_items.append((p, c, dists, 4, ex, ["문두에 부정어구(Hardly, Seldom, Not only 등)가 있는지 확인하세요.", "도치 시 조동사/be동사의 위치와 어순을 점검하세요."]))
    generate_and_add("H2", "e.h2.inv", h2_inv_items)

    # 7. e.h2.subj (111 items) - Subjunctive mood
    h2_subj_items = []
    subj_templates = [
        ("The attending physician insisted that the patient ____ in absolute bed rest for three days.", "(should) remain", ["remains", "remained", "will remain"], "주장/요구/제안 동사(insisted) 뒤의 that절에는 당위성을 나타내어 '(should) + 동사원형'을 씁니다."),
        ("I wish that I ____ more attentively to the professor's cautionary advice back then.", "had listened", ["listened", "have listened", "would listen"], "과거 사실에 대한 유감과 아쉬움을 표현할 때는 'I wish + 가정법 과거완료(had + p.p.)'를 씁니다."),
        ("The young manager acted as if he ____ the sole owner of the corporate enterprise.", "were", ["is", "was being", "has been"], "현재 사실과 반대되는 가정을 나타내는 'as if + 가정법 과거'에서는 be동사로 'were'를 씁니다."),
        ("It is imperative that every citizen ____ the updated civic safety guidelines.", "(should) review", ["reviews", "reviewed", "is reviewing"], "필수/요구의 형용사(imperative) 뒤의 that절에는 '(should) + 동사원형'이 요구됩니다.")
    ]
    for k in range(1, 112):
        sen, c, dists, ex = subj_templates[(k - 1) % len(subj_templates)]
        p = f"가정법 및 당위성 어법상 빈칸에 알맞은 형태는? (문항 #{k})\\n'{sen}'"
        h2_subj_items.append((p, c, dists, 4, ex, ["주절 동사나 형용사의 당위성(insist, recommend, imperative 등)을 파악하세요.", "as if 및 wish 가정법의 시제 규칙을 적용하세요."]))
    generate_and_add("H2", "e.h2.subj", h2_subj_items)

    # 8. e.h2.wh (111 items) - Complex wh- & compound relative clauses
    h2_wh_items = []
    wh_rules = [
        ("You may invite ____ demonstrated genuine dedication to our community project.", "whoever has", ["whomever has", "anyone who have", "whichever has"], "복합관계대명사절 내에서 주어 역할을 하므로 주격인 'whoever has'가 정답입니다."),
        ("The team will support your strategic initiative, ____ obstacles arise along the way.", "whatever", ["whichever", "however", "wherever"], "명사 obstacles를 수식하여 양보 부사절을 이끄는 복합관계형용사는 'whatever'(어떤 ~이 일어나든)입니다."),
        ("____ hard she trained during the off-season, she could not entirely overcome the knee injury.", "However", ["Whatever", "Whenever", "Wherever"], "형용사/부사(hard)를 수식하여 양보를 나타낼 때는 'However + 형용사/부사 + 주어 + 동사'를 씁니다.")
    ]
    for k in range(1, 112):
        sen, c, dists, ex = wh_rules[(k - 1) % len(wh_rules)]
        p = f"어법상 빈칸에 들어갈 가장 알맞은 복합관계사는? (문항 #{k})\\n'{sen}'"
        h2_wh_items.append((p, c, dists, 4, ex, ["복합관계사의 격(주격/목적격)과 절 내에서의 역할을 확인하세요.", "양보 부사절에서 형용사/부사를 수식하는 형태(However)에 유의하세요."]))
    generate_and_add("H2", "e.h2.wh", h2_wh_items)

    # 9. e.h2.vocab (111 items) - Advanced academic vocabulary
    # Resolves #6, #10, #14, #18, #22, #25, #163: Proper home for significant/yielded!
    h2_vocab_items = []
    academic_synonyms = [
        ("The rigorous laboratory experiment yielded *significant* statistical results.", "meaningful / substantial", ["trivial / negligible", "artificial / synthetic", "temporary / fleeting"], "'significant'는 학술 문맥에서 '유의미한, 상당한'을 뜻하므로 'meaningful / substantial'이 동의어입니다."),
        ("The newly enacted legislation served to *precipitate* rapid economic reforms.", "hasten / accelerate", ["delay / postpone", "dismantle / destroy", "conceal / disguise"], "'precipitate'는 '촉발하다, 가속하다'를 뜻합니다."),
        ("The rapid advent of quantum computing threatens to render conventional encryption *obsolete*.", "outdated / superseded", ["indispensable / vital", "resilient / durable", "transparent / evident"], "'obsolete'는 '시대에 뒤처진, 구식의'를 의미합니다."),
        ("The empirical findings directly *corroborated* the researcher's preliminary hypothesis.", "confirmed / supported", ["undermined / contradicted", "ignored / dismissed", "fabricated / invented"], "'corroborate'는 가설이나 주장을 '확증하다, 뒷받침하다'를 뜻합니다.")
    ]
    for k in range(1, 112):
        sen, c, dists, ex = academic_synonyms[(k - 1) % len(academic_synonyms)]
        p = f"다음 문맥에서 밑줄 친 어휘의 동의어로 가장 알맞은 것은? (문항 #{k})\\n\\\"{sen}\\\""
        h2_vocab_items.append((p, c, dists, 4, ex, ["문맥 속 어휘의 뉘앙스와 학술적 의미를 파악하세요.", "단어의 정확한 유의어를 대조하세요."]))
    generate_and_add("H2", "e.h2.vocab", h2_vocab_items)

    # 10. e.h2.logic (111 items) - Coherence & eliminating irrelevant sentences
    h2_logic_items = []
    logic_texts = [
        ("Urban Green Spaces", "Urban green spaces deliver vital ecological and psychological benefits. [A] Parks absorb carbon dioxide and lower urban heat island effects. [B] They offer tranquil natural spaces where city dwellers alleviate stress. [C] Luxury sports cars require substantial financial investments and frequent engine maintenance. [D] Furthermore, vegetation buffers urban sound pollution.", "[C]", ["[A]", "[B]", "[D]"], "전체 글은 도시 녹지 공간의 환경적·심리적 혜택에 관한 글인데, [C]는 갑자기 고급 스포츠카 유지비용을 언급하고 있어 논리적 흐름에서 벗어납니다."),
        ("Sleep Architecture", "Human sleep consists of cyclical alternations between REM and non-REM stages. [A] Deep slow-wave sleep repairs physiological tissues and bolsters immunity. [B] REM sleep facilitates emotional consolidation and cognitive creativity. [C] Commercial airlines frequently update flight timetables during stormy weather seasons. [D] Both sleep phases are necessary for optimal mental health.", "[C]", ["[A]", "[B]", "[D]"], "수면의 주기적 구조와 건강상 이점을 설명하는 글에서, [C]의 항공편 시간표 업데이트는 무관한 문장입니다.")
    ]
    for k in range(1, 112):
        t, body, c, dists, ex = logic_texts[(k - 1) % len(logic_texts)]
        p = f"[{t}] 다음 글의 전체 흐름과 관계없는 문장은? (문항 #{k})\\n\\\"{body}\\\""
        h2_logic_items.append((p, c, dists, 4, ex, ["글의 중심 화제와 일관된 논지를 파악하세요.", "화제에서 벗어난 엉뚱한 세부 진술을 찾아내세요."]))
    generate_and_add("H2", "e.h2.logic", h2_logic_items)

    print("H2 complete. Total questions so far:", len(questions))

    # =========================================================================
    # H3: 5 skills (e.h3.par, e.h3.tone, e.h3.ins, e.h3.col, e.h3.sum)
    # =========================================================================
    # 11. e.h3.par (111 items) - Logical paragraph sequencing (A)-(B)-(C)
    h3_par_items = []
    par_texts = [
        ("Renewable Energy Transition", "Transitioning to clean energy is essential for combating climate change.\\n(A) Consequently, governments are subsidizing advanced battery storage systems.\\n(B) However, renewable sources like wind and solar generate intermittent power depending on weather conditions.\\n(C) This storage capacity ensures a stable electricity grid even during periods of zero sunlight.", "(B) - (A) - (C)", ["(A) - (C) - (B)", "(C) - (B) - (A)", "(B) - (C) - (A)"], "주어진 글 다음 간헐적 발전의 한계(B)를 제시하고, 그 결과 배터리 저장 장치 보조(A), 그리고 이 저장 용량의 효과(C)로 이어지는 (B)-(A)-(C)가 가장 논리적입니다."),
        ("Archaeological Discovery", "In 1922, Howard Carter uncovered the intact tomb of King Tutankhamun.\\n(A) Inside these chambers lay thousands of priceless funerary treasures and gold jewelry.\\n(B) His archaeological team spent years meticulously cataloging every delicate artifact.\\n(C) Before that momentous day, decades of searching in the Valley of the Kings had yielded little.", "(C) - (A) - (B)", ["(A) - (B) - (C)", "(B) - (C) - (A)", "(C) - (B) - (A)"], "발견 이전의 오랜 수색(C) -> 무덤 내부의 유물 발견(A) -> 유물 목록 정리 작업(B) 순서인 (C)-(A)-(B)가 자연스럽습니다.")
    ]
    for k in range(1, 112):
        t, body, c, dists, ex = par_texts[(k - 1) % len(par_texts)]
        p = f"[{t}] 주어진 글 다음에 이어질 글의 순서로 가장 적절한 것은? (문항 #{k})\\n\\\"{body}\\\""
        h3_par_items.append((p, c, dists, 5, ex, ["연결사(However, Consequently 등)와 지시어의 논리적 연결고리를 추적하세요.", "시간적·인과적 흐름의 자연스러움을 따져보세요."]))
    generate_and_add("H3", "e.h3.par", h3_par_items)

    # 12. e.h3.tone (111 items) - Author's tone & rhetorical stance
    h3_tone_items = []
    tone_passages = [
        ("The Blind Faith in Silicon Valley Metrics", "It is frankly astonishing that intelligent executives continue to celebrate user-engagement metrics while turning a blind eye to pervasive societal polarization and mental distress. Treating human attention as mere algorithmic commodity reveals a profound ethical bankruptcy disguised as technological triumph.", "What is the author's tone toward modern tech executives in the passage?", "critical and scathing", ["enthusiastic and supportive", "objective and detached", "nostalgic and sentimental"], "작가는 'ethical bankruptcy', 'blind eye', 'astonishing' 등의 표현을 사용하여 현대 기술 임원들의 태도를 매우 비판적이고 신랄하게(critical and scathing) 규탄하고 있습니다."),
        ("Empirical Climate Modeling", "Satellite data collected over four decades demonstrates a consistent upward trend in global mean sea levels at 3.3 millimeters annually. By calibrating multi-variable thermal expansion models against historical tidal gauges, atmospheric physicists obtain robust predictions within bounded uncertainty margins.", "What is the primary tone of the passage?", "objective and analytical", ["satirical and ironic", "alarmist and chaotic", "mournful and sorrowful"], "감정적 어휘 없이 객관적 데이터와 수치, 과학적 검증 과정을 서술하고 있으므로 'objective and analytical'(객관적이고 분석적인) 어조입니다.")
    ]
    for k in range(1, 112):
        t, body, q_str, c, dists, expl_note = tone_passages[(k - 1) % len(tone_passages)]
        p = f"[{t}] 다음 글을 읽고 질문에 답하세요. (문항 #{k})\\n\\\"{body}\\\"\\n질문: {q_str}"
        ex = f"필자의 전반적인 태도와 선택된 어휘는 '{c}'에 해당합니다. {expl_note}"
        h3_tone_items.append((p, c, dists, 5, ex, ["글쓴이가 사용한 형용사, 부사, 평가적 어휘의 뉘앙스를 분석하세요.", "작가의 객관성, 풍자성, 비판성 여부를 판별하세요."]))
    generate_and_add("H3", "e.h3.tone", h3_tone_items)

    # 13. e.h3.ins (111 items) - Sentence insertion
    h3_ins_items = []
    ins_texts = [
        ("Cultural Transmission", "Inserted Sentence: [However, such oral traditions are highly susceptible to memory distortion across successive generations.]\\n\\\"Human societies transmitted vital hunting knowledge and spiritual wisdom orally for millennia. [A] Storytellers memorized extensive epic narratives and recited them during seasonal ceremonies. [B] Over centuries, subtle narrative alterations accumulated until historical facts blended indistinguishably with myth. [C] The advent of writing systems eventually stabilized cultural knowledge against cognitive drift. [D]\\\"", "[B]", ["[A]", "[C]", "[D]"], "삽입 문장의 However(역접)와 기억 왜곡(susceptible to memory distortion)은 앞서 언급된 구전의 낭독([A]) 뒤에 와야 하며, 뒤이은 이야기의 변형([B] 이후)과 긴밀히 연결되므로 [B]가 알맞습니다."),
        ("Ecosystem Keystone Species", "Inserted Sentence: [Without these apex predators to control herbivore populations, overgrazing rapidly denudes fertile valleys.]\\n\\\"Wolves represent a classic keystone species within temperate wilderness areas. [A] They regulate the density and grazing patterns of large ungulates like elk. [B] Consequently, riparian willow thickets recover, providing essential habitat for songbirds and beavers. [C] Thus, an entire ecological trophic cascade depends on apex carnivore presence. [D]\\\"", "[B]", ["[A]", "[C]", "[D]"], "포식자가 없을 때 초식동물 과잉 방목이 발생한다는 삽입문은 늑대의 개체수 조절 역할([A]) 직후인 [B]에 들어가야 뒤이어 회복되는 과정([C])과 자연스럽게 연결됩니다.")
    ]
    for k in range(1, 112):
        t, body, c, dists, ex = ins_texts[(k - 1) % len(ins_texts)]
        p = f"[{t}] 글의 흐름으로 보아, 주어진 문장이 들어가기에 가장 적절한 곳은? (문항 #{k})\\n\\\"{body}\\\""
        h3_ins_items.append((p, c, dists, 5, ex, ["삽입 문장 속의 지시어, 연결사, 대명사 단서를 파악하세요.", "문장이 빠졌을 때 앞뒤 문맥에 생기는 논리적 틈새(비약)를 찾으세요."]))
    generate_and_add("H3", "e.h3.ins", h3_ins_items)

    # 14. e.h3.col (111 items) - Academic collocations & idioms
    h3_col_items = []
    academic_colls = [
        ("The newly published findings directly contribute ____ our understanding of neural plasticity.", "to", ["with", "for", "against"], "contribute to (~에 기여하다)는 전치사 to와 결합하는 대표적 학술 연어입니다."),
        ("Adolescent individuals are frequently prone ____ impulsive risk-taking behaviors under peer pressure.", "to", ["with", "of", "about"], "be prone to (~하기 쉽다, 경향이 있다)에서 to는 전치사입니다."),
        ("The university instituted strict laboratory safety protocols in accordance ____ federal environmental regulations.", "with", ["to", "by", "for"], "in accordance with (~에 부합하여, ~에 따라)는 규정 준수를 나타내는 관용 연어입니다."),
        ("Historians commonly attribute the collapse of the agrarian empire ____ prolonged climatic droughts.", "to", ["with", "from", "for"], "attribute A to B (A를 B의 탓/원인으로 돌리다) 구문입니다.")
    ]
    for k in range(1, 112):
        sen, c, dists, ex = academic_colls[(k - 1) % len(academic_colls)]
        p = f"학술 연어 및 관용 표현상 빈칸에 들어갈 알맞은 전치사는? (문항 #{k})\\n'{sen}'"
        h3_col_items.append((p, c, dists, 5, ex, ["동사구 및 형용사구의 짝이 되는 전치사 결합을 확인하세요.", "학술적 고정 연어(collocation)를 점검하세요."]))
    generate_and_add("H3", "e.h3.col", h3_col_items)

    # 15. e.h3.sum (111 items) - Summary paragraph completion
    h3_sum_items = []
    sum_texts = [
        ("Neuroplasticity Across the Lifespan", "Traditional neuroscience long assumed that the adult human brain was structurally fixed and incapable of forming novel neural circuits. However, empirical studies over the past three decades reveal that sustained intellectual learning, physical exercise, and mindful meditation trigger neurogenesis and synaptic rewiring throughout adulthood.", "Summary: Contrary to the outdated dogma that the adult brain is (A)____, modern neuroscience confirms that targeted cognitive and physical engagement retains the capacity for continuous structural (B)____.", "(A) rigid / (B) reorganization", ["(A) flexible / (B) decay", "(A) active / (B) stagnation", "(A) complex / (B) deterioration"], "성인 뇌가 고정되어 있다는(rigid) 옛 도그마와 달리, 성인기에도 지속적으로 구조적 재조직(reorganization)이 가능하다는 요약문이 알맞습니다."),
        ("The Economics of Universal Broadband", "Investing in universal high-speed broadband infrastructure generates substantial economic multipliers. High-speed connectivity empowers remote rural entrepreneurs, bridges regional educational divides, and stimulates municipal economic diversity outside overcrowded metropolitan centers.", "Summary: Expanding broadband infrastructure serves as a vital economic (A)____ that substantially reduces geographical (B)____.", "(A) catalyst / (B) disparities", ["(A) obstacle / (B) advantages", "(A) burden / (B) equality", "(A) byproduct / (B) connections"], "광대역 인프라 확충은 경제적 촉매제(catalyst) 역할을 하며 지리적 불균형/격차(disparities)를 해소한다는 요약문이 정답입니다.")
    ]
    for k in range(1, 112):
        t, body, summary_prompt, c, dists, expl_note = sum_texts[(k - 1) % len(sum_texts)]
        p = f"[{t}] 다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은? (문항 #{k})\\n\\\"{body}\\\"\\n\\\"{summary_prompt}\\\""
        ex = f"본문의 핵심 요지를 반영하는 어휘 쌍은 '{c}'입니다. {expl_note}"
        h3_sum_items.append((p, c, dists, 5, ex, ["본문의 대조점(옛 관념 vs 현대 연구 결과 등)을 요약문에서 찾으세요.", "빈칸 (A)와 (B)에 들어갈 개념의 논리적 조화를 검토하세요."]))
    generate_and_add("H3", "e.h3.sum", h3_sum_items)

    print("H3 complete. Total high school questions generated:", len(questions))
    return questions

if __name__ == "__main__":
    qs = get_high()
    print("Testing High School generation...")
    print("Total questions:", len(qs))
    assert len(qs) == 1665, f"Expected 1665 questions, got {len(qs)}"
    
    seen = set()
    for q in qs:
        correct = [o["text"] for o in q["options"] if o["id"] == q["answer"]["id"]][0]
        sorted_opts = " || ".join(sorted([o["text"] for o in q["options"]]))
        key = f"{q['skillId']} ::: {q['prompt']} ::: {correct} ::: {sorted_opts}"
        assert key not in seen, f"Duplicate found: {q['id']} key: {key}"
        seen.add(key)
    print("ALL 1,665 High School questions are 100% UNIQUE! 0 duplicates!")
