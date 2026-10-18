// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test, vi } from "vite-plus/test";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const { configureI18n, loadSharedWords, setLanguage } = await import("../DS1/0-face/i18n");
const script = await import("../DS1/0-face/carousel");
await import("../DS1/2-core/ds-pagedots");
await import("../DS1/3-unit/ds-carousel");
type Dots = HTMLElementTagNameMap["ds-pagedots"];
type Carousel = HTMLElementTagNameMap["ds-carousel"];

afterEach(() => { document.body.replaceChildren(); setLanguage("en"); script.setCarouselWords(null); vi.restoreAllMocks(); });

const sheet = (name: string) => readFileSync(join(import.meta.dirname, `../DS1/${name}`), "utf8");
const settle = async (element: { updateComplete: Promise<unknown> }) => { await element.updateComplete; await new Promise(resolve => setTimeout(resolve)); await element.updateComplete; };
const dotsOf = (host: Element) => [...(host.shadowRoot ?? host).querySelectorAll<HTMLButtonElement>(".ds-pagedots__dot")];
const states = (host: Element) => dotsOf(host).map(dot => dot.dataset.state);
const key = (target: Element, name: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, composed: true, cancelable: true }));

async function pagedots(attributes = "") {
  document.body.innerHTML = `<ds-pagedots ${attributes}></ds-pagedots>`;
  const dots = document.querySelector("ds-pagedots") as Dots;
  await dots.updateComplete;
  return dots;
}

async function carousel(attributes = "", slides = 4) {
  document.body.innerHTML = `<ds-carousel label="Colours" literal ${attributes}>${Array.from({ length: slides }, (_, index) => `<figure>Slide ${index + 1}</figure>`).join("")}</ds-carousel>`;
  const element = document.querySelector("ds-carousel") as Carousel;
  await settle(element);
  return element;
}

test("dots read past, current, next and future, and the last can be an end marker", () => {
  expect([0, 1, 2, 3, 4].map(index => script.dotState(index, 2, 5))).toEqual(["past", "past", "current", "next", "future"]);
  expect([0, 1, 2, 3].map(index => script.dotState(index, 0, 4, true))).toEqual(["current", "next", "future", "end"]);
  expect(script.dotState(3, 2, 4, true)).toBe("end");
  expect(script.dotState(3, 3, 4, true)).toBe("current");
});

test("arrow keys follow the reading direction; Home and End go to the ends", () => {
  expect(script.dotForKey("ArrowRight", 1, 4)).toBe(2);
  expect(script.dotForKey("ArrowLeft", 1, 4)).toBe(0);
  expect(script.dotForKey("ArrowLeft", 0, 4)).toBe(0);
  expect(script.dotForKey("ArrowRight", 3, 4)).toBe(3);
  expect(script.dotForKey("ArrowLeft", 1, 4, true)).toBe(2);
  expect(script.dotForKey("Home", 2, 4)).toBe(0);
  expect(script.dotForKey("End", 0, 4)).toBe(3);
  expect(script.dotForKey("Enter", 0, 4)).toBeUndefined();
});

test("today's page dots still draw from count and active, now as buttons in a labelled group", async () => {
  const dots = await pagedots('count="3" active="0"');
  expect(dotsOf(dots)).toHaveLength(3);
  expect(dots.getAttribute("role")).toBe("group");
  expect(dots.getAttribute("aria-label")).toBe("Slides");
  expect(dotsOf(dots).map(dot => dot.getAttribute("aria-label"))).toEqual(["Slide 1", "Slide 2", "Slide 3"]);
  expect(dotsOf(dots).map(dot => dot.getAttribute("aria-current"))).toEqual(["true", "false", "false"]);
  expect(states(dots)).toEqual(["current", "next", "future"]);
  dots.active = 2; await dots.updateComplete;
  expect(states(dots)).toEqual(["past", "past", "current"]);
  dots.count = 0; await dots.updateComplete;
  expect(dotsOf(dots)).toHaveLength(0);
});

