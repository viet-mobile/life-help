with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_elementary.py", "r") as f:
    text = f.read()

old_code = '''    for w, c, d in phonics:
        p = f"단어 '{w}'의 첫 알파벳 대문자로 알맞은 것은?"
        ex = f"단어 '{w}'는 대문자 '{c}'로 시작합니다."
        h = ["단어의 첫소리를 귀 기울여 들어보세요.", "단어 맨 앞의 알파벳을 확인하세요."]
        alpha_items.append((p, c, d, 1, ex, h))'''

new_code = '''    for idx_p, (w, c, d) in enumerate(phonics, start=1):
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
        alpha_items.append((p, c, d, 1, ex, h))'''

assert old_code in text
text = text.replace(old_code, new_code)
with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_elementary.py", "w") as f:
    f.write(text)

# Also update audit_english_bank.mjs check to be precise
with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/audit_english_bank.mjs", "r") as f:
    audit_text = f.read()

old_audit = '''  // Bug: Box begins with X
  if (q.id === "bk-en-e1-e-e1-alpha-024" && q.options.find(o => o.id === q.answer.id)?.text === "X") {
    console.error(`[BUG] ${q.id}: 'Box' incorrectly marked as starting with 'X'.`);
    bugCount++;
  }'''

new_audit = '''  // Bug: Box begins with X
  if (q.id === "bk-en-e1-e-e1-alpha-024" && (q.options.find(o => o.id === q.answer.id)?.text === "X" || (q.prompt.includes("Box") && q.options.find(o => o.id === q.answer.id)?.text !== "B"))) {
    console.error(`[BUG] ${q.id}: 'Box' incorrectly marked as starting with 'X'.`);
    bugCount++;
  }'''

if old_audit in audit_text:
    audit_text = audit_text.replace(old_audit, new_audit)
    with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/audit_english_bank.mjs", "w") as f:
        f.write(audit_text)

print("Patched alpha box and audit.")
