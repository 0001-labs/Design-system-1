/**
 * Constant-time string comparison.
 *
 * Adapted from Consistency's `functions/api/_security.ts`, with the array
 * accesses made safe under `noUncheckedIndexedAccess`. Length is folded into
 * the accumulator rather than short-circuiting, so a wrong-length secret takes
 * the same path as a wrong-value one.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;

  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const length = Math.max(aBytes.length, bBytes.length);

  let diff = aBytes.length ^ bBytes.length;
  for (let index = 0; index < length; index += 1) {
    diff |= (aBytes[index] ?? 0) ^ (bBytes[index] ?? 0);
  }

  return diff === 0;
}

export async function sha256Hex(input: string | ArrayBuffer): Promise<string> {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Cloudflare sets CF-Connecting-IP; the rest are fallbacks for local runs. */
export function clientIp(request: Request): string {
  const direct = request.headers.get("cf-connecting-ip");
  if (direct) return direct;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";

  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Extract a bearer token, or null when the header is absent or malformed. */
export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() ?? null;
}
