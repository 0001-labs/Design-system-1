---
title: Grid
description: 19px overlay grid used to align page layouts
---

`ds-grid` is a **fixed overlay**, not a content layout. Drop it on a page to see the 19px module that layouts, type, and components snap to.

<ds-grid align="center"></ds-grid>

## What it is

The overlay is a 1440×1280 CSS grid:

- **19px** tracks
- **1px** gaps
- **20px** module, matching `--1`
- Outline in `--sharp-blue` (light) / `--yellow` (dark)
- `pointer-events: none`, so it never blocks the page

On mobile it switches to **14 columns** and scales with `--sf`. That mobile track math is intentional — do not restyle it.

## Example

The overlay sits next to `ds-layout`. Named layout areas (`title`, `header`, `projects`, …) are independent of the overlay tracks.

```html
<ds-grid align="center"></ds-grid>

<ds-layout view mode="portfolio" align="center">
  <ds-text style="grid-area: title" text="Grid"></ds-text>
</ds-layout>
```

Local playground (same idea as the old debug pages): run `bun run dev` and open `/examples/grid.html`.

## Alignment

| Attribute | Values                         | Default    | Description                          |
| --------- | ------------------------------ | ---------- | ------------------------------------ |
| `align`   | `'left' \| 'center' \| 'right'` | `'center'` | Horizontal placement of the overlay |

```html
<ds-grid align="left"></ds-grid>
<ds-grid align="center"></ds-grid>
<ds-grid align="right"></ds-grid>
```

## With layout labels

Add `view` on `ds-layout` to label named areas on top of the overlay:

```html
<ds-layout view mode="portfolio" align="center"></ds-layout>
<ds-layout view mode="company" align="center"></ds-layout>
<ds-layout view mode="app" align="center"></ds-layout>
```

Modes: `portfolio`, `company`, `app`, `list`, `home`, `settings`.
