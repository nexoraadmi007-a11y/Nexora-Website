revoke insert, update, delete, truncate, references, trigger on public.referral_conversions from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.associate_monthly_performance from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.payout_requests from anon, authenticated;

grant select on public.referral_conversions, public.associate_monthly_performance, public.payout_requests to authenticated;
