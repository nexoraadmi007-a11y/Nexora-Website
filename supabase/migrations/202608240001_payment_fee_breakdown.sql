alter table public.payments add column if not exists subtotal_ngn integer check (subtotal_ngn >= 0);
alter table public.payments add column if not exists processing_fee_ngn integer check (processing_fee_ngn >= 0);

update public.payments
set subtotal_ngn = coalesce(subtotal_ngn, amount_ngn),
    processing_fee_ngn = coalesce(processing_fee_ngn, 0)
where subtotal_ngn is null or processing_fee_ngn is null;

create unique index if not exists enrolments_one_current_per_course_idx
on public.enrolments(user_id, programme_id)
where user_id is not null and status in ('ENROLLED', 'ACTIVE', 'COMPLETED');

comment on column public.payments.subtotal_ngn is 'Authoritative course total before the customer-borne processing fee.';
comment on column public.payments.processing_fee_ngn is 'Paystack processing fee gross-up charged to the customer.';
