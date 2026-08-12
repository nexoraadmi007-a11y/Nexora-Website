create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  whatsapp text,
  country text,
  role text not null default 'learner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  programme_code text not null unique,
  slug text not null unique,
  name text not null,
  family text not null,
  price_ngn integer not null check (price_ngn >= 0),
  duration text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.programme_tracks (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  track_code text not null,
  slug text not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (programme_id, track_code),
  unique (programme_id, slug)
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  partner_id text not null unique,
  full_name text not null,
  email text not null,
  whatsapp text not null,
  status text not null default 'ACTIVE',
  airtable_record_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  code text not null unique,
  referral_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid references public.referral_codes(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  event_type text not null,
  session_id text,
  anonymous_id text,
  user_id uuid references auth.users(id) on delete set null,
  payment_reference text,
  page_url text,
  occurred_at timestamptz not null default now()
);

create table if not exists public.enrolments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  programme_id uuid references public.programmes(id) on delete set null,
  track_id uuid references public.programme_tracks(id) on delete set null,
  status text not null default 'PENDING_PAYMENT',
  referral_code_id uuid references public.referral_codes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  enrolment_id uuid references public.enrolments(id) on delete set null,
  programme_id uuid references public.programmes(id) on delete set null,
  referral_code_id uuid references public.referral_codes(id) on delete set null,
  paystack_reference text not null unique,
  amount_ngn integer not null check (amount_ngn >= 0),
  status text not null default 'INITIALIZED',
  paid_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  level text not null default 'L1',
  rate numeric(5,2) not null,
  amount_ngn integer not null check (amount_ngn >= 0),
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  unique (partner_id, payment_id, level)
);

create table if not exists public.wallet_entries (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  commission_id uuid references public.commissions(id) on delete set null,
  entry_type text not null,
  amount_ngn integer not null,
  status text not null default 'PENDING',
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null,
  subject text not null,
  message text not null,
  status text not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.storage_objects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  object_type text not null,
  bucket text not null,
  object_path text not null,
  status text not null default 'STORED',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.programmes enable row level security;
alter table public.programme_tracks enable row level security;
alter table public.partners enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_events enable row level security;
alter table public.enrolments enable row level security;
alter table public.payments enable row level security;
alter table public.commissions enable row level security;
alter table public.wallet_entries enable row level security;
alter table public.support_tickets enable row level security;
alter table public.notifications enable row level security;
alter table public.storage_objects enable row level security;

drop policy if exists "programmes are publicly readable" on public.programmes;
drop policy if exists "programme tracks are publicly readable" on public.programme_tracks;
drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
drop policy if exists "users insert own profile" on public.profiles;
drop policy if exists "users read own enrolments" on public.enrolments;
drop policy if exists "users read own payments" on public.payments;
drop policy if exists "users read own tickets" on public.support_tickets;
drop policy if exists "users create own tickets" on public.support_tickets;
drop policy if exists "users read own notifications" on public.notifications;
drop policy if exists "users read own storage metadata" on public.storage_objects;
drop policy if exists "partners read own partner record" on public.partners;
drop policy if exists "partners read own referral codes" on public.referral_codes;
drop policy if exists "partners read own referral events" on public.referral_events;
drop policy if exists "partners read own commissions" on public.commissions;
drop policy if exists "partners read own wallet entries" on public.wallet_entries;

create policy "programmes are publicly readable" on public.programmes for select to anon, authenticated using (active = true);
create policy "programme tracks are publicly readable" on public.programme_tracks for select to anon, authenticated using (active = true);

create policy "users read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "users insert own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);

create policy "users read own enrolments" on public.enrolments for select to authenticated using ((select auth.uid()) = user_id);
create policy "users read own payments" on public.payments for select to authenticated using ((select auth.uid()) = user_id);
create policy "users read own tickets" on public.support_tickets for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create own tickets" on public.support_tickets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users read own notifications" on public.notifications for select to authenticated using ((select auth.uid()) = user_id);
create policy "users read own storage metadata" on public.storage_objects for select to authenticated using ((select auth.uid()) = user_id);

create policy "partners read own partner record" on public.partners for select to authenticated using ((select auth.uid()) = user_id);
create policy "partners read own referral codes" on public.referral_codes for select to authenticated using (
  exists (
    select 1 from public.partners p
    where p.id = referral_codes.partner_id
    and p.user_id = (select auth.uid())
  )
);
create policy "partners read own referral events" on public.referral_events for select to authenticated using (
  exists (
    select 1 from public.partners p
    where p.id = referral_events.partner_id
    and p.user_id = (select auth.uid())
  )
);
create policy "partners read own commissions" on public.commissions for select to authenticated using (
  exists (
    select 1 from public.partners p
    where p.id = commissions.partner_id
    and p.user_id = (select auth.uid())
  )
);
create policy "partners read own wallet entries" on public.wallet_entries for select to authenticated using (
  exists (
    select 1 from public.partners p
    where p.id = wallet_entries.partner_id
    and p.user_id = (select auth.uid())
  )
);

insert into public.programmes (programme_code, slug, name, family, price_ngn, duration, active)
values
  ('AI_INCOME_ACCELERATOR', 'ai-income-accelerator', 'AI Income Accelerator', 'career', 10000, '4 weeks per track', true),
  ('BUSINESS_TRANSFORMATION', 'business-transformation', 'AI Business Transformation Programme', 'business', 25000, '4 weeks', true)
on conflict (programme_code) do update set
  slug = excluded.slug,
  name = excluded.name,
  family = excluded.family,
  price_ngn = excluded.price_ngn,
  duration = excluded.duration,
  active = excluded.active,
  updated_at = now();

insert into public.programme_tracks (programme_id, track_code, slug, name, active)
select p.id, t.track_code, t.slug, t.name, true
from public.programmes p
cross join (
  values
    ('AI_CONTENT_DIGITAL_MARKETING', 'ai-content-digital-marketing', 'AI Content & Digital Marketing'),
    ('AI_UI_UX_DIGITAL_DESIGN', 'ai-ui-ux-digital-design', 'AI UI/UX & Digital Design'),
    ('AI_FINANCIAL_BUSINESS_ANALYSIS', 'ai-financial-business-analysis', 'AI Financial & Business Analysis'),
    ('AI_AUTOMATION_NO_CODE', 'ai-automation-no-code-solutions', 'AI Automation & No-Code Solutions')
) as t(track_code, slug, name)
where p.programme_code = 'AI_INCOME_ACCELERATOR'
on conflict (programme_id, track_code) do update set
  slug = excluded.slug,
  name = excluded.name,
  active = excluded.active;
