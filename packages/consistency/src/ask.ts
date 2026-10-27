/**
 * Ask, in the editor: a small sheet with one field, Enter to send, the answer landed on the page as a
 * draft the person keeps or discards. The sheet calls `/api/consistency/ai` with the page's own
 * context; no provider credential is here. The route checks the answer against the vocabulary, and
 * the editor checks it again with the renderer's validator before it lands. A refusal shows its words
 * with Try again; a slow or failed answer leaves the page as it was.
 */
import { checkAskAnswer, type AskBlock, type AskContext, type AskDocument, type AskIntent, type AskLevel } from '../../../shared/consistency-ask';
import { validateNativePage, type NativePageDocument, type NativeSection } from '../../../shared/consistency-native-page';
import { createSurfaceContext } from './surface-context';
import type { Context } from '../../../DS1/3-unit/ds-context';
import type { Overlay } from '../../../DS1/4-page/ds-overlay';
import '../../../DS1/4-page/ds-overlay';
import '../../../DS1/2-core/ds-input';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-icon';
import '../../../DS1/2-core/ds-text';
import './ask.css';

/** The browser waits a little longer than the route's own generator time, so a route that answers late still lands. */
export const ASK_CLIENT_TIMEOUTS: Readonly<Record<AskLevel, number>> = { section: 50_000, page: 70_000 };
export const ASK_PLACEHOLDERS: Readonly<Record<AskLevel, string>> = { section: 'A hero with the Blue Raft photo and a Book button', page: 'A page about the floating shelter with prices and questions' };
const FAILED = 'Ask did not answer. Try again.';
export type AskAnswer = { level: 'section'; intent: AskIntent; block: NativeSection } | { level: 'page'; document: NativePageDocument };
export interface AskSiteContext { images: readonly string[]; collections: readonly string[]; runtimes: Readonly<Record<string, readonly string[]>>; site?: AskContext['site'] }
export interface AskSheetOptions {
  level: AskLevel;
  /** The page as it stands when the request is sent, and the block pressed at section level. */
  document: () => NativePageDocument; selected?: string;
  context: AskSiteContext;
  /** Lands the checked answer as a draft; the sheet closes once it has. */
  land: (answer: AskAnswer) => void;
  /** The transport, `fetch` unless a test gives another. */
  send?: (body: string, signal: AbortSignal) => Promise<Response>;
  timeout?: number;
}
const sendSameOrigin = (body: string, signal: AbortSignal) => fetch('/api/consistency/ai', { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, signal, body });
const ids = (document: NativePageDocument) => { const found: string[] = []; const visit = (blocks: AskBlock[]) => { for (const block of blocks) { found.push(block.id); if (block.children) visit(block.children); } }; visit(document.blocks as unknown as AskBlock[]); return found; };

/** The route's answer read as a draft, checked once more here with the renderer; refused in words when it cannot land. */
export function readAskAnswer(body: unknown, level: AskLevel, document: NativePageDocument, context: AskSiteContext): AskAnswer | string {
  if (!body || typeof body !== 'object') return FAILED;
  const answer = body as { level?: unknown; intent?: unknown; block?: unknown; document?: unknown };
  const checkContext: AskContext = { ...context, ids: ids(document), layout: document.layout, validate: value => validateNativePage(value, { images: context.images, collections: context.collections, runtimes: context.runtimes, bindings: [] }) };
  const checked = checkAskAnswer(level === 'section' ? answer.block : answer.document, level, checkContext);
  if (!checked.ok) return `Ask could not use the answer: ${checked.refusal}`;
  if (checked.level === 'section') return { level: 'section', intent: answer.intent === 'replace' ? 'replace' : 'make', block: checked.block as unknown as NativeSection };
  return { level: 'page', document: checked.document as unknown as NativePageDocument };
}

