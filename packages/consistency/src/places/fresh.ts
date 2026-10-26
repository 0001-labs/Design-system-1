/**
 * Keeping a place's data current without a Reload button (Design system 1: data is read on entry, after changes and
 * on returning). A place is told to read again when it is shown again (the app hides a place it leaves, never taking
 * it out of the page), when the window has the focus again, and when the tab is visible again, while it is shown.
 */
export function readWhenShown(element: HTMLElement, read: () => void): () => void {
  const shown = () => element.isConnected && !element.hidden && document.visibilityState !== 'hidden';
  const again = () => { if (shown()) read(); };
  const hidden = new MutationObserver(() => { if (!element.hidden) again(); });
  hidden.observe(element, { attributes: true, attributeFilter: ['hidden'] });
  addEventListener('focus', again);
  document.addEventListener('visibilitychange', again);
  return () => { hidden.disconnect(); removeEventListener('focus', again); document.removeEventListener('visibilitychange', again); };
}

/** A value kept in this browser for the next visit's first paint; nothing when storage is out of reach. */
export const kept = {
  read<T>(key: string): T | undefined { try { const value = localStorage.getItem(key); return value === null ? undefined : JSON.parse(value) as T; } catch { return undefined; } },
  write(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* read again next visit */ } },
};
