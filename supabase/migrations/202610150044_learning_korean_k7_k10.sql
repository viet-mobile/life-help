-- 202610150044: study.korean levels K7..K10 for signed-in accounts.
-- Widens exactly the three places that were limited to K1..K6 by 202610070028; nothing else changes:
--   public.learn_progress_meta.level CHECK        K1..K6 -> K1..K10  (site stays 'korean' only; the column stays nullable)
--   public.learn_courses.grade CHECK              + 'K7'..'K10'
--   public.learn_set_course_level(uuid,text,text) accepts K1..K10
-- Additive and idempotent: no rows are read, rewritten or deleted; existing K1..K6 data and every policy stay valid.
-- The function keeps its owner, SECURITY DEFINER, empty search_path and service_role-only execute (progress tables stay RPC-written only).

alter table public.learn_progress_meta drop constraint if exists learn_progress_meta_level_check;
alter table public.learn_progress_meta add constraint learn_progress_meta_level_check
  check (level is null or (site = 'korean' and level in ('K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10')));

alter table public.learn_courses drop constraint if exists learn_courses_grade_check;
alter table public.learn_courses add constraint learn_courses_grade_check
  check (grade in ('E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'M1', 'M2', 'M3', 'H1', 'H2', 'H3',
                   'K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10'));

create or replace function public.learn_set_course_level(p_user uuid, p_site text, p_level text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_site <> 'korean' then raise exception 'invalid site'; end if;
  if p_level not in ('K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10') then raise exception 'invalid level'; end if;
  insert into public.learn_progress_meta(user_id, site, level) values (p_user, p_site, p_level)
  on conflict (user_id, site) do update set level = excluded.level, updated_at = now();
end $$;
revoke all on function public.learn_set_course_level(uuid, text, text) from public, anon, authenticated;
grant execute on function public.learn_set_course_level(uuid, text, text) to service_role;

-- Post-condition: one check per widened column, and it allows K10.
do $$
declare
  r record;
  n integer;
begin
  for r in select * from (values ('learn_progress_meta', 'level'), ('learn_courses', 'grade')) as t(tbl, col) loop
    select count(*) into n from pg_constraint c
     where c.conrelid = ('public.' || r.tbl)::regclass and c.contype = 'c' and pg_get_constraintdef(c.oid) ~ ('\m' || r.col || '\M');
    if n <> 1 then raise exception 'learning 044: expected exactly one check constraint on %.%, found %', r.tbl, r.col, n; end if;
    if not exists (select 1 from pg_constraint c where c.conrelid = ('public.' || r.tbl)::regclass and c.contype = 'c'
                    and pg_get_constraintdef(c.oid) ~ ('\m' || r.col || '\M') and pg_get_constraintdef(c.oid) like '%''K10''%') then
      raise exception 'learning 044: %.% does not allow K10', r.tbl, r.col;
    end if;
  end loop;
  if has_function_privilege('anon', 'public.learn_set_course_level(uuid,text,text)', 'execute')
     or has_function_privilege('authenticated', 'public.learn_set_course_level(uuid,text,text)', 'execute') then
    raise exception 'learning 044: learn_set_course_level must stay service_role-only';
  end if;
end $$;
