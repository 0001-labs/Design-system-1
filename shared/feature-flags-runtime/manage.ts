import type { ReleaseRule } from './index';
import { mountAudienceMatrix } from './matrix';
export type ManagedFlag = ReleaseRule & { key: string; label: string; description?: string; inherited?: boolean };
export type FlagsAdapter = { manage(): Promise<ManagedFlag[]>; set(value: ReleaseRule & { key: string }): Promise<unknown> };
/**
 * Shared management content: the flags matrix (matrix.ts), styled by
 * matrix.css. The host supplies its authenticated transport and DS1 styles.
 */
export async function mountFlags(host: HTMLElement, adapter: FlagsAdapter): Promise<() => void> {
  let disposed = false;
  const title = document.createElement('h1'); title.className = 'flags-title'; title.textContent = 'Flags';
  const status = document.createElement('p'); status.setAttribute('role', 'status'); status.textContent = 'Loading…';
  const body = document.createElement('div');
  host.replaceChildren(title, status, body);
  try {
    const flags = await adapter.manage();
    if (disposed) return () => {};
    status.remove();
    mountAudienceMatrix(body, flags, value => value === undefined ? adapter.manage() : adapter.set(value as ReleaseRule & { key: string }));
  } catch { if (!disposed) status.textContent = 'Feature flags are available to the product owner. Sign in with the owner account and try again.'; }
  return () => { disposed = true; host.replaceChildren(); };
}
