import type { SupabaseClient } from '@supabase/supabase-js'
import { calculateGrossPaymentAmount } from './paystack-pricing'

export async function authoritativeCourseQuote(supabase: SupabaseClient, rawCodes: unknown) {
  const codes = Array.isArray(rawCodes)
    ? Array.from(new Set(rawCodes.filter((value): value is string => typeof value === 'string').map((value) => value.trim().toUpperCase()).filter(Boolean)))
    : []
  if (!codes.length || codes.length > 3) throw new Error('Select between one and three courses.')
  const { data, error } = await supabase.from('programmes')
    .select('id, programme_code, slug, name, short_description, price_ngn')
    .in('programme_code', codes).eq('active', true).eq('registration_open', true).eq('status', 'PUBLISHED')
  if (error) throw new Error(`Course catalogue lookup failed: ${error.message}`)
  if (!data || data.length !== codes.length) throw new Error('One or more selected courses are unavailable.')
  const byCode = new Map(data.map((course) => [course.programme_code, course]))
  const courses = codes.map((code) => byCode.get(code)!).filter(Boolean)
  const subtotal = courses.reduce((sum, course) => sum + Number(course.price_ngn || 0), 0)
  if (courses.some((course) => Number(course.price_ngn) !== 10000)) throw new Error('The active course catalogue price is invalid.')
  return { courses, ...calculateGrossPaymentAmount(subtotal) }
}
