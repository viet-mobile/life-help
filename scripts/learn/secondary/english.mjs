import { createBuilder } from "../elementary/lib.mjs";
import { safeBuilder } from "./guard.mjs";
import { enM2 } from "./english-m2.mjs";
import { enM3 } from "./english-m3.mjs";
import { enH1 } from "./english-h1.mjs";
import { enH2 } from "./english-h2.mjs";
import { enH3 } from "./english-h3.mjs";

/** Secondary (M2..H3) English: canonical Korean bundle + Vietnamese overlay, generated deterministically. M1 stays the existing demo course. */
export function buildSecondaryEnglish() {
  const b = safeBuilder(createBuilder("english", { country: "KR", curriculum: "kr-2022-middle-english" }));
  for (const grade of [enM2, enM3, enH1, enH2, enH3]) grade(b);
  return b.finish();
}
