/**
 * The Feedback loop's event model, shared by the browser client, the System
 * Worker and the System page. An event is one thing a person did or met in a
 * product: a page seen, a control pressed, an error, a survey answer, or a
 * step the product names itself. Together, in order, a session's events are
 * the trace that says where someone fell short, without a screen recording.
 *
 * Nothing here carries content or identity beyond an opaque account id the
 * product chooses: no input values, no text of what is on screen, no email.
 */

/**
 * `leave` is the tab hidden (another tab or app, the phone locked, the page closed or reloaded) and
 * `return` the same tab shown again, so a trace reads "Left", "Came back" rather than leaving twice.
 * A reload is a `page` with `navigation: 'reload'` in its props. A Worker older than `return`
 * refuses a batch carrying it: deploy System before a product takes a client that sends it.
 */
export const EVENT_KINDS = ['page', 'press', 'change', 'error', 'survey', 'step', 'leave', 'return'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export interface FeedbackEvent {
  /** What happened; see EVENT_KINDS. */
  kind: EventKind;
  /** The event's name: a page's path, a control's label, an error's message, a survey's key, a step's name. */
  name: string;
  /** Milliseconds since the epoch, on the device. */
  at: number;
  /** The page's path when it happened, without query or fragment. */
  path: string;
  /** Small, flat details: a survey's answer, a control's role, an error's bounded stack trace. */
  props?: Record<string, string | number | boolean | null>;
}

/**
 * What one page load cost, measured once in the browser with the standard
 * Performance APIs and sent through the same batches: numbers only, never an
 * address. It is kept apart from the trace (store's `perf` table), so the
 * kinds above stay the trace's kinds.
 */
export const PERF_KIND = 'perf';
export interface PerfEvent {
  kind: typeof PERF_KIND;
  /** The path the page loaded on. */
  name: string;
  at: number;
  /** The path the page loaded on, without query or fragment. */
  path: string;
  /** The figures, by PERF_METRICS key; `net` is the connection's effective type. */
  props: Record<string, number | string>;
}

/**
 * A perf event's figures and what each one is, so the Worker can check them:
 * bytes (compressed, as sent: `encodedBodySize`, or `transferSize` where that
 * is all a browser gives), counts, milliseconds from the start of the
 * navigation, the layout shift score, and a 0 or 1 flag.
 */
export const PERF_METRICS = {
  /** JavaScript, style sheets, fonts, images and everything the page fetched, the document included. */
  js: 'bytes', css: 'bytes', font: 'bytes', img: 'bytes', total: 'bytes',
  /** What actually came over the network this load (`transferSize`): 0 for what the cache served. */
  sent: 'bytes',
  /** JavaScript from the page's own site, and from other hosts. */
  jsFirst: 'bytes', jsThird: 'bytes',
  /** Requests, the document included; of them, scripts; how many other hosts were asked, never which. */
  requests: 'count', scripts: 'count', hosts: 'count',
  /** Time to first byte, DOMContentLoaded, load, First and Largest Contentful Paint, Interaction to Next Paint. */
  ttfb: 'ms', dcl: 'ms', load: 'ms', fcp: 'ms', lcp: 'ms', inp: 'ms',
  /** Cumulative Layout Shift, the largest session window. */
  cls: 'score',
  /** 1 when the document came from the browser's cache (its transferSize was 0): a repeat visit. */
  cached: 'flag',
} as const;
export type PerfMetric = keyof typeof PERF_METRICS;
/** The connection's effective type, as the Network Information API names it. */
export const PERF_NETS = ['slow-2g', '2g', '3g', '4g'] as const;
const PERF_MAX = { bytes: 10_000_000_000, count: 100_000, ms: 3_600_000, score: 100, flag: 1 } as const;

export interface FeedbackBatch {
  /** The product's id, as registered in System's inventory (`ezo`, `link`, `money`…). */
  product: string;
  /** A random id for this tab's visit; a new one when the tab is opened again. */
  session: string;
  /** A random id for this browser, kept in local storage; never derived from a person. */
  visitor: string;
  /** The product's opaque account id for the signed-in person, or null when signed out. */
  account: string | null;
  /** SHA-256 of the signed-in person's lowercase email, hex, so the owner's own emails can be left out; never the email. */
  person?: string | null;
  /** The product's released version, when it knows one. */
  version?: string | null;
  /** A tester's name, from `?feedback-tester=` on one of the session's pages: the session is listed as a test and never counted. */
  tester?: string | null;
  /** The device: a short user-agent summary and the viewport in CSS pixels. */
  device?: { ua?: string; width?: number; height?: number; scale?: number };
  /** The trace's events, and at most a page load's measurement (`perf`) among them. */
  events: (FeedbackEvent | PerfEvent)[];
}

export const LIMITS = {
  batchBytes: 64 * 1024,
  batchEvents: 100,
  name: 200,
  path: 300,
  propKeys: 12,
  propValue: 500,
  id: 64,
  ua: 200,
  /** The most keys a perf event's props may carry; the known ones (PERF_METRICS and `net`) are kept, any other dropped. */
  perfKeys: 24,
} as const;

const ID = /^[A-Za-z0-9_-]{1,64}$/;
/** A tester's name as an address carries it: letters, digits, spaces, dots, dashes and underscores, starting with a letter or digit. */
export const TESTER = /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,39}$/;
const PRODUCT = /^[a-z0-9-]{1,32}$/;

const text = (value: unknown, max: number): string | null =>
  typeof value === 'string' && value.length > 0 && value.length <= max ? value : null;

