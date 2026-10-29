// ds-calendar.ts
// A month on whole squares: seven days across, a week to a row. `view` shows
// one week instead (every event of each day, nothing folded behind "+N") or one
// day (its events without a time across the top, then its hours, one square
// each, with the timed events at their hour) or a swimlane (weeks across, a
// row to an event, each event one bar from its first week to its last);
// `views` puts Day, Week, Month and Swimlane in the header to change between
// them. An event over several days is one bar
// with its name written once, and words that do not fit fade out at the end.
// By default a
// day is four squares wide and four high (its date on the first square, two
// lines of events, one square to spare), drawn in hairline boxes with a frame
// rounded more than a card's; the first week names its days inside its boxes,
// and a step back, Today and a step on are one plain split. `compact`
// makes a day one square: the small month a year is drawn from. `picker`
// makes the calendar a field that opens that small month below it, with the
// first and last day written out where they can be typed, a switch for a
// time, and Clear.
//
// There is one way to pick, in a month and in a picker: the first day
// pressed is the value, the next ends a range from it, and leaving after the
// first keeps the one day. A form takes the value as ISO 8601: a day, a day
// and a time, or two of them joined by a slash.

import { html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { define } from "../0-face/define";
import { CutFades } from "../0-face/cut-fade";
import { getText } from "../0-face/i18n";
import { dateFormatter, type DateLength } from "../0-face/format";
import {
  addDays,
  addMonths,
  compareDays,
  dateNumber,
  dayLabel,
  dayOf,
  eventsByDay,
  heatLevels,
  isDay,
  isoWeek,
  monthName,
  monthTitle,
  monthWeeks,
  sameMonth,
  startOfMonth,
  weekdayNames,
  weekdayOf,
  type CalendarEvent,
  type Day,
  type HeatLevel,
} from "../0-face/calendar";
import { CalendarBase, readMonth, readRange, type CalendarChangeDetail } from "./calendar-base";
import "../2-core/ds-icon";
import "../2-core/ds-button";
import metrics from "../1-root/component-metrics.css?inline";
import controls from "../1-root/controls.css?inline";
import styles from "./styles/ds-calendar.css?inline";

export * from "./calendar-base";

/** An activity day's fill: one colour, or bands side by side when several share it. */
function activityFill(events: readonly CalendarEvent[]): string | undefined {
  if (!events.length) return undefined;
  const colours = [...new Set(events.map(event => event.color || "var(--ds-calendar-event-fill, var(--ds-apple-green))"))];
  if (colours.length === 1) return colours[0];
  const share = 100 / colours.length;
  return `linear-gradient(90deg, ${colours.map((colour, index) => `${colour} ${index * share}% ${(index + 1) * share}%`).join(", ")})`;
}

const whole = (value: number | undefined, least: number, most: number, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(least, Math.min(most, Math.floor(value))) : fallback;

/**
 * A day's lines of events in a full month: the event that starts a bar on a
 * line (and how many days the bar runs), `"on"` where a bar from an earlier
 * day passes over the line, or null where the line is empty.
 */
/** What a full calendar shows: a month, a week, a day, or the events as a swimlane over weeks. */
export type CalendarView = "month" | "week" | "day" | "swimlane";

/** The views in the header, the shortest first, with their shared words. */
const VIEWS: readonly (readonly [CalendarView, string])[] = [["day", "Day"], ["week", "Week"], ["month", "Month"], ["swimlane", "Swimlane"]];

const isView = (value: unknown): value is CalendarView => VIEWS.some(([view]) => view === value);

/** `views` as an attribute: present and empty for every view the calendar draws, or the views to offer, in order. */
const viewsConverter = {
  fromAttribute: (value: string | null): boolean | string[] => {
    if (value === null || value === "false") return false;
    const list = value.split(/[\s,]+/).filter(Boolean);
    return list.length === 0 || value === "true" ? true : list;
  },
  toAttribute: (value: boolean | string[]) => (Array.isArray(value) ? value.join(" ") : value ? "" : null),
};

/** One event's bar in a swimlane: its row, and the first and last week (counted from 0) it covers in view. */
export interface SwimlaneBar {
  event: CalendarEvent;
  row: number;
  from: number;
  to: number;
}

/**
 * Lays events out as a swimlane over `weeks` (each the first day of a week
 * of seven): one row each, in the order `eventsByDay` lists them (by first
 * day, the longer first), each a bar from the week holding its first day to
 * the week holding its last, held inside the weeks drawn. Events wholly
 * outside them are left out.
 */
export function swimlaneBars(events: readonly CalendarEvent[], weeks: readonly Day[]): SwimlaneBar[] {
  if (!weeks.length) return [];
  const first = weeks[0], last = addDays(weeks.at(-1)!, 6);
  const seen = new Set<CalendarEvent>();
  const ordered: CalendarEvent[] = [];
  for (const list of eventsByDay(events, first, last).values()) for (const event of list) if (!seen.has(event)) { seen.add(event); ordered.push(event); }
  ordered.sort((a, b) => compareDays(a.start, b.start) || compareDays(endOf(b), endOf(a)));
  const weekOf = (day: Day) => Math.max(0, Math.min(weeks.length - 1, Math.floor(daysBetween(first, day) / 7)));
  return ordered.map((event, row) => ({ event, row, from: weekOf(event.start < first ? first : event.start), to: weekOf(endOf(event) > last ? last : endOf(event)) }));
}

/** An event's last day: its end, or its start for one day. */
const endOf = (event: CalendarEvent): Day => (event.end && isDay(event.end) && event.end > event.start ? event.end : event.start);

/** Whole days from `from` to `to`. */
const daysBetween = (from: Day, to: Day) => Math.round((Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10)) - Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10))) / 864e5);

/** Detail of `view-change`. */
export interface CalendarViewDetail { view: CalendarView }

/** What a full month's day writes before its date: its weekday's name (the first week), and its week's number. */
type DayLabel = { weekday?: string; today?: boolean; week?: number };

export type CalendarLine = { event: CalendarEvent; span: number } | "on" | null;

/**
 * Lays one week's events on lines, so an event over several days keeps its
 * line and is one bar with its name written once: each event takes the
 * lowest line free on all its days in the week, longest first as `byDay`
 * lists them. A day whose events need more lines than `lines` keeps the last
 * one for "+N", and a bar breaks there and goes on after it; `shown` says
 * which days are drawn at all (a bar stops at a day that is not).
 */
export function weekLines(
  week: readonly Day[],
  byDay: ReadonlyMap<Day, readonly CalendarEvent[]>,
  lines: number,
  shown: (day: Day) => boolean = () => true,
): { lines: CalendarLine[]; hidden: number }[] {
  const lineOf = new Map<CalendarEvent, number>();
  const taken = week.map(() => new Set<number>());
  week.forEach((day, column) => {
    for (const event of byDay.get(day) ?? []) {
      if (lineOf.has(event)) continue;
      const columns: number[] = [];
      for (let next = column; next < week.length && (byDay.get(week[next]) ?? []).includes(event); next++) columns.push(next);
      let line = 0;
      while (columns.some(next => taken[next].has(line))) line++;
      lineOf.set(event, line);
      for (const next of columns) taken[next].add(line);
    }
  });
  // How many lines each day draws: all of them, or one fewer for "+N".
  const room = week.map(day => {
    if (!shown(day)) return 0;
    const events = byDay.get(day) ?? [];
    const deepest = Math.max(-1, ...events.map(event => lineOf.get(event)!));
    return deepest < lines ? lines : Math.max(0, lines - 1);
  });
  return week.map((day, column) => {
    const events = byDay.get(day) ?? [];
    const drawn: CalendarLine[] = [];
    for (let line = 0; line < room[column]; line++) {
      const event = events.find(candidate => lineOf.get(candidate) === line);
      if (!event) { drawn.push(null); continue; }
      const before = column > 0 && line < room[column - 1] && (byDay.get(week[column - 1]) ?? []).includes(event);
      if (before) { drawn.push("on"); continue; }
      let span = 1;
      while (column + span < week.length && line < room[column + span] && (byDay.get(week[column + span]) ?? []).includes(event)) span++;
      drawn.push({ event, span });
    }
    // Drop the empty lines at the foot, so a quiet day draws nothing under its date.
    while (drawn.length && drawn.at(-1) === null) drawn.pop();
    const hidden = room[column] < lines ? events.filter(event => lineOf.get(event)! >= room[column]).length : 0;
    return { lines: drawn, hidden };
  });
}

