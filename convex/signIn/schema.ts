import { defineTable } from 'convex/server'
import { v } from 'convex/values'

/** The tables the shared sign-in keeps, spread into a product's schema beside Convex Auth's `authTables`. */
export const signInTables = {
  /** When a code was last sent to an address, for the one-a-minute limit. */
  signInCodes: defineTable({ email: v.string(), sentAt: v.number() }).index('by_email', ['email']),
  /** Apple's refresh tokens, revoked when the account is deleted. */
  appleRefreshTokens: defineTable({
    userId: v.id('users'), clientId: v.string(), refreshToken: v.string(),
    status: v.union(v.literal('active'), v.literal('pending')), attempts: v.number(), nextAttemptAt: v.number(),
  }).index('by_userId_and_clientId', ['userId', 'clientId']).index('by_status_and_nextAttemptAt', ['status', 'nextAttemptAt']),
  /** Digests of native identity tokens already used, until they expire. */
  appleIdentityUses: defineTable({ digest: v.string(), expiresAt: v.number() }).index('by_digest', ['digest']).index('by_expiresAt', ['expiresAt']),
}
