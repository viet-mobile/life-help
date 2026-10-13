// English topic lessons added after mapping the 2022 revised national curriculum standards (docs/learning/curriculum-mappings/).
// Korean (canonical) and English presentation texts; passages, words and answer options are English and are never translated.
// Item layout: { t: template, v: vars, ans: correct option text, opts: option texts, challenge?, variant? }; the rotation of the options is derived from the question id.
export const TEMPLATES = {
  capToLow: { ko: ["대문자 {up}의 소문자는 무엇일까요?", ["대문자와 소문자의 짝을 떠올려 보세요.", "b, d, p, q처럼 비슷하게 생긴 글자를 조심해요."], "대문자 {up}의 소문자는 {ans}예요."], en: ["Which is the lowercase letter of the capital letter {up}?", ["Think of the capital and lowercase letters as pairs.", "Be careful with letters that look alike, such as b, d, p and q."], "The lowercase letter of {up} is {ans}."] },
  lowToCap: { ko: ["소문자 {low}의 대문자는 무엇일까요?", ["대문자와 소문자의 짝을 떠올려 보세요.", "소문자의 모양을 크게 쓴다고 생각해 보세요."], "소문자 {low}의 대문자는 {ans}예요."], en: ["Which is the capital letter of the lowercase letter {low}?", ["Think of the capital and lowercase letters as pairs.", "Imagine writing the lowercase letter big and tall."], "The capital letter of {low} is {ans}."] },
  pairPick: { ko: ["대문자와 소문자의 짝이 맞는 것을 고르세요.", ["각 짝에서 앞은 대문자, 뒤는 소문자예요.", "소문자가 대문자와 같은 글자인지 하나씩 확인해요."], "{ans}는 대문자와 소문자가 같은 글자의 짝이에요."], en: ["Choose the pair in which the capital and lowercase letters match.", ["In each pair, the first letter is a capital and the second is lowercase.", "Check one by one whether the lowercase letter is the same letter as the capital."], "{ans} is a matching pair of a capital and a lowercase letter."] },
  sameStart: { ko: ["'{word}'와 같은 소리로 시작하는 낱말은 무엇일까요?", ["'{word}'의 첫소리를 소리 내어 말해 보세요.", "같은 소리로 시작하는 낱말을 찾아요. 첫 글자가 서로 다를 수도 있어요."], "'{word}'와 '{ans}'는 모두 {sound} 소리로 시작해요."], en: ["Which word begins with the same sound as “{word}”?", ["Say the first sound of “{word}” out loud.", "Look for a word that starts with the same sound. The first letters may be different."], "“{word}” and “{ans}” both begin with the sound {sound}."] },
  storyFirst: { ko: ["다음 글을 읽고, 가장 먼저 일어난 일을 고르세요.\n\n\"{text}\"", ["First, Then, Next, Finally처럼 순서를 나타내는 말을 찾아요.", "First가 있는 문장에서 일어난 일이 가장 먼저예요."], "글에서 First 다음에 나오는 '{ans}'가 가장 먼저 일어난 일이에요."], en: ["Read the passage and choose what happened first.\n\n\"{text}\"", ["Look for words that show order, such as First, Then, Next and Finally.", "What happens in the sentence with First comes first."], "“{ans}” comes after First in the passage, so it happened first."] },
  storyLast: { ko: ["다음 글을 읽고, 가장 마지막에 일어난 일을 고르세요.\n\n\"{text}\"", ["First, Then, Next, Finally처럼 순서를 나타내는 말을 찾아요.", "Finally가 있는 문장에서 일어난 일이 가장 마지막이에요."], "글에서 Finally 다음에 나오는 '{ans}'가 가장 마지막에 일어난 일이에요."], en: ["Read the passage and choose what happened last.\n\n\"{text}\"", ["Look for words that show order, such as First, Then, Next and Finally.", "What happens in the sentence with Finally comes last."], "“{ans}” comes after Finally in the passage, so it happened last."] },
  storyAfter: { ko: ["다음 글을 읽고, '{event}' 바로 다음에 일어난 일을 고르세요.\n\n\"{text}\"", ["글에서 '{event}'가 나오는 문장을 먼저 찾아요.", "그 문장 바로 다음 문장에서 일어난 일을 찾아요."], "'{event}' 바로 다음에는 '{ans}'가 일어나요."], en: ["Read the passage and choose what happened right after '{event}'.\n\n\"{text}\"", ["First find the sentence in the passage with “{event}”.", "Then look at what happens in the very next sentence."], "Right after “{event}”, the passage says “{ans}”."] },
  punct: { ko: ["대문자와 문장 부호를 바르게 쓴 문장을 고르세요.", ["문장의 첫 글자와 사람 이름, 그리고 I는 대문자로 써요.", "문장의 끝에는 종류에 맞는 부호(. ? !)를 써요."], "바르게 쓴 문장은 '{ans}'예요."], en: ["Choose the sentence with correct capital letters and punctuation.", ["Capitalise the first letter of a sentence, people's names, and I.", "End the sentence with the mark that fits it (. ? !)."], "The correct sentence is “{ans}”."] },
  sumPick: { ko: ["다음 글을 가장 잘 요약한 문장을 고르세요.\n\n\"{text}\"", ["글 전체에서 되풀이되는 중심 내용을 찾아요.", "세부 내용 하나만 말하거나 글에 없는 내용을 담은 문장은 알맞지 않아요."], "글 전체의 중심 내용을 담은 '{ans}'가 가장 알맞은 요약이에요."], en: ["Choose the sentence that best summarises the passage.\n\n\"{text}\"", ["Find the main idea that the whole passage keeps coming back to.", "A sentence about only one detail, or about something not in the passage, is not a good summary."], "“{ans}” covers the main idea of the whole passage, so it is the best summary."] },
};

