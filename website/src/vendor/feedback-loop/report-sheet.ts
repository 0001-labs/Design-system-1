/**
 * Report in the browser: someone testing a product says what is wrong with
 * what is in front of them. Three quick taps on anything on a touch screen, or
 * ⌥⇧R (Alt+Shift+R) on a keyboard, opens Design system 1's sheet from the foot
 * of the screen (`dialog.ds-overlay--sheet`, the product's own overlay.css)
 * about the thing tapped, or the thing under the pointer, outlined while the
 * sheet is open. The note is Aa's plain editor, the product's copy, with
 * `speak`: Space in the empty note listens. ⌘ or Ctrl+Enter, or Send, hands
 * the draft to the product (`send`), whose server names who sent it and
 * passes it on to System (report.ts). An unsent note is kept until it is sent.
 *
 * The product turns it on only for the people who should report (the site engine's
 * editors, Link's testers): nobody else meets the taps or the shortcut.
 */
import type { ReportDraft } from './report';

/** Aa's plain editor as the sheet uses it (`createPlainEditor` from the product's copy of Aa, 71a482b on; `speak` from da6c13e). */
export type PlainEditorFactory = (host: HTMLElement, options: { value?: string; placeholder?: string; speak?: boolean; onChange?: (value: string) => void }) => { readonly value: string; focus(): void; destroy(): void };

export interface ReportSheetOptions {
  /** Keep the report alongside the product without blocking its page. */
  nonModal?: boolean;
  createPlainEditor: PlainEditorFactory;
  /** Sends the draft to the product's own server. Rejects with the words to show when it could not. */
  send(draft: ReportDraft): Promise<void>;
  /** The document the sheet opens in; the page's own by default. */
  doc?: Document;
  /** The report's page, from the document it was opened in: its path by default. */
  path?: (doc: Document) => string;
  version?: string;
}

export interface ReportSheet {
  /** Opens the sheet about an element (or nothing in particular). */
  open(about?: Element | null): void;
  /** Listens for the taps and the shortcut in another document too, such as a frame of the product's own; returns how to stop. */
  watch(doc: Document): () => void;
  stop(): void;
}

/** Taps further apart than this, in time or place, start again. */
export const TAP = { ms: 450, px: 32, still: 10, hold: 500 } as const;
const ABOUT_MAX = 200;
const SHEET = 'report-sheet';
const MARK = 'data-report-about';

/** Whether a key press is the shortcut, ⌥⇧R: by the key's place, since ⌥ changes the letter on a Mac. */
export const isReportShortcut = (event: Pick<KeyboardEvent, 'code' | 'altKey' | 'shiftKey' | 'metaKey' | 'ctrlKey'>) =>
  event.code === 'KeyR' && event.altKey && event.shiftKey && !event.metaKey && !event.ctrlKey;

const squash = (words: string | null | undefined) => (words ?? '').replace(/\s+/g, ' ').trim();
const clip = (words: string) => (words.length > ABOUT_MAX ? `${words.slice(0, ABOUT_MAX - 1).trimEnd()}…` : words);

/**
 * What an element is, in a few words: the words selected; else a site engine field's
 * words, a control's or a picture's name, or the nearest element with words.
 */
export function describeElement(element: Element | null, selection?: string | null): string | null {
  const selected = squash(selection);
  if (selected) return clip(selected);
  if (!element) return null;
  const field = element.closest('[data-cms]');
  if (field && squash(field.textContent)) return clip(squash(field.textContent));
  const named = element.closest('[aria-label], img[alt], [title]');
  const name = named ? squash(named.getAttribute('aria-label') ?? named.getAttribute('alt') ?? named.getAttribute('title')) : '';
  const control = element.closest('button, a, label, summary, [role="button"]');
  if (control && squash(control.textContent)) return clip(squash(control.textContent));
  if (name) return clip(name);
  for (let at: Element | null = element; at && at !== element.ownerDocument.body; at = at.parentElement) {
    const words = squash(at.textContent);
    if (words) return clip(words);
  }
  return null;
}

/** A report's own id: `r-` and sixteen letters and digits. */
export function reportId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `r-${[...bytes].map(byte => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[byte % 62]).join('')}`;
}

/**
 * Counts quick taps that stand still, one place: the third within TAP.ms of the one
 * before and TAP.px of the first is three. Times are the pointer's own.
 */
export function tapCounter() {
  let taps: { x: number; y: number; at: number }[] = [];
  let down: { x: number; y: number; at: number } | null = null;
  return {
    down(x: number, y: number, at: number) { down = { x, y, at }; },
    /** The tap ends: true when it is the third. */
    up(x: number, y: number, at: number): boolean {
      const start = down; down = null;
      if (!start || Math.hypot(x - start.x, y - start.y) > TAP.still || at - start.at > TAP.hold) { taps = []; return false; }
      const last = taps.at(-1);
      if (!last || at - last.at > TAP.ms || Math.hypot(x - taps[0].x, y - taps[0].y) > TAP.px) taps = [];
      taps.push({ x, y, at });
      if (taps.length < 3) return false;
      taps = [];
      return true;
    },
    cancel() { down = null; taps = []; },
  };
}

