with open("/Users/juboklee/life-project/life-help/scripts/curriculum/bank-audit.test.mjs", "r") as f:
    text = f.read()
text = text.replace("assert.equal(eng.questions.size, 7288);", "assert.equal(eng.questions.size, 10618);")
with open("/Users/juboklee/life-project/life-help/scripts/curriculum/bank-audit.test.mjs", "w") as f:
    f.write(text)

with open("/Users/juboklee/life-project/life-help/scripts/curriculum/coverage-doc.test.mjs", "r") as f:
    text2 = f.read()
text2 = text2.replace("/\\| 영어 \\| 64 \\| 7288 \\|/", "/\\| 영어 \\| 64 \\| 10618 \\|/")
with open("/Users/juboklee/life-project/life-help/scripts/curriculum/coverage-doc.test.mjs", "w") as f:
    f.write(text2)

print("Updated bank-audit.test.mjs and coverage-doc.test.mjs with 10618 questions.")
