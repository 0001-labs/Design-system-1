---
title: Native controls
description: The components' look as plain classes on native elements, and the stylesheets pages copy
---

`controls.css` draws the components on native elements for pages without Lit: static pages, single-file tools and forms that must stay native. Each class reads the same `--ds-*` tokens as its element, so the two look alike, and the element keeps its own semantics, labels, form data and events.

| Class | On | Draws |
| --- | --- | --- |
| `ds-button`, with `ds-button--primary`, `--secondary`, `--icon`, `--fixed`, `--wide` | `<button>` | The Button: hugs its label, one control high; `fixed` is four squares, `wide` fills its row. |
| `ds-input` | `<input>` | A field one control high. |
| `ds-textarea` | `<textarea>` | A field of whole rows; `--ds-textarea-rows` sets how many, three by default. |
| `ds-select` | `<select>` | A field with the chevron drawn in its text colour. |
| `ds-checkbox`, `ds-radio` | `<input type="checkbox">`, `<input type="radio">` | 12px native choices in the text colour. |
| `ds-switch`, with `ds-switch--rounded` | `<button role="switch" aria-checked>` | The Switch: two control heights wide, its thumb travelling one. The page toggles `aria-checked`. |
| `ds-tabs`, with `ds-tabs--fill` | a row of `.ds-button` | The Tabs row. With `role="group"` it is a segmented control: the choices grey, the chosen one (`aria-pressed`, `aria-selected` or `aria-current`) in the accent. |
| `ds-dialog` | `<dialog>` | The Dialog's frame: twenty squares wide, a square of padding, a hairline, the paper and a dimmed backdrop. Mark its parts with `data-ds-dialog="header"`, `title`, `description`, `footer` and `close`, as inside the element. |
| `ds-menu`, `ds-menu__item` and its parts | a menu a library draws | The Menu; an item may be a `<button>`, which keeps the row's look. |
| `ds-text`, with `ds-text--small`, `--heading`, `--display`, `--strong`, `--muted`, `--title`, `--danger` | native text: `<p>`, `<h1>`–`<h6>`, `<span>`, `<label>` | The [Text](/2-core/text/) element's look, on one-square lines. These come from `text.css`, which `controls.css` and `one.css` import. |

Writing that stays native, such as an article or a landing page's story, takes the [prose sheet](/1-root/prose/) rather than a class on every element.

```html
<link rel="stylesheet" href="/ds1/controls.css" />

<div class="ds-tabs" role="group" aria-label="View">
  <button class="ds-button" aria-pressed="true">List</button>
  <button class="ds-button" aria-pressed="false">Board</button>
</div>
<button class="ds-switch" role="switch" aria-checked="false" aria-label="Grid"></button>
<textarea class="ds-textarea" name="description"></textarea>
```

## Copying the stylesheets

Products copy these files with Sync 1, from the exports in `sync.exports.mjs`:

- `tokens` copies the component tokens; `"nativeControls": true` adds `controls.css` with the text classes it imports (`text.css`), `"prose": true` adds the [prose sheet](/1-root/prose/) (`prose.css`), `"classless": true` adds the classless sheet (`one.semantic.css`), and `"bundle": true` writes them all as one `bundle.css` with their imports resolved, for a page that can carry only one stylesheet or inlines its styles.
- `root` copies `one.css` with `grid.css`, the text classes and the component tokens it imports, and the faces it loads into `fonts/`. `"styles"` names the stylesheets to copy when a product loads only some (`["grid.css"]`, or `[]` for scripts alone), `"fonts": false` leaves the faces to the product, `"nativeControls": true` adds `controls.css`, `"prose": true` and `"classless": true` add `prose.css` and `one.semantic.css` (which `"styles"` may also name), and `"modules"` adds page scripts from `0-face/` (`grid`, `grid-fit`, `layout-inspector`, `scaling`, `tooltips`) with the modules they import. `text.css` comes with `one.css` or `controls.css`, which import it.
- `fonts` copies named faces, including the root faces such as `GT-America-Standard-Regular.woff2` and `Iosevka-Regular.woff2`.

```json
{
  "sources": {
    "Design system 1": {
      "root": { "to": "web/ds1", "nativeControls": true, "prose": true, "modules": ["tooltips"] }
    }
  }
}
```
