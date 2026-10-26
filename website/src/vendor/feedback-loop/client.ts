/**
 * The Feedback loop's browser client: the one file a product copies (through
 * Sync 1, with events.ts) to report what people do to System. It is small,
 * has no dependencies beyond IDv1's expanded version in `idv1/`, copied with
 * it, starts after the page has loaded and never blocks it. Each session is an
 * IDv1 event code (`k3Rw9Q`), told apart on sight from every account, list
 * and item; a session begun before kept its longer random id.
 *
 *   import { startFeedbackLoop } from './vendor/feedback-loop/client';
 *   const loop = startFeedbackLoop({ product: 'ezo', account: () => user?.ezoId ?? null, version });
 *   loop.step('list created', { items: 3 });
 *   loop.ask('page-relevant', 'Is this page useful to you?', ['Yes', 'No']);
 *
 * What it records on its own: the page seen (path only, never query or
 * fragment), every press on a control (its role and accessible name, never an
 * input's value), changes to fields (the field's name, never what was typed),
 * uncaught errors and rejections (message and bounded stack frames), and the leave.
 * Once per page load it also measures what the load cost (`perf`): the bytes of
 * JavaScript, style sheets, fonts, images and everything fetched, the requests,
 * first- and third-party JavaScript, time to first byte, DOMContentLoaded, load,
 * First and Largest Contentful Paint, Cumulative Layout Shift and Interaction to
 * Next Paint, with the standard Performance APIs; numbers only, never an address.
 * It stops for Do Not Track and Global Privacy Control, for `?ph=out` (the
 * studio's opt-out) and when the product's `enabled` says so. A tester opens
 * the product with `?feedback-tester=<name>` (Grok Bot's black box does): the
 * tab keeps the name for its session and sends it, and System lists the
 * session as that tester's test and leaves it out of every figure.
 *
 * With `replay`, it also loads System's session recorder (replay.ts, served
 * from the endpoint's origin) for that share of sessions: a recording of the
 * page's layout, pointer and scrolling with every text masked, but for the
 * words of the product's public pages (elements marked `data-feedback-public`)
 * while nobody is signed in.
 */
import { hashEmail, PERF_KIND, PERF_NETS, TESTER, type FeedbackBatch, type FeedbackEvent } from './events';
import { isStaleImportError } from './stale-reload';
import { errorOutbox } from './error-outbox';
import { eventCodeCandidate } from './idv1/advanced';

export interface FeedbackLoopOptions {
  /** The product's System inventory id. */
  product: string;
  /** Where batches go; System's Worker by default. */
  endpoint?: string;
  /** The signed-in person's opaque account id, read at each flush; never an email. */
  account?: () => string | null | undefined;
  /** The signed-in person's email, read at each flush and sent only as its SHA-256, so the owner's own emails are left out of the figures. */
  email?: () => string | null | undefined;
  /** A code the product minted for this browser (an IDv1 account-shaped code kept in its own storage), used as the visitor id in place of the loop's own, so the Feedback page shows the product's visitors by the same codes the product does. */
  visitor?: () => string | null | undefined;
  /** The product's released version. */
  version?: string;
  /** A product's own gate, read at start: false stops everything. */
  enabled?: () => boolean;
  /** Keep errors for acknowledged delivery, including after reconnect or reload. */
  durableErrors?: boolean;
  /** Record presses and changes automatically (default true). */
  autocapture?: boolean;
  /** Elements matching this selector are never named in events (their label becomes "private"). */
  privateSelector?: string;
  /** Milliseconds between flushes (default 5000). */
  interval?: number;
  /** Record sessions, all text masked: true for every session, or the share of sessions to record (0 to 1). Off by default. */
  replay?: boolean | number;
  /** Measure what each page load cost and how fast it was (default true); sent once, on the page's first hide or a minute after it settled. */
  performance?: boolean;
}

