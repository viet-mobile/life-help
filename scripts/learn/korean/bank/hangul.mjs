// Hangul toolkit for the Korean practice bank: composition, particles and an independent Revised Romanization converter.
// The converter exists to CHECK authored romanizations (it shares no data with the pools); disagreements are reviewed by hand, never auto-fixed.
export const L = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
export const V = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
export const T = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
export const isSyl = (ch) => ch >= "가" && ch <= "힣";
export const dec = (ch) => { const c = ch.charCodeAt(0) - 0xac00; return { l: Math.floor(c / 588), v: Math.floor((c % 588) / 28), t: c % 28 }; };
export const com = (l, v, t = 0) => String.fromCharCode(0xac00 + (l * 21 + v) * 28 + t);
export const hasBatchim = (word) => { const chars = [...word].filter(isSyl); return chars.length > 0 && dec(chars[chars.length - 1]).t !== 0; };
export const lastJong = (word) => { const chars = [...word].filter(isSyl); return chars.length ? T[dec(chars[chars.length - 1]).t] : ""; };
/** 이/가, 은/는, 을/를, 와/과, 으로/로 (로 also after ㄹ), 이에요/예요, 이다 */
export const josa = (word, pair) => {
  const b = hasBatchim(word), rieul = lastJong(word) === "ㄹ";
  switch (pair) {
    case "이/가": return b ? "이" : "가";
    case "은/는": return b ? "은" : "는";
    case "을/를": return b ? "을" : "를";
    case "와/과": return b ? "과" : "와";
    case "으로/로": return b && !rieul ? "으로" : "로";
    case "이에요/예요": return b ? "이에요" : "예요";
    default: throw new Error(`josa ${pair}`);
  }
};
export const withJosa = (word, pair) => word + josa(word, pair);

// ---------------------------------------------------------------- Revised Romanization (pronunciation based; tensification is not reflected)
const INIT = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const VOW = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
// final consonant (single jamo after cluster simplification) -> representative sound before a consonant / at the end
const FINAL_SOUND = { "": "", "ㄱ": "k", "ㄲ": "k", "ㄴ": "n", "ㄷ": "t", "ㄹ": "l", "ㅁ": "m", "ㅂ": "p", "ㅅ": "t", "ㅆ": "t", "ㅇ": "ng", "ㅈ": "t", "ㅊ": "t", "ㅋ": "k", "ㅌ": "t", "ㅍ": "p", "ㅎ": "t" };
const CLUSTER = { "ㄳ": ["ㄱ", "ㅅ"], "ㄵ": ["ㄴ", "ㅈ"], "ㄶ": ["ㄴ", "ㅎ"], "ㄺ": ["ㄹ", "ㄱ"], "ㄻ": ["ㄹ", "ㅁ"], "ㄼ": ["ㄹ", "ㅂ"], "ㄽ": ["ㄹ", "ㅅ"], "ㄾ": ["ㄹ", "ㅌ"], "ㄿ": ["ㄹ", "ㅍ"], "ㅀ": ["ㄹ", "ㅎ"], "ㅄ": ["ㅂ", "ㅅ"] };
const JAMO_L = Object.fromEntries(L.map((j, i) => [j, i]));
// RR value of a jamo when it becomes an onset
const onsetRR = (j) => INIT[JAMO_L[j]];