test("only the current dot is in the tab order", async () => {
  const dots = await pagedots('count="4" active="1"');
  expect(dotsOf(dots).map(dot => dot.tabIndex)).toEqual([-1, 0, -1, -1]);
});

test("a click fires a cancelable select with the dot and the one before it, and makes it current", async () => {
  const dots = await pagedots('count="4" end');
  const picks: unknown[] = [];
  dots.addEventListener("select", event => picks.push((event as CustomEvent).detail));
  dotsOf(dots)[2]!.click(); await dots.updateComplete;
  expect(picks).toEqual([{ index: 2, previous: 0 }]);
  expect(dots.active).toBe(2);
  expect(states(dots)).toEqual(["past", "past", "current", "end"]);
  dots.addEventListener("select", event => event.preventDefault());
  dotsOf(dots)[0]!.click(); await dots.updateComplete;
  expect(dots.active).toBe(2);
});

test("the arrow keys, Home and End move between the dots and pick them, focus following", async () => {
  const dots = await pagedots('count="4"');
  const picks: number[] = [];
  dots.addEventListener("select", event => picks.push((event as CustomEvent).detail.index));
  dotsOf(dots)[0]!.focus();
  key(dotsOf(dots)[0]!, "ArrowRight"); await dots.updateComplete;
  expect(dots.active).toBe(1);
  expect(dots.shadowRoot!.activeElement).toBe(dotsOf(dots)[1]);
  key(dotsOf(dots)[1]!, "End"); await dots.updateComplete;
  key(dotsOf(dots)[3]!, "Home"); await dots.updateComplete;
  key(dotsOf(dots)[0]!, "ArrowLeft"); await dots.updateComplete;
  expect(picks).toEqual([1, 3, 0, 0]);
  expect(dots.active).toBe(0);
  expect(key(dotsOf(dots)[0]!, "Tab")).toBe(true);
});

test("the dots' words are the shared words in the page's language, or the page's own", async () => {
  configureI18n({ languages: ["en", "da"], sharedWords: true });
  await loadSharedWords();
  setLanguage("da");
  const dots = await pagedots('count="2"');
  expect(dots.getAttribute("aria-label")).toBe("Dias");
  expect(dotsOf(dots)[1]!.getAttribute("aria-label")).toBe("Dias 2");
  dots.label = "Pages"; dots.dotLabel = "Page {index}"; dots.literal = true; await dots.updateComplete;
  expect(dots.getAttribute("aria-label")).toBe("Pages");
  expect(dotsOf(dots)[1]!.getAttribute("aria-label")).toBe("Page 2");
});

test("every language has the carousel's words, with their placeholders", () => {
  const words = ["Carousel", "Slide", "Slides", "Slide {index}", "{index} of {count}", "Previous slide", "Next slide"];
  for (const language of ["da", "de", "en", "es", "fi", "fr", "is", "it", "ja", "ko", "nb", "pt", "pt-BR", "sv", "zh"]) {
    const table = JSON.parse(sheet(`0-face/translations/${language}.json`))[language] as Record<string, string>;
    for (const word of words) {
      expect(table[word], `${language}: ${word}`).toBeTruthy();
      for (const placeholder of word.match(/\{\w+\}/g) ?? []) expect(table[word], `${language}: ${word}`).toContain(placeholder);
    }
  }
});

test("a carousel is a named region of labelled slides with a dot each", async () => {
  const element = await carousel();
  expect(element.getAttribute("role")).toBe("region");
  expect(element.getAttribute("aria-roledescription")).toBe("Carousel");
  expect(element.getAttribute("aria-label")).toBe("Colours");
  const slides = [...element.querySelectorAll("figure")];
  expect(slides.map(slide => slide.getAttribute("role"))).toEqual(["group", "group", "group", "group"]);
  expect(slides.map(slide => slide.getAttribute("aria-roledescription"))).toEqual(["Slide", "Slide", "Slide", "Slide"]);
  expect(slides.map(slide => slide.getAttribute("aria-label"))).toEqual(["1 of 4", "2 of 4", "3 of 4", "4 of 4"]);
  const dots = element.shadowRoot!.querySelector("ds-pagedots")!;
  expect(dotsOf(dots)).toHaveLength(4);
  expect(element.shadowRoot!.querySelector(".ds-carousel__previous")).toBeNull();
  expect(element.shadowRoot!.querySelector('[aria-live="polite"]')!.textContent).toBe("");
});

