import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'
import { adminRoles } from '@/lib/admin-auth'

export const runtime = 'nodejs'

function text(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function hasValidPassword(value: string) {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /[0-9]/.test(value)
}

function bootstrapEmails() {
  return new Set(
    (process.env.NEXORA_BOOTSTRAP_ADMIN_EMAILS || 'admin@nexoragroup.ink,nexoraadmi007@gmail.com')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  )
}

function expectedSecret() {
  return process.env.NEXORA_ADMIN_BOOTSTRAP_SECRET
    || process.env.GROWTH_ADMIN_SECRET
    || process.env.TELEGRAM_QUEUE_SECRET
    || process.env.CRON_SECRET
    || ''
}

async function findUserByEmail(email: string) {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw new Error(`Admin user lookup failed: ${error.message}`)
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const secret = text(body.secret, 500)
    const email = text(body.email, 254).toLowerCase()
    const fullName = text(body.fullName, 160) || 'Nexora Admin'
    const password = text(body.password, 200)
    const configuredSecret = expectedSecret()

    if (!configuredSecret || secret !== configuredSecret) {
      return NextResponse.json({ error: 'Invalid admin setup secret.' }, { status: 401 })
    }
    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json({ error: 'Supabase admin access is not configured.' }, { status: 500 })
    }
    if (!bootstrapEmails().has(email)) {
      return NextResponse.json({ error: 'This email is not allowed for bootstrap admin access.' }, { status: 403 })
    }
    if (!hasValidPassword(password)) {
      return NextResponse.json({ error: 'Create a password with at least 8 characters, including one letter and one number. Do not type the instruction text itself.' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()
    const existingUser = await findUserByEmail(email)
    const { data: userResult, error: userError } = existingUser
      ? await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })
      : await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })

    if (userError || !userResult.user) {
      throw new Error(`Admin auth setup failed: ${userError?.message || 'No user returned'}`)
    }

    const user = userResult.user
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      email,
      role: 'admin',
      updated_at: new Date().toISOString(),
    })
    if (profileError) throw new Error(`Admin profile setup failed: ${profileError.message}`)

    const { error: roleError } = await supabase.from('admin_roles').upsert({
      user_id: user.id,
      role: 'SUPER_ADMIN' satisfies typeof adminRoles[number],
      status: 'ACTIVE',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,role' })
    if (roleError) throw new Error(`Admin role setup failed: ${roleError.message}`)

    await supabase.from('admin_audit_logs').insert({
      admin_user_id: user.id,
      admin_email: email,
      action: existingUser ? 'BOOTSTRAP_ADMIN_PASSWORD_RESET' : 'BOOTSTRAP_ADMIN_CREATED',
      entity: 'admin_roles',
      entity_id: user.id,
      new_value: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
    }).then(() => undefined, () => undefined)

    return NextResponse.json({
      ok: true,
      message: 'Admin login access is ready. Use this email and password on the admin login page.',
      email,
      loginUrl: '/admin/login',
    })
  } catch (error) {
    console.error('Admin bootstrap failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Admin access could not be created. Please try again.' }, { status: 500 })
  }
}
