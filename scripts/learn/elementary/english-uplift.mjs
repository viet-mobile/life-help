import { upliftEnglishE12 } from "./english-uplift-e1-e2.mjs";
import { upliftEnglishE34 } from "./english-uplift-e3-e4.mjs";
import { upliftEnglishE56 } from "./english-uplift-e5-e6.mjs";

/** Difficulty ladder for elementary English (see english-uplift-kit.mjs). Runs after the grade generators, before finish(). */
export function upliftEnglish(b) {
  upliftEnglishE12(b);
  upliftEnglishE34(b);
  upliftEnglishE56(b);
}
