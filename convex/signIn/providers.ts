import type { AuthProviderConfig } from '@convex-dev/auth/server'
import Google from '@auth/core/providers/google'
import Apple from '@auth/core/providers/apple'
import { AppleNative } from './appleNative'
import { EmailCode, type SendCode } from './emailCode'
import { OwnerPassword } from './password'
import { normalizeEmail } from './social'

export type SignInOptions = {
  /** The product's name as people read it: in the code email and as a nameless Apple account's name. */
  product: string
  /** Password sign-in for the addresses in `SIGN_IN_PASSWORD_EMAILS`; off by default. Pass the Password provider's config (a `reset`, a `profile`) or true. */
  password?: boolean | Parameters<typeof OwnerPassword>[0]
  /** The product's own way of sending the code email, instead of Resend from `AUTH_EMAIL_FROM`. */
  sendCode?: SendCode
  /** Sign in with Apple from the product's own apps; needs `APPLE_NATIVE_CLIENTS`. Off by default. */
  appleNative?: boolean
  /** The product's further providers (a purchase, a hand-off, an invitation). */
  extra?: AuthProviderConfig[]
}

/**
 * The providers every product offers: the emailed code, Google and Apple, with
 * a password for the owner and Apple's native sheet where a product wants them.
 * Google and Apple hand the product a lower-case email, whether it is verified,
 * and a name; Apple's refresh token rides on the profile for
 * `rememberAppleTokenFromProfile`.
 */
export function signInProviders(options: SignInOptions): AuthProviderConfig[] {
  return [
    ...(options.appleNative ? [AppleNative({ defaultName: `${options.product} user` })] : []),
    EmailCode({ product: options.product, send: options.sendCode }),
    ...(options.password ? [OwnerPassword(options.password === true ? {} : options.password)] : []),
    Google({
      profile(profile) {
        return { id: profile.sub, email: normalizeEmail(profile.email), emailVerified: profile.email_verified === true, name: profile.name }
      },
    }),
    Apple({
      profile(profile, tokens) {
        const name = profile.user?.name
        return {
          id: profile.sub,
          ...(tokens.refresh_token && process.env.AUTH_APPLE_ID ? { appleRefreshToken: tokens.refresh_token, appleClientId: process.env.AUTH_APPLE_ID } : {}),
          ...(profile.email ? { email: normalizeEmail(profile.email) } : {}),
          emailVerified: profile.email_verified === true || profile.email_verified === 'true',
          name: name ? [name.firstName, name.lastName].filter(Boolean).join(' ') : `${options.product} user`,
        }
      },
    }),
    ...(options.extra ?? []),
  ]
}
