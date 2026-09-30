-- Read side of the curriculum for the trusted Next.js server (service_role only).
-- Returns the PUBLISHED curriculum of one subject in the exact shape the app's
-- ContentBundle uses. It includes answer keys, so it is never granted to
-- anon/authenticated; browsers only ever receive the public projection.
-- Additive: one new function, no table changes.

create function public.learn_load_content(p_subject text)
returns jsonb language sql stable security definer set search_path = '' as $$
  with subj as (select id, code from public.learn_subjects where code = p_subject),
  lesson_json as (
    select l.unit_id, l.sort_order, jsonb_build_object(
      'id', l.code, 'title', l.title, 'concept', l.concept, 'example', l.example,
      'skillIds', coalesce((select jsonb_agg(s.code order by s.code) from public.learn_lesson_skills ls
                             join public.learn_skills s on s.id = ls.skill_id where ls.lesson_id = l.id), '[]'::jsonb),
      'questionIds', coalesce((select jsonb_agg(q.code order by lq.sort_order) from public.learn_lesson_questions lq
                             join public.learn_questions q on q.id = lq.question_id
                             where lq.lesson_id = l.id and not lq.is_challenge and q.status = 'PUBLISHED'), '[]'::jsonb),
      'challengeId', (select q.code from public.learn_lesson_questions lq join public.learn_questions q on q.id = lq.question_id
                      where lq.lesson_id = l.id and lq.is_challenge and q.status = 'PUBLISHED' limit 1)
    ) as j
    from public.learn_lessons l where l.status = 'PUBLISHED'
  ),
  unit_json as (
    select u.course_id, u.sort_order, jsonb_build_object(
      'id', u.code, 'title', u.title,
      'lessons', coalesce((select jsonb_agg(lj.j order by lj.sort_order) from lesson_json lj where lj.unit_id = u.id), '[]'::jsonb)
    ) as j
    from public.learn_units u where u.status = 'PUBLISHED'
  ),
  course_json as (
    select c.sort_order, c.curriculum_id, jsonb_build_object(
      'id', c.code, 'title', c.title, 'grade', c.grade,
      'world', jsonb_build_object('name', c.world_name, 'emoji', c.world_emoji, 'tagline', c.world_tagline),
      'units', coalesce((select jsonb_agg(uj.j order by uj.sort_order) from unit_json uj where uj.course_id = c.id), '[]'::jsonb)
    ) as j
    from public.learn_courses c join subj on subj.id = c.subject_id
    where c.status = 'PUBLISHED'
  )
  select jsonb_build_object(
    'catalog', jsonb_build_object(
      'site', p_subject,
      'country', (select cu.country_code from public.learn_curricula cu join public.learn_courses c on c.curriculum_id = cu.id
                  join subj on subj.id = c.subject_id where cu.status = 'PUBLISHED' and c.status = 'PUBLISHED' order by c.sort_order, cu.code limit 1),
      'curriculum', (select cu.code from public.learn_curricula cu join public.learn_courses c on c.curriculum_id = cu.id
                  join subj on subj.id = c.subject_id where cu.status = 'PUBLISHED' and c.status = 'PUBLISHED' order by c.sort_order, cu.code limit 1),
      'courses', coalesce((select jsonb_agg(cj.j order by cj.sort_order) from course_json cj), '[]'::jsonb),
      'skills', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
          'id', s.code, 'title', s.title, 'prerequisiteId', p.code)) order by s.code)
        from public.learn_skills s join subj on subj.id = s.subject_id
        left join public.learn_skills p on p.id = s.prerequisite_skill_id), '[]'::jsonb)
    ),
    'questions', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', q.code, 'site', p_subject, 'skillId', s.code, 'type', q.type, 'difficulty', q.difficulty,
        'prompt', q.prompt, 'latex', q.latex, 'role', q.role, 'family', q.family,
        'expectedSeconds', q.expected_seconds, 'audioText', q.audio_text,
        'tags', case when cardinality(q.tags) = 0 then null else to_jsonb(q.tags) end,
        'status', q.status,
        'options', (select jsonb_agg(jsonb_build_object('id', o.option_key, 'text', o.body) order by o.sort_order)
                    from public.learn_question_options o where o.question_id = q.id),
        'answer', a.answer,
        'hints', coalesce((select jsonb_agg(h.body order by h.level) from public.learn_question_hints h where h.question_id = q.id), '[]'::jsonb),
        'explanation', coalesce(e.body, '')
      )) order by q.code)
      from public.learn_questions q
      join subj on subj.id = q.subject_id
      join public.learn_skills s on s.id = q.skill_id
      join public.learn_question_answers a on a.question_id = q.id
      left join public.learn_question_explanations e on e.question_id = q.id
      where q.status = 'PUBLISHED'), '[]'::jsonb)
  )
$$;

revoke all on function public.learn_load_content(text) from public, anon, authenticated;
grant execute on function public.learn_load_content(text) to service_role;
