/**
 * Carousels without Lit: the behaviour of `.ds-carousel` and `.ds-pagedots`
 * (drawn by `1-root/carousel.css`) on a page's own markup, and the pieces
 * `ds-carousel` and `ds-pagedots` share with it. No framework and no imports.
 *
 * ```html
 * <section class="ds-carousel" aria-label="Colours">
 *   <div class="ds-carousel__track">
 *     <figure>…</figure>
 *     <figure>…</figure>
 *   </div>
 *   <div class="ds-carousel__controls">
 *     <button class="ds-button ds-button--icon ds-carousel__previous" type="button">…</button>
 *     <div class="ds-pagedots"></div>
 *     <button class="ds-button ds-button--icon ds-carousel__next" type="button">…</button>
 *   </div>
 * </section>
 * <script type="module">
 *   import { startCarousels } from "/ds1/0-face/carousel.js";
 *   startCarousels();
 * </script>
 * ```
 *
 * `startCarousels()` starts every `.ds-carousel` on the page: it makes the
 * block a region described as a carousel, each slide a group labelled "2 of
 * 5" (unless the page labels it), fills `.ds-pagedots` with a dot for each
 * slide, keeps the dots and the buttons on the slide in view, and announces
 * the current slide politely in a `.ds-carousel__status` it adds. Dots take
 * the arrow keys, Home and End. Scrolling is instant when the reader asks for
 * reduced motion. The block fires `change` (`detail: { index, previous }`)
 * when a person moves to another slide.
 *
 * The words read English, or the shared words in the page's language where
 * the page loads the language module; `setCarouselWords()` gives others.
 */

/** The words a carousel says, keyed by the shared words' English. */
export type CarouselWord = "Carousel" | "Slide" | "Slides" | "Slide {index}" | "{index} of {count}" | "Previous slide" | "Next slide";
export type CarouselWords = Partial<Record<CarouselWord, string>> | ((word: CarouselWord, params: Record<string, string | number>) => string);

/** Where the language module leaves its `translate()`, shared with the feedback module. */
const TRANSLATOR = Symbol.for("design-system-1.translate");
let words: CarouselWords | null = null;

/** Give the carousel script words of the page's own, or `null` for the language module's (or English). */
export function setCarouselWords(next: CarouselWords | null): void {
  words = next;
}

const fill = (text: string, params: Record<string, string | number>) =>
  text.replace(/\{\{?(\w+)\}?\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole));

/** A carousel word in the page's language, with its placeholders filled. */
export function carouselWord(word: CarouselWord, params: Record<string, string | number> = {}): string {
  if (typeof words === "function") return words(word, params);
  const own = words?.[word];
  if (own !== undefined) return fill(own, params);
  const translate = (globalThis as unknown as Record<symbol, unknown>)[TRANSLATOR];
  return fill(typeof translate === "function" ? String(translate(word, params)) : word, params);
}

/** How a dot is drawn: before, at or after the current slide, or the end marker. */
export type DotState = "past" | "current" | "next" | "future" | "end";

/** The state of dot `index` of `count` when `current` is the slide in view. */
export function dotState(index: number, current: number, count: number, end = false): DotState {
  if (index === current) return "current";
  if (end && index === count - 1) return "end";
  if (index < current) return "past";
  return index === current + 1 ? "next" : "future";
}

/**
 * The dot a key moves to from `index`, or `undefined` for a key dots leave
 * alone. Left and right follow the reading direction.
 */
export function dotForKey(key: string, index: number, count: number, rtl = false): number | undefined {
  const forward = rtl ? "ArrowLeft" : "ArrowRight";
  const back = rtl ? "ArrowRight" : "ArrowLeft";
  if (key === forward) return Math.min(count - 1, index + 1);
  if (key === back) return Math.max(0, index - 1);
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return undefined;
}

/** Whether the reader asks for reduced motion. */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const isRtl = (element: Element) => getComputedStyle(element).direction === "rtl";

/**
 * Scrolls the track so `slide` stands at its start: smoothly, unless the
 * reader asks for reduced motion. Says whether the track had to move.
 */
export function scrollToSlide(track: HTMLElement, slide: HTMLElement, smooth = true): boolean {
  const rtl = isRtl(track);
  const box = track.getBoundingClientRect();
  const rect = slide.getBoundingClientRect();
  const reach = Math.max(0, track.scrollWidth - track.clientWidth);
  const wanted = track.scrollLeft + (rtl ? rect.right - box.right : rect.left - box.left);
  // Right to left, the track scrolls from 0 down to minus its reach.
  const left = rtl ? Math.max(-reach, Math.min(0, wanted)) : Math.max(0, Math.min(reach, wanted));
  if (Math.abs(left - track.scrollLeft) < 1) return false;
  track.scrollTo({ left, behavior: smooth && !prefersReducedMotion() ? "smooth" : "instant" });
  return true;
}

