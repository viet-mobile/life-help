/**
 * The geometry / data / number / elective lessons are separate, generated layers on top of the originally generated curriculum (scripts/learn/geometry); the older
 * structure / generator-sync tests describe the original curriculum, so they look at the bundles and overlays without that layer.
 * The layer itself is covered by tests/learn/geometry-semesters.test.ts.
 */
const TOPIC = "(?:geo|dat|neg|fac|crd|prp|sta|rec|lfn|econ|ai|job|cul|res)";
const GEO = new RegExp(`^(?:m-(?:[a-z]\\d|el)-${TOPIC}\\d|m\\.(?:[a-z]\\d|el)\\.${TOPIC}\\d|math-(?:[a-z]\\d|el)-${TOPIC}\\d|math-el-${TOPIC})`);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stripGeometry<T = any>(input: unknown): T {
  const x = JSON.parse(JSON.stringify(input)) as any;
  if (x.catalog) {
    x.questions = x.questions.filter((q: { id: string }) => !GEO.test(q.id));
    x.catalog.skills = x.catalog.skills.filter((s: { id: string }) => !GEO.test(s.id));
    x.catalog.courses = x.catalog.courses.filter((c: { id: string }) => !GEO.test(c.id));
    for (const c of x.catalog.courses) for (const u of c.units) u.lessons = u.lessons.filter((l: { id: string }) => !GEO.test(l.id));
  }
  for (const sec of ["skills", "lessons", "questions", "courses", "units"]) {
    if (x[sec] && !Array.isArray(x[sec])) for (const id of Object.keys(x[sec])) if (GEO.test(id)) delete x[sec][id];
  }
  return x as T;
}
