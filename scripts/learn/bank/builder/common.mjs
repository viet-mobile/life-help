export function createQuestion({
  grade,
  skillId,
  index, // 1-based index (1..111)
  prompt,
  correctText,
  distractors, // array of 3 strings
  difficulty = 2,
  hints,
  explanation,
  expectedSeconds = 30
}) {
  const letters = ['a', 'b', 'c', 'd'];
  const correctPos = (index - 1) % 4; // 0 -> a, 1 -> b, 2 -> c, 3 -> d
  const correctLetter = letters[correctPos];

  const options = [];
  let distIndex = 0;
  for (let i = 0; i < 4; i++) {
    if (i === correctPos) {
      options.push({ id: letters[i], text: correctText });
    } else {
      options.push({ id: letters[i], text: distractors[distIndex++] });
    }
  }

  const paddedIndex = String(index).padStart(3, '0');
  const slugSkill = skillId.replace(/\./g, '-');
  const id = `bk-en-${grade.toLowerCase()}-${slugSkill}-${paddedIndex}`;

  return {
    id,
    site: "english",
    skillId,
    type: "multiple_choice",
    difficulty,
    prompt: prompt.trim(),
    options,
    answer: {
      kind: "choice",
      id: correctLetter
    },
    hints: hints.map(h => h.trim()),
    explanation: explanation.trim(),
    family: `bk-${slugSkill}`,
    role: "variant",
    expectedSeconds,
    tags: ["bank", "practice", grade.toLowerCase()],
    status: "PUBLISHED"
  };
}
