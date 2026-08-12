create unique index if not exists partners_email_unique_idx on public.partners (lower(email));
