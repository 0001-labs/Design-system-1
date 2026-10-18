/**
 * Slides without Lit: the behaviour of `.ds-slide` (drawn by
 * `1-root/slide.css`) on a page's own markup, and the pieces `ds-slide`
 * shares with it. No framework; only the carousel's scrolling helpers.
 *
 * ```html
 * <section class="ds-slide" aria-label="Work" data-bleed="end">
 *   <div class="ds-slide__track">
 *     <a class="ds-card" href="/one">…</a>
 *     <a class="ds-card" href="/two">…</a>
 *   </div>
 * </section>
 * <script type="module">
 *   import { startSlides } from "/ds1/0-face/slide.js";
 *   startSlides();
 * </script>
 * ```
 *
 * A slide is a strip of things of any width, several in view, that a finger,
 * a trackpad or the keyboard slides sideways, each stopping at the strip's
 * start. It differs from a carousel, which shows one slide at a time with its
 * page dots. Options, as data attributes on `.ds-slide` (and attributes of
 * the same names on `ds-slide`):
 *
 * - `data-bleed`: `none` (the default) keeps the strip in its box; `end` runs
 *   it on to the window's end edge, the first item still on the box's start;
 *   `both` runs it to both edges, items passing out of the box at its start.
 * - `data-loop`: the items held three times over, the copies unseen by
 *   assistive technology and never focused, so the strip has no end.
 * - `data-autoplay`: move on an item at a time by itself every so many
 *   milliseconds (`data-autoplay="5000"`; empty is 5000). Held while the
 *   pointer, a finger or the keyboard is in the strip, while it is out of
 *   view or the page hidden, and never for a reader who asks for reduced
 *   motion. A pause button is always drawn with it (WCAG 2.2.2).
 * - `data-snap="none"`: slide freely, without stopping at items.
 *
 * Previous and next buttons (`.ds-slide__previous`, `.ds-slide__next`) in a
 * `.ds-slide__controls` row are wired when present; the script adds the row
 * and the pause button for autoplay. The block is a region named by its
 * label; its track is a list of the items. The words read English, or the
 * shared words in the page's language; `setCarouselWords()` gives others.
 */
import { carouselWord, prefersReducedMotion, scrollToSlide } from "./carousel";

/** What a slide can be told; every option is off unless given. */
export interface SlideOptions {
  bleed?: "none" | "end" | "both";
  loop?: boolean;
  /** Milliseconds between steps; `0` or absent for none. */
  autoplay?: number;
  /** A copy was made: mark and change it before it is placed. */
  onCopy?: (copy: HTMLElement) => void;
}

/** A running slide. */
export interface SlideHandle {
  /** Moves an item on (`1`) or back (`-1`). */
  step(direction: 1 | -1): void;
  /** Holds or resumes autoplay, as the pause button does. */
  pause(paused: boolean): void;
  /** Whether autoplay is held by the pause button. */
  readonly paused: boolean;
  stop(): void;
}

/** How long an autoplaying slide stands when no interval is given. */
export const SLIDE_AUTOPLAY_MS = 5000;

/** An autoplay interval from an attribute: empty or `true` is the default, a number of milliseconds otherwise, at least a second. */
export function autoplayInterval(value: string | number | boolean | null | undefined): number {
  if (value === null || value === undefined || value === false || value === "false") return 0;
  if (value === "" || value === true || value === "true") return SLIDE_AUTOPLAY_MS;
  const milliseconds = Number(value);
  return Number.isFinite(milliseconds) && milliseconds > 0 ? Math.max(1000, milliseconds) : 0;
}

/** Marks an element as a copy made for a loop. */
export const COPY = "data-ds-slide-copy";
const isCopy = (element: Element) => element.hasAttribute(COPY);

const rtl = (element: Element) => getComputedStyle(element).direction === "rtl";

/** Where an item starts along the track, from the track's own start, in its scroll's terms. */
function start(track: HTMLElement, item: HTMLElement): number {
  const box = track.getBoundingClientRect();
  const rect = item.getBoundingClientRect();
  return rtl(track) ? track.scrollLeft + rect.right - box.right : track.scrollLeft + rect.left - box.left;
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
  return rtl(element) ? { before: right, after: left } : { before: left, after: right };
}

/**
 * Starts the behaviour of a slide: `block` carries the bleed's measures,
 * `track` scrolls, and `items` (the children of `holder`, the track itself
 * on a native page) are what it holds.
 */