/**
 * The slide in view: the one whose start is nearest the track's. At the far
 * end, where the last slides cannot reach the start, the current slide stays
 * while it is wholly in view, and the last slide is current otherwise.
 */
export function nearestSlide(track: HTMLElement, slides: readonly HTMLElement[], current = 0): number {
  if (!slides.length) return 0;
  const rtl = isRtl(track);
  const box = track.getBoundingClientRect();
  const start = (rect: DOMRect) => (rtl ? box.right - rect.right : rect.left - box.left);
  const reach = track.scrollWidth - track.clientWidth;
  if (reach > 0 && Math.abs(track.scrollLeft) >= reach - 1) {
    const rect = slides[current]?.getBoundingClientRect();
    const inView = rect && start(rect) >= -1 && start(rect) + rect.width <= box.width + 1;
    return inView ? current : slides.length - 1;
  }
  let nearest = 0;
  let distance = Infinity;
  slides.forEach((slide, index) => {
    const away = Math.abs(start(slide.getBoundingClientRect()));
    if (away < distance) { distance = away; nearest = index; }
  });
  return nearest;
}

/** What `startPagedots` is given: the number of dots, the current one and the end marker. */
export interface PagedotsOptions {
  count: number;
  current?: number;
  /** Draw the last dot as an end marker. */
  end?: boolean;
  /** Called when a person picks a dot, by a click or a key. */
  onSelect?: (index: number) => void;
}

/** A running set of native dots. */
export interface PagedotsHandle {
  /** Draw `count` dots, `current` among them. */
  set(count: number, current: number): void;
  stop(): void;
}

/** Attributes the script wrote, so what the page wrote is left alone and the script's own follow the language. */
const written = new WeakMap<Element, Set<string>>();
function own(element: Element, name: string, value: string): void {
  const mine = written.get(element) ?? new Set<string>();
  if (element.hasAttribute(name) && !mine.has(name)) return;
  mine.add(name);
  written.set(element, mine);
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}
/** Whether the page names an element itself. */
const named = (element: Element) => element.hasAttribute("aria-labelledby") || (element.hasAttribute("aria-label") && !written.get(element)?.has("aria-label"));
/** Calls `relabel` whenever the language or its words change; returns the way to stop. */
function onLanguage(relabel: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  for (const name of ["language-changed", "translations-loaded"]) window.addEventListener(name, relabel);
  return () => { for (const name of ["language-changed", "translations-loaded"]) window.removeEventListener(name, relabel); };
}

/**
 * Fills a `.ds-pagedots` element with a button for each dot and keeps its
 * states: a group labelled "Slides", each dot "Slide 2", the current one
 * `aria-current` and the only one in the tab order, arrows, Home and End
 * moving between them.
 */
export function startPagedots(element: HTMLElement, options: PagedotsOptions): PagedotsHandle {
  let count = Math.max(0, Math.floor(options.count));
  let current = options.current ?? 0;
  const draw = () => {
    own(element, "role", "group");
    if (!named(element)) own(element, "aria-label", carouselWord("Slides"));
    const dots = [...element.querySelectorAll<HTMLButtonElement>(":scope > .ds-pagedots__dot")];
    for (const extra of dots.splice(count)) extra.remove();
    while (dots.length < count) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "ds-pagedots__dot";
      element.append(dot);
      dots.push(dot);
    }
    dots.forEach((dot, index) => {
      const state = dotState(index, current, count, options.end);
      dot.dataset.state = state;
      if (!named(dot)) own(dot, "aria-label", carouselWord("Slide {index}", { index: index + 1 }));
      if (state === "current") dot.setAttribute("aria-current", "true"); else dot.removeAttribute("aria-current");
      dot.tabIndex = state === "current" ? 0 : -1;
    });
  };
  const dotList = () => [...element.querySelectorAll<HTMLButtonElement>(":scope > .ds-pagedots__dot")];
  const pick = (index: number, focus: boolean) => {
    options.onSelect?.(index);
    if (focus) dotList()[index]?.focus();
  };
  const click = (event: MouseEvent) => {
    const index = dotList().indexOf((event.target as Element).closest?.(".ds-pagedots__dot") as HTMLButtonElement);
    if (index >= 0) pick(index, false);
  };
  const keydown = (event: KeyboardEvent) => {
    const dots = dotList();
    const from = dots.indexOf(event.target as HTMLButtonElement);
    if (from < 0) return;
    const to = dotForKey(event.key, from, dots.length, isRtl(element));
    if (to === undefined) return;
    event.preventDefault();
    pick(to, true);
  };
  element.addEventListener("click", click);
  element.addEventListener("keydown", keydown);
  const quiet = onLanguage(draw);
  draw();
  return {
    set(nextCount, nextCurrent) { count = Math.max(0, Math.floor(nextCount)); current = nextCurrent; draw(); },
    stop() { element.removeEventListener("click", click); element.removeEventListener("keydown", keydown); quiet(); },
  };
}

