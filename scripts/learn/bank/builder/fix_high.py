with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_high.py", "r") as f:
    text = f.read()

# Fix the unpacking in tone_passages
old_code = '''    for k in range(1, 112):
        t, body, q_str, c, dists = tone_passages[(k - 1) % len(tone_passages)]
        p = f"[{t}] 다음 글을 읽고 질문에 답하세요. (문항 #{k})\\\\n\\\\\\"{body}\\\\\\"\\\\n질문: {q_str}"
        ex = f"필자의 전반적인 태도와 선택된 어휘는 '{c}'에 해당합니다."
        h3_tone_items.append((p, c, dists, 5, ex, ["글쓴이가 사용한 형용사, 부사, 평가적 어휘의 뉘앙스를 분석하세요.", "작가의 객관성, 풍자성, 비판성 여부를 판별하세요."]))'''

new_code = '''    for k in range(1, 112):
        t, body, q_str, c, dists, expl_note = tone_passages[(k - 1) % len(tone_passages)]
        p = f"[{t}] 다음 글을 읽고 질문에 답하세요. (문항 #{k})\\\\n\\\\\\"{body}\\\\\\"\\\\n질문: {q_str}"
        ex = f"필자의 전반적인 태도와 선택된 어휘는 '{c}'에 해당합니다. {expl_note}"
        h3_tone_items.append((p, c, dists, 5, ex, ["글쓴이가 사용한 형용사, 부사, 평가적 어휘의 뉘앙스를 분석하세요.", "작가의 객관성, 풍자성, 비판성 여부를 판별하세요."]))'''

assert old_code in text, "old_code not found in build_high.py"
text = text.replace(old_code, new_code)
with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_high.py", "w") as f:
    f.write(text)
print("build_high.py fixed successfully.")
