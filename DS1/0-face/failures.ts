/** A real operation failure, separate from validation, warnings and message colour.
 * Applications subscribe to `ds-failure`; this module never sends network requests.
 * Use an authored, stable code and summary, never user content or a server response.
 */
export interface Failure {
  code: string;
  message: string;
}
export const FAILURE_EVENT = "ds-failure";

/** Report a failed operation. Safe during server rendering; no DOM text is read. */
export function reportFailure(failure: Failure): void {
  if (typeof window === "undefined" || !/^[a-z][a-z0-9_.-]{0,79}$/.test(failure.code) || !failure.message.trim()) return;
  window.dispatchEvent(new CustomEvent<Failure>(FAILURE_EVENT, {
    detail: { code: failure.code, message: failure.message.trim().slice(0, 200) },
  }));
}
