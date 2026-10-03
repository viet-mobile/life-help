-- Manual rollback for 202609300027_learning_elementary_grades.sql. NOT run by `supabase db push`. Review and run by hand only.
--
-- Restores the original (narrow) CHECK constraints from 202609300024. It deliberately fails (the ADD CONSTRAINT validates every row) while
-- any elementary-grade row exists, so no student data is ever deleted by this script: remove or migrate those rows first.
-- Touches learning objects only; no CASCADE.
alter table public.learn_student_profiles drop constraint if exists learn_student_profiles_grade_check;
alter table public.learn_student_profiles add constraint learn_student_profiles_grade_check check (grade in ('M1', 'M2', 'M3', 'H1', 'H2', 'H3'));

alter table public.learn_courses drop constraint if exists learn_courses_grade_check;
alter table public.learn_courses add constraint learn_courses_grade_check check (grade in ('M1', 'M2', 'M3', 'H1', 'H2', 'H3'));

alter table public.learn_courses drop constraint if exists learn_courses_school_level_check;
alter table public.learn_courses add constraint learn_courses_school_level_check check (school_level in ('middle', 'high'));
