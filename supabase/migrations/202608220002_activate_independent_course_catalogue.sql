-- Preserve legacy rows for history while removing them from the active catalogue.
update public.programmes
set active = false, registration_open = false, status = 'ARCHIVED',
    archived_at = coalesce(archived_at, now()), updated_at = now()
where programme_code not in ('AI_FINANCE', 'AI_NO_CODE', 'AI_CONTENT_CREATION');

update public.programme_tracks set active = false where active = true;

update public.programmes
set name = case programme_code
    when 'AI_FINANCE' then 'Business Analysis with AI'
    when 'AI_NO_CODE' then 'AI No-Code & Vibe Coding'
    when 'AI_CONTENT_CREATION' then 'AI Content Creation'
  end,
  slug = case programme_code
    when 'AI_FINANCE' then 'business-analysis-with-ai'
    when 'AI_NO_CODE' then 'ai-no-code-vibe-coding'
    when 'AI_CONTENT_CREATION' then 'ai-content-creation'
  end,
  family = 'INDEPENDENT_COURSE', programme_type = 'COURSE', price_ngn = 10000,
  active = true, registration_open = true, status = 'PUBLISHED', archived_at = null,
  updated_at = now()
where programme_code in ('AI_FINANCE', 'AI_NO_CODE', 'AI_CONTENT_CREATION');
