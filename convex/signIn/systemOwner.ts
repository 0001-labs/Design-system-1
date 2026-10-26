import { ConvexCredentials } from '@convex-dev/auth/providers/ConvexCredentials'
import type { GenericId } from 'convex/values'

type CredentialsConfig = Parameters<typeof ConvexCredentials>[0]
type AuthorizeContext = Parameters<CredentialsConfig['authorize']>[1]

export const SYSTEM_OWNER_PROVIDER_ID = 'system-owner'
/** Where a product trades System's one-use code for the owner's identity (0001/system-host/redeem-api.ts). */
export const SYSTEM_REDEEM_URL = 'https://system.0001.dev/auth/redeem'
/** A code as System mints it: two UUIDs. */
const CODE_SHAPE = /^[0-9a-f-]{72}$/
/** The PKCE verifier the product made: 32 random bytes as hex. */
const VERIFIER_SHAPE = /^[a-f0-9]{64}$/

export type SystemOwnerOptions = {
  /** The product's name in System's `clients` (`0001/system-host/session-authority.ts`): the code must have been issued for it. */
  client: string
  /** The product's owner account, found on the server (`signInFunctions().ownerUser` by `SIGN_IN_OWNER_EMAIL`, or the product's own rule); null refuses the sign-in. */
  ownerUser: (ctx: AuthorizeContext) => Promise<GenericId<'users'> | null>
  /** System's redeem endpoint, for tests. */
  redeemUrl?: string
  /** `fetch`, for tests. */
  fetcher?: typeof fetch
}

/**
 * One key (`docs/system.md` in 0001): the owner signs in at system.0001.dev
 * once, and every product lets that session in. A product's page sends the
 * browser to System's `/auth/authorize?client=<product>&state=…&challenge=…`;
 * System comes back to the product with a one-use code; the page signs in with
 * `{ code, verifier }` here. The provider trades the code at System for the
 * owner's identity, asks the product for its owner account and signs that
 * account in with Convex Auth's ordinary session. Nobody else has a System
 * session, so nobody else has this way in; the public ways are unchanged.
 */
export function SystemOwner(options: SystemOwnerOptions) {
  return ConvexCredentials({
    id: SYSTEM_OWNER_PROVIDER_ID,
    async authorize(params, ctx) {
      const code = typeof params.code === 'string' ? params.code : ''
      const verifier = typeof params.verifier === 'string' ? params.verifier : ''
      if (!CODE_SHAPE.test(code) || !VERIFIER_SHAPE.test(verifier)) return null
      const response = await (options.fetcher ?? fetch)(options.redeemUrl ?? SYSTEM_REDEEM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code, verifier, client: options.client }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!response.ok) return null
      const result = (await response.json()) as { owner?: unknown; client?: unknown }
      if (result.owner !== 'system-owner' || result.client !== options.client) return null
      const userId = await options.ownerUser(ctx)
      return userId ? { userId } : null
    },
  })
}