/** One end of a picker's value: its day and, when it has one, its time (`14:30`). */
export interface CalendarEnd {
  day: Day;
  time: string;
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Reads a value: `2026-10-21`, `2026-10-21T14:30`, or two of them joined by `/`. */
export function readDateValue(value: string | null | undefined): { start?: CalendarEnd; end?: CalendarEnd } {
  const read = (part: string | undefined): CalendarEnd | undefined => {
    const [day = "", time = ""] = (part ?? "").trim().split("T");
    if (!isDay(day)) return undefined;
    const clock = time.slice(0, 5);
    return { day, time: TIME.test(clock) ? clock : "" };
  };
  const [first, second] = (value ?? "").split("/");
  let start = read(first), end = read(second);
  if (start && end && `${end.day}T${end.time}` < `${start.day}T${start.time}`) [start, end] = [end, start];
  return { start, end };
}

/**
 * Writes a value from its ends, the times only with `time`. An end that is
 * the same moment as the start leaves the value one day.
 */
export function writeDateValue(start: CalendarEnd | undefined, end: CalendarEnd | undefined, options: { time: boolean }): string {
  if (!start) return "";
  const part = (side: CalendarEnd) => (options.time && side.time ? `${side.day}T${side.time}` : side.day);
  return end && part(end) !== part(start) ? `${part(start)}/${part(end)}` : part(start);
}

/** Reads what a person typed: a day written `YYYY-MM-DD`, or a date the browser can read ("Oct 21, 2026"). */
export function parseTypedDay(text: string): Day | null {
  const trimmed = text.trim();
  if (isDay(trimmed)) return trimmed;
  const moment = Date.parse(trimmed);
  return Number.isFinite(moment) ? dayOf(new Date(moment)) : null;
}

const openPickers = new Set<Calendar>();

/**
 * @element ds-calendar
 * @prop {string} month - The month shown, `YYYY-MM` (or a day in it). The
 *   selected day's month, or today's, when left out; the arrows change it.
 * @prop {string} value - The selected day, `YYYY-MM-DD`, or a range,
 *   `YYYY-MM-DD/YYYY-MM-DD`; in a picker either end may carry a time
 *   (`2026-10-21T09:00`).
 * @prop {boolean} selectable - Pressing a day selects it and fires `change`:
 *   the first press one day, the next the end of a range from it.
 * @prop {boolean} picker - A field one control high that opens the small
 *   month below it, with the days to type, Include time and Clear.
 * @prop {boolean} compact - One square per day, no events written out: the
 *   small month.
 * @prop {number} dayWidth - Squares per day (`day-width`): 4 by default, 1
 *   when compact.
 * @prop {string} view - `month` (the default), `week`, `day` or `swimlane`:
 *   the weeks from the month shown across (a week half a day wide, so it is
 *   as wide as the month), each event one row with one bar from its first
 *   week to its last. A compact calendar and a picker are always a month.
 * @prop {boolean | string[]} views - Day, Week, Month and Swimlane in the
 *   header, to change `view`; or the views to offer, in order
 *   (`views="month swimlane"`). A name the calendar does not draw is the
 *   page's own view: chosen, the calendar keeps its header (the month's title,
 *   the arrows moving a month) and shows what the page puts in its slot of
 *   that name (`<div slot="earnings">`) in place of the days.
 * @prop {Record<string, string>} viewNames - The words for each view in the
 *   switch (property only), over the shared Day, Week, Month and Swimlane;
 *   a page's own view is named by its name when left out.
 * @prop {string} date - The day the week or day view shows, `YYYY-MM-DD`;
 *   today, or the first of the month shown, by default.
 * @prop {number} lines - Lines of events under a day's date: 2 by default.
 * @prop {boolean} weekNumbers - Write the week's number (`week-numbers`) on
 *   its first day.
 * @prop {boolean} fixed - Always draw six weeks, so the month keeps its height,
 *   and every other view stands in that same height (the weekdays and six
 *   weeks): the week's days grow to it, the day's hours fill it, the
 *   swimlane's rows fill it and scroll beyond it, and a page's own view gets
 *   it, so nothing under the calendar moves when the view changes.
 * @prop {boolean} outsideDays - Draw the days of the months before and after
 *   in the title grey (`outside-days`); pressing one moves there.
 * @prop {boolean} activity - The days as quiet squares, a contribution grid:
 *   weeks across a square each, as the swimlane runs, and the days down them,
 *   every other weekday named before them and the month over its weeks; a
 *   day on which something happens is filled with its events' colours, split
 *   into bands when several share it. Dates stay in each day's name and
 *   tooltip. Takes the place of the large calendar's months in squares.
 * @prop {number} months - How many months activity draws from `month`: 1 by default.
 * @prop {boolean} heat - Light each day by how much happens on it, as a
 *   contribution graph does: the events' `count`s added up (one each by
 *   default), in four steps of the busiest day shown.
 * @prop {number} heatMax - The amount that lights a day fully (`heat-max`),
 *   for a scale that stays put from month to month; the busiest day shown
 *   by default.
 * @prop {boolean} noHeader - Leave out the title and arrows (`no-header`).
 *   With a header, pressing the title travels by months and years: the
 *   twelve months of the year, then twelve years, and back down. With a
 *   header, a swipe sideways across the days (a finger or a pen), or a
 *   trackpad's sideways scroll, does what the arrows do, the next month
 *   towards the start and the one before towards the end, and stops where
 *   they stop; the days take sideways touches for it, so a carousel or a
 *   page around the calendar does not move with them.
 * @prop {boolean} noToday - Leave out the Today button (`no-today`).
 * @prop {string} min - The first day a person may choose.
 * @prop {string} max - The last day a person may choose.
 * @prop {string} weekStart - The week's first day (`week-start`), 0–6 from
 *   Sunday or its English name; the language's own by default.
 * @prop {string} today - The day drawn as today; the reader's own by default.
 * @prop {string} label - The grid's name, or a picker's: a translation key,
 *   or literal words with `literal`.
 * @prop {string} name - The form field's name.
 * @prop {string} placeholder - A picker's words before a day is chosen; the
 *   shared "Choose a date" by default.
 * @prop {string} length - How a picker writes a day: `short`, `medium` (the
 *   default) or `long`.
 * @prop {boolean} time - A picker chooses a time with each day (Include time).
 * @prop {boolean} required - A form needs a value; Clear is left out.
 * @prop {boolean} disabled - A picker cannot be opened.
 * @prop {boolean} open - A picker's month is open.
 * @prop {CalendarEvent[]} events - What happens on the days (property only).
 * @prop {(month: Date, view: string) => string} monthHeading - Names the month view's title, and a page's own view's,
 *   (property only): given the first of the month shown, it returns the words,
 *   so a product can write "Events in October" instead of "October 2026". The
 *   week and day views, the twelve months and the twelve years keep their own
 *   titles, and the title button's label still says what it opens.
 *
 * @fires day-press - A day was pressed or chosen with Enter or Space;
 *   `{ day, events }`. Cancelable: cancelled, a selectable calendar keeps its value.
 * @fires change - A person selected a day or ended a range;
 *   `{ value, previous, start, end }`, `end` empty while it is still to come.
 * @fires input - A picker's value changed, the same moment as `change`.
 * @fires event-press - An event was pressed; `{ event, day }`.
 * @fires navigate - A person moved to another month, week or day; `{ month }`.
 * @fires view-change - A person chose another view; `{ view }`.
 * @fires ds-calendar-toggle - A picker's month opened or closed; `{ open }`.
 *
 * A selectable calendar shows Clear right under its dates while something is chosen, and `clear()`
 * empties the value from code; both fire `change` with an empty value.
 *
 * @example
 * <ds-calendar month="2026-10" week-numbers></ds-calendar>
 * <ds-calendar compact selectable value="2026-10-18/2026-10-24"></ds-calendar>
 * <ds-calendar picker label="When" literal name="when" value="2026-10-21/2026-10-24"></ds-calendar>
 */
export class Calendar extends CalendarBase {
  static formAssociated = true;

  static properties = {
    ...CalendarBase.properties,
    month: { type: String, reflect: true },
    compact: { type: Boolean, reflect: true },
    dayWidth: { type: Number, attribute: "day-width" },
    lines: { type: Number },
    weekNumbers: { type: Boolean, attribute: "week-numbers", reflect: true },
    view: { type: String, reflect: true },
    views: { reflect: true, converter: viewsConverter },
    viewNames: { attribute: false },
    date: { type: String, reflect: true },
    fixed: { type: Boolean, reflect: true },
    outsideDays: { type: Boolean, attribute: "outside-days", reflect: true },
    noHeader: { type: Boolean, attribute: "no-header", reflect: true },
    noToday: { type: Boolean, attribute: "no-today", reflect: true },
    heat: { type: Boolean, reflect: true },
    activity: { type: Boolean, reflect: true },
    months: { type: Number },
    heatMax: { type: Number, attribute: "heat-max" },
    picker: { type: Boolean, reflect: true },
    name: { type: String, reflect: true },
    placeholder: { type: String },
    length: { type: String },
    time: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
    unfolded: { state: true },
    embedded: { attribute: false },
    monthHeading: { attribute: false },
    level: { state: true },
    browseYear: { state: true },
    pickFocus: { state: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(controls), unsafeCSS(styles)];
  /** Words cut short (the title, a weekday, the picker's value, an event's name on its bar) fade over their last square, never "…": marks them `data-cut="end"` while they do not fit. */
  protected readonly cuts = new CutFades(this, { selector: ".title:not(.title-button), .title-text, .weekday, .trigger .text, .event .name, .swimlane-month" });

  declare month: string | undefined;
  /** Names the month view's title from the first of the month shown; the month and year when unset. */
  declare monthHeading: ((month: Date, view: string) => string) | undefined;
  declare compact: boolean;
  declare dayWidth: number | undefined;
  declare lines: number | undefined;
  declare weekNumbers: boolean;
  declare view: CalendarView | (string & {});
  declare views: boolean | string[];
  declare viewNames: Record<string, string> | undefined;
  declare date: string | undefined;
  declare fixed: boolean;
  declare outsideDays: boolean;
  declare noHeader: boolean;
  declare noToday: boolean;
  declare heat: boolean;
  declare activity: boolean;
  declare months: number | undefined;
  declare heatMax: number | undefined;
  declare picker: boolean;
  declare name: string | undefined;
  declare placeholder: string | undefined;
  declare length: DateLength | undefined;
  declare time: boolean;
  declare required: boolean;
  declare disabled: boolean;
  declare open: boolean;
  /** The day whose hidden events are unfolded. */
  declare unfolded: Day | undefined;
  /** The small month inside a picker, whose Clear is the picker's own. */
  declare embedded: boolean;
  /** What the grid shows: the month's days, the twelve months of a year, or twelve years. */
  declare level: "days" | "months" | "years";
  /** The year the months and years are drawn around. */
  declare browseYear: number;
  /** The month (0–11) or year holding the Tab stop among the months or years. */
  declare pickFocus: number | undefined;

  protected readonly weeksRun = "rows" as const;

  private byDay = new Map<Day, CalendarEvent[]>();
  private heatByDay = new Map<Day, HeatLevel>();
  private readonly internals = typeof this.attachInternals === "function" ? this.attachInternals() : null;
  /** The value the field started with, for a form's reset. */
  private initial = "";
  private shown = false;
  /** Whether opening a picker should move focus into the month (a key opened it). */
  private focusMonth = false;

  constructor() {
    super();
    this.compact = false;
    this.weekNumbers = false;
    this.view = "month";
    this.views = false;
    this.fixed = false;
    this.outsideDays = false;
    this.noHeader = false;
    this.noToday = false;
    this.heat = false;
    this.activity = false;
    this.picker = false;
    this.time = false;
    this.required = false;
    this.disabled = false;
    this.open = false;
    this.embedded = false;
    this.level = "days";
    this.browseYear = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this.resetMonthMotion);
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this.resetMonthMotion);
    this.hide(false);
    this.stopMonthMotion();
    super.disconnectedCallback();
  }

