import { createBuilder } from "./lib.mjs";
import { e1, e2, e3 } from "./english-e1-e3.mjs";
import { e4, e5, e6 } from "./english-e4-e6.mjs";

/** Elementary (E1..E6) English: canonical Korean-instruction bundle + Vietnamese overlay, generated deterministically. */
export function buildEnglish() {
  const b = createBuilder("english", { country: "KR", curriculum: "life-help-elementary-english-v1" });
  for (const grade of [e1, e2, e3, e4, e5, e6]) grade(b);
  return b.finish();
}
