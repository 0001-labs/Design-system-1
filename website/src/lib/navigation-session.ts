import { clearNavigationCache, readNavigationCache, type NavigationSummary } from '../../../shared/navigation-cache';

/** Keep a tab's navigation warm across documents; start the hidden app only when needed. */
export function connectNavigationSession(frame: HTMLIFrameElement, publish: (summary: NavigationSummary) => void) {
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  let summary: NavigationSummary | null = null;
  let bridgeStarted = false;
  let generation = 0;
  let refresh: ReturnType<typeof setTimeout> | undefined;
  const startBridge = (restart = false) => {
    if (bridgeStarted && !restart) return;
    bridgeStarted = true;
    frame.src = '/app/navigation-auth';
  };
  const schedule = (expires: number) => {
    clearTimeout(refresh);
    refresh = setTimeout(() => {
      if (document.visibilityState !== 'hidden') startBridge();
    }, Math.max(0, expires - Date.now()));
  };
  const request = () => {
    if (summary) publish(summary);
    if (bridgeStarted) frame.contentWindow?.postMessage({ type: 'ds1:navigation-auth-request' }, location.origin);
  };
  const restore = async () => {
    const current = ++generation;
    const cached = await readNavigationCache();
    if (current !== generation || bridgeStarted) return;
    if (cached) { summary = cached.summary; publish(summary); schedule(cached.expires); }
    else startBridge();
  };
  const invalidate = () => {
    generation++;
    clearNavigationCache();
    clearTimeout(refresh);
    summary = { type: 'ds1:navigation-auth', authenticated: false, loading: false, owner: false, appComponents: [], companyName: '', libraries: [], librariesLoaded: false, creating: false, creationError: null };
    publish(summary);
    startBridge(true);
  };
  frame.addEventListener('load', request, options);
  window.addEventListener('ds1:navigation-auth-request', request, options);
  window.addEventListener('ds1:access-invalidated', invalidate, options);
  window.addEventListener('storage', event => {
    if (event.storageArea === localStorage && (event.key === null || event.key.startsWith('__convexAuthJWT_'))) invalidate();
  }, options);
  window.addEventListener('pageshow', () => { if (bridgeStarted) request(); else void restore(); }, options);
  window.addEventListener('focus', () => { if (bridgeStarted) request(); else void restore(); }, options);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'hidden' && !bridgeStarted) void restore(); }, options);
  const ready = restore();
  return {
    ready,
    dispose() { generation++; listeners.abort(); clearTimeout(refresh); },
    receive(detail: NavigationSummary) {
      generation++;
      if (detail.loading) return;
      summary = detail;
      publish(summary);
      // Once running, the bridge follows auth and library changes live.
      clearTimeout(refresh);
    },
  };
}