export interface FeedbackLoop {
  /** A step the product names itself: "invoice made", "list shared". */
  step(name: string, props?: FeedbackEvent['props']): void;
  /** The page changed inside the app; the client also watches pushState and popstate. */
  page(path?: string): void;
  /** An error the product caught itself. */
  error(error: unknown, props?: FeedbackEvent['props']): void;
  /** Record a survey answer the product collected with its own prompt. */
  answer(key: string, answer: string, props?: FeedbackEvent['props']): void;
  /** Draw the default prompt for a one-question survey and record the choice; resolves with it, or null when dismissed. */
  ask(key: string, question: string, choices: string[], options?: { once?: boolean }): Promise<string | null>;
  /** Send what is queued now. */
  flush(): void;
  /** Stop recording and sending. */
  stop(): void;
  readonly session: string;
  readonly visitor: string;
}

/** How long a failed part of the app waits to be recorded, so a document reloaded for a publish never reports it. */
const STALE_IMPORT_GRACE = 2_000;
const DEFAULT_ENDPOINT = 'https://system.0001.dev/api/feedback/events';
const VISITOR_KEY = 'feedback-loop:visitor';
const SESSION_KEY = 'feedback-loop:session';
const OUT_KEY = 'feedback-loop:out';
const ASKED_PREFIX = 'feedback-loop:asked:';
const REPLAY_KEY = 'feedback-loop:replay';
const TESTER_KEY = 'feedback-loop:tester';

const id = () => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
};

const storage = (area: Storage, key: string, make: () => string): string => {
  try {
    const existing = area.getItem(key);
    if (existing && /^[A-Za-z0-9_-]{1,64}$/.test(existing)) return existing;
    const fresh = make();
    area.setItem(key, fresh);
    return fresh;
  } catch {
    return make();
  }
};

function allowed(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === '1' || nav.globalPrivacyControl) return false;
  try {
    const choice = new URLSearchParams(location.search).get('ph');
    if (choice === 'out') localStorage.setItem(OUT_KEY, '1');
    if (choice === 'in') localStorage.removeItem(OUT_KEY);
    return localStorage.getItem(OUT_KEY) !== '1';
  } catch {
    return true;
  }
}

const path = () => location.pathname || '/';

/** The tester this tab's session belongs to: `?feedback-tester=<name>` on any of its pages, kept for the session. */
function testerOf(): string | null {
  try {
    const given = new URLSearchParams(location.search).get('feedback-tester')?.trim();
    if (given && TESTER.test(given)) sessionStorage.setItem(TESTER_KEY, given);
    const kept = sessionStorage.getItem(TESTER_KEY);
    return kept && TESTER.test(kept) ? kept : null;
  } catch {
    return null;
  }
}

