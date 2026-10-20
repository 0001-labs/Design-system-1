// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test, vi } from "vite-plus/test";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const { loadSharedWords, loadTranslations, setLanguage } = await import("../DS1/0-face/i18n");
const { figureCells, formatFigure, meterAria } = await import("../DS1/2-core/figures");
const { stepStates } = await import("../DS1/2-core/ds-progress");
await import("../DS1/2-core/ds-stat");
await import("../DS1/2-core/ds-progress");

await loadSharedWords();
afterEach(() => { document.body.replaceChildren(); setLanguage("en"); });

async function mount<K extends "ds-stat" | "ds-progress">(tag: K, markup: string): Promise<HTMLElementTagNameMap[K]> {
  document.body.innerHTML = markup;
  const element = document.querySelector(tag)!;
  await element.updateComplete;
  return element;
}
const part = (host: Element, name: string) => host.shadowRoot!.querySelector<HTMLElement>(`[part~="${name}"]`)!;
const words = (element: Element | null) => element?.textContent?.replace(/\s+/g, " ").trim() ?? "";
/** Intl writes a no-break space (or a narrow one) between a figure and its sign or currency. */
const plain = (text: string) => text.replace(/[\u00a0\u202f]/g, " ");

test("a figure is written in the current language: numbers, short numbers, percentages and money", () => {
  expect(formatFigure(1234.5)).toBe("1,234.5");
  expect(formatFigure(12_345, { format: "compact" })).toBe("12.3K");
  expect(formatFigure(0.25, { format: "percent" })).toBe("25%");
  expect(formatFigure(1999, { format: "money", currency: "USD", minor: true })).toBe("$19.99");
  expect(formatFigure(1234.5, { format: "money", currency: "JPY" })).toBe("¥1,235");
  expect(formatFigure(0.12, { format: "percent", signed: true })).toBe("+12%");
  expect(formatFigure(0, { format: "percent", signed: true })).toBe("0%");
  expect(formatFigure(2, { digits: 2 })).toBe("2.00");
  // Money without a currency is a number, and an unknown format is one too.
  expect(formatFigure(5, { format: "money" })).toBe("5");
  expect(formatFigure(5, { format: "nonsense" as never })).toBe("5");
  expect(formatFigure(1234.5, { language: "da" })).toBe("1.234,5");
  expect(formatFigure(Number.NaN)).toBe("");
});

test("a figure's digits are cut into cells, the signs and letters between kept as runs", () => {
  expect(figureCells("-€1,204")).toEqual([
    { text: "-€", digit: false }, { text: "1", digit: true }, { text: ",", digit: false },
    { text: "2", digit: true }, { text: "0", digit: true }, { text: "4", digit: true },
  ]);
});

test("a stat draws its label, its figure in the language and its change and caption on the line under it", async () => {
  loadTranslations("da", { Revenue: "Omsætning", "Since last month": "Siden sidste måned" });
  const stat = await mount("ds-stat", '<ds-stat label="Revenue" value="1234.5" format="money" currency="EUR" change="0.12" change-format="percent" caption="Since last month"></ds-stat>');
  expect(words(part(stat, "label"))).toBe("Revenue");
  expect(words(part(stat, "figure"))).toBe("€1,234.50");
  expect(words(part(stat, "change"))).toBe("+12%");
  expect(part(stat, "change").querySelector("ds-icon")!.getAttribute("type")).toBe("up");
  expect(part(stat, "change").querySelector("ds-icon")!.getAttribute("aria-hidden")).toBe("true");
  expect(words(stat.shadowRoot!.querySelector('slot[name="caption"]'))).toBe("Since last month");

  setLanguage("da"); await stat.updateComplete;
  expect(words(part(stat, "label"))).toBe("Omsætning");
  expect(plain(words(part(stat, "figure")))).toBe("1.234,50 €");
  expect(plain(words(part(stat, "change")))).toBe("+12 %");
  expect(words(stat.shadowRoot!.querySelector('slot[name="caption"]'))).toBe("Siden sidste måned");
  stat.literal = true; await stat.updateComplete;
  expect(words(part(stat, "label"))).toBe("Revenue");

  stat.change = -0.04; await stat.updateComplete;
  expect(part(stat, "change").querySelector("ds-icon")!.getAttribute("type")).toBe("down");
  stat.change = 0; await stat.updateComplete;
  expect(part(stat, "change").querySelector("ds-icon")).toBeNull();
});

test("a stat without a change or caption has no caption line; words in place of the value are shown as given", async () => {
  const stat = await mount("ds-stat", '<ds-stat label="Month ends at" figure="Incomplete" literal></ds-stat>');
  expect(words(part(stat, "figure"))).toBe("Incomplete");
  expect(part(stat, "caption").hasAttribute("hidden")).toBe(true);
  expect(part(stat, "change")).toBeNull();
  stat.figure = undefined; stat.value = 3; await stat.updateComplete;
  expect(words(part(stat, "figure"))).toBe("3");
});