const T1 = "First, Mina wakes up at seven. Then she brushes her teeth. Next, she eats breakfast. Finally, she goes to school.";
const E1 = ["wakes up at seven", "brushes her teeth", "eats breakfast", "goes to school"];
const T2 = "First, Jun takes out the flour and eggs. Then he mixes them in a bowl. Next, he bakes the cake in the oven. Finally, he puts cream on the cake.";
const E2 = ["takes out the flour and eggs", "mixes them in a bowl", "bakes the cake in the oven", "puts cream on the cake"];
const T3 = "Sam went to the park after lunch. First, he played soccer with his friends. After that, he rode his bike. Finally, he drank some water and went home.";
const E3 = ["played soccer with his friends", "rode his bike", "drank some water", "went to the park"];
const P1 = "Many people throw away bottles and cans every day. When we recycle them, factories can make new products without using as many natural resources. Recycling also reduces the amount of trash in landfills.";
const P2 = "Teenagers need about nine hours of sleep each night. Without enough sleep, students find it hard to focus in class and often feel tired. Going to bed at the same time every day can help.";
const P3 = "Honeybees visit flowers to collect nectar. While they move from flower to flower, pollen sticks to their bodies and falls onto other flowers. This helps plants grow fruits and seeds.";
const P4 = "The new city library opened last month. It has a quiet reading room, a children's corner, and free computers. Many families visit it on weekends.";
const P5 = "Last Saturday, our class cleaned the beach near our school. We picked up plastic bags, bottles, and old nets. After three hours, the beach looked clean again, and we felt proud.";
const S1 = ["Recycling saves resources and reduces trash.", "People should buy fewer bottles and cans.", "Factories make new products every day.", "Bottles are made of glass and metal."];
const S2 = ["Teenagers need enough sleep to feel and study well.", "Students should study until midnight.", "Teenagers like to go to bed late.", "Classes start too early at school."];
const S3 = ["Honeybees help plants grow by carrying pollen.", "Honeybees make sweet honey every day.", "Flowers have many different colors.", "Plants need sunlight and water."];
const S4 = ["The new library offers useful spaces for many people.", "The library is closed on weekends.", "Children are not allowed to use computers.", "The city built a new park."];
const S5 = ["Our class cleaned the beach and felt proud.", "Plastic bags are cheap.", "The class went swimming at the beach.", "Old nets are useful for fishing."];
const c = { challenge: true }, vr = { variant: true };
const it = (t, v, ans, opts, o = {}) => ({ t, v, ans, opts, ...o });

