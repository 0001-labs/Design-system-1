// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test, vi } from "vite-plus/test";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const { setLanguage } = await import("../DS1/0-face/i18n");
const days = await import("../DS1/0-face/calendar");
const calendarModule = await import("../DS1/3-unit/ds-calendar");
type Calendar = HTMLElementTagNameMap["ds-calendar"];

afterEach(() => { document.body.replaceChildren(); setLanguage("en"); });

const key = (target: Element, name: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, composed: true, cancelable: true, ...init }));

async function mount<T extends HTMLElement & { updateComplete: Promise<unknown> }>(markup: string): Promise<T> {
  document.body.innerHTML = markup;
  const element = document.body.firstElementChild as T;
  await element.updateComplete;
  return element;
}

const cells = (host: Element) => [...host.shadowRoot!.querySelectorAll<HTMLElement>("[data-day]")];
const cell = (host: Element, day: string) => host.shadowRoot!.querySelector<HTMLElement>(`[data-day="${day}"]`)!;

test("days are written YYYY-MM-DD, roll over months and stay on real dates", () => {
  expect(days.isDay("2026-02-29")).toBe(false);
  expect(days.isDay("2028-02-29")).toBe(true);
  expect(days.addDays("2026-12-31", 1)).toBe("2027-01-01");
  expect(days.addMonths("2026-01-31", 1)).toBe("2026-02-28");
  expect(days.addMonths("2026-03-15", -15)).toBe("2024-12-15");
  expect(days.weekdayOf("2026-10-18")).toBe(0);
  expect(days.isoWeek("2026-10-18")).toBe(42);
  expect(days.isoWeek("2027-01-01")).toBe(53);
});

test("a month is drawn in whole weeks from the week's first day", () => {
  const monday = days.monthWeeks("2026-10-18", 1);
  expect(monday[0][0]).toBe("2026-09-28");
  expect(monday.at(-1)![6]).toBe("2026-11-01");
  expect(monday).toHaveLength(5);
  const sunday = days.monthWeeks("2026-10-18", 0);
  expect(sunday[0][0]).toBe("2026-09-27");
  expect(days.monthWeeks("2026-02-01", 0, true)).toHaveLength(6);
  expect(days.weekdayNames(1, "short", "en")).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  expect(days.readWeekday("monday")).toBe(1);
  expect(days.readWeekday("7")).toBeUndefined();
});

test("events are listed on every day they touch, longest first", () => {
  const map = days.eventsByDay([
    { title: "Short", start: "2026-10-12" },
    { title: "Long", start: "2026-10-11", end: "2026-10-13" },
    { title: "Outside", start: "2026-12-01" },
  ], "2026-10-01", "2026-10-31");
  expect(map.get("2026-10-11")!.map(event => event.title)).toEqual(["Long"]);
  expect(map.get("2026-10-12")!.map(event => event.title)).toEqual(["Long", "Short"]);
  expect(map.get("2026-10-13")!.map(event => event.title)).toEqual(["Long"]);
  expect([...map.keys()]).toHaveLength(3);
});

test("a month shows only its own days, marks today and holds one Tab stop", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar month="2026-10" today="2026-10-18" week-start="1"></ds-calendar>`);
  const drawn = cells(calendar);
  expect(drawn).toHaveLength(31);
  expect(drawn.filter(day => day.tabIndex === 0).map(day => day.dataset.day)).toEqual(["2026-10-18"]);
  expect(cell(calendar, "2026-10-18").getAttribute("aria-current")).toBe("date");
  expect(cell(calendar, "2026-10-18").getAttribute("aria-label")).toBe("Sunday, October 18, 2026");
  expect(calendar.shadowRoot!.querySelectorAll(".week")).toHaveLength(5);
  expect(calendar.shadowRoot!.querySelector(".title")!.textContent).toBe("October 2026");
});

test("a selectable month takes a pressed day, unless day-press is cancelled", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar month="2026-10" selectable></ds-calendar>`);
  const changes: string[] = [];
  calendar.addEventListener("change", event => changes.push((event as CustomEvent).detail.value));
  cell(calendar, "2026-10-05").click();
  await calendar.updateComplete;
  expect(calendar.value).toBe("2026-10-05");
  expect(cell(calendar, "2026-10-05").getAttribute("aria-selected")).toBe("true");
  calendar.addEventListener("day-press", event => event.preventDefault(), { once: true });
  cell(calendar, "2026-10-06").click();
  expect(calendar.value).toBe("2026-10-05");
  expect(changes).toEqual(["2026-10-05"]);
});

test("days outside min and max cannot be chosen", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar month="2026-10" selectable min="2026-10-10" max="2026-10-20"></ds-calendar>`);
  expect(cell(calendar, "2026-10-09").getAttribute("aria-disabled")).toBe("true");
  cell(calendar, "2026-10-09").click();
  expect(calendar.value).toBe("");
});

test("a date's number is the number alone in every language", () => {
  expect(days.dateNumber("2026-10-01", "da")).toBe("1");
  expect(days.dateNumber("2026-10-18", "ja")).toBe("18");
  expect(days.dateNumber("2026-10-18", "en")).toBe("18");
});

test("dayAllowed leaves out the days it says no to, between min and max", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar month="2026-10" selectable min="2026-10-10"></ds-calendar>`);
  calendar.dayAllowed = day => day.endsWith("2") || day.endsWith("4");
  await calendar.updateComplete;
  expect(cell(calendar, "2026-10-13").getAttribute("aria-disabled")).toBe("true");
  expect(cell(calendar, "2026-10-02").getAttribute("aria-disabled")).toBe("true");
  expect(cell(calendar, "2026-10-12").hasAttribute("aria-disabled")).toBe(false);
  cell(calendar, "2026-10-13").click();
  expect(calendar.value).toBe("");
  cell(calendar, "2026-10-12").click();
  cell(calendar, "2026-10-14").click();
  expect(calendar.value).toBe("2026-10-12/2026-10-14");
  expect(calendar.hasAttribute("dayallowed")).toBe(false);
});

