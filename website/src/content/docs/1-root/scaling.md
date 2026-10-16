---
title: Scaling
description: The page's scale, --sf, for phones and tablets, put on before the first paint
---

Every measure in Design system 1 is a number of squares multiplied by `--sf`. The scaling module (`DS1/0-face/scaling.ts`) works the scale out and puts it on the page.

## The rule

- **A computer stays at 1**, however narrow its window. A narrow window rearranges the layout with media queries; it does not scale.
- **A phone or a tablet** is drawn as if the screen were 280 units wide: the scale is the page's width (without its scroll bar) over 280, never under 0.75 or over 2. A 375px phone gets 1.339, so everything is a third larger.
- A phone or tablet is a mobile browser, or a screen that takes touch and whose shorter side is at most 820px. The [Device](/1-root/device/) module uses the same rule.

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
| `root` | the document's root | The element that receives `--sf` and `data-mobile`. |

```ts
startScaling({ snap: 'layout' });
```

`toLayoutStep(factor)`, `toDevicePixel(factor, pixelRatio)` and `calculateScalingFactor(width, config)` are the calculations alone.

## In the styles

Write lengths as squares or `calc(Npx * var(--sf))`, never bare pixels, except hairlines. `[data-mobile]` on the root marks a phone or tablet for the few rules that differ there.

Shared components read their own `--ds-sf`, which stays 1 so an embedded document keeps its scale. A page whose components follow the phone's scale sets it from the page's:

```css
:root {
  --ds-sf: var(--sf);
}
```

## Copying it

The module imports nothing. Sync 1's `root` export copies it alone with `"modules": ["scaling"]`, as `0-face/scaling.ts`; see [Native controls](/1-root/native-controls/#copying-the-stylesheets).
