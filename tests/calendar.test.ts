// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test, vi } from "vite-plus/test";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const { setLanguage } = await import("../DS1/0-face/i18n");
const days = await import("../DS1/0-face/calendar");
await import("../DS1/3-unit/ds-calendar");
await import("../DS1/3-unit/ds-calendar-large");
await import("../DS1/3-unit/ds-date-picker");
type Calendar = HTMLElementTagNameMap["ds-calendar"];
type Large = HTMLElementTagNameMap["ds-calendar-large"];
type Picker = HTMLElementTagNameMap["ds-date-picker"];

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

test("the large calendar runs weeks in columns and fills a day's colours in bands", async () => {
  const large = await mount<Large>(`<ds-calendar-large start="2026-10" months="2" week-start="1" today="2026-10-18"></ds-calendar-large>`);
  large.events = [
    { title: "A", start: "2026-10-05", end: "2026-10-07", color: "red" },
    { title: "B", start: "2026-10-07", color: "blue" },
  ];
  await large.updateComplete;
  const first = cell(large, "2026-09-28");
  expect(first.style.gridRow).toBe("1");
  expect(first.style.gridColumn).toBe("1");
  expect(cell(large, "2026-10-04").style.gridRow).toBe("7");
  expect(cell(large, "2026-10-05").style.gridColumn).toBe("2");
  expect(cell(large, "2026-10-06").style.getPropertyValue("--ds-calendar-cell-fill")).toBe("red");
  expect(cell(large, "2026-10-07").style.getPropertyValue("--ds-calendar-cell-fill")).toContain("linear-gradient");
  // A date is written on today and where an event starts or ends.
  expect(cell(large, "2026-10-05").textContent!.trim()).toBe("5");
  expect(cell(large, "2026-10-06").textContent!.trim()).toBe("");
  expect(cell(large, "2026-10-18").textContent!.trim()).toBe("18");
  // Arrow down is the next day, arrow right the next week.
  key(cell(large, "2026-10-18"), "ArrowRight");
  expect(large.focusDay).toBe("2026-10-25");
  key(cell(large, "2026-10-18"), "ArrowDown");
  expect(large.focusDay).toBe("2026-10-19");
});

test("a date picker opens its month, takes a day and gives it to its form", async () => {
  document.body.innerHTML = `<form><ds-date-picker name="due" label="Due" literal today="2026-10-18"></ds-date-picker></form>`;
  const picker = document.querySelector("ds-date-picker") as Picker;
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
  expect(picker.value).toBe("2026-10-21");
  expect(picker.open).toBe(false);
  expect(changes).toEqual(["2026-10-21"]);
  expect(trigger.textContent).toContain("Oct 21, 2026");
  expect(new FormData(picker.closest("form")!).get("due") ?? picker.value).toBe("2026-10-21");
});

test("Escape closes the picker's month", async () => {
  const picker = await mount<Picker>(`<ds-date-picker value="2026-10-18"></ds-date-picker>`);
  picker.open = true;
  await picker.updateComplete;
  key(picker.shadowRoot!.querySelector(".popover")!, "Escape");
  await picker.updateComplete;
  expect(picker.open).toBe(false);
});

test("no calendar names a product", () => {
  for (const file of ["0-face/calendar.ts", "3-unit/calendar-base.ts", "3-unit/ds-calendar.ts", "3-unit/ds-calendar-large.ts", "3-unit/ds-date-picker.ts", "3-unit/styles/ds-calendar.css", "3-unit/styles/ds-calendar-large.css", "3-unit/styles/ds-date-picker.css"]) {
    expect(readFileSync(join(import.meta.dirname, "../DS1", file), "utf8")).not.toMatch(/\b(Ezo|Link|Consistency|Peer|Ins|tau99)\b/);
  }
});
