import { createBuilder } from "./lib.mjs";
import { makeHelpers } from "./math-helpers.mjs";
import { e1, e2 } from "./math-e1-e2.mjs";
import { e3, e4 } from "./math-e3-e4.mjs";
import { e5, e6 } from "./math-e5-e6.mjs";
import { upliftMath } from "./math-uplift.mjs";

/** Elementary (E1..E6) math: canonical Korean bundle + Vietnamese overlay, generated deterministically. */
export function buildMath() {
  const b = createBuilder("math", { country: "KR", curriculum: "life-help-elementary-math-v1" });
  const h = makeHelpers(b);
  for (const grade of [e1, e2, e3, e4, e5, e6]) grade(b, h);
  upliftMath(b, h); // difficulty ladder: warm-up -> standard -> challenge, plus context / multi-step / reasoning questions
  return b.finish();
}
