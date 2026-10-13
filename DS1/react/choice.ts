/** Native controls retain labels, forms and events. Shared Lit elements own their faces. */
import { createElement, forwardRef, useCallback, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type MouseEvent } from "react";

export type ColorInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;
export const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(function ColorInput(
  { className, style, hidden, ...props }, ref,
) {
  return createElement("ds-color", { className, style, hidden }, createElement("input", { ...props, type: "color", hidden, ref }));
});

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, style, hidden, children, ...props }, ref,
) {
  return createElement("ds-select", { className, style, hidden }, createElement("select", { ...props, hidden, ref }, children));
});

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { indeterminate?: boolean };
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, style, hidden, indeterminate = false, ...props }, ref,
) {
  const controlRef = useCallback((input: HTMLInputElement | null) => {
    if (input) input.indeterminate = indeterminate;
    if (typeof ref === "function") return ref(input);
    if (ref) ref.current = input;
  }, [ref, indeterminate]);
  return createElement("ds-checkbox", { className, style, hidden }, createElement("input", { ...props, type: "checkbox", hidden, ref: controlRef }));
});

export type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "role" | "aria-checked" | "onChange" | "type"> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean, event: MouseEvent<HTMLButtonElement>) => void;
};
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onCheckedChange, onClick, className, style, hidden, ...props }, ref,
) {
  return createElement("ds-switch", { className, style, hidden }, createElement("button", {
    ...props, ref, hidden, type: "button", role: "switch", "aria-checked": checked,
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) onCheckedChange?.(!checked, event);
    },
  }));
});
