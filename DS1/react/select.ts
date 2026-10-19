/**
 * Select in React: every menu that opens from a button.
 *
 * With `<option>` children it is a field: a native select inside `ds-select`,
 * whose list DS1 draws (`native` keeps the platform's picker). Standard select
 * props, children and the ref pass through to the native select.
 *
 * With `trigger` (or `open`, or `items`) it is a menu: the shared engine on
 * `ds-select`, opened from the trigger, its entries either children (Button
 * `menuItem` rows, `hr data-ds-menu-separator`, labels) or `items`, entries as
 * data after Link's dropdowns: rows with an icon on the first square, details,
 * a shortcut at the end, danger, checked, a link, rows that keep it open, and
 * nested menus; headings and separators between them.
 */
import { createElement as h, forwardRef, useState, type ReactNode, type SelectHTMLAttributes } from "react";
import { MenuHost, type MenuElement, type MenuProps } from "./menu-engine";
import { Button, type ButtonProps } from "./button";
import { shortcutLabel } from "../0-face/keys";

export type SelectEntry =
  | {
    label: ReactNode;
    /** What typing finds it by, when `label` is not plain words. */
    textValue?: string;
    /** Muted words after the label. */
    details?: ReactNode;
    /** A library icon on the row's first square. */
    icon?: string;
    /** A shortcut written once, `"mod+k"`, shown as the platform writes it. */
    shortcut?: string;
    href?: string;
    danger?: boolean;
    disabled?: boolean;
    /** A choice that is on: a checkbox row. */
    checked?: boolean;
    /** Act and stay open, as a colour that cycles in place. */
    keepOpen?: boolean;
    onSelect?: (event: Event) => void;
    /** A nested menu opened from this row. */
    items?: SelectEntry[];
  }
  | { separator: true }
  | { heading: ReactNode };

type FieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  fit?: boolean;
  chip?: boolean;
  primary?: boolean;
  swatch?: string;
  /** Keep the platform's own picker. */
  native?: boolean;
};
type MenuOnly = Omit<MenuProps, "tag"> & { items?: SelectEntry[] };
export type SelectProps = (FieldProps & { trigger?: undefined; items?: undefined }) | (MenuOnly & { trigger?: HTMLElement | null; open?: boolean });

const isMenu = (props: SelectProps): props is MenuOnly & { trigger?: HTMLElement | null } =>
  "trigger" in props || "items" in props || ("open" in props && typeof (props as { open?: unknown }).open === "boolean") || "onOpenChange" in props;

/** One entry of `items`, as a row of the menu. */
function Entry({ entry, menu }: { entry: SelectEntry; menu: { current: MenuElement | null } }): ReactNode {
  if ("separator" in entry) return h("hr", { "data-ds-menu-separator": "" });
  if ("heading" in entry) return h("ds-text", { literal: true, tone: "muted", "data-ds-menu-label": "" }, entry.heading);
  if (entry.items) return h(Nested, { entry });
  return h(Button, {
    menuItem: true, href: entry.href, danger: entry.danger, disabled: entry.disabled,
    role: entry.checked === undefined ? "menuitem" : "menuitemcheckbox", "aria-checked": entry.checked, "data-keep-open": "",
    "data-text-value": entry.textValue ?? (typeof entry.label === "string" ? entry.label : undefined),
    onClick: () => {
      if (entry.disabled) return;
      const select = new Event("ds-menu-select", { cancelable: true });
      entry.onSelect?.(select);
      if (!select.defaultPrevented && !entry.keepOpen) menu.current?.select();
    },
  } as ButtonProps, ...row(entry));
}

/** A row's parts on its square: the icon, the label, details, the shortcut, the check. */
function row(entry: Extract<SelectEntry, { label: ReactNode }>, end?: ReactNode): ReactNode[] {
  return [
    entry.icon ? h("ds-icon", { type: entry.icon, "aria-hidden": true, style: { flex: "none" } }) : null,
    h("span", { style: { minWidth: 0, overflow: "hidden", whiteSpace: "nowrap" } }, entry.label),
    entry.details ? h("span", { style: { minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", color: "var(--ds-text-color-muted)" } }, entry.details) : null,
    entry.shortcut ? h("span", { "aria-hidden": true, style: { marginInlineStart: "auto", flex: "none", color: "var(--ds-text-color-muted)" } }, shortcutLabel(entry.shortcut)) : null,
    entry.checked ? h("ds-icon", { type: "check", "aria-hidden": true, style: { marginInlineStart: entry.shortcut ? 0 : "auto", flex: "none" } }) : null,
    end ?? null,
  ];
}

/** A row that opens a nested menu beside it. */
function Nested({ entry }: { entry: Extract<SelectEntry, { label: ReactNode }> }) {
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const menu = { current: null as MenuElement | null };
  return h("div", { style: { display: "contents" } },
    h(Button, {
      ref: setTrigger, menuItem: true, role: "menuitem", disabled: entry.disabled, active: open, "data-keep-open": "",
      "data-text-value": entry.textValue ?? (typeof entry.label === "string" ? entry.label : undefined),
    } as ButtonProps, ...row(entry, h("ds-icon", { type: "right", "aria-hidden": true, style: { marginInlineStart: "auto", flex: "none" } }))),
    h(MenuHost, {
      tag: "ds-select", role: "menu", trigger, anchor: trigger, triggerMode: "submenu", placement: "right",
      open, onOpenChange: next => setOpen(next), ref: (element: MenuElement | null) => { menu.current = element; },
    }, open ? entry.items!.map((child, index) => h(Entry, { key: index, entry: child, menu })) : null),
  );
}

export const Select = forwardRef<HTMLSelectElement | MenuElement, SelectProps>(function Select(props, ref) {
  if (isMenu(props)) {
    const { items, children, ...menu } = props;
    const host = { current: null as MenuElement | null };
    return h(MenuHost, {
      ...menu, tag: "ds-select", role: menu.role ?? "menu", anchor: menu.anchor ?? menu.trigger ?? null,
      ref: (element: MenuElement | null) => { host.current = element; if (typeof ref === "function") ref(element); else if (ref) (ref as { current: unknown }).current = element; },
    }, items ? items.map((entry, index) => h(Entry, { key: index, entry, menu: host })) : children);
  }
  const { className, style, hidden, children, fit, chip, primary, swatch, native, ...field } = props as FieldProps;
  return h("ds-select", { className, style, hidden, fit: fit ? "" : undefined, chip: chip ? "" : undefined, primary: primary ? "" : undefined, native: native || undefined, swatch },
    h("select", { ...field, hidden, ref }, children));
});