test("the keys move a day, a week and a month, and carry the month along", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar month="2026-10" today="2026-10-31" week-start="1"></ds-calendar>`);
  const months: string[] = [];
  calendar.addEventListener("navigate", event => months.push((event as CustomEvent).detail.month));
  key(cell(calendar, "2026-10-31"), "ArrowRight");
  await calendar.updateComplete;
  await calendar.updateComplete;
  expect(calendar.month).toBe("2026-11");
  expect(months).toEqual(["2026-11"]);
  key(cell(calendar, "2026-11-01"), "ArrowUp");
  await calendar.updateComplete;
  expect(calendar.month).toBe("2026-10");
  expect(calendar.focusDay).toBe("2026-10-25");
  key(cell(calendar, "2026-10-25"), "PageDown");
  await calendar.updateComplete;
  expect(calendar.focusDay).toBe("2026-11-25");
  key(cell(calendar, "2026-11-25"), "Home");
  expect(calendar.focusDay).toBe("2026-11-23");
});

test("a day lists its events up to its lines and folds the rest into +N", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar month="2026-10" lines="2"></ds-calendar>`);
  calendar.events = [
    { title: "One", start: "2026-10-12", time: "08:00" },
    { title: "Two", start: "2026-10-12", time: "09:00" },
    { title: "Three", start: "2026-10-12", time: "10:00" },
  ];
  await calendar.updateComplete;
  const day = cell(calendar, "2026-10-12");
  expect([...day.querySelectorAll(".event .name")].map(name => name.textContent)).toEqual(["One"]);
  expect(day.querySelector(".more")!.textContent).toBe("+2");
  (day.querySelector(".more") as HTMLElement).click();
  await calendar.updateComplete;
  expect(day.querySelectorAll(".event")).toHaveLength(3);
  expect(day.getAttribute("aria-label")).toBe("Monday, October 12, 2026, 08:00 One, 09:00 Two, 10:00 Three");
});

test("a compact month is one square a day and names its days in a letter", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar compact fixed month="2026-10" week-start="1"></ds-calendar>`);
  expect(calendar.style.getPropertyValue("--ds-calendar-day-squares")).toBe("1");
  expect(calendar.shadowRoot!.querySelectorAll(".week")).toHaveLength(6);
  expect(calendar.shadowRoot!.querySelector(".weekday")!.textContent).toBe("M");
  expect(calendar.shadowRoot!.querySelector(".title")!.textContent).toBe("Oct 2026");
  expect(calendar.shadowRoot!.querySelector(".today-button")).toBeNull();
});

test("activity runs weeks in columns a square each and fills a day's colours in bands", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar activity no-header month="2026-10" months="2" week-start="1" today="2026-10-18"></ds-calendar>`);
  calendar.events = [
    { title: "A", start: "2026-10-05", end: "2026-10-07", color: "red" },
    { title: "B", start: "2026-10-07", color: "blue" },
    { title: "C", start: "2026-10-20" },
  ];
  await calendar.updateComplete;
  const root = calendar.shadowRoot!;
  // The week holding October's first starts on Monday 28 September; its September days stay empty.
  expect(root.querySelector('[data-day="2026-09-28"]')).toBeNull();
  const first = cell(calendar, "2026-10-01");
  expect(first.style.gridRow).toBe("4");
  expect(first.style.gridColumn).toBe("1");
  expect(cell(calendar, "2026-10-04").style.gridRow).toBe("7");
  expect(cell(calendar, "2026-10-05").style.gridColumn).toBe("2");
  expect(cell(calendar, "2026-10-06").style.getPropertyValue("--ds-calendar-cell-fill")).toBe("red");
  expect(cell(calendar, "2026-10-07").style.getPropertyValue("--ds-calendar-cell-fill")).toContain("linear-gradient");
  expect(cell(calendar, "2026-10-20").style.getPropertyValue("--ds-calendar-cell-fill")).toContain("--ds-apple-green");
  // Two months: October and November over their weeks, in order.
  expect([...root.querySelectorAll(".activity-month")].map(month => month.textContent)).toEqual(["Oct 2026", "Nov"]);
  expect(cell(calendar, "2026-11-30")).not.toBeNull();
  expect(root.querySelector('[data-day="2026-12-01"]')).toBeNull();
  // No dates are written; each day says its date and events in its name.
  expect(cell(calendar, "2026-10-06").textContent!.trim()).toBe("");
  expect(cell(calendar, "2026-10-06").getAttribute("aria-label")).toContain("A");
  expect(cell(calendar, "2026-10-18").getAttribute("aria-current")).toBe("date");
});

