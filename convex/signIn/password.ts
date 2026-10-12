import { ConvexCredentials } from '@convex-dev/auth/providers/ConvexCredentials'
import { Password } from '@convex-dev/auth/providers/Password'
import type { DataModel } from '../_generated/dataModel'
import { normalizeEmail, passwordAllowed } from './social'

type PasswordConfig = NonNullable<Parameters<typeof Password<DataModel>>[0]>
type CredentialsConfig = Parameters<typeof ConvexCredentials<DataModel>>[0]

/**
 * Convex Auth's Password provider, with new passwords for the addresses in
 * `SIGN_IN_PASSWORD_EMAILS` alone (the owner's, so testing stays quick): a
 * sign-up or a reset for any other address is sent to the code. An account
 * that already has a password keeps signing in with it, so nobody is locked
 * out while a product's code email is still being set up.
 */
export function OwnerPassword(config: PasswordConfig = {}) {
  const base = Password<DataModel>({
    ...config,
    profile(params, ctx) {
      return config.profile ? config.profile(params, ctx) : { email: normalizeEmail(params.email) }
    },
  })
  // Convex Auth reads a credentials provider from its `options`, so the gate wraps there.
  const inner = (base as unknown as { options: CredentialsConfig }).options
  return ConvexCredentials<DataModel>({
    ...inner,
    async authorize(params, ctx) {
      if (params.flow !== 'signIn' && !passwordAllowed(process.env, params.email)) throw new Error('Sign in with the code sent to your email.')
      return inner.authorize(params, ctx)
    },
  })
}