/** A control's accessible name, cut short, with no input values and nothing from a private element. */
export function describeControl(target: Element, privateSelector?: string): { name: string; role: string } | null {
  const control = target.closest('a, button, [role="button"], [role="menuitem"], [role="tab"], [role="switch"], [role="checkbox"], [role="option"], input, select, textarea, summary, label, [data-feedback]');
  if (!control) return null;
  if (privateSelector && control.closest(privateSelector)) return { name: 'private', role: control.tagName.toLowerCase() };
  const tag = control.tagName.toLowerCase();
  const role = control.getAttribute('role') || (tag === 'a' ? 'link' : tag === 'input' ? `input:${(control as HTMLInputElement).type || 'text'}` : tag);
  const own = control.getAttribute('data-feedback') || control.getAttribute('aria-label') || control.getAttribute('title') || control.getAttribute('name') || control.id;
  let name = own || '';
  if (!name && tag !== 'input' && tag !== 'textarea' && tag !== 'select') name = (control.textContent || '').replace(/\s+/g, ' ').trim();
  if (!name && tag === 'a') name = control.getAttribute('href') || '';
  if (!name) {
    const labelled = control.getAttribute('aria-labelledby');
    const label = labelled ? document.getElementById(labelled) : control.closest('label');
    name = (label?.textContent || '').replace(/\s+/g, ' ').trim();
  }
  if (!name) name = control.querySelector('svg use')?.getAttribute('href')?.replace(/^.*#/, '') || `${tag}${control.className ? '.' + String(control.className).split(/\s+/)[0] : ''}`;
  return { name: name.slice(0, 80), role };
}

export function startFeedbackLoop(options: FeedbackLoopOptions): FeedbackLoop {
  const endpoint = options.endpoint || DEFAULT_ENDPOINT;
  const enabled = allowed() && (options.enabled ? options.enabled() : true);
  const minted = options.visitor?.();
  const visitor = minted && /^[A-Za-z0-9_-]{1,64}$/.test(minted) ? minted : storage(localStorage, VISITOR_KEY, id);
  const session = storage(sessionStorage, SESSION_KEY, () => eventCodeCandidate());
  const tester = testerOf();
  const queue: FeedbackBatch['events'] = [];
  let stopped = !enabled;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastPath = path();
  let errorStorage: Storage | undefined;
  try { errorStorage = localStorage; } catch {}
  const outbox = options.durableErrors ? errorOutbox(options.product, async batch => {
    if (stopped || !allowed()) return false;
    const response = await fetch(endpoint, { method: 'POST', body: JSON.stringify(batch), headers: { 'Content-Type': 'application/json' }, mode: 'cors', credentials: 'omit', keepalive: true, signal: AbortSignal.timeout(15000) });
    return response.ok;
  }, errorStorage) : null;
  if (!enabled) outbox?.stop(true);
  const retryErrors = () => { if (allowed()) void outbox?.flush(); else outbox?.stop(true); };
  const retryTimer = enabled && outbox ? setInterval(retryErrors, 30000) : null;
  // The email's hash, kept for the address last seen; computed off the flush so a beacon never waits for it.
  let person: { email: string; hash: string } | null = null;
  const hashPerson = () => {
    const email = options.email?.();
    if (!email) { person = null; return; }
    if (person?.email === email) return;
    void hashEmail(email).then(hash => { if (options.email?.() === email) person = { email, hash }; }).catch(() => {});
  };

  const push = (event: FeedbackBatch['events'][number]) => {
    if (stopped) return;
    if (outbox && event.kind === 'error') {
      outbox.add({ product: options.product, session, visitor, account: options.account?.() ?? null, person: person?.hash ?? null, version: options.version ?? null, tester, device: { ua: navigator.userAgent.slice(0, 200), width: innerWidth, height: innerHeight, scale: devicePixelRatio }, events: [event] });
      retryErrors();
      return;
    }
    queue.push(event);
    if (queue.length >= 20) flush();
    else if (!timer) timer = setTimeout(flush, options.interval ?? 5000);
  };
  const record = (kind: FeedbackEvent['kind'], name: string, props?: FeedbackEvent['props']) => {
    const event: FeedbackEvent = { kind, name: String(name).slice(0, 200), at: Date.now(), path: path() };
    if (props && Object.keys(props).length) event.props = props;
    push(event);
  };

  function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!queue.length) return;
    const events = queue.splice(0, 100);
    const email = options.email?.();
    const batch: FeedbackBatch = {
      product: options.product,
      session,
      visitor,
      account: options.account?.() ?? null,
      person: email && person?.email === email ? person.hash : null,
      version: options.version ?? null,
      tester,
      device: { ua: navigator.userAgent.slice(0, 200), width: innerWidth, height: innerHeight, scale: devicePixelRatio },
      events,
    };
    const body = JSON.stringify(batch);
    // The beacon survives the page closing; fetch with keepalive is the fallback.
    let sent = false;
    try { sent = navigator.sendBeacon?.(endpoint, new Blob([body], { type: 'application/json' })) ?? false; } catch { sent = false; }
    if (!sent) void fetch(endpoint, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' }, mode: 'cors', credentials: 'omit' }).catch(() => {});
    if (queue.length) timer = setTimeout(flush, 0);
    hashPerson();
  }

  let replay: { stop(): void } | null = null;
  /** Whether this session is recorded, decided once per session so every page of it agrees. */
  const sampled = () => {
    const share = options.replay === true ? 1 : typeof options.replay === 'number' ? options.replay : 0;
    if (share <= 0) return false;
    try {
      const kept = sessionStorage.getItem(REPLAY_KEY);
      if (kept) return kept === '1';
      const chosen = Math.random() < share;
      sessionStorage.setItem(REPLAY_KEY, chosen ? '1' : '0');
      return chosen;
    } catch { return Math.random() < share; }
  };
  const startReplay = () => {
    const base = new URL(endpoint);
    const recorder = new URL('/feedback/recorder.js', base).href;
    void import(/* @vite-ignore */ recorder).then((module: { startReplay(o: Record<string, unknown>): { stop(): void } }) => {
      if (stopped) return;
      replay = module.startReplay({
        endpoint: new URL('/api/feedback/replay', base).href,
        product: options.product,
        session,
        visitor,
        account: () => options.account?.() ?? null,
        person: () => { const email = options.email?.(); return email && person?.email === email ? person.hash : null; },
        privateSelector: options.privateSelector,
      });
    }).catch(() => {});
  };

  const onPress = (event: Event) => {
    const target = event.target as Element | null;
    if (!target || !(target instanceof Element)) return;
    const control = describeControl(target, options.privateSelector);
    if (control) record('press', control.name, { role: control.role });
  };
  const onChange = (event: Event) => {
    const target = event.target as Element | null;
    if (!target || !(target instanceof Element)) return;
    const control = describeControl(target, options.privateSelector);
    if (control) record('change', control.name, { role: control.role });
  };
  const onError = (event: ErrorEvent | PromiseRejectionEvent) => {
    const error = 'reason' in event ? event.reason : (event.error ?? event.message);
    const source = !('reason' in event) && !event.error && event.filename
      ? { stack: `at ${event.filename}:${event.lineno || 0}:${event.colno || 0}` } : undefined;
    // A part of the app that failed to load may only be gone because the site was published again:
    // stale-reload.ts then loads the document afresh within a moment, and a failure the page
    // recovered from is no failure. One it did not recover from is recorded after that moment.
    if (isStaleImportError(error)) { setTimeout(() => { if (!stopped) loop.error(error, source); }, STALE_IMPORT_GRACE); return; }
    loop.error(error, source);
  };
  // DS1 reports only explicitly classified failures. Never infer from a colour,
  // an alert role, console output or arbitrary text in the page.
  const onFailure = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (!detail || typeof detail.code !== 'string' || !/^[a-z][a-z0-9_.-]{0,79}$/.test(detail.code) || typeof detail.message !== 'string' || !detail.message.trim()) return;
    event.preventDefault();
    loop.error(new Error(detail.message.trim()), { source: 'ds1', failureCode: detail.code, online: navigator.onLine !== false, ...(typeof detail.stack === 'string' ? { stack: detail.stack } : {}) });
  };
  const onNavigate = () => {
    const now = path();
    if (now === lastPath) return;
    lastPath = now;
    record('page', now);
  };
  // What the load cost, measured from the start and sent once: on the first hide, when INP and CLS are final,
  // or a minute after the page settled while it stays open, so a tab kept for hours still reports.
  const loadPath = path();
  const measure = enabled && options.performance !== false ? measureLoad(endpoint) : null;
  let measured = false;
  const sendMeasure = () => {
    if (measured || !measure || stopped) return;
    measured = true;
    const props = measure.figures();
    measure.stop();
    if (Object.keys(props).length) push({ kind: PERF_KIND, name: loadPath, at: Date.now(), path: loadPath, props });
  };
  // Hidden: the person left (another tab or app, the phone locked, the page closing). Shown again: they came
  // back to the same page, which is not a new page view. Each is recorded once, however the browser repeats it.
  let hidden = document.visibilityState === 'hidden';
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      if (hidden) return;
      hidden = true;
      sendMeasure();
      record('leave', lastPath);
      flush();
    } else if (hidden) {
      hidden = false;
      record('return', lastPath);
    }
  };

  const loop: FeedbackLoop = {
    session,
    visitor,
    step: (name, props) => record('step', name, props),
    page: (to) => { lastPath = to ?? path(); record('page', lastPath); },
    error: (error, props) => {
      const message = error instanceof Error ? error.message : typeof error === 'string' ? error : (() => { try { return JSON.stringify(error); } catch { return String(error); } })();
      // Safari/Firefox start directly with a frame; V8 starts with the message.
      // Keep frames only, including stacks supplied by another realm or the DS1 handoff.
      const rawStack = typeof props?.stack === 'string' ? props.stack
        : error && typeof error === 'object' && 'stack' in error && typeof error.stack === 'string' ? error.stack : '';
      const stack = rawStack.split('\n').filter(line => /^\s*at\s/.test(line) || /@.*:\d+/.test(line))
        .slice(0, 8).join('\n').trim().slice(0, 500);
      const { stack: _stack, ...details } = props ?? {};
      record('error', (message || 'Unknown error').slice(0, 200), { ...details, ...(stack ? { stack } : {}) });
    },
    answer: (key, answer, props) => record('survey', key, { answer, ...props }),
    ask: (key, question, choices, askOptions) => askSurvey(loop, key, question, choices, askOptions),
    flush,
    stop: () => {
      stopped = true;
      outbox?.stop();
      if (retryTimer) clearInterval(retryTimer);
      window.removeEventListener('online', retryErrors);
      measure?.stop();
      replay?.stop();
      replay = null;
      if (timer) { clearTimeout(timer); timer = null; }
      queue.length = 0;
      document.removeEventListener('click', onPress, true);
      document.removeEventListener('change', onChange, true);
      window.removeEventListener('ds-failure', onFailure);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onError);
      window.removeEventListener('popstate', onNavigate);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
  if (!enabled) return loop;

  window.addEventListener('online', retryErrors);
  retryErrors();
  hashPerson();
  // A reload reads as one in the trace ("Reloaded"), not as the page opened afresh.
  const navigation = (performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined)?.type;
  record('page', lastPath, { ...(document.referrer ? { referrer: safeOrigin(document.referrer) } : {}), ...(navigation === 'reload' ? { navigation: 'reload' } : {}) });
  if (options.autocapture !== false) {
    document.addEventListener('click', onPress, true);
    document.addEventListener('change', onChange, true);
  }
  window.addEventListener('ds-failure', onFailure);
  const pending = (globalThis as unknown as Record<symbol, unknown>)[Symbol.for('design-system-1.pending-failures')];
  if (Array.isArray(pending)) for (const detail of pending.splice(0, 20)) onFailure(Object.assign(new Event('ds-failure'), { detail }));
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onError);
  window.addEventListener('popstate', onNavigate);
  document.addEventListener('visibilitychange', onVisibility);
  // Single-page apps change the address without a load: watch pushState and replaceState too.
  const history = window.history;
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = history[method];
    history[method] = function (this: History, ...args: Parameters<History['pushState']>) {
      const result = original.apply(this, args);
      queueMicrotask(onNavigate);
      return result;
    } as History['pushState'];
  }
  if (sampled()) startReplay();
  if (measure) settled(() => { const wait = setTimeout(sendMeasure, 60_000); measure.onStop(() => clearTimeout(wait)); });
  return loop;
}

