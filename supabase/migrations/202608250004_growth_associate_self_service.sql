alter table public.partners alter column email drop not null;
alter table public.partners add column if not exists whatsapp_normalized text;

update public.partners
set whatsapp_normalized = case
  when regexp_replace(whatsapp, '[^0-9]', '', 'g') ~ '^0[0-9]{10}$'
    then '+234' || substring(regexp_replace(whatsapp, '[^0-9]', '', 'g') from 2)
  when regexp_replace(whatsapp, '[^0-9]', '', 'g') ~ '^234[0-9]{10}$'
    then '+' || regexp_replace(whatsapp, '[^0-9]', '', 'g')
  else null
end
where whatsapp_normalized is null and nullif(trim(whatsapp), '') is not null;

create unique index if not exists partners_whatsapp_normalized_unique
on public.partners (whatsapp_normalized)
where whatsapp_normalized is not null;

create unique index if not exists partners_user_id_unique
on public.partners (user_id)
where user_id is not null;

grant select on public.referral_conversions to authenticated;
drop policy if exists "partners read own referral conversions" on public.referral_conversions;
create policy "partners read own referral conversions"
on public.referral_conversions for select to authenticated using (
  exists (
    select 1 from public.partners p
    where p.id = referral_conversions.partner_id
      and p.user_id = (select auth.uid())
  )
);
