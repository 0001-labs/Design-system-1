/** Native semantics and React events; the shared Lit element owns the face. */
import { createElement, forwardRef, type ButtonHTMLAttributes } from "react";
import type { Button as ButtonElement } from "../2-core/ds-button";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Partial<Pick<ButtonElement, "primary" | "secondary" | "active" | "choice" | "icon" | "wide" | "danger">>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    style,
    primary,
    secondary,
    active,
    choice,
    icon,
    wide,
    danger,
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  return createElement(
    "ds-button",
    {
      control: "slotted",
      primary,
      secondary,
      active,
      choice,
      icon,
      wide,
      danger,
      disabled,
      className,
      style,
    },
    createElement("button", { ...props, ref, type, disabled }, children),
  );
});