test("a picker opens its month, takes a day and gives it to its form", async () => {
  document.body.innerHTML = `<form><ds-calendar picker name="due" label="Due" literal today="2026-10-18"></ds-calendar></form>`;
  const picker = document.querySelector("ds-calendar") as Calendar;
  await picker.updateComplete;
  const trigger = picker.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
  expect(trigger.getAttribute("aria-label")).toBe("Due");
  expect(trigger.textContent).toContain("Choose a date");
  trigger.click();
  await picker.updateComplete;
  expect(picker.open).toBe(true);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  const calendar = picker.shadowRoot!.querySelector("ds-calendar") as Calendar;
  await calendar.updateComplete;
  expect(calendar.month).toBe("2026-10");
  const changes: string[] = [];
  picker.addEventListener("change", event => changes.push((event as CustomEvent).detail.value));
  cell(calendar, "2026-10-21").click();
  await picker.updateComplete;
  // The first press starts a range and the panel waits for its end.
  expect(picker.value).toBe("2026-10-21");
  expect(picker.open).toBe(true);
  // The same day again ends it as one day, and the panel closes.
  await calendar.updateComplete;
  cell(calendar, "2026-10-21").click();
  await picker.updateComplete;
  expect(picker.value).toBe("2026-10-21");
  expect(picker.open).toBe(false);
  expect(changes).toEqual(["2026-10-21"]);
  expect(trigger.textContent).toContain("Oct 21, 2026");
  expect(new FormData(picker.closest("form")!).get("due") ?? picker.value).toBe("2026-10-21");
});

test("a picker's face is a field with one chevron, and a range is one value", async () => {
  const picker = await mount<Calendar>(`<ds-calendar picker label="Arrival and departure" literal value="2026-11-04/2026-11-07"></ds-calendar>`);
  const trigger = picker.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
  expect(trigger.classList.contains("ds-input")).toBe(true);
  expect(trigger.classList.contains("ds-select")).toBe(false);
  expect([...trigger.querySelectorAll("ds-icon")].map(icon => icon.getAttribute("type"))).toEqual(["chevron-down"]);
  expect(trigger.querySelector(".text")!.textContent).toMatch(/^Nov 4\s*–\s*7, 2026$/);
});

test("Escape closes the picker's month", async () => {
  const picker = await mount<Calendar>(`<ds-calendar picker value="2026-10-18"></ds-calendar>`);
  picker.open = true;
  await picker.updateComplete;
  key(picker.shadowRoot!.querySelector(".popover")!, "Escape");
  await picker.updateComplete;
  expect(picker.open).toBe(false);
});

test("a selectable calendar takes a first and a last day, either way round, and draws the days between", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar month="2026-10" selectable compact></ds-calendar>`);
  const values: string[] = [];
  calendar.addEventListener("change", event => values.push((event as CustomEvent).detail.value));
  cell(calendar, "2026-10-20").click();
  await calendar.updateComplete;
  cell(calendar, "2026-10-14").click();
  await calendar.updateComplete;
  expect(values).toEqual(["2026-10-20", "2026-10-14/2026-10-20"]);
  expect(cell(calendar, "2026-10-14").hasAttribute("data-first")).toBe(true);
  expect(cell(calendar, "2026-10-17").hasAttribute("data-inside")).toBe(true);
  expect(cell(calendar, "2026-10-17").getAttribute("aria-selected")).toBe("true");
  expect(cell(calendar, "2026-10-20").hasAttribute("data-last")).toBe(true);
  expect(calendar.shadowRoot!.querySelector(".grid")!.getAttribute("aria-multiselectable")).toBe("true");
  // A third press starts again.
  cell(calendar, "2026-10-25").click();
  expect(calendar.value).toBe("2026-10-25");
});

test("the same day pressed twice is one day, and a value set from outside starts a new pick", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar month="2026-10" selectable compact></ds-calendar>`);
  const ends: string[] = [];
  calendar.addEventListener("change", event => ends.push(`${(event as CustomEvent).detail.value}:${(event as CustomEvent).detail.end}`));
  cell(calendar, "2026-10-14").click();
  await calendar.updateComplete;
  cell(calendar, "2026-10-14").click();
  await calendar.updateComplete;
  expect(ends).toEqual(["2026-10-14:", "2026-10-14:2026-10-14"]);
  calendar.value = "2026-10-03";
  await calendar.updateComplete;
  cell(calendar, "2026-10-09").click();
  expect(calendar.value).toBe("2026-10-09");
});

