import { v } from 'convex/values'
import { internalAction, query } from '../_generated/server'
import { appleSecretReminder, normalizeEmail, passwordAllowed, signInAvailability } from './social'

/**
 * The public and scheduled functions a product exports from its own
 * `convex/auth.ts`, so their names stay the product's:
 * `export const { providers, passwordSignIn, remindAppleSecret } = signInFunctions({ … })`.
 */
export function signInFunctions({ product, owner, codeReady }: {
  product: string
  owner: string | undefined
  /** Whether the code can be sent, for a product with its own sender; by default the Resend values decide. */
  codeReady?: () => boolean
}) {
  return {
    /** Public configuration only; never provider credentials. */
    providers: query({
      args: {},
      returns: v.object({ google: v.boolean(), apple: v.boolean(), newAccounts: v.boolean(), code: v.boolean() }),
      handler: () => ({ ...signInAvailability(process.env, Date.now()), ...(codeReady ? { code: codeReady() } : {}) }),
    }),
    /** Whether this address signs in with a password instead of a code: the screen asks after the email is typed. Listed addresses, and accounts that already have one. */
    passwordSignIn: query({
      args: { email: v.string() },
      returns: v.boolean(),
      handler: async (ctx, { email }) => {
        const address = normalizeEmail(email)
        if (!address) return false
        if (passwordAllowed(process.env, address)) return true
        const account = await ctx.db.query('authAccounts').withIndex('providerAndAccountId', (q) => q.eq('provider', 'password').eq('providerAccountId', address)).unique()
        return account !== null
      },
    }),
    /** Daily: tell the owner before Apple's client secret lapses, since nothing else will. */
    remindAppleSecret: internalAction({
      args: {},
      returns: v.null(),
      handler: async () => {
        const now = Date.now()
        const subject = appleSecretReminder(process.env.AUTH_APPLE_SECRET, now)
        const key = process.env.AUTH_RESEND_KEY
        const from = process.env.AUTH_EMAIL_FROM
        if (!subject || !key || !from || !owner) return null
        const text = [
          `Apple accepts a sign-in client secret for six months at most. Mint a new one for ${product} on the Mac that holds the .p8 key and set it:`,
          '',
          'vp exec convex env set AUTH_APPLE_SECRET "$(vp exec tsx \"../ID 1/scripts/apple-client-secret.ts\" --key <AuthKey.p8> --key-id <key id> --team-id <team id> --client-id <services id>)"',
          '',
          'Until then the Apple button stays inert; Google and the email code are unaffected.',
        ].join('\n')
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `apple-secret/${product}/${new Date(now).toISOString().slice(0, 10)}` },
          body: JSON.stringify({ from, to: owner, subject: `${product}: ${subject}`, text }),
          signal: AbortSignal.timeout(15_000),
        })
        if (!response.ok) throw new Error(`Resend returned HTTP ${response.status}.`)
        return null
      },
    }),
  }
}
