/** Native controls retain labels, forms and events. Shared Lit elements own their faces. Select is in `react/select`. */
import { createElement, forwardRef, useCallback, type ButtonHTMLAttributes, type InputHTMLAttributes, type MouseEvent, type ReactNode } from "react";

export type ColorInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;
export const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(function ColorInput(
  { className, style, hidden, ...props }, ref,
) {
  return createElement("ds-color", { className, style, hidden }, createElement("input", { ...props, type: "color", hidden, ref }));
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

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & {
  choice?: boolean;
  compact?: boolean;
  label?: string;
  preview?: ReactNode;
};
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { className, style, hidden, choice, compact, label, preview, ...props }, ref,
) {
  return createElement("ds-radio", { className, style, hidden, label, choice: Boolean(choice), compact: Boolean(compact), preview: preview != null },
    createElement("input", { ...props, "aria-label": props["aria-label"] ?? label, type: "radio", hidden, ref }),
    preview != null ? createElement("span", { slot: "preview", "aria-hidden": true }, preview) : null,
  );
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
