import { createBuilder } from "../elementary/lib.mjs";
import { safeBuilder } from "./guard.mjs";
import { m2 } from "./math-m2.mjs";
import { m3 } from "./math-m3.mjs";
import { h1 } from "./math-h1.mjs";
import { h2 } from "./math-h2.mjs";
import { h3 } from "./math-h3.mjs";

/** Secondary (M2..H3) math: canonical Korean bundle + Vietnamese overlay, generated deterministically. M1 stays the existing demo course. */
export function buildSecondaryMath() {
  const b = safeBuilder(createBuilder("math", { country: "KR", curriculum: "kr-2022-middle-math" }));
  for (const grade of [m2, m3, h1, h2, h3]) grade(b);
  return b.finish();
}
