---
title: Grid
description: Learn about grid components in Design system 1
---

# Grid

Grid components create structured layouts using CSS Grid and provide alignment utilities for organizing content.

## Grid shortcut

Press **G three times** to show or hide the page grid. Press **Escape** to hide it. Typing in form fields or editable content does not trigger the shortcut.

Press **L three times** to dim the content and reveal pastel layout areas with centered names. Add `data-ds-area="introduction"` to each area in your page. The inspector follows the actual element bounds during scrolling, resizing, and content changes. Grid and layout overlays toggle independently; Escape hides both.

The overlay uses the same `--unit` multiplied by `--sf` as the page layout and follows the document when scrolling. It starts hidden and never intercepts clicks.

The shortcut is included in the main source entry point. For a native HTML integration, import `design-system-1/DS1/0-face/grid.ts` and `design-system-1/DS1/1-root/grid.css` through your bundler. These additions are currently local and will be available from npm after the next package release.

## Flexible Content

`ds-grid` is a **flexible layout component** that can hold any content. Each grid cell can contain:
- **`ds-card`** - For card-based layouts
- **`ds-container`** - For nested containers
- Any other components or HTML elements

## Features

The grid components include:

- CSS Grid-based layouts
- Column and row management
- Responsive grid behavior
- Gap and spacing utilities
- Alignment and distribution options

Grids are essential for creating responsive, multi-column layouts with precise control.

## Example

```html
<ds-grid columns="3" gap="medium">
  <ds-card>Card 1</ds-card>
  <ds-card>Card 2</ds-card>
  <ds-card>Card 3</ds-card>
</ds-grid>
```
