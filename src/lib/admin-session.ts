export const ADMIN_SESSION_COOKIE = 'nexora_admin_session'

export type AdminSession = {
  userId: string
  email: string
  role: string
  issuedAt: number
  expiresAt: number
  version: 1
}

const encoder = new TextEncoder()

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (value.length < 32) throw new Error('ADMIN_SESSION_SECRET must contain at least 32 characters.')
  return value
}

function encode(value: string | Uint8Array) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function decode(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(normalized + '='.repeat((4 - (normalized.length % 4)) % 4))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function key() {
  return crypto.subtle.importKey('raw', encoder.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function createAdminSessionToken(input: Omit<AdminSession, 'issuedAt' | 'expiresAt' | 'version'>, maxAgeSeconds: number) {
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminSession = { ...input, issuedAt: now, expiresAt: now + maxAgeSeconds, version: 1 }
  const encodedPayload = encode(JSON.stringify(payload))
  const signature = await crypto.subtle.sign('HMAC', await key(), encoder.encode(encodedPayload))
  return `${encodedPayload}.${encode(new Uint8Array(signature))}`
}

export async function verifyAdminSessionToken(token: string | null | undefined) {
  try {
    if (!token) return null
    const [payload, signature, extra] = token.split('.')
    if (!payload || !signature || extra) return null
    const valid = await crypto.subtle.verify('HMAC', await key(), decode(signature), encoder.encode(payload))
    if (!valid) return null
    const session = JSON.parse(new TextDecoder().decode(decode(payload))) as AdminSession
    if (session.version !== 1 || !session.userId || !session.email || !session.role) return null
    if (!Number.isFinite(session.expiresAt) || session.expiresAt <= Math.floor(Date.now() / 1000)) return null
    return session
  } catch {
    return null
  }
}

export function adminSessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
  }
}
