/** Remove generated math/English layers only for original-curriculum checks.
 * Full runtime, mapping and database checks keep these layers.
 */
import { isGeneratedLayerId } from "../../scripts/learn/generated-layers.mjs";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stripGeneratedLayers<T = any>(input: unknown): T {
  const x = JSON.parse(JSON.stringify(input)) as any;
  if (x.catalog) {
    x.questions = x.questions.filter((q: { id: string }) => !isGeneratedLayerId(q.id));
    x.catalog.skills = x.catalog.skills.filter((s: { id: string }) => !isGeneratedLayerId(s.id));
    x.catalog.courses = x.catalog.courses.filter((c: { id: string }) => !isGeneratedLayerId(c.id));
    for (const c of x.catalog.courses)
      for (const u of c.units)
        u.lessons = u.lessons.filter((l: { id: string }) => !isGeneratedLayerId(l.id));
  }
  for (const sec of ["skills", "lessons", "questions", "courses", "units"]) {
    if (x[sec] && !Array.isArray(x[sec]))
      for (const id of Object.keys(x[sec])) if (isGeneratedLayerId(id)) delete x[sec][id];
  }
  return x as T;
}
