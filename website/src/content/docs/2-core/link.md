---
title: Link Component
description: Navigation link component with automatic scroll position preservation
---

The `ds-link` component provides navigation links with built-in support for internal routing and scroll position preservation.

## Basic Usage

```html
<ds-link href="/about">About</ds-link>
```

## External Links

```html
<ds-link href="https://example.com">External Link</ds-link>
```

## Internal Links

Internal links automatically preserve scroll position when navigating:

```html
<ds-link href="/products" internal>View Products</ds-link>
```

## Attributes

| Attribute  | Type      | Default | Description                                                    |
| ---------- | --------- | ------- | -------------------------------------------------------------- |
| `href`     | `string`  | -       | URL to navigate to                                             |
| `internal` | `boolean` | `false` | Whether this is an internal link (enables scroll preservation) |
| `target`   | `string`  | -       | Link target (`_blank`, `_self`, etc.)                          |

## Scroll Position Preservation

Design system 1 automatically preserves scroll position when navigating between pages using internal links. This provides a better user experience when users navigate back.

```html
<!-- Scroll position is preserved -->
<ds-link href="/page1" internal>Page 1</ds-link>
<ds-link href="/page2" internal>Page 2</ds-link>
```

## Examples

### Open in New Tab

```html
<ds-link href="https://github.com/0001-labs/ds-one" target="_blank">
  View on GitHub
</ds-link>
```

### With Icon

```html
<ds-link href="/documentation">
  <ds-icon name="open"></ds-icon>
  Documentation
</ds-link>
```
