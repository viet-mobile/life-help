/**
 * The geometry lessons are a separate, generated layer on top of the originally generated curriculum (scripts/learn/geometry); the older
 * structure / generator-sync tests describe the original curriculum, so they look at the bundles and overlays without that layer.
 * The layer itself is covered by tests/learn/geometry-semesters.test.ts.
 */
const GEO = /^(m-[a-z]\d-geo\d|m\.[a-z]\d\.geo\d|math-[a-z]\d-geo\d)/;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stripGeometry<T = any>(input: unknown): T {
  const x = JSON.parse(JSON.stringify(input)) as any;
  if (x.catalog) {
    x.questions = x.questions.filter((q: { id: string }) => !GEO.test(q.id));
    x.catalog.skills = x.catalog.skills.filter((s: { id: string }) => !GEO.test(s.id));
    for (const c of x.catalog.courses) for (const u of c.units) u.lessons = u.lessons.filter((l: { id: string }) => !GEO.test(l.id));
  }
  for (const sec of ["skills", "lessons", "questions"]) {
    if (x[sec] && !Array.isArray(x[sec])) for (const id of Object.keys(x[sec])) if (GEO.test(id)) delete x[sec][id];
  }
  return x as T;
}
