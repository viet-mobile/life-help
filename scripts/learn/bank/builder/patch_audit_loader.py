with open("scripts/learn/bank/audit_english_bank.mjs", "r") as f:
    text = f.read()

old_block = '''  const raw = JSON.parse(fs.readFileSync(targetPath, "utf8"));
  const questions = Array.isArray(raw) ? raw : (raw.questions || []);'''

new_block = '''  const raw = JSON.parse(fs.readFileSync(targetPath, "utf8"));
  let questions = [];
  if (Array.isArray(raw)) {
    questions = raw;
  } else if (raw.questions) {
    questions = raw.questions;
  } else if (raw.middleSchoolQuestions && raw.highSchoolQuestions) {
    questions = [...raw.middleSchoolQuestions, ...raw.highSchoolQuestions];
  }'''

assert old_block in text, "old_block not found"
text = text.replace(old_block, new_block)

with open("scripts/learn/bank/audit_english_bank.mjs", "w") as f:
    f.write(text)
print("Updated audit_english_bank.mjs target loader.")