test("outside days are drawn in a compact month and take it to their month", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar month="2026-10" selectable compact outside-days fixed day-width="2" week-start="0"></ds-calendar>`);
  expect(cell(calendar, "2026-09-27").hasAttribute("data-outside")).toBe(true);
  expect(calendar.shadowRoot!.querySelector(".weekday")!.textContent).toBe("Su");
  expect(calendar.shadowRoot!.querySelector(".today-button")).not.toBeNull();
  cell(calendar, "2026-11-01").click();
  await calendar.updateComplete;
  expect(calendar.value).toBe("2026-11-01");
  expect(calendar.month).toBe("2026-11");
});

test("the picker's values read and write ISO 8601, and a typed date is understood", async () => {
  const { readDateValue, writeDateValue, parseTypedDay } = await import("../DS1/3-unit/ds-calendar");
  expect(readDateValue("2026-10-24T10:00/2026-10-21T09:30")).toEqual({ start: { day: "2026-10-21", time: "09:30" }, end: { day: "2026-10-24", time: "10:00" } });
  expect(writeDateValue({ day: "2026-10-21", time: "09:30" }, { day: "2026-10-24", time: "" }, { time: false })).toBe("2026-10-21/2026-10-24");
  expect(writeDateValue({ day: "2026-10-21", time: "09:30" }, undefined, { time: true })).toBe("2026-10-21T09:30");
  expect(writeDateValue({ day: "2026-10-21", time: "" }, { day: "2026-10-21", time: "" }, { time: false })).toBe("2026-10-21");
  expect(parseTypedDay("2026-10-21")).toBe("2026-10-21");
  expect(parseTypedDay("Oct 21, 2026")).toBe("2026-10-21");
  expect(parseTypedDay("not a day")).toBeNull();
});

test("the picker always collects a range: a first and a last day, written as one value", async () => {
  document.body.innerHTML = `<form><ds-calendar picker name="trip" label="Trip" literal value="2026-10-21/2026-10-24"></ds-calendar></form>`;
  const picker = document.querySelector("ds-calendar") as Calendar;
  await picker.updateComplete;
  expect(picker.time).toBe(false);
  const trigger = picker.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
  expect(trigger.textContent).toMatch(/Oct 21\s*–\s*24, 2026/);
  picker.open = true;
  await picker.updateComplete;
  expect(picker.shadowRoot!.querySelectorAll(".field")).toHaveLength(2);
  const calendar = picker.shadowRoot!.querySelector("ds-calendar") as Calendar;
  await calendar.updateComplete;
  expect(calendar.selectable).toBe(true);
  // A whole range is there, so the first press starts a new one.
  cell(calendar, "2026-10-12").click();
  await picker.updateComplete;
  expect(picker.value).toBe("2026-10-12");
  await calendar.updateComplete;
  cell(calendar, "2026-10-10").click();
  await picker.updateComplete;
  expect(picker.value).toBe("2026-10-10/2026-10-12");
  expect(picker.open).toBe(false);
  expect(new FormData(picker.closest("form")!).get("trip") ?? picker.value).toBe("2026-10-10/2026-10-12");
});

test("turning on a time gives each end one, an hour apart, and Clear empties the value", async () => {
  const picker = await mount<Calendar>(`<ds-calendar picker value="2026-10-21"></ds-calendar>`);
  picker.open = true;
  await picker.updateComplete;
  const timeSwitch = picker.shadowRoot!.querySelector<HTMLButtonElement>(".ds-switch")!;
  timeSwitch.click();
  await picker.updateComplete;
  expect(picker.value).toBe("2026-10-21T09:00/2026-10-21T10:00");
  expect([...picker.shadowRoot!.querySelectorAll<HTMLInputElement>(".clock")].map(clock => clock.value)).toEqual(["09:00", "10:00"]);
  expect(timeSwitch.getAttribute("aria-checked")).toBe("true");
  picker.shadowRoot!.querySelector<HTMLButtonElement>(".clear")!.click();
  await picker.updateComplete;
  expect(picker.value).toBe("");
  expect(picker.open).toBe(false);
});

test("heat lights a day by its amount, in four steps of the busiest day", () => {
  const byDay = new Map([
    ["2026-10-01", [{ title: "a", start: "2026-10-01" }]],
    ["2026-10-02", [{ title: "b", start: "2026-10-02", count: 4 }]],
    ["2026-10-03", [{ title: "c", start: "2026-10-03", count: 6 }, { title: "d", start: "2026-10-03", count: 2 }]],
    ["2026-10-04", [{ title: "e", start: "2026-10-04", count: 0 }]],
  ]);
  const levels = days.heatLevels(byDay);
  expect(levels.get("2026-10-01")).toBe(1);
  expect(levels.get("2026-10-02")).toBe(2);
  expect(levels.get("2026-10-03")).toBe(4);
  expect(levels.has("2026-10-04")).toBe(false);
  // A fixed scale keeps a quiet month quiet.
  expect(days.heatLevels(byDay, 32).get("2026-10-03")).toBe(1);
  expect(days.heatLevels(byDay, 4).get("2026-10-03")).toBe(4);
});

test("a heat calendar marks each busy day with its step and leaves quiet days plain", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar compact heat fixed outside-days month="2026-07" today="2026-07-20"></ds-calendar>`);
  calendar.events = [
    { title: "Commit", start: "2026-07-02" },
    { title: "Commits", start: "2026-07-03", count: 2 },
    { title: "Commits", start: "2026-07-08", count: 3 },
    { title: "Commits", start: "2026-07-09", count: 4 },
    // The month after is drawn in the title grey, unlit, and never sets the scale.
    { title: "Commits", start: "2026-08-01", count: 40 },
  ];
  await calendar.updateComplete;
  expect(["02", "03", "08", "09"].map(date => cell(calendar, `2026-07-${date}`).dataset.heat)).toEqual(["1", "2", "3", "4"]);
  expect(cell(calendar, "2026-07-04").hasAttribute("data-heat")).toBe(false);
  expect(cell(calendar, "2026-08-01").hasAttribute("data-heat")).toBe(false);
  expect(cell(calendar, "2026-07-09").getAttribute("part")).toContain("heat");
  calendar.heat = false;
  await calendar.updateComplete;
  expect(cell(calendar, "2026-07-09").hasAttribute("data-heat")).toBe(false);
});

