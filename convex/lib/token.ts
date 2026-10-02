/** 32 bytes = 256 bits. Convex Auth treats anything under 24 chars as needing a second factor. */
const TOKEN_BYTES = 32;

/**
 * Generate a sign-in token.
 *
 * This MUST be a CSPRNG, and the reason is subtle enough to be worth stating.
 *
 * The default `authorize` on Convex Auth's Email provider requires the caller
 * to re-supply the email address that started the flow, which is what makes a
 * short 6-digit OTP safe — that is exactly how the sibling Consistency repo can
 * get away with `Math.floor(100000 + Math.random() * 900000)`.
 *
 * A magic link cannot re-supply the email, so `convex/auth.ts` sets
 * `authorize: undefined`. That removes the second factor and leaves the token
 * as the *sole* credential. At ~20 bits a six-digit code would then be
 * brute-forcible behind nothing but Convex Auth's built-in `authRateLimits`.
 * The provider's own docstring says it outright: "Make sure the token has high
 * enough entropy to be secure."
 */
export function generateMagicLinkToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
  return base64UrlEncode(bytes);
}

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Normalize an email to the form used as the identity key. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function isPlausibleEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return normalized.length <= 254 && EMAIL_PATTERN.test(normalized);
}
