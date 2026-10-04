import { MATH_A } from "./math-a.mjs";
import { MATH_B } from "./math-b.mjs";

/** 16 original math generators; each one declares the levels it can serve, the engine keeps only items whose rubric level matches. */
export const MATH_TEMPLATES = [...MATH_A, ...MATH_B];