test("heat's colours come from the palette, follow light and dark, and keep the date readable", () => {
  const css = readFileSync(join(import.meta.dirname, "../DS1/3-unit/styles/ds-calendar.css"), "utf8");
  expect(css).toMatch(/--ds-calendar-heat-1: var\(--one-apple-green-pastel/);
  expect(css).toMatch(/--ds-calendar-heat-3: var\(--one-apple-green,/);
  expect(css).toMatch(/--ds-calendar-heat-4: light-dark\(/);
  // Each step's fill against its ink, as the palette resolves them, light then dark.
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: string, b: string) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const mix = (a: string, b: string, share = 0.5) => "#" + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * share + parseInt(b.slice(i, i + 2), 16) * (1 - share)).toString(16).padStart(2, "0")).join("");
  const slate = "#1e1e1e", white = "#ffffff";
  const light = [["#daffcc", slate], [mix("#daffcc", "#99ff73"), slate], ["#99ff73", slate], [mix("#99ff73", slate, 0.6), slate]];
  const dark = [["#284c1a", white], [mix("#284c1a", "#529d36"), white], ["#529d36", slate], ["#99ff73", slate]];
  for (const [fill, ink] of [...light, ...dark]) expect(contrast(fill, ink)).toBeGreaterThanOrEqual(4.5);
});

test("a selectable calendar shows Clear under its dates while something is chosen, which empties the value and says so", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar month="2026-10" selectable compact value="2026-10-10/2026-10-17"></ds-calendar>`);
  const clear = calendar.shadowRoot!.querySelector<HTMLButtonElement>(".clear-value")!;
  expect(clear.textContent).toBe("Clear");
  const changes: { value: string; previous: string }[] = [];
  calendar.addEventListener("change", event => changes.push((event as CustomEvent).detail));
  clear.click();
  await calendar.updateComplete;
  expect(calendar.value).toBe("");
  expect(changes).toEqual([{ value: "", previous: "2026-10-10/2026-10-17", start: "", end: "" }]);
  // Nothing chosen, nothing to clear: Clear goes.
  expect(calendar.shadowRoot!.querySelector(".clear-value")).toBeNull();
  // From code, the same; nothing to clear says nothing.
  calendar.value = "2026-10-05";
  await calendar.updateComplete;
  calendar.clear();
  calendar.clear();
  expect(changes.map(change => change.value)).toEqual(["", ""]);
  // A required calendar, a plain month and the month inside a picker have none.
  for (const markup of [`<ds-calendar selectable required></ds-calendar>`, `<ds-calendar></ds-calendar>`]) {
    const other = await mount<Calendar>(markup);
    expect(other.shadowRoot!.querySelector(".clear-value")).toBeNull();
  }
  const picker = await mount<Calendar>(`<ds-calendar picker value="2026-10-05"></ds-calendar>`);
  picker.open = true;
  await picker.updateComplete;
  const inner = picker.shadowRoot!.querySelector("ds-calendar") as Calendar;
  await inner.updateComplete;
  expect(inner.shadowRoot!.querySelector(".clear-value")).toBeNull();
  picker.clear();
  await picker.updateComplete;
  expect(picker.value).toBe("");
  expect(picker.open).toBe(false);
});

test("the title travels up to the months and to twelve years, and a choice comes back down", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar compact selectable month="2027-09" today="2026-10-19" value="2027-09-16"></ds-calendar>`);
  const root = calendar.shadowRoot!;
  const title = () => root.querySelector<HTMLElement>(".title-button, .title")!;
  const months: string[] = [];
  calendar.addEventListener("navigate", event => months.push((event as CustomEvent).detail.month));
  expect(title().textContent!.trim()).toBe("Sep 2027");
  // The title is its words alone.
  expect(title().querySelector("ds-icon")).toBeNull();
  title().click();
  await calendar.updateComplete;
  // The months of 2027, three across, the chosen month marked; the arrows step a year.
  expect(title().textContent!.trim()).toBe("2027");
  const picks = () => [...root.querySelectorAll<HTMLButtonElement>(".pick")];
  expect(picks().map(pick => pick.textContent)).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]);
  expect(root.querySelectorAll(".pick-row")).toHaveLength(4);
  expect(picks().filter(pick => pick.hasAttribute("data-selected")).map(pick => pick.textContent)).toEqual(["Sep"]);
  expect(root.querySelector('[part="previous"]')!.getAttribute("aria-label")).toBe("Previous year");
  (root.querySelector('[part="previous"]') as HTMLButtonElement).click();
  await calendar.updateComplete;
  expect(title().textContent!.trim()).toBe("2026");
  expect(picks().filter(pick => pick.hasAttribute("data-today")).map(pick => pick.textContent)).toEqual(["Oct"]);
  // Up again: twelve years, the title not a button; arrows step twelve.
  title().click();
  await calendar.updateComplete;
  expect(title().textContent!.trim()).toBe("2016 – 2027");
  expect(root.querySelector(".title-button")).toBeNull();
  expect(picks().map(pick => pick.textContent)[0]).toBe("2016");
  expect(root.querySelector('[part="next"]')!.getAttribute("aria-label")).toBe("Later years");
  // A year goes down to its months, a month to its days.
  picks().find(pick => pick.textContent === "2025")!.click();
  await calendar.updateComplete;
  expect(title().textContent!.trim()).toBe("2025");
  picks().find(pick => pick.textContent === "Mar")!.click();
  await calendar.updateComplete;
  expect(calendar.month).toBe("2025-03");
  expect(title().textContent!.trim()).toBe("Mar 2025");
  expect(cells(calendar).length).toBeGreaterThan(0);
  expect(months).toEqual(["2025-03"]);
  // Nothing was chosen on the way.
  expect(calendar.value).toBe("2027-09-16");
});

