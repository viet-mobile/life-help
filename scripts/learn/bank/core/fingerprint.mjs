/**
 * Originality fingerprints. A wording hash alone cannot tell "same question, new names" from "genuinely new question", so six layers are kept:
 *
 *   structural        template + answer type + option count          (the skeleton: many items share it, that is expected)
 *   reasoningPath     template + the strongest reasoning dimensions   (which thinking is trained)
 *   skillCombination  subject + sorted dimensions >= 2                (the skill mix)
 *   parameterPattern  template + the exact numbers used               (same numbers = the same problem with a new costume)
 *   semanticPattern   template + answer + content words without names / numbers (same situation, rephrased)
 *   surface           normalised prompt + options                     (copy / paste)
 *
 * compareFingerprints: EXACT (surface equal) > NEAR (parameter or semantic pattern equal) > SAME_SKELETON > DISTINCT.
 * Public exam metadata is for calibration only; no exam text is ever turned into a template.
 */
import { NAMES } from "../util.mjs";
import { reasoningTags } from "./reasoning.mjs";
import { REASONING_DIMENSIONS } from "./taxonomy.mjs";

/** cyrb53: fast non-cryptographic 53-bit hash, enough for de-duplication (never for security) */
export function hash53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
const norm = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();
const numbersIn = (s) => (String(s).replace(/(?<=\d),(?=\d{3}\b)/g, "").match(/\d+(?:\.\d+)?/g) ?? []).sort();
const NAME_SET = new Set(NAMES.map((n) => n.toLowerCase()));
const words = (s) => [...new Set(String(s).toLowerCase().replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter((w) => w.length >= 3 && !NAME_SET.has(w)))].sort();

/**
 * @param {{ subject: string, template: string, type: string, prompt: string, options?: string[], answerKey: string, reasoning: Record<string, number> }} q
 * @returns {{ structural: string, reasoningPath: string, skillCombination: string, parameterPattern: string, semanticPattern: string, surface: string }}
 */
export function fingerprintOf(q) {
  const options = q.options ?? [];
  const skills = REASONING_DIMENSIONS.filter((d) => q.reasoning[d] >= 2).join(",");
  return {
    structural: hash53(`${q.template}|${q.type}|${options.length}`),
    reasoningPath: hash53(`${q.template}|${reasoningTags(q.reasoning).join(",")}`),
    skillCombination: hash53(`${q.subject}|${skills}`),
    parameterPattern: hash53(`${q.template}|${numbersIn(`${q.prompt} ${options.join(" ")}`).join(",")}`),
    semanticPattern: hash53(`${q.template}|${q.answerKey}|${words(q.prompt).join(" ")}`),
    surface: hash53(norm(`${q.prompt} ${options.join(" | ")}`)),
  };
}

/** @returns {"EXACT" | "NEAR" | "SAME_SKELETON" | "DISTINCT"} */
export function compareFingerprints(a, b) {
  if (a.surface === b.surface) return "EXACT";
  if (a.parameterPattern === b.parameterPattern || a.semanticPattern === b.semanticPattern) return "NEAR";
  if (a.structural === b.structural) return "SAME_SKELETON";
  return "DISTINCT";
}

/** Fingerprint of a bank item: `item.question` (Korean bundle question) + template + reasoning profile. */
export function fingerprintItem(subject, item, reasoning) {
  const q = item.question;
  const a = q.answer;
  const key = a.kind === "choice" ? a.id : a.kind === "numeric" ? String(a.value) : a.kind === "text" ? a.accepted[0] : JSON.stringify(a.ids);
  return fingerprintOf({ subject, template: item.template, type: q.type, prompt: q.prompt, options: (q.options ?? []).map((o) => o.text), answerKey: key, reasoning });
}