  protected firstUpdated() {
    this.initial = this.value;
  }

  /** The form was reset: back to the value it started with. */
  formResetCallback() {
    this.value = this.initial;
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  /** The first of the month shown. */
  get shownMonth(): Day {
    return readMonth(this.month) ?? readMonth(readRange(this.value).start) ?? startOfMonth(this.todayDay);
  }

  private get squaresPerDay() {
    return whole(this.dayWidth, 1, 12, this.compact ? 1 : 4);
  }

  private get eventLines() {
    return this.compact ? 0 : whole(this.lines, 0, 12, 2);
  }

  protected eventsOn(day: Day): CalendarEvent[] {
    return this.byDay.get(day) ?? [];
  }

  /** The view drawn: a compact calendar and a picker are always a month. */
  get shownView(): CalendarView {
    if (this.picker || this.compact) return "month";
    if (isView(this.view)) return this.view;
    return this.viewChoices.includes(this.view) ? (this.view as CalendarView) : "month";
  }

  /** The views offered in the header, in order: every one the calendar draws, or the page's list. */
  get viewChoices(): string[] {
    const views = this.views;
    if (Array.isArray(views)) return [...new Set(views.map(view => String(view).trim()).filter(Boolean))];
    return views ? VIEWS.map(([view]) => view) : [];
  }

  /** Whether the view shown is the page's own, drawn in its slot. */
  private get ownView() {
    return !isView(this.shownView);
  }

  /** A view's words in the switch: the page's, else the shared ones, else its name. */
  private viewName(view: string): string {
    const shared = VIEWS.find(([choice]) => choice === view)?.[1];
    const word = this.viewNames?.[view] ?? (shared ? this.words(shared) : view);
    // The switch's options are written `value:words,value:words`.
    return word.replace(/,/g, " ");
  }

  /** Whether the view moves by days (a week or a day) rather than by months (a month or a swimlane). */
  private get byDays() {
    const view = this.shownView;
    return view === "week" || view === "day";
  }

  /** The day the week or day view shows: `date`, else today in the month shown, else its first. */
  get shownDay(): Day {
    if (isDay(this.date)) return this.date;
    const month = this.shownMonth;
    return sameMonth(this.todayDay, month) ? this.todayDay : month;
  }

  /** The seven days of the week `day` falls in. */
  private weekOf(day: Day): Day[] {
    const start = addDays(day, -((weekdayOf(day) - this.firstDay + 7) % 7));
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }

  /** Shows another week or day around `day`, and says so with `navigate`. */
  showDay(day: Day, announce = false) {
    if (!isDay(day) || day === this.date) return;
    this.date = day;
    this.month = day.slice(0, 7);
    this.unfolded = undefined;
    if (announce) this.announceMonth(day);
  }

  /** Changes the view, as Day, Week and Month do, and says so with `view-change`. */
  showView(view: CalendarView) {
    if (view === this.shownView) return;
    if (!isDay(this.date)) this.date = this.shownDay;
    this.view = view;
    this.unfolded = undefined;
    this.dispatchEvent(new CustomEvent<CalendarViewDetail>("view-change", { bubbles: true, composed: true, detail: { view } }));
  }

  /** The split button's choice; its own change event stays inside, since a calendar's change is a chosen day. */
  private onViewChange = (event: Event) => {
    event.stopPropagation();
    const view = (event as CustomEvent<{ value: string }>).detail?.value;
    if (view && (isView(view) || this.viewChoices.includes(view))) this.showView(view as CalendarView);
  };

  /** Brings a day into view: its month, its week or the day itself. */
  private bringIntoView(day: Day) {
    const view = this.shownView;
    if (!this.byDays) {
      if (!sameMonth(day, this.shownMonth)) this.showMonth(day, true);
    } else if (view === "day" || !this.weekOf(this.shownDay).includes(day)) this.showDay(day, true);
  }

  /** Each shown day's lines of events, laid out a week at a time in render(). */
  private laidOut = new Map<Day, { lines: CalendarLine[]; hidden: number }>();

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.style.setProperty("--ds-calendar-day-squares", String(this.squaresPerDay));
    this.style.setProperty("--ds-calendar-lines", String(this.eventLines));
    // A compact month with events writes the days without any fainter.
    this.toggleAttribute("data-events", (this.events ?? []).length > 0);
    this.toggleAttribute("data-roomy", this.squaresPerDay >= 2);
    if (this.picker && changed.has("value") && this.value) {
      const { start, end } = this.ends;
      // A value with a time turns the switch on.
      if (!start) this.value = "";
      else if (start.time || end?.time) this.time = true;
    }
    if (changed.has("disabled") && this.disabled) this.open = false;
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    // A day opens its hours an hour before its first timed event, or at seven.
    if (this.shownView === "day" && (changed.has("view") || changed.has("date") || changed.has("events"))) {
      const hours = this.renderRoot.querySelector<HTMLElement>(".hours");
      const first = hours?.querySelector<HTMLElement>(".hour[data-busy]")?.dataset.hour;
      const open = hours?.querySelector<HTMLElement>(`.hour[data-hour="${Math.max(0, (first ? Number(first) : 8) - 1)}"]`);
      if (hours && open) hours.scrollTop = open.offsetTop;
    }
    if (changed.has("value") || changed.has("required")) {
      this.internals?.setFormValue(this.value || null);
      if (this.required && !this.value) this.internals?.setValidity({ valueMissing: true }, this.pickerWords(undefined, "Choose a date"), this.trigger ?? undefined);
      else this.internals?.setValidity({});
    }
    if (changed.has("open") || changed.has("picker")) {
      if (this.open && this.picker) this.show();
      else this.hide(changed.get("open") === true);
    }
  }

  /** Shows another month and says so with `navigate`. */
  showMonth(month: string, announce = false) {
    const first = readMonth(month);
    if (!first || first === this.shownMonth) return;
    this.month = first.slice(0, 7);
    this.unfolded = undefined;
    if (announce) this.announceMonth(first);
  }

  /** The month before, as the previous arrow does. */
  previousMonth() {
    this.showMonth(addMonths(this.shownMonth, -1), true);
  }

  /** The month after, as the next arrow does. */
  nextMonth() {
    this.showMonth(addMonths(this.shownMonth, 1), true);
  }

  /** Today's month, as the Today button does. */
  showToday() {
    this.level = "days";
    this.showMonth(this.todayDay, true);
    if (this.shownView !== "month") this.showDay(this.todayDay, true);
    this.focusDay = this.todayDay;
  }

  /** Empties the value, as Clear does, and says so with `change`. */
  clear() {
    if (this.picker) {
      this.commit("");
      this.open = false;
      return;
    }
    const previous = this.value || "";
    this.endPending = false;
    this.hoverDay = undefined;
    if (!previous) return;
    this.value = "";
    this.dispatchEvent(new CustomEvent<CalendarChangeDetail>("change", { bubbles: true, composed: true, detail: { value: "", previous, start: "", end: "" } }));
  }

  // Travelling by months and years: the title goes up a level, a choice comes back down.

  /** A person has moved between levels, so a level's grid fades in when it comes. */
  private travelled = false;

  /** The twelve years drawn around `browseYear`, as their first and last. */
  private get yearSpan(): [number, number] {
    const first = Math.floor(this.browseYear / 12) * 12;
    return [first, first + 11];
  }

  private yearName(year: number) {
    return dateFormatter({ year: "numeric", timeZone: "UTC" }).format(Date.UTC(year, 6, 1));
  }

  /** The title: the days go up to the months of their year, the months to twelve years. */
  private levelUp = () => {
    this.travelled = true;
    if (this.level === "days") {
      this.browseYear = Number(this.shownMonth.slice(0, 4));
      this.pickFocus = Number(this.shownMonth.slice(5, 7)) - 1;
      this.level = "months";
    } else if (this.level === "months") {
      this.pickFocus = this.browseYear;
      this.level = "years";
    }
  };

  /** Back down a level: from twelve years to the months, from the months to the days. */
  private levelDown(focus = false) {
    this.travelled = true;
    if (this.level === "years") {
      this.pickFocus = Number(this.shownMonth.slice(5, 7)) - 1;
      this.level = "months";
      if (focus) void this.focusPick();
    } else if (this.level === "months") {
      this.level = "days";
      if (focus) void this.focusCell(this.tabDay);
    }
  }

  /** The arrows: a month among the days, a year among the months, twelve years among the years. */
  private step(direction: -1 | 1) {
    if (this.level === "days") {
      const view = this.shownView;
      if (this.byDays) return this.showDay(addDays(this.shownDay, direction * (view === "week" ? 7 : 1)), true);
      return direction < 0 ? this.previousMonth() : this.nextMonth();
    }
    this.browseYear += direction * (this.level === "months" ? 1 : 12);
    if (this.level === "years") this.pickFocus = (this.pickFocus ?? this.browseYear) + direction * 12;
  }

  /** A month or a year chosen: a year shows its months, a month its days. */
  private choose(value: number) {
    this.travelled = true;
    if (this.level === "years") {
      this.browseYear = value;
      this.pickFocus = Number(this.shownMonth.slice(5, 7)) - 1;
      this.level = "months";
      void this.focusPick();
      return;
    }
    const month = `${String(this.browseYear).padStart(4, "0")}-${String(value + 1).padStart(2, "0")}-01`;
    this.level = "days";
    this.showMonth(month, true);
    if (this.shownView !== "month") this.showDay(month as Day, false);
    const day = [this.focusDay, this.chosen.start, this.todayDay].find(day => day && sameMonth(day, month)) ?? month;
    void this.focusCell(day);
  }