test("among the months the arrow keys move, Enter chooses and Escape goes back down", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar compact month="2026-05"></ds-calendar>`);
  const root = calendar.shadowRoot!;
  root.querySelector<HTMLElement>(".title-button")!.click();
  await calendar.updateComplete;
  const focused = () => root.querySelector<HTMLElement>('.pick[tabindex="0"]')!;
  // The Tab stop starts on the month shown.
  expect(focused().textContent).toBe("May");
  key(focused(), "ArrowDown");
  await calendar.updateComplete;
  expect(focused().textContent).toBe("Aug");
  key(focused(), "ArrowLeft");
  await calendar.updateComplete;
  expect(focused().textContent).toBe("Jul");
  const escape = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true, cancelable: true });
  focused().dispatchEvent(escape);
  await calendar.updateComplete;
  expect(escape.defaultPrevented).toBe(true);
  expect(root.querySelector(".picks")).toBeNull();
  expect(calendar.month).toBe("2026-05");
  root.querySelector<HTMLElement>(".title-button")!.click();
  await calendar.updateComplete;
  key(root.querySelector<HTMLElement>('.pick[data-pick="0"]')!, "ArrowLeft");
  await calendar.updateComplete;
  // Before January is the year before's December.
  expect(root.querySelector(".title-button")!.textContent!.trim()).toBe("2025");
  expect(focused().textContent).toBe("Dec");
  key(focused(), "Enter");
  await calendar.updateComplete;
  expect(calendar.month).toBe("2025-12");
});

test("a compact range's band is the marks' height on their line, from the middle of each end", () => {
  const css = readFileSync(join(import.meta.dirname, "../DS1/3-unit/styles/ds-calendar.css"), "utf8");
  const band = css.slice(css.indexOf(":host([compact]) .day:is([data-inside], [data-first], [data-last])::before"));
  expect(band).toMatch(/height: var\(--ds-calendar-mark\)/);
  expect(band).toMatch(/top: calc\(\(var\(--ds-calendar-day-height\) - var\(--ds-calendar-mark\)\) \/ 2\)/);
  expect(css).toMatch(/:host\(\[compact\]\) \.day\[data-first\]::before \{ inset-inline-start: 50%; \}/);
  expect(css).not.toMatch(/linear-gradient\(to (right|left), transparent 50%, var\(--ds-calendar-band\)/);
});

test("no calendar names a product", () => {
  for (const file of ["0-face/calendar.ts", "3-unit/calendar-base.ts", "3-unit/ds-calendar.ts", "3-unit/styles/ds-calendar.css"]) {
    expect(readFileSync(join(import.meta.dirname, "../DS1", file), "utf8")).not.toMatch(/\b(Ezo|Link|Consistency|Peer|Ins|tau99)\b/);
  }
});


test("activity squares retain date labels and update their event fills", async () => {
  const calendar = await mount<Calendar>('<ds-calendar activity no-header month="2026-10"></ds-calendar>');
  calendar.events = [{ title: "Purchase", start: "2026-10-08", color: "var(--ds-yellow)" }];
  await calendar.updateComplete;
  expect(cell(calendar, "2026-10-08")?.hasAttribute("data-filled")).toBe(true);
  expect(cell(calendar, "2026-10-09")?.hasAttribute("data-filled")).toBe(false);
  expect(cell(calendar, "2026-10-08")?.getAttribute("title")).toContain("Purchase");
  calendar.events = [];
  await calendar.updateComplete;
  expect(cell(calendar, "2026-10-08")?.hasAttribute("data-filled")).toBe(false);
  // Without activity it is the month again.
  calendar.activity = false;
  await calendar.updateComplete;
  expect(calendar.shadowRoot!.querySelector(".activity")).toBeNull();
  expect(calendar.shadowRoot!.querySelector(".grid")).not.toBeNull();
});

test("an event over several days is one bar on one line, its name written once, broken only at the week's end", async () => {
  const { weekLines } = await import("../DS1/3-unit/ds-calendar");
  const week = ["2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24"];
  const long = { title: "Press days", start: "2026-10-18", end: "2026-10-22" };
  const short = { title: "Flowers", start: "2026-10-19" };
  const byDay = days.eventsByDay([short, long], week[0], week[6]);
  const laid = weekLines(week, byDay, 2);
  expect(laid[0].lines).toEqual([{ event: long, span: 5 }]);
  expect(laid[1].lines).toEqual(["on", { event: short, span: 1 }]);
  expect(laid[4].lines).toEqual(["on"]);
  expect(laid[5].lines).toEqual([]);

  const calendar = await mount<Calendar>(`<ds-calendar month="2026-10" week-start="0"></ds-calendar>`);
  calendar.events = [long, short, { title: "Over the weekend", start: "2026-10-24", end: "2026-10-26" }];
  await calendar.updateComplete;
  const bar = cell(calendar, "2026-10-18").querySelector<HTMLElement>(".event")!;
  expect(bar.dataset.span).toBe("5");
  expect(bar.style.getPropertyValue("--ds-calendar-event-span").trim()).toBe("5");
  expect(cell(calendar, "2026-10-19").querySelectorAll(".event")).toHaveLength(1);
  // Across a week's end the bar starts again on the next week's first day.
  expect(cell(calendar, "2026-10-24").querySelector<HTMLElement>(".event")!.dataset.span).toBeUndefined();
  expect(cell(calendar, "2026-10-25").querySelector<HTMLElement>(".event")!.dataset.span).toBe("2");
});

test("a cut name fades over its bar's last square rather than ending in an ellipsis", () => {
  const css = readFileSync(join(import.meta.dirname, "../DS1/3-unit/styles/ds-calendar.css"), "utf8");
  expect(css).toMatch(/\.event \.name\[data-cut="end"\] \{ mask-image: linear-gradient\(to right, #000 calc\(100% - var\(--ds-unit\)\), transparent\); \}/);
  expect(css).not.toMatch(/\.event \.name \{[^}]*ellipsis/);
});

test("the week view shows one week with every event, and the day view its hours", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar view="week" date="2026-10-21" week-start="0" views></ds-calendar>`);
  calendar.events = ["A", "B", "C", "D"].map(title => ({ title, start: "2026-10-21" }));
  await calendar.updateComplete;
  expect(cells(calendar).map(day => day.dataset.day)).toEqual(["2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24"]);
  expect(cell(calendar, "2026-10-21").querySelectorAll(".event")).toHaveLength(4);
  expect(cell(calendar, "2026-10-21").querySelector("[data-more]")).toBeNull();
  const navigate = vi.fn();
  calendar.addEventListener("navigate", navigate);
  calendar.shadowRoot!.querySelector<HTMLButtonElement>('[part="next"]')!.click();
  await calendar.updateComplete;
  expect(calendar.date).toBe("2026-10-28");
  expect(navigate).toHaveBeenCalledOnce();

  const views = calendar.shadowRoot!.querySelector<HTMLElement & { options: string; value: string }>("ds-button.views")!;
  expect(views.hasAttribute("split")).toBe(true);
  expect(views.options).toBe("day:Day,week:Week,month:Month,swimlane:Swimlane");
  expect(views.value).toBe("week");
  const changed = vi.fn();
  const chosenDay = vi.fn();
  calendar.addEventListener("view-change", changed);
  calendar.addEventListener("change", chosenDay);
  views.dispatchEvent(new CustomEvent("change", { detail: { value: "day" }, bubbles: true, composed: true, cancelable: true }));
  await calendar.updateComplete;
  expect(chosenDay).not.toHaveBeenCalled();
  expect(calendar.view).toBe("day");
  expect(changed.mock.calls[0][0].detail).toEqual({ view: "day" });
  calendar.events = [{ title: "All day", start: "2026-10-28" }, { title: "Standup", start: "2026-10-28", time: "09:30" }];
  await calendar.updateComplete;
  const root = calendar.shadowRoot!;
  expect(root.querySelectorAll(".hour")).toHaveLength(24);
  expect(root.querySelector(".all-day")!.textContent).toContain("All day");
  expect(root.querySelector('.hour[data-hour="9"]')!.textContent).toContain("Standup");
  root.querySelector<HTMLButtonElement>('[part="previous"]')!.click();
  await calendar.updateComplete;
  expect(calendar.date).toBe("2026-10-27");
});