const STYLE = `[${MARK}] { outline: 2px solid var(--ds-focus-ring, #594dff) !important; outline-offset: 2px !important; }
.${SHEET} [data-ds-overlay="field"] { gap: 0; }
.${SHEET} .${SHEET}__about { margin: 0; color: var(--ds-text-color-muted, #8a8a8a); overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-height: var(--ds-unit, 20px); }
.${SHEET} .${SHEET}__note { --ds-input-height: auto; display: block; box-sizing: border-box; width: 100%; min-height: calc(4 * var(--ds-row-height, 20px)); max-height: calc(12 * var(--ds-row-height, 20px)); overflow: auto; padding: calc(4px * var(--ds-sf, 1)); border-radius: calc(4px * var(--ds-sf, 1)); line-height: var(--ds-unit, 20px); cursor: text; white-space: pre-wrap; }
.${SHEET} .${SHEET}__note:focus-within { outline: 2px solid var(--ds-focus-ring, #594dff); outline-offset: 1px; }
.${SHEET} .${SHEET}__note > .aa-block { min-height: calc(3 * var(--ds-row-height, 20px)); outline: none; }
.${SHEET} .${SHEET}__status { margin: 0; min-height: var(--ds-unit, 20px); line-height: var(--ds-unit, 20px); color: var(--ds-text-color-muted, #8a8a8a); }
.${SHEET} .${SHEET}__status[data-tone="danger"] { color: var(--ds-danger-color, #d33); }
.${SHEET} .${SHEET}__keys { color: var(--ds-text-color-muted, #8a8a8a); margin-inline-end: auto; }`;

const styled = new WeakSet<Document>();
function style(doc: Document) {
  if (styled.has(doc)) return;
  styled.add(doc);
  const sheet = doc.createElement('style');
  sheet.dataset.report = '';
  sheet.textContent = STYLE;
  doc.head.append(sheet);
}

