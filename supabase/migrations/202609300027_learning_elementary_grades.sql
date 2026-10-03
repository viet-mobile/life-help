-- 202609300027: elementary grades (E1..E6) for the learning platform.
--
-- ADDITIVE, LEARNING OBJECTS ONLY, applied AFTER 202609300026. 202609300024 is immutable (already applied and probe-verified on staging), so
-- this migration does not edit it: it replaces exactly three CHECK constraints that 024 created, widening each to a strict SUPERSET of the
-- old value set, so every existing row stays valid and nothing is rewritten:
--
--   public.learn_courses.school_level           ('middle','high')                    -> + 'elementary'
--   public.learn_courses.grade                  ('M1'..'M3','H1'..'H3')              -> + 'E1'..'E6'
--   public.learn_student_profiles.grade         ('M1'..'M3','H1'..'H3')              -> + 'E1'..'E6'
--
-- No marketplace / payment / provider / auth object is touched. No data is read or written. Locale (ko / vi) needs no schema: it is a
-- browser preference. Manual rollback: supabase/rollbacks/202609300027_learning_elementary_grades.down.sql (refuses while E-grade rows exist).

alter table public.learn_courses drop constraint if exists learn_courses_school_level_check;
alter table public.learn_courses add constraint learn_courses_school_level_check
  check (school_level in ('elementary', 'middle', 'high'));

alter table public.learn_courses drop constraint if exists learn_courses_grade_check;
alter table public.learn_courses add constraint learn_courses_grade_check
  check (grade in ('E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'M1', 'M2', 'M3', 'H1', 'H2', 'H3'));

alter table public.learn_student_profiles drop constraint if exists learn_student_profiles_grade_check;
alter table public.learn_student_profiles add constraint learn_student_profiles_grade_check
  check (grade in ('E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'M1', 'M2', 'M3', 'H1', 'H2', 'H3'));

-- Post-condition (aborts the whole migration if it does not hold): each column has exactly ONE check mentioning it and that check allows
-- E1 / 'elementary'. This catches a constraint that carried a different generated name (a stale narrow check would silently survive).
do $$
declare
  r record;
  n integer;
begin
  for r in
    select * from (values
      ('learn_courses', 'school_level', 'elementary'),
      ('learn_courses', 'grade', 'E1'),
      ('learn_student_profiles', 'grade', 'E1')
    ) as t(tbl, col, must_allow)
  loop
    select count(*) into n
      from pg_constraint c
     where c.conrelid = ('public.' || r.tbl)::regclass
       and c.contype = 'c'
       and pg_get_constraintdef(c.oid) ~ ('\m' || r.col || '\M');
    if n <> 1 then
      raise exception 'learning 027: expected exactly one check constraint on %.%, found %', r.tbl, r.col, n;
    end if;
    if not exists (
      select 1 from pg_constraint c
       where c.conrelid = ('public.' || r.tbl)::regclass
         and c.contype = 'c'
         and pg_get_constraintdef(c.oid) ~ ('\m' || r.col || '\M')
         and pg_get_constraintdef(c.oid) like ('%' || r.must_allow || '%')
    ) then
      raise exception 'learning 027: check on %.% does not allow %', r.tbl, r.col, r.must_allow;
    end if;
  end loop;
end
$$;
