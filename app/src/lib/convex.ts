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