  private async focusPick() {
    await this.updateComplete;
    this.renderRoot.querySelector<HTMLElement>('.pick[tabindex="0"]')?.focus({ preventScroll: true });
  }

  private onPickKey = (event: KeyboardEvent) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-pick]");
    if (!cell) return;
    const value = Number(cell.dataset.pick);
    const columns = this.pickColumns;
    const rtl = getComputedStyle(this).direction === "rtl";
    const moves: Record<string, number> = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: columns, ArrowUp: -columns };
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.choose(value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.levelDown(true);
    } else if (event.key in moves) {
      event.preventDefault();
      let next = value + moves[event.key];
      if (this.level === "months") {
        // Past December is the next year's January.
        if (next < 0 || next > 11) { this.browseYear += next < 0 ? -1 : 1; next = (next + 12) % 12; }
      } else {
        const [first, last] = this.yearSpan;
        if (next < first || next > last) this.browseYear = next;
      }
      this.pickFocus = next;
      void this.focusPick();
    }
  };

  /** Months and years stand in rows of one square, one square apart: three across a narrow month, four across a wider one. */
  private get pickColumns() {
    return 7 * this.squaresPerDay >= 12 ? 4 : 3;
  }

  private renderPicks(weeks: number) {
    const level = this.level;
    const year = this.browseYear;
    const today = this.todayDay;
    const chosen = this.chosen.start;
    const columns = this.pickColumns;
    const cell = Math.floor((7 * this.squaresPerDay) / columns);
    const values = level === "months" ? Array.from({ length: 12 }, (_, month) => month) : Array.from({ length: 12 }, (_, index) => this.yearSpan[0] + index);
    const focus = this.pickFocus !== undefined && values.includes(this.pickFocus)
      ? this.pickFocus
      : level === "months" ? (chosen && Number(chosen.slice(0, 4)) === year ? Number(chosen.slice(5, 7)) - 1 : 0) : year;
    const rows = Array.from({ length: Math.ceil(values.length / columns) }, (_, row) => values.slice(row * columns, row * columns + columns));
    const long = cell >= 4;
    const name = (value: number) => level === "months" ? monthName(`${String(year).padStart(4, "0")}-${String(value + 1).padStart(2, "0")}-01`, long ? "long" : "short") : this.yearName(value);
    const isToday = (value: number) => level === "months" ? today.slice(0, 7) === `${String(year).padStart(4, "0")}-${String(value + 1).padStart(2, "0")}` : Number(today.slice(0, 4)) === value;
    const isChosen = (value: number) => Boolean(chosen) && (level === "months" ? chosen.slice(0, 7) === `${String(year).padStart(4, "0")}-${String(value + 1).padStart(2, "0")}` : Number(chosen.slice(0, 4)) === value);
    const allowed = (value: number) => {
      const min = this.minDay, max = this.maxDay;
      if (level === "years") return !(min && value < Number(min.slice(0, 4))) && !(max && value > Number(max.slice(0, 4)));
      const month = `${String(year).padStart(4, "0")}-${String(value + 1).padStart(2, "0")}`;
      return !(min && month < min.slice(0, 7)) && !(max && month > max.slice(0, 7));
    };
    return html`<div
      class="picks"
      part="picks"
      role="grid"
      data-level=${level}
      ?data-travel=${this.travelled}
      aria-label=${level === "months" ? this.yearName(year) : `${this.yearName(this.yearSpan[0])} – ${this.yearName(this.yearSpan[1])}`}
      style=${`--ds-calendar-pick-columns: ${columns}; --ds-calendar-pick-cell: ${cell}; --ds-calendar-weeks: ${weeks}`}
      @keydown=${this.onPickKey}
    >${rows.map(row => html`<div role="row" class="pick-row">${row.map(value => html`<button
        type="button"
        role="gridcell"
        class="pick"
        part=${["pick", isChosen(value) ? "selected" : "", isToday(value) ? "today" : ""].filter(Boolean).join(" ")}
        data-pick=${value}
        tabindex=${value === focus ? 0 : -1}
        aria-selected=${String(isChosen(value))}
        aria-current=${isToday(value) ? "date" : nothing}
        ?disabled=${!allowed(value)}
        ?data-selected=${isChosen(value)}
        ?data-today=${isToday(value)}
        @click=${() => this.choose(value)}
      ><span class="pick-mark">${name(value)}</span></button>`)}</div>`)}</div>`;
  }

  private renderClear() {
    if (!this.selectable || this.embedded || this.required || !this.value) return nothing;
    return html`<div class="foot" part="foot">
      <button class="ds-button ds-button--secondary clear-value" part="clear" type="button" @click=${() => this.clear()}>${this.words("Clear")}</button>
    </div>`;
  }

  /** The day holding the Tab stop: the one moved to, the selected day, today, or the first. */
  private get tabDay(): Day {
    const month = this.shownMonth;
    for (const day of [this.focusDay, this.chosen.start, this.todayDay]) if (day && sameMonth(day, month)) return day;
    return month;
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-day]");
    if (!cell) return;
    const day = cell.dataset.day as Day;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.press(day);
      return;
    }
    if (event.key === "Escape" && this.unfolded) {
      event.stopPropagation();
      this.unfolded = undefined;
      return;
    }
    const target = this.keyTarget(event, day);
    if (!target) return;
    event.preventDefault();
    this.bringIntoView(target);
    void this.focusCell(target);
  };

  // A swipe sideways across the days or the months, as the arrows: by finger or pen, or a trackpad's
  // sideways scroll. Read from the arrows themselves, so a swipe goes nowhere an arrow cannot.
  private swipe?: { id: number; x: number; y: number; at: number };
  private swipedAt = 0;
  private wheel = { dx: 0, at: 0, locked: 0 };

  private swipeTo(direction: -1 | 1) {
    const arrow = this.renderRoot.querySelector<HTMLButtonElement>(`.header [part~="${direction < 0 ? "previous" : "next"}"]`);
    if (!arrow || arrow.disabled) return false;
    this.step(direction);
    return true;
  }

  private get rtl() {
    return getComputedStyle(this).direction === "rtl";
  }

  private monthPan?: { id: number; x: number; y: number; at: number; offset: number; width: number; horizontal: boolean; track: HTMLElement };
  private monthFrame?: number;
  private monthTimer?: ReturnType<typeof setTimeout>;
  private monthOffset = 0;

  private get mobileMonth() {
    return this.compact && !this.noHeader && this.level === "days" && this.shownView === "month"
      && typeof matchMedia === "function" && matchMedia("(max-width: 720px)").matches;
  }

  private canSwipe(direction: -1 | 1) {
    const arrow = this.renderRoot.querySelector<HTMLButtonElement>(`.header [part~="${direction < 0 ? "previous" : "next"}"]`);
    return Boolean(arrow && !arrow.disabled);
  }

  private stopMonthMotion() {
    if (this.monthFrame !== undefined) cancelAnimationFrame(this.monthFrame);
    if (this.monthTimer !== undefined) clearTimeout(this.monthTimer);
    this.monthFrame = undefined;
    this.monthTimer = undefined;
    this.monthPan = undefined;
  }

  private resetMonthMotion = () => {
    this.stopMonthMotion();
    const track = this.renderRoot.querySelector<HTMLElement>(".month-track");
    if (track) { track.style.transition = "none"; track.style.transform = "translateX(0px)"; }
    this.monthOffset = 0;
    this.swipe = undefined;
  };

  private paintMonth(track: HTMLElement, offset: number) {
    this.monthOffset = offset;
    if (this.monthFrame !== undefined) cancelAnimationFrame(this.monthFrame);
    this.monthFrame = requestAnimationFrame(() => {
      this.monthFrame = undefined;
      track.style.transform = `translateX(${this.monthOffset}px)`;
    });
  }

  private settleMonth(track: HTMLElement, width: number, direction?: -1 | 1) {
    if (this.monthFrame !== undefined) cancelAnimationFrame(this.monthFrame);
    this.monthFrame = undefined;
    const allowed = direction !== undefined && this.canSwipe(direction);
    const target = allowed ? -direction * (this.rtl ? -1 : 1) * width : 0;
    const complete = async () => {
      this.monthTimer = undefined;
      if (allowed) this.swipeTo(direction!);
      await this.updateComplete;
      track.style.transition = "none";
      track.style.transform = "translateX(0px)";
      this.monthOffset = 0;
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !width) {
      void complete();
      return;
    }
    track.style.transition = "transform 180ms cubic-bezier(0.23, 1, 0.32, 1)";
    track.style.transform = `translateX(${target}px)`;
    this.monthTimer = setTimeout(() => void complete(), 180);
  }

  private onSwipeStart = (event: PointerEvent) => {
    this.swipe = event.pointerType === "mouse" || !event.isPrimary ? undefined : { id: event.pointerId, x: event.clientX, y: event.clientY, at: event.timeStamp };
    if (!this.swipe || !this.mobileMonth || !(event.target as Element).closest?.(".grid")) return;
    const track = this.renderRoot.querySelector<HTMLElement>(".month-track");
    if (!track) return;
    // An interrupted settling motion is taken over at its current visible position.
    const transform = getComputedStyle(track).transform;
    const offset = transform && transform !== "none" ? new DOMMatrixReadOnly(transform).m41 : 0;
    this.stopMonthMotion();
    track.style.transition = "none";
    track.style.transform = `translateX(${offset}px)`;
    this.monthOffset = offset;
    this.monthPan = { id: event.pointerId, x: event.clientX - offset, y: event.clientY, at: event.timeStamp, offset, width: track.getBoundingClientRect().width, horizontal: false, track };
  };

  private onSwipeMove = (event: PointerEvent) => {
    const pan = this.monthPan;
    if (!pan || pan.id !== event.pointerId) return;
    const dx = event.clientX - pan.x, dy = event.clientY - pan.y;
    if (!pan.horizontal) {
      if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) {
        this.monthPan = undefined; this.swipe = undefined;
        if (pan.offset) this.settleMonth(pan.track, pan.width);
        return;
      }
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 2) return;
      pan.horizontal = true;
      this.swipedAt = Date.now();
      try { (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); } catch { /* A synthetic pointer has no capture. */ }
    }
    event.preventDefault();
    const direction = dx * (this.rtl ? -1 : 1) < 0 ? 1 : -1;
    const offset = this.canSwipe(direction) ? Math.max(-pan.width, Math.min(pan.width, dx)) : 0;
    pan.offset = offset;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) this.paintMonth(pan.track, offset);
  };

  private onSwipeCancel = () => {
    const pan = this.monthPan;
    this.monthPan = undefined; this.swipe = undefined;
    if (pan) this.settleMonth(pan.track, pan.width);
  };

  private onSwipeEnd = (event: PointerEvent) => {
    const pan = this.monthPan;
    if (pan && event.pointerId === pan.id) {
      this.monthPan = undefined; this.swipe = undefined;
      if (!pan.horizontal) return;
      this.swipedAt = Date.now();
      const dx = pan.offset * (this.rtl ? -1 : 1);
      const duration = Math.max(1, event.timeStamp - pan.at);
      const commit = Math.abs(dx) >= Math.min(40, pan.width * 0.25) || (Math.abs(dx) >= 16 && duration < 250 && Math.abs(dx) / duration > 0.4);
      this.settleMonth(pan.track, pan.width, commit ? dx < 0 ? 1 : -1 : undefined);
      return;
    }
    const swipe = this.swipe;
    this.swipe = undefined;
    if (!swipe || event.pointerId !== swipe.id) return;
    const dx = (event.clientX - swipe.x) * (this.rtl ? -1 : 1);
    const dy = event.clientY - swipe.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 2 || event.timeStamp - swipe.at > 800) return;
    if (this.swipeTo(dx < 0 ? 1 : -1)) this.swipedAt = Date.now();
  };

  private onSwipeWheel = (event: WheelEvent) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    const now = Date.now();
    if (now < this.wheel.locked) return;
    if (now - this.wheel.at > 200) this.wheel.dx = 0;
    this.wheel.at = now;
    this.wheel.dx += event.deltaX * (this.rtl ? -1 : 1);
    if (Math.abs(this.wheel.dx) < 60) return;
    const direction = this.wheel.dx > 0 ? 1 : -1;
    this.wheel = { dx: 0, at: 0, locked: now + 500 };
    const track = this.mobileMonth ? this.renderRoot.querySelector<HTMLElement>(".month-track") : null;
    if (track) this.settleMonth(track, track.getBoundingClientRect().width, direction);
    else this.swipeTo(direction);
  };

  private onSwipeClick = (event: MouseEvent) => {
    if (Date.now() - this.swipedAt > 400) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  private onClick = (event: MouseEvent) => {
    const path = event.composedPath() as HTMLElement[];
    const find = (selector: string) => path.find(node => node instanceof HTMLElement && node.matches(selector));
    const cell = find("[data-day]");
    if (!cell) return;
    const day = cell.dataset.day as Day;
    const more = find("[data-more]");
    if (more) {
      this.unfolded = this.unfolded === day ? undefined : day;
      return;
    }
    const chip = find("[data-event]");
    if (chip) {
      const event = this.eventsOn(day)[Number(chip.dataset.event)];
      if (event) this.pressEvent(event, day);
      return;
    }
    this.focusDay = day;
    this.press(day);
    // A day of the month before or after takes the calendar there.
    this.bringIntoView(day);
  };

  /** While a range waits for its end, the day under the pointer previews it. */
  private onPointerOver = (event: PointerEvent) => {
    if (!this.endPending || !this.selectable) return;
    const cell = (event.composedPath() as HTMLElement[]).find(node => node instanceof HTMLElement && node.dataset?.day);
    const day = cell?.dataset.day as Day | undefined;
    if (day !== this.hoverDay && (!day || this.allowed(day))) this.hoverDay = day;
  };

  private onFocusOut = (event: FocusEvent) => {
    if (this.unfolded && !(event.relatedTarget instanceof Node && this.renderRoot.contains(event.relatedTarget))) this.unfolded = undefined;
  };

  private renderHeader() {
    if (this.noHeader) return nothing;
    const month = this.shownMonth;
    const min = this.minDay, max = this.maxDay;
    const before = Boolean(min && addMonths(month, -1).slice(0, 7) < min.slice(0, 7));
    const after = Boolean(max && addMonths(month, 1).slice(0, 7) > max.slice(0, 7));
    const level = this.level;
    const year = this.browseYear;
    const span = this.yearSpan;
    const view = this.shownView;
    const labels = level === "days" && this.byDays
      ? view === "week" ? ["Previous week", "Next week"] : ["Previous day", "Next day"]
      : { days: ["Previous month", "Next month"], months: ["Previous year", "Next year"], years: ["Earlier years", "Later years"] }[level];
    const shownDays = view === "week" ? this.weekOf(this.shownDay) : [this.shownDay];
    const blocked = level === "days" && this.byDays
      ? [Boolean(min && addDays(shownDays[0], -1) < min), Boolean(max && addDays(shownDays.at(-1)!, 1) > max)]
      : level === "days"
      ? [before, after]
      : level === "months"
        ? [Boolean(min && year - 1 < Number(min.slice(0, 4))), Boolean(max && year + 1 > Number(max.slice(0, 4)))]
        : [Boolean(min && span[0] - 1 < Number(min.slice(0, 4))), Boolean(max && span[0] + 12 > Number(max.slice(0, 4)))];
    const arrow = (which: "previous" | "next") => html`<button
      class="nav"
      part=${which}
      type="button"
      aria-label=${this.words(labels[which === "previous" ? 0 : 1])}
      ?disabled=${blocked[which === "previous" ? 0 : 1]}
      @click=${() => this.step(which === "previous" ? -1 : 1)}
    ><ds-icon type=${(this.compact ? "chevron-" : "") + (which === "previous" ? "left" : "right")} size=${this.compact ? "large" : nothing} aria-hidden="true"></ds-icon></button>`;
    const title = level === "days"
      ? view === "week"
        ? this.rangeTitle(shownDays[0], shownDays[6])
        : view === "day"
          ? dayLabel(this.shownDay)
          : view === "swimlane"
            ? this.monthRangeTitle(this.swimlaneWeeks)
            : this.monthHeading
            ? this.monthHeading(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1), view)
            : monthTitle(month, this.compact ? "short" : "long")
      : level === "months"
        ? this.yearName(year)
        : `${this.yearName(span[0])} – ${this.yearName(span[0] + 11)}`;
    const switchable = this.viewChoices.length > 1 && !this.compact && !this.picker;
    return html`<div class="header" part="header" ?data-views=${switchable}>
      ${level === "years"
        ? html`<span class="title" id="title" aria-live="polite">${title}</span>`
        : html`<button
            class="title title-button"
            part="title"
            type="button"
            aria-label=${`${title}, ${this.words("Choose a month and year")}`}
            @click=${this.levelUp}
          ><span class="title-text" id="title" aria-live="polite">${title}</span></button>`}
      ${switchable ? html`<ds-button
        class="views"
        part="views"
        split
        literal
        aria-label=${this.words("View")}
        .options=${this.viewChoices.map(choice => `${choice}:${this.viewName(choice)}`).join(",")}
        .value=${view}
        @change=${this.onViewChange}
      ></ds-button>` : nothing}
      <span class="controls" role="group" aria-label=${this.words("Date")}>
        ${arrow("previous")}
        ${this.noToday || this.squaresPerDay < 2 ? nothing : html`<button class="today-button" part="today" type="button" @click=${() => this.showToday()}>${this.words("Today")}</button>`}
        ${arrow("next")}
      </span>
    </div>`;
  }

  private renderDay(day: Day, inView = sameMonth(day, this.shownMonth), tabDay = this.tabDay, label?: DayLabel) {
    const outside = !inView;
    if (outside && !this.outsideDays) {
      return html`<div role="gridcell" class="day outside" part="day outside">${label?.weekday || label?.week
        ? html`<span class="date-line" aria-hidden="true">${this.renderLabel(label)}</span>`
        : nothing}</div>`;
    }
    const events = this.eventsOn(day);
    const lines = this.eventLines;
    const isToday = day === this.todayDay;
    const { selected, inside, first, last } = this.selection(day);
    const allowed = this.allowed(day);
    const unfolded = this.unfolded === day;
    const laid = this.laidOut.get(day) ?? { lines: [], hidden: 0 };
    const heat = this.heatByDay.get(day);
    const parts = ["day", isToday ? "today" : "", selected ? "selected" : "", heat ? "heat" : ""].filter(Boolean).join(" ");
    return html`<div
      role="gridcell"
      class="day"
      part=${parts}
      data-day=${day}
      tabindex=${!outside && day === tabDay ? 0 : -1}
      aria-label=${this.cellLabel(day, events)}
      aria-selected=${this.selectable ? String(selected || inside) : nothing}
      aria-current=${isToday ? "date" : nothing}
      aria-disabled=${allowed ? nothing : "true"}
      ?data-today=${isToday}
      ?data-selected=${selected}
      ?data-inside=${inside}
      ?data-first=${first}
      ?data-last=${last}
      ?data-outside=${outside}
      ?data-busy=${events.length > 0}
      data-heat=${heat ?? nothing}
      ?data-open=${unfolded}
    >
      <span class="date-line" aria-hidden="true">
        ${label ? this.renderLabel(label) : nothing}
        <span class="date">${dateNumber(day)}</span>
      </span>
      ${lines > 0 && events.length
        ? html`<span class="events" aria-hidden="true">
            ${unfolded
              ? events.map(event => this.renderEvent(event, events, 1))
              : laid.lines.map(line => line === null || line === "on"
                ? html`<span class="line" data-line=${line ?? "empty"}></span>`
                : this.renderEvent(line.event, events, line.span))}
            ${laid.hidden > 0 && !unfolded ? html`<span class="more" part="more" data-more>+${laid.hidden}</span>` : nothing}
          </span>`
        : nothing}
    </div>`;
  }

  /** What a day writes before its date: its weekday's name in the first week, and the week's number on its first day. */
  private renderLabel(label: DayLabel) {
    return html`${label.weekday ? html`<span class="weekday-name" ?data-today=${label.today}>${label.weekday}</span>` : nothing}${label.week
      ? html`<span class="week-number">${this.words("W{week}", { week: label.week })}</span>`
      : nothing}`;
  }

  /** A week's days as one title: "Oct 18 – 24, 2026", in the language's own way. */
  private rangeTitle(from: Day, to: Day): string {
    const format = dateFormatter({ month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    const at = (day: Day) => Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)), 12);
    return typeof format.formatRange === "function" ? format.formatRange(at(from), at(to)) : `${format.format(at(from))} – ${format.format(at(to))}`;
  }

  /** The first day of each week a swimlane draws: from the week holding the month's first, a week to each square the month has across. */
  private get swimlaneWeeks(): Day[] {
    const first = this.shownMonth;
    const start = addDays(first, -((weekdayOf(first) - this.firstDay + 7) % 7));
    const count = Math.max(4, 7 * this.squaresPerDay);
    return Array.from({ length: count }, (_, index) => addDays(start, index * 7));
  }

  /** The month owning most of a week: its Thursday's, counted from the week's first day. */
  private ownerOf(weekStart: Day): Day {
    return startOfMonth(addDays(weekStart, 3));
  }

  /** The months a swimlane covers as one title: "Oct 2026 – Jan 2027". */
  private monthRangeTitle(weeks: readonly Day[]): string {
    const from = this.ownerOf(weeks[0]), to = this.ownerOf(weeks.at(-1)!);
    const format = dateFormatter({ month: "short", year: "numeric", timeZone: "UTC" });
    const at = (day: Day) => Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, 15);
    if (from === to) return monthTitle(from);
    return typeof format.formatRange === "function" ? format.formatRange(at(from), at(to)) : `${format.format(at(from))} – ${format.format(at(to))}`;
  }

  /**
   * The events as a swimlane: weeks across, a square each; over them the
   * months, named where the month owning the week changes, and each week's
   * first date (today's date in its disc on today's week); then a row to an
   * event, a square high, each one bar from its first week to its last.
   */
  private renderSwimlane() {
    const weeks = this.swimlaneWeeks;
    const bars = swimlaneBars(this.events ?? [], weeks);
    // Fixed, the rows (a square each) fill the month's height under the months and dates, and scroll past it.
    const fit = this.fixed ? Math.max(1, 6 * (this.eventLines + 2) - 1) : 6;
    const rows = Math.max(fit, bars.length + 1);
    const today = this.todayDay;
    const todayWeek = weeks.findIndex(start => today >= start && today <= addDays(start, 6));
    const months: { column: number; span: number; month: Day }[] = [];
    weeks.forEach((start, column) => {
      const month = this.ownerOf(start);
      const last = months.at(-1);
      if (last && last.month === month) last.span++;
      else months.push({ column, span: 1, month });
    });
    const range = (event: CalendarEvent) => {
      const end = event.end && isDay(event.end) && event.end > event.start ? event.end : event.start;
      return end === event.start ? dayLabel(event.start) : this.rangeTitle(event.start, end);
    };
    return this.swipeFrame(html`<div
        class="swimlane"
        part="swimlane"
        role="group"
        ?data-travel=${this.travelled}
        aria-label=${this.nameOr(this.monthRangeTitle(weeks))}
        style=${`--ds-calendar-weeks: ${weeks.length}; --ds-calendar-rows: ${rows}; --ds-calendar-fit: ${fit}`}
      >
        <div class="swimlane-months" part="months" aria-hidden="true">
          ${months.map(({ column, span, month }, index) => html`<span class="swimlane-month" style=${`grid-column: ${column + 1} / span ${span}`}>${
            index === 0 || month.slice(5, 7) === "01" ? monthTitle(month, "short") : monthName(month, "short")
          }</span>`)}
        </div>
        <div class="swimlane-dates" part="dates" aria-hidden="true">
          ${weeks.map((start, column) => column === todayWeek
            ? html`<span class="swimlane-date" data-today><span class="date">${dateNumber(today)}</span></span>`
            : html`<span class="swimlane-date"><span class="date">${dateNumber(start)}</span></span>`)}
        </div>
        <div class="swimlane-scroll" part="scroll"><div class="swimlane-grid" part="grid">
          ${Array.from({ length: rows }, (_, row) => weeks.map((_, column) => html`<span
            class="cell"
            aria-hidden="true"
            style=${`grid-row: ${row + 1}; grid-column: ${column + 1}`}
            ?data-first-row=${row === 0}
            ?data-last-row=${row === rows - 1}
            ?data-first-column=${column === 0}
            ?data-last-column=${column === weeks.length - 1}
          ></span>`))}
          ${bars.map(({ event, row, from, to }, index) => {
            const fill = event.color ? `--ds-calendar-event-fill: ${event.color}; --ds-calendar-event-ink: var(--ds-slate); ` : "";
            return html`<button
              type="button"
              class="event"
              part="event"
              data-event=${index}
              aria-label=${`${event.title}, ${range(event)}`}
              style=${`${fill}grid-row: ${row + 1}; grid-column: ${from + 1} / ${to + 2}`}
              @click=${() => this.pressEvent(event, event.start)}
            ><span class="name">${event.title}</span></button>`;
          })}
        </div></div>
      </div>`);
  }

  /** The first day of each week activity draws: from the week holding the month's first to the one holding its last month's last day. */
  private get activityWeeks(): Day[] {
    const first = this.shownMonth;
    const end = addDays(addMonths(first, whole(this.months, 1, 36, 1)), -1);
    const weeks: Day[] = [];
    for (let day = addDays(first, -((weekdayOf(first) - this.firstDay + 7) % 7)); day <= end; day = addDays(day, 7)) weeks.push(day);
    return weeks;
  }

  /**
   * The days as quiet squares: every other weekday named down the start, the
   * months over their weeks, and a week to a column a square wide, its days
   * down it, each a square drawn two pixels in with a picture's corners,
   * filled with its events' colours. Days outside the months stay empty.
   */
  private renderActivity() {
    const weeks = this.activityWeeks;
    const first = this.shownMonth;
    const end = addMonths(first, whole(this.months, 1, 36, 1));
    this.byDay = eventsByDay(this.events ?? [], weeks[0], addDays(weeks.at(-1)!, 6));
    const short = weekdayNames(this.firstDay, "short");
    const narrow = weekdayNames(this.firstDay, "narrow");
    const long = weekdayNames(this.firstDay, "long");
    const today = this.todayDay;
    const months: { column: number; span: number; month: Day }[] = [];
    // A week is named by the month owning most of it, held to the months drawn.
    const lastMonth = addMonths(end, -1);
    weeks.forEach((start, column) => {
      const owner = this.ownerOf(start);
      const month = owner < first ? first : owner > lastMonth ? lastMonth : owner;
      const last = months.at(-1);
      if (last && last.month === month) last.span++;
      else months.push({ column, span: 1, month });
    });
    return html`<div class="calendar" part="calendar">
      ${this.renderHeader()}
      <div class="activity" part="activity" style=${`--ds-calendar-weeks: ${weeks.length}`}>
        <div class="activity-rail" part="weekdays" aria-hidden="true">
          ${short.map((name, row) => html`<span class="activity-weekday" data-narrow=${narrow[row]}>${row % 2 === 1 ? name : ""}</span>`)}
        </div>
        <div class="activity-weeks">
          <div class="activity-months" part="months" aria-hidden="true">
            ${months.map(({ column, span, month }, index) => html`<span class="activity-month" style=${`grid-column: ${column + 1} / span ${span}`}>${
              index === 0 || month.slice(5, 7) === "01" ? monthTitle(month, "short") : monthName(month, "short")
            }</span>`)}
          </div>
          <div
            class="activity-grid"
            part="grid"
            role="grid"
            aria-label=${this.nameOr(months.length > 1 ? this.monthRangeTitle(weeks) : monthTitle(first))}
            @click=${this.onClick}
          >
            ${short.map((_, row) => html`<div role="row" class="activity-row">
              <span role="rowheader" class="activity-hidden">${long[row]}</span>
              ${weeks.map((start, column) => {
                const day = addDays(start, row);
                const style = `grid-row: ${row + 1}; grid-column: ${column + 1}`;
                if (day < first || day >= end) return html`<span role="gridcell" class="activity-day" aria-hidden="true" style=${style}></span>`;
                const events = this.eventsOn(day);
                const fill = activityFill(events);
                const label = this.cellLabel(day, events);
                const { selected } = this.selection(day);
                return html`<span
                  role="gridcell"
                  class="activity-day"
                  part=${["day", day === today ? "today" : "", events.length ? "filled" : ""].filter(Boolean).join(" ")}
                  data-day=${day}
                  aria-label=${label}
                  title=${label}
                  aria-current=${day === today ? "date" : nothing}
                  aria-selected=${this.selectable ? String(selected) : nothing}
                  ?data-filled=${events.length > 0}
                  ?data-selected=${selected}
                  style=${`${style};${fill ? ` --ds-calendar-cell-fill: ${fill};` : ""}`}
                ></span>`;
              })}
            </div>`)}
          </div>
        </div>
      </div>
    </div>`;
  }

  /** A view drawn under the header that swipes as the arrows move: the swimlane and a page's own view. */
  private swipeFrame(content: unknown) {
    const swipes = !this.noHeader;
    return html`<div
      class="calendar"
      part="calendar"
      ?data-swipe=${swipes}
      @pointerdown=${swipes ? this.onSwipeStart : nothing}
      @pointermove=${swipes ? this.onSwipeMove : nothing}
      @pointerup=${swipes ? this.onSwipeEnd : nothing}
      @pointercancel=${this.onSwipeCancel}
      @wheel=${swipes ? this.onSwipeWheel : nothing}
      @click=${{ handleEvent: this.onSwipeClick, capture: true }}
    >
      ${this.renderHeader()}
      ${content}
    </div>`;
  }

  /** A page's own view: what it puts in the slot named after the view, as wide as the month. */
  private renderOwnView() {
    const view = this.shownView;
    return this.swipeFrame(html`<div class="own-view" part="own-view" data-view=${view} ?data-travel=${this.travelled}><slot name=${view}></slot></div>`);
  }

  /**
   * One day: its events without a time across the top, a day's width each,
   * then its hours, a square each, in an area that scrolls, with each timed
   * event at its hour beside the others of that hour.
   */
  private renderDayView() {
    const day = this.shownDay;
    this.byDay = eventsByDay(this.events ?? [], day, day);
    const events = this.eventsOn(day);
    const allDay = events.filter(event => !event.time);
    const hourName = dateFormatter({ hour: "numeric", timeZone: "UTC" });
    const hours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      name: hourName.format(Date.UTC(2000, 0, 1, hour)),
      events: events.filter(event => event.time && Number(event.time.slice(0, 2)) === hour),
    }));
    return html`<div class="calendar" part="calendar">
      ${this.renderHeader()}
      ${this.level !== "days" ? this.renderPicks(6) : html`<div
        class="day-view"
        part="day-view"
        data-day=${day}
        aria-label=${this.cellLabel(day, events)}
        @click=${this.onClick}
      >
        ${allDay.length ? html`<div class="all-day" part="all-day">${allDay.map(event => this.renderEvent(event, events, 1))}</div>` : nothing}
        <div class="hours" part="hours">
          ${hours.map(({ hour, name, events: atHour }) => html`<div class="hour" part="hour" data-hour=${hour} ?data-busy=${atHour.length > 0}>
            <span class="hour-name">${name}</span>
            <span class="hour-events">${atHour.map(event => this.renderEvent(event, events, 1))}</span>
          </div>`)}
        </div>
      </div>`}
    </div>`;
  }

  /** An event on its line: one bar over `span` days, its name written once. */
  private renderEvent(event: CalendarEvent, events: readonly CalendarEvent[], span: number) {
    const fill = event.color ? `--ds-calendar-event-fill: ${event.color}; --ds-calendar-event-ink: var(--ds-slate);` : "";
    return html`<span
      class="event"
      part="event"
      data-event=${events.indexOf(event)}
      data-span=${span > 1 ? span : nothing}
      style=${fill || span > 1 ? `${fill}${span > 1 ? ` --ds-calendar-event-span: ${span}` : ""}` : nothing}
    >${event.time ? html`<span class="time">${event.time}</span>` : nothing}<span class="name">${event.title}</span></span>`;
  }

  render() {
    if (this.picker) return this.renderPicker();
    if (this.activity && this.level === "days") return this.renderActivity();
    const month = this.shownMonth;
    const first = this.firstDay;
    const view = this.shownView;
    if (view === "day" && this.level === "days") return this.renderDayView();
    if (view === "swimlane" && this.level === "days") return this.renderSwimlane();
    if (this.ownView && this.level === "days") return this.renderOwnView();
    const weeks = view === "week" ? [this.weekOf(this.shownDay)] : monthWeeks(month, first, this.fixed);
    this.byDay = eventsByDay(this.events ?? [], weeks[0][0], weeks.at(-1)![6]);
    this.laidOut = new Map();
    // In view: the week's days, or the month's (the days around it are drawn only with outside-days).
    const inView = (day: Day) => view === "week" || sameMonth(day, month);
    const drawn = (day: Day) => inView(day) || this.outsideDays;
    // A week shows every event of each day: as many lines as its fullest day needs.
    const depth = view === "week"
      ? Math.max(this.eventLines, ...weekLines(weeks[0], this.byDay, 99).map(day => day.lines.length))
      : this.eventLines;
    for (const week of weeks) weekLines(week, this.byDay, depth, drawn).forEach((laid, column) => this.laidOut.set(week[column], laid));
    const tabDay = view === "week"
      ? [this.focusDay, this.chosen.start, this.todayDay].find(day => day && weeks[0].includes(day)) ?? weeks[0][0]
      : this.tabDay;
    // Heat is measured over the days of the month shown, so the neighbours' days never set its scale.
    this.heatByDay = this.heat ? heatLevels(new Map([...this.byDay].filter(([day]) => sameMonth(day, month))), this.heatMax) : new Map();
    // A compact month names its days in a letter (one square) or two (wider); a full month in short.
    const short = this.compact
      ? this.squaresPerDay < 2
        ? weekdayNames(first, "narrow")
        : weekdayNames(first, "short").map(name => (/^\p{Script=Latin}/u.test(name) ? name.replace(/\.$/, "").slice(0, 2) : name))
      : weekdayNames(first, "short");
    const long = weekdayNames(first, "long");
    // Inside a day's box the name is short where the day is three squares or more, and a letter where it is narrower.
    const inside = this.squaresPerDay >= 3 ? short : weekdayNames(first, "narrow");
    const today = this.todayDay;
    const todayColumn = drawn(today) && weeks.some(week => week.includes(today)) ? (weekdayOf(today) - first + 7) % 7 : -1;
    const swipes = !this.noHeader;
    return html`<div
      class="calendar"
      part="calendar"
      ?data-swipe=${swipes}
      @focusout=${this.onFocusOut}
      @pointerover=${this.onPointerOver}
      @pointerleave=${() => (this.hoverDay = undefined)}
      @pointerdown=${swipes ? this.onSwipeStart : nothing}
      @pointermove=${swipes ? this.onSwipeMove : nothing}
      @pointerup=${swipes ? this.onSwipeEnd : nothing}
      @pointercancel=${this.onSwipeCancel}
      @wheel=${swipes ? this.onSwipeWheel : nothing}
      @click=${{ handleEvent: this.onSwipeClick, capture: true }}
    >
      ${this.renderHeader()}
      ${this.level !== "days" && !this.noHeader ? this.renderPicks(weeks.length) : this.monthTrack(html`<div
        class="grid"
        part="grid"
        role="grid"
        data-view=${view}
        ?data-travel=${this.travelled}
        aria-label=${this.nameOr(view === "week" ? this.rangeTitle(weeks[0][0], weeks[0][6]) : monthTitle(month))}
        style=${view === "week" ? `--ds-calendar-lines: ${depth}` : nothing}
        aria-multiselectable=${this.selectable ? "true" : nothing}
        @keydown=${this.onKeyDown}
        @click=${this.onClick}
      >
        <div role="row" class="weekdays" part="weekdays">
          ${short.map((name, index) => html`<span role="columnheader" class="weekday" aria-label=${long[index]}>${name}</span>`)}
        </div>
        ${weeks.map((week, row) => html`<div role="row" class="week" part="week">${week.map((day, column) => this.renderDay(day, inView(day), tabDay, this.compact ? undefined : {
          // A full month names its days inside the first week's boxes, at their start, today's weekday in today's red.
          weekday: row === 0 ? inside[column] : undefined,
          today: row === 0 && todayColumn === column,
          // The week's number on its first day, counted from the week's middle so a week from Sunday takes its Monday's.
          week: this.weekNumbers && column === 0 && this.squaresPerDay >= 3 && week.some(drawn) ? isoWeek(addDays(day, 3)) : undefined,
        }))}</div>`)}
      </div>`)}
      ${this.renderClear()}
    </div>`;
  }

  private monthTrack(grid: unknown) {
    if (!this.compact || this.noHeader || this.level !== "days") return grid;
    const neighbour = (direction: -1 | 1) => html`<div class=${`month-neighbour ${direction < 0 ? "previous" : "next"}`} inert aria-hidden="true"><ds-calendar
      compact no-header no-today required .fixed=${this.fixed} .outsideDays=${this.outsideDays}
      .dayWidth=${this.dayWidth} .weekStart=${this.weekStart} .today=${this.today}
      .month=${addMonths(this.shownMonth, direction)} .value=${this.value}
      .selectable=${this.selectable} .events=${this.events}></ds-calendar></div>`;
    return html`<div class="month-swipe"><div class="month-track">${neighbour(-1)}${grid}${neighbour(1)}</div></div>`;
  }

  // The picker: a field that opens the small month.

  private pickerWords(value: string | undefined, fallback: string): string {
    if (value && this.literal) return value;
    return getText(value || fallback) || value || fallback;
  }

  private get trigger() {
    return this.renderRoot.querySelector<HTMLButtonElement>(".trigger");
  }

  private get panel() {
    return this.renderRoot.querySelector<HTMLElement>(".popover");
  }

  /** The small month inside the picker. */
  private get smallMonth() {
    return this.renderRoot.querySelector<Calendar>("ds-calendar");
  }

  private get ends() {
    return readDateValue(this.value);
  }

  /** Opens a picker's month. */
  show() {
    if (this.shown || !this.picker || this.disabled || !this.isConnected) return;
    const panel = this.panel;
    if (!panel) return;
    for (const other of openPickers) if (other !== this) other.open = false;
    openPickers.add(this);
    this.shown = true;
    this.open = true;
    const month = this.smallMonth;
    if (month) {
      month.month = (this.ends.start?.day || this.today || this.todayDay).slice(0, 7);
      // Each opening starts a new pick on the month's days: the first press is a first day.
      month.endPending = false;
      month.level = "days";
    }
    panel.showPopover?.();
    this.place();
    if (month) void month.updateComplete.then(this.place);
    this.ownerDocument.addEventListener("pointerdown", this.onOutside, true);
    this.ownerDocument.addEventListener("scroll", this.place, true);
    window.addEventListener("resize", this.place);
    this.dispatchEvent(new CustomEvent("ds-calendar-toggle", { bubbles: true, composed: true, detail: { open: true } }));
    if (this.focusMonth) void this.focusPickerDay();
  }

  /** Closes a picker's month, giving focus back to the field when it was inside. */
  hide(restore = true) {
    if (!this.shown) return;
    this.shown = false;
    openPickers.delete(this);
    const panel = this.panel;
    const within = panel?.matches(":focus-within");
    if (panel?.matches(":popover-open")) panel.hidePopover?.();
    this.ownerDocument.removeEventListener("pointerdown", this.onOutside, true);
    this.ownerDocument.removeEventListener("scroll", this.place, true);
    window.removeEventListener("resize", this.place);
    this.open = false;
    if (restore && within) this.trigger?.focus({ preventScroll: true });
    this.dispatchEvent(new CustomEvent("ds-calendar-toggle", { bubbles: true, composed: true, detail: { open: false } }));
  }

  private async focusPickerDay() {
    const month = this.smallMonth;
    if (!month) return;
    await month.updateComplete;
    month.renderRoot.querySelector<HTMLElement>('[data-day][tabindex="0"]')?.focus({ preventScroll: true });
  }

  /** Directly against the field, or above when there is more room there; held inside the screen. */
  private place = () => {
    const panel = this.panel, trigger = this.trigger;
    if (!this.shown || !panel || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const view = this.ownerDocument.defaultView!;
    const viewport = view.visualViewport;
    const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? view.innerWidth, height = viewport?.height ?? view.innerHeight;
    const box = panel.getBoundingClientRect();
    const gap = 0;
    // The face is one control high at the foot of its square: measure from that square.
    const square = Math.max(rect.height, gap * 2);
    const foot = rect.bottom, head = rect.bottom - square;
    const below = top + height - foot - 2 * gap, above = head - top - 2 * gap;
    const up = below < box.height && above > below;
    const x = getComputedStyle(this).direction === "rtl" ? rect.right - box.width : rect.left;
    panel.style.left = `${Math.max(left + gap, Math.min(x, left + width - gap - box.width))}px`;
    panel.style.top = `${Math.max(top + gap, up ? head - gap - box.height : foot + gap)}px`;
  };

  private onOutside = (event: Event) => {
    if (!event.composedPath().includes(this)) this.open = false;
  };

  private toggle = () => {
    if (this.disabled) return;
    this.focusMonth = false;
    this.open = !this.open;
  };

  private onTriggerKey = (event: KeyboardEvent) => {
    if (this.disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || ((event.key === "Enter" || event.key === " ") && !this.open)) {
      event.preventDefault();
      this.focusMonth = true;
      if (this.open) void this.focusPickerDay();
      else this.open = true;
    }
  };

  private onPanelKey = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault();
      event.stopPropagation();
      this.open = false;
    }
  };

  private onPanelFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (this.open && next instanceof Node && !this.contains(next) && !this.renderRoot.contains(next)) this.open = false;
  };

  /** Takes a new value and says so. */
  private commit(value: string) {
    const previous = this.value || "";
    if (value === previous) return;
    this.value = value;
    const { start, end } = readDateValue(value);
    const detail: CalendarChangeDetail = { value, previous, start: start?.day ?? "", end: end?.day ?? start?.day ?? "" };
    this.dispatchEvent(new CustomEvent("input", { bubbles: true, composed: true, detail }));
    this.dispatchEvent(new CustomEvent("change", { bubbles: true, composed: true, detail }));
  }

  private write(start: CalendarEnd | undefined, end: CalendarEnd | undefined) {
    this.commit(writeDateValue(start, end, { time: this.time }));
  }

  /**
   * A day pressed in the month. The first press of an opening is the value;
   * the second ends the range and, without times to set, closes the month.
   */
  private picked = (event: CustomEvent<CalendarChangeDetail>) => {
    event.stopPropagation();
    const { start, end } = this.ends;
    const first: CalendarEnd = { day: event.detail.start, time: start?.time || (this.time ? "09:00" : "") };
    if (!event.detail.end) {
      this.write(first, undefined);
      return;
    }
    const last: CalendarEnd = { day: event.detail.end, time: end?.time || (this.time ? "10:00" : "") };
    this.write(first, last);
    if (!this.time) this.open = false;
  };

  /** A day typed in a field, read when the person leaves it or presses Enter. */
  private typed(side: "start" | "end", input: HTMLInputElement) {
    const { start, end } = this.ends;
    const text = input.value.trim();
    if (!text) {
      if (side === "start") this.commit("");
      else this.write(start, undefined);
      return;
    }
    const day = parseTypedDay(text);
    if (!day) {
      input.value = this.fieldText(side === "start" ? start : end);
      return;
    }
    const current = side === "start" ? start : end;
    const next = { day, time: current?.time || (this.time ? (side === "start" ? "09:00" : "10:00") : "") };
    if (side === "start") this.write(next, end);
    else this.write(start ?? next, next);
    const month = this.smallMonth;
    if (month) month.month = day.slice(0, 7);
  }

  private timed(side: "start" | "end", input: HTMLInputElement) {
    const { start, end } = this.ends;
    const clock = TIME.test(input.value) ? input.value : "";
    if (side === "start" && start) this.write({ ...start, time: clock }, end);
    if (side === "end" && start) this.write(start, { day: (end ?? start).day, time: clock });
  }

  private setTime = () => {
    this.time = !this.time;
    const { start, end } = this.ends;
    const timed = (side: CalendarEnd | undefined, clock: string) => (side ? { ...side, time: this.time ? side.time || clock : "" } : undefined);
    this.write(timed(start, "09:00"), timed(end ?? (this.time ? start : undefined), "10:00"));
  };

  /** Pressing the switch's row presses the switch, as a label would. */
  private passPress = (event: MouseEvent) => {
    const row = event.currentTarget as HTMLElement;
    const control = row.querySelector<HTMLButtonElement>(".ds-switch");
    if (control && !event.composedPath().includes(control)) control.click();
  };


  private moment(side: CalendarEnd) {
    const [year, month, date] = side.day.split("-").map(Number);
    const [hours, minutes] = (side.time || "12:00").split(":").map(Number);
    return Date.UTC(year, month - 1, date, hours, minutes);
  }

  private formatter(withTime: boolean) {
    return dateFormatter({ dateStyle: this.length ?? "medium", ...(withTime ? { timeStyle: "short" } : {}), timeZone: "UTC" }) as Intl.DateTimeFormat & {
      formatRange?: (from: number, to: number) => string;
    };
  }

  private fieldText(side: CalendarEnd | undefined) {
    return side ? this.formatter(false).format(this.moment(side)) : "";
  }

  /** The face's words: one day, or a range written as the language writes one ("Oct 21 – 24, 2026"). */
  private faceText(): string {
    const { start, end } = this.ends;
    if (!start) return this.pickerWords(this.placeholder, "Choose a date");
    const formatter = this.formatter(Boolean(start.time || end?.time));
    if (!end) return formatter.format(this.moment(start));
    return formatter.formatRange ? formatter.formatRange(this.moment(start), this.moment(end)) : `${formatter.format(this.moment(start))} – ${formatter.format(this.moment(end))}`;
  }

  private renderEnd(side: "start" | "end", value: CalendarEnd | undefined, name: string) {
    const label = side === "start" ? name : `${name}, ${this.pickerWords(undefined, "End date")}`;
    return html`<div class="field-row" part="field">
        <input
          class="ds-input field"
          type="text"
          autocomplete="off"
          aria-label=${label}
          placeholder=${side === "start" ? this.pickerWords(this.placeholder, "Choose a date") : this.pickerWords(undefined, "End date")}
          .value=${this.fieldText(value)}
          @change=${(event: Event) => this.typed(side, event.target as HTMLInputElement)}
          @keydown=${(event: KeyboardEvent) => { if (event.key === "Enter") { event.preventDefault(); this.typed(side, event.target as HTMLInputElement); } }}
        />
      </div>
      ${this.time
        ? html`<div class="field-row" part="field">
            <input
              class="ds-input clock"
              type="time"
              aria-label=${`${label}, ${this.pickerWords(undefined, "Time")}`}
              .value=${value?.time ?? ""}
              ?disabled=${!this.ends.start}
              @change=${(event: Event) => this.timed(side, event.target as HTMLInputElement)}
            />
          </div>`
        : nothing}`;
  }

  private renderPicker() {
    const { start, end } = this.ends;
    const text = this.faceText();
    const name = this.label ? this.pickerWords(this.label, this.label) : this.pickerWords(undefined, "Date");
    const days = start ? (end ? `${start.day}/${end.day}` : start.day) : "";
    return html`<button
        class="ds-input trigger"
        part="trigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded=${String(this.open)}
        aria-label=${start ? `${name}, ${text}` : name}
        ?disabled=${this.disabled}
        ?data-empty=${!start}
        @click=${this.toggle}
        @keydown=${this.onTriggerKey}
      >
        <span class="text">${text}</span>
        <ds-icon class="arrow" type="chevron-down" size="large" aria-hidden="true"></ds-icon>
      </button>
      <div
        class="popover"
        part="popover"
        popover="manual"
        role="dialog"
        aria-label=${name}
        @keydown=${this.onPanelKey}
        @focusout=${this.onPanelFocusOut}
      >
        <div class="fields">
          ${this.renderEnd("start", start, name)}
          ${this.renderEnd("end", start ? end ?? start : undefined, name)}
        </div>
        <ds-calendar
          compact
          selectable
          fixed
          outside-days
          .embedded=${true}
          .value=${days}
          .min=${this.min}
          .max=${this.max}
          .weekStart=${this.weekStart}
          .today=${this.today}
          @change=${this.picked}
        ></ds-calendar>
        <div class="options" part="options">
          <div class="separator" aria-hidden="true"></div>
          <div class="option" @click=${this.passPress}>
            <span>${this.pickerWords(undefined, "Include time")}</span>
            <button class="ds-switch" type="button" role="switch" aria-label=${this.pickerWords(undefined, "Include time")} aria-checked=${String(this.time)} @click=${this.setTime}></button>
          </div>
          ${this.required
            ? nothing
            : html`<div class="separator" aria-hidden="true"></div>
                <button class="option clear" part="clear" type="button" ?disabled=${!start} @click=${() => this.clear()}>${this.pickerWords(undefined, "Clear")}</button>`}
        </div>
      </div>`;
  }
}

define("ds-calendar", Calendar);

declare global {
  interface HTMLElementTagNameMap {
    "ds-calendar": Calendar;
  }
}
