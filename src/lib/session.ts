import { createHmac, timingSafeEqual, randomBytes } from 'crypto'

export const SESSION_COOKIE = 'miis_session'

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 365, // 1 year
}

function secret(): string {
  const s = process.env.COOKIE_SECRET
  if (!s) throw new Error('Missing env var: COOKIE_SECRET')
  return s
}

/** Signs a session token → `token.hmac` stored in the cookie. */
export function signToken(token: string): string {
  const sig = createHmac('sha256', secret()).update(token).digest('hex')
  return `${token}.${sig}`
}

/**
 * Verifies a signed cookie value.
 * Returns the raw session_token on success, null on failure.
 */
export function verifySignedToken(signed: string): string | null {
  const dot = signed.lastIndexOf('.')
  if (dot === -1) return null

  const token = signed.slice(0, dot)
  const sig = signed.slice(dot + 1)
  const expected = createHmac('sha256', secret()).update(token).digest('hex')

  try {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length === 0 || a.length !== b.length) return null
    return timingSafeEqual(a, b) ? token : null
  } catch {
    return null
  }
}

/** Generates a cryptographically random session token (64 hex chars). */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}
