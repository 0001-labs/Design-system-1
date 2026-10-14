/** Native semantics and React events; the shared Lit element owns the face. */
import { createElement, forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from "react";
import type { Button as ButtonElement } from "../2-core/ds-button";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Partial<Pick<ButtonElement, "primary" | "secondary" | "active" | "choice" | "icon" | "wide" | "fit" | "danger" | "menuItem">>;

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
    fit,
    danger,
    menuItem,
    disabled,
    hidden,
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
      fit,
      danger,
    menuItem,
      disabled,
      hidden,
      className,
      style,
    },
    createElement("button", { ...props, ref, type, disabled, hidden }, children),
  );
});

/** A real link: browser navigation, context menus and modifier clicks survive. */
export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  Partial<Pick<ButtonElement, "primary" | "secondary" | "active" | "choice" | "icon" | "wide" | "fit" | "danger" | "menuItem">> & {disabled?: boolean};
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  {children, className, style, primary, secondary, active, choice, icon, wide, fit, danger, menuItem, disabled, hidden, href, onClick, onAuxClick, tabIndex, ...props}, ref,
) {
  return createElement("ds-button", {control: "slotted", primary, secondary, active, choice, icon, wide, fit, danger, menuItem, disabled, hidden, className, style},
    createElement("a", {...props, ref, href: disabled ? undefined : href, hidden,
      "aria-disabled": disabled || undefined, tabIndex: disabled ? -1 : tabIndex,
      onClick: event => { if (disabled) { event.preventDefault(); event.stopPropagation(); } else onClick?.(event); },
      onAuxClick: event => { if (disabled) { event.preventDefault(); event.stopPropagation(); } else onAuxClick?.(event); },
    }, children));
});
