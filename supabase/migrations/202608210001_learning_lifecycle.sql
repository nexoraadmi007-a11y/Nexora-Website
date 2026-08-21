-- Extend the existing Nexora schema into a class-scoped learning lifecycle.
alter table public.classes
  add column if not exists name text,
  add column if not exists track_id uuid references public.programme_tracks(id) on delete set null,
  add column if not exists starts_at date,
  add column if not exists ends_at date,
  add column if not exists archived_at timestamptz;

update public.classes set name = coalesce(name, title) where name is null;

create table if not exists public.class_memberships (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  enrolment_id uuid references public.enrolments(id) on delete set null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','COMPLETED','REMOVED')),
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  unique (class_id, user_id)
);

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  description text,
  session_date date not null,
  start_time time,
  end_time time,
  trainer text,
  meeting_platform text,
  meeting_url text,
  meeting_id text,
  meeting_password text,
  status text not null default 'DRAFT',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  track_id uuid references public.programme_tracks(id) on delete set null,
  title text not null,
  description text,
  instructions text,
  due_at timestamptz,
  attachment_path text,
  external_submission_url text,
  status text not null default 'DRAFT',
  published boolean not null default false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_url text,
  submission_text text,
  attachment_path text,
  status text not null default 'SUBMITTED',
  score numeric(7,2),
  feedback text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (assignment_id, user_id)
);

alter table public.projects
  add column if not exists class_id uuid references public.classes(id) on delete set null,
  add column if not exists track_id uuid references public.programme_tracks(id) on delete set null,
  add column if not exists description text,
  add column if not exists instructions text,
  add column if not exists external_url text,
  add column if not exists published boolean not null default false,
  add column if not exists published_at timestamptz,
  add column if not exists archived_at timestamptz;

create table if not exists public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  track_id uuid references public.programme_tracks(id) on delete set null,
  live_session_id uuid references public.live_sessions(id) on delete set null,
  title text not null,
  description text,
  resource_type text not null check (resource_type in ('PDF','DOCUMENT','LINK','IMAGE','VIDEO','TEMPLATE','OTHER')),
  external_url text,
  storage_path text,
  session_label text,
  published boolean not null default false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (external_url is not null or storage_path is not null)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  body text not null,
  published boolean not null default false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  track_id uuid references public.programme_tracks(id) on delete set null,
  title text not null,
  instructions text,
  status text not null default 'DRAFT',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('MULTIPLE_CHOICE','TRUE_FALSE','SHORT_TEXT','LONG_TEXT')),
  options jsonb not null default '[]',
  correct_answer jsonb,
  marks numeric(7,2) not null default 1,
  instructions text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.notifications
  add column if not exists category text,
  add column if not exists href text,
  add column if not exists class_id uuid references public.classes(id) on delete cascade,
  add column if not exists entity_type text,
  add column if not exists entity_id uuid,
  add column if not exists dedupe_key text;

create unique index if not exists notifications_user_dedupe_key_idx
  on public.notifications(user_id, dedupe_key) where dedupe_key is not null;

create index if not exists class_memberships_user_idx on public.class_memberships(user_id, status);
create index if not exists live_sessions_class_idx on public.live_sessions(class_id, published, session_date);
create index if not exists assignments_class_idx on public.assignments(class_id, published, due_at);
create index if not exists projects_class_idx on public.projects(class_id, published, deadline);
create index if not exists learning_resources_class_idx on public.learning_resources(class_id, published);

alter table public.class_memberships enable row level security;
alter table public.live_sessions enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.learning_resources enable row level security;
alter table public.announcements enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_questions enable row level security;

drop policy if exists "students read own class memberships" on public.class_memberships;
create policy "students read own class memberships" on public.class_memberships for select to authenticated
using ((select auth.uid()) = user_id and status = 'ACTIVE');

drop policy if exists "members read own classes" on public.classes;
create policy "members read own classes" on public.classes for select to authenticated using (
  exists (select 1 from public.class_memberships cm where cm.class_id = classes.id and cm.user_id = (select auth.uid()) and cm.status = 'ACTIVE')
);

drop policy if exists "members read published live sessions" on public.live_sessions;
create policy "members read published live sessions" on public.live_sessions for select to authenticated using (
  published and exists (select 1 from public.class_memberships cm where cm.class_id = live_sessions.class_id and cm.user_id = (select auth.uid()) and cm.status = 'ACTIVE')
);

drop policy if exists "members read published assignments" on public.assignments;
create policy "members read published assignments" on public.assignments for select to authenticated using (
  published and archived_at is null and exists (select 1 from public.class_memberships cm where cm.class_id = assignments.class_id and cm.user_id = (select auth.uid()) and cm.status = 'ACTIVE')
);

drop policy if exists "students manage own assignment submissions" on public.assignment_submissions;
create policy "students manage own assignment submissions" on public.assignment_submissions for select to authenticated using ((select auth.uid()) = user_id);
create policy "students create own assignment submissions" on public.assignment_submissions for insert to authenticated with check (
  (select auth.uid()) = user_id and exists (
    select 1 from public.assignments a join public.class_memberships cm on cm.class_id = a.class_id
    where a.id = assignment_id and a.published and cm.user_id = (select auth.uid()) and cm.status = 'ACTIVE'
  )
);
create policy "students update own assignment submissions" on public.assignment_submissions for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "members read published projects" on public.projects;
create policy "members read published projects" on public.projects for select to authenticated using (
  published and archived_at is null and exists (select 1 from public.class_memberships cm where cm.class_id = projects.class_id and cm.user_id = (select auth.uid()) and cm.status = 'ACTIVE')
);

drop policy if exists "members read published resources" on public.learning_resources;
create policy "members read published resources" on public.learning_resources for select to authenticated using (
  published and archived_at is null and exists (select 1 from public.class_memberships cm where cm.class_id = learning_resources.class_id and cm.user_id = (select auth.uid()) and cm.status = 'ACTIVE')
);

drop policy if exists "members read published announcements" on public.announcements;
create policy "members read published announcements" on public.announcements for select to authenticated using (
  published and archived_at is null and exists (select 1 from public.class_memberships cm where cm.class_id = announcements.class_id and cm.user_id = (select auth.uid()) and cm.status = 'ACTIVE')
);

drop policy if exists "members read published assessments" on public.assessments;
create policy "members read published assessments" on public.assessments for select to authenticated using (
  published and exists (select 1 from public.class_memberships cm where cm.class_id = assessments.class_id and cm.user_id = (select auth.uid()) and cm.status = 'ACTIVE')
);
drop policy if exists "members read assessment questions" on public.assessment_questions;
create policy "members read assessment questions" on public.assessment_questions for select to authenticated using (
  exists (select 1 from public.assessments a join public.class_memberships cm on cm.class_id = a.class_id
    where a.id = assessment_questions.assessment_id and a.published and cm.user_id = (select auth.uid()) and cm.status = 'ACTIVE')
);

grant select on public.classes, public.class_memberships, public.live_sessions, public.assignments,
  public.projects, public.learning_resources, public.announcements, public.assessments,
  public.assessment_questions to authenticated;
grant select, insert, update on public.assignment_submissions to authenticated;

insert into storage.buckets (id, name, public)
values ('class-content', 'class-content', false)
on conflict (id) do update set public = false;

drop policy if exists "class members read private class content" on storage.objects;
create policy "class members read private class content" on storage.objects for select to authenticated using (
  bucket_id = 'class-content' and exists (
    select 1 from public.class_memberships cm
    where cm.class_id::text = (storage.foldername(name))[1]
      and cm.user_id = (select auth.uid()) and cm.status = 'ACTIVE'
  )
);
