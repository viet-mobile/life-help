with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_high_expanded.py", "r") as f:
    text = f.read()

text = text.replace("for k in range(1, 222):\n        t, body, c, dists, ex = ins_texts", "for k in range(1, 242):\n        t, body, c, dists, ex = ins_texts")

with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_high_expanded.py", "w") as f:
    f.write(text)
print("Fixed ins range.")