export const LESSONS = [
  { grade: "E3", topic: "abc", n: 1, items: [
    it("capToLow", { up: "B" }, "b", ["b", "d", "p", "q"]),
    it("capToLow", { up: "G" }, "g", ["g", "q", "y", "j"]),
    it("lowToCap", { low: "e" }, "E", ["E", "F", "B", "L"]),
    it("lowToCap", { low: "h" }, "H", ["H", "N", "M", "K"]),
    it("pairPick", {}, "Gg", ["Gg", "Bd", "Pq", "Dp"], c),
    it("capToLow", { up: "P" }, "p", ["p", "q", "b", "d"], vr),
    it("lowToCap", { low: "k" }, "K", ["K", "H", "X", "R"], vr),
  ] },
  { grade: "E3", topic: "snd", n: 1, items: [
    it("sameStart", { word: "cat", sound: "/k/" }, "cup", ["cup", "hat", "bus", "pen"]),
    it("sameStart", { word: "dog", sound: "/d/" }, "desk", ["desk", "gift", "tree", "pig"]),
    it("sameStart", { word: "sun", sound: "/s/" }, "sit", ["sit", "man", "top", "fox"]),
    it("sameStart", { word: "fish", sound: "/f/" }, "fan", ["fan", "sun", "pig", "bed"]),
    it("sameStart", { word: "phone", sound: "/f/" }, "fish", ["fish", "pen", "pig", "bag"], c),
    it("sameStart", { word: "knee", sound: "/n/" }, "nose", ["nose", "key", "kite", "bat"], vr),
    it("sameStart", { word: "bed", sound: "/b/" }, "ball", ["ball", "duck", "pen", "fish"], vr),
  ] },
  { grade: "E6", topic: "seq", n: 1, items: [
    it("storyFirst", { text: T1 }, E1[0], E1),
    it("storyLast", { text: T1 }, E1[3], E1),
    it("storyAfter", { text: T2, event: E2[1] }, E2[2], E2),
    it("storyFirst", { text: T2 }, E2[0], E2),
    it("storyAfter", { text: T3, event: E3[0] }, E3[1], E3, c),
    it("storyLast", { text: T2 }, E2[3], E2, vr),
    it("storyAfter", { text: T1, event: E1[1] }, E1[2], E1, vr),
  ] },
  { grade: "E6", topic: "pun", n: 1, items: [
    it("punct", {}, "My name is Tom.", ["My name is Tom.", "my name is Tom.", "My name is tom.", "My name is Tom"]),
    it("punct", {}, "Where do you live?", ["where do you live?", "Where do you live.", "Where do you live?", "Where do you live"]),
    it("punct", {}, "I like apples, oranges, and bananas.", ["I like apples, oranges, and bananas.", "i like apples, oranges, and bananas.", "I like apples oranges and bananas", "I like apples, oranges, and bananas?"]),
    it("punct", {}, "What a beautiful day!", ["What a beautiful day.", "what a beautiful day!", "What a beautiful day!", "What a beautiful day?"]),
    it("punct", {}, "Can Anna and I play soccer today?", ["can Anna and i play soccer today?", "Can anna and I play soccer today?", "Can Anna and I play soccer today.", "Can Anna and I play soccer today?"], c),
    it("punct", {}, "She is my sister.", ["She is my sister.", "she is my sister.", "She is my Sister", "She is my sister?"], vr),
    it("punct", {}, "How old are you?", ["How old are you.", "how old are you?", "How old are you?", "How Old are you"], vr),
  ] },
  { grade: "M2", topic: "sum", n: 1, items: [
    it("sumPick", { text: P1 }, S1[0], S1),
    it("sumPick", { text: P2 }, S2[0], S2),
    it("sumPick", { text: P3 }, S3[0], S3),
    it("sumPick", { text: P4 }, S4[0], S4),
    it("sumPick", { text: P5 }, S5[0], S5, c),
    it("sumPick", { text: P1 }, S1[0], S1, vr),
    it("sumPick", { text: P3 }, S3[0], S3, vr),
  ] },
];

