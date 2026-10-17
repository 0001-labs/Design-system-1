/** Steps in React: ds-steps with the steps as a property and what belongs
 * under each step, in a vertical sequence, slotted from the light DOM.
 * Register ds-steps in the browser before hydration, so the steps arrive as
 * a property. */
import { createElement as h, forwardRef, type HTMLAttributes, type ReactNode } from "react";
import type { Step, Steps as StepsElement } from "../2-core/ds-steps";

export type { Step, StepState } from "../2-core/ds-steps";
export type StepsProps = Omit<HTMLAttributes<StepsElement>, "title" | "children"> & {
  /** The steps in order: names, or `{ label, state, href }`. */
  steps: Step[];
  /** The number of the current step, counted from 1. */
  current?: number;
  /** One step to a row, with `bodies` under them. */
  vertical?: boolean;
  /** The sequence's name for assistive technology. */
  label?: string;
  /** Show the names and the label as written, never looked up. On by default: React writes its own words. */
  literal?: boolean;
  /** In a vertical sequence, what belongs under each step, by its place in `steps`. */
  bodies?: ReactNode[];
};

export const Steps = forwardRef<StepsElement, StepsProps>(function Steps(
  { steps, current, vertical, label, literal = true, bodies, ...props }, ref,
) {
  return h("ds-steps", { ...props, steps, current, vertical: vertical || undefined, label, literal: literal || undefined, ref },
    vertical ? bodies?.map((body, index) => body == null || body === false
      ? null
      : h("div", { key: index, slot: `step-${index + 1}`, style: { display: "contents" } }, body)) : null);
});
