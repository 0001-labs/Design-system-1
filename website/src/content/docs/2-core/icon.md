---
title: Icon Component
description: SVG icon component with a comprehensive icon set
---

The `ds-icon` component provides access to a comprehensive set of SVG icons.

## Basic Usage

```html
<ds-icon name="check"></ds-icon>
```

## Available Icons

Design system 1 includes 50+ icons:

- `check`, `close`, `open`
- `up`, `down`, `left`, `right`
- `search`, `delete`, `duplicate`
- `star`, `unstar`
- `see`, `unsee`
- `lock`, `unlock`
- And many more...

## Attributes

| Attribute | Type     | Default | Description          |
| --------- | -------- | ------- | -------------------- |
| `name`    | `string` | -       | Icon name to display |
| `size`    | `string` | `'1em'` | Icon size (CSS unit) |

## Sizing

```html
<ds-icon name="check" size="16px"></ds-icon>
<ds-icon name="check" size="2em"></ds-icon>
<ds-icon name="check" size="32px"></ds-icon>
```

## With Colors

Icons inherit the current text color:

```html
<span style="color: red;">
  <ds-icon name="star"></ds-icon>
</span>
```

## In Buttons

```html
<ds-button variant="primary">
  <ds-icon name="check"></ds-icon>
  Save
</ds-button>
```

## Icon List

Common icons include:

- Navigation: `up`, `down`, `left`, `right`
- Actions: `check`, `close`, `plus`, `delete`
- UI: `search`, `star`, `lock`, `see`
- Content: `note`, `page`, `title`, `icon`
- Layout: `expand`, `collapse`, `minimize`
