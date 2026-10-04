import { upliftE12 } from "./math-uplift-e1-e2.mjs";
import { upliftE34 } from "./math-uplift-e3-e4.mjs";
import { upliftE56 } from "./math-uplift-e5-e6.mjs";

/** Difficulty ladder for elementary math (see math-uplift-kit.mjs). Runs after the grade generators, before finish(). */
export function upliftMath(b, h) {
  upliftE12(b, h);
  upliftE34(b, h);
  upliftE56(b, h);
}