test("a month's frame has a card's rounded corners on its four corner days", () => {
  const css = readFileSync(join(import.meta.dirname, "../DS1/3-unit/styles/ds-calendar.css"), "utf8");
  expect(css).toMatch(/--ds-calendar-radius: var\(--ds-radius-card/);
  for (const corner of ["start-start", "start-end", "end-start", "end-end"]) expect(css).toContain(`border-${corner}-radius: var(--ds-calendar-radius)`);
});

test("monthHeading names the month view's title, and leaves the week view, the months and the button's name", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar month="2026-10" today="2026-10-18"></ds-calendar>`);
  const root = calendar.shadowRoot!;
  const seen: Date[] = [];
  calendar.monthHeading = month => { seen.push(month); return `Events in ${month.toLocaleDateString("en", { month: "long" })}`; };
  await calendar.updateComplete;
  expect(root.querySelector(".title-text")!.textContent).toBe("Events in October");
  expect(root.querySelector(".title-button")!.getAttribute("aria-label")).toBe("Events in October, Choose a month and year");
  const first = seen.at(-1)!;
  expect([first.getFullYear(), first.getMonth(), first.getDate()]).toEqual([2026, 9, 1]);
  expect(calendar.hasAttribute("monthheading")).toBe(false);
  root.querySelector<HTMLElement>(".title-button")!.click();
  await calendar.updateComplete;
  expect(root.querySelector(".title-button")!.textContent!.trim()).toBe("2026");
  calendar.level = "days";
  calendar.view = "week";
  calendar.date = "2026-10-21";
  await calendar.updateComplete;
  expect(root.querySelector(".title-text")!.textContent).not.toContain("Events in");
  calendar.view = "month";
  calendar.monthHeading = undefined;
  await calendar.updateComplete;
  expect(root.querySelector(".title-text")!.textContent).toBe("October 2026");
});

test("a swipe sideways across the days goes to the next month or the one before, where the arrows can", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar compact selectable month="2026-10" today="2026-10-22" max="2026-11-30"></ds-calendar>`);
  const surface = calendar.shadowRoot!.querySelector<HTMLElement>(".calendar")!;
  const swipe = async (from: number, to: number, type = "touch", dy = 0) => {
    surface.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, pointerType: type, isPrimary: true, clientX: from, clientY: 100, bubbles: true, composed: true }));
    surface.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, pointerType: type, isPrimary: true, clientX: to, clientY: 100 + dy, bubbles: true, composed: true }));
    await calendar.updateComplete;
  };
  expect(surface.hasAttribute("data-swipe")).toBe(true);
  await swipe(200, 100);
  expect(calendar.month).toBe("2026-11");
  // The next arrow stops at max, and so does the swipe.
  await swipe(200, 100);
  expect(calendar.month).toBe("2026-11");
  await swipe(100, 200);
  expect(calendar.month).toBe("2026-10");
  // Too short, too steep, or a mouse: no swipe.
  await swipe(100, 120);
  await swipe(200, 100, "touch", 120);
  await swipe(200, 100, "mouse");
  expect(calendar.month).toBe("2026-10");
});

