/**
 * The few helpers every screen of the app draws with: `h` builds an element
 * from a tag, its attributes and its children, and `when` writes a time as
 * "3 minutes ago". The app has no framework; each screen builds its DOM with
 * these and replaces it whole when its data changes.
 */

export type Child = Node | string | number | null | undefined | false | Child[];
type Props = Record<string, unknown>;

/** An element with attributes and children. `on<event>` props add listeners; false, null and undefined leave an attribute out. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(props)) {
    if (value === false || value === null || value === undefined) continue;
    if (name.startsWith("on") && typeof value === "function") element.addEventListener(name.slice(2), value as EventListener);
    else if (name === "value" && "value" in element) (element as HTMLInputElement).value = String(value);
    else if (name === "style" && typeof value === "object") Object.assign(element.style, value);
    else element.setAttribute(name, value === true ? "" : String(value));
  }
  append(element, children);
  return element;
}

/** Puts children into an element, skipping the empty ones. */
export function append(element: Element, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) append(element, child);
    else element.append(typeof child === "number" ? String(child) : child);
  }
}

/** Replaces everything in an element. */
export function replace(element: Element, ...children: Child[]): void {
  element.replaceChildren();
  append(element, children);
}

/** A line of interface words in Design system 1's text classes: `muted`, `small`, `heading`, `strong`. */
export function text(words: Child, ...tones: string[]): HTMLSpanElement {
  return h("span", { class: ["ds-text", ...tones.map(tone => `ds-text--${tone}`)].join(" ") }, words);
}

/** A screen's heading, on its own square. */
export function heading(words: string): HTMLHeadingElement {
  return h("h1", { class: "ds-text ds-text--heading team-heading" }, words);
}

/** A message in the flow: Design system 1's notice, neutral or in a tone. */
export function notice(title: string, words?: string, tone?: "success" | "warning" | "danger"): HTMLDivElement {
  return h(
    "div",
    { class: `ds-notice${tone ? ` ds-notice--${tone}` : ""}`, role: tone === "danger" ? "alert" : "status" },
    h("span", { class: "ds-notice__mark", "aria-hidden": "true" }),
    h("p", { class: "ds-notice__title" }, title),
    words ? h("p", { class: "ds-notice__text" }, words) : null,
  );
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const steps: [Intl.RelativeTimeFormatUnit, number][] = [["second", 60], ["minute", 60], ["hour", 24], ["day", 7], ["week", 4.35], ["month", 12], ["year", Infinity]];

/** A time as how long ago it was: "now", "3 minutes ago", "yesterday". */
export function when(time: number | string | null | undefined, now = Date.now()): string {
  if (time === null || time === undefined || time === "") return "";
  const at = typeof time === "number" ? time : Date.parse(time);
  if (Number.isNaN(at)) return "";
  let amount = (at - now) / 1000;
  if (Math.abs(amount) < 45) return "now";
  for (const [unit, size] of steps) {
    if (Math.abs(amount) < size) return relative.format(Math.round(amount), unit);
    amount /= size;
  }
  return "";
}

/** A whole number with the thousands marked, as English writes it. */
export function count(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en-GB") : "–";
}
