create table if not exists public.partner_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  email text,
  profile_name text,
  bank_name text not null,
  bank_code text not null,
  account_number_last_four text not null,
  account_name text not null,
  verification_status text not null default 'MANUAL_REVIEW',
  name_match_score numeric(5,2),
  verified_at timestamptz,
  provider text not null default 'PAYSTACK',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partner_bank_accounts enable row level security;

drop policy if exists "partners read own bank accounts" on public.partner_bank_accounts;
create policy "partners read own bank accounts" on public.partner_bank_accounts for select to authenticated using (
  profile_id = (select auth.uid())
  or exists (
    select 1 from public.partners p
    where p.id = partner_bank_accounts.partner_id
      and p.user_id = (select auth.uid())
  )
);

grant select on public.partner_bank_accounts to authenticated;

create index if not exists partner_bank_accounts_partner_idx
on public.partner_bank_accounts (partner_id);

create index if not exists partner_bank_accounts_profile_idx
on public.partner_bank_accounts (profile_id);
