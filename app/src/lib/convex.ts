import { ConvexReactClient } from "convex/react";

/**
 * Vite inlines VITE_CONVEX_URL at build time from .env.local, which
 * `convex dev` maintains. A missing value is a build/config error rather than
 * something to paper over at runtime, so it fails loudly.
 */
const url = import.meta.env.VITE_CONVEX_URL as string | undefined;

if (!url) {
  throw new Error(
    "VITE_CONVEX_URL is not set. Run `vp exec convex dev` in the repo root to create .env.local.",
  );
}

export const convex = new ConvexReactClient(url);

/** Machine-readable failures thrown by convex/libraries.ts and convex/publish.ts. */
export interface ConvexFailure {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Read the structured payload out of a thrown ConvexError.
 *
 * Convex wraps application errors so the `data` field carries our
 * `{ code, message, details }`. Anything else — a network drop, a deploy skew,
 * a genuine bug — has no code and must not be mistaken for one.
 */
export function asFailure(error: unknown): ConvexFailure | null {
  const data = (error as { data?: unknown })?.data;
  if (data && typeof data === "object" && typeof (data as ConvexFailure).code === "string") {
    return data as ConvexFailure;
  }
  return null;
}

export function failureCode(error: unknown): string | null {
  return asFailure(error)?.code ?? null;
}