export function startSlide(block: HTMLElement, track: HTMLElement, holder: HTMLElement, options: SlideOptions = {}): SlideHandle {
  const stops: (() => void)[] = [];
  const items = () => [...holder.children].filter((child): child is HTMLElement => child instanceof HTMLElement && !child.hasAttribute("slot"));
  const originals = () => items().filter((item) => !isCopy(item));

  // Bleed: the room to the window's edges, kept up to date as the page's width changes.
  const bleed = options.bleed ?? "none";
  if (bleed !== "none") {
    const measure = () => {
      const { before, after } = bleedRoom(block);
      block.style.setProperty("--ds-slide-before", `${before}px`);
      block.style.setProperty("--ds-slide-after", `${after}px`);
    };
    measure();
    const sized = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    sized?.observe(document.documentElement);
    sized?.observe(block);
    window.addEventListener("resize", measure);
    stops.push(() => { sized?.disconnect(); window.removeEventListener("resize", measure); });
  }

  // Loop: the items three times over, the strip opened on the middle set.
  const count = originals().length;
  const looping = !!options.loop && count > 1;
  if (looping) {
    const copies = () => originals().map((item) => {
      const copy = item.cloneNode(true) as HTMLElement;
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
    stops.push(() => items().filter(isCopy).forEach((copy) => copy.remove()));
  }
  // A set's length: from an item to the same item in the next set.
  const span = () => {
    const all = items();
    return looping && all.length > count ? Math.abs(start(track, all[count]) - start(track, all[0])) : 0;
  };
  const direction = () => (rtl(track) ? -1 : 1);
  // Kept within the middle set: past either side, the strip moves a whole set at once, the same items under the eye.
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

  /** The item standing at the strip's start, or the nearest to it. */
  const atStart = (): number => {
    const all = items();
    const at = Math.abs(track.scrollLeft);
    let nearest = 0;
    let distance = Infinity;
    all.forEach((item, index) => {
      const away = Math.abs(Math.abs(start(track, item)) - at);
      if (away < distance) { distance = away; nearest = index; }
    });
    return nearest;
  };

  const step = (towards: 1 | -1) => {
    if (looping) within();
    const all = items();
    const target = all[atStart() + towards];
    if (target) scrollToSlide(track, target, true);
    else if (!looping && towards === 1 && options.autoplay) scrollToSlide(track, all[0], true);
  };

  // Autoplay: an item at a time, held while a person is in the strip or cannot see it.
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

/** Attributes the script wrote, so what the page wrote is left alone. */
const written = new WeakMap<Element, Set<string>>();
function own(element: Element, name: string, value: string): void {
  const mine = written.get(element) ?? new Set<string>();
  if (element.hasAttribute(name) && !mine.has(name)) return;
  mine.add(name);
  written.set(element, mine);
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

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

/** What `startSlides` is told. */
export interface StartSlidesOptions {
  /** Where the icons are, for the buttons the script adds (`/ds1/x-icon/`). */
  icons?: string;
}

/**
 * Starts every `.ds-slide` inside `root`, reading its options from its data
 * attributes. Returns the way to stop them all.
 */
export function startSlides(root: ParentNode = document, options: StartSlidesOptions = {}): () => void {
  const handles: { stop(): void }[] = [];
  const icons = options.icons ?? "";
  root.querySelectorAll<HTMLElement>(".ds-slide").forEach((block) => {
    const track = block.querySelector<HTMLElement>(":scope > .ds-slide__track");
    if (!track || block.dataset.dsSlideStarted) return;
    block.dataset.dsSlideStarted = "";
    own(block, "role", "region");
    own(track, "role", "list");
    const every = autoplayInterval(block.dataset.autoplay ?? null);
    const handle = startSlide(block, track, track, {
      bleed: (["end", "both"].includes(block.dataset.bleed ?? "") ? block.dataset.bleed : "none") as SlideOptions["bleed"],
      loop: block.dataset.loop !== undefined && block.dataset.loop !== "false",
      autoplay: every,
    });
    for (const item of track.children) own(item, "role", "listitem");

    let controls = block.querySelector<HTMLElement>(":scope > .ds-slide__controls");
    const previous = controls?.querySelector<HTMLButtonElement>(".ds-slide__previous");
    const next = controls?.querySelector<HTMLButtonElement>(".ds-slide__next");
    const label = () => {
      if (previous) own(previous, "aria-label", carouselWord("Previous slide"));
      if (next) own(next, "aria-label", carouselWord("Next slide"));
    };
    previous?.addEventListener("click", () => handle.step(-1));
    next?.addEventListener("click", () => handle.step(1));

    let pause: HTMLButtonElement | null = null;
    if (every > 0 && !prefersReducedMotion()) {
      if (!controls) {
        controls = document.createElement("div");
        controls.className = "ds-slide__controls";
        block.append(controls);
      }
      pause = controls.querySelector<HTMLButtonElement>(".ds-slide__pause") ?? iconButton("ds-slide__pause", "pause");
      if (!pause.isConnected) controls.prepend(pause);
      const draw = () => {
        if (!pause) return;
        pause.setAttribute("aria-pressed", String(handle.paused));
        pause.setAttribute("aria-label", carouselWord(handle.paused ? "Play" : "Pause"));
        drawIcon(pause, handle.paused ? "play-alt" : "pause", icons);
      };
      pause.addEventListener("click", () => { handle.pause(!handle.paused); draw(); });
      draw();
    }
    label();
    const relabel = () => { label(); pause?.setAttribute("aria-label", carouselWord(handle.paused ? "Play" : "Pause")); };
    window.addEventListener("language-changed", relabel);
    window.addEventListener("translations-loaded", relabel);
    handles.push({
      stop() {
        handle.stop();
        window.removeEventListener("language-changed", relabel);
        window.removeEventListener("translations-loaded", relabel);
        delete block.dataset.dsSlideStarted;
      },
    });
  });
  return () => handles.splice(0).forEach((handle) => handle.stop());
}