test("a calendar without a header does not swipe, and its days take touches as the page does", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar compact no-header month="2026-10"></ds-calendar>`);
  expect(calendar.shadowRoot!.querySelector(".calendar")!.hasAttribute("data-swipe")).toBe(false);
  const sheet = readFileSync(join(import.meta.dirname, "../DS1/3-unit/styles/ds-calendar.css"), "utf8");
  expect(sheet).toContain("[data-swipe] :is(.grid, .picks) { touch-action: pan-y; }");
});

test("a swimlane lays each event on its own row, a bar from its first week to its last, held inside the weeks drawn", () => {
  const { swimlaneBars } = calendarModule;
  const weeks = ["2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19"];
  const bars = swimlaneBars([
    { title: "Late", start: "2026-10-20" },
    { title: "Long", start: "2026-09-01", end: "2026-10-08" },
    { title: "Short", start: "2026-10-06", end: "2026-10-14" },
    { title: "Outside", start: "2026-12-01" },
  ], weeks);
  expect(bars.map(({ event, row, from, to }) => [event.title, row, from, to])).toEqual([
    ["Long", 0, 0, 1],
    ["Short", 1, 1, 2],
    ["Late", 2, 3, 3],
  ]);
});

test("the swimlane view: months in order over the weeks, today in its disc, a bar per event that opens it", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar view="swimlane" month="2026-10" today="2026-10-25" week-start="1" views></ds-calendar>`);
  calendar.events = [
    { id: "a", title: "Platform migration", start: "2026-10-05", end: "2026-10-30", color: "var(--ds-apple-green)" },
    { id: "b", title: "App launch", start: "2026-11-23", end: "2027-01-10" },
  ];
  await calendar.updateComplete;
  const root = calendar.shadowRoot!;
  const weeks = [...root.querySelectorAll(".swimlane-date")];
  // A week to each square of the month's width: 28 weeks, Oct 2026 to Apr 2027.
  expect(weeks).toHaveLength(28);
  expect(root.querySelector(".title-text")!.textContent).toMatch(/Oct.*2026.*Apr.*2027/);
  const months = [...root.querySelectorAll(".swimlane-month")].map(month => month.textContent);
  expect(months).toEqual(["Oct 2026", "Nov", "Dec", "Jan 2027", "Feb", "Mar", "Apr"]);
  const today = root.querySelector(".swimlane-date[data-today]")!;
  expect(today.textContent!.trim()).toBe("25");
  expect(weeks.indexOf(today)).toBe(3);
  const bars = [...root.querySelectorAll<HTMLButtonElement>(".swimlane-grid .event")];
  expect(bars.map(bar => bar.textContent)).toEqual(["Platform migration", "App launch"]);
  expect(bars[0].style.gridColumn).toBe("2 / 6");
  expect(bars[1].getAttribute("aria-label")).toContain("App launch");
  expect(root.querySelectorAll(".swimlane-grid .cell")).toHaveLength(28 * 6);
  const pressed = vi.fn();
  calendar.addEventListener("event-press", pressed);
  bars[1].click();
  expect(pressed.mock.calls[0][0].detail.event.id).toBe("b");
  root.querySelector<HTMLButtonElement>('[part="next"]')!.click();
  await calendar.updateComplete;
  expect(calendar.month).toBe("2026-11");
  expect(calendar.shownView).toBe("swimlane");
});

test("views can be a list with the page's own words, and a name the calendar does not draw is the page's own view in its slot", async () => {
  const calendar = await mount<Calendar>(`<ds-calendar month="2026-10" today="2026-10-25" views="month swimlane earnings"><div slot="earnings">Money</div></ds-calendar>`);
  calendar.viewNames = { month: "Calendar", earnings: "Earnings" };
  const headings: string[] = [];
  calendar.monthHeading = (month, view) => { headings.push(view); return `${view} ${month.getMonth() + 1}`; };
  await calendar.updateComplete;
  const root = calendar.shadowRoot!;
  const views = root.querySelector<HTMLElement & { options: string }>("ds-button.views")!;
  expect(views.options).toBe("month:Calendar,swimlane:Swimlane,earnings:Earnings");
  expect(root.querySelector(".title-text")!.textContent).toBe("month 10");
  views.dispatchEvent(new CustomEvent("change", { detail: { value: "earnings" }, bubbles: true, composed: true }));
  await calendar.updateComplete;
  expect(calendar.view).toBe("earnings");
  expect(calendar.shownView).toBe("earnings");
  expect(root.querySelector(".grid")).toBeNull();
  expect(root.querySelector<HTMLSlotElement>('.own-view slot[name="earnings"]')!.assignedElements()[0].textContent).toBe("Money");
  expect(root.querySelector(".title-text")!.textContent).toBe("earnings 10");
  root.querySelector<HTMLButtonElement>('[part="next"]')!.click();
  await calendar.updateComplete;
  expect(calendar.month).toBe("2026-11");
  // A view the calendar draws is drawn through view alone, offered or not.
  calendar.view = "day";
  await calendar.updateComplete;
  expect(calendar.shownView).toBe("day");
  calendar.views = false;
  calendar.view = "earnings";
  await calendar.updateComplete;
  expect(calendar.shownView).toBe("month");
  expect(root.querySelector("ds-button.views")).toBeNull();
});
