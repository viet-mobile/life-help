import { T, tex } from "./lib.mjs";

/**
 * Things children count. ko: noun + subject (ga) / object (eul) particle, counter + the particles that follow the COUNTER
 * (cntEul / cntGa), a "gone" verb phrase; vi: classifier (cls) + noun, and a "gone" phrase.
 */
const O = (emoji, ko, ga, eul, cnt, cntEul, cntGa, vi, gone) => ({ emoji, ko, ga, eul, cnt, cntEul, cntGa, vi, cls: vi.split(" ")[0], gone });
const EAT = { ko: "먹었어요", vi: "đã ăn", subj: false };
const GIVE = { ko: "친구에게 주었어요", vi: "đã cho bạn", subj: false };
export const OBJ = {
  apple: O("🍎", "사과", "가", "를", "개", "를", "가", "quả táo", EAT),
  candy: O("🍬", "사탕", "이", "을", "개", "를", "가", "viên kẹo", EAT),
  pencil: O("✏️", "연필", "이", "을", "자루", "를", "가", "cây bút chì", GIVE),
  sticker: O("⭐", "스티커", "가", "를", "장", "을", "이", "miếng dán", GIVE),
  marble: O("🔵", "구슬", "이", "을", "개", "를", "가", "viên bi", GIVE),
  book: O("📘", "책", "이", "을", "권", "을", "이", "quyển sách", { ko: "친구에게 빌려주었어요", vi: "đã cho bạn mượn", subj: false }),
  cookie: O("🍪", "쿠키", "가", "를", "개", "를", "가", "chiếc bánh quy", EAT),
  flower: O("🌸", "꽃", "이", "을", "송이", "를", "가", "bông hoa", GIVE),
  bird: O("🐦", "새", "가", "를", "마리", "를", "가", "con chim", { ko: "날아갔어요", vi: "đã bay đi", subj: true }),
  balloon: O("🎈", "풍선", "이", "을", "개", "를", "가", "quả bóng bay", { ko: "터졌어요", vi: "bị vỡ", subj: true }),
};
/** Korean copula after a counter: "5개예요" / "5장이에요" (vowel-final counter -> 예요, consonant-final -> 이에요). */
export const cop = (o) => (["개", "자루", "송이", "마리"].includes(o.cnt) ? "예요" : "이에요");
/** Korean topic particle for an object noun. */
export const topic = (o) => (o.ga === "가" ? "는" : "은");

export function makeHelpers(b) {
  const letters = ["a", "b", "c", "d", "e"];
  /** options from a list of strings / T pairs; correct = index of the right one */
  const opts = (items) => items.map((text, i) => ({ id: letters[i], text }));

  function numeric(s) {
    return b.question({ ...s, type: "numeric", answer: { value: s.value, tolerance: s.tol } });
  }
  function choice(s) {
    return b.question({ ...s, type: "multiple_choice", options: opts(s.items), answer: { choice: letters[s.correct] } });
  }
  function truefalse(s) {
    return b.question({ ...s, type: "true_false", answer: { tf: s.tf } });
  }
  return { numeric, choice, truefalse, opts, letters };
}

/** Three plain-number options around the right value (never duplicates, never negative unless allowed). */
export function numberChoices(correct, distract, position) {
  const list = [...distract.filter((x) => x !== correct)].slice(0, 3);
  list.splice(position % 4, 0, correct);
  return { items: list.map((x) => tex(String(x))), correct: list.indexOf(correct) };
}

export { T, tex };