/** One Korean word (no spaces) -> RR. Returns null when the word has non-Hangul characters other than hyphens. */
export function romanizeWord(word) {
  const sy = [...word];
  if (!sy.every(isSyl)) return null;
  const S = sy.map((c) => { const d = dec(c); return { l: d.l, v: d.v, t: T[d.t] }; });
  const out = [];
  for (let i = 0; i < S.length; i++) {
    const s = S[i];
    const next = S[i + 1];
    let onset = L[s.l];
    let finalJ = s.t;
    let carried = s.carried ?? null; // consonant carried over from the previous syllable (liaison)
    if (carried) onset = carried;
    // ---- decide this syllable's final sound and what moves to the next onset
    let fSound = "";
    let moveToNext = null;
    if (finalJ) {
      let main = finalJ, tail = null;
      if (CLUSTER[finalJ]) [main, tail] = CLUSTER[finalJ];
      if (next && next.l === 11) {
        // liaison: the (last) consonant moves to the next vowel syllable
        if (tail === "ㅎ") { moveToNext = main; fSound = ""; } // 싫어 -> sireo, 많아 -> mana (ㅎ is silent, the first consonant moves)
        else if (tail) { moveToNext = tail; fSound = FINAL_SOUND[main]; }
        else if (main === "ㅇ") fSound = "ng";
        else if (main === "ㅎ") { fSound = ""; }
        else { moveToNext = main; fSound = ""; }
        if (moveToNext === "ㅅ" && finalJ === "ㅆ") moveToNext = "ㅆ";
      } else if (next) {
        // consonant after: cluster simplification, ㅎ handling, assimilation
        const nj = L[next.l];
        const keep = (finalJ === "ㄳ" || finalJ === "ㄵ" || finalJ === "ㅄ" || finalJ === "ㄽ" || finalJ === "ㄾ" || finalJ === "ㅀ" || finalJ === "ㄶ") ? main : null;
        let base;
        if (finalJ === "ㄶ" || finalJ === "ㅀ") {
          // ㅎ after ㄴ/ㄹ: aspirates a following ㄱ ㄷ ㅈ, otherwise drops
          if (nj === "ㄱ" || nj === "ㄷ" || nj === "ㅈ") { fSound = FINAL_SOUND[main]; S[i + 1] = { ...next, l: JAMO_L[nj === "ㄱ" ? "ㅋ" : nj === "ㄷ" ? "ㅌ" : "ㅊ"] }; }
          else fSound = FINAL_SOUND[main];
        } else if (keep) base = keep;
        else if (finalJ === "ㄺ") base = (nj === "ㄱ") ? "ㄹ" : "ㄱ"; // 읽고 -> ilgo (ㄱ kept before ㄱ in conjugation), default: ㄱ
        else if (finalJ === "ㄻ") base = "ㅁ";
        else if (finalJ === "ㄼ") base = "ㄹ";
        else if (finalJ === "ㄿ") base = "ㅍ";
        else base = main;
        if (base !== undefined && !fSound) fSound = FINAL_SOUND[base];
        if (main === "ㅎ" && !CLUSTER[finalJ]) {
          // ㅎ as batchim before a consonant
          if (nj === "ㄱ") { fSound = ""; S[i + 1] = { ...next, l: JAMO_L["ㅋ"] }; }
          else if (nj === "ㄷ") { fSound = ""; S[i + 1] = { ...next, l: JAMO_L["ㅌ"] }; }
          else if (nj === "ㅈ") { fSound = ""; S[i + 1] = { ...next, l: JAMO_L["ㅊ"] }; }
          else if (nj === "ㅅ") { fSound = ""; } // 좋습니다 -> joseumnida (tensification is not transcribed)
          else fSound = "t";
        }
        // cluster + ㅎ: the second consonant aspirates (밟혔어요 -> balpyeosseoyo, 앉혔어요 -> anchyeosseoyo, 읽히다 -> ilkida)
        if (next.l === JAMO_L["ㅎ"] && CLUSTER[finalJ]) {
          const [mn, tl] = CLUSTER[finalJ];
          const asp = { "ㄱ": "ㅋ", "ㅂ": "ㅍ", "ㅈ": "ㅊ", "ㄷ": "ㅌ" }[tl];
          if (asp) { fSound = FINAL_SOUND[mn]; S[i + 1] = { ...next, l: JAMO_L[asp] }; }
        }
        // ㄷ/ㅌ + ㅎ + 이/여 -> palatalized ch (닫혀요 -> dachyeoyo)
        if (next.l === JAMO_L["ㅎ"] && (finalJ === "ㄷ" || finalJ === "ㅌ") && (next.v === 20 || next.v === 6)) { fSound = ""; S[i + 1] = { ...next, l: JAMO_L["ㅊ"] }; }
        // ㄱ/ㄷ/ㅂ + ㅎ -> aspirated onset
        else if (next.l === JAMO_L["ㅎ"]) {
          const f = fSound;
          const map = { k: "ㅋ", t: "ㅌ", p: "ㅍ" };
          if (map[f]) { fSound = ""; S[i + 1] = { ...next, l: JAMO_L[map[f]] }; }
          if (finalJ === "ㅈ") { fSound = ""; S[i + 1] = { ...next, l: JAMO_L["ㅊ"] }; }
        }
        // nasalization / lateralization
        const nl = L[S[i + 1].l];
        if ((nl === "ㄴ" || nl === "ㅁ") && ["k", "t", "p"].includes(fSound)) fSound = { k: "ng", t: "n", p: "m" }[fSound];
        if (nl === "ㄹ") {
          if (["k", "p"].includes(fSound)) { fSound = { k: "ng", p: "m" }[fSound]; S[i + 1] = { ...S[i + 1], l: JAMO_L["ㄴ"] }; }
          else if (fSound === "ng" || fSound === "m") S[i + 1] = { ...S[i + 1], l: JAMO_L["ㄴ"] };
          else if (fSound === "n") fSound = "l", S[i + 1] = { ...S[i + 1], l: JAMO_L["ㄴ"], lat: true }; // 신라 -> silla
          else if (fSound === "t") { fSound = "n"; S[i + 1] = { ...S[i + 1], l: JAMO_L["ㄴ"] }; }
        }
        if (fSound === "l" && L[S[i + 1].l] === "ㄴ") S[i + 1] = { ...S[i + 1], l: JAMO_L["ㄹ"] }; // 칼날 -> kallal
      } else {
        // word end
        let m = finalJ;
        if (CLUSTER[finalJ]) { const [a, b] = CLUSTER[finalJ]; m = finalJ === "ㄺ" || finalJ === "ㄻ" || finalJ === "ㄼ" && false ? (finalJ === "ㄺ" ? "ㄱ" : "ㅁ") : finalJ === "ㄼ" ? "ㄹ" : finalJ === "ㄿ" ? "ㅍ" : finalJ === "ㄽ" || finalJ === "ㅀ" || finalJ === "ㄾ" ? "ㄹ" : finalJ === "ㄶ" ? "ㄴ" : a; if (finalJ === "ㅄ") m = "ㅂ"; if (finalJ === "ㄳ") m = "ㄱ"; if (finalJ === "ㄵ") m = "ㄴ"; void b; }
        fSound = FINAL_SOUND[m];
      }
    }
    // ---- onset
    let on;
    const lj = L[S[i].l];
    if (carried) on = onsetRR(carried);
    else if (i > 0 && S[i].l === JAMO_L["ㄹ"] && !S[i].lat && (out.last_final === "l")) on = "l";
    else on = INIT[S[i].l];
    if (S[i].l === JAMO_L["ㄹ"] && !carried && i > 0 && out.last_final === "l") on = "l";
    if (S[i].l === JAMO_L["ㄴ"] && S[i].lat) on = "l";
    // a syllable that starts with ㄹ after a vowel: r. At the very start r. After final l: l.
    // palatalization: ㄷ/ㅌ + 이 (liaison) -> j/ch
    if (carried === "ㄷ" && s.v === 20) on = "j";
    if (carried === "ㅌ" && s.v === 20) on = "ch";
    if (carried === "ㅌ" && (s.v === 6)) on = "ch"; // 붙여 -> buchyeo
    if (carried === "ㄷ" && (s.v === 6)) on = "j";
    // first-position ㅇ is silent (empty)
    out.push({ on, v: VOW[s.v], f: fSound });
    out.last_final = fSound;
    if (moveToNext && next) S[i + 1] = { ...next, carried: moveToNext };
  }
  // voicing of ㄱ ㄷ ㅂ ㅈ is by position in RR: initial g d b j everywhere (no k/t/p/ch variation) — handled by INIT.
  // fix ㅎ silent before vowel when carried (e.g. 좋아): onset empty
  return out.map((o) => o.on + o.v + o.f).join("");
}

