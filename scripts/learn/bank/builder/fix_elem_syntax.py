with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_elementary.py", "r") as f:
    text = f.read()

bad_line = '''        "tags": ["bank", "practice", grade.lower(), "enrichment"] if grade.lower() in ["e1", "e2"] else ["bank", "practice", grade.lower()],'curriculumScope": "enrichment" if grade.lower() in ["e1", "e2"] else "core",'''

good_line = '''        "tags": ["bank", "practice", grade.lower(), "enrichment"] if grade.lower() in ["e1", "e2"] else ["bank", "practice", grade.lower()],
        "curriculumScope": "enrichment" if grade.lower() in ["e1", "e2"] else "core",'''

assert bad_line in text
text = text.replace(bad_line, good_line)

with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_elementary.py", "w") as f:
    f.write(text)
print("Syntax fixed in build_elementary.py")
