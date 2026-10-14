import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COURSES, READING_LESSONS } from "./lessons.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const secEnFile = path.join(root, "lib/learn/content/secondary/english.json");
const secViFile = path.join(root, "lib/learn/content/vi/secondary-english.json");

const secEn = JSON.parse(fs.readFileSync(secEnFile, "utf8"));
const secVi = JSON.parse(fs.readFileSync(secViFile, "utf8"));

// 1. Prepare elective courses structure for canonical secondary/english.json
const newCourses = [];
const newSkills = [];
const newQuestions = [];

const viCourses = {};
const viSkills = {};
const viUnits = {};
const viLessons = {};
const viQuestions = {};

for (const [cid, cinfo] of Object.entries(COURSES)) {
  const lessons = READING_LESSONS.filter((l) => l.courseId === cid);
  const courseLessons = [];

  for (const les of lessons) {
    newSkills.push({
      id: les.skillId,
      title: les.skillTitle.ko,
    });
    viSkills[les.skillId] = les.skillTitle.vi;

    const qIds = [];
    for (const q of les.questions) {
      newQuestions.push({
        id: q.id,
        site: "english",
        skillId: les.skillId,
        type: q.type,
        difficulty: 3,
        prompt: `글을 읽고 물음에 답하세요. "${les.passage}" 질문: ${q.prompt.ko}`,
        options: q.options,
        answer: { kind: "choice", id: q.answer },
        hints: q.hints.map((h) => h.ko),
        explanation: q.explanation.ko,
        role: "core",
        family: `${les.id}-mc`,
        expectedSeconds: 60,
        tags: ["reading", "advanced", "elective"],
        status: "PUBLISHED",
      });
      qIds.push(q.id);

      viQuestions[q.id] = {
        prompt: `Đọc đoạn văn rồi trả lời câu hỏi. "${les.passage}" Câu hỏi: ${q.prompt.vi}`,
        hints: q.hints.map((h) => h.vi || h.en),
        explanation: q.explanation.vi || q.explanation.en,
      };
    }

    courseLessons.push({
      id: les.id,
      title: les.title.ko,
      concept: les.concept.ko,
      example: les.passage,
      skillIds: [les.skillId],
      questionIds: qIds,
    });

    viLessons[les.id] = {
      title: les.title.vi,
      concept: les.concept.vi,
      example: les.passage,
    };
  }

  const unitId = `${cid}-u1`;
  newCourses.push({
    id: cid,
    title: cinfo.title.ko,
    grade: "H3",
    elective: true,
    world: {
      name: cinfo.world.name.ko,
      emoji: cinfo.world.emoji,
      tagline: cinfo.world.tagline.ko,
    },
    units: [
      {
        id: unitId,
        title: cinfo.unitTitle.ko,
        lessons: courseLessons,
      },
    ],
  });

  viCourses[cid] = {
    title: cinfo.title.vi,
    world: {
      name: cinfo.world.name.vi,
      tagline: cinfo.world.tagline.vi,
    },
  };
  viUnits[unitId] = cinfo.unitTitle.vi;
}

// Filter out old reading elective additions if re-running
secEn.catalog.courses = secEn.catalog.courses.filter((c) => !c.id.startsWith("en-el-"));
secEn.catalog.skills = secEn.catalog.skills.filter((s) => !s.id.startsWith("en.el."));
secEn.questions = secEn.questions.filter((q) => !q.id.startsWith("en-el-"));

secEn.catalog.courses.push(...newCourses);
secEn.catalog.skills.push(...newSkills);
secEn.questions.push(...newQuestions);

fs.writeFileSync(secEnFile, JSON.stringify(secEn, null, 1) + "\n");
console.log(`Updated secondary/english.json with ${newCourses.length} elective courses and ${newQuestions.length} questions.`);

// Update vi/secondary-english.json
secVi.courses = secVi.courses || {};
secVi.skills = secVi.skills || {};
secVi.units = secVi.units || {};
secVi.lessons = secVi.lessons || {};
secVi.questions = secVi.questions || {};

for (const k of Object.keys(secVi.courses)) if (k.startsWith("en-el-")) delete secVi.courses[k];
for (const k of Object.keys(secVi.skills)) if (k.startsWith("en.el.")) delete secVi.skills[k];
for (const k of Object.keys(secVi.units)) if (k.startsWith("en-el-")) delete secVi.units[k];
for (const k of Object.keys(secVi.lessons)) if (k.startsWith("en-el-")) delete secVi.lessons[k];
for (const k of Object.keys(secVi.questions)) if (k.startsWith("en-el-")) delete secVi.questions[k];

Object.assign(secVi.courses, viCourses);
Object.assign(secVi.skills, viSkills);
Object.assign(secVi.units, viUnits);
Object.assign(secVi.lessons, viLessons);
Object.assign(secVi.questions, viQuestions);

fs.writeFileSync(secViFile, JSON.stringify(secVi, null, 1) + "\n");
console.log("Updated vi/secondary-english.json.");

// 2. Update all other 45 overlays in content/learn-overlays/<locale>/english.json
const registry = fs.readFileSync(path.join(root, "messages/registry.ts"), "utf8");
const LOCALES = [...registry.match(/export const locales = \[([\s\S]*?)\] as const/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

for (const loc of LOCALES) {
  if (loc === "ko" || loc === "vi") continue;
  const ovFile = path.join(root, `content/learn-overlays/${loc}/english.json`);
  if (!fs.existsSync(ovFile)) continue;
  const ov = JSON.parse(fs.readFileSync(ovFile, "utf8"));
  ov.courses = ov.courses || {};
  ov.skills = ov.skills || {};
  ov.units = ov.units || {};
  ov.lessons = ov.lessons || {};
  ov.questions = ov.questions || {};

  for (const [cid, cinfo] of Object.entries(COURSES)) {
    const lessons = READING_LESSONS.filter((l) => l.courseId === cid);
    const unitId = `${cid}-u1`;
    ov.courses[cid] = {
      title: cinfo.title.en,
      world: {
        name: loc === "en" ? cinfo.world.name.en : `${cinfo.world.name.en} (${cinfo.world.name.en})`,
        tagline: cinfo.world.tagline.en,
      },
    };
    ov.units[unitId] = cinfo.unitTitle.en;

    for (const les of lessons) {
      ov.skills[les.skillId] = les.skillTitle.en;
      ov.lessons[les.id] = {
        title: les.title.en,
        concept: les.concept.en,
        example: les.passage,
      };

      for (const q of les.questions) {
        ov.questions[q.id] = {
          prompt: `Read the passage and answer the question. "${les.passage}" Question: ${q.prompt.en}`,
          hints: q.hints.map((h) => h.en),
          explanation: q.explanation.en,
        };
      }
    }
  }

  fs.writeFileSync(ovFile, JSON.stringify(ov, null, 1) + "\n");
}
console.log(`Updated advanced reading overlays across ${LOCALES.length - 2} locales.`);
