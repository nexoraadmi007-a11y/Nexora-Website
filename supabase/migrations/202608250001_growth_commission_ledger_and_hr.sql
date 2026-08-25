alter table public.partners add column if not exists sponsor_partner_id uuid references public.partners(id) on delete set null;
alter table public.partners add column if not exists gender text;
alter table public.partners add column if not exists institution text;
alter table public.partners add column if not exists field_of_study text;
alter table public.partners add column if not exists nysc_information text;
alter table public.partners add column if not exists location text;

alter table public.referral_conversions drop constraint if exists referral_conversions_commission_amount_ngn_check;
alter table public.referral_conversions add constraint referral_conversions_commission_amount_ngn_check check (commission_amount_ngn in (0,1500));

alter table public.associate_monthly_performance add column if not exists l1_referrals integer not null default 0 check (l1_referrals >= 0);
alter table public.associate_monthly_performance add column if not exists l2_referrals integer not null default 0 check (l2_referrals >= 0);
alter table public.associate_monthly_performance add column if not exists l1_commission_ngn integer not null default 0 check (l1_commission_ngn >= 0);
alter table public.associate_monthly_performance add column if not exists l2_commission_ngn integer not null default 0 check (l2_commission_ngn >= 0);

alter table public.commissions add column if not exists conversion_id uuid references public.referral_conversions(id) on delete restrict;
alter table public.commissions add column if not exists source_partner_id uuid references public.partners(id) on delete restrict;
alter table public.commissions add column if not exists qualification_event text;
alter table public.commissions add column if not exists rule_version text;
alter table public.commissions add column if not exists approved_at timestamptz;
alter table public.commissions add column if not exists paid_at timestamptz;
alter table public.commissions add column if not exists payout_request_id uuid references public.payout_requests(id) on delete set null;
alter table public.commissions add column if not exists reversed_at timestamptz;
alter table public.commissions add column if not exists updated_at timestamptz not null default now();

create index if not exists partners_sponsor_idx on public.partners(sponsor_partner_id) where sponsor_partner_id is not null;
create index if not exists commissions_conversion_idx on public.commissions(conversion_id) where conversion_id is not null;
create index if not exists commissions_source_partner_idx on public.commissions(source_partner_id) where source_partner_id is not null;
create index if not exists commissions_payout_idx on public.commissions(payout_request_id) where payout_request_id is not null;
create index if not exists commissions_partner_created_idx on public.commissions(partner_id,created_at desc);

insert into public.admin_settings(key,value,category)
values ('growth_referral_rules','{"monthly_target":30,"l1_amount_ngn":1500,"l2_amount_ngn":500,"effective_from":"2026-08-25","rule_version":"2026-08-25-L1-1500-L2-500"}'::jsonb,'growth')
on conflict (key) do update set value=excluded.value, category=excluded.category, updated_at=now();

create or replace function private.recalculate_associate_month(p_partner_id uuid, p_month_start date)
returns void language plpgsql security definer set search_path = pg_catalog, public, private as $$
declare
  v_target integer := 30;
  v_l1_rate integer := 1500;
  v_l2_rate integer := 500;
  v_rule text := '2026-08-25-L1-1500-L2-500';
  v_l1_count integer := 0;
  v_l2_count integer := 0;
  v_l1_total integer := 0;
  v_l2_total integer := 0;
