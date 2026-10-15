with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_elementary.py", "r") as f:
    text = f.read()

old_tags = '"tags": ["bank", "practice", grade.lower()],'
new_tags = '''"tags": ["bank", "practice", grade.lower(), "enrichment"] if grade.lower() in ["e1", "e2"] else ["bank", "practice", grade.lower()],'curriculumScope": "enrichment" if grade.lower() in ["e1", "e2"] else "core",'''

assert old_tags in text
text = text.replace(old_tags, new_tags)

with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_elementary.py", "w") as f:
    f.write(text)
print("Updated build_elementary.py with enrichment tags.")
