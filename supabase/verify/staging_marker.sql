-- STAGING ONLY. Creates the marker table that the demo seed requires. It is deliberately NOT a migration,
-- so a production database can never contain it by accident. Safe to re-run.
create table if not exists public.learn_seed_allowed (
  environment text primary key check (environment = 'staging'),
  created_at timestamptz not null default now()
);
alter table public.learn_seed_allowed enable row level security;  -- no policies: invisible to anon/authenticated
revoke all on public.learn_seed_allowed from anon, authenticated;
insert into public.learn_seed_allowed(environment) values ('staging') on conflict do nothing;
select environment, created_at from public.learn_seed_allowed;
