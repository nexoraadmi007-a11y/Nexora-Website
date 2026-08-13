alter table public.programmes
add column if not exists short_description text,
add column if not exists full_description text,
add column if not exists audience text,
add column if not exists currency text not null default 'NGN',
add column if not exists programme_type text,
add column if not exists cover_image_url text,
add column if not exists status text not null default 'PUBLISHED',
add column if not exists registration_open boolean not null default true,
add column if not exists starts_at timestamptz,
add column if not exists ends_at timestamptz,
add column if not exists maximum_capacity integer,
add column if not exists community_link text,
add column if not exists archived_at timestamptz;

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  status text not null default 'ACTIVE',
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  last_login_at timestamptz,
  unique (user_id, role)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  admin_email text,
  action text not null,
  entity text not null,
  entity_id text,
  previous_value jsonb,
  new_value jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null,
  category text not null default 'general',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  campaign_name text not null,
  description text,
  discount_type text not null check (discount_type in ('PERCENTAGE', 'FIXED')),
  discount_amount integer not null check (discount_amount >= 0),
  eligible_programmes text[] not null default '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  per_user_limit integer,
  campaign_source text,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  programme_id uuid references public.programmes(id) on delete set null,
  cohort text,
  module text,
  trainer text,
  class_date date,
  start_time time,
  end_time time,
  timezone text not null default 'Africa/Lagos',
  meeting_platform text,
  meeting_url text,
  description text,
  resources jsonb,
  recording_url text,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  programme_id uuid references public.programmes(id) on delete set null,
  cohort text,
  deadline timestamptz,
  brief text,
  files jsonb,
  submission_type text,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  learner_id uuid references auth.users(id) on delete set null,
  submission_url text,
  status text not null default 'SUBMITTED',
  reviewer_id uuid references auth.users(id) on delete set null,
  score numeric(5,2),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organisation text,
  opportunity_type text,
  description text,
  location text,
  remote boolean not null default false,
  required_programme_id uuid references public.programmes(id) on delete set null,
  required_skills text[] not null default '{}',
  deadline timestamptz,
  application_method text,
  number_of_slots integer,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunity_assignments (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  learner_id uuid references auth.users(id) on delete cascade,
  status text not null default 'INVITED',
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (opportunity_id, learner_id)
);

create table if not exists public.commission_rule_versions (
  id uuid primary key default gen_random_uuid(),
  version integer not null,
  effective_from date not null,
  l1_percent numeric(5,2) not null default 15,
  l2_percent numeric(5,2) not null default 10,
  l3_percent numeric(5,2) not null default 5,
  l2_monthly_cap integer not null default 10,
  l3_monthly_cap integer not null default 10,
  payout_ceiling_percent numeric(5,2) not null default 35,
  milestone_rules jsonb not null default '[{"sales":10,"bonus":3000},{"sales":20,"bonus":7000},{"sales":50,"bonus":15000}]',
  changed_by uuid references auth.users(id) on delete set null,
  previous_values jsonb,
  created_at timestamptz not null default now(),
  unique (version)
);

create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  requested_amount_ngn integer not null default 0,
  approved_amount_ngn integer not null default 0,
  status text not null default 'PENDING',
  reference text not null unique,
  reason text,
  acted_by uuid references auth.users(id) on delete set null,
  acted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_roles enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.admin_settings enable row level security;
alter table public.promo_codes enable row level security;
alter table public.classes enable row level security;
alter table public.projects enable row level security;
alter table public.project_submissions enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_assignments enable row level security;
alter table public.commission_rule_versions enable row level security;
alter table public.payout_requests enable row level security;

grant select on public.admin_roles to authenticated;

insert into public.admin_settings (key, value, category)
values
  ('institution', '{"name":"Nexora Institute","supportEmail":"admin@nexoragroup.ink","supportPhone":"0701002613","timezone":"Africa/Lagos","currency":"NGN","publicDomain":"https://www.nexoragroup.ink"}', 'general'),
  ('canonical_programme_source', '{"source":"SUPABASE","airtableSync":"LEGACY_MIRROR","lastSync":null}', 'system'),
  ('feature_flags', '{"partnerNetwork":true,"l2Commission":true,"l3Commission":true,"opportunities":true,"talentProfiles":true,"growthCopilot":true,"promoCodes":true}', 'features')
on conflict (key) do nothing;

insert into public.commission_rule_versions (version, effective_from)
values (1, current_date)
on conflict (version) do nothing;

insert into public.programmes (programme_code, slug, name, family, price_ngn, duration, active, short_description, programme_type, status, registration_open)
values
  ('AI_CONTENT_DIGITAL_MARKETING', 'ai-content-digital-marketing', 'AI Content & Digital Marketing', 'career', 10000, '4 weeks', true, 'A practical AI content and digital marketing course.', 'CAREER_COURSE', 'PUBLISHED', true),
  ('AI_UI_UX_DIGITAL_DESIGN', 'ai-ui-ux-digital-design', 'AI UI/UX & Digital Design', 'career', 10000, '4 weeks', true, 'A practical UI/UX and digital design course.', 'CAREER_COURSE', 'PUBLISHED', true),
  ('AI_FINANCIAL_BUSINESS_ANALYSIS', 'ai-financial-business-analysis', 'AI Financial & Business Analysis', 'career', 10000, '4 weeks', true, 'A practical finance, analysis and business intelligence course.', 'CAREER_COURSE', 'PUBLISHED', true),
  ('AI_AUTOMATION_NO_CODE', 'ai-automation-no-code-solutions', 'AI Automation & No-Code Solutions', 'career', 10000, '4 weeks', true, 'A practical automation and no-code solutions course.', 'CAREER_COURSE', 'PUBLISHED', true)
on conflict (programme_code) do update set
  slug = excluded.slug,
  name = excluded.name,
  family = excluded.family,
  price_ngn = excluded.price_ngn,
  duration = excluded.duration,
  active = excluded.active,
  short_description = excluded.short_description,
  programme_type = excluded.programme_type,
  status = excluded.status,
  registration_open = excluded.registration_open,
  updated_at = now();

update public.programmes
set price_ngn = 25000,
    duration = '4 weeks',
    programme_type = 'BUSINESS_COURSE',
    status = 'PUBLISHED',
    registration_open = true,
    updated_at = now()
where programme_code = 'BUSINESS_TRANSFORMATION';
