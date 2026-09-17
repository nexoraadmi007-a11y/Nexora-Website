create table if not exists public.institute_leads (
  id uuid primary key default gen_random_uuid(),
  lead_type text not null check (lead_type in ('PROGRAM_INTEREST', 'CORPORATE_TRAINING', 'AMBASSADOR', 'COMMUNITY')),
  programme_code text check (programme_code is null or programme_code in ('AI_ACCELERATOR', 'BUSINESS_TRANSFORMATION')),
  full_name text not null,
  email text not null,
  whatsapp_number text not null,
  organization text,
  message text,
  source text not null default 'WEBSITE',
  created_at timestamptz not null default now()
);

create index if not exists institute_leads_created_at_idx on public.institute_leads (created_at desc);
create index if not exists institute_leads_email_idx on public.institute_leads (lower(email));
alter table public.institute_leads enable row level security;
revoke all on public.institute_leads from anon, authenticated;
grant select, insert, update, delete on public.institute_leads to service_role;
