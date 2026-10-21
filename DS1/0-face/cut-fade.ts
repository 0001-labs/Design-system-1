/**
 * Cut words fade, never an ellipsis. Wherever Design system 1 cuts words that do
 * not fit (a row's name, a tag, a menu entry, a calendar's title), they fade out
 * over their last square (`var(--ds-unit)`), a mask on the words, so they fade
 * into whatever is behind them. Words that fit stay crisp: the fade is drawn
 * only while an element is marked `data-cut="end"`, and this module is what
 * measures and marks it.
 *
 * Every stylesheet writes the fade the same way: the element clips
 * (`text-overflow: clip`), and only under `[data-cut="end"]` takes
 * `mask-image: linear-gradient(to right, #000 calc(100% - var(--ds-unit)), transparent)`,
 * the gradient running to the left in a right-to-left page.
 *
 * - `watchCuts()` is the watcher a component owns: it marks the elements it
 *   watches while `scrollWidth > clientWidth + 1`, measures again when they
 *   resize, when `measure()` is called (after a render, since words can change
 *   without the box resizing), once the page's fonts have loaded and, with
 *   `text: true`, when the words inside them change. `disconnect()` lets go.
 * - `CutFades` is the same watcher as a Lit reactive controller: it starts when
 *   its element connects, measures after every update and stops when it
 *   disconnects.
 * - `startCutFades()` is for a page without Lit: it marks DS1's native classes
 *   (`.ds-row__name`, `.ds-sidebar__label`, `.ds-menu__item`, …) in the page,
 *   and keeps marking them as the page changes. It returns a function that
 *   stops it.
 */

/** The attribute a cut element carries: `data-cut="end"`. */
export const CUT_ATTRIBUTE = "data-cut";

/**
 * The native classes DS1's stylesheets fade when they are marked cut, for
 * `startCutFades()` on a page without Lit.
 */
export const CUT_FADE_SELECTOR = [
  ".ds-row__name",
  ".ds-sidebar__label",
  ".ds-menu__item",
  ".ds-badge__label",
  ".ds-notice__title",
  ".ds-notice__text",
  ".ds-progress__label",
  ".ds-stat__figure",
  ".ds-document__toc-list a",
  ".ds-footer__links a",
  ".item-text",
].join(", ");

/** Whether an element's words are wider than its box. */
export function isCut(element: Element): boolean {
  return element.scrollWidth > element.clientWidth + 1;
}

/** Marks an element `data-cut="end"` while its words do not fit, and takes the mark off when they do. Returns whether it is cut. */
export function markCut(element: Element): boolean {
  const cut = isCut(element);
  const mark = element.getAttribute(CUT_ATTRIBUTE);
  if (cut) {
    if (mark !== "end") element.setAttribute(CUT_ATTRIBUTE, "end");
  } else if (mark === "end") element.removeAttribute(CUT_ATTRIBUTE);
  return cut;
}

/** Elements to watch: one, several, or a function that finds them again at each measure. */
export type CutSource = Element | Iterable<Element> | (() => Iterable<Element>);

export type CutWatchOptions = {
  /** Also measure again when the words inside a watched element change (a MutationObserver). */
  text?: boolean;
};

export type CutWatcher = {
  /** Watches these elements and measures them. A function is asked again at each measure, so elements a render adds are taken in. */
  watch(source: CutSource): void;
  /** Watches what matches `selector` inside `root`, found again at each measure. */
  select(root: ParentNode, selector: string): void;
  /** Measures every watched element again: after a render, or when words change. */
  measure(): void;
  /** Stops watching and lets every element go. Marks stay as they are. */
  disconnect(): void;
};

