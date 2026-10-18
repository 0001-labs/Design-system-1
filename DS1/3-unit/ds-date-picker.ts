// ds-date-picker.ts
// A field that opens a panel below it: the date written out where it can be
// typed, a small month to press a day in, and switches for an end date and a
// time. The month takes two squares a day where the screen has room and one
// on a narrow phone. A form takes the value as ISO 8601: a day, a day and a
// time, or two of them joined by a slash for a range.

import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { define } from "../0-face/define";
import { getText } from "../0-face/i18n";
import { dateFormatter, type DateLength } from "../0-face/format";
import { dayOf, isDay, today as todayDay, type Day } from "../0-face/calendar";
import "../2-core/ds-icon";
import "./ds-calendar";
import type { Calendar, CalendarChangeDetail } from "./ds-calendar";
import metrics from "../1-root/component-metrics.css?inline";
import controls from "../1-root/controls.css?inline";
import styles from "./styles/ds-date-picker.css?inline";

/** Detail of `change` and `input`: the value now and before; each is empty when there is none. */
export interface DatePickerChangeDetail {
  value: string;
  previous: string;
}

/** One end of a value: its day and, when it has one, its time (`14:30`). */
export interface DatePickerEnd {
  day: Day;
  time: string;
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Reads a value: `2026-10-21`, `2026-10-21T14:30`, or two of them joined by `/`. */
export function readDateValue(value: string | null | undefined): { start?: DatePickerEnd; end?: DatePickerEnd } {
  const read = (part: string | undefined): DatePickerEnd | undefined => {
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

/** Writes a value from its ends: the time only with `time`, the end only with `range`. */
export function writeDateValue(start: DatePickerEnd | undefined, end: DatePickerEnd | undefined, options: { range: boolean; time: boolean }): string {
  if (!start) return "";
  const part = (side: DatePickerEnd) => (options.time && side.time ? `${side.day}T${side.time}` : side.day);
  return options.range && end ? `${part(start)}/${part(end)}` : part(start);
}

/** Reads what a person typed: a day written `YYYY-MM-DD`, or a date the browser can read ("Oct 21, 2026"). */
export function parseTypedDay(text: string): Day | null {
  const trimmed = text.trim();
  if (isDay(trimmed)) return trimmed;
  const moment = Date.parse(trimmed);
  return Number.isFinite(moment) ? dayOf(new Date(moment)) : null;
}

const openPickers = new Set<DatePicker>();

/**
 * @element ds-date-picker
 * @prop {string} value - `YYYY-MM-DD`, `YYYY-MM-DDTHH:MM`, or two joined by
 *   `/` for a range; empty for none.
 * @prop {string} name - The form field's name.
 * @prop {string} label - The field's accessible name: a translation key, or
 *   literal words.
 * @prop {boolean} literal - Show `label` and `placeholder` as written.
 * @prop {string} placeholder - The words before a day is chosen; the shared
 *   "Choose a date" by default.
 * @prop {string} length - How a day is written: `short`, `medium` (the
 *   default) or `long`.
 * @prop {boolean} range - Choose a first and a last day (the End date switch).
 * @prop {boolean} time - Choose a time with each day (the Include time switch).
 * @prop {boolean} noOptions - Leave the End date and Include time switches
 *   out (`no-options`); `range` and `time` still apply.
 * @prop {string} min - The first day a person may choose.
 * @prop {string} max - The last day a person may choose.
 * @prop {string} weekStart - The week's first day (`week-start`); the
 *   language's own by default.
 * @prop {string} today - The day drawn as today; the reader's own by default.
 * @prop {boolean} required - A form needs a value; Clear is left out.
 * @prop {boolean} disabled - The field cannot be opened.
 * @prop {boolean} open - The panel is open.
 *
 * @fires change - A person changed the value; `{ value, previous }`.
 * @fires input - The same moment, for code listening as to a field.
 * @fires ds-date-picker-toggle - The panel opened or closed; `{ open }`.
 *
 * @example
 * <ds-date-picker label="Due" literal name="due" value="2026-10-21"></ds-date-picker>
 * <ds-date-picker label="Trip" literal range value="2026-10-21/2026-10-24"></ds-date-picker>
 */
export class DatePicker extends LitElement {
  static formAssociated = true;

  static properties = {
    value: { type: String, reflect: true },
    name: { type: String, reflect: true },
    label: { type: String },
    literal: { type: Boolean, reflect: true },
    placeholder: { type: String },
    length: { type: String },
    range: { type: Boolean, reflect: true },
    time: { type: Boolean, reflect: true },
    noOptions: { type: Boolean, attribute: "no-options", reflect: true },
    min: { type: String },
    max: { type: String },
    weekStart: { type: String, attribute: "week-start" },
    today: { type: String },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(controls), unsafeCSS(styles)];

  declare value: string;
  declare name: string | undefined;
  declare label: string | undefined;
  declare literal: boolean;
  declare placeholder: string | undefined;
  declare length: DateLength | undefined;
  declare range: boolean;
  declare time: boolean;
  declare noOptions: boolean;
  declare min: string | undefined;
  declare max: string | undefined;
  declare weekStart: string | undefined;
  declare today: string | undefined;
  declare required: boolean;
  declare disabled: boolean;
  declare open: boolean;

  private readonly internals = typeof this.attachInternals === "function" ? this.attachInternals() : null;
  /** The value the field started with, for a form's reset. */
  private initial = "";
  private shown = false;
  /** Whether opening should move focus into the month (a key opened it). */
  private focusMonth = false;
  private readonly relabel = () => this.requestUpdate();

  constructor() {
    super();
    this.value = "";
    this.literal = false;
    this.range = false;
    this.time = false;
    this.noOptions = false;
    this.required = false;
    this.disabled = false;
    this.open = false;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("language-changed", this.relabel);
    window.addEventListener("translations-loaded", this.relabel);
  }

  disconnectedCallback() {
    window.removeEventListener("language-changed", this.relabel);
    window.removeEventListener("translations-loaded", this.relabel);
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

  private words(value: string | undefined, fallback: string): string {
    if (value && this.literal) return value;
    return getText(value || fallback) || value || fallback;
  }

  private get trigger() {
    return this.renderRoot.querySelector<HTMLButtonElement>(".trigger");
  }

  private get panel() {
    return this.renderRoot.querySelector<HTMLElement>(".popover");
  }

  private get calendar() {
    return this.renderRoot.querySelector<Calendar>("ds-calendar");
  }

  private get ends() {
    return readDateValue(this.value);
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("value") && this.value) {
      const { start, end } = this.ends;
      // A value with an end or a time turns the matching switch on.
      if (!start) this.value = "";
      else {
        if (end) this.range = true;
        if (start.time || end?.time) this.time = true;
      }
    }
    if (changed.has("disabled") && this.disabled) this.open = false;
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (changed.has("value") || changed.has("required")) {
      this.internals?.setFormValue(this.value || null);
      if (this.required && !this.value) this.internals?.setValidity({ valueMissing: true }, this.words(undefined, "Choose a date"), this.trigger ?? undefined);
      else this.internals?.setValidity({});
    }
    if (changed.has("open")) {
      if (this.open) this.show();
      else this.hide(changed.get("open") === true);
    }
  }

  /** Opens the panel. */
  show() {
    if (this.shown || this.disabled || !this.isConnected) return;
    const panel = this.panel;
    if (!panel) return;
    for (const other of openPickers) if (other !== this) other.open = false;
    openPickers.add(this);
    this.shown = true;
    this.open = true;
    const calendar = this.calendar;
    if (calendar) calendar.month = (this.ends.start?.day || this.today || todayDay()).slice(0, 7);
    panel.showPopover?.();
    if (calendar) {
      // Two squares a day where the screen holds the month that wide (fifteen squares and its
      // margins), one square on a narrow phone.
      const unit = ((parseFloat(getComputedStyle(panel).paddingTop) || 9) + 1) * 2;
      const view = this.ownerDocument.defaultView!;
      calendar.dayWidth = (view.visualViewport?.width ?? view.innerWidth) >= 17 * unit ? 2 : 1;
      void calendar.updateComplete.then(this.place);
    }
    this.place();
    this.ownerDocument.addEventListener("pointerdown", this.onOutside, true);
    this.ownerDocument.addEventListener("scroll", this.place, true);
    window.addEventListener("resize", this.place);
    this.dispatchEvent(new CustomEvent("ds-date-picker-toggle", { bubbles: true, composed: true, detail: { open: true } }));
    if (this.focusMonth) void this.focusDay();
  }

  /** Closes the panel, giving focus back to the field when it was inside. */
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
    this.dispatchEvent(new CustomEvent("ds-date-picker-toggle", { bubbles: true, composed: true, detail: { open: false } }));
  }

  private async focusDay() {
    const calendar = this.calendar;
    if (!calendar) return;
    await calendar.updateComplete;
    calendar.renderRoot.querySelector<HTMLElement>('[data-day][tabindex="0"]')?.focus({ preventScroll: true });
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
    const gap = ((parseFloat(getComputedStyle(panel).paddingTop) || 9) + 1);
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
      if (this.open) void this.focusDay();
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

  private onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (this.open && next instanceof Node && !this.contains(next) && !this.renderRoot.contains(next)) this.open = false;
  };

  /** Takes a new value and says so. */
  private commit(value: string) {
    const previous = this.value || "";
    if (value === previous) return;
    this.value = value;
    const detail: DatePickerChangeDetail = { value, previous };
    this.dispatchEvent(new CustomEvent("input", { bubbles: true, composed: true, detail }));
    this.dispatchEvent(new CustomEvent("change", { bubbles: true, composed: true, detail }));
  }

  private write(start: DatePickerEnd | undefined, end: DatePickerEnd | undefined) {
    this.commit(writeDateValue(start, end, { range: this.range, time: this.time }));
  }

  /** A day pressed in the month: kept with its time; a lone day without a time closes the panel. */
  private picked = (event: CustomEvent<CalendarChangeDetail>) => {
    event.stopPropagation();
    const { start, end } = this.ends;
    const day = (side: "start" | "end", fallback: string): DatePickerEnd | undefined => {
      const chosen = event.detail[side];
      if (!chosen) return undefined;
      return { day: chosen, time: (side === "start" ? start : end)?.time || fallback };
    };
    const next = day("start", this.time ? "09:00" : "");
    const last = this.range ? day("end", this.time ? "10:00" : "") : undefined;
    this.write(next, last);
    if (!this.range && !this.time) this.open = false;
  };

  private pressedChosen = (event: CustomEvent<{ day: Day }>) => {
    // Pressing the chosen day again closes the panel, as choosing it did.
    if (!this.range && !this.time && event.detail.day === this.ends.start?.day) this.open = false;
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
    const calendar = this.calendar;
    if (calendar) calendar.month = day.slice(0, 7);
  }

  private timed(side: "start" | "end", input: HTMLInputElement) {
    const { start, end } = this.ends;
    const clock = TIME.test(input.value) ? input.value : "";
    if (side === "start" && start) this.write({ ...start, time: clock }, end);
    if (side === "end" && end) this.write(start, { ...end, time: clock });
  }

  private setRange = () => {
    this.range = !this.range;
    const { start, end } = this.ends;
    // Turning the end on starts it on the first day; turning it off drops it.
    this.write(start, this.range && start ? end ?? { ...start, time: start.time ? "10:00" : "" } : undefined);
  };

  private setTime = () => {
    this.time = !this.time;
    const { start, end } = this.ends;
    const timed = (side: DatePickerEnd | undefined, clock: string) => (side ? { ...side, time: this.time ? side.time || clock : "" } : undefined);
    this.write(timed(start, "09:00"), timed(end, "10:00"));
  };

  /** Pressing a switch's row presses the switch, as a label would. */
  private passPress = (event: MouseEvent) => {
    const row = event.currentTarget as HTMLElement;
    const control = row.querySelector<HTMLButtonElement>(".ds-switch");
    if (control && !event.composedPath().includes(control)) control.click();
  };

  private clear = () => {
    this.commit("");
    this.open = false;
  };

  /** A day (and time) as words: "Oct 21, 2026", "Oct 21, 2026, 2:30 PM". */
  private format(side: DatePickerEnd): string {
    const [year, month, date] = side.day.split("-").map(Number);
    const [hours, minutes] = (side.time || "12:00").split(":").map(Number);
    const formatter = dateFormatter({ dateStyle: this.length ?? "medium", ...(side.time ? { timeStyle: "short" } : {}), timeZone: "UTC" });
    return formatter.format(Date.UTC(year, month - 1, date, hours, minutes));
  }

  private fieldText(side: DatePickerEnd | undefined) {
    return side ? this.format({ day: side.day, time: "" }) : "";
  }

  /** The face's words: one day, or a range written as the language writes one ("Oct 21 – 24, 2026"). */
  private faceText(): string {
    const { start, end } = this.ends;
    if (!start) return this.words(this.placeholder, "Choose a date");
    if (!this.range || !end) return this.format(start);
    const moment = (side: DatePickerEnd) => {
      const [year, month, date] = side.day.split("-").map(Number);
      const [hours, minutes] = (side.time || "12:00").split(":").map(Number);
      return Date.UTC(year, month - 1, date, hours, minutes);
    };
    const formatter = dateFormatter({ dateStyle: this.length ?? "medium", ...(start.time || end.time ? { timeStyle: "short" } : {}), timeZone: "UTC" }) as Intl.DateTimeFormat & {
      formatRange?: (from: number, to: number) => string;
    };
    return formatter.formatRange ? formatter.formatRange(moment(start), moment(end)) : `${this.format(start)} – ${this.format(end)}`;
  }

  private renderField(side: "start" | "end", value: DatePickerEnd | undefined, name: string) {
    const label = side === "start" ? name : `${name}, ${this.words(undefined, "End date")}`;
    return html`<div class="field-row" part="field">
      <input
        class="ds-input field"
        type="text"
        inputmode="text"
        autocomplete="off"
        aria-label=${label}
        placeholder=${side === "start" ? this.words(this.placeholder, "Choose a date") : this.words(undefined, "End date")}
        .value=${this.fieldText(value)}
        @change=${(event: Event) => this.typed(side, event.target as HTMLInputElement)}
        @keydown=${(event: KeyboardEvent) => { if (event.key === "Enter") { event.preventDefault(); this.typed(side, event.target as HTMLInputElement); } }}
      />
      ${this.time
        ? html`<input
            class="ds-input clock"
            type="time"
            aria-label=${`${label}, ${this.words(undefined, "Time")}`}
            .value=${value?.time ?? ""}
            ?disabled=${!value}
            @change=${(event: Event) => this.timed(side, event.target as HTMLInputElement)}
          />`
        : nothing}
    </div>`;
  }

  render() {
    const { start, end } = this.ends;
    const text = this.faceText();
    const name = this.label ? this.words(this.label, this.label) : this.words(undefined, "Date");
    const days = start ? (this.range && end ? `${start.day}/${end.day}` : start.day) : "";
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
        @focusout=${this.onFocusOut}
      >
        <div class="fields">
          ${this.renderField("start", start, name)}
          ${this.range ? this.renderField("end", end, name) : nothing}
        </div>
        <ds-calendar
          compact
          selectable
          fixed
          outside-days
          ?range=${this.range}
          .value=${days}
          .min=${this.min}
          .max=${this.max}
          .weekStart=${this.weekStart}
          .today=${this.today}
          @change=${this.picked}
          @day-press=${this.pressedChosen}
        ></ds-calendar>
        <div class="options" part="options">
          ${this.noOptions
            ? nothing
            : html`<div class="separator" aria-hidden="true"></div>
                <div class="option" @click=${this.passPress}>
                  <span>${this.words(undefined, "End date")}</span>
                  <button class="ds-switch" type="button" role="switch" aria-label=${this.words(undefined, "End date")} aria-checked=${String(this.range)} @click=${this.setRange}></button>
                </div>
                <div class="option" @click=${this.passPress}>
                  <span>${this.words(undefined, "Include time")}</span>
                  <button class="ds-switch" type="button" role="switch" aria-label=${this.words(undefined, "Include time")} aria-checked=${String(this.time)} @click=${this.setTime}></button>
                </div>`}
          ${this.required
            ? nothing
            : html`<div class="separator" aria-hidden="true"></div>
                <button class="option clear" part="clear" type="button" ?disabled=${!start} @click=${this.clear}>${this.words(undefined, "Clear")}</button>`}
        </div>
      </div>`;
  }
}

define("ds-date-picker", DatePicker);

declare global {
  interface HTMLElementTagNameMap {
    "ds-date-picker": DatePicker;
  }
}
