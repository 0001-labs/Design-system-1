import { v } from 'convex/values'
import { internalAction, internalMutation, internalQuery, type MutationCtx } from '../_generated/server'
import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import { appleClientSecret } from './appleSecret'
import { appleNativeClients, verifyAppleIdentityToken } from './appleIdentity'
import type { Environment } from './social'

/*
 * Apple's refresh tokens, kept per account and client so they can be revoked
 * when the account is deleted, as Apple requires of every app offering Sign in
 * with Apple. The web flow hands the token to the Apple provider's `profile`
 * (see `providers.ts`); the native flow exchanges the authorization code.
 * Client secrets are minted per call from the owner's signing key.
 */

export function appleTokenKeysConfigured(env: Environment): boolean {
  return Boolean(env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY)
}
async function secret(env: Environment, clientId: string) {
  return appleClientSecret({ teamId: env.APPLE_TEAM_ID!, keyId: env.APPLE_KEY_ID!, privateKey: env.APPLE_PRIVATE_KEY!, clientId, days: 1 })
}

/** Native codes are bound to the same subject, audience and nonce as the identity already verified. Null when the signing keys are not configured. */
export async function exchangeAppleCode(input: { code: string; nonce: string; subject: string; clientId: string }, env: Environment, verify = verifyAppleIdentityToken): Promise<string | null> {
  if (!appleTokenKeysConfigured(env)) return null
  if (!input.code || input.code.length > 4096) throw new Error('Apple authorization code is required')
  const response = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(15_000),
    body: new URLSearchParams({ client_id: input.clientId, client_secret: await secret(env, input.clientId), code: input.code, grant_type: 'authorization_code' }),
  })
  if (!response.ok) throw new Error('Unable to validate Apple authorization')
  const tokens = (await response.json()) as { refresh_token?: unknown; id_token?: unknown }
  if (typeof tokens.refresh_token !== 'string' || !tokens.refresh_token || typeof tokens.id_token !== 'string') throw new Error('Invalid Apple authorization response')
  const identity = await verify(tokens.id_token, input.nonce, appleNativeClients(env))
  if (identity.subject !== input.subject || identity.clientId !== input.clientId) throw new Error('Apple authorization does not match this account')
  return tokens.refresh_token
}

/** False means the owner's signing keys are not configured; the pending token is kept for later. */
export async function revokeAppleToken(clientId: string, refreshToken: string, env: Environment): Promise<boolean> {
  if (!appleTokenKeysConfigured(env)) return false
  const response = await fetch('https://appleid.apple.com/auth/revoke', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(15_000),
    body: new URLSearchParams({ client_id: clientId, client_secret: await secret(env, clientId), token: refreshToken, token_type_hint: 'refresh_token' }),
  })
  if (!response.ok) throw new Error('Unable to revoke Apple authorization')
  return true
}

export async function rememberAppleToken(ctx: MutationCtx, userId: Id<'users'>, clientId: string, refreshToken: string) {
  if (![process.env.AUTH_APPLE_ID, ...appleNativeClients(process.env)].filter(Boolean).includes(clientId) || !refreshToken || refreshToken.length > 16_384) throw new Error('Invalid Apple token')
  if (!(await ctx.db.get(userId))) throw new Error('Account no longer exists')
  const existing = await ctx.db.query('appleRefreshTokens').withIndex('by_userId_and_clientId', (q) => q.eq('userId', userId).eq('clientId', clientId)).unique()
  if (existing) await ctx.db.patch(existing._id, { refreshToken, status: 'active', attempts: 0, nextAttemptAt: 0 })
  else await ctx.db.insert('appleRefreshTokens', { userId, clientId, refreshToken, status: 'active', attempts: 0, nextAttemptAt: 0 })
}

/** For a product's `createOrUpdateUser` or `afterUserCreatedOrUpdated` callback: keeps the token the web Apple provider put on the profile. */
export async function rememberAppleTokenFromProfile(ctx: MutationCtx, userId: Id<'users'>, args: { type: string; provider?: { id: string }; profile: Record<string, unknown> }) {
  if (args.type === 'oauth' && args.provider?.id === 'apple' && typeof args.profile.appleRefreshToken === 'string' && typeof args.profile.appleClientId === 'string')
    await rememberAppleToken(ctx, userId, args.profile.appleClientId, args.profile.appleRefreshToken)
}

export const store = internalMutation({
  args: { userId: v.id('users'), clientId: v.string(), refreshToken: v.string() }, returns: v.null(),
  handler: async (ctx, args) => { await rememberAppleToken(ctx, args.userId, args.clientId, args.refreshToken); return null },
})

/** Call from account deletion. The token survives only until Apple confirms revocation; scheduled arguments carry its ID, never its secret. */
export async function scheduleAppleRevocation(ctx: MutationCtx, userId: Id<'users'>) {
  const tokens = await ctx.db.query('appleRefreshTokens').withIndex('by_userId_and_clientId', (q) => q.eq('userId', userId)).take(11)
  if (tokens.length > 10) throw new Error('Too many Apple connections for account deletion')
  for (const token of tokens) {
    await ctx.db.patch(token._id, { status: 'pending', nextAttemptAt: Date.now() })
    await ctx.scheduler.runAfter(0, internal.signIn.appleTokens.revoke, { id: token._id })
  }
}

export const pending = internalQuery({
  args: { id: v.id('appleRefreshTokens') },
  returns: v.union(v.null(), v.object({ clientId: v.string(), refreshToken: v.string(), attempts: v.number() })),
  handler: async (ctx, { id }) => {
    const token = await ctx.db.get(id)
    return token?.status === 'pending' ? { clientId: token.clientId, refreshToken: token.refreshToken, attempts: token.attempts } : null
  },
})
export const finish = internalMutation({
  args: { id: v.id('appleRefreshTokens'), revoked: v.boolean() }, returns: v.null(),
  handler: async (ctx, { id, revoked }) => {
    const token = await ctx.db.get(id)
    if (token?.status !== 'pending') return null
    if (revoked) await ctx.db.delete(id)
    else {
      const attempts = Math.min(token.attempts + 1, 20)
      await ctx.db.patch(id, { attempts, nextAttemptAt: Date.now() + Math.min(86_400_000, 60_000 * 2 ** attempts) })
    }
    return null
  },
})
export const revoke = internalAction({
  args: { id: v.id('appleRefreshTokens') }, returns: v.null(),
  handler: async (ctx, { id }) => {
    const token = await ctx.runQuery(internal.signIn.appleTokens.pending, { id })
    if (!token) return null
    let revoked = false
    try { revoked = await revokeAppleToken(token.clientId, token.refreshToken, process.env) } catch { /* Retry without logging credentials or provider response bodies. */ }
    await ctx.runMutation(internal.signIn.appleTokens.finish, { id, revoked })
    return null
  },
})
/** Hourly, from the product's crons. */
export const retry = internalMutation({
  args: {}, returns: v.null(),
  handler: async (ctx) => {
    const tokens = await ctx.db.query('appleRefreshTokens').withIndex('by_status_and_nextAttemptAt', (q) => q.eq('status', 'pending').lte('nextAttemptAt', Date.now())).take(50)
    for (const token of tokens) {
      await ctx.db.patch(token._id, { nextAttemptAt: Date.now() + 3_600_000 })
      await ctx.scheduler.runAfter(0, internal.signIn.appleTokens.revoke, { id: token._id })
    }
    return null
  },
})
