---
title: Scaling
description: The page's scale, --sf, for phones and tablets, put on before the first paint
---

Every measure in Design system 1 is a number of squares multiplied by `--sf`. The scaling module (`DS1/0-face/scaling.ts`) works the scale out and puts it on the page.

## The rule

- **A computer stays at 1**, however narrow its window. A narrow window rearranges the layout with media queries; it does not scale.
- **A phone or a tablet** is drawn as if the screen were 280 units wide: the scale is the page's width (without its scroll bar) over 280, never under 0.75 or over 2. A 375px phone gets 1.339, so everything is a third larger.
- A phone or tablet is a mobile browser, or a screen that takes touch and whose shorter side is at most 820px. The [Device](/1-root/device/) module uses the same rule.

## On a phone or a tablet

A phone is always fourteen squares wide. 280 units are fourteen squares of 20, so the square grows with the screen instead of more squares fitting on it: a wider phone draws the same page larger, never a different one. Everything written in squares or multiplied by `--sf` grows by the same factor (the square, the type, the rows, the corners, the gaps), so the page keeps its proportions on every phone.

| Screen | `--sf` | A square | 14px type | Squares across |
| --- | --- | --- | --- | --- |
| 320px | 1.143 | 22.86px | 16px | 14 |
| 375px | 1.339 | 26.79px | 18.75px | 14 |
| 390px | 1.393 | 27.86px | 19.5px | 14 |
| 402px | 1.436 | 28.71px | 20.1px | 14 |
| 430px | 1.536 | 30.71px | 21.5px | 14 |
| 768px | 2 | 40px | 28px | 19.2 |
| A computer, any width | 1 | 20px | 14px | the window's width over 20 |

- **The scale stops at 2.** From 560px across, a tablet or a phone turned on its side keeps a 40px square and gains squares instead, so the layout's wider arrangements (its media queries) take over there as they do on a computer.
- **It does not go under 0.75.** Below 210px the square stays at 15px rather than shrink further, so fewer than fourteen fit across.
- **It follows the screen.** Turning the phone or resizing a split-screen view on a tablet works the scale out again at once, from the page's width without its scroll bar.
- **Media queries still read CSS pixels.** `--sf` changes what a square measures, not the width the browser reports, so a 375px phone still matches `max-width: 700px`. Use the widths to choose an arrangement and `[data-mobile]` for what differs on a touch screen.
- **Hairlines stay one pixel.** A border is the one length not multiplied by `--sf`.

Without `snap` the scale keeps three decimals, so a square on a 375px phone is 26.79px and long runs of rows can drift off the lines a little. `"layout"` gives 1.3390625 there, a square of exactly 1714 layout steps. `"pixel"` on a screen of three device pixels to the pixel gives 1.333, a square of 80 device pixels (26.67px), so every line falls on a whole pixel.

## Put it on the page

Call `startScaling()` before the page renders, so the first paint is already to scale:

```ts
import { startScaling } from './ds1/0-face/scaling';

startScaling();
```

It sets `--sf` on the root element, and `data-mobile` on a phone or tablet, and follows every resize and turn of the screen. It returns a function that stops following. `applyScaling()` does the same once and returns the factor.

| Option | Default | What it does |
| --- | --- | --- |
| `snap` | none | `"layout"` rounds the scale so a square is a whole number of the 1/64px steps browsers lay pages out in; long runs of rows stay on lines drawn exactly. `"pixel"` rounds it down so a square is a whole number of device pixels, which keeps every grid line and hairline sharp. |
| `baseWidth`, `minScale`, `maxScale` | 280, 0.75, 2 | The rule above. |
| `mode` | `"auto"` | `"fixed"` keeps the scale at 1. |
| `root` | the document's root | The element that receives `--sf` and `data-mobile`. With an element `surface`, the element that receives that surface's `--sf`. |
| `surface` | none | Scale a surface to its own width instead; see below. |

```ts
startScaling({ snap: 'layout' });
```

## A surface with a scale of its own

A phone drawn on a page, such as a prototype in a frame, scales to its own width rather than the window's, on any device, a computer too:

```ts
startScaling({ surface: document.querySelector('.phone'), snap: 'pixel' });
// Or every element marked data-ds-surface:
startScaling({ surface: true });
```

```html
<div class="phone" data-ds-surface>…</div>
```

The surface is measured by its `clientWidth` and scaled by the same rule (its width over 280, between 0.75 and 2) and the same `snap`. `--sf` goes on the surface, and `--ds-sf` with it, so the shared components inside draw at the surface's scale; the page's `--sf` and `data-mobile` are left alone. Marked `data-ds-surface`, the surface's own `--ds-unit` spacing follows too. `startScaling` follows each surface's size through a `ResizeObserver` as well as the window's resizes and turns, and finds the `data-ds-surface` elements once, when it is called. `applyScaling({ surface })` does it once and returns the first surface's factor.

The surface's width must not depend on its own `--sf`: give it a width of the page around it (a percentage, a fixed frame, the viewport), and draw everything inside it in squares.

`toLayoutStep(factor)`, `toDevicePixel(factor, pixelRatio)` and `calculateScalingFactor(width, config)` are the calculations alone.

## In the styles

Write lengths as squares or `calc(Npx * var(--sf))`, never bare pixels, except hairlines. `[data-mobile]` on the root marks a phone or tablet for the few rules that differ there.

Shared components read their own `--ds-sf`, which stays 1 so an embedded document keeps its scale. A page whose components follow the phone's scale sets it from the page's:

```css
:root {
  --ds-sf: var(--sf);
}
```

## The margin after scaling

Once the square is the phone's, the page's margins are worked out in those squares, not in pixels. A phone fourteen squares wide gets a column of twelve with one square on each side, at every phone width.

The column is whole squares, never more than its measure, with at least a square beside it on each side, and an even number of squares, so the page's centre falls on a line and both of its edges do too:

```css
body {
  --column: min(
    calc(28 * var(--unit)),
    calc(2 * round(down, (100% - 2 * var(--unit)) / 2, var(--unit)))
  );
}
main {
  padding-inline: calc((100% - var(--column)) / 2 - var(--ds-page-bleed));
}
```

`--unit` is one square, `calc(20px * var(--sf))`. On a 768px tablet, at a 40px square, the room is 19.2 squares: the column takes sixteen and the 1.6 squares left on each side are shared equally, so the column stays centred on the grid.

On a phone the content then stands a little past the column's edges, by `--ds-page-bleed`, while the column and the grid's lines stay where they are. Lists and prose get a slightly longer line on the narrowest screens, with the square of margin still reading as the page's edge:

```css
:root {
  --ds-page-bleed: 0px;
}
@media (max-width: 700px) {
  :root {
    --ds-page-bleed: calc(4px * var(--sf));
  }
}
```

The bleed is multiplied by `--sf` like every other measure, so it is 5.36px on a 375px phone. [Page](/4-page/page/) takes the same `--ds-page-bleed`: its padding is a square less the bleed, and its column grows by the bleed on each side.

## Copying it

The module imports nothing. Sync 1's `root` export copies it alone with `"modules": ["scaling"]`, as `0-face/scaling.ts` (`"scriptsTo"` puts it in a folder apart from the stylesheets); see [Root](/1-root/overview/).
