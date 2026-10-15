with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_high.py", "r") as f:
    text = f.read()

old_code = '''    for k in range(1, 112):
        t, body, summary_prompt, c, dists = sum_texts[(k - 1) % len(sum_texts)]
        p = f"[{t}] 다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은? (문항 #{k})\\\\n\\\\\\"{body}\\\\\\"\\\\n\\\\\\"{summary_prompt}\\\\\\""
        ex = f"본문의 핵심 요지를 반영하는 어휘 쌍은 '{c}'입니다."
        h3_sum_items.append((p, c, dists, 5, ex, ["본문의 대조점(옛 관념 vs 현대 연구 결과 등)을 요약문에서 찾으세요.", "빈칸 (A)와 (B)에 들어갈 개념의 논리적 조화를 검토하세요."]))'''

new_code = '''    for k in range(1, 112):
        t, body, summary_prompt, c, dists, expl_note = sum_texts[(k - 1) % len(sum_texts)]
        p = f"[{t}] 다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은? (문항 #{k})\\\\n\\\\\\"{body}\\\\\\"\\\\n\\\\\\"{summary_prompt}\\\\\\""
        ex = f"본문의 핵심 요지를 반영하는 어휘 쌍은 '{c}'입니다. {expl_note}"
        h3_sum_items.append((p, c, dists, 5, ex, ["본문의 대조점(옛 관념 vs 현대 연구 결과 등)을 요약문에서 찾으세요.", "빈칸 (A)와 (B)에 들어갈 개념의 논리적 조화를 검토하세요."]))'''

assert old_code in text, "old_code not found in build_high.py"
text = text.replace(old_code, new_code)
with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_high.py", "w") as f:
    f.write(text)
print("build_high.py fixed successfully.")
