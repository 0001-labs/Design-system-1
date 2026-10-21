// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test, vi } from "vite-plus/test";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const { loadTranslations, setLanguage } = await import("../DS1/0-face/i18n");
await import("../DS1/2-core/ds-empty");
await import("../DS1/2-core/ds-notice");

afterEach(() => { document.body.replaceChildren(); setLanguage("en"); });

const sheet = (name: string) => readFileSync(join(import.meta.dirname, `../DS1/1-root/${name}`), "utf8");
const rule = (css: string, selector: string) => {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf("}", start));
};
const shown = (host: Element, part: string) => {
  const element = host.shadowRoot!.querySelector(`[part="${part}"]`);
  return Boolean(element) && !element!.hasAttribute("hidden");
};

test("an empty state's title is the shared words' Nothing here yet, in the current language", async () => {
  loadTranslations("da", { "Nothing here yet": "Intet her endnu", "No lists": "Ingen lister", "Make one to start.": "Lav en for at begynde." });
  setLanguage("en");
  const empty = document.createElement("ds-empty");
  document.body.append(empty);
  await empty.updateComplete;
  const title = () => empty.shadowRoot!.querySelector('[part="title"]')!.textContent!.trim();
  expect(title()).toBe("Nothing here yet");
  setLanguage("da"); await empty.updateComplete;
  expect(title()).toBe("Intet her endnu");
  expect(shown(empty, "text")).toBe(false);
  expect(shown(empty, "icon")).toBe(false);
  expect(shown(empty, "actions")).toBe(false);

  empty.heading = "No lists"; empty.text = "Make one to start."; await empty.updateComplete;
  expect(title()).toBe("Ingen lister");
  expect(empty.shadowRoot!.querySelector('[part="text"]')!.textContent!.trim()).toBe("Lav en for at begynde.");
  empty.literal = true; await empty.updateComplete;
  expect(title()).toBe("No lists");
});

test("an empty state shows its icon, slotted words, actions and heading level only when given", async () => {
  const empty = document.createElement("ds-empty");
  empty.icon = "search"; empty.level = 2;
  empty.innerHTML = '<span slot="heading">No results</span>Try <a href="/help">another word</a>.<button slot="actions">Clear</button>';
  document.body.append(empty);
  await empty.updateComplete;
  for (const part of ["icon", "text", "actions"]) expect(shown(empty, part), part).toBe(true);
  const title = empty.shadowRoot!.querySelector('[part="title"]')!;
  expect(title.getAttribute("role")).toBe("heading");
  expect(title.getAttribute("aria-level")).toBe("2");
  expect(empty.shadowRoot!.querySelector("ds-icon")!.getAttribute("size")).toBe("large");
  expect(empty.shadowRoot!.querySelector(".ds-empty--centered")).not.toBeNull();
  empty.centered = false; await empty.updateComplete;
  expect(empty.shadowRoot!.querySelector(".ds-empty--start")).not.toBeNull();
  empty.querySelector('[slot="actions"]')!.remove();
  await new Promise(resolve => setTimeout(resolve)); await empty.updateComplete;
  expect(shown(empty, "actions")).toBe(false);
});

test("a done empty state says everything is found: the check on the success green's mark, the title in that green", async () => {
  const empty = document.createElement("ds-empty");
  empty.setAttribute("tone", "done");
  empty.heading = "Every receipt is found";
  document.body.append(empty);
  await empty.updateComplete;
  const block = empty.shadowRoot!.querySelector('[part="empty"]')!;
  expect(block.classList.contains("ds-empty--done")).toBe(true);
  // The check is its icon unless the page gives another.
  expect(shown(empty, "icon")).toBe(true);
  expect(empty.shadowRoot!.querySelector('[part="icon"] ds-icon')!.getAttribute("type") ?? (empty.shadowRoot!.querySelector('[part="icon"] ds-icon') as HTMLElement & { type: string }).type).toBe("check");
  empty.icon = "receipt"; await empty.updateComplete;
  expect((empty.shadowRoot!.querySelector('[part="icon"] ds-icon') as HTMLElement & { type: string }).type).toBe("receipt");
  // One green, shared: deep on light paper, Apple green on dark, a mark one control high on the sixteen.
  const tokens = readFileSync(join(import.meta.dirname, "../DS1/1-root/component-tokens.css"), "utf8");
  expect(tokens).toContain("--ds-success-color: light-dark(");
  const css = sheet("empty.css");
  expect(rule(css, ".ds-empty--done .ds-empty__icon")).toContain("var(--ds-success-color)");
  expect(rule(css, ".ds-empty--done .ds-empty__title")).toContain("var(--ds-success-color)");
});

