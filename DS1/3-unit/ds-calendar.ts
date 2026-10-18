// ds-calendar.ts
// A month on whole squares: seven days across, a week to a row. By default a
// day is four squares wide and four high (its date on the first square, two
// lines of events, one square to spare), drawn in hairline boxes. `compact`
// makes a day one square: the small month a date picker opens and a year is
// drawn from.

import { html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { define } from "../0-face/define";
import {
  addMonths,
  dateNumber,
  eventsByDay,
  isoWeek,
  monthTitle,
  monthWeeks,
  sameMonth,
  startOfMonth,
  weekdayNames,
  type CalendarEvent,
  type Day,
} from "../0-face/calendar";
import { CalendarBase, readMonth, readRange } from "./calendar-base";
import "../2-core/ds-icon";
import metrics from "../1-root/component-metrics.css?inline";
import controls from "../1-root/controls.css?inline";
import styles from "./styles/ds-calendar.css?inline";

export * from "./calendar-base";

const whole = (value: number | undefined, least: number, most: number, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(least, Math.min(most, Math.floor(value))) : fallback;

/**
 * @element ds-calendar
 * @prop {string} month - The month shown, `YYYY-MM` (or a day in it). The
 *   selected day's month, or today's, when left out; the arrows change it.
 * @prop {string} value - The selected day, `YYYY-MM-DD`.
 * @prop {boolean} selectable - Pressing a day selects it and fires `change`.
 * @prop {boolean} compact - One square per day, no events written out: the
 *   small month.
 * @prop {number} dayWidth - Squares per day (`day-width`): 4 by default, 1
 *   when compact.
 * @prop {number} lines - Lines of events under a day's date: 2 by default.
 * @prop {boolean} weekNumbers - Write the week's number (`week-numbers`) on
 *   its first day.
 * @prop {boolean} fixed - Always draw six weeks, so the month keeps its height.
 * @prop {boolean} outsideDays - Draw the days of the months before and after
 *   in the title grey (`outside-days`); pressing one moves there.
 * @prop {boolean} range - A selectable calendar chooses a first and a last
 *   day; `value` is then `YYYY-MM-DD/YYYY-MM-DD`.
 * @prop {boolean} noHeader - Leave out the title and arrows (`no-header`).
 * @prop {boolean} noToday - Leave out the Today button (`no-today`).
 * @prop {string} min - The first day a person may choose.
 * @prop {string} max - The last day a person may choose.
 * @prop {string} weekStart - The week's first day (`week-start`), 0–6 from
 *   Sunday or its English name; the language's own by default.
 * @prop {string} today - The day drawn as today; the reader's own by default.
 * @prop {CalendarEvent[]} events - What happens on the days (property only).
 *
 * @fires day-press - A day was pressed or chosen with Enter or Space;
 *   `{ day, events }`. Cancelable: cancelled, a selectable calendar keeps its value.
 * @fires change - A person selected a day; `{ value, previous }`.
 * @fires event-press - An event was pressed; `{ event, day }`.
 * @fires navigate - A person moved to another month; `{ month }`.
 *
 * @example
 * <ds-calendar month="2026-10" week-numbers></ds-calendar>
 * <ds-calendar compact selectable value="2026-10-18"></ds-calendar>
 * <ds-calendar compact selectable range value="2026-10-18/2026-10-24"></ds-calendar>
 */
export class Calendar extends CalendarBase {
  static properties = {
    ...CalendarBase.properties,
    month: { type: String, reflect: true },
    compact: { type: Boolean, reflect: true },
    dayWidth: { type: Number, attribute: "day-width" },
    lines: { type: Number },
    weekNumbers: { type: Boolean, attribute: "week-numbers", reflect: true },
    fixed: { type: Boolean, reflect: true },
    outsideDays: { type: Boolean, attribute: "outside-days", reflect: true },
    noHeader: { type: Boolean, attribute: "no-header", reflect: true },
    noToday: { type: Boolean, attribute: "no-today", reflect: true },
    open: { state: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(controls), unsafeCSS(styles)];

  declare month: string | undefined;
  declare compact: boolean;
  declare dayWidth: number | undefined;
  declare lines: number | undefined;
  declare weekNumbers: boolean;
  declare fixed: boolean;
  declare outsideDays: boolean;
  declare noHeader: boolean;
  declare noToday: boolean;
  /** The day whose hidden events are unfolded. */
  declare open: Day | undefined;

  protected readonly weeksRun = "rows" as const;

  private byDay = new Map<Day, CalendarEvent[]>();

  constructor() {
    super();
    this.compact = false;
    this.weekNumbers = false;
    this.fixed = false;
    this.outsideDays = false;
    this.noHeader = false;
    this.noToday = false;
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

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.style.setProperty("--ds-calendar-day-squares", String(this.squaresPerDay));
    this.style.setProperty("--ds-calendar-lines", String(this.eventLines));
    // A compact month with events writes the days without any fainter.
    this.toggleAttribute("data-events", (this.events ?? []).length > 0);
    this.toggleAttribute("data-roomy", this.squaresPerDay >= 2);
  }

  /** Shows another month and says so with `navigate`. */
  showMonth(month: string, announce = false) {
    const first = readMonth(month);
    if (!first || first === this.shownMonth) return;
    this.month = first.slice(0, 7);
    this.open = undefined;
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
    this.showMonth(this.todayDay, true);
    this.focusDay = this.todayDay;
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
    if (event.key === "Escape" && this.open) {
      event.stopPropagation();
      this.open = undefined;
      return;
    }
    const target = this.keyTarget(event, day);
    if (!target) return;
    event.preventDefault();
    if (!sameMonth(target, this.shownMonth)) this.showMonth(target, true);
    void this.focusCell(target);
  };

  private onClick = (event: MouseEvent) => {
    const path = event.composedPath() as HTMLElement[];
    const find = (selector: string) => path.find(node => node instanceof HTMLElement && node.matches(selector));
    const cell = find("[data-day]");
    if (!cell) return;
    const day = cell.dataset.day as Day;
    const more = find("[data-more]");
    if (more) {
      this.open = this.open === day ? undefined : day;
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
    if (!sameMonth(day, this.shownMonth)) this.showMonth(day, true);
  };

  /** While a range waits for its end, the day under the pointer previews it. */
  private onPointerOver = (event: PointerEvent) => {
    if (!this.range || !this.selectable) return;
    const { start, end } = readRange(this.value);
    if (!start || end) return;
    const cell = (event.composedPath() as HTMLElement[]).find(node => node instanceof HTMLElement && node.dataset?.day);
    const day = cell?.dataset.day as Day | undefined;
    if (day !== this.hoverDay && (!day || this.allowed(day))) this.hoverDay = day;
  };

  private onFocusOut = (event: FocusEvent) => {
    if (this.open && !(event.relatedTarget instanceof Node && this.renderRoot.contains(event.relatedTarget))) this.open = undefined;
  };

  private renderHeader() {
    if (this.noHeader) return nothing;
    const month = this.shownMonth;
    const min = this.minDay, max = this.maxDay;
    const before = Boolean(min && addMonths(month, -1).slice(0, 7) < min.slice(0, 7));
    const after = Boolean(max && addMonths(month, 1).slice(0, 7) > max.slice(0, 7));
    const arrow = (which: "previous" | "next") => html`<button
      class="ds-button ds-button--icon nav"
      part=${which}
      type="button"
      aria-label=${this.words(which === "previous" ? "Previous month" : "Next month")}
      ?disabled=${which === "previous" ? before : after}
      @click=${() => (which === "previous" ? this.previousMonth() : this.nextMonth())}
    ><ds-icon type=${which === "previous" ? "chevron-left" : "chevron-right"} size="large" aria-hidden="true"></ds-icon></button>`;
    const title = monthTitle(month, this.compact ? "short" : "long");
    return html`<div class="header" part="header">
      <span class="title" id="title" aria-live="polite">${title}</span>
      <span class="controls">
        ${this.noToday || this.squaresPerDay < 2 ? nothing : html`<button class="ds-button today-button" part="today" type="button" @click=${() => this.showToday()}>${this.words("Today")}</button>`}
        ${arrow("previous")}
        ${arrow("next")}
      </span>
    </div>`;
  }

  private renderDay(day: Day, column: number) {
    const month = this.shownMonth;
    const outside = !sameMonth(day, month);
    if (outside && !this.outsideDays) return html`<div role="gridcell" class="day outside" part="day outside"></div>`;
    const events = this.eventsOn(day);
    const lines = this.eventLines;
    const isToday = day === this.todayDay;
    const { selected, inside, first, last } = this.selection(day);
    const allowed = this.allowed(day);
    const unfolded = this.open === day;
    const shown = unfolded || events.length <= lines ? events : events.slice(0, Math.max(0, lines - 1));
    const hidden = events.length - shown.length;
    const parts = ["day", isToday ? "today" : "", selected ? "selected" : ""].filter(Boolean).join(" ");
    return html`<div
      role="gridcell"
      class="day"
      part=${parts}
      data-day=${day}
      tabindex=${!outside && day === this.tabDay ? 0 : -1}
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
      ?data-open=${unfolded}
    >
      <span class="date-line" aria-hidden="true">
        ${this.weekNumbers && column === 0 && !this.compact ? html`<span class="week-number">${this.words("W{week}", { week: isoWeek(day) })}</span>` : nothing}
        <span class="date">${dateNumber(day)}</span>
      </span>
      ${lines > 0 && events.length
        ? html`<span class="events" aria-hidden="true">
            ${shown.map(event => html`<span
              class="event"
              part="event"
              data-event=${events.indexOf(event)}
              style=${event.color ? `--ds-calendar-event-fill: ${event.color}; --ds-calendar-event-ink: var(--ds-slate)` : nothing}
            >${event.time ? html`<span class="time">${event.time}</span>` : nothing}<span class="name">${event.title}</span></span>`)}
            ${hidden > 0 && !unfolded ? html`<span class="more" part="more" data-more>+${hidden}</span>` : nothing}
          </span>`
        : nothing}
    </div>`;
  }

  render() {
    const month = this.shownMonth;
    const first = this.firstDay;
    const weeks = monthWeeks(month, first, this.fixed);
    this.byDay = eventsByDay(this.events ?? [], weeks[0][0], weeks.at(-1)![6]);
    // A compact month names its days in a letter (one square) or two (wider); a full month in short.
    const short = this.compact
      ? this.squaresPerDay < 2
        ? weekdayNames(first, "narrow")
        : weekdayNames(first, "short").map(name => (/^\p{Script=Latin}/u.test(name) ? name.replace(/\.$/, "").slice(0, 2) : name))
      : weekdayNames(first, "short");
    const long = weekdayNames(first, "long");
    return html`<div class="calendar" part="calendar" @focusout=${this.onFocusOut} @pointerover=${this.onPointerOver} @pointerleave=${() => (this.hoverDay = undefined)}>
      ${this.renderHeader()}
      <div
        class="grid"
        part="grid"
        role="grid"
        aria-label=${this.nameOr(monthTitle(month))}
        aria-multiselectable=${this.selectable ? String(this.range) : nothing}
        @keydown=${this.onKeyDown}
        @click=${this.onClick}
      >
        <div role="row" class="weekdays" part="weekdays">
          ${short.map((name, index) => html`<span role="columnheader" class="weekday" aria-label=${long[index]}>${name}</span>`)}
        </div>
        ${weeks.map(week => html`<div role="row" class="week" part="week">${week.map((day, column) => this.renderDay(day, column))}</div>`)}
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
