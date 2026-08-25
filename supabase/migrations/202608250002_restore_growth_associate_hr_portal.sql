-- Non-destructive Supabase home for the legacy Airtable recruitment/HR fields.
alter table public.partners add column if not exists date_of_birth date;
alter table public.partners add column if not exists graduation_information text;
alter table public.partners add column if not exists profile_photo_url text;
alter table public.partners add column if not exists telegram_username text;
alter table public.partners add column if not exists telegram_user_id text;
alter table public.partners add column if not exists telegram_chat_id text;
alter table public.partners add column if not exists application_date timestamptz;
alter table public.partners add column if not exists recruitment_status text not null default 'ACTIVE_ASSOCIATE';
alter table public.partners add column if not exists interview_status text not null default 'NOT_SCHEDULED';
alter table public.partners add column if not exists interview_date timestamptz;
alter table public.partners add column if not exists interviewer text;
alter table public.partners add column if not exists interview_notes text;
alter table public.partners add column if not exists interview_outcome text;
alter table public.partners add column if not exists engagement_status text not null default 'ACTIVE';
alter table public.partners add column if not exists engagement_start_date date;
alter table public.partners add column if not exists engagement_end_date date;
alter table public.partners add column if not exists inactive_reason text;
alter table public.partners add column if not exists legacy_registration_id text;

update public.partners set
  application_date=coalesce(application_date,created_at),
  engagement_start_date=coalesce(engagement_start_date,created_at::date),
  recruitment_status=case when status='ACTIVE' then 'ACTIVE_ASSOCIATE' else recruitment_status end,
  engagement_status=case when status='ACTIVE' then 'ACTIVE' else 'INACTIVE' end
where application_date is null or engagement_start_date is null;

create unique index if not exists partners_telegram_user_unique_idx on public.partners(telegram_user_id) where telegram_user_id is not null;
create index if not exists partners_recruitment_status_idx on public.partners(recruitment_status,created_at desc);

create table if not exists public.associate_interviews (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  scheduled_at timestamptz,
  interviewer text,
  status text not null check(status in ('SCHEDULED','INTERVIEWED','PASSED','FAILED','CANCELLED')),
  outcome text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.associate_interviews enable row level security;
revoke all on public.associate_interviews from anon,authenticated;
create index if not exists associate_interviews_partner_date_idx on public.associate_interviews(partner_id,scheduled_at desc);

-- Existing ownership policies continue to restrict partner rows. Column grants
-- ensure an associate cannot change identity, role, hierarchy or HR decisions.
grant update(whatsapp,gender,institution,field_of_study,nysc_information,location,date_of_birth,graduation_information,profile_photo_url,telegram_username) on public.partners to authenticated;
drop policy if exists "associates update permitted profile fields" on public.partners;
create policy "associates update permitted profile fields" on public.partners for update to authenticated
using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