/** The sheet: one field, Enter to send, the field held and "Asking…" said while the answer is awaited. */
export function openAsk(options: AskSheetOptions): { close(): void } {
  const level = options.level, send = options.send ?? sendSameOrigin, timeout = options.timeout ?? ASK_CLIENT_TIMEOUTS[level];
  const overlay = document.createElement('ds-overlay') as Overlay; overlay.className = 'consistency-ask'; overlay.type = 'sheet'; overlay.nonModal = true; overlay.holdScroll = false; overlay.blockOutside = false; overlay.setAttribute('data-editor-chrome', '');
  const dialog = document.createElement('dialog'); dialog.setAttribute('aria-labelledby', 'consistency-ask-title');
  const header = document.createElement('header'); header.setAttribute('data-ds-overlay', 'header');
  const title = document.createElement('span'); title.id = 'consistency-ask-title'; title.setAttribute('data-ds-overlay', 'title'); title.textContent = level === 'page' ? 'Ask for the page' : 'Ask for a section'; header.append(title);
  const close = document.createElement('ds-button'); close.setAttribute('data-ds-overlay', 'close'); close.setAttribute('data-ds-overlay-dismiss', ''); close.setAttribute('icon', ''); close.setAttribute('label', 'Close');
  const closeIcon = document.createElement('ds-icon'); closeIcon.setAttribute('type', 'close'); close.append(closeIcon);
  const field = document.createElement('ds-input') as HTMLElement & { value: string; placeholder: string; disabled: boolean; focus(): void };
  field.setAttribute('aria-label', level === 'page' ? 'Ask for the page' : 'Ask for a section'); field.placeholder = ASK_PLACEHOLDERS[level]; field.setAttribute('enterkeyhint', 'send'); field.setAttribute('autocomplete', 'off');
  const status = document.createElement('div'); status.className = 'consistency-ask-status'; status.setAttribute('role', 'status'); status.hidden = true;
  const words = document.createElement('ds-text') as HTMLElement & { literal: boolean; text: string; tone: string; wrap: boolean }; words.literal = true; words.wrap = true;
  const again = document.createElement('ds-button'); again.setAttribute('secondary', ''); again.textContent = 'Try again'; again.hidden = true;
  status.append(words, again);
  dialog.append(header, close, field, status); overlay.append(dialog); document.body.append(overlay);
  let pending: AbortController | null = null, closed = false;
  const say = (text: string, tone: '' | 'danger', retry: boolean) => { status.hidden = !text; words.text = text; if (tone) words.setAttribute('tone', tone); else words.removeAttribute('tone'); again.hidden = !retry; };
  const finish = () => { if (closed) return; closed = true; pending?.abort(); pending = null; overlay.open = false; overlay.remove(); };
  const ask = async () => {
    const prompt = field.value.trim();
    if (!prompt || pending) return;
    const page = options.document(), controller = new AbortController(); pending = controller;
    const timer = setTimeout(() => controller.abort(), timeout);
    field.disabled = true; say('Asking…', '', false);
    let outcome: AskAnswer | string = FAILED;
    try {
      const response = await send(JSON.stringify({ kind: level, prompt, document: page, ...(level === 'section' && options.selected ? { selected: options.selected } : {}), images: options.context.images, collections: options.context.collections, runtimes: options.context.runtimes, ...(options.context.site ? { site: options.context.site } : {}) }), controller.signal);
      let body: unknown = null;
      try { body = await response.json(); } catch { body = null; }
      if (!response.ok) outcome = body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string' ? (body as { error: string }).error : FAILED;
      else outcome = readAskAnswer(body, level, page, options.context);
    } catch { outcome = FAILED; }
    finally { clearTimeout(timer); if (pending === controller) pending = null; }
    if (closed || controller.signal.aborted && typeof outcome !== 'string') return;
    if (typeof outcome === 'string') { field.disabled = false; say(outcome, 'danger', true); field.focus(); return; }
    options.land(outcome); finish();
  };
  field.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); void ask(); } });
  again.addEventListener('click', () => { say('', '', false); field.focus(); });
  overlay.addEventListener('ds-close-request', () => finish());
  void overlay.show().then(() => { if (!closed) field.focus(); });
  return { close: finish };
}

/** The bar over a landed draft: Keep leaves it as an edit, Discard takes it back; it follows the draft as the page moves and goes when the page changes under it. */
export function openDraftBar(options: { anchor: () => DOMRect | null; current: () => boolean; keep: () => void; discard: () => void }): { refresh(): void; remove(): void } {
  const bar = createSurfaceContext('Draft') as Context; bar.bar = true; bar.setAttribute('data-consistency-draft', '');
  const row = (text: string, run: () => void) => { const button = document.createElement('button'); button.type = 'button'; button.setAttribute('role', 'menuitem'); button.textContent = text; button.addEventListener('click', () => { run(); remove(); }); bar.append(button); return button; };
  row('Keep', options.keep); row('Discard', options.discard);
  let removed = false;
  const remove = () => { if (removed) return; removed = true; bar.remove(); };
  // A press elsewhere does not take the bar away: the draft stands until Keep or Discard, or until the page changes under it.
  bar.addEventListener('ds-menu-close', event => { const reason = (event as CustomEvent<{ reason: string }>).detail.reason; if (reason === 'outside') event.preventDefault(); else if (reason === 'escape') { options.keep(); remove(); } });
  const place = () => { if (removed) return; if (!options.current()) { options.keep(); remove(); return; } const rect = options.anchor(); if (!rect) return; bar.anchor = rect; bar.place(); };
  document.body.append(bar);
  const rect = options.anchor();
  if (rect) bar.openOver(rect);
  return { refresh: place, remove };
}
