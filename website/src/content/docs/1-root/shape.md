---
title: Shape
description: Square, rounded or circular corners on every component, the reader's choice, remembered and put on the page before it paints
---

A reader can choose the corners every component draws: **Square**, **Rounded** or **Circular**. The choice is remembered and put on the page before its first paint, like a theme (`DS1/0-face/shape.ts`).

<ds-cycle type="shape" label="Shape"></ds-cycle>

## The three shapes

The shape goes on the root as `data-ds-shape`, which the components read (`1-root/component-appearance.css`):

| Shape | `data-ds-shape` | Corners |
| --- | --- | --- |
| Square | `square` | None: `--ds-corner-size: 0px` |
| Rounded | `rounded` | 4px, or 8px squircles where the browser draws `corner-shape: squircle`, which needs twice an arc's radius for the same corner |
| Circular | `circular` | Pills: `--ds-corner-size: 999px`, true semicircles in every browser |

Each shape also sets `--ds-button-inset`, so a button's inner line keeps its distance from the corner. Until a reader chooses, the root carries no shape and the components keep their own corners, or the product's `shapeDefault`.

## Offering it

```html
<ds-cycle type="shape" label="Shape"></ds-cycle>
```

A [Cycle](/2-core/cycle/) with `type="shape"` steps through the three, with their names in every language. A footer offers it with `<ds-footer preferences="theme shape">`.

From code:

```javascript
import { getShape, setShape } from "@0001-labs/design-system-1";

setShape("circular");
getShape(); // "circular"
```

`getShape()` gives the shape in effect: the stored choice, else `shapeDefault`, else `rounded`, the components' own corners. A change dispatches `shape-changed` on `window` with `{ shape }`, and another tab's choice is put on the page as soon as it is stored.

## Before the first paint

The head script that puts the theme on before the first paint (`0-face/theme-bootstrap.js`, see [Theming](/1-root/theming/)) puts the shape on too, so a page never paints with one shape and changes to another. Imported without it, `shape.ts` installs the same runtime itself.

Set the options on `window.DS_ONE_PREFERENCES` before that script:

| Option | Default | What it does |
| --- | --- | --- |
| `shapeDefault` | none | The shape for a reader who has chosen none; without it the components keep their own corners |
| `shapeStorageKey` | `"ds-one:shape"` | Where the choice is stored |

```html
<script>
  window.DS_ONE_PREFERENCES = { shapeDefault: "square" };
</script>
```

A product sets `shapeDefault` for its look and leaves the rest to the reader; it never writes its own shape setting or overrides the components' corners.