function props(value: unknown): Record<string, string | number | boolean | null> | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('props must be an object');
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > LIMITS.propKeys) throw new Error('too many props');
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of entries) {
    if (!/^[A-Za-z0-9_.:-]{1,40}$/.test(key)) throw new Error('bad prop key');
    if (item === null || typeof item === 'boolean') out[key] = item;
    else if (typeof item === 'number' && Number.isFinite(item)) out[key] = item;
    else if (typeof item === 'string') out[key] = item.length > LIMITS.propValue ? item.slice(0, LIMITS.propValue) : item;
    else throw new Error('bad prop value');
  }
  return out;
}

/** Checks one event from the network, returning a clean copy or throwing. */
export function parseEvent(value: unknown, now = Date.now()): FeedbackEvent {
  if (!value || typeof value !== 'object') throw new Error('event must be an object');
  const event = value as Record<string, unknown>;
  if (!EVENT_KINDS.includes(event.kind as EventKind)) throw new Error('unknown event kind');
  const name = text(event.name, LIMITS.name);
  if (!name) throw new Error('event needs a name');
  const path = text(event.path, LIMITS.path) ?? '/';
  const at = typeof event.at === 'number' && Number.isFinite(event.at) ? event.at : now;
  // A device clock far off is clamped to now, so a trace keeps its order and a chart its day.
  const clamped = at > now + 60_000 || at < now - 30 * 24 * 3600_000 ? now : Math.round(at);
  const cleaned: FeedbackEvent = { kind: event.kind as EventKind, name, at: clamped, path };
  const details = props(event.props);
  if (details && Object.keys(details).length) cleaned.props = details;
  return cleaned;
}

/**
 * Checks a page load's measurement from the network, returning a clean copy
 * or throwing. Figures it does not know, and values that are not plausible
 * numbers of their sort, are dropped rather than refusing the batch, so a
 * newer client's figure never costs the trace it travels with.
 */
export function parsePerf(value: unknown, now = Date.now()): PerfEvent {
  if (!value || typeof value !== 'object') throw new Error('event must be an object');
  const event = value as Record<string, unknown>;
  if (event.kind !== PERF_KIND) throw new Error('unknown event kind');
  const path = text(event.path, LIMITS.path) ?? text(event.name, LIMITS.path) ?? '/';
  const at = typeof event.at === 'number' && Number.isFinite(event.at) ? event.at : now;
  const clamped = at > now + 60_000 || at < now - 30 * 24 * 3600_000 ? now : Math.round(at);
  const raw = event.props;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('perf needs props');
  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length > LIMITS.perfKeys) throw new Error('too many props');
  const props: Record<string, number | string> = {};
  for (const [key, item] of entries) {
    if (key === 'net') { if (PERF_NETS.includes(item as (typeof PERF_NETS)[number])) props.net = item as string; continue; }
    if (!Object.prototype.hasOwnProperty.call(PERF_METRICS, key)) continue;
    const sort = PERF_METRICS[key as PerfMetric];
    const number = typeof item === 'boolean' && sort === 'flag' ? Number(item) : item;
    if (typeof number !== 'number' || !Number.isFinite(number) || number < 0 || number > PERF_MAX[sort]) continue;
    props[key] = sort === 'score' ? Math.round(number * 10_000) / 10_000 : sort === 'flag' ? (number ? 1 : 0) : Math.round(number);
  }
  return { kind: PERF_KIND, name: path, at: clamped, path, props };
}

/** Checks a whole batch from the network, returning a clean copy or throwing. */
export function parseBatch(value: unknown, now = Date.now()): FeedbackBatch {
  if (!value || typeof value !== 'object') throw new Error('batch must be an object');
  const batch = value as Record<string, unknown>;
  const product = typeof batch.product === 'string' && PRODUCT.test(batch.product) ? batch.product : null;
  if (!product) throw new Error('batch needs a product');
  const session = typeof batch.session === 'string' && ID.test(batch.session) ? batch.session : null;
  const visitor = typeof batch.visitor === 'string' && ID.test(batch.visitor) ? batch.visitor : null;
  if (!session || !visitor) throw new Error('batch needs session and visitor ids');
  const account = batch.account == null ? null : typeof batch.account === 'string' && ID.test(batch.account) ? batch.account : null;
  if (batch.account != null && account === null) throw new Error('bad account id');
  const person = batch.person == null ? null : typeof batch.person === 'string' && /^[a-f0-9]{64}$/.test(batch.person) ? batch.person : null;
  if (batch.person != null && person === null) throw new Error('bad person hash');
  if (!Array.isArray(batch.events)) throw new Error('batch needs events');
  if (batch.events.length === 0 || batch.events.length > LIMITS.batchEvents) throw new Error('bad event count');
  const device: FeedbackBatch['device'] = {};
  if (batch.device && typeof batch.device === 'object') {
    const d = batch.device as Record<string, unknown>;
    const ua = text(d.ua, LIMITS.ua);
    if (ua) device.ua = ua;
    for (const key of ['width', 'height', 'scale'] as const) {
      if (typeof d[key] === 'number' && Number.isFinite(d[key] as number)) device[key] = Math.round((d[key] as number) * 100) / 100;
    }
  }
  const version = text(batch.version, 40);
  const tester = typeof batch.tester === 'string' && TESTER.test(batch.tester) ? batch.tester : null;
  return { product, session, visitor, account, person, version, tester, device, events: batch.events.map(event => ((event as { kind?: unknown } | null)?.kind === PERF_KIND ? parsePerf(event, now) : parseEvent(event, now))) };
}

/** A short, stable summary of a user agent: browser and system, no version noise. */
export function summarizeUserAgent(ua: string): string {
  const system = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Other';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) && !/Chromium/.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  return `${browser} on ${system}`;
}

/** SHA-256 of a lowercase, trimmed email as hex: what the client sends as `person` and what the Worker compares excluded emails to. */
export async function hashEmail(email: string): Promise<string> {
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
}
