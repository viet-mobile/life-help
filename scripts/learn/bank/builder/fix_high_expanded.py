with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_high_expanded.py", "r") as f:
    text = f.read()

old_tone = '''    for k in range(1, 212):
        t, body, q_str, c, dists = tone_texts[(k - 1) % len(tone_texts)]
        p = f"[{t}] 다음 글을 읽고 질문에 답하세요. (문항 #{k})\\\\n\\\\\\"{body}\\\\\\"\\\\n질문: {q_str}"
        ex = f"글의 전반적인 어조와 필자의 수사학적 태도는 '{c}'에 해당합니다."
        h3_tone_items.append((p, c, dists, 5, ex, ["필자가 구사한 어휘의 정서적 무게와 가치 판단을 분석하세요.", "작가의 객관성, 풍자성, 비판성 여부를 판별하세요."]))'''

new_tone = '''    for k in range(1, 212):
        t, body, q_str, c, dists, note = tone_texts[(k - 1) % len(tone_texts)]
        p = f"[{t}] 다음 글을 읽고 질문에 답하세요. (문항 #{k})\\\\n\\\\\\"{body}\\\\\\"\\\\n질문: {q_str}"
        ex = f"글의 전반적인 어조와 필자의 수사학적 태도는 '{c}'에 해당합니다. {note}"
        h3_tone_items.append((p, c, dists, 5, ex, ["필자가 구사한 어휘의 정서적 무게와 가치 판단을 분석하세요.", "작가의 객관성, 풍자성, 비판성 여부를 판별하세요."]))'''

old_sum = '''    for k in range(1, 242):
        t, b, sum_tmpl, c, dists = sum_texts[(k - 1) % len(sum_texts)]
        p = f"[{t}] 다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은? (문항 #{k})\\\\n\\\\\\"{b}\\\\\\"\\\\n\\\\\\"{sum_tmpl}\\\\\\""
        ex = f"본문의 핵심 요지를 반영하는 어휘 쌍은 '{c}'입니다."
        h3_sum_items.append((p, c, dists, 5, ex, ["본문의 대조점과 결론적 메시지를 요약문에서 찾으세요.", "빈칸 (A)와 (B)에 들어갈 개념의 논리적 정합성을 검토하세요."]))'''

new_sum = '''    for k in range(1, 242):
        t, b, sum_tmpl, c, dists, note = sum_texts[(k - 1) % len(sum_texts)]
        p = f"[{t}] 다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은? (문항 #{k})\\\\n\\\\\\"{b}\\\\\\"\\\\n\\\\\\"{sum_tmpl}\\\\\\""
        ex = f"본문의 핵심 요지를 반영하는 어휘 쌍은 '{c}'입니다. {note}"
        h3_sum_items.append((p, c, dists, 5, ex, ["본문의 대조점과 결론적 메시지를 요약문에서 찾으세요.", "빈칸 (A)와 (B)에 들어갈 개념의 논리적 정합성을 검토하세요."]))'''

assert old_tone in text, "old_tone not found"
assert old_sum in text, "old_sum not found"
text = text.replace(old_tone, new_tone).replace(old_sum, new_sum)

with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_high_expanded.py", "w") as f:
    f.write(text)
print("build_high_expanded.py fixed.")
