import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { bindSpacingHandle } from "../../packages/app/src/2-core/spacing-handle";
import { AppElement, defineElement } from "./lib/element";

export type BoxRegion = "margin" | "border" | "padding" | "content" | "all";
export type BoxModelConfig = {
  paddingX: number; paddingY: number; radius: number;
  borderTop?: number; borderRight?: number; borderBottom?: number; borderLeft?: number;
  marginTop?: number; marginRight?: number; marginBottom?: number; marginLeft?: number;
};
const BORDER_FIELDS = { top: "borderTop", right: "borderRight", bottom: "borderBottom", left: "borderLeft" } as const;
const MARGIN_FIELDS = { top: "marginTop", right: "marginRight", bottom: "marginBottom", left: "marginLeft" } as const;
const clampSpacing = (value: number) => Math.min(96, Math.max(0, value));
const clampBorder = (value: number) => Math.min(24, Math.max(0, value));

type Field = { value: number; min: number; max: number; step: number; disabled?: boolean; patch: (value: number) => Partial<BoxModelConfig> };

/**
 * The button's box: margin, border with its corners, padding and the content's
 * size, each value a number that drags. A drag previews (`box-preview`), letting
 * go commits (`box-change`); `box-hover` names the region under the pointer.
 */
export class BoxModel extends AppElement {
  static properties = {
    config: { attribute: false },
    contentSize: { attribute: false },
    hoverRegion: { attribute: false },
    supportsSpacing: { type: Boolean },
  };
  declare config: BoxModelConfig;
  declare contentSize: { height: number; width: number };
  declare hoverRegion: BoxRegion | null;
  declare supportsSpacing: boolean;

  /** Each value's current field, by its label, read by the drag as it moves. */
  #fields = new Map<string, Field>();
  #bound = new WeakSet<HTMLInputElement>();
  #unbind: Array<() => void> = [];

  constructor() {
    super();
    this.config = { paddingX: 0, paddingY: 0, radius: 0 };
    this.contentSize = { height: 0, width: 0 };
    this.hoverRegion = null;
    this.supportsSpacing = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated) this.requestUpdate();
  }

  override disconnectedCallback() {
    for (const unbind of this.#unbind) unbind();
    this.#unbind = [];
    this.#bound = new WeakSet();
    super.disconnectedCallback();
  }

  override updated() {
    for (const input of this.querySelectorAll<HTMLInputElement>("input[aria-label]")) {
      if (this.#bound.has(input)) continue;
      this.#bound.add(input);
      const label = input.getAttribute("aria-label")!;
      const field = () => this.#fields.get(label)!;
      this.#unbind.push(bindSpacingHandle(input, () => ({
        value: field().value, min: field().min, max: field().max,
        step: field().step, gain: field().step / 6, disabled: field().disabled,
        snapPreview: true, keyboard: false,
        onPreview: value => this.emit("box-preview", field().patch(value)),
        onCommit: value => this.emit("box-change", field().patch(value)),
        onTap: () => { input.focus(); input.select(); },
      })));
    }
  }

  #value(label: string, className: string, field: Field) {
    this.#fields.set(label, field);
    return html`<input aria-label=${label} class=${className} type="number" ?disabled=${Boolean(field.disabled)}
      min=${field.min} max=${field.max} step=${field.step} .value=${live(String(field.value))}
      @input=${(event: Event) => this.emit("box-change", field.patch(Math.min(field.max, Math.max(field.min, Number((event.target as HTMLInputElement).value)))))} />`;
  }

  #padding(axis: "x" | "y", position: "top" | "right" | "bottom" | "left") {
    const key = axis === "x" ? "paddingX" : "paddingY";
    const value = this.supportsSpacing ? Math.round(this.config[key]) : 0;
    return this.#value(`Padding ${position}`, `box-model__value box-model__value--${position}`, { value, min: 0, max: 96, step: 4, disabled: !this.supportsSpacing, patch: next => ({ [key]: clampSpacing(next) }) });
  }

  #radius(position: "top-left" | "top-right" | "bottom-right" | "bottom-left") {
    return this.#value(`Border radius ${position}`, `box-model__value box-model__radius-value box-model__radius-value--${position}`, { value: Math.round(this.config.radius), min: 0, max: 48, step: 1, patch: radius => ({ radius: clampSpacing(radius) }) });
  }

  #border(position: "top" | "right" | "bottom" | "left") {
    const field = BORDER_FIELDS[position];
    return this.#value(`Border ${position}`, `box-model__value box-model__value--${position}`, { value: this.config[field] ?? 0, min: 0, max: 24, step: 1, patch: next => ({ [field]: clampBorder(next) }) });
  }

  #margin(position: "top" | "right" | "bottom" | "left") {
    const field = MARGIN_FIELDS[position];
    return this.#value(`Margin ${position}`, `box-model__value box-model__value--${position}`, { value: this.config[field] ?? 0, min: 0, max: 96, step: 4, patch: next => ({ [field]: clampSpacing(next) }) });
  }

  #hover = (event: MouseEvent) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-region]");
    this.emit("box-hover", (target?.dataset.region as BoxRegion | undefined) ?? null);
  };

  override render() {
    return html`<div aria-label="Box model" class="box-model" data-hover=${ifDefined(this.hoverRegion ?? undefined)} data-region="margin"
      @mouseleave=${() => this.emit("box-hover", null)} @mouseover=${this.#hover}>
      <span class="box-model__label">margin</span>
      ${this.#margin("top")}${this.#margin("right")}${this.#margin("bottom")}${this.#margin("left")}
      <div class="box-model__border" data-region="border">
        <span class="box-model__label">border</span>
        ${this.#radius("top-left")}${this.#radius("top-right")}${this.#radius("bottom-right")}${this.#radius("bottom-left")}
        ${this.#border("top")}${this.#border("right")}${this.#border("bottom")}${this.#border("left")}
        <div class="box-model__padding" data-region="padding">
          <span class="box-model__label">padding</span>
          ${this.#padding("y", "top")}${this.#padding("x", "right")}${this.#padding("y", "bottom")}${this.#padding("x", "left")}
          <div class="box-model__content" data-region="content">${this.contentSize.width}×${this.contentSize.height}</div>
        </div>
      </div>
    </div>`;
  }
}
defineElement("ds1-box-model", BoxModel);
