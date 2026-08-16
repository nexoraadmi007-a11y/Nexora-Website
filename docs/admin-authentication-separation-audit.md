# Admin Authentication Separation Audit

## Root cause

The former `/admin/login` used the browser Supabase client and called the same `signInWithPassword` method as `/login`. Both flows therefore wrote the same Supabase authentication cookies. Admin access also applied the normal-user email-confirmation check, while middleware treated an ordinary user session as the starting point for administrator authorization. This made admin and student state collide even though their page routes were different.

The public `Get Started` CTA was already linked to `/signup`. Its destination was not the root defect; the shared authentication state made the resulting experience appear mixed.

## Implemented architecture

- Public/user journey: `/signup`, `/login`, `/app/*`, Supabase user session.
- Admin journey: `/admin/login`, `/admin/*`, signed `nexora_admin_session` HttpOnly cookie.
- Admin credentials are submitted only to `/api/admin/auth/login`.
- The server authenticates the password with Supabase without persisting a user session in the browser, then verifies an `ACTIVE` row in `admin_roles` using the service-role client.
- A signed HMAC admin token is issued only after both checks succeed.
- Middleware verifies the dedicated token before allowing `/admin/*`; every server-rendered admin page rechecks the active database role.
- Admin logout invalidates only the admin cookie. User logout invalidates only the normal Supabase session.

## Routes

- Admin login: `/admin/login`
- Admin dashboard: `/admin`
- Admin logout API: `/api/admin/auth/logout`
- User login: `/login`
- User dashboard: `/app`
- User logout API: `/api/auth/logout`

## Data administration

The admin navigation now includes real Supabase-backed views for students, enrollments, payments, programmes, tracks, cohorts/classes, users, partners, referrals, commissions and payouts. No application table currently exists; profile creation is the existing registration source and is shown in Students/Users. Cohorts are derived only from real `classes.cohort` values.

## Required server configuration

`ADMIN_SESSION_SECRET` should be a random secret of at least 32 characters and must never use a `NEXT_PUBLIC_` prefix. Render generates a persistent 256-bit value from the Blueprint. To preserve access during an existing-service rollout before Blueprint synchronization, the server can derive signatures from the already server-only service-role key; configuring the dedicated secret remains the preferred production state. Existing Supabase URL, anon key and service-role key remain required. `NEXORA_BOOTSTRAP_ADMIN_EMAILS` and `NEXORA_ADMIN_BOOTSTRAP_SECRET` control the separate one-time admin setup flow.

## Mobile boundary

No distinct mobile authentication route exists in this repository. Web/mobile users may share Supabase user authentication, but neither surface can create or satisfy the dedicated admin cookie.
