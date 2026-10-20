// Korean learning text deliberately remains Korean. For the seven expanded locales,
// require an explicit presentation entry even for those protected strings: the
// existing English-presentation fallback must not mask a missing native course.
export function completeKoreanPresentation(bundles, questions) {
  const fields = [];
  const add = (section, id, field, value) => { if (typeof value === "string" && value.trim()) fields.push([section, id, field]); };
  for (const bundle of bundles) {
    for (const skill of bundle.catalog.skills) add("skills", skill.id, "", skill.title);
    for (const course of bundle.catalog.courses) {
      add("courses", course.id, "title", course.title);
      add("courses", course.id, "world.name", course.world?.name);
      add("courses", course.id, "world.tagline", course.world?.tagline);
      for (const unit of course.units) {
        add("units", unit.id, "", unit.title);
        for (const lesson of unit.lessons) for (const field of ["title","concept","example"]) add("lessons", lesson.id, field, lesson[field]);
      }
    }
  }
  for (const question of questions.values()) {
    for (const field of ["prompt","explanation"]) add("questions",question.id,field,question[field]);
    question.hints.forEach((text,index)=>add("questions",question.id,`hints.${index}`,text));
    for (const option of question.options??[]) add("questions",question.id,`options.${option.id}`,option.text);
  }
  return fields;
}