// Words whose standard pronunciation inserts ㄴ/ㄹ or links across a space; they cannot be derived from the spelling alone, so they are listed
// (each is a standard 표준 발음 case: 마흔여덟 [마흔녀덜], 나뭇잎 [나문닙], 서울역 [서울력], 몇 월 [며둴], 몇 명 [면명] ...).
export const RR_EXCEPTIONS = [
  ["이천이십육", "icheonisimnyuk"], ["스물일곱", "seumullilgop"], ["스물여섯", "seumullyeoseot"], ["마흔여덟", "maheunnyeodeol"], ["서른여덟", "seoreunnyeodeol"],
  ["열여덟", "yeollyeodeol"], ["열여섯", "yeollyeoseot"], ["열일곱", "yeollilgop"], ["삼십육", "samsimnyuk"], ["이십육", "isimnyuk"], ["십육", "simnyuk"],
  ["지하철역", "jihacheollyeok"], ["서울역", "seoullyeok"], ["나뭇잎", "namunnip"], 
];
/** A phrase/sentence: every run of Hangul syllables is romanized as a word (no liaison across spaces or punctuation); everything else is kept. */
export function romanize(text) {
  const marks = [];
  let t = text.replace(/몇 (월|명)([가-힣]*)/g, (_, u, rest) => { marks.push((u === "월" ? "myeod" : "myeon") + (romanizeWord(u + rest) ?? "")); return `\uE000${marks.length - 1}\uE001`; });
  for (const [ko, rr] of RR_EXCEPTIONS) {
    if (!t.includes(ko)) continue;
    t = t.split(ko).join(`\uE000${marks.length}\uE001`);
    marks.push(rr);
  }
  return t.replace(/[가-힣]+/g, (w) => romanizeWord(w) ?? w).replace(/\uE000(\d+)\uE001/g, (_, n) => marks[Number(n)]);
}
export const normRR = (s) => s.toLowerCase().replace(/[.,?!“”"']/g, "").replace(/[-]/g, "").replace(/\s+/g, " ").trim();
