create or replace function private.validate_referral_conversion()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, private as $$
declare v_paid_at timestamptz;
begin
  select coalesce(p.paid_at, p.created_at) into v_paid_at
  from public.payments p
  join public.referral_codes rc on rc.id = new.referral_code_id and rc.partner_id = new.partner_id and rc.active
  join public.partners pa on pa.id = new.partner_id and pa.status = 'ACTIVE'
  where p.id = new.first_payment_id
    and p.status = 'PAID'
    and p.user_id = new.referred_user_id
    and p.referral_code_id = new.referral_code_id
    and pa.user_id is distinct from new.referred_user_id;

  if v_paid_at is null then
    raise exception 'Referral conversion requires a verified paid payment, matching direct attribution, and a non-self active associate';
  end if;
  new.successful_at := v_paid_at;
  return new;
end $$;

revoke all on function private.validate_referral_conversion() from public, anon, authenticated;
drop trigger if exists validate_referral_conversion_before_write on public.referral_conversions;
create trigger validate_referral_conversion_before_write
before insert or update of partner_id, referral_code_id, referred_user_id, first_payment_id
on public.referral_conversions for each row execute function private.validate_referral_conversion();
