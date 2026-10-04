import { createBuilder } from "./lib.mjs";
import { e1, e2, e3 } from "./english-e1-e3.mjs";
import { e4, e5, e6 } from "./english-e4-e6.mjs";
import { upliftEnglish } from "./english-uplift.mjs";

/** Elementary (E1..E6) English: canonical Korean-instruction bundle + Vietnamese overlay, generated deterministically. */
export function buildEnglish() {
  const b = createBuilder("english", { country: "KR", curriculum: "life-help-elementary-english-v1" });
  for (const grade of [e1, e2, e3, e4, e5, e6]) grade(b);
  upliftEnglish(b); // difficulty ladder: warm-up -> standard -> challenge, plus context / reasoning questions
  return b.finish();
}
