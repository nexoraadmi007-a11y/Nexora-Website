alter table public.profiles add column if not exists signup_referral_code text;
alter table public.profiles add column if not exists signup_referral_source text;
alter table public.profiles add column if not exists signup_referral_captured_at timestamptz;
