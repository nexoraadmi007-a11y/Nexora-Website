-- Additive independent-course payment support. Catalogue history is unchanged.
create table if not exists public.payment_items (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  programme_id uuid not null references public.programmes(id) on delete restrict,
  enrolment_id uuid not null references public.enrolments(id) on delete restrict,
  amount_ngn integer not null check (amount_ngn >= 0),
  created_at timestamptz not null default now(),
  unique (payment_id, programme_id),
  unique (payment_id, enrolment_id)
);

create index if not exists payment_items_programme_id_idx on public.payment_items(programme_id);
create index if not exists payment_items_enrolment_id_idx on public.payment_items(enrolment_id);
create index if not exists enrolments_user_programme_idx on public.enrolments(user_id, programme_id);

alter table public.payment_items enable row level security;
create policy "learners read own payment items" on public.payment_items for select to authenticated
using (exists (select 1 from public.payments p where p.id = payment_id and p.user_id = (select auth.uid())));

comment on table public.payment_items is 'Courses and separate enrolments included in a single Paystack transaction.';
