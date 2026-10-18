// calendar-base.ts
// What ds-calendar and ds-calendar-large share: the days a person may reach,
// today, the selected day, the week's start, events, words in the current
// language and the grid's keys. Each element draws its own grid; the month
// calendar lays weeks in rows, the large calendar weeks in columns, and the
// keys follow the drawing.

import { LitElement, type PropertyValues } from "lit";
import { getText } from "../0-face/i18n";
import {
  addDays,
  addMonths,
  clampDay,
  dayLabel,
  firstWeekday,
  isDay,
  readWeekday,
  today,
  weekdayOf,
  type CalendarEvent,
  type Day,
  type Weekday,
} from "../0-face/calendar";

export type { CalendarEvent, Day } from "../0-face/calendar";

/** Detail of `day-press`: the day and the events on it. Cancel it to keep a selectable calendar's value. */
export interface CalendarDayDetail {
  day: Day;
  events: CalendarEvent[];
}

/** Detail of `event-press`: the event and the day it was pressed on. */
export interface CalendarEventDetail {
  event: CalendarEvent;
  day: Day;
}

/** Detail of `change`: the day a person chose and the one before it. */
export interface CalendarChangeDetail {
  value: Day;
  previous: Day;
}

/** Detail of `navigate`: the first month now shown, `YYYY-MM`. */
export interface CalendarNavigateDetail {
  month: string;
}

/** A month written `YYYY-MM` or a day in it, as the first of that month; `null` for anything else. */
export function readMonth(value: string | null | undefined): Day | null {
  const text = value?.trim() ?? "";
  const day = /^\d{4}-\d{2}$/.test(text) ? `${text}-01` : text;
  return isDay(day) ? `${day.slice(0, 8)}01` : null;
}

export abstract class CalendarBase extends LitElement {
  static properties = {
    value: { type: String, reflect: true },
    min: { type: String },
    max: { type: String },
    today: { type: String },
    weekStart: { type: String, attribute: "week-start" },
    selectable: { type: Boolean, reflect: true },
    label: { type: String },
    literal: { type: Boolean, reflect: true },
    events: { attribute: false },
    focusDay: { state: true },
  };

  /** The selected day, `YYYY-MM-DD`; empty for none. */
  declare value: string;
  /** The first day a person may choose. */
  declare min: string | undefined;
  /** The last day a person may choose. */
  declare max: string | undefined;
  /** The day drawn as today; the reader's own today when left out. */
  declare today: string | undefined;
  /** The first day of the week: `0`–`6` from Sunday, or a day's English name; the language's own when left out. */
  declare weekStart: string | undefined;
  /** Pressing a day selects it and fires `change`. */
  declare selectable: boolean;
  /** The grid's name: a translation key, or literal words. The month's name when left out. */
  declare label: string | undefined;
  /** Show `label` as written, never looked up. */
  declare literal: boolean;
  /** What happens on the days. */
  declare events: CalendarEvent[];
  /** The day that holds the grid's one Tab stop. */
  declare focusDay: Day | undefined;

  /** Weeks run along rows (a month) or along columns (the large calendar). */
  protected abstract readonly weeksRun: "rows" | "columns";

  private readonly relabel = () => this.requestUpdate();

  constructor() {
    super();
    this.value = "";
    this.selectable = false;
    this.literal = false;
    this.events = [];
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("language-changed", this.relabel);
    window.addEventListener("translations-loaded", this.relabel);
  }

  disconnectedCallback() {
    window.removeEventListener("language-changed", this.relabel);
    window.removeEventListener("translations-loaded", this.relabel);
    super.disconnectedCallback();
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("value") && this.value && !isDay(this.value)) this.value = "";
  }

  /** Shared words, filled in: `words("Week {week}", { week: 42 })`. */
  protected words(key: string, params?: Record<string, string | number>): string {
    const text = getText(key, params) || key;
    return params ? text.replace(/\{\{?(\w+)\}?\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole)) : text;
  }

  /** The page's name for the grid, or `fallback`. */
  protected nameOr(fallback: string): string {
    if (!this.label) return fallback;
    return this.literal ? this.label : getText(this.label) || this.label;
  }

  protected get firstDay(): Weekday {
    return readWeekday(this.weekStart) ?? firstWeekday();
  }

  protected get todayDay(): Day {
    return isDay(this.today) ? this.today : today();
  }

  protected get minDay(): Day | undefined {
    return isDay(this.min) ? this.min : undefined;
  }

  protected get maxDay(): Day | undefined {
    return isDay(this.max) ? this.max : undefined;
  }

  /** Whether a person may choose the day. */
  protected allowed(day: Day): boolean {
    return clampDay(day, this.minDay, this.maxDay) === day;
  }

  /** What a day's cell is called: the whole date, then what is on it. */
  protected cellLabel(day: Day, events: readonly CalendarEvent[]): string {
    return [dayLabel(day), ...events.map(event => (event.time ? `${event.time} ${event.title}` : event.title))].join(", ");
  }

  /** The day a key moves to from `from`, or `null` for a key the grid leaves alone. */
  protected keyTarget(event: KeyboardEvent, from: Day): Day | null {
    const rtl = getComputedStyle(this).direction === "rtl";
    const across = this.weeksRun === "rows" ? 1 : 7;
    const down = this.weeksRun === "rows" ? 7 : 1;
    const start = (weekdayOf(from) - this.firstDay + 7) % 7;
    switch (event.key) {
      case "ArrowRight": return addDays(from, rtl ? -across : across);
      case "ArrowLeft": return addDays(from, rtl ? across : -across);
      case "ArrowDown": return addDays(from, down);
      case "ArrowUp": return addDays(from, -down);
      case "Home": return addDays(from, -start);
      case "End": return addDays(from, 6 - start);
      case "PageUp": return addMonths(from, event.shiftKey ? -12 : -1);
      case "PageDown": return addMonths(from, event.shiftKey ? 12 : 1);
      default: return null;
    }
  }

  /** The events a day holds, for `day-press`. */
  protected abstract eventsOn(day: Day): CalendarEvent[];

  /**
   * A person pressed a day: `day-press` fires, and unless it is cancelled a
   * selectable calendar takes the day and fires `change`.
   */
  protected press(day: Day) {
    const pressed = new CustomEvent<CalendarDayDetail>("day-press", {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { day, events: this.eventsOn(day) },
    });
    if (!this.dispatchEvent(pressed) || !this.selectable || !this.allowed(day) || day === this.value) return;
    const previous = (this.value || "") as Day;
    this.value = day;
    this.focusDay = day;
    this.dispatchEvent(new CustomEvent<CalendarChangeDetail>("change", { bubbles: true, composed: true, detail: { value: day, previous } }));
  }

  protected pressEvent(event: CalendarEvent, day: Day) {
    this.dispatchEvent(new CustomEvent<CalendarEventDetail>("event-press", { bubbles: true, composed: true, detail: { event, day } }));
  }

  protected announceMonth(month: Day) {
    this.dispatchEvent(new CustomEvent<CalendarNavigateDetail>("navigate", { bubbles: true, composed: true, detail: { month: month.slice(0, 7) } }));
  }

  /** Puts keyboard focus on a drawn day once the grid has drawn it. */
  protected async focusCell(day: Day) {
    this.focusDay = day;
    await this.updateComplete;
    const cell = this.renderRoot.querySelector<HTMLElement>(`[data-day="${day}"]`);
    cell?.focus({ preventScroll: true });
    cell?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }
}