// lesson texts keyed "<grade><topic><n>"; the example is an English sentence that stays identical in every language
export const LESSON_TEXT = {
  E3abc1: { ko: { title: "알파벳 대문자와 소문자", concept: "알파벳에는 **대문자**와 **소문자**가 있어요. 모양이 다른 짝이 많으니 하나씩 짝을 지어 기억해요. b, d, p, q처럼 비슷한 글자는 특히 조심해요.", example: "A–a, B–b, D–d, G–g" }, en: { title: "Capital and lowercase letters", concept: "The alphabet has **capital letters** and **lowercase letters**. Many pairs look different, so learn them one pair at a time. Take special care with letters that look alike, such as b, d, p and q.", example: "A–a, B–b, D–d, G–g" } },
  E3snd1: { ko: { title: "소리와 철자의 관계", concept: "낱말의 첫소리와 첫 글자는 서로 관계가 있어요. 같은 소리로 시작하는 낱말을 찾으며 소리와 철자의 관계를 익혀요. ph처럼 두 글자가 f 소리를 내기도 해요.", example: "cat → cup, fish → fan" }, en: { title: "Sounds and spelling", concept: "The first sound of a word is linked to its first letter. Find words that begin with the same sound to learn how sounds and spelling are related. Sometimes two letters, such as ph, make the f sound.", example: "cat → cup, fish → fan" } },
  E6seq1: { ko: { title: "일이 일어난 순서 파악하기", concept: "**First**(먼저), **Then / Next**(그다음), **After that**(그 후에), **Finally**(마지막으로)처럼 순서를 나타내는 말을 찾으면 일이 일어난 순서를 알 수 있어요.", example: "First, I wake up. Then I eat breakfast. Finally, I go to school." }, en: { title: "Finding the order of events", concept: "Words that show order, such as **First**, **Then / Next**, **After that** and **Finally**, tell you the order in which things happened.", example: "First, I wake up. Then I eat breakfast. Finally, I go to school." } },
  E6pun1: { ko: { title: "대문자와 문장 부호", concept: "문장은 **대문자**로 시작하고 끝에는 알맞은 **문장 부호**를 써요. 보통 문장은 마침표(.), 질문은 물음표(?), 놀람이나 강한 느낌은 느낌표(!)를 써요. 사람 이름과 I는 항상 대문자예요.", example: "Is this your bag? Yes, it is." }, en: { title: "Capital letters and punctuation", concept: "A sentence starts with a **capital letter** and ends with the right **punctuation mark**: a period (.) for a statement, a question mark (?) for a question, and an exclamation mark (!) for surprise or strong feeling. People's names and the word I are always capitalised.", example: "Is this your bag? Yes, it is." } },
  M2sum1: { ko: { title: "글의 내용 요약하기", concept: "글을 요약할 때는 **중심 내용**을 찾아 한두 문장으로 줄여요. 세부 내용 하나만 말하거나, 글에 없는 내용을 더하거나, 너무 넓게 말한 문장은 좋은 요약이 아니에요.", example: "Recycling saves resources and reduces trash." }, en: { title: "Summarising a passage", concept: "To summarise, find the **main idea** and shrink it to one or two sentences. A sentence about only one detail, one that adds something not in the passage, or one that is too broad is not a good summary.", example: "Recycling saves resources and reduces trash." } },
};
