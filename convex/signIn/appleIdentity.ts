import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'
import type { Environment } from './social'

/** The bundle IDs whose identity tokens the app accepts, from `APPLE_NATIVE_CLIENTS`, comma-separated. None means no native Apple sign-in. */
export function appleNativeClients(env: Environment): string[] {
  return (env.APPLE_NATIVE_CLIENTS ?? '').split(',').map((id) => id.trim()).filter(Boolean)
}

const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'))

export async function sha256(value: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Only Apple's signature and claims identify the account; client-supplied email and subject never do. */
export async function verifyAppleIdentityToken(token: string, nonce: string, clients: readonly string[], keys: JWTVerifyGetKey = appleKeys, now = new Date()) {
  if (!clients.length || !/^[a-f0-9]{64}$/.test(nonce) || token.length > 16_384) throw new Error('Invalid Apple sign-in')
  const { payload } = await jwtVerify(token, keys, {
    algorithms: ['RS256'], issuer: 'https://appleid.apple.com', audience: [...clients],
    requiredClaims: ['sub', 'aud', 'iat', 'exp', 'nonce'], maxTokenAge: '10 minutes', currentDate: now,
  })
  if (typeof payload.sub !== 'string' || !payload.sub || typeof payload.aud !== 'string' || !clients.includes(payload.aud) || payload.nonce !== (await sha256(nonce)))
    throw new Error('Invalid Apple sign-in')
  return {
    subject: payload.sub, clientId: payload.aud, expiresAt: payload.exp! * 1000,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
  }
}