test("labels the page wrote are kept, and slides added later are counted", async () => {
  document.body.innerHTML = '<ds-carousel aria-label="Reviews"><figure aria-label="Ada">One</figure><figure>Two</figure></ds-carousel>';
  const element = document.querySelector("ds-carousel") as Carousel;
  await settle(element);
  expect(element.getAttribute("aria-label")).toBe("Reviews");
  const [first, second] = [...element.querySelectorAll("figure")];
  expect(first!.getAttribute("aria-label")).toBe("Ada");
  expect(second!.getAttribute("aria-label")).toBe("2 of 2");
  element.append(Object.assign(document.createElement("figure"), { textContent: "Three" }));
  await settle(element);
  expect(second!.getAttribute("aria-label")).toBe("2 of 3");
  expect(dotsOf(element.shadowRoot!.querySelector("ds-pagedots")!)).toHaveLength(3);
});

test("previous and next take the left and right icons, are named, and stop at the ends", async () => {
  const element = await carousel("buttons", 3);
  const previous = element.shadowRoot!.querySelector<HTMLButtonElement>(".ds-carousel__previous")!;
  const next = element.shadowRoot!.querySelector<HTMLButtonElement>(".ds-carousel__next")!;
  expect(previous.getAttribute("aria-label")).toBe("Previous slide");
  expect(next.getAttribute("aria-label")).toBe("Next slide");
  expect(previous.querySelector("ds-icon")!.getAttribute("type")).toBe("left");
  expect(next.querySelector("ds-icon")!.getAttribute("type")).toBe("right");
  expect([previous.disabled, next.disabled]).toEqual([true, false]);
  const changes: unknown[] = [];
  element.addEventListener("change", event => changes.push((event as CustomEvent).detail));
  next.click(); await element.updateComplete;
  next.click(); await element.updateComplete;
  expect(element.current).toBe(2);
  expect(changes).toEqual([{ index: 1, previous: 0 }, { index: 2, previous: 1 }]);
  expect([previous.disabled, next.disabled]).toEqual([false, true]);
  expect(element.shadowRoot!.querySelector('[aria-live="polite"]')!.textContent).toBe("3 of 3");
});

test("a dot inside the carousel moves it; its select stays inside and comes out as change", async () => {
  const element = await carousel();
  const outside: string[] = [];
  document.body.addEventListener("select", () => outside.push("select"));
  element.addEventListener("change", event => outside.push(`change ${(event as CustomEvent).detail.index}`));
  const dots = element.shadowRoot!.querySelector("ds-pagedots")!;
  dotsOf(dots)[3]!.click(); await element.updateComplete; await dots.updateComplete;
  expect(outside).toEqual(["change 3"]);
  expect(element.current).toBe(3);
  expect(dots.active).toBe(3);
  expect(element.shadowRoot!.querySelector('[aria-live="polite"]')!.textContent).toBe("4 of 4");
});

test("setting current moves the carousel without a change event", async () => {
  const element = await carousel('current="2"');
  expect(element.shadowRoot!.querySelector("ds-pagedots")!.active).toBe(2);
  const changes: unknown[] = [];
  element.addEventListener("change", event => changes.push(event));
  element.goTo(0); await element.updateComplete;
  expect(element.shadowRoot!.querySelector("ds-pagedots")!.active).toBe(0);
  expect(changes).toEqual([]);
});