/** A running native carousel. */
export interface CarouselHandle {
  /** The slide in view. */
  readonly current: number;
  /** Go to a slide, as its dot does. */
  goTo(index: number): void;
  stop(): void;
}

/** Detail of a carousel's `change` event. */
export interface CarouselChangeDetail { index: number; previous: number }

const running = new WeakMap<HTMLElement, CarouselHandle>();

/** Starts one `.ds-carousel` block; starting it again returns the running one. */
export function startCarousel(element: HTMLElement): CarouselHandle {
  const existing = running.get(element);
  if (existing) return existing;
  const track = element.querySelector<HTMLElement>(".ds-carousel__track");
  if (!track) throw new Error("A .ds-carousel needs a .ds-carousel__track");
  const previousButton = element.querySelector<HTMLButtonElement>(".ds-carousel__previous");
  const nextButton = element.querySelector<HTMLButtonElement>(".ds-carousel__next");
  let status = element.querySelector<HTMLElement>(".ds-carousel__status");
  if (!status) {
    status = document.createElement("span");
    status.className = "ds-carousel__status";
    element.append(status);
  }
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");

  const slides = () => [...track.children].filter((child): child is HTMLElement => child instanceof HTMLElement);
  let current = 0;
  let pending: number | undefined;
  let settle: ReturnType<typeof setTimeout> | undefined;
  let frame = 0;

  /** The region, the slides and the buttons, named in the page's language unless the page names them. */
  const label = () => {
    own(element, "role", "region");
    own(element, "aria-roledescription", carouselWord("Carousel"));
    if (!named(element)) own(element, "aria-label", carouselWord("Carousel"));
    const all = slides();
    all.forEach((slide, index) => {
      own(slide, "role", "group");
      own(slide, "aria-roledescription", carouselWord("Slide"));
      if (!named(slide)) own(slide, "aria-label", carouselWord("{index} of {count}", { index: index + 1, count: all.length }));
    });
    if (previousButton && !named(previousButton)) own(previousButton, "aria-label", carouselWord("Previous slide"));
    if (nextButton && !named(nextButton)) own(nextButton, "aria-label", carouselWord("Next slide"));
  };
  const dotsElement = element.querySelector<HTMLElement>(".ds-pagedots");
  const dots = dotsElement ? startPagedots(dotsElement, { count: slides().length, end: dotsElement.hasAttribute("data-end"), onSelect: index => go(index, true) }) : undefined;

  const show = (index: number, announce: boolean) => {
    const count = slides().length;
    const previous = current;
    current = Math.max(0, Math.min(count - 1, index));
    dots?.set(count, current);
    if (previousButton) previousButton.disabled = current <= 0;
    if (nextButton) nextButton.disabled = current >= count - 1;
    if (announce && current !== previous) {
      status!.textContent = carouselWord("{index} of {count}", { index: current + 1, count });
      element.dispatchEvent(new CustomEvent<CarouselChangeDetail>("change", { bubbles: true, detail: { index: current, previous } }));
    }
  };
  const go = (index: number, announce: boolean) => {
    const all = slides();
    const target = Math.max(0, Math.min(all.length - 1, index));
    if (!all[target]) return;
    if (scrollToSlide(track, all[target]!)) {
      pending = target;
      clearTimeout(settle);
      settle = setTimeout(() => { pending = undefined; }, 600);
    }
    show(target, announce);
  };
  const scrolled = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (pending !== undefined) {
        // A scroll asked for by a dot or a button: wait for it to stop before following the track again.
        clearTimeout(settle);
        settle = setTimeout(() => { pending = undefined; }, 150);
        return;
      }
      show(nearestSlide(track, slides(), current), true);
    });
  };
  const ended = () => { pending = undefined; };
  const previous = () => go(current - 1, true);
  const next = () => go(current + 1, true);
  const observer = typeof MutationObserver === "function" ? new MutationObserver(() => { label(); show(current, false); }) : undefined;

  track.addEventListener("scroll", scrolled, { passive: true });
  track.addEventListener("scrollend", ended);
  previousButton?.addEventListener("click", previous);
  nextButton?.addEventListener("click", next);
  observer?.observe(track, { childList: true });
  const quiet = onLanguage(label);
  label();
  show(0, false);

  const handle: CarouselHandle = {
    get current() { return current; },
    goTo: index => go(index, false),
    stop() {
      track.removeEventListener("scroll", scrolled);
      track.removeEventListener("scrollend", ended);
      previousButton?.removeEventListener("click", previous);
      nextButton?.removeEventListener("click", next);
      observer?.disconnect();
      quiet();
      dots?.stop();
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      running.delete(element);
    },
  };
  running.set(element, handle);
  return handle;
}

/** Starts every `.ds-carousel` inside `root` (the document by default); the returned function stops them. */
export function startCarousels(root: ParentNode = document): () => void {
  const handles = [...root.querySelectorAll<HTMLElement>(".ds-carousel")].map(startCarousel);
  return () => handles.forEach(handle => handle.stop());
}
