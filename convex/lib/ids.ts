/**
 * Crockford base32, lowercase: 0-9 and a-z minus i, l, o and u.
 *
 * The excluded letters are the ones that get misread as digits when someone
 * copies an id out of a support ticket. `services/src/shared/keys.ts` validates
 * against exactly this alphabet, so the two must stay in step.
 */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/** 20 characters = 96 bits. Opaque, never derived from the library name. */
const PUBLIC_ID_LENGTH = 20;

/**
 * Generate the `/ds1/{publicId}/` path segment.
 *
 * Deliberately unguessable rather than a friendly slug: a URL like
 * `/ds1/acme-brand/` leaks the customer's identity to anyone who reads their
 * page source, and it creates a namespace people can squat. The human-readable
 * `slug` lives separately and never leaves the dashboard.
 *
 * `byte % 32` is already uniform because 32 divides 256 exactly. The rejection
 * step below is therefore a no-op today — it exists so that changing ALPHABET
 * to a length that is not a power of two cannot silently introduce modulo bias.
 */
export function generatePublicId(): string {
  const limit = 256 - (256 % ALPHABET.length);
  const out: string[] = [];

  while (out.length < PUBLIC_ID_LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(PUBLIC_ID_LENGTH))) {
      if (out.length >= PUBLIC_ID_LENGTH) break;
      if (byte >= limit) continue;
      out.push(ALPHABET[byte % ALPHABET.length]!);
    }
  }

  return out.join("");
}

/** Dashboard-only URL segment, derived from the library name. */
export function slugify(name: string): string {
  const base = name
    .normalize("NFKD")
    // Strip combining diacritical marks left behind by NFKD.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base === "" ? "library" : base;
}

/** Append -2, -3, … until the slug is free for this owner. */
export function uniqueSlug(candidate: string, taken: ReadonlySet<string>): string {
  if (!taken.has(candidate)) return candidate;

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const next = `${candidate}-${suffix}`;
    if (!taken.has(next)) return next;
  }

  throw new Error("Could not find a free slug.");
}

export function isValidLibraryName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 60;
}
