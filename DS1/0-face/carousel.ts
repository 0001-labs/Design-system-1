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
 * A strip of things of their own width (`data-slides="auto"`, several in
 * view, each stopping at the strip's start) takes three more options, as data
 * attributes on `.ds-carousel` (and attributes of the same names on
 * `ds-carousel`):
 *
 * - `data-bleed`: `none` (the default) keeps the strip in its box; `end` runs
 *   it on to the window's end edge, the first slide still on the box's start;
 *   `both` runs it to both edges, slides passing out of the box at its start.
 * - `data-loop`: the slides held three times over, the copies unseen by
 *   assistive technology and never focused, so the strip has no end. A
 *   looping carousel draws no dots.
 * - `data-autoplay`: move on a slide at a time by itself every so many
 *   milliseconds (`data-autoplay="5000"`; empty is 5000). Held while the
 *   pointer, a finger or the keyboard is in the strip, while it is out of
 *   view or the page hidden, and never for a reader who asks for reduced
 *   motion. A pause button (`.ds-carousel__pause`) is always drawn with it
 *   (WCAG 2.2.2).
 * - `data-snap="none"`: slide freely, without stopping at slides.
 *
 * The words read English, or the shared words in the page's language where
 * the page loads the language module; `setCarouselWords()` gives others.
 */

/** The words a carousel says, keyed by the shared words' English. */
export type CarouselWord = "Carousel" | "Slide" | "Slides" | "Slide {index}" | "{index} of {count}" | "Previous slide" | "Next slide" | "Pause" | "Play";

/** What a strip's drive can be told; every option is off unless given. */
export interface CarouselDriveOptions {
  bleed?: "none" | "end" | "both";
  loop?: boolean;
  /** Milliseconds between steps; `0` or absent for none. */
  autoplay?: number;
  /** A copy was made: mark and change it before it is placed. */
  onCopy?: (copy: HTMLElement) => void;
}

/** A running drive: the bleed's measures, the loop's copies and autoplay. */
export interface CarouselDrive {
  /** Moves a slide on (`1`) or back (`-1`). */
  step(direction: 1 | -1): void;
  /** Holds or resumes autoplay, as the pause button does. */
  pause(paused: boolean): void;
  /** Whether autoplay is held by the pause button. */
  readonly paused: boolean;
  stop(): void;
}

/** How long an autoplaying carousel stands when no interval is given. */
export const CAROUSEL_AUTOPLAY_MS = 5000;

/** An autoplay interval from an attribute: empty or `true` is the default, a number of milliseconds otherwise, at least a second. */
export function autoplayInterval(value: string | number | boolean | null | undefined): number {
  if (value === null || value === undefined || value === false || value === "false") return 0;
  if (value === "" || value === true || value === "true") return CAROUSEL_AUTOPLAY_MS;
  const milliseconds = Number(value);
  return Number.isFinite(milliseconds) && milliseconds > 0 ? Math.max(1000, milliseconds) : 0;
}

/** Marks an element as a copy made for a loop. */
export const COPY = "data-ds-carousel-copy";
const isCopy = (element: Element) => element.hasAttribute(COPY);
/** Whether an attribute asks for a bleed. */
export const bleedOf = (value: string | undefined): CarouselDriveOptions["bleed"] => (value === "end" || value === "both" ? value : "none");
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


/** Where a slide starts along the track, from the track's own start, in its scroll's terms. */
function startOf(track: HTMLElement, slide: HTMLElement): number {
  const box = track.getBoundingClientRect();
  const rect = slide.getBoundingClientRect();
  return isRtl(track) ? track.scrollLeft + rect.right - box.right : track.scrollLeft + rect.left - box.left;
}

/**
 * The room between an element and the window's edges, at its start and its
 * end, for a strip that bleeds out to them. Measured against the document's
 * width, so a scrollbar is never covered.
 */
export function bleedRoom(element: HTMLElement): { before: number; after: number } {
  const width = document.documentElement.clientWidth || window.innerWidth;
  const rect = element.getBoundingClientRect();
  const left = Math.max(0, rect.left);
  const right = Math.max(0, width - rect.right);
  return isRtl(element) ? { before: right, after: left } : { before: left, after: right };
}

/**
 * Drives a strip: `block` carries the bleed's measures, `track` scrolls, and
 * the slides (the children of `holder`, the track itself on a native page)
 * are what it holds. The bleed's room is measured as the page's width
 * changes; a loop holds the slides three times over, opened on the middle
 * set and kept within it; autoplay steps a slide at a time while nobody is in
 * the strip and it can be seen.
 */
export function driveCarousel(block: HTMLElement, track: HTMLElement, holder: HTMLElement, options: CarouselDriveOptions = {}): CarouselDrive {
  const stops: (() => void)[] = [];
  const slides = () => [...holder.children].filter((child): child is HTMLElement => child instanceof HTMLElement && !child.hasAttribute("slot"));
  const originals = () => slides().filter((slide) => !isCopy(slide));

  const bleed = options.bleed ?? "none";
  if (bleed !== "none") {
    const measure = () => {
      const { before, after } = bleedRoom(block);
      block.style.setProperty("--ds-carousel-before", `${before}px`);
      block.style.setProperty("--ds-carousel-after", `${after}px`);
    };
    measure();
    const sized = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    sized?.observe(document.documentElement);
    sized?.observe(block);
    window.addEventListener("resize", measure);
    stops.push(() => { sized?.disconnect(); window.removeEventListener("resize", measure); });
  }

  const count = originals().length;
  const looping = !!options.loop && count > 1;
  if (looping) {
    const copies = () => originals().map((slide) => {
      const copy = slide.cloneNode(true) as HTMLElement;
      copy.setAttribute(COPY, "");
      copy.setAttribute("aria-hidden", "true");
      copy.inert = true;
      copy.removeAttribute("id");
      copy.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      options.onCopy?.(copy);
      return copy;
    });
    const first = originals()[0];
    const after = copies();
    first.before(...copies());
    holder.append(...after);
    stops.push(() => slides().filter(isCopy).forEach((copy) => copy.remove()));
  }
  // A set's length: from a slide to the same slide in the next set.
  const span = () => {
    const all = slides();
    return looping && all.length > count ? Math.abs(startOf(track, all[count]) - startOf(track, all[0])) : 0;
  };
  const direction = () => (isRtl(track) ? -1 : 1);
  // Kept within the middle set: past either side, the strip moves a whole set at once, the same slides under the eye.
  const within = () => {
    const length = span();
    if (!length) return;
    const at = Math.abs(track.scrollLeft);
    if (at < length * 0.5) track.scrollLeft += length * direction();
    else if (at >= length * 1.5) track.scrollLeft -= length * direction();
  };
  if (looping) {
    const place = () => {
      if (!track.clientWidth) return false;
      track.scrollLeft = span() * direction();
      return true;
    };
    if (!place()) {
      const sized = new ResizeObserver(() => { if (place()) sized.disconnect(); });
      sized.observe(track);
      stops.push(() => sized.disconnect());
    }
    track.addEventListener("scrollend", within);
    stops.push(() => track.removeEventListener("scrollend", within));
  }

  /** The slide standing at the strip's start, or the nearest to it. */
  const atStart = (): number => {
    const all = slides();
    const at = Math.abs(track.scrollLeft);
    let nearest = 0;
    let distance = Infinity;
    all.forEach((slide, index) => {
      const away = Math.abs(Math.abs(startOf(track, slide)) - at);
      if (away < distance) { distance = away; nearest = index; }
    });
    return nearest;
  };

  const step = (towards: 1 | -1) => {
    if (looping) within();
    const all = slides();
    const target = all[atStart() + towards];
    if (target) scrollToSlide(track, target, true);
    else if (!looping && towards === 1 && options.autoplay) scrollToSlide(track, all[0], true);
  };

  let paused = false;
  const every = options.autoplay ?? 0;
  if (every > 0 && !prefersReducedMotion()) {
    let held = false;
    let seen = typeof IntersectionObserver !== "function";
    const hold = () => { held = true; };
    const release = () => { held = false; };
    const later = () => setTimeout(release, every);
    const listeners: [string, EventListener, AddEventListenerOptions?][] = [
      ["pointerenter", hold], ["pointerleave", release],
      ["touchstart", hold, { passive: true }], ["touchend", later, { passive: true }],
      ["focusin", hold], ["focusout", release],
    ];
    for (const [name, listener, options] of listeners) block.addEventListener(name, listener, options);
    const watch = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => { seen = !!entry?.isIntersecting; }, { threshold: 0.3 })
      : null;
    watch?.observe(track);
    const timer = setInterval(() => {
      if (paused || held || !seen || document.hidden) return;
      step(1);
    }, every);
    stops.push(() => {
      clearInterval(timer);
      watch?.disconnect();
      for (const [name, listener] of listeners) block.removeEventListener(name, listener);
    });
  }

  return {
    step,
    pause(next: boolean) { paused = next; },
    get paused() { return paused; },
    stop() { stops.splice(0).forEach((stop) => stop()); },
  };
}