test("a stat's tone colours the figure and its change tone the change", async () => {
  const stat = await mount("ds-stat", '<ds-stat label="Left" value="-4" tone="danger" change="-1" change-tone="warning" literal></ds-stat>');
  expect(part(stat, "stat").classList.contains("ds-stat--danger")).toBe(true);
  expect(part(stat, "change").classList.contains("ds-stat__change--warning")).toBe(true);
  stat.tone = "nonsense" as never; await stat.updateComplete;
  expect(part(stat, "stat").className).toBe("ds-stat");
});

test("with cells, every digit has a cell of one width and the figure is read whole once", async () => {
  const stat = await mount("ds-stat", '<ds-stat label="Spent" value="1204" format="money" currency="EUR" whole cells literal></ds-stat>');
  const figure = part(stat, "figure");
  expect(figure.querySelector(".hidden-words")!.textContent).toBe("€1,204");
  const drawn = figure.querySelector('[aria-hidden="true"]')!;
  expect([...drawn.querySelectorAll(".ds-stat__digit")].map(cell => cell.textContent)).toEqual(["1", "2", "0", "4"]);
  expect(drawn.textContent).toBe("€1,204");
});

test("a stat takes its label, figure and caption as slotted content, and anything else between figure and caption", async () => {
  const stat = await mount("ds-stat", '<ds-stat><span slot="label">Received</span><span slot="figure">¥12,000</span><ds-progress value="0.4"></ds-progress><span slot="caption">of ¥30,000 planned</span></ds-stat>');
  expect(part(stat, "label").hasAttribute("hidden")).toBe(false);
  expect(part(stat, "caption").hasAttribute("hidden")).toBe(false);
  const order = [...part(stat, "stat").children].map(child => child.getAttribute("part") ?? child.tagName.toLowerCase());
  expect(order).toEqual(["label", "figure", "slot", "caption"]);
  expect(stat.shadowRoot!.querySelector<HTMLSlotElement>("slot:not([name])")!.assignedElements()[0]!.tagName).toBe("DS-PROGRESS");
});