/** Runs once the page has loaded and the browser is idle (or five seconds after the load at most). */
function settled(run: () => void) {
  const idle = () => ('requestIdleCallback' in window ? window.requestIdleCallback(() => run(), { timeout: 5000 }) : setTimeout(run, 1000));
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', () => idle(), { once: true });
}

type Shift = PerformanceEntry & { value: number; hadRecentInput: boolean };
type Interaction = PerformanceEntry & { interactionId?: number };

/**
 * Watches the page load with PerformanceObserver (buffered, so what happened
 * before the client started counts) and, when asked, writes its figures:
 * bytes and requests from the navigation and resource entries, the paints,
 * the largest layout shift window and the slowest interaction but one in
 * fifty (INP). Hosts are counted, never named; the Feedback loop's own
 * requests are left out. Null where the browser has no PerformanceObserver.
 */
function measureLoad(endpoint: string): { figures(): Record<string, number | string>; stop(): void; onStop(run: () => void): void } | null {
  if (typeof performance === 'undefined' || typeof PerformanceObserver === 'undefined' || !performance.getEntriesByType) return null;
  let fcp = 0, lcp = 0, cls = 0, windowValue = 0, windowFirst = 0, windowLast = 0;
  const interactions = new Map<number, number>();
  const observers: PerformanceObserver[] = [];
  const stops: (() => void)[] = [];
  const watched = new Set<string>();
  const observe = (type: string, handle: (entries: PerformanceEntry[]) => void, extra: Record<string, unknown> = {}) => {
    try {
      if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return;
      watched.add(type);
      const observer = new PerformanceObserver(list => handle(list.getEntries()));
      observer.observe({ type, buffered: true, ...extra } as PerformanceObserverInit);
      observers.push(observer);
    } catch { /* an entry type this browser does not give */ }
  };
  const nav = () => performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  // A prerendered page counts from when it was shown.
  const since = (at: number) => Math.max(0, at - ((nav() as (PerformanceNavigationTiming & { activationStart?: number }) | undefined)?.activationStart ?? 0));
  observe('paint', entries => { for (const entry of entries) if (entry.name === 'first-contentful-paint') fcp = since(entry.startTime); });
  observe('largest-contentful-paint', entries => { const last = entries[entries.length - 1]; if (last) lcp = since(last.startTime); });
  observe('layout-shift', entries => {
    for (const entry of entries as Shift[]) {
      if (entry.hadRecentInput) continue;
      // Shifts less than a second apart, within five seconds, are one window; CLS is the largest window.
      if (windowValue && entry.startTime - windowLast < 1000 && entry.startTime - windowFirst < 5000) windowValue += entry.value;
      else { windowValue = entry.value; windowFirst = entry.startTime; }
      windowLast = entry.startTime;
      cls = Math.max(cls, windowValue);
    }
  });
  const interact = (entries: PerformanceEntry[]) => {
    for (const entry of entries as Interaction[]) if (entry.interactionId) interactions.set(entry.interactionId, Math.max(interactions.get(entry.interactionId) ?? 0, entry.duration));
  };
  observe('event', interact, { durationThreshold: 40 });
  observe('first-input', interact);

  const own = new URL('/api/feedback/', endpoint).href;
  const site = (host: string) => host.split('.').slice(-2).join('.');
  const figures = () => {
    const out: Record<string, number | string> = {};
    const page = nav();
    let js = 0, css = 0, font = 0, img = 0, total = 0, sent = 0, jsFirst = 0, jsThird = 0, requests = 0, scripts = 0;
    const hosts = new Set<string>();
    if (page) { total += page.encodedBodySize || 0; sent += page.transferSize || 0; requests++; }
    const home = site(location.hostname);
    for (const entry of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
      if (entry.name.startsWith(own)) continue;
      let url: URL;
      try { url = new URL(entry.name); } catch { continue; }
      if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
      requests++;
      const size = entry.encodedBodySize || entry.transferSize || 0;
      total += size;
      sent += entry.transferSize || 0;
      const type = (entry as PerformanceResourceTiming & { contentType?: string }).contentType || '';
      const file = url.pathname.toLowerCase();
      const first = url.hostname === location.hostname || site(url.hostname) === home;
      if (!first) hosts.add(url.hostname);
      if (/javascript|ecmascript/.test(type) || entry.initiatorType === 'script' || /\.m?js$/.test(file)) {
        js += size; scripts++;
        if (first) jsFirst += size; else jsThird += size;
      } else if (/css/.test(type) || /\.css$/.test(file)) css += size;
      else if (/^font\//.test(type) || /\.(woff2?|ttf|otf|eot)$/.test(file)) font += size;
      else if (/^image\//.test(type) || entry.initiatorType === 'img' || entry.initiatorType === 'image' || /\.(png|jpe?g|gif|webp|avif|svg|ico)$/.test(file)) img += size;
    }
    Object.assign(out, { js, css, font, img, total, sent, jsFirst, jsThird, requests, scripts, hosts: hosts.size });
    if (page) {
      if (page.responseStart > 0) out.ttfb = Math.round(since(page.responseStart));
      if (page.domContentLoadedEventEnd > 0) out.dcl = Math.round(since(page.domContentLoadedEventEnd));
      if (page.loadEventEnd > 0) out.load = Math.round(since(page.loadEventEnd));
      out.cached = page.transferSize === 0 && page.encodedBodySize > 0 ? 1 : 0;
    }
    if (fcp) out.fcp = Math.round(fcp);
    if (lcp) out.lcp = Math.round(lcp);
    // A browser without layout shifts (Safari, Firefox) sends no CLS rather than a perfect one.
    if (watched.has('layout-shift')) out.cls = Math.round(cls * 10_000) / 10_000;
    if (interactions.size) {
      // INP: the slowest interaction, but one in fifty left out for every fifty, as the browser's own report does.
      const slowest = [...interactions.values()].sort((a, b) => b - a);
      out.inp = Math.round(slowest[Math.min(slowest.length - 1, Math.floor(interactions.size / 50))]);
    }
    const net = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType;
    if (net && (PERF_NETS as readonly string[]).includes(net)) out.net = net;
    return out;
  };
  return {
    figures,
    stop: () => { for (const observer of observers.splice(0)) observer.disconnect(); for (const run of stops.splice(0)) run(); },
    onStop: run => { stops.push(run); },
  };
}

function safeOrigin(url: string): string {
  try { return new URL(url).origin; } catch { return 'unknown'; }
}

/**
 * The default survey prompt: a label in the toast's place (one square from the
 * foot and the end edge, the ink's colours, one control high a line, as wide as
 * its words up to sixteen squares), the question on its first line, the choices
 * as underlined words on the next, and a close. It records the choice as a
 * `survey` event under `key` and asks each key once per browser unless
 * `once: false`.
 */
async function askSurvey(loop: FeedbackLoop, key: string, question: string, choices: string[], options?: { once?: boolean }): Promise<string | null> {
  const once = options?.once !== false;
  try { if (once && localStorage.getItem(ASKED_PREFIX + key)) return null; } catch {}
  if (typeof document === 'undefined') return null;
  return new Promise(resolve => {
    const unit = `calc(20px * var(--sf, var(--ds-sf, 1)))`;
    const control = `calc(16px * var(--sf, var(--ds-sf, 1)))`;
    const root = document.createElement('div');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', question);
    root.style.cssText = `position:fixed;right:${unit};bottom:${unit};z-index:2147483000;max-width:calc(16 * ${unit});padding:calc(4px * var(--sf, var(--ds-sf, 1)));box-sizing:border-box;background:var(--ds-tooltip-background, light-dark(#1e1e1e, #f5f5f5));color:var(--ds-tooltip-color, light-dark(#fff, #1e1e1e));font:14px/${control} var(--ds-typeface-regular, var(--font-regular, system-ui));border-radius:4px;display:grid;gap:0;`;
    const text = document.createElement('div');
    text.textContent = question;
    text.style.cssText = `line-height:${control};padding-right:${control};`;
    const row = document.createElement('div');
    row.style.cssText = `display:flex;gap:calc(8px * var(--sf, var(--ds-sf, 1)));line-height:${control};`;
    const finish = (answer: string | null) => {
      root.remove();
      try { if (once) localStorage.setItem(ASKED_PREFIX + key, '1'); } catch {}
      if (answer !== null) loop.answer(key, answer, { question: question.slice(0, 200) });
      else loop.answer(key, '(dismissed)', { question: question.slice(0, 200) });
      resolve(answer);
    };
    for (const choice of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = choice;
      button.style.cssText = `all:unset;cursor:pointer;text-decoration:underline;text-underline-offset:2px;line-height:${control};color:inherit;font:inherit;`;
      button.addEventListener('click', () => finish(choice));
      row.appendChild(button);
    }
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.style.cssText = `all:unset;cursor:pointer;position:absolute;top:calc(4px * var(--sf, var(--ds-sf, 1)));right:calc(4px * var(--sf, var(--ds-sf, 1)));width:${control};height:${control};line-height:${control};text-align:center;color:inherit;font:inherit;`;
    close.addEventListener('click', () => finish(null));
    // appendChild rather than append: a product that types its Worker with workers-types has
    // HTMLRewriter's Element shadowing the DOM's append.
    root.appendChild(text);
    root.appendChild(row);
    root.appendChild(close);
    document.body.appendChild(root);
  });
}