/** A watcher that marks the elements it watches `data-cut="end"` while their words do not fit. */
export function watchCuts(options: CutWatchOptions = {}): CutWatcher {
  const sources: CutSource[] = [];
  let watched = new Set<Element>();
  let stopped = false;
  const sizes = typeof ResizeObserver === "undefined"
    ? undefined
    : new ResizeObserver(entries => { for (const entry of entries) markCut(entry.target); });
  const words = options.text && typeof MutationObserver !== "undefined"
    ? new MutationObserver(() => { for (const element of watched) markCut(element); })
    : undefined;

  const collect = () => {
    const found = new Set<Element>();
    for (const source of sources) {
      const elements = typeof source === "function" ? source() : source instanceof Element ? [source] : source;
      for (const element of elements) found.add(element);
    }
    return found;
  };

  const measure = () => {
    if (stopped) return;
    const next = collect();
    let changed = next.size !== watched.size;
    for (const element of watched) {
      if (!next.has(element)) { sizes?.unobserve(element); changed = true; }
    }
    for (const element of next) {
      if (!watched.has(element)) { sizes?.observe(element); changed = true; }
    }
    // A MutationObserver cannot let one element go, so it starts again when the set changes.
    if (words && changed) {
      words.disconnect();
      for (const element of next) words.observe(element, { childList: true, characterData: true, subtree: true });
    }
    watched = next;
    for (const element of watched) markCut(element);
  };

  // Words drawn in a fallback face are narrower or wider once the page's fonts arrive.
  const fonts = typeof document === "undefined" ? undefined : document.fonts?.ready;
  if (fonts && typeof fonts.then === "function") fonts.then(measure, () => {});

  return {
    watch(source) { sources.push(source); measure(); },
    select(root, selector) { sources.push(() => root.querySelectorAll(selector)); measure(); },
    measure,
    disconnect() {
      stopped = true;
      sizes?.disconnect();
      words?.disconnect();
      watched = new Set();
      sources.length = 0;
    },
  };
}

/** The part of a Lit element `CutFades` uses, so this module needs nothing from Lit. */
type ControllerHost = Element & {
  addController(controller: { hostConnected?(): void; hostUpdated?(): void; hostDisconnected?(): void }): void;
  readonly renderRoot?: ParentNode;
};

export type CutFadeOptions = {
  /** What to measure in the element's render root (its shadow root), found again after every update. */
  selector?: string;
  /** Other elements to measure, asked again after every update: the host itself, its slotted children. */
  targets?: () => Iterable<Element>;
  /** Also measure again when the element's own children or words change (the words slotted into it). */
  text?: boolean;
};

/**
 * The cut-words watcher as a Lit reactive controller:
 * `protected readonly cuts = new CutFades(this, { selector: ".label" })`. It watches from
 * when the element connects to when it disconnects, and measures after every
 * update; call `measure()` when words change outside an update.
 */
export class CutFades {
  private watcher: CutWatcher | undefined;
  private words: MutationObserver | undefined;
  private readonly host: ControllerHost;
  private readonly options: CutFadeOptions;

  constructor(host: ControllerHost, options: CutFadeOptions) {
    this.host = host;
    this.options = options;
    host.addController(this);
  }

  hostConnected() {
    this.hostDisconnected();
    const watcher = watchCuts();
    const { selector, targets, text } = this.options;
    if (selector) watcher.watch(() => (this.host.renderRoot ?? this.host).querySelectorAll(selector));
    if (targets) watcher.watch(targets);
    this.watcher = watcher;
    // Words slotted into the element can change without an update or a resize.
    if (text && typeof MutationObserver !== "undefined") {
      this.words = new MutationObserver(() => this.measure());
      this.words.observe(this.host, { childList: true, characterData: true, subtree: true });
    }
  }

  hostUpdated() { this.measure(); }

  hostDisconnected() {
    this.words?.disconnect();
    this.words = undefined;
    this.watcher?.disconnect();
    this.watcher = undefined;
  }

  /** Measures again, as after an update. */
  measure() { this.watcher?.measure(); }
}

/**
 * Marks DS1's native classes cut on a page without Lit, so their words fade
 * where they are cut, and keeps marking them as the page changes. Returns a
 * function that stops it.
 *
 * @example
 * // A module script on the page, beside one.css and controls.css (Sync 1 `root` `"modules": ["cut-fade"]`):
 * startCutFades();
 */
export function startCutFades(root: ParentNode = document, selector: string = CUT_FADE_SELECTOR): () => void {
  const watcher = watchCuts();
  watcher.select(root, selector);
  let frame = 0;
  const later = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; watcher.measure(); });
  };
  const changes = typeof MutationObserver === "undefined" ? undefined : new MutationObserver(later);
  const node = root instanceof Document ? root.documentElement : (root as Node);
  changes?.observe(node, { childList: true, characterData: true, subtree: true });
  return () => {
    if (frame) cancelAnimationFrame(frame);
    changes?.disconnect();
    watcher.disconnect();
  };
}