test("slide widths and gaps are whole squares; no-dots and a single slide leave the controls out", async () => {
  const element = await carousel('slide-width="12" gap="2"');
  expect(element.style.getPropertyValue("--ds-carousel-slide")).toBe("calc(var(--ds-unit) * 12)");
  expect(element.style.getPropertyValue("--ds-carousel-gap")).toBe("calc(var(--ds-unit) * 2)");
  element.slideWidth = 12.6; element.gap = 0; await element.updateComplete;
  expect(element.style.getPropertyValue("--ds-carousel-slide")).toBe("calc(var(--ds-unit) * 12)");
  expect(element.style.getPropertyValue("--ds-carousel-gap")).toBe("calc(var(--ds-unit) * 0)");
  element.slideWidth = 0; element.gap = -1; await element.updateComplete;
  expect(element.style.getPropertyValue("--ds-carousel-slide")).toBe("");
  expect(element.style.getPropertyValue("--ds-carousel-gap")).toBe("");
  element.noDots = true; await element.updateComplete;
  expect(element.shadowRoot!.querySelector(".ds-carousel__controls")).toBeNull();
  const single = await carousel("buttons", 1);
  expect(single.shadowRoot!.querySelector(".ds-carousel__controls")).toBeNull();
});

/** A track 100px wide whose slides stand 120px apart, scrolled to `left`. */
function laidOut(left = 0, rtl = false) {
  const track = document.createElement("div");
  if (rtl) track.dir = "rtl";
  const slides = [0, 1, 2, 3].map(() => track.appendChild(document.createElement("div")));
  Object.defineProperties(track, { scrollWidth: { value: 460 }, clientWidth: { value: 100 }, scrollLeft: { value: left, writable: true } });
  vi.spyOn(track, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 50));
  slides.forEach((slide, index) => vi.spyOn(slide, "getBoundingClientRect").mockImplementation(() => {
    const start = rtl ? 100 - (index * 120 + 100) - (track.scrollLeft) : index * 120 - track.scrollLeft;
    return new DOMRect(start, 0, 100, 50);
  }));
  const scrolls: ScrollToOptions[] = [];
  track.scrollTo = ((options: ScrollToOptions) => { scrolls.push(options); }) as typeof track.scrollTo;
  document.body.append(track);
  return { track, slides, scrolls };
}

test("going to a slide scrolls its start to the track's, smoothly unless the reader asks for reduced motion", () => {
  const { track, slides, scrolls } = laidOut();
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query }));
  expect(script.scrollToSlide(track, slides[2]!)).toBe(true);
  expect(scrolls.at(-1)).toEqual({ left: 240, behavior: "smooth" });
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduce"), media: query }));
  script.scrollToSlide(track, slides[1]!);
  expect(scrolls.at(-1)).toEqual({ left: 120, behavior: "instant" });
  // As far as the track goes, and no further.
  script.scrollToSlide(track, slides[3]!, false);
  expect(scrolls.at(-1)).toEqual({ left: 360, behavior: "instant" });
  expect(script.scrollToSlide(track, slides[0]!)).toBe(false);
  vi.unstubAllGlobals();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
});

test("the slide in view is the one whose start is nearest, and the far end keeps a slide wholly in view", () => {
  const { track, slides } = laidOut(130);
  expect(script.nearestSlide(track, slides)).toBe(1);
  track.scrollLeft = 360;
  expect(script.nearestSlide(track, slides, 0)).toBe(3);
  expect(script.nearestSlide(track, slides, 3)).toBe(3);
  const rtl = laidOut(-250, true);
  expect(script.nearestSlide(rtl.track, rtl.slides)).toBe(2);
});

