/**
 * R2 key layout for published library artifacts.
 *
 *   ds1/{publicId}/v/{n}.css      immutable, written once, never overwritten
 *   ds1/{publicId}/latest.css     mutable, a byte-for-byte copy of the live version
 *
 * `latest.css` is a full byte copy — NOT a redirect, NOT a metadata lookup.
 *
 * It costs ~20 KB of extra storage per library and it is the single decision
 * that makes the availability guarantee work: the assets Worker needs exactly
 * one R2 `get` and zero knowledge of anything else, so a Convex outage cannot
 * degrade a customer's stylesheet. Do not "optimize" this into a redirect.
 */

/**
 * Crockford base32, lowercase: 0-9 and a-z minus i, l, o, u.
 * 20 characters = 96 bits, opaque rather than a guessable slug.
 */
export const PUBLIC_ID_PATTERN = /^[0-9a-hjkmnp-tv-z]{20}$/;

/** Versions are positive integers; the bound keeps the path regex total. */
export const VERSION_PATTERN = /^[1-9][0-9]{0,8}$/;

export function isPublicId(value: string): boolean {
  return PUBLIC_ID_PATTERN.test(value);
}

/**
 * The base system's own folder, `ds1/base/`, written only by the owner's base saves
 * (services/src/base.ts). It is readable like a library and never a publish target.
 */
export const BASE_ID = "base";

export function isVersion(value: string): boolean {
  return VERSION_PATTERN.test(value);
}

export function versionKey(publicId: string, version: number | string): string {
  return `ds1/${publicId}/v/${version}.css`;
}

export function latestKey(publicId: string): string {
  return `ds1/${publicId}/latest.css`;
}

export interface ArtifactRef {
  publicId: string;
  /** `undefined` means the mutable `latest.css` pointer. */
  version?: number;
  key: string;
  immutable: boolean;
}

/**
 * Parse a public read path into an R2 key.
 *
 * Returns null for anything that is not an exact match. Because both segments
 * are validated against total patterns before being interpolated, no traversal
 * sequence (`..`, `%2e`, a leading slash, a backslash) can reach the key.
 */
export function parseArtifactPath(pathname: string, prefix = "/ds1"): ArtifactRef | null {
  if (!pathname.startsWith(`${prefix}/`)) return null;

  const segments = pathname.slice(prefix.length + 1).split("/");
  const publicId = segments[0];
  if (publicId === undefined || !(isPublicId(publicId) || publicId === BASE_ID)) return null;

  if (segments.length === 2 && segments[1] === "latest.css") {
    return { publicId, key: latestKey(publicId), immutable: false };
  }

  if (segments.length === 3 && segments[1] === "v" && segments[2]?.endsWith(".css")) {
    const raw = segments[2].slice(0, -".css".length);
    if (!isVersion(raw)) return null;
    return {
      publicId,
      version: Number(raw),
      key: versionKey(publicId, raw),
      immutable: true,
    };
  }

  return null;
}

/** Parse a write path: `/api/artifacts/{publicId}/v/{n}` or `/api/artifacts/{publicId}/latest`. */
export function parseWritePath(pathname: string, prefix = "/api/artifacts"): ArtifactRef | null {
  if (!pathname.startsWith(`${prefix}/`)) return null;

  const segments = pathname.slice(prefix.length + 1).split("/");
  const publicId = segments[0];
  if (publicId === undefined || !isPublicId(publicId)) return null;

  if (segments.length === 2 && segments[1] === "latest") {
    return { publicId, key: latestKey(publicId), immutable: false };
  }

  if (segments.length === 3 && segments[1] === "v" && segments[2] !== undefined) {
    if (!isVersion(segments[2])) return null;
    return {
      publicId,
      version: Number(segments[2]),
      key: versionKey(publicId, segments[2]),
      immutable: true,
    };
  }

  return null;
}
