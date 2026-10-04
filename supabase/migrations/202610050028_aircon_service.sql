-- Air conditioner service (aircon): installation, repair and cleaning.
--
-- The core catalogue is closed by CHECK constraints (the exact services accepted by requests, helper offers and the sub-service catalogue). This
-- migration extends all three to 11 services and adds the three sub-services. It sets NO price: helpers define their own prices through the existing
-- helper_service_prices model (pricing modes below only say which modes a helper may choose for each sub-service).
--
-- NOT applied anywhere by this change. Production keeps its learning-only migration chain (023-027); the marketplace chain is applied only where the
-- marketplace is enabled, in order, after review.

begin;

do $$
declare r record;
begin
  for r in
    select c.conname, c.conrelid::regclass as tbl
    from pg_constraint c
    where c.contype = 'c'
      and c.conrelid in ('public.service_requests'::regclass, 'public.helper_services'::regclass, 'public.service_subitems'::regclass)
      and pg_get_constraintdef(c.oid) like '%mobile-help%'
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end $$;

alter table public.service_requests add constraint service_requests_service_slug_check check (service_slug in (
  'clog-clearing', 'leak-plumbing', 'boiler', 'cleaning', 'housing',
  'bank-help', 'insurance-help', 'job-help', 'hospital-help', 'mobile-help', 'aircon'
));

alter table public.helper_services add constraint helper_services_service_slug_check check (service_slug in (
  'clog-clearing', 'leak-plumbing', 'boiler', 'cleaning', 'housing',
  'bank-help', 'insurance-help', 'job-help', 'hospital-help', 'mobile-help', 'aircon'
));

alter table public.service_subitems add constraint service_subitems_service_code_check check (service_code in (
  'clog-clearing', 'leak-plumbing', 'boiler', 'cleaning', 'housing',
  'bank-help', 'insurance-help', 'job-help', 'hospital-help', 'mobile-help', 'aircon'
));

insert into public.service_subitems (service_code, subitem_code, sort_order, allowed_pricing_modes, default_pricing_mode) values
  ('aircon', 'aircon-install',  10, '{FIXED,DIAGNOSTIC_PLUS_QUOTE}', 'DIAGNOSTIC_PLUS_QUOTE'),
  ('aircon', 'aircon-repair',   20, '{DIAGNOSTIC_PLUS_QUOTE,FIXED}', 'DIAGNOSTIC_PLUS_QUOTE'),
  ('aircon', 'aircon-cleaning', 30, '{PER_UNIT,FIXED}', 'PER_UNIT')
on conflict (service_code, subitem_code) do nothing;

commit;
