alter table public.referral_events
add column if not exists referral_code_text text;

update public.referral_events events
set referral_code_text = codes.code
from public.referral_codes codes
where events.referral_code_id = codes.id
  and events.referral_code_text is null;

create index if not exists referral_events_referral_code_text_idx
on public.referral_events (referral_code_text);
