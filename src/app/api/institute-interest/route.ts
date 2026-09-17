import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export const runtime = 'nodejs'

const leadTypes = new Set(['PROGRAM_INTEREST', 'CORPORATE_TRAINING', 'AMBASSADOR', 'COMMUNITY'])
const programmes = new Set(['AI_ACCELERATOR', 'BUSINESS_TRANSFORMATION'])
const attempts = new Map<string, { count: number; expires: number }>()
const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''

function destination(type: string) {
  const name = type === 'COMMUNITY' ? 'NEXORA_GENERAL_COMMUNITY_URL' : type === 'AMBASSADOR' ? 'NEXORA_AMBASSADOR_COMMUNITY_URL' : ''
  if (!name) return null
  const value = process.env[name]
  if (!value) return null
  try { const url = new URL(value); return url.protocol === 'https:' ? url.toString() : null } catch { return null }
}

export async function POST(request: NextRequest) {
  const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const previous = attempts.get(client)
  const count = previous && previous.expires > now ? previous.count + 1 : 1
  attempts.set(client, { count, expires: now + 60 * 60 * 1000 })
  if (count > 12) return NextResponse.json({ error: 'Please wait before trying again.' }, { status: 429 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }
  if (clean(body.website, 100)) return NextResponse.json({ ok: true })
  const leadType = clean(body.leadType, 40)
  const programmeCode = clean(body.programmeCode, 40)
  const fullName = clean(body.fullName, 160)
  const email = clean(body.email, 254).toLowerCase()
  const whatsAppNumber = clean(body.whatsAppNumber, 30)
  const organization = clean(body.organization, 160)
  const message = clean(body.message, 1200)
  if (!leadTypes.has(leadType) || !fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\+?[0-9 ()-]{7,30}$/.test(whatsAppNumber) ||
    (leadType === 'PROGRAM_INTEREST' && !programmes.has(programmeCode)) || (leadType === 'CORPORATE_TRAINING' && !organization)) {
    return NextResponse.json({ error: 'Please complete the required fields.' }, { status: 400 })
  }

  try {
    const db = createSupabaseAdminClient()
    const { error } = await db.from('institute_leads').insert({
      lead_type: leadType, programme_code: leadType === 'PROGRAM_INTEREST' ? programmeCode : null,
      full_name: fullName, email, whatsapp_number: whatsAppNumber,
      organization: leadType === 'CORPORATE_TRAINING' ? organization : null, message: message || null,
      source: 'WEBSITE',
    })
    if (error) throw error
    if (process.env.NEXORA_LEAD_NOTIFICATION_EMAIL) {
      try { await sendEmail({ to: process.env.NEXORA_LEAD_NOTIFICATION_EMAIL, subject: `New Nexora ${leadType.replace(/_/g, ' ').toLowerCase()} interest`, text: `A new ${leadType} enquiry was submitted. Review the institute_leads table for details.` }) }
      catch (error) { console.error('Institute lead notification failed', error instanceof Error ? error.message : 'unknown') }
    }
    return NextResponse.json({ ok: true, nextUrl: destination(leadType) })
  } catch (error) {
    console.error('Institute lead save failed', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'We could not save your interest. Please try again.' }, { status: 500 })
  }
}