/** An icon button the script adds: the pause button of an autoplaying strip. */
function iconButton(className: string, icon: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `ds-button ds-button--icon ${className}`;
  const mark = document.createElement("span");
  mark.className = "ds-icon";
  mark.setAttribute("aria-hidden", "true");
  mark.dataset.icon = icon;
  button.append(mark);
  return button;
}

/** Points a native icon at its file in the icon folder beside the page's copy (`--ds-icon` from `data-icon`). */
function drawIcon(button: HTMLButtonElement, icon: string, base: string) {
  const mark = button.querySelector<HTMLElement>(".ds-icon");
  if (!mark) return;
  mark.dataset.icon = icon;
  if (base) mark.style.setProperty("--ds-icon", `url("${base}${icon}.svg")`);
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

/** What `startCarousel` and `startCarousels` are told. */
export interface StartCarouselOptions {
  /** Where the icons are, for the pause button the script adds (`/ds1/x-icon/`). */
  icons?: string;
}

/** Starts one `.ds-carousel` block; starting it again returns the running one. */
export function startCarousel(element: HTMLElement, options: StartCarouselOptions = {}): CarouselHandle {
  const existing = running.get(element);
  if (existing) return existing;
  const track = element.querySelector<HTMLElement>(".ds-carousel__track");
  if (!track) throw new Error("A .ds-carousel needs a .ds-carousel__track");
  // A strip's options: the bleed's room, a loop's copies and autoplay come from the drive.
  const bleed = bleedOf(element.dataset.bleed);
  const loop = element.dataset.loop !== undefined && element.dataset.loop !== "false";
  const every = autoplayInterval(element.dataset.autoplay ?? null);
  const drive = bleed !== "none" || loop || every > 0 ? driveCarousel(element, track, track, { bleed, loop, autoplay: every }) : undefined;
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

  const slides = () => [...track.children].filter((child): child is HTMLElement => child instanceof HTMLElement && !isCopy(child));
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
  // A looping strip has no place to point to, so it draws no dots.
  const dotsElement = loop ? null : element.querySelector<HTMLElement>(".ds-pagedots");
  const dots = dotsElement ? startPagedots(dotsElement, { count: slides().length, end: dotsElement.hasAttribute("data-end"), onSelect: index => go(index, true) }) : undefined;

  const show = (index: number, announce: boolean) => {
    const count = slides().length;
    const previous = current;
    current = Math.max(0, Math.min(count - 1, index));
    dots?.set(count, current);
    if (previousButton) previousButton.disabled = !drive && current <= 0;
    if (nextButton) nextButton.disabled = !drive && current >= count - 1;
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
    if (loop) return;
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
  const previous = () => (drive ? drive.step(-1) : go(current - 1, true));
  const next = () => (drive ? drive.step(1) : go(current + 1, true));
  // Autoplay always comes with its pause button, in the controls row the page wrote or one the script adds.
  let pause: HTMLButtonElement | null = null;
  const drawPause = () => {
    if (!pause || !drive) return;
    pause.setAttribute("aria-pressed", String(drive.paused));
    pause.setAttribute("aria-label", carouselWord(drive.paused ? "Play" : "Pause"));
    drawIcon(pause, drive.paused ? "play-alt" : "pause", options.icons ?? "");
  };
  if (drive && every > 0 && !prefersReducedMotion()) {
    let controls = element.querySelector<HTMLElement>(":scope > .ds-carousel__controls");
    if (!controls) {
      controls = document.createElement("div");
      controls.className = "ds-carousel__controls";
      track.after(controls);
    }
    pause = controls.querySelector<HTMLButtonElement>(".ds-carousel__pause") ?? iconButton("ds-carousel__pause", "pause");
    if (!pause.isConnected) controls.prepend(pause);
    pause.addEventListener("click", () => { drive.pause(!drive.paused); drawPause(); });
    drawPause();
  }
  const observer = typeof MutationObserver === "function" ? new MutationObserver(() => { label(); show(current, false); }) : undefined;

  track.addEventListener("scroll", scrolled, { passive: true });
  track.addEventListener("scrollend", ended);
  previousButton?.addEventListener("click", previous);
  nextButton?.addEventListener("click", next);
  observer?.observe(track, { childList: true });
  const quiet = onLanguage(() => { label(); drawPause(); });
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
      drive?.stop();
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      running.delete(element);
    },
  };
  running.set(element, handle);
  return handle;
}

/** Starts every `.ds-carousel` inside `root` (the document by default); the returned function stops them. */
export function startCarousels(root: ParentNode = document, options: StartCarouselOptions = {}): () => void {
  const handles = [...root.querySelectorAll<HTMLElement>(".ds-carousel")].map((element) => startCarousel(element, options));
  return () => handles.forEach(handle => handle.stop());
}
