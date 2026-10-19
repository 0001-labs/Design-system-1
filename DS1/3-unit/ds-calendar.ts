// ds-calendar.ts
// A month on whole squares: seven days across, a week to a row. By default a
// day is four squares wide and four high (its date on the first square, two
// lines of events, one square to spare), drawn in hairline boxes. `compact`
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
import { getText } from "../0-face/i18n";
import { dateFormatter, type DateLength } from "../0-face/format";
import {
  addMonths,
  dateNumber,
  dayOf,
  eventsByDay,
  isDay,
  isoWeek,
  monthTitle,
  monthWeeks,
  sameMonth,
  startOfMonth,
  weekdayNames,
  type CalendarEvent,
  type Day,
} from "../0-face/calendar";
import { CalendarBase, readMonth, readRange, type CalendarChangeDetail } from "./calendar-base";
import "../2-core/ds-icon";
import metrics from "../1-root/component-metrics.css?inline";
import controls from "../1-root/controls.css?inline";
import styles from "./styles/ds-calendar.css?inline";

export * from "./calendar-base";

const whole = (value: number | undefined, least: number, most: number, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(least, Math.min(most, Math.floor(value))) : fallback;

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
 * @prop {number} lines - Lines of events under a day's date: 2 by default.
 * @prop {boolean} weekNumbers - Write the week's number (`week-numbers`) on
 *   its first day.
 * @prop {boolean} fixed - Always draw six weeks, so the month keeps its height.
 * @prop {boolean} outsideDays - Draw the days of the months before and after
 *   in the title grey (`outside-days`); pressing one moves there.
 * @prop {boolean} noHeader - Leave out the title and arrows (`no-header`).
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
 * @prop {boolean} required - A form needs a value; a picker leaves Clear out.
 * @prop {boolean} disabled - A picker cannot be opened.
 * @prop {boolean} open - A picker's month is open.
 * @prop {CalendarEvent[]} events - What happens on the days (property only).
 *
 * @fires day-press - A day was pressed or chosen with Enter or Space;
 *   `{ day, events }`. Cancelable: cancelled, a selectable calendar keeps its value.
 * @fires change - A person selected a day or ended a range;
 *   `{ value, previous, start, end }`, `end` empty while it is still to come.
 * @fires input - A picker's value changed, the same moment as `change`.
 * @fires event-press - An event was pressed; `{ event, day }`.
 * @fires navigate - A person moved to another month; `{ month }`.
 * @fires ds-calendar-toggle - A picker's month opened or closed; `{ open }`.
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
    fixed: { type: Boolean, reflect: true },
    outsideDays: { type: Boolean, attribute: "outside-days", reflect: true },
    noHeader: { type: Boolean, attribute: "no-header", reflect: true },
    noToday: { type: Boolean, attribute: "no-today", reflect: true },
    picker: { type: Boolean, reflect: true },
    name: { type: String, reflect: true },
    placeholder: { type: String },
    length: { type: String },
    time: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
    unfolded: { state: true },
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

  protected readonly weeksRun = "rows" as const;

  private byDay = new Map<Day, CalendarEvent[]>();
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
    this.fixed = false;
    this.outsideDays = false;
    this.noHeader = false;
    this.noToday = false;
    this.picker = false;
    this.time = false;
    this.required = false;
    this.disabled = false;
    this.open = false;
  }

  disconnectedCallback() {
    this.hide(false);
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
    if (event.key === "Escape" && this.unfolded) {
      event.stopPropagation();
      this.unfolded = undefined;
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
    if (!sameMonth(day, this.shownMonth)) this.showMonth(day, true);
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
    const unfolded = this.unfolded === day;
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
    if (this.picker) return this.renderPicker();
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
        aria-multiselectable=${this.selectable ? "true" : nothing}
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
      // Each opening starts a new pick: the first press is a first day.
      month.endPending = false;
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

  /** Below the field, half a square from it, or above when there is more room there; held inside the screen. */
  private place = () => {
    const panel = this.panel, trigger = this.trigger;
    if (!this.shown || !panel || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const view = this.ownerDocument.defaultView!;
    const viewport = view.visualViewport;
    const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? view.innerWidth, height = viewport?.height ?? view.innerHeight;
    const box = panel.getBoundingClientRect();
    const gap = (parseFloat(getComputedStyle(panel).paddingTop) || 9) + 1;
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

  private clear = () => {
    this.commit("");
    this.open = false;
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
        class="ds-select trigger"
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
        <ds-icon class="icon" type="calendar" aria-hidden="true"></ds-icon>
        <span class="text">${text}</span>
        <ds-icon class="arrow" type="down" aria-hidden="true"></ds-icon>
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
                <button class="option clear" part="clear" type="button" ?disabled=${!start} @click=${this.clear}>${this.pickerWords(undefined, "Clear")}</button>`}
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
