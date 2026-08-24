create schema if not exists private;

create table if not exists public.referral_conversions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  referral_code_id uuid not null references public.referral_codes(id) on delete restrict,
  referred_user_id uuid not null references auth.users(id) on delete restrict,
  first_payment_id uuid not null references public.payments(id) on delete restrict,
  successful_at timestamptz not null,
  month_start date generated always as (date_trunc('month', successful_at at time zone 'Africa/Lagos')::date) stored,
  status text not null default 'VALID' check (status in ('VALID','INVALID')),
  commission_amount_ngn integer not null default 0 check (commission_amount_ngn in (0, 2000)),
  invalidated_at timestamptz,
  invalidated_by uuid references auth.users(id) on delete set null,
  invalidation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (referred_user_id)
);

create table if not exists public.associate_monthly_performance (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  month_start date not null,
  target integer not null default 30 check (target = 30),
  successful_referrals integer not null default 0 check (successful_referrals >= 0),
  commissionable_referrals integer not null default 0 check (commissionable_referrals >= 0),
  commission_amount_ngn integer not null default 0 check (commission_amount_ngn >= 0),
  status text not null default 'CALCULATED' check (status in ('CALCULATED','PENDING','APPROVED','PAID')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, month_start)
);

alter table public.payout_requests add column if not exists performance_id uuid references public.associate_monthly_performance(id) on delete restrict;
alter table public.payout_requests add column if not exists payment_method text;
alter table public.payout_requests add column if not exists admin_notes text;

create index if not exists referral_conversions_partner_month_idx on public.referral_conversions(partner_id, month_start, status);
create index if not exists referral_conversions_payment_idx on public.referral_conversions(first_payment_id);
create index if not exists associate_monthly_performance_month_idx on public.associate_monthly_performance(month_start, successful_referrals desc);
create unique index if not exists payout_requests_performance_idx on public.payout_requests(performance_id);

alter table public.referral_conversions enable row level security;
alter table public.associate_monthly_performance enable row level security;

drop policy if exists "associates read own conversions" on public.referral_conversions;
create policy "associates read own conversions" on public.referral_conversions for select to authenticated using (
  exists (select 1 from public.partners p where p.id = referral_conversions.partner_id and p.user_id = (select auth.uid()))
);
drop policy if exists "associates read own monthly performance" on public.associate_monthly_performance;
create policy "associates read own monthly performance" on public.associate_monthly_performance for select to authenticated using (
  exists (select 1 from public.partners p where p.id = associate_monthly_performance.partner_id and p.user_id = (select auth.uid()))
);
drop policy if exists "associates read own payouts" on public.payout_requests;
create policy "associates read own payouts" on public.payout_requests for select to authenticated using (
  exists (select 1 from public.partners p where p.id = payout_requests.partner_id and p.user_id = (select auth.uid()))
);

grant select on public.referral_conversions, public.associate_monthly_performance, public.payout_requests to authenticated;

create or replace function private.recalculate_associate_month(p_partner_id uuid, p_month_start date)
returns void language plpgsql security definer set search_path = pg_catalog, public, private as $$
declare v_count integer;
begin
  with ranked as (
    select id, row_number() over (order by successful_at, id) as referral_number
    from public.referral_conversions
    where partner_id = p_partner_id and month_start = p_month_start and status = 'VALID'
  )
  update public.referral_conversions c
  set commission_amount_ngn = case when ranked.referral_number > 30 then 2000 else 0 end,
      updated_at = now()
  from ranked where c.id = ranked.id;

  update public.referral_conversions
  set commission_amount_ngn = 0, updated_at = now()
  where partner_id = p_partner_id and month_start = p_month_start and status = 'INVALID' and commission_amount_ngn <> 0;

  select count(*) into v_count from public.referral_conversions
  where partner_id = p_partner_id and month_start = p_month_start and status = 'VALID';

  insert into public.associate_monthly_performance(partner_id, month_start, target, successful_referrals, commissionable_referrals, commission_amount_ngn)
  values (p_partner_id, p_month_start, 30, v_count, greatest(v_count - 30, 0), greatest(v_count - 30, 0) * 2000)
  on conflict (partner_id, month_start) do update set
    successful_referrals = excluded.successful_referrals,
    commissionable_referrals = excluded.commissionable_referrals,
    commission_amount_ngn = excluded.commission_amount_ngn,
    updated_at = now();
end $$;

revoke all on function private.recalculate_associate_month(uuid,date) from public, anon, authenticated;

create or replace function private.refresh_referral_month_trigger()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, private as $$
begin
  perform private.recalculate_associate_month(coalesce(new.partner_id, old.partner_id), coalesce(new.month_start, old.month_start));
  if tg_op = 'UPDATE' and (old.partner_id, old.month_start) is distinct from (new.partner_id, new.month_start) then
    perform private.recalculate_associate_month(old.partner_id, old.month_start);
  end if;
  return coalesce(new, old);
end $$;
revoke all on function private.refresh_referral_month_trigger() from public, anon, authenticated;

drop trigger if exists refresh_referral_month_after_change on public.referral_conversions;
create trigger refresh_referral_month_after_change after insert or delete or update of status, partner_id, successful_at on public.referral_conversions
for each row execute function private.refresh_referral_month_trigger();

insert into public.referral_conversions(partner_id, referral_code_id, referred_user_id, first_payment_id, successful_at)
select first_paid.partner_id, first_paid.referral_code_id, first_paid.user_id, first_paid.payment_id, first_paid.successful_at
from (
  select distinct on (p.user_id) rc.partner_id, p.referral_code_id, p.user_id, p.id payment_id, coalesce(p.paid_at,p.created_at) successful_at
  from public.payments p
  join public.referral_codes rc on rc.id = p.referral_code_id
  join public.partners pa on pa.id = rc.partner_id
  where p.status = 'PAID' and p.user_id is not null and pa.user_id is distinct from p.user_id
  order by p.user_id, coalesce(p.paid_at,p.created_at), p.id
) first_paid
on conflict (referred_user_id) do nothing;

comment on table public.referral_conversions is 'One authoritative successful direct referral per unique paid learner.';
comment on table public.associate_monthly_performance is 'Historical calendar-month target and commission snapshots for Growth Associates.';
