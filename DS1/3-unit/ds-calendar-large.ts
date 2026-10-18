// ds-calendar-large.ts
// Months side by side as squares: a week to a column, the seven days down it,
// drawn one and a half times the grid (a square of 30px, lines of 1.5px)
// inside a rounded frame that scrolls sideways. A day on which something
// happens is filled with its colour, split into bands when several share it;
// a date is written only on today and where an event starts or ends.

import { html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { define } from "../0-face/define";
import {
  addDays,
  addMonths,
  dateNumber,
  eventsByDay,
  monthName,
  monthTitle,
  startOfMonth,
  weekdayNames,
  weekdayOf,
  type CalendarEvent,
  type Day,
} from "../0-face/calendar";
import { CalendarBase, readMonth } from "./calendar-base";
import "../2-core/ds-icon";
import metrics from "../1-root/component-metrics.css?inline";
import controls from "../1-root/controls.css?inline";
import styles from "./styles/ds-calendar-large.css?inline";

export * from "./calendar-base";

/** The fill for a day: one colour, or bands side by side. */
function fillOf(events: readonly CalendarEvent[]): string | undefined {
  if (!events.length) return undefined;
  const colours = [...new Set(events.map(event => event.color || "var(--ds-calendar-event-fill)"))];
  if (colours.length === 1) return colours[0];
  const share = 100 / colours.length;
  return `linear-gradient(90deg, ${colours.map((colour, index) => `${colour} ${index * share}% ${(index + 1) * share}%`).join(", ")})`;
}

/**
 * @element ds-calendar-large
 * @prop {string} start - The first month drawn, `YYYY-MM`; the month before
 *   today's by default.
 * @prop {number} months - How many months are drawn: 6 by default.
 * @prop {number} scale - How many times the grid it is drawn: 1.5 by default.
 * @prop {string} value - The selected day, `YYYY-MM-DD`.
 * @prop {boolean} selectable - Pressing a day selects it and fires `change`.
 * @prop {boolean} noHeader - Leave out the title and arrows (`no-header`).
 * @prop {string} min - The first day a person may choose.
 * @prop {string} max - The last day a person may choose.
 * @prop {string} weekStart - The week's first day (`week-start`); the
 *   language's own by default.
 * @prop {string} today - The day drawn as today; the reader's own by default.
 * @prop {CalendarEvent[]} events - What happens on the days (property only).
 *
 * @fires day-press - A day was pressed or chosen with Enter or Space; `{ day, events }`.
 * @fires change - A person selected a day; `{ value, previous }`.
 * @fires navigate - The months drawn moved on or back; `{ month }`, the first one.
 *
 * @example
 * <ds-calendar-large start="2026-09" months="6"></ds-calendar-large>
 */
export class CalendarLarge extends CalendarBase {
  static properties = {
    ...CalendarBase.properties,
    start: { type: String, reflect: true },
    months: { type: Number },
    scale: { type: Number },
    noHeader: { type: Boolean, attribute: "no-header", reflect: true },
    visible: { state: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(controls), unsafeCSS(styles)];

  declare start: string | undefined;
  declare months: number | undefined;
  declare scale: number | undefined;
  declare noHeader: boolean;
  /** The month at the start of the view, named in the title. */
  declare visible: Day | undefined;

  protected readonly weeksRun = "columns" as const;

  private byDay = new Map<Day, CalendarEvent[]>();
  private placed = false;
  private frame = 0;

  constructor() {
    super();
    this.noHeader = false;
  }

  /** The first of the first month drawn. */
  get firstMonth(): Day {
    return readMonth(this.start) ?? addMonths(startOfMonth(this.todayDay), -1);
  }

  private get monthCount() {
    const count = this.months;
    return typeof count === "number" && Number.isFinite(count) ? Math.max(1, Math.min(36, Math.floor(count))) : 6;
  }

  /** The first day of each week drawn, from the week holding the first month's first day. */
  private get weekStarts(): Day[] {
    const first = this.firstMonth;
    const from = addDays(first, -((weekdayOf(first) - this.firstDay + 7) % 7));
    const last = addDays(addMonths(first, this.monthCount), -1);
    const weeks: Day[] = [];
    for (let day = from; day <= last; day = addDays(day, 7)) weeks.push(day);
    return weeks;
  }

  private get lastDay(): Day {
    return addDays(this.weekStarts.at(-1)!, 6);
  }

  protected eventsOn(day: Day): CalendarEvent[] {
    return this.byDay.get(day) ?? [];
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const scale = typeof this.scale === "number" && Number.isFinite(this.scale) && this.scale > 0 ? this.scale : 1.5;
    this.style.setProperty("--ds-calendar-scale", String(scale));
  }

  protected firstUpdated() {
    // Open on today's month when it is drawn, else on the first.
    const today = this.todayDay;
    this.scrollToDay(today >= this.weekStarts[0] && today <= this.lastDay ? startOfMonth(today) : this.firstMonth, false);
    this.placed = true;
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.frame);
    super.disconnectedCallback();
  }

  private get scroller() {
    return this.renderRoot.querySelector<HTMLElement>(".scroller");
  }

  private columnOf(day: Day): number {
    return this.weekStarts.findIndex(start => day >= start && day <= addDays(start, 6));
  }

  /** Scrolls the week holding `day` to the start of the view. */
  scrollToDay(day: Day, smooth = true) {
    const scroller = this.scroller;
    const column = this.columnOf(day);
    if (!scroller || column < 0) return;
    const cell = scroller.querySelector<HTMLElement>(".cell")?.getBoundingClientRect().width ?? 30;
    const reduce = matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const rtl = getComputedStyle(this).direction === "rtl";
    scroller.scrollTo({ left: (rtl ? -1 : 1) * column * cell, behavior: smooth && !reduce ? "smooth" : "auto" });
    this.visible = startOfMonth(day);
  }

  /** Moves the view a month back or on; past the months drawn, the months move with it. */
  private step(by: -1 | 1) {
    const target = addMonths(this.visible ?? this.firstMonth, by);
    const first = this.firstMonth;
    const end = addMonths(first, this.monthCount);
    if (target < first || target >= end) {
      this.start = addMonths(first, by).slice(0, 7);
      this.announceMonth(addMonths(first, by));
      void this.updateComplete.then(() => this.scrollToDay(target, false));
      return;
    }
    this.scrollToDay(target);
  }

  /** The month before, as the previous arrow does. */
  previousMonth() { this.step(-1); }

  /** The month after, as the next arrow does. */
  nextMonth() { this.step(1); }

  /** Brings today into view, moving the months drawn when it is outside them. */
  showToday() {
    const today = this.todayDay;
    if (today < this.weekStarts[0] || today > this.lastDay) {
      const first = addMonths(startOfMonth(today), -1);
      this.start = first.slice(0, 7);
      this.announceMonth(first);
      void this.updateComplete.then(() => this.scrollToDay(startOfMonth(today), false));
    } else {
      this.scrollToDay(startOfMonth(today));
    }
    this.focusDay = today;
  }

  private onScroll = () => {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      const scroller = this.scroller;
      const cell = scroller?.querySelector<HTMLElement>(".cell")?.getBoundingClientRect().width;
      if (!scroller || !cell) return;
      const column = Math.min(this.weekStarts.length - 1, Math.max(0, Math.round(Math.abs(scroller.scrollLeft) / cell)));
      // The month that owns most of the first week in view.
      this.visible = startOfMonth(addDays(this.weekStarts[column], 3));
    });
  };

  private get tabDay(): Day {
    const first = this.weekStarts[0], last = this.lastDay;
    for (const day of [this.focusDay, this.value, this.todayDay]) if (day && day >= first && day <= last) return day;
    return this.firstMonth;
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
    const target = this.keyTarget(event, day);
    if (!target) return;
    event.preventDefault();
    if (target < this.weekStarts[0] || target > this.lastDay) {
      const by = target < this.weekStarts[0] ? -1 : 1;
      const first = addMonths(this.firstMonth, by);
      this.start = first.slice(0, 7);
      this.announceMonth(first);
    }
    void this.focusCell(target);
  };

  private onClick = (event: MouseEvent) => {
    const cell = (event.composedPath() as HTMLElement[]).find(node => node instanceof HTMLElement && node.dataset?.day);
    if (!cell) return;
    const day = cell.dataset.day as Day;
    this.focusDay = day;
    this.press(day);
  };

  private renderHeader() {
    if (this.noHeader) return nothing;
    const arrow = (which: "previous" | "next") => html`<button
      class="ds-button ds-button--icon nav"
      part=${which}
      type="button"
      aria-label=${this.words(which === "previous" ? "Previous month" : "Next month")}
      @click=${() => (which === "previous" ? this.previousMonth() : this.nextMonth())}
    ><ds-icon type=${which === "previous" ? "left" : "right"} aria-hidden="true"></ds-icon></button>`;
    return html`<div class="header" part="header">
      <span class="title" aria-live="polite">${monthTitle(this.visible ?? this.firstMonth)}</span>
      <span class="controls">
        ${arrow("previous")}
        <button class="ds-button ds-button--secondary" part="today" type="button" @click=${() => this.showToday()}>${this.words("Today")}</button>
        ${arrow("next")}
      </span>
    </div>`;
  }

  render() {
    const weeks = this.weekStarts;
    const first = weeks[0], last = this.lastDay;
    this.byDay = eventsByDay(this.events ?? [], first, last);
    const short = weekdayNames(this.firstDay, "short");
    const narrow = weekdayNames(this.firstDay, "narrow");
    const long = weekdayNames(this.firstDay, "long");
    const today = this.todayDay;
    const tab = this.tabDay;
    // Each month's name stands over the week holding its first day.
    const labels: { column: number; span: number; day: Day }[] = [];
    for (let month = this.firstMonth, index = 0; index < this.monthCount; index++, month = addMonths(month, 1)) {
      const column = this.columnOf(month);
      const next = this.columnOf(addMonths(month, 1));
      labels.push({ column, span: Math.max(1, (next < 0 ? weeks.length : next) - column), day: month });
    }
    const ends = new Set<Day>();
    for (const event of this.events ?? []) {
      ends.add(event.start);
      if (event.end) ends.add(event.end);
    }
    return html`<div class="calendar" part="calendar" style=${`--ds-calendar-weeks: ${weeks.length}`}>
      ${this.renderHeader()}
      <div class="body">
        <div class="rail" part="weekdays" aria-hidden="true">
          ${short.map((name, row) => html`<span class="weekday" data-narrow=${narrow[row]}>${row % 2 === 1 ? name : ""}</span>`)}
        </div>
        <div class="scroller" part="scroller" @scroll=${this.onScroll}>
          <div class="months" aria-hidden="true">
            ${labels.map(({ column, span, day }) => html`<span class="month" style=${`grid-column: ${column + 1} / span ${span}`}>${
              day.slice(5, 7) === "01" || day === this.firstMonth ? monthTitle(day, "short") : monthName(day, "short")
            }</span>`)}
          </div>
          <div class="frame" part="frame">
            <div
              class="grid"
              part="grid"
              role="grid"
              aria-label=${this.nameOr(`${monthTitle(this.firstMonth)} – ${monthTitle(addMonths(this.firstMonth, this.monthCount - 1))}`)}
              @keydown=${this.onKeyDown}
              @click=${this.onClick}
            >
              ${short.map((_, row) => html`<div role="row" class="row">
                <span role="rowheader" class="hidden">${long[row]}</span>
                ${weeks.map((start, column) => {
                  const day = addDays(start, row);
                  const events = this.eventsOn(day);
                  const isToday = day === today;
                  const selected = day === this.value;
                  const written = isToday || selected || (events.length > 0 && ends.has(day));
                  const fill = fillOf(events);
                  return html`<div
                    role="gridcell"
                    class="cell"
                    part=${["cell", isToday ? "today" : "", selected ? "selected" : "", events.length ? "filled" : ""].filter(Boolean).join(" ")}
                    data-day=${day}
                    tabindex=${day === tab ? 0 : -1}
                    aria-label=${this.cellLabel(day, events)}
                    aria-selected=${this.selectable ? String(selected) : nothing}
                    aria-current=${isToday ? "date" : nothing}
                    aria-disabled=${this.allowed(day) ? nothing : "true"}
                    ?data-today=${isToday}
                    ?data-selected=${selected}
                    ?data-filled=${events.length > 0}
                    ?data-first-row=${row === 0}
                    ?data-first-column=${column === 0}
                    style=${`grid-row: ${row + 1}; grid-column: ${column + 1};${fill ? ` --ds-calendar-cell-fill: ${fill};` : ""}`}
                  >${written ? html`<span class="date" aria-hidden="true">${dateNumber(day)}</span>` : nothing}</div>`;
                })}
              </div>`)}
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (this.placed && changed.has("start") && this.visible && !this.focusDay) this.scrollToDay(this.visible, false);
  }
}

define("ds-calendar-large", CalendarLarge);

declare global {
  interface HTMLElementTagNameMap {
    "ds-calendar-large": CalendarLarge;
  }
}
