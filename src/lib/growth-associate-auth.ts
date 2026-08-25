import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, '')
  const normalized = digits.startsWith('0') && digits.length === 11
    ? `234${digits.slice(1)}`
    : digits
  if (!/^\d{11,15}$/.test(normalized)) throw new Error('Enter a valid WhatsApp number, including country code when outside Nigeria.')
  return `+${normalized}`
}

export async function generateGrowthId(db: SupabaseClient) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = randomBytes(5).toString('hex').slice(0, 6).toUpperCase()
    const growthId = `NEX-GA-${suffix}`
    const { data, error } = await db.from('partners').select('id').eq('partner_id', growthId).maybeSingle()
    if (error) throw error
    if (!data) return growthId
  }
  throw new Error('Could not generate a unique Growth Associate ID.')
}

export function validateAssociatePassword(password: string, confirmation: string) {
  if (password !== confirmation) throw new Error('Passwords do not match.')
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error('Use at least 8 characters, including a letter and a number.')
  }
}
