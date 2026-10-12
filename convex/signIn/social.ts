/**
 * What the environment lets a product offer, read the same way on every
 * server. Pure: no Convex here, so tests and the client can read it too.
 */
export type SocialProvider = 'google' | 'apple'

/**
 * How far Google and Apple sign-in are open, from `SOCIAL_SIGN_IN`: not at
 * all, only to accounts that already exist, or to everyone. Anything else is
 * off, so a typo closes the door rather than opening it.
 */
export type SocialSignInStage = 'off' | 'existing' | 'public'
export function socialSignInStage(value: string | undefined): SocialSignInStage {
  return value === 'existing' || value === 'public' ? value : 'off'
}

/** When a JWT stops being accepted, in milliseconds, read without verifying it; null for anything that is not a JWT with an expiry. */
export function jwtExpiresAt(token: string): number | null {
  const parts = token.split('.')
  if (parts.length !== 3 || !parts[1]) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')))
    return typeof claims?.exp === 'number' && Number.isFinite(claims.exp) ? claims.exp * 1000 : null
  } catch {
    return null
  }
}

export type Environment = Record<string, string | undefined>

export type SignInAvailability = {
  google: boolean
  apple: boolean
  /** Whether Google and Apple may make a new account, or only sign an existing one in. */
  newAccounts: boolean
  /** Whether the emailed code is configured. */
  code: boolean
}

/**
 * What the sign-in screen may offer. Apple's client secret lapses on its own
 * after at most six months, so an expired one reads as missing: the button goes
 * inert instead of failing on Apple's side halfway through.
 */
export function signInAvailability(env: Environment, now: number): SignInAvailability {
  const stage = socialSignInStage(env.SOCIAL_SIGN_IN)
  const appleExpiry = jwtExpiresAt(env.AUTH_APPLE_SECRET ?? '')
  return {
    google: stage !== 'off' && Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
    apple: stage !== 'off' && Boolean(env.AUTH_APPLE_ID && appleExpiry !== null && appleExpiry > now),
    newAccounts: stage === 'public',
    code: Boolean(env.AUTH_RESEND_KEY && env.AUTH_EMAIL_FROM),
  }
}

export const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export function normalizeEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}

/** The addresses that may still sign in with a password, from `SIGN_IN_PASSWORD_EMAILS`: the owner's, for testing. Everyone else gets a code. */
export function passwordEmails(env: Environment): string[] {
  return (env.SIGN_IN_PASSWORD_EMAILS ?? '').split(',').map(normalizeEmail).filter(Boolean)
}
export function passwordAllowed(env: Environment, email: unknown): boolean {
  const address = normalizeEmail(email)
  return Boolean(address) && passwordEmails(env).includes(address)
}

const DAY = 86_400_000

/**
 * The subject of the owner's reminder about Apple's client secret today, or
 * null for no email. The cron runs daily, so each listed day is one email;
 * once lapsed, or if the value is not a token at all, it repeats weekly.
 */
export function appleSecretReminder(secret: string | undefined, now: number): string | null {
  if (!secret) return null
  const expiresAt = jwtExpiresAt(secret)
  if (expiresAt === null)
    return new Date(now).getUTCDay() === 1 ? 'Apple sign-in is off: AUTH_APPLE_SECRET is not a valid token' : null
  const days = Math.floor((expiresAt - now) / DAY)
  if ([30, 14, 7, 3, 1].includes(days)) return `Apple sign-in stops in ${days} day${days === 1 ? '' : 's'}: renew AUTH_APPLE_SECRET`
  if (days === 0) return 'Apple sign-in stops today: renew AUTH_APPLE_SECRET'
  if (days < 0 && days % 7 === 0) return 'Apple sign-in is off: AUTH_APPLE_SECRET has expired'
  return null
}