export function startReport(options: ReportSheetOptions): ReportSheet {
  const doc = options.doc ?? document;
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  let dialog: HTMLDialogElement | null = null;
  let kept = '';
  const watched = new Map<Document, () => void>();

  const open = (about?: Element | null) => {
    if (dialog) return;
    const from = about?.ownerDocument ?? doc;
    const selection = from.getSelection()?.toString() ?? '';
    const aboutWords = describeElement(about ?? null, selection);
    // The taps select words on the way; the sheet takes nothing with it.
    from.getSelection()?.removeAllRanges();
    style(doc);
    if (about && about !== from.body && about !== from.documentElement) { style(from); about.setAttribute(MARK, ''); }

    const el = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, string> = {}, ...children: (Node | string)[]) => {
      const node = doc.createElement(tag);
      for (const [name, value] of Object.entries(props)) node.setAttribute(name, value);
      node.append(...children);
      return node;
    };
    const sheet = el('dialog', { class: `ds-overlay ds-overlay--sheet ${SHEET}`, 'aria-labelledby': 'report-sheet-title' });
    dialog = sheet;
    if (options.nonModal) sheet.style.zIndex = 'var(--ds-overlay-layer, 1)';
    const note = el('div', { class: `ds-input ${SHEET}__note` });
    const status = el('p', { class: `${SHEET}__status`, role: 'status', 'aria-live': 'polite' });
    const send = el('button', { type: 'button', class: 'ds-button ds-button--primary' }, 'Send');
    const cancel = el('button', { type: 'button', class: 'ds-button ds-button--secondary' }, 'Cancel');
    const keys = el('span', { class: `${SHEET}__keys ds-text`, 'aria-hidden': 'true' }, mac ? '⌘↩ sends' : 'Ctrl+Enter sends');
    sheet.append(
      el('div', { 'data-ds-overlay': 'header' },
        el('h2', { 'data-ds-overlay': 'title', id: 'report-sheet-title' }, 'Report'),
        el('p', { 'data-ds-overlay': 'description' }, 'What is wrong here? It goes straight to the people who build it.')),
      el('div', { 'data-ds-overlay': 'field' },
        ...(aboutWords ? [el('p', { class: `${SHEET}__about ds-text` }, `About “${aboutWords}”`)] : []),
        note),
      status,
      el('div', { 'data-ds-overlay': 'footer' }, ...(matchMedia('(pointer: fine)').matches ? [keys] : []), cancel, send),
    );
    const editor = options.createPlainEditor(note, { value: kept, placeholder: 'Say what is wrong', speak: true, onChange: value => { kept = value; } });
    const say = (words: string, tone?: 'danger') => { status.textContent = words; if (tone) status.dataset.tone = tone; else delete status.dataset.tone; };
    let sending = false;
    const submit = async () => {
      const words = editor.value.trim();
      if (sending) return;
      if (!words) { say('Say what is wrong first.', 'danger'); editor.focus(); return; }
      sending = true; send.disabled = true; say('Sending…');
      const screen = { width: Math.round(from.defaultView?.innerWidth ?? 0), height: Math.round(from.defaultView?.innerHeight ?? 0), touch: matchMedia('(pointer: coarse)').matches };
      try {
        await options.send({ id: reportId(), note: words, path: options.path?.(from) ?? from.location.pathname, about: aboutWords, screen, version: options.version ?? null });
        kept = '';
        say('Sent. Thank you.');
        setTimeout(() => sheet.close(), 900);
      } catch (error) {
        say(error instanceof Error && error.message ? error.message : 'It could not be sent. Try again.', 'danger');
        sending = false; send.disabled = false;
      }
    };
    send.addEventListener('click', () => void submit());
    cancel.addEventListener('click', () => sheet.close());
    sheet.addEventListener('keydown', event => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.isComposing) { event.preventDefault(); void submit(); }
    });
    // A press on the backdrop, outside the sheet's own box, puts it away.
    sheet.addEventListener('click', event => {
      if (event.target !== sheet) return;
      const box = sheet.getBoundingClientRect();
      if (event.clientY < box.top || event.clientY > box.bottom || event.clientX < box.left || event.clientX > box.right) sheet.close();
    });
    sheet.addEventListener('close', () => {
      editor.destroy();
      about?.removeAttribute(MARK);
      dialog = null;
      // Design system 1's sheet slides out before it leaves the page.
      setTimeout(() => sheet.remove(), 400);
    }, { once: true });
    doc.body.append(sheet);
    if (options.nonModal) sheet.show(); else sheet.showModal();
    const escape = (event: KeyboardEvent) => {
      if (options.nonModal && event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); sheet.close(); }
    };
    sheet.addEventListener('keydown', escape);
    sheet.addEventListener('close', () => sheet.removeEventListener('keydown', escape), { once: true });
    editor.focus();
  };

  const watch = (target: Document) => {
    if (watched.has(target)) return watched.get(target)!;
    const view = target.defaultView;
    let pointed: Element | null = null;
    let swallow = 0;
    const taps = tapCounter();
    const inside = (node: EventTarget | null) => node instanceof Element && !!node.closest(`.${SHEET}`);
    const keydown = (event: KeyboardEvent) => {
      if (!isReportShortcut(event) || event.repeat) return;
      event.preventDefault();
      if (dialog) return;
      const focused = target.activeElement && target.activeElement !== target.body ? target.activeElement : null;
      open(pointed ?? focused);
    };
    const move = (event: PointerEvent) => { if (event.pointerType === 'mouse' && !inside(event.target)) pointed = event.target as Element; };
    const leave = () => { pointed = null; };
    const down = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' || !event.isPrimary || inside(event.target) || dialog) { taps.cancel(); return; }
      taps.down(event.clientX, event.clientY, event.timeStamp);
    };
    const up = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' || !event.isPrimary || dialog) return;
      if (!taps.up(event.clientX, event.clientY, event.timeStamp)) return;
      // The third tap's own press goes no further: it opens the sheet, never a link.
      swallow = event.timeStamp;
      open(target.elementFromPoint(event.clientX, event.clientY) ?? (event.target as Element));
    };
    const click = (event: MouseEvent) => {
      if (!swallow || event.timeStamp - swallow > 600) return;
      swallow = 0;
      event.preventDefault(); event.stopPropagation();
    };
    const cancel = () => taps.cancel();
    target.addEventListener('keydown', keydown, true);
    target.addEventListener('pointermove', move, { passive: true });
    target.documentElement.addEventListener('pointerleave', leave);
    target.addEventListener('pointerdown', down, { capture: true, passive: true });
    target.addEventListener('pointerup', up, true);
    target.addEventListener('pointercancel', cancel, true);
    target.addEventListener('click', click, true);
    view?.addEventListener('scroll', cancel, { passive: true });
    const stop = () => {
      target.removeEventListener('keydown', keydown, true);
      target.removeEventListener('pointermove', move);
      target.documentElement.removeEventListener('pointerleave', leave);
      target.removeEventListener('pointerdown', down, true);
      target.removeEventListener('pointerup', up, true);
      target.removeEventListener('pointercancel', cancel, true);
      target.removeEventListener('click', click, true);
      view?.removeEventListener('scroll', cancel);
      watched.delete(target);
    };
    watched.set(target, stop);
    return stop;
  };

  watch(doc);
  return {
    open,
    watch,
    stop() { for (const stop of [...watched.values()]) stop(); dialog?.close(); },
  };
}
