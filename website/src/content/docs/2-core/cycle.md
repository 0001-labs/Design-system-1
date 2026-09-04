---
title: Cycle Component
description: A button that cycles through predefined settings values
---

The `ds-cycle` component is a button that cycles through predefined values when clicked. It's used for settings like language, theme, and accent color selection.

## Basic Usage

```html
<!-- Language selector -->
<ds-cycle type="language"></ds-cycle>

<!-- Theme toggle (light/dark) -->
<ds-cycle type="theme"></ds-cycle>

<!-- Accent color picker -->
<ds-cycle type="accent-color"></ds-cycle>
```

## Available Types

### Language

Cycles through available languages. Values are dynamically populated from the i18n system.

```html
<ds-cycle type="language"></ds-cycle>
```

### Theme

Toggles between light and dark themes.

```html
<ds-cycle type="theme"></ds-cycle>
```

Values: `light`, `dark`

### Accent Color

Cycles through available accent colors.

```html
<ds-cycle type="accent-color"></ds-cycle>
```

Values: `--apple-green`, `--every-green`, `--zenith-blue`, `--sharp-blue`, `--pink`, `--tuned-red`, `--orange`, `--yellow`

### Page Style

Toggles between note and page display styles.

```html
<ds-cycle type="page-style"></ds-cycle>
```

Values: `note`, `page`

### Notes Style Medium

Cycles through notes display styles. Automatically disabled when page-style is set to "note".

```html
<ds-cycle type="notes-style-medium"></ds-cycle>
```

Values: `default`, `big`, `gallery`

### Icon Only

Similar to page-style but displays only an icon without text label.

```html
<ds-cycle type="icon-only"></ds-cycle>
```

Values: `note`, `page`

## Attributes

| Attribute  | Type      | Default     | Description                                      |
| ---------- | --------- | ----------- | ------------------------------------------------ |
| `type`     | `string`  | `""`        | Type of cycle (see available types above)        |
| `variant`  | `string`  | `"primary"` | Button variant (`primary`, `secondary`)          |
| `disabled` | `boolean` | `false`     | Disables the component                           |

## Events

Each type dispatches its own event when the value changes:

| Type                 | Event                        | Detail Property |
| -------------------- | ---------------------------- | --------------- |
| `language`           | `language-changed`           | `language`      |
| `theme`              | `theme-changed`              | (via setTheme)  |
| `accent-color`       | `accent-color-changed`       | `color`         |
| `page-style`         | `page-style-changed`         | `behavior`      |
| `notes-style-medium` | `notes-style-medium-changed` | `style`         |
| `icon-only`          | `page-style-changed`         | `behavior`      |

## Persistence

All values are automatically saved to localStorage and restored on page load:

- Language preference
- Theme preference
- Accent color
- Page style
- Notes style medium
