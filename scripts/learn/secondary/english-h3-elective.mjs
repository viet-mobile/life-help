import { T } from "../elementary/lib.mjs";
import { makeEnglish } from "../elementary/english-helpers.mjs";
import { createRequire } from "node:module";

/**
 * High-school English electives (H3 world "Elective Plaza"): everyday conversation, workplace English, media English, world cultures,
 * English-language literature, presentation and debate, advanced reading and writing. The 7 skills already hold ~1,300 AI-reviewed
 * practice questions (scripts/learn/english-bank); this course gives them a catalog home: 7 lessons with 5 core questions each.
 * The core questions are promoted copies of reviewed bank questions (listed in english-bank/electives-core.json so the bank does not serve them twice);
 * their hints and explanations were written for this course and independently reviewed (AI review, not a teacher).
 */
const require = createRequire(import.meta.url);
const DATA = require("./data/elective-core.json");
const ORDER = ["conv", "job", "media", "world", "lit", "debate", "write"];

export function enH3Elective(b) {
  const S = Object.fromEntries(ORDER.map((k) => [k, `e.h.${k}`]));
  for (const k of ORDER) b.skill(S[k], T(DATA[S[k]].title.ko, DATA[S[k]].title.vi));
  const E = makeEnglish(b, "h3e", S);
  const lessons = ORDER.map((k, i) => {
    const d = DATA[S[k]];
    const qs = d.questions.filter((q) => !q.skip);
    const built = qs.map((q, j) => E.mc({
      sk: k, n: j + 1, role: j < 4 ? "core" : "core", d: Math.min(5, 1 + Math.floor(j * 0.8) + 1), fam: `${k}-mc`, tags: ["reading", "context"],
      prompt: T(q.prompt, q.prompt), items: q.options, correct: q.correct,
      hints: [T(q.rule.ko, q.rule.vi), T(q.clue.ko, q.clue.vi)], expl: T(q.expl.ko, q.expl.vi),
    }));
    const g = d.diagnostic;
    E.mc({ sk: k, n: "d1", role: "diagnostic", d: 3, fam: `${k}-mc`, tags: ["reading", "context"], prompt: T(g.prompt, g.prompt), items: g.options, correct: g.correct, hints: [T(g.rule.ko, g.rule.vi), T(g.clue.ko, g.clue.vi)], expl: T(g.expl.ko, g.expl.vi) });
    return { id: `en-h3e-l${i + 1}`, title: T(d.lesson.title.ko, d.lesson.title.vi), concept: T(d.lesson.concept.ko, d.lesson.concept.vi), example: T(d.lesson.example.ko, d.lesson.example.vi), skills: [S[k]], core: built.slice(0, 4), challenge: built[4] };
  });
  b.course({
    id: "en-h3e-electives", grade: "H3", elective: true,
    title: T("고3 영어 선택: 회화·직무·미디어·문화·문학·토론·작문", "Tiếng Anh lớp 12 tự chọn: hội thoại, công việc, truyền thông, văn hóa, văn học, tranh luận, viết"),
    world: { name: T("선택과목 광장 (Elective Plaza)", "Quảng trường tự chọn (Elective Plaza)"), emoji: "🎭", tagline: T("실생활·직무·미디어·문화·문학 영어를 골라 익혀요.", "Chọn và luyện tiếng Anh đời sống, công việc, truyền thông, văn hóa và văn học.") },
    unit: { id: "en-h3e-unit", title: T("고등 선택과목 영어", "Tiếng Anh tự chọn cấp 3") },
    lessons,
  });
}
