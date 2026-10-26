/**
 * A part of the app asked for after the site was published again is gone:
 * every part is named by what it holds, and a document opened before the
 * publish still asks for the old names. The part then never arrives, and
 * what it draws stays empty. So when one fails to load and the site has
 * moved on, the document is loaded afresh, once, where it stands.
 *
 * A product copies this file through Sync 1 (the Feedback loop's `client`
 * export) and calls `reloadWhenStale()` once, as early as its entry runs.
 *
 * The site has moved on when a script this document runs, or the very part
 * that failed, is gone from it: answered 404, or with the site's HTML in a
 * script's place (a workspace host that falls back to its page, a redirect
 * to it). A part that failed for want of a connection, or a server that is
 * itself failing, leaves the page as it is; and the page is never reloaded
 * twice within a minute, so a publish that is itself broken cannot turn
 * the page round and round.
 *
 * Vite's own preload helper announces a failed part as `vite:preloadError`;
 * a dynamic import outside it fails as an uncaught rejection in the
 * browser's words (Safari's "Importing a module script failed.", Chrome's
 * "Failed to fetch dynamically imported module", Firefox's "error loading
 * dynamically imported module"), so both are listened for.
 */

const KEY = 'feedback-loop:stale-reload';
const ONCE_WITHIN = 60_000;

/** The hashed parts a build writes: Vite's `/assets/`, Astro's `/_astro/`. */
const ASSET_PATH = /\/(?:assets|_astro)\//;

const STALE_IMPORT_MESSAGE = /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Unable to preload CSS|Failed to load module script/i;

/** Whether an error is the browser failing to load a part of the app. */
export function isStaleImportError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' && STALE_IMPORT_MESSAGE.test(message);
}

/** The part that failed, when the browser names it in its message, as a path on this site. */
export function failedPart(error: unknown, origin = location.origin): string | null {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const named = message.match(/https?:\/\/[^\s'")]+/)?.[0];
  if (!named) return null;
  try {
    const url = new URL(named);
    return url.origin === origin && ASSET_PATH.test(url.pathname) ? url.pathname : null;
  } catch {
    return null;
  }
}

/** The module scripts this document runs, as their addresses name them. */
export function runningEntries(root: ParentNode = document, base = location.href): string[] {
  const paths = new Set<string>();
  for (const script of root.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')) {
    try {
      const url = new URL(script.getAttribute('src') ?? '', base);
      if (ASSET_PATH.test(url.pathname)) paths.add(url.pathname);
    } catch {
      // A script address the document cannot resolve names nothing.
    }
  }
  return [...paths];
}

/** Whether the site answered for a part it no longer has: 404, or its page where a script should be. */
export function partGone(answer: Response): boolean {
  if (answer.status === 404) return true;
  return answer.ok && /text\/html/i.test(answer.headers.get('content-type') ?? '');
}

/** Whether the site has been published again since this document was loaded: a part it runs is gone. */
export async function publishedAnew(parts: readonly string[], ask: typeof fetch = fetch): Promise<boolean> {
  const answers = await Promise.all(parts.map(async (part) => {
    try {
      return partGone(await ask(part, { method: 'HEAD', cache: 'no-store', credentials: 'omit' }));
    } catch {
      return false;
    }
  }));
  return answers.some(Boolean);
}

export type StaleReloadOptions = {
  /** The parts to ask about, besides the one that failed. By default the module scripts the document runs. */
  entries?: () => readonly string[];
  /** Where the failures are announced: `window`. */
  target?: EventTarget;
  ask?: typeof fetch;
  reload?: () => void;
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
  now?: () => number;
  origin?: string;
};

/** Load the document afresh when a part of it fails to load because the site was published again. Returns what stops listening. */
export function reloadWhenStale(options: StaleReloadOptions = {}): () => void {
  const target = options.target ?? window;
  const ask = options.ask ?? fetch;
  const reload = options.reload ?? (() => location.reload());
  const now = options.now ?? Date.now;
  const entries = options.entries ?? (() => runningEntries());
  const storage = options.storage === undefined ? sessionStorageIfAny() : options.storage;
  let asking = false;

  const reloadedLately = () => {
    if (!storage) return true;
    try { return now() - Number(storage.getItem(KEY) ?? 0) < ONCE_WITHIN; } catch { return true; }
  };

  const failed = (error: unknown) => {
    if (asking || reloadedLately()) return;
    asking = true;
    const part = failedPart(error, options.origin);
    const parts = [...new Set([...(part ? [part] : []), ...entries()])];
    void publishedAnew(parts, ask).then((stale) => {
      asking = false;
      if (!stale) return;
      try { storage?.setItem(KEY, String(now())); } catch { return; }
      reload();
    });
  };

  const onPreloadError = (event: Event) => failed((event as Event & { payload?: unknown }).payload);
  const onRejection = (event: Event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    if (isStaleImportError(reason)) failed(reason);
  };
  const onError = (event: Event) => {
    const error = (event as ErrorEvent).error ?? (event as ErrorEvent).message;
    if (isStaleImportError(error)) failed(error);
  };
  target.addEventListener('vite:preloadError', onPreloadError);
  target.addEventListener('unhandledrejection', onRejection);
  target.addEventListener('error', onError);
  return () => {
    target.removeEventListener('vite:preloadError', onPreloadError);
    target.removeEventListener('unhandledrejection', onRejection);
    target.removeEventListener('error', onError);
  };
}

function sessionStorageIfAny(): Storage | null {
  try { return typeof sessionStorage === 'undefined' ? null : sessionStorage; } catch { return null; }
}
