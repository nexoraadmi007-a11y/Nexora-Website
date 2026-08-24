create index if not exists referral_conversions_referral_code_idx on public.referral_conversions(referral_code_id);
create index if not exists referral_conversions_invalidated_by_idx on public.referral_conversions(invalidated_by) where invalidated_by is not null;
