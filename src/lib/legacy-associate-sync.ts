import { escapeFormula, listRecords } from '@/lib/airtable'

type Partner = { airtable_record_id?: string | null; email?: string | null }
const value = (fields: Record<string, any>, ...keys: string[]) => keys.map((key) => fields[key]).find((item) => item !== undefined && item !== null && item !== '')
const text = (input: unknown, max = 2000) => String(input || '').trim().slice(0, max) || null

export async function legacyAssociateHrFields(partner: Partner) {
  const formula = partner.airtable_record_id ? `RECORD_ID()='${escapeFormula(partner.airtable_record_id)}'` : `{Email}='${escapeFormula(partner.email || '')}'`
  const associate = (await listRecords<Record<string, any>>('Ambassadors', { formula, maxRecords: 1 }))[0]
  if (!associate) return null
  const f = associate.fields
  return {
    airtable_record_id: associate.id,
    whatsapp: text(value(f, 'WhatsApp Number', 'Phone Number', 'Contact'), 80), gender: text(value(f, 'Gender'), 80),
    location: text(value(f, 'Location', 'State'), 160), institution: text(value(f, 'Institution', 'Institution or Organization'), 300),
    field_of_study: text(value(f, 'Course of Study', 'Field of Study'), 300), graduation_information: text(value(f, 'Graduation Information', 'Graduation Status', 'Expected Graduation'), 500),
    nysc_information: text(value(f, 'NYSC Information', 'NYSC Status', 'Service Status'), 500), telegram_username: text(value(f, 'Telegram Username'), 120),
    telegram_user_id: text(value(f, 'Telegram User ID'), 120), telegram_chat_id: text(value(f, 'Telegram Chat ID'), 120), date_of_birth: text(value(f, 'Date of Birth'), 10),
    profile_photo_url: text(Array.isArray(f['Profile Photo']) ? f['Profile Photo'][0]?.url : value(f, 'Profile Photo URL'), 1000),
    engagement_start_date: text(value(f, 'Employment Start Date', 'Start Date'), 10), engagement_end_date: text(value(f, 'Employment End Date', 'End Date'), 10),
    legacy_registration_id: text(Array.isArray(f['Registration']) ? f['Registration'][0] : value(f, 'Registration ID'), 120),
  }
}
