/** React binding only. ds-number owns the field and all of its behaviour. */
import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, type HTMLAttributes } from "react";
import type { NumberField as NumberElement } from "../2-core/ds-number";
export type { NumberElement };
export type NumberFieldProps = Omit<HTMLAttributes<NumberElement>, "onChange" | "onInput" | "defaultValue"> & {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  bigStep?: number;
  places?: number;
  /** What a double-click on the lead puts back. */
  defaultValue?: number;
  label?: string;
  icon?: string;
  unit?: string;
  /** Width in squares, four by default. */
  width?: number;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  /** While a drag moves the value. */
  onInput?: (value: number) => void;
  /** When a value is taken: a drag's end, Enter, leaving the field, an arrow. */
  onChange?: (value: number) => void;
};

export const NumberField = forwardRef<NumberElement, NumberFieldProps>(function NumberField(
  { value, min, max, step, bigStep, places, defaultValue, label, icon, unit, width, name, disabled, readOnly, onInput, onChange, ...rest },
  ref,
) {
  const element = useRef<NumberElement>(null);
  useImperativeHandle(ref, () => element.current!, []);
  const handlers = useRef({ onInput, onChange });
  handlers.current = { onInput, onChange };
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const input = () => handlers.current.onInput?.(node.value);
    const change = () => handlers.current.onChange?.(node.value);
    node.addEventListener("input", input);
    node.addEventListener("change", change);
    return () => { node.removeEventListener("input", input); node.removeEventListener("change", change); };
  }, []);
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    Object.assign(node, { value, min, max, step: step ?? 1, bigStep, places, defaultValue, label: label ?? "", icon: icon ?? "", unit: unit ?? "", width: width ?? 4, name: name ?? "", disabled: !!disabled, readonly: !!readOnly });
  }, [value, min, max, step, bigStep, places, defaultValue, label, icon, unit, width, name, disabled, readOnly]);
  return createElement("ds-number", { ...rest, ref: element });
});
