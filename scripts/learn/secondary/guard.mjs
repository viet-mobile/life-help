/**
 * LaTeX closes nested groups with "}}" (\frac{a}{\sqrt{b}}), which the content QA treats like a template placeholder ("{{name}}").
 * A space between the braces is the same math, so the secondary generators emit "} }" and "{ {". Applied to every string a generator
 * hands to the builder (prompts, hints, explanations, options, concept / example texts), never to ids or answers.
 */
const fix = (s) => s.replace(/\}\}/g, "} }").replace(/\{\{/g, "{ {");
const walk = (v) => {
  if (typeof v === "string") return fix(v);
  if (Array.isArray(v)) return v.map(walk);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
  return v;
};
/** Same API as createBuilder(), with sanitised text. */
export function safeBuilder(b) {
  const keep = ({ id, skill, role, type, family, answer, d, ...rest }) => ({ id, skill, role, type, family, answer, d, ...walk(rest) });
  return {
    ...b,
    skill: (id, title, prerequisiteId) => b.skill(id, walk(title), prerequisiteId),
    question: (spec) => b.question(keep(spec)),
    course: (spec) => b.course(walk(spec)),
  };
}
