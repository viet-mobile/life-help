#!/usr/bin/env node
/**
 * Build per-locale English practice bank translation kits (`scripts/learn/english-bank/kit/<locale>.json`)
 * across all 46 non-Korean locales by combining:
 * 1. Verified English curriculum overlays (`content/learn-overlays/<locale>/english.json` & `lib/learn/content/vi/*`)
 * 2. Verified English topic kits (`scripts/learn/topics/english/kit/<locale>.json`)
 * 3. Verified Korean bank / starter kits (`scripts/learn/korean/bank/kit/<locale>.json`, `scripts/learn/korean/kit/<locale>.json`, `scripts/learn/korean/kit-extra/<locale>.json`)
 * 4. Verified UI locale strings (`lib/learn/i18n/locales/<locale>.json`)
 * 5. Core vocabulary glosses (`scripts/learn/english-bank/core-vocab-46.json`)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "scripts/learn/english-bank/kit");
fs.mkdirSync(OUT_DIR, { recursive: true });

const kitSource = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/learn/english-bank/kit-source.json"), "utf8"));
const coreVocab46 = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/learn/english-bank/core-vocab-46.json"), "utf8"));
const enBundles = [
  "lib/learn/content/elementary/english.json",
  "lib/learn/content/demo/english.json",
  "lib/learn/content/secondary/english.json",
].map((rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8")));
const bankRaw = JSON.parse(fs.readFileSync(path.join(ROOT, "lib/learn/content/bank/english-draft.json"), "utf8"));

const locales = fs
  .readdirSync(path.join(ROOT, "lib/learn/i18n/locales"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(".json", ""))
  .sort();

// Map skillId -> lessonId in canonical English bundles
const skillToLessonId = {};
for (const b of enBundles) {
  for (const c of b.catalog.courses) {
    for (const u of c.units) {
      for (const l of u.lessons) {
        for (const sid of l.skillIds ?? []) {
          if (!skillToLessonId[sid]) skillToLessonId[sid] = l.id;
        }
      }
    }
  }
}

// Find Korean word -> gloss key in korean kit (`koKit.gloss` or `koKitExtra.gloss`)
const koWordToGlossKey = {
  "우유": "milk",
  "나무": "tree",
  "바다": "sea",
  "안녕하세요": "hello",
  "고마워요": "thanks",
  "미안해요": "sorry",
  "네": "yes",
  "선생님": "teacher",
  "학생": "student",
  "의사": "doctor",
  "가족": "family",
  "친구": "friend",
  "학교": "school",
  "엄마": "mother",
  "아빠": "father",
  "할머니": "grandmother",
  "하나, 1": "one",
  "둘, 2": "two",
  "셋, 3": "three",
  "다섯, 5": "five",
  "여섯, 6": "six",
  "여덟, 8": "eight",
  "아홉, 9": "nine",
  "열, 10": "ten",
  "어제": "yesterday",
  "오늘": "today",
  "내일": "tomorrow",
  "지금": "now",
  "오른쪽, 맞는": "right",
  "왼쪽": "left",
  "사과": "apple",
  "책": "book",
  "물": "water",
  "집": "house",
  "사람": "person",
  "나라, 시골": "country",
  "하늘": "sky",
  "산": "mountain",
  "꽃": "flower",
  "강": "river",
  "나이가 몇 살": "howOld",
  "딸": "daughter",
  "아들": "son",
  "부모님": "parents",
  "우리": "we",
  "나, 내가": "I",
  "너, 당신": "you",
  "빵": "bread",
  "밥, 쌀": "rice",
  "과일": "fruit",
  "고기": "meat",
  "날씨": "weather",
  "아침": "morning",
  "밤": "night",
  "오후": "afternoon",
  "월요일": "monday",
  "화요일": "tuesday",
  "수요일": "wednesday",
  "금요일": "friday",
  "토요일": "saturday",
  "일요일": "sunday",
  "매일": "everyDay",
  "자주": "often",
  "가끔": "sometimes",
  "항상": "always",
  "생일": "birthday",
  "주말": "weekend",
  "선물": "gift",
  "메뉴, 차림표": "menu",
  "버스": "bus",
  "지하철": "subway",
  "택시": "taxi",
  "기차": "train",
  "전화기": "phone",
  "병원": "hospital",
  "약": "medicine",
  "입구": "entrance",
  "화장실": "restroom",
};

// Also map Korean word -> { qid, oid } in canonical PUBLISHED English curriculum questions
const koWordToCurrOpt = {};
const wKoSet = new Set(Object.values(kitSource.wGlosses).map((x) => x.ko));
for (const b of enBundles) {
  for (const q of b.questions) {
    if (q.status !== "PUBLISHED") continue;
    for (const o of q.options ?? []) {
      if (wKoSet.has(o.text) && !koWordToCurrOpt[o.text]) {
        koWordToCurrOpt[o.text] = { qid: q.id, oid: o.id };
      }
    }
  }
}

// Map English bank why:<qid> for the 10 reading/dialogue explanations in kitSource.whyItems
const whyTranslations = {
  en: {
    "eb-e4r03-q2-r": "Look for 'It helps us learn new words and ideas' in the passage.",
    "eb-e4r04-q2-r": "Look for 'I help set the table with spoons and chopsticks' in the passage.",
    "eb-e6r03-q2-r": "Look for 'Please bring your reusable water bottle' in the passage.",
    "eb-e6r04-q2-r": "Look for 'she checks the forecast on her phone' in the passage.",
    "eb-m1r03-q2-r": "Look for 'Write down three things you want to finish today' in the passage.",
    "eb-m2r04-q2-r": "Look for 'Instead of throwing it away, people bring broken items to a community center' in the passage.",
    "eb-m3r01-q2-r": "Look for 'the region was once covered by water' in the passage.",
    "eb-h1r02-q2-r": "Look for 'spaced practice leads to much stronger long-term memory' in the passage.",
    "eb-h2r03-q2-r": "Look for 'check the original source and date before sharing' in the passage.",
    "eb-h3r02-q2-r": "Look for 'algorithms optimize for engagement rather than accuracy' in the passage.",
  },
  vi: {
    "eb-e4r03-q2-r": "Hãy tìm câu “It helps us learn new words and ideas” trong bài đọc.",
    "eb-e4r04-q2-r": "Hãy tìm câu “I help set the table with spoons and chopsticks” trong bài đọc.",
    "eb-e6r03-q2-r": "Hãy tìm câu “Please bring your reusable water bottle” trong bài đọc.",
    "eb-e6r04-q2-r": "Hãy tìm cụm “she checks the forecast on her phone” trong bài đọc.",
    "eb-m1r03-q2-r": "Hãy tìm câu “Write down three things you want to finish today” trong bài đọc.",
    "eb-m2r04-q2-r": "Hãy tìm câu “Instead of throwing it away, people bring broken items to a community center” trong bài đọc.",
    "eb-m3r01-q2-r": "Hãy tìm cụm “the region was once covered by water” trong bài đọc.",
    "eb-h1r02-q2-r": "Hãy tìm cụm “spaced practice leads to much stronger long-term memory” trong bài đọc.",
    "eb-h2r03-q2-r": "Hãy tìm cụm “check the original source and date before sharing” trong bài đọc.",
    "eb-h3r02-q2-r": "Hãy tìm cụm “algorithms optimize for engagement rather than accuracy” trong bài đọc.",
  },
  ja: {
    "eb-e4r03-q2-r": "本文の「It helps us learn new words and ideas」を確認しましょう。",
    "eb-e4r04-q2-r": "本文の「I help set the table with spoons and chopsticks」を確認しましょう。",
    "eb-e6r03-q2-r": "本文の「Please bring your reusable water bottle」を確認しましょう。",
    "eb-e6r04-q2-r": "本文の「she checks the forecast on her phone」を確認しましょう。",
    "eb-m1r03-q2-r": "本文の「Write down three things you want to finish today」を確認しましょう。",
    "eb-m2r04-q2-r": "本文の「Instead of throwing it away, people bring broken items to a community center」を確認しましょう。",
    "eb-m3r01-q2-r": "本文の「the region was once covered by water」を確認しましょう。",
    "eb-h1r02-q2-r": "本文の「spaced practice leads to much stronger long-term memory」を確認しましょう。",
    "eb-h2r03-q2-r": "本文の「check the original source and date before sharing」を確認しましょう。",
    "eb-h3r02-q2-r": "本文の「algorithms optimize for engagement rather than accuracy」を確認しましょう。",
  },
  "zh-Hans": {
    "eb-e4r03-q2-r": "请看原文中的“It helps us learn new words and ideas”。",
    "eb-e4r04-q2-r": "请看原文中的“I help set the table with spoons and chopsticks”。",
    "eb-e6r03-q2-r": "请看原文中的“Please bring your reusable water bottle”。",
    "eb-e6r04-q2-r": "请看原文中的“she checks the forecast on her phone”。",
    "eb-m1r03-q2-r": "请看原文中的“Write down three things you want to finish today”。",
    "eb-m2r04-q2-r": "请看原文中的“Instead of throwing it away, people bring broken items to a community center”。",
    "eb-m3r01-q2-r": "请看原文中的“the region was once covered by water”。",
    "eb-h1r02-q2-r": "请看原文中的“spaced practice leads to much stronger long-term memory”。",
    "eb-h2r03-q2-r": "请看原文中的“check the original source and date before sharing”。",
    "eb-h3r02-q2-r": "请看原文中的“algorithms optimize for engagement rather than accuracy”。",
  },
  "zh-Hant": {
    "eb-e4r03-q2-r": "請看原文中的「It helps us learn new words and ideas」。",
    "eb-e4r04-q2-r": "請看原文中的「I help set the table with spoons and chopsticks」。",
    "eb-e6r03-q2-r": "請看原文中的「Please bring your reusable water bottle」。",
    "eb-e6r04-q2-r": "請看原文中的「she checks the forecast on her phone」。",
    "eb-m1r03-q2-r": "請看原文中的「Write down three things you want to finish today」。",
    "eb-m2r04-q2-r": "請看原文中的「Instead of throwing it away, people bring broken items to a community center」。",
    "eb-m3r01-q2-r": "請看原文中的「the region was once covered by water」。",
    "eb-h1r02-q2-r": "請看原文中的「spaced practice leads to much stronger long-term memory」。",
    "eb-h2r03-q2-r": "請看原文中的「check the original source and date before sharing」。",
    "eb-h3r02-q2-r": "請看原文中的「algorithms optimize for engagement rather than accuracy」。",
  },
};

function loadEnglishOverlay(locale) {
  if (locale === "vi") {
    const p1 = JSON.parse(fs.readFileSync(path.join(ROOT, "lib/learn/content/vi/english.json"), "utf8"));
    const p2 = JSON.parse(fs.readFileSync(path.join(ROOT, "lib/learn/content/vi/secondary-english.json"), "utf8"));
    return {
      courses: { ...p1.courses, ...p2.courses },
      skills: { ...p1.skills, ...p2.skills },
      lessons: { ...p1.lessons, ...p2.lessons },
      questions: { ...p1.questions, ...p2.questions },
    };
  }
  return JSON.parse(fs.readFileSync(path.join(ROOT, `content/learn-overlays/${locale}/english.json`), "utf8"));
}

function loadKoreanBankKit(locale) {
  if (locale === "en") {
    return JSON.parse(fs.readFileSync(path.join(ROOT, "lib/learn/content/bank/korean-kit.en.json"), "utf8"));
  }
  const p = path.join(ROOT, `scripts/learn/korean/bank/kit/${locale}.json`);
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  return null;
}

const HANGUL = /[가-힣ㄱ-ㆎ]/;

for (const locale of locales) {
  const ov = loadEnglishOverlay(locale);
  const topicKit = JSON.parse(fs.readFileSync(path.join(ROOT, `scripts/learn/topics/english/kit/${locale}.json`), "utf8"));
  const koKit = JSON.parse(fs.readFileSync(path.join(ROOT, `scripts/learn/korean/kit/${locale}.json`), "utf8"));
  const koKitExtra = JSON.parse(fs.readFileSync(path.join(ROOT, `scripts/learn/korean/kit-extra/${locale}.json`), "utf8"));
  const ui = JSON.parse(fs.readFileSync(path.join(ROOT, `lib/learn/i18n/locales/${locale}.json`), "utf8"));
  const koBankKit = loadKoreanBankKit(locale);

  const texts = {};

  // 1. Prompt templates from verified English curriculum overlay & UI
  const qVocab1 = ov.questions["e-vocab-1"]?.prompt ?? "";
  texts["t:w:enko:prompt"] = qVocab1.replace(/['"“”„«»「」『』]?library['"“”„«»「」『』]?/i, "“{en}”");

  const qCls2 = ov.questions["e-e1-cls-2"]?.prompt ?? "";
  let koenPrompt = qCls2.replace(/['"“”„«»「」『』]?🪑\s*\([^()]+\)['"“”„«»「」『』]?/, "“{gloss}”");
  if (!koenPrompt.includes("{gloss}")) {
    koenPrompt = qCls2.replace(/['"“”„«»「」『』][^'"“”„«»「」『』]+['"“”„«»「」『』]/, "“{gloss}”");
  }
  texts["t:w:koen:prompt"] = koenPrompt;
  texts["t:w:spell:prompt"] = koenPrompt;

  const qPerf1 = ov.questions["e-m2-perf-1"]?.prompt ?? "";
  const clozePrefix = qPerf1.split(/[:：]\s*She\b/)[0]?.trim() ?? qPerf1;
  texts["t:w:cloze:prompt"] = `${clozePrefix}:\n{stem}`;
  texts["t:s:cloze:prompt_nomin"] = `${clozePrefix}:\n{st}`;
  texts["t:s:cloze:prompt"] = `${clozePrefix}:\n{st} ({meaning})`;

  texts["t:s:pick:prompt"] = ov.questions["e-e2-up-2b"]?.prompt ?? "";
  texts["t:s:dict:prompt"] = (ui["modes.dictation.desc"] ?? "").split(/(?<=[.。!！])\s*|；|;/)[0].trim() || (ui["modes.dictation.desc"] ?? "");
  texts["t:s:listen:prompt"] = koBankKit?.templates?.listen?.prompt ?? koKit.prompt?.listen ?? ui["modes.listening.desc"] ?? "";

  const qGreet4 = ov.questions["e-e1-greet-4"]?.prompt ?? "";
  const orderBase = qGreet4.replace(/\s*(?:\([^()]+\)|（[^（）]+）)\s*$/, "").trim();
  texts["t:s:order:prompt_nomin"] = orderBase;
  texts["t:s:order:prompt"] = `${orderBase} ({meaning})`;

  // 2. Explanation templates
  const exLabel = ui["lesson.example"] ?? "Example";
  if (locale === "en") {
    texts["t:w:expl"] = "“{en}” means “{gloss}”. Example: {ex}";
    texts["t:w:cloze:expl_nomin"] = "“{en}” — Example: {ex}";
    texts["t:s:expl"] = "Answer: “{good}”. {rule}";
    texts["t:s:expl_nomin"] = "Answer: “{good}”. {rule}";
    texts["t:rdm:expl:quote"] = "The passage says '{quote}'.";
    texts["t:rdm:expl:speaker"] = "{speaker} says '{quote}'.";
    texts["t:rdm:expl:letter"] = "{word} begins with the letter {letter}.";
    texts["t:rdm:expl:sound_start"] = "{word} begins with the {sound} sound.";
    texts["t:rdm:expl:sound_end"] = "{word} ends with the {sound} sound.";
  } else {
    texts["t:w:expl"] = `“{en}” → “{gloss}”. ${exLabel}: {ex}`;
    texts["t:w:cloze:expl_nomin"] = `“{en}” — ${exLabel}: {ex}`;
    texts["t:s:expl"] = `“{good}” ({meaning}) — {rule}`;
    texts["t:s:expl_nomin"] = `“{good}” — {rule}`;
    texts["t:rdm:expl:quote"] = "“{quote}”";
    texts["t:rdm:expl:speaker"] = "{speaker}: “{quote}”";
    texts["t:rdm:expl:letter"] = "{word} → {letter}";
    texts["t:rdm:expl:sound_start"] = "{word} → {sound}";
    texts["t:rdm:expl:sound_end"] = "{word} → {sound}";
  }

  // 3. Hint 1 templates from verified overlays & topic kits
  const hPos = ov.questions["e-h3e-debate-5"]?.hints?.[0] ?? "";
  texts["t:w:h1:pos"] = hPos;

  const hCloze0 = koBankKit?.templates?.cloze?.hints?.[0] ?? ov.questions["e-m2-perf-1"]?.hints?.[0] ?? "";
  const hCloze1 = hCloze0;
  texts["t:w:cloze:h1:both"] = `${hCloze0} (“{prev} … {next}”)`;
  texts["t:w:cloze:h1:prev"] = `${hCloze0} (“{prev} …”)`;
  texts["t:w:cloze:h1:next"] = `${hCloze0} (“… {next}”)`;
  texts["t:w:cloze:h1:none"] = hCloze0;

  const hSpell = ov.questions["e-e1-abc-4"]?.hints?.[0] ?? hPos;
  texts["t:w:spell:h1:words"] = `${hSpell} ({n})`;
  texts["t:w:spell:h1:len"] = `${hSpell} ({n})`;
  texts["t:w:spell:h1:sound"] = ov.questions["e-e1-up-1a"]?.hints?.[0] ?? hSpell;

  const hOrder = ov.questions["e-e3-up-1b"]?.hints?.[0] ?? "";
  const hChoose = hOrder;
  texts["t:s:pick:h1:order"] = hOrder;
  texts["t:s:pick:h1:idx"] = hChoose;
  texts["t:s:pick:h1:len"] = hOrder;
  texts["t:s:pick:h1:diff"] = hChoose;

  texts["t:s:cloze:h1:both"] = `${hCloze1} (“{prev} … {next}”)`;
  texts["t:s:cloze:h1:prev"] = `${hCloze1} (“{prev} …”)`;
  texts["t:s:cloze:h1:next"] = `${hCloze1} (“… {next}”)`;
  texts["t:s:cloze:h1:none"] = hCloze1;

  const hListen = koBankKit?.templates?.listen?.hints?.[0] ?? koKit.hint?.listen?.[0] ?? ov.questions["e-e1-up-1a"]?.hints?.[0] ?? "";
  texts["t:s:dict:h1"] = `${hListen} ({n})`;
  texts["t:s:listen:h1"] = hListen;

  const hPunct = topicKit.q?.punct?.hints?.[1] ?? hOrder;
  texts["t:s:order:h1:q"] = `${hPunct} ({n}, ?)`;
  texts["t:s:order:h1:ex"] = `${hPunct} ({n}, !)`;
  texts["t:s:order:h1:imp"] = `${hOrder} ({n})`;
  texts["t:s:order:h1:dot"] = `${hOrder} ({n}, .)`;

  texts["t:rdm:h1:insert"] = ov.questions["e-e3-up-2b"]?.hints?.[0] ?? "";
  texts["t:rdm:h1:main"] = ov.questions["e-e3-up-5b"]?.hints?.[0] ?? "";
  texts["t:rdm:h1:refer"] = ov.questions["e-e3-up-2b"]?.hints?.[0] ?? "";
  texts["t:rdm:h1:mean"] = hCloze0;
  const hPassage0 = koBankKit?.templates?.passage?.hints?.[0] ?? ov.questions["e-e2-up-5b"]?.hints?.[0] ?? "";
  const hPassage1 = koBankKit?.templates?.passage?.hints?.[1] ?? hPassage0;
  texts["t:rdm:h1:num"] = hPassage0;
  texts["t:rdm:h1:who"] = hPassage0;
  texts["t:rdm:h1:where"] = hPassage0;
  texts["t:rdm:h1:when"] = topicKit.q?.storyFirst?.hints?.[0] ?? hPassage0;
  texts["t:rdm:h1:ask"] = ov.questions["e-e2-up-5b"]?.hints?.[0] ?? hPassage0;
  texts["t:rdm:h1:rhyme"] = topicKit.q?.sameStart?.hints?.[0]?.replace(/“\{word\}”|['"«»「」]?\{word\}['"«»「」]?/g, "")?.replace(/\s+/g, " ")?.trim() || (ov.questions["e-e1-up-1a"]?.hints?.[0] ?? "");
  texts["t:rdm:h1:begins"] = ov.questions["e-e1-up-1a"]?.hints?.[0] ?? "";
  texts["t:rdm:h1:ends"] = ov.questions["e-e1-up-1a"]?.hints?.[0] ?? "";
  texts["t:rdm:h1:syll"] = ov.questions["e-e1-up-1a"]?.hints?.[0] ?? "";
  texts["t:rdm:h1:opp"] = ov.questions["e-e6-vocab-2"]?.hints?.[0] ?? "";
  texts["t:rdm:h1:reply"] = koBankKit?.templates?.sit?.hints?.[0] ?? ov.questions["e-e2-up-5b"]?.hints?.[0] ?? "";
  texts["t:rdm:h1:m_ask"] = ov.questions["e-e2-up-5b"]?.hints?.[0] ?? "";
  texts["t:rdm:h1:kw"] = `${hPassage1} (“{w}”)`;
  texts["t:rdm:h1:quoted"] = `${hPassage1} (“{w}”)`;

  // 4. Skill-level grammar concept rules (`r:skill:<skillId>`) from verified lesson concepts
  for (const [skillId, lessonId] of Object.entries(skillToLessonId)) {
    const concept = ov.lessons[lessonId]?.concept;
    if (concept && !HANGUL.test(concept)) {
      const cleanConcept = concept.split(/\n/)[0].trim();
      texts[`r:skill:${skillId}`] = cleanConcept;
    }
  }

  // 5. Vocabulary glosses (`w:<ko>`)
  if (locale !== "en") {
    // 5a. From Korean starter kits (`koKit.gloss` + `koKitExtra.gloss`)
    for (const [koWord, glossKey] of Object.entries(koWordToGlossKey)) {
      const val = koKit.gloss?.[glossKey] ?? koKitExtra.gloss?.[glossKey];
      if (val && !HANGUL.test(val)) {
        texts[`w:${koWord}`] = val.replace(/[.。]$/, "").trim();
      }
    }

    // 5b. From verified English curriculum multiple-choice options (`ov.questions[qid].options[oid]`)
    for (const [koWord, { qid, oid }] of Object.entries(koWordToCurrOpt)) {
      const val = ov.questions[qid]?.options?.[oid];
      if (val && !HANGUL.test(val)) {
        texts[`w:${koWord}`] = val.replace(/[.。]$/, "").trim();
      }
    }
  }

  // 5c. From coreVocab46 (`scripts/learn/english-bank/core-vocab-46.json`)
  for (const [koWord, perLoc] of Object.entries(coreVocab46)) {
    if (perLoc[locale] && !HANGUL.test(perLoc[locale])) {
      texts[`w:${koWord}`] = perLoc[locale];
    }
  }

  // 5d. For `en`, provide concise English definitions for all 80+ core vocabulary items (never identical to the target English word)
  if (locale === "en") {
    const enDefs = {
      "안녕하세요": "a polite greeting used when meeting someone",
      "고마워요": "an expression of gratitude",
      "미안해요": "feeling regret or apologizing for something",
      "네": "an affirmative reply meaning it is so",
      "우유": "a white liquid produced by cows and drunk as a beverage",
      "나무": "a tall woody plant with a trunk and branches",
      "바다": "the expanse of salt water that covers most of the earth",
      "선생님": "a person who instructs students at a school",
      "학생": "a person who is studying at a school or college",
      "의사": "a medical professional who treats sick or injured people",
      "가족": "a group of parents and children living together as a unit",
      "친구": "a person whom one knows, likes, and trusts",
      "학교": "a place where children and students go to learn",
      "엄마": "a female parent (informal)",
      "아빠": "a male parent (informal)",
      "할머니": "the mother of one's father or mother",
      "할아버지": "the father of one's father or mother",
      "아기": "a very young child or infant",
      "책상": "a piece of furniture with a flat top for reading or writing",
      "의자": "a separate seat for one person, typically with a back and four legs",
      "가방": "a container used for carrying personal items or books",
      "연필": "a writing tool with a graphite core encased in wood",
      "새": "a warm-blooded animal with feathers, wings, and a beak",
      "물고기": "a cold-blooded aquatic animal with fins and gills",
      "개": "a domesticated four-legged animal kept as a pet or for work",
      "토끼": "a small mammal with long ears and a short tail that hops",
      "고양이": "a small domesticated carnivorous mammal kept as a pet",
      "점프하다": "to push oneself off the ground into the air using the legs",
      "달리다": "to move quickly on foot at a speed faster than walking",
      "먹다": "to put food into the mouth, chew, and swallow it",
      "자다": "to rest with eyes closed and mind and body inactive",
      "마시다": "to take liquid into the mouth and swallow it",
      "가다": "to move or travel from one place to another",
      "일어나다": "to stop sleeping and get out of bed",
      "행복한": "feeling or showing pleasure and contentment",
      "작은": "little in size, amount, or degree",
      "슬픈": "feeling unhappy or sorrowful",
      "빌리다": "to take and use something belonging to someone else with the intention of returning it",
      "빌려주다": "to allow someone to use something on the understanding that it will be returned",
      "도서관": "a building or room where books are kept for reading or borrowing",
      "빵집": "a shop where bread, cakes, and pastries are made or sold",
      "하나, 1": "the number 1; a single unit",
      "둘, 2": "the number 2; a pair",
      "셋, 3": "the number 3; one more than two",
      "다섯, 5": "the number 5; one more than four",
      "여섯, 6": "the number 6; one more than five",
      "여덟, 8": "the number 8; twice four",
      "아홉, 9": "the number 9; one less than ten",
      "열, 10": "the number 10; twice five",
      "어제": "on the day before today",
      "오늘": "on or during this present day",
      "내일": "on the day after today",
      "지금": "at the present time or moment",
      "오른쪽, 맞는": "on the east side when facing north; or correct and true",
      "왼쪽": "on or toward the west side when facing north",
      "사과": "a round fruit with red, yellow, or green skin",
      "책": "a written or printed work with pages bound together",
      "물": "a clear liquid that falls as rain and forms rivers and seas",
      "집": "the building or place where a person lives",
      "사람": "an individual human being",
      "나라, 시골": "a nation with its own government, or rural land outside cities",
      "하늘": "the upper atmosphere or expanse of space seen above the earth",
      "산": "a large natural elevation of the earth's surface rising high above the surrounding land",
      "꽃": "the colored part of a plant that produces seeds or fruit",
      "강": "a large natural stream of water flowing in a channel to the sea or a lake",
      "나이가 몇 살": "asking what someone's age is in years",
      "딸": "a female child in relation to her parents",
      "아들": "a male child in relation to his parents",
      "부모님": "a person's father and mother",
      "우리": "used by a speaker to refer to themselves and one or more other people",
      "나, 내가": "used by a speaker to refer to oneself as the subject",
      "너, 당신": "used to refer to the person or people being addressed",
      "빵": "food made of flour, water, and yeast mixed together and baked",
      "밥, 쌀": "grains harvested from marsh grass and cooked as a staple food",
      "과일": "the sweet and fleshy product of a tree or plant that contains seeds",
      "고기": "the flesh of an animal used as food",
      "날씨": "the state of the atmosphere with respect to heat, cloudiness, wind, or rain",
      "아침": "the early part of the day from sunrise until noon",
      "밤": "the period of darkness between sunset and sunrise",
      "오후": "the time from noon or lunchtime until evening",
      "월요일": "the day of the week between Sunday and Tuesday",
      "화요일": "the day of the week between Monday and Wednesday",
      "수요일": "the day of the week between Tuesday and Thursday",
      "금요일": "the day of the week between Thursday and Saturday",
      "토요일": "the day of the week between Friday and Sunday",
      "일요일": "the day of the week between Saturday and Monday",
      "매일": "happening or done each day",
      "자주": "frequently; many times at short intervals",
      "가끔": "occasionally, rather than all of the time",
      "항상": "at all times; on every occasion",
      "생일": "the anniversary of the day on which a person was born",
      "주말": "Saturday and Sunday, especially as a period of rest",
      "선물": "a thing given willingly to someone without payment",
      "메뉴, 차림표": "a list of dishes available in a restaurant",
      "버스": "a large motor vehicle that carries passengers along a fixed route",
      "지하철": "an underground electric railway system in a city",
      "택시": "a car licensed to transport passengers in return for payment of a fare",
      "기차": "a series of connected railway cars pulled along a track",
      "전화기": "a device used to transmit sound and speech over distances",
      "병원": "a place where sick or injured people receive medical care",
      "약": "a substance taken to treat or prevent illness",
      "입구": "an opening, such as a door or gate, that allows access to a place",
      "화장실": "a room equipped with a toilet and sink",
    };
    for (const [k, v] of Object.entries(enDefs)) {
      texts[`w:${k}`] = v;
    }
  }

  // 6. Why explanations for reading/dialogue questions where available
  if (whyTranslations[locale]) {
    for (const [qid, val] of Object.entries(whyTranslations[locale])) {
      texts[`why:${qid}`] = val;
    }
  } else {
    // For all other locales, use the quoted evidence from the passage via `t:rdm:expl:quote`
    const whyQuotes = {
      "eb-e4r03-q2-r": "It helps us learn new words and ideas.",
      "eb-e4r04-q2-r": "I help set the table with spoons and chopsticks.",
      "eb-e6r03-q2-r": "Please bring your reusable water bottle.",
      "eb-e6r04-q2-r": "she checks the forecast on her phone",
      "eb-m1r03-q2-r": "Write down three things you want to finish today.",
      "eb-m2r04-q2-r": "Instead of throwing it away, people bring broken items to a community center.",
      "eb-m3r01-q2-r": "the region was once covered by water",
      "eb-h1r02-q2-r": "spaced practice leads to much stronger long-term memory",
      "eb-h2r03-q2-r": "check the original source and date before sharing",
      "eb-h3r02-q2-r": "algorithms optimize for engagement rather than accuracy",
    };
    for (const [qid, qText] of Object.entries(whyQuotes)) {
      texts[`why:${qid}`] = `“${qText}”`;
    }
  }

  // 7. Check for any colliding w:enko options when all 4 options are translated, and disambiguate with English word in parentheses if needed
  for (const q of bankRaw.questions) {
    if (q.tags?.[3] !== "w" || q.tags?.[2] !== "enko" || !q.options) continue;
    const m = q.explanation.match(/^“([^”]+)” → “([^”]+)”/);
    if (!m) continue;
    const [, , ko] = m;
    const gloss = texts[`w:${ko}`];
    if (!gloss) continue;
    const mapped = q.options.map((o) => ({
      id: o.id,
      ko: o.text,
      t: o.text === ko ? gloss : texts[`w:${o.text}`],
    }));
    if (mapped.some((x) => !x.t)) continue;
    const seen = new Map();
    for (const x of mapped) {
      const norm = x.t.trim().toLowerCase();
      if (seen.has(norm)) {
        // Disambiguate both with their Korean->English meaning distinction
        const prev = seen.get(norm);
        const prevEn = kitSource.wGlosses[`w:${prev.ko}`]?.en;
        const currEn = kitSource.wGlosses[`w:${x.ko}`]?.en;
        if (prevEn && currEn && prevEn !== currEn) {
          texts[`wo:${q.id}:${prev.id}`] = `${prev.t} (${prev.ko === "수업, 반" ? "class" : prev.ko === "과목" ? "subject" : "1"})`;
          texts[`wo:${q.id}:${x.id}`] = `${x.t} (${x.ko === "수업, 반" ? "class" : x.ko === "과목" ? "subject" : "2"})`;
        }
      } else {
        seen.set(norm, x);
      }
    }
  }

  // Validate zero Hangul and non-empty strings
  for (const [k, v] of Object.entries(texts)) {
    if (typeof v !== "string" || !v.trim()) {
      throw new Error(`[${locale}] Empty text for key ${k}`);
    }
    if (HANGUL.test(v)) {
      throw new Error(`[${locale}] Hangul leak in key ${k}: ${v}`);
    }
  }

  fs.writeFileSync(
    path.join(OUT_DIR, `${locale}.json`),
    JSON.stringify({ locale, texts }, null, 2) + "\n",
    "utf8"
  );
}

console.log(`Built ${locales.length} English bank kits in ${OUT_DIR}`);
