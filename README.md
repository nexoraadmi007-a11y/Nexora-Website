# Nexora Institute

A focused landing page for practical AI training. The active Next.js application has one public page (`/`) and one lead endpoint (`/api/institute-interest`). Historical Supabase migrations and records are retained; old product routes are absent from the build.

## Local development

```powershell
npm ci
npm run dev
```

Copy `.env.example` to a local, untracked `.env.local` and provide the matching Supabase URL and service-role key. Keep all secrets server-side. The lead endpoint writes to `public.institute_leads`; its migration is `supabase/migrations/202609170001_institute_leads.sql`.

## Release gate

1. Verify the intended Supabase project and export historical data before any database removal. This reset does not drop old tables.
2. Apply the new lead migration and confirm a real form submission appears in `institute_leads`.
3. Set the community URLs and lead notification email in the hosting environment.
4. Run `npm run typecheck` and `npm run build`.
5. Deploy and check the custom domain, mobile page, form, redirects, and that legacy routes return 404.

The source reset audit and remaining operational limits are in `docs/controlled-reset-audit.md`.
