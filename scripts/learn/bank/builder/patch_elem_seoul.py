with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_elementary.py", "r") as f:
    text = f.read()

# Update e.e3.tense so k=2 explicitly has "in Seoul"
old_e3_tense = '''    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        mod = (k - 1) % 4
        if mod == 0:
            p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) '{name} ____ in Seoul with his family.'"
            c = "lives"
            d = ["live", "living", "is live"]
            ex = f"3인칭 단수 주어 '{name}'의 현재형 동사에는 -s를 붙여 'lives'를 쓰며, 도시명 앞에는 전치사 'in'을 씁니다."'''

new_e3_tense = '''    for k in range(1, 112):
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
                ex = f"3인칭 단수 주어 '{name}'의 현재형 동사에는 -s를 붙여 'lives'를 쓰며, 도시명 앞에는 전치사 'in'을 씁니다."'''

text = text.replace(old_e3_tense, new_e3_tense)

# Update e.e4.tense so k=2 explicitly has "in Seoul"
old_e4_tense = '''    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        kr, c, d, ex = past_verbs[(k - 1) % len(past_verbs)]'''

new_e4_tense = '''    for k in range(1, 112):
        name = names[(k - 1) % len(names)]
        if k == 2:
            p = f"문맥상 빈칸에 알맞은 과거형 동사는? (문항 #{k}) 'They ____ in Seoul for three years before moving to Busan.'"
            c = "lived"
            d = ["lives", "live", "living"]
            ex = "과거 사실을 나타내므로 과거형 동사 'lived'를 쓰며, 도시명 앞에는 전치사 'in'이 반드시 필요합니다."
            e4_tense_items.append((p, c, d, 2, ex, ["과거 시제와 도시명 앞 전치사 in의 쓰임을 확인하세요.", "동사 live의 규칙 과거형을 고르세요."]))
            continue
        kr, c, d, ex = past_verbs[(k - 1) % len(past_verbs)]'''

text = text.replace(old_e4_tense, new_e4_tense)

with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_elementary.py", "w") as f:
    f.write(text)
print("Patched build_elementary.py for Seoul preposition verification.")