begin
  select coalesce((value->>'monthly_target')::integer,30), coalesce((value->>'l1_amount_ngn')::integer,1500), coalesce((value->>'l2_amount_ngn')::integer,500), coalesce(value->>'rule_version',v_rule)
  into v_target,v_l1_rate,v_l2_rate,v_rule from public.admin_settings where key='growth_referral_rules';

  select count(*) into v_l1_count from public.referral_conversions
  where partner_id=p_partner_id and month_start=p_month_start and status='VALID';
  v_l1_total := case when v_l1_count >= v_target then v_l1_count * v_l1_rate else 0 end;

  select count(*) into v_l2_count
  from public.referral_conversions c join public.partners source on source.id=c.partner_id
  where source.sponsor_partner_id=p_partner_id and c.month_start=p_month_start and c.status='VALID';
  v_l2_total := v_l2_count * v_l2_rate;

  update public.referral_conversions set commission_amount_ngn=case when status='VALID' and v_l1_count>=v_target then v_l1_rate else 0 end,updated_at=now()
  where partner_id=p_partner_id and month_start=p_month_start;

  insert into public.commissions(partner_id,payment_id,conversion_id,source_partner_id,level,rate,amount_ngn,status,qualification_event,rule_version,created_at,updated_at)
  select p_partner_id,c.first_payment_id,c.id,c.partner_id,'L1',0,
    case when c.status='VALID' and v_l1_count>=v_target then v_l1_rate else 0 end,
    case when c.status='VALID' and v_l1_count>=v_target then 'PENDING' else 'REVERSED' end,
    'VERIFIED_PAID_ENROLLMENT',v_rule,c.successful_at,now()
  from public.referral_conversions c where c.partner_id=p_partner_id and c.month_start=p_month_start
  on conflict(partner_id,payment_id,level) do update set
    conversion_id=excluded.conversion_id,source_partner_id=excluded.source_partner_id,amount_ngn=case when commissions.status='PAID' then commissions.amount_ngn else excluded.amount_ngn end,
    status=case when commissions.status='PAID' then 'PAID' when excluded.amount_ngn>0 then 'PENDING' else 'REVERSED' end,
    qualification_event=excluded.qualification_event,rule_version=excluded.rule_version,reversed_at=case when excluded.amount_ngn=0 and commissions.status<>'PAID' then now() else null end,updated_at=now();

  insert into public.commissions(partner_id,payment_id,conversion_id,source_partner_id,level,rate,amount_ngn,status,qualification_event,rule_version,created_at,updated_at)
  select p_partner_id,c.first_payment_id,c.id,c.partner_id,'L2',0,
    case when c.status='VALID' then v_l2_rate else 0 end,
    case when c.status='VALID' then 'PENDING' else 'REVERSED' end,
    'VERIFIED_PAID_ENROLLMENT',v_rule,c.successful_at,now()
  from public.referral_conversions c join public.partners source on source.id=c.partner_id
  where source.sponsor_partner_id=p_partner_id and c.month_start=p_month_start
  on conflict(partner_id,payment_id,level) do update set
    conversion_id=excluded.conversion_id,source_partner_id=excluded.source_partner_id,amount_ngn=case when commissions.status='PAID' then commissions.amount_ngn else excluded.amount_ngn end,
    status=case when commissions.status='PAID' then 'PAID' when excluded.amount_ngn>0 then 'PENDING' else 'REVERSED' end,
    qualification_event=excluded.qualification_event,rule_version=excluded.rule_version,reversed_at=case when excluded.amount_ngn=0 and commissions.status<>'PAID' then now() else null end,updated_at=now();

  insert into public.associate_monthly_performance(partner_id,month_start,target,successful_referrals,commissionable_referrals,commission_amount_ngn,l1_referrals,l2_referrals,l1_commission_ngn,l2_commission_ngn)
  values(p_partner_id,p_month_start,v_target,v_l1_count,case when v_l1_count>=v_target then v_l1_count else 0 end,v_l1_total+v_l2_total,v_l1_count,v_l2_count,v_l1_total,v_l2_total)
  on conflict(partner_id,month_start) do update set target=excluded.target,successful_referrals=excluded.successful_referrals,commissionable_referrals=excluded.commissionable_referrals,commission_amount_ngn=excluded.commission_amount_ngn,l1_referrals=excluded.l1_referrals,l2_referrals=excluded.l2_referrals,l1_commission_ngn=excluded.l1_commission_ngn,l2_commission_ngn=excluded.l2_commission_ngn,updated_at=now();
end $$;
revoke all on function private.recalculate_associate_month(uuid,date) from public,anon,authenticated;

create or replace function private.refresh_referral_month_trigger()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_sponsor uuid;
begin
  perform private.recalculate_associate_month(coalesce(new.partner_id,old.partner_id),coalesce(new.month_start,old.month_start));
  select sponsor_partner_id into v_sponsor from public.partners where id=coalesce(new.partner_id,old.partner_id);
  if v_sponsor is not null then perform private.recalculate_associate_month(v_sponsor,coalesce(new.month_start,old.month_start)); end if;
  if tg_op='UPDATE' and (old.partner_id,old.month_start) is distinct from (new.partner_id,new.month_start) then
    perform private.recalculate_associate_month(old.partner_id,old.month_start);
  end if;
  return coalesce(new,old);
end $$;
revoke all on function private.refresh_referral_month_trigger() from public,anon,authenticated;

create or replace function private.refresh_sponsor_change_trigger()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_month date;
begin
  for v_month in select distinct month_start from public.referral_conversions where partner_id=new.id loop
    perform private.recalculate_associate_month(new.id,v_month);
    if old.sponsor_partner_id is not null then perform private.recalculate_associate_month(old.sponsor_partner_id,v_month); end if;
    if new.sponsor_partner_id is not null then perform private.recalculate_associate_month(new.sponsor_partner_id,v_month); end if;
  end loop;
  return new;
end $$;
revoke all on function private.refresh_sponsor_change_trigger() from public,anon,authenticated;
drop trigger if exists refresh_sponsor_change_after_update on public.partners;
create trigger refresh_sponsor_change_after_update after update of sponsor_partner_id on public.partners for each row when(old.sponsor_partner_id is distinct from new.sponsor_partner_id) execute function private.refresh_sponsor_change_trigger();