test("a notice is a status, an alert when it reports danger, and keeps a role the page gives it", async () => {
  const notice = document.createElement("ds-notice");
  notice.text = "Saved";
  document.body.append(notice);
  await notice.updateComplete;
  expect(notice.getAttribute("role")).toBe("status");
  expect(notice.shadowRoot!.querySelector(".ds-notice")!.className).toBe("ds-notice");
  notice.tone = "danger"; await notice.updateComplete;
  expect(notice.getAttribute("role")).toBe("alert");
  expect(notice.shadowRoot!.querySelector(".ds-notice--danger")).not.toBeNull();
  expect(notice.shadowRoot!.querySelector('[part="mark"] ds-icon')!.getAttribute("aria-hidden")).toBeNull();
  expect(notice.shadowRoot!.querySelector('[part="mark"]')!.getAttribute("aria-hidden")).toBe("true");
  expect(shown(notice, "title")).toBe(false);
  expect(shown(notice, "text")).toBe(true);

  const owned = document.createElement("ds-notice");
  owned.setAttribute("role", "alert"); owned.tone = "warning";
  document.body.append(owned); await owned.updateComplete;
  expect(owned.getAttribute("role")).toBe("alert");
  owned.tone = "success"; await owned.updateComplete;
  expect(owned.getAttribute("role")).toBe("alert");

  const unknown = document.createElement("ds-notice");
  unknown.setAttribute("tone", "loud");
  document.body.append(unknown); await unknown.updateComplete;
  expect(unknown.resolvedTone).toBe("neutral");
  expect(unknown.shadowRoot!.querySelector('[part="mark"] ds-icon')).toMatchObject({ type: "info" });
});

test("dismissing a notice asks first: it hides unless the page cancels, and the button is labelled", async () => {
  loadTranslations("da", { Close: "Luk" });
  setLanguage("da");
  const notice = document.createElement("ds-notice");
  notice.heading = "Couldn't save"; notice.literal = true; notice.dismissible = true;
  document.body.append(notice);
  await notice.updateComplete;
  const button = notice.shadowRoot!.querySelector<HTMLButtonElement>('[part="dismiss"]')!;
  expect(button.getAttribute("aria-label")).toBe("Luk");
  expect(button.className).toContain("ds-button--icon");
  const keep = (event: Event) => event.preventDefault();
  notice.addEventListener("ds-notice-dismiss", keep);
  button.click();
  expect(notice.hidden).toBe(false);
  notice.removeEventListener("ds-notice-dismiss", keep);
  const seen = vi.fn();
  document.body.addEventListener("ds-notice-dismiss", seen);
  button.click();
  expect(seen).toHaveBeenCalledTimes(1);
  expect(notice.hidden).toBe(true);
  document.body.removeEventListener("ds-notice-dismiss", seen);
});

test("the native classes are on the grid and take their colours from tokens", () => {
  const empty = sheet("empty.css"), notice = sheet("notice.css"), controls = sheet("controls.css");
  expect(controls).toContain('@import "./empty.css";');
  expect(controls).toContain('@import "./notice.css";');
  expect(rule(empty, ".ds-empty")).toContain("max-width: var(--ds-empty-measure, calc(16 * var(--ds-unit)))");
  expect(rule(empty, ".ds-empty")).toContain("line-height: var(--ds-unit)");
  expect(rule(empty, ".ds-empty__actions")).toContain("margin-top: var(--ds-unit)");
  expect(rule(notice, ".ds-notice")).toContain("grid-template-columns: var(--ds-unit) minmax(0, 1fr) auto");
  expect(rule(notice, ".ds-notice")).toContain("line-height: var(--ds-unit)");
  const mark = rule(notice, ".ds-notice__mark");
  expect(mark).toContain("width: var(--ds-control-height)");
  expect(mark).toContain("height: var(--ds-control-height)");
  expect(rule(notice, ".ds-notice--danger")).toContain("--ds-notice-ink: var(--ds-danger-color)");
  // Colours are tokens: no raw hex, rgb or named reds. A cut word's mask is an alpha, not a colour.
  for (const css of [empty, notice]) expect(css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/mask-image:[^;]*;/g, "")).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|\bred\b/i);
});