test("a stat is not focusable and has no role of its own", async () => {
  const stat = await mount("ds-stat", '<ds-stat label="Users" value="12" literal></ds-stat>');
  expect(stat.tabIndex).toBe(-1);
  expect(stat.hasAttribute("role")).toBe(false);
  expect(stat.shadowRoot!.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
});

test("a meter's values stay inside its range and its words say when it is over", () => {
  expect(meterAria(7, 0, 10)).toMatchObject({ now: 7, min: 0, max: 10, text: "7 of 10", fraction: 0.7, over: false });
  expect(meterAria(12, 0, 10)).toMatchObject({ now: 10, text: "12 of 10, over by 2", fraction: 1, over: true });
  expect(meterAria(-3, 0, 10)).toMatchObject({ now: 0, fraction: 0, over: false });
  expect(meterAria(5, 0, 10, { over: true })).toMatchObject({ now: 5, text: "5 of 10", over: true, fraction: 1 });
  expect(meterAria(0.5, 3, 3)).toMatchObject({ min: 3, max: 4 });
  expect(plain(meterAria(7400, 0, 10000, { format: "money", currency: "DKK", language: "da" }).text)).toBe("7.400,00 kr. of 10.000,00 kr.");
});

test("a meter is role=meter with its values and the words in the current language", async () => {
  loadTranslations("da", { Spent: "Brugt" });
  const meter = await mount("ds-progress", '<ds-progress label="Spent" value="7" max="10"></ds-progress>');
  expect(meter.getAttribute("role")).toBe("meter");
  expect(meter.getAttribute("aria-valuenow")).toBe("7");
  expect(meter.getAttribute("aria-valuemin")).toBe("0");
  expect(meter.getAttribute("aria-valuemax")).toBe("10");
  expect(meter.getAttribute("aria-valuetext")).toBe("7 of 10");
  expect(meter.getAttribute("aria-label")).toBe("Spent");
  expect(part(meter, "progress").style.getPropertyValue("--ds-progress-value")).toBe("0.7");
  expect(part(meter, "progress").classList.contains("ds-progress--over")).toBe(false);

  setLanguage("da"); await meter.updateComplete;
  expect(meter.getAttribute("aria-valuetext")).toBe("7 af 10");
  expect(meter.getAttribute("aria-label")).toBe("Brugt");

  meter.value = 12; await meter.updateComplete;
  expect(meter.getAttribute("aria-valuenow")).toBe("10");
  expect(meter.getAttribute("aria-valuetext")).toBe("12 af 10, 2 for meget");
  expect(meter.hasAttribute("data-over")).toBe(true);
  expect(part(meter, "progress").classList.contains("ds-progress--over")).toBe(true);

  meter.valuetext = "¥118,200 of ¥100,000"; meter.literal = true; await meter.updateComplete;
  expect(meter.getAttribute("aria-valuetext")).toBe("¥118,200 of ¥100,000");
  meter.label = undefined; await meter.updateComplete;
  expect(meter.hasAttribute("aria-label")).toBe(false);
});

test("a meter in squares fills whole squares, all of them in the danger state when over", async () => {
  const meter = await mount("ds-progress", '<ds-progress value="7" max="10" squares="10"></ds-progress>');
  const squares = () => [...meter.shadowRoot!.querySelectorAll(".ds-progress__square")];
  expect(squares()).toHaveLength(10);
  expect(squares().filter(square => square.classList.contains("ds-progress__square--on"))).toHaveLength(7);
  meter.value = 0.66; meter.max = 1; meter.squares = 3; await meter.updateComplete;
  expect(squares().filter(square => square.classList.contains("ds-progress__square--on"))).toHaveLength(2);
  meter.value = 4; await meter.updateComplete;
  expect(part(meter, "progress").classList.contains("ds-progress--over")).toBe(true);
  meter.squares = 1000; await meter.updateComplete;
  expect(squares()).toHaveLength(100);
});

test("a meter is not focusable: it shows a value and takes no keys", async () => {
  const meter = await mount("ds-progress", '<ds-progress value="0.5"></ds-progress>');
  expect(meter.tabIndex).toBe(-1);
  expect(meter.shadowRoot!.querySelectorAll("a, button, input, [tabindex]")).toHaveLength(0);
  meter.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  await meter.updateComplete;
  expect(meter.getAttribute("aria-valuenow")).toBe("0.5");
});

test("steps before the current one are done, the current one is aria-current=step and those after are still to come", () => {
  expect(stepStates(["A", "B", "C"], 2)).toEqual(["done", "current", "upcoming"]);
  expect(stepStates(["A", "B"], 3)).toEqual(["done", "done"]);
  expect(stepStates(["A", "B"], 0)).toEqual(["upcoming", "upcoming"]);
  expect(stepStates(["A", { label: "B", state: "failed" }, "C"], 2)).toEqual(["done", "failed", "upcoming"]);
});

test("steps are an ordered list, numbered in the language, with the state said in words", async () => {
  loadTranslations("da", { Apply: "Ansøg", "Getting started": "Kom i gang" });
  const steps = await mount("ds-progress", `<ds-progress current="2" label="Getting started" steps='["Apply", "Approval", "Connect payouts", "Start earning"]'></ds-progress>`);
  const list = steps.shadowRoot!.querySelector("ol")!;
  expect(list.getAttribute("aria-label")).toBe("Getting started");
  const items = [...list.querySelectorAll("li")];
  expect(items.map(item => item.dataset.state)).toEqual(["done", "current", "upcoming", "upcoming"]);
  expect(items.map(item => item.getAttribute("aria-current"))).toEqual([null, "step", null, null]);
  expect(items[0]!.querySelector(".ds-progress__mark ds-icon")!.getAttribute("type")).toBe("check");
  expect(items[0]!.querySelector(".ds-progress__mark")!.getAttribute("aria-hidden")).toBe("true");
  expect(words(items[0]!.querySelector(".ds-progress__state"))).toBe("Done");
  expect(words(items[1]!.querySelector(".ds-progress__mark"))).toBe("2");
  expect(items[1]!.querySelector(".ds-progress__state")).toBeNull();
  expect(items[1]!.classList.contains("ds-progress__step--current")).toBe(true);
  expect(items[2]!.className).toBe("ds-progress__step");

  setLanguage("da"); await steps.updateComplete;
  expect(list.getAttribute("aria-label")).toBe("Kom i gang");
  expect(words(items[0]!.querySelector(".ds-progress__label"))).toBe("Ansøg");
  expect(words(items[0]!.querySelector(".ds-progress__state"))).toBe("Færdig");

  steps.steps = ["Apply", { label: "Approval", state: "failed" }]; await steps.updateComplete;
  const failed = steps.shadowRoot!.querySelectorAll("li")[1]!;
  expect(failed.classList.contains("ds-progress__step--failed")).toBe(true);
  expect(failed.querySelector(".ds-progress__mark ds-icon")!.getAttribute("type")).toBe("warning");
  expect(words(failed.querySelector(".ds-progress__state"))).toBe("Mislykkedes");
  expect(failed.hasAttribute("aria-current")).toBe(false);
});

test("a step with href is a link reached with Tab; the others take no focus", async () => {
  const steps = await mount("ds-progress", `<ds-progress current="3" literal steps='[{"label": "Details", "href": "/details"}, {"label": "Address", "href": "/address"}, "Payment"]'></ds-progress>`);
  const focusable = [...steps.shadowRoot!.querySelectorAll<HTMLElement>("a[href], button, [tabindex]")];
  expect(focusable.map(element => element.getAttribute("href"))).toEqual(["/details", "/address"]);
  expect(focusable.every(link => link.closest("li")!.dataset.state === "done")).toBe(true);
  focusable[0]!.focus();
  expect(steps.shadowRoot!.activeElement).toBe(focusable[0]);
  // The link holds the step's mark and name, so its accessible name is the step's.
  expect(words(focusable[1]!.querySelector(".ds-progress__label"))).toBe("Address");
  expect(steps.shadowRoot!.querySelectorAll("li")[2]!.querySelector("a")).toBeNull();
});

test("a vertical sequence puts each step's slotted body under it, and hides the bodies it has not been given", async () => {
  const steps = await mount("ds-progress", `<ds-progress vertical current="2" literal steps='["Apply", "Connect payouts"]'><p slot="step-2">Connect an account to get paid.</p></ds-progress>`);
  const bodies = [...steps.shadowRoot!.querySelectorAll<HTMLElement>('[part="body"]')];
  expect(bodies.map(body => body.hasAttribute("hidden"))).toEqual([true, false]);
  expect(bodies[1]!.querySelector("slot")!.assignedElements()[0]!.textContent).toBe("Connect an account to get paid.");
  expect(steps.shadowRoot!.querySelector("ol")!.classList.contains("ds-progress--vertical")).toBe(true);
  steps.vertical = false; await steps.updateComplete;
  expect(steps.shadowRoot!.querySelectorAll('[part="body"]')).toHaveLength(0);
});

test("the elements hide with hidden, and every element declares its properties rather than shadowing them", async () => {
  const css = (name: string) => readFileSync(join(import.meta.dirname, `../DS1/2-core/styles/${name}`), "utf8");
  for (const sheet of ["ds-stat.css", "ds-progress.css"]) expect(css(sheet)).toContain(":host([hidden])");
  const stat = await mount("ds-stat", '<ds-stat value="1"></ds-stat>');
  expect(Object.hasOwn(stat, "value")).toBe(false);
});

test("the native classes are imported by controls.css and draw every part the elements use", () => {
  const sheet = (name: string) => readFileSync(join(import.meta.dirname, `../DS1/1-root/${name}`), "utf8");
  expect(sheet("controls.css")).toContain('@import "./figures.css";');
  expect(sheet("controls.css")).toContain('@import "./progress.css";');
  const figures = sheet("figures.css");
  for (const selector of [".ds-stat", ".ds-stat__label", ".ds-stat__figure", ".ds-stat__digit", ".ds-stat__caption", ".ds-stat__change", ".ds-stats"]) {
    expect(figures, selector).toMatch(new RegExp(`${selector.replace(/[.-]/g, m => `\\${m}`)}[\\s,{:.]`));
  }
  const progress = sheet("progress.css");
  for (const selector of [".ds-progress", ".ds-progress__fill", ".ds-progress--squares", ".ds-progress__square", ".ds-progress--over", ".ds-progress--steps", ".ds-progress__step", ".ds-progress__mark", ".ds-progress__label", ".ds-progress__state", ".ds-progress__link", ".ds-progress__body", ".ds-progress--vertical", ".ds-progress--dots", ".ds-progress__dot"]) {
    expect(progress, selector).toMatch(new RegExp(`${selector.replace(/[.-]/g, m => `\\${m}`)}[\\s,{:.]`));
  }
  // Motion only on transform.
  for (const [, value] of [...figures.matchAll(/transition:\s*([^;]+);/g), ...progress.matchAll(/transition:\s*([^;]+);/g)]) expect(value).toMatch(/^(transform\b|none$)/);
});

test("a framed group of stats draws its rounded frame and the lines between them inside its stats", () => {
  const sheet = readFileSync(join(import.meta.dirname, "../DS1/1-root/figures.css"), "utf8");
  const frame = sheet.slice(sheet.indexOf(".ds-stats[data-frame] {"), sheet.indexOf(".ds-stats[data-frame] > * {"));
  expect(sheet).toMatch(/\.ds-stats\[data-frame\]::after \{[^}]*border: 1px solid/);
  expect(frame).toContain("border-radius: var(--ds-stats-radius)");
  expect(frame).toContain("gap: 0");
  expect(sheet).toMatch(/\.ds-stats\[data-frame\] > \* \+ \* \{\s*box-shadow: inset 1px 0 0/);
});