test("the script gives native markup the same region, slides, dots, buttons and announcement", async () => {
  document.body.innerHTML = `<section class="ds-carousel" aria-label="Colours">
    <div class="ds-carousel__track"><figure>One</figure><figure aria-label="Two, blue">Two</figure><figure>Three</figure></div>
    <div class="ds-carousel__controls">
      <button class="ds-button ds-button--icon ds-carousel__previous" type="button"></button>
      <div class="ds-pagedots" data-end></div>
      <button class="ds-button ds-button--icon ds-carousel__next" type="button"></button>
    </div>
  </section>`;
  const stop = script.startCarousels();
  const block = document.querySelector<HTMLElement>(".ds-carousel")!;
  expect(block.getAttribute("role")).toBe("region");
  expect(block.getAttribute("aria-roledescription")).toBe("Carousel");
  expect(block.getAttribute("aria-label")).toBe("Colours");
  expect([...block.querySelectorAll("figure")].map(slide => slide.getAttribute("aria-label"))).toEqual(["1 of 3", "Two, blue", "3 of 3"]);
  const dots = block.querySelector<HTMLElement>(".ds-pagedots")!;
  expect(dots.getAttribute("role")).toBe("group");
  expect(states(dots)).toEqual(["current", "next", "end"]);
  expect(dotsOf(dots).map(dot => dot.tabIndex)).toEqual([0, -1, -1]);
  const [previous, next] = [block.querySelector<HTMLButtonElement>(".ds-carousel__previous")!, block.querySelector<HTMLButtonElement>(".ds-carousel__next")!];
  expect([previous.getAttribute("aria-label"), next.getAttribute("aria-label")]).toEqual(["Previous slide", "Next slide"]);
  expect(previous.disabled).toBe(true);
  const changes: unknown[] = [];
  block.addEventListener("change", event => changes.push((event as CustomEvent).detail));
  next.click();
  expect(changes).toEqual([{ index: 1, previous: 0 }]);
  expect(block.querySelector('.ds-carousel__status[aria-live="polite"]')!.textContent).toBe("2 of 3");
  key(dotsOf(dots)[1]!, "End");
  expect(states(dots)).toEqual(["past", "past", "current"]);
  expect(document.activeElement).toBe(dotsOf(dots)[2]);
  expect(next.disabled).toBe(true);
  expect(script.startCarousel(block)).toBe(script.startCarousel(block));
  stop();
});

test("the script's words follow the language module, or the page's own", async () => {
  document.body.innerHTML = '<div class="ds-carousel"><div class="ds-carousel__track"><p>One</p><p>Two</p></div><div class="ds-pagedots"></div></div>';
  configureI18n({ languages: ["en", "ja"], sharedWords: true });
  await loadSharedWords();
  const stop = script.startCarousels();
  const block = document.querySelector<HTMLElement>(".ds-carousel")!;
  expect(block.getAttribute("aria-roledescription")).toBe("Carousel");
  // The script's own words follow the language as it changes.
  setLanguage("ja");
  expect(block.getAttribute("aria-roledescription")).toBe("カルーセル");
  expect(block.querySelector("p")!.getAttribute("aria-label")).toBe("2 枚中 1 枚目");
  expect(block.querySelector(".ds-pagedots__dot")!.getAttribute("aria-label")).toBe("スライド 1");
  stop();
  script.setCarouselWords({ "Slide {index}": "Card {index}" });
  document.body.innerHTML = '<div class="ds-pagedots"></div>';
  script.startPagedots(document.querySelector<HTMLElement>(".ds-pagedots")!, { count: 2 });
  expect(dotsOf(document.querySelector(".ds-pagedots")!)[1]!.getAttribute("aria-label")).toBe("Card 2");
});

test("the dots and the carousel are drawn on the square, autoplay is opt-in, and motion is only on transform", () => {
  const css = sheet("1-root/carousel.css").replace(/\/\*[\s\S]*?\*\//g, "");
  expect(css).toMatch(/\.ds-pagedots__dot \{[^}]*width: var\(--ds-unit\);[^}]*height: var\(--ds-unit\);/);
  expect(css).toMatch(/\.ds-carousel__controls \{[^}]*height: var\(--ds-row-height\);/);
  expect(css).toMatch(/\.ds-carousel__track \{[^}]*scroll-snap-type: x mandatory;/);
  expect(css).toMatch(/column-gap: var\(--ds-carousel-gap, var\(--ds-unit\)\);/);
  for (const [, value] of css.matchAll(/transition: ([^;]+);/g)) expect(value).toMatch(/^(transform [^,]+|none)$/);
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.ds-pagedots__dot::before \{\s*transition: none;/);
  expect(sheet("1-root/controls.css")).toContain('@import "./carousel.css";');
  expect(script.autoplayInterval(null)).toBe(0);
  expect(sheet("3-unit/ds-carousel.ts")).toContain("this.autoplay = null;");
});
