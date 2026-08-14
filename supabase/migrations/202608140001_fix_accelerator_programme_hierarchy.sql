update public.programmes
set
  programme_code = 'AI_CONTENT_CREATION',
  slug = 'ai-content-creation',
  name = 'AI Content Creation',
  price_ngn = 10000,
  programme_type = 'CAREER_COURSE',
  status = 'PUBLISHED',
  registration_open = true,
  active = true,
  updated_at = now()
where programme_code in ('AI_CONTENT_DIGITAL_MARKETING', 'AI_CONTENT_CREATION')
   or slug in ('ai-content-digital-marketing', 'ai-content-creation');

update public.programmes
set
  programme_code = 'AI_FINANCE',
  slug = 'ai-finance',
  name = 'AI Finance',
  price_ngn = 10000,
  programme_type = 'CAREER_COURSE',
  status = 'PUBLISHED',
  registration_open = true,
  active = true,
  updated_at = now()
where programme_code in ('AI_FINANCIAL_BUSINESS_ANALYSIS', 'AI_FINANCE')
   or slug in ('ai-financial-business-analysis', 'ai-financial-analyst', 'ai-finance');

update public.programmes
set
  programme_code = 'AI_NO_CODE',
  slug = 'ai-no-code',
  name = 'AI No-Code',
  price_ngn = 10000,
  programme_type = 'CAREER_COURSE',
  status = 'PUBLISHED',
  registration_open = true,
  active = true,
  updated_at = now()
where programme_code in ('AI_AUTOMATION_NO_CODE', 'AI_NO_CODE')
   or slug in ('ai-automation-no-code-solutions', 'ai-automation-no-code', 'ai-no-code');

update public.programmes
set
  programme_code = 'AI_BUSINESS',
  slug = 'ai-business',
  name = 'AI Business',
  price_ngn = 10000,
  programme_type = 'CAREER_COURSE',
  status = 'PUBLISHED',
  registration_open = true,
  active = true,
  updated_at = now()
where programme_code in ('AI_UI_UX_DIGITAL_DESIGN', 'AI_BUSINESS')
   or slug in ('ai-ui-ux-digital-design', 'ui-ux-designer', 'ai-business');

insert into public.programmes (programme_code, slug, name, family, price_ngn, duration, active, programme_type, status, registration_open)
values
  ('AI_CONTENT_CREATION', 'ai-content-creation', 'AI Content Creation', 'career', 10000, '4 weeks', true, 'CAREER_COURSE', 'PUBLISHED', true),
  ('AI_FINANCE', 'ai-finance', 'AI Finance', 'career', 10000, '4 weeks', true, 'CAREER_COURSE', 'PUBLISHED', true),
  ('AI_NO_CODE', 'ai-no-code', 'AI No-Code', 'career', 10000, '4 weeks', true, 'CAREER_COURSE', 'PUBLISHED', true),
  ('AI_BUSINESS', 'ai-business', 'AI Business', 'career', 10000, '4 weeks', true, 'CAREER_COURSE', 'PUBLISHED', true)
on conflict (programme_code) do update
set
  slug = excluded.slug,
  name = excluded.name,
  price_ngn = excluded.price_ngn,
  programme_type = excluded.programme_type,
  status = excluded.status,
  registration_open = excluded.registration_open,
  active = excluded.active,
  updated_at = now();

update public.programmes
set
  name = 'Business Accelerator',
  price_ngn = 25000,
  duration = '4 weeks',
  programme_type = 'BUSINESS_PROGRAMME',
  status = 'PUBLISHED',
  registration_open = true,
  active = true,
  updated_at = now()
where programme_code = 'BUSINESS_TRANSFORMATION'
   or slug in ('business-transformation', 'business-accelerator');

update public.programmes
set
  price_ngn = 10000,
  active = true,
  status = coalesce(status, 'PUBLISHED'),
  registration_open = true,
  updated_at = now()
where programme_code = 'AI_INCOME_ACCELERATOR'
   or slug = 'ai-income-accelerator';
