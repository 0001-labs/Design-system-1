---
title: Native controls
description: The components' look as plain classes on native elements, and the stylesheets pages copy
---

`controls.css` draws the components on native elements for pages without Lit: static pages, single-file tools and forms that must stay native. Each class reads the same `--ds-*` tokens as its element, so the two look alike, and the element keeps its own semantics, labels, form data and events.

| Class | On | Draws |
| --- | --- | --- |
| `ds-button`, with `ds-button--primary`, `--secondary`, `--icon`, `--fixed`, `--wide` | `<button>`, or `<a href>` for a link drawn as a button | The Button: hugs its label, one control high; `fixed` is four squares, `wide` fills its row. On a link it never takes the link's underline or colours; a disabled link has no `href` and carries `aria-disabled="true"`. |
| `ds-link` | `<a href>` in text | A [text link](/2-core/link/): the text's ink, a hairline underline that darkens under the pointer, a muted visited ink and the focus ring. |
| `ds-input` | `<input>` | A field one control high. |
| `ds-textarea` | `<textarea>` | A field of whole rows; `--ds-textarea-rows` sets how many, three by default. |
| `ds-select` | `<select>` | A field with the chevron drawn in its text colour. |
| `ds-checkbox`, `ds-radio` | `<input type="checkbox">`, `<input type="radio">` | 12px native choices in the text colour. |
| `ds-switch`, with `ds-switch--rounded` | `<button role="switch" aria-checked>` | The Switch: two control heights wide, its thumb travelling one. The page toggles `aria-checked`. |
| `ds-tabs`, with `ds-tabs--fill` | a row of `.ds-button` | The Tabs row. With `role="group"` it is a segmented control: the choices grey, the chosen one (`aria-pressed`, `aria-selected` or `aria-current`) in the accent. |
| `ds-dialog` | `<dialog>` | The Dialog's frame: twenty squares wide, a square of padding, a hairline, the paper and a dimmed backdrop. Mark its parts with `data-ds-dialog="header"`, `title`, `description`, `footer` and `close`, as inside the element. |
| `ds-menu`, `ds-menu__item` and its parts | a menu a library draws | The Menu; an item may be a `<button>`, which keeps the row's look. |
| `ds-table`, in `ds-table-scroll` to scroll sideways | `<table>` | The [Table](/3-unit/table/): rows one square high on hairlines, no box or column lines; `data-sticky`, `data-numeric` and `aria-selected` as there. From `table.css`, which controls.css imports. |
| `ds-empty`, with `ds-empty__icon`, `__title`, `__text`, `__actions` and `ds-empty--centered` | a `<section>` or `<div>`, its parts on native text and a row of buttons | The [Empty state](/2-core/empty/): a title in the medium face and muted text on one-square lines, at most sixteen squares wide, the actions one square below. No box and no picture. From `empty.css`, which controls.css imports. |
| `ds-notice`, with `ds-notice__mark`, `__title`, `__text`, `__actions`, `__dismiss` and `ds-notice--success`, `--warning`, `--danger` | a `<div>` with `role="status"`, or `role="alert"` for danger | The [Notice](/2-core/notice/): a square mark one control high in the tone's colour, the words beside it on one-square lines, the actions below and a `.ds-button--icon` dismiss at the end of the first line; danger words in `--ds-danger-color`. From `notice.css`, which controls.css imports. |
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

<div class="ds-notice ds-notice--warning" role="status">
  <span class="ds-notice__mark" aria-hidden="true"></span>
  <p class="ds-notice__text">Unsaved changes are stored on this device.</p>
</div>
<section class="ds-empty">
  <h2 class="ds-empty__title">Nothing here yet</h2>
  <p class="ds-empty__text">Items you add appear here.</p>
</section>
```

## Copying the stylesheets

Products copy these files with Sync 1, from the exports in `sync.exports.mjs`:

- `tokens` copies the component tokens; `"nativeControls": true` adds `controls.css` with the table, text, empty-state and notice classes it imports (`table.css`, `text.css`, `empty.css`, `notice.css`), `"prose": true` adds the [prose sheet](/1-root/prose/) (`prose.css`), `"classless": true` adds the classless sheet (`one.semantic.css`), and `"bundle": true` writes them all as one `bundle.css` with their imports resolved, for a page that can carry only one stylesheet or inlines its styles.
- `root` copies `one.css` with `grid.css`, the text classes and the component tokens it imports, and the faces it loads into `fonts/`. `"styles"` names the stylesheets to copy when a product loads only some (`["grid.css"]`, or `[]` for scripts alone), `"fonts": false` leaves the faces to the product, `"nativeControls": true` adds `controls.css` and the `table.css`, `empty.css` and `notice.css` it imports, `"prose": true` and `"classless": true` add `prose.css` and `one.semantic.css` (which `"styles"` may also name), and `"modules"` adds page scripts from `0-face/` (`grid`, `grid-fit`, `layout-inspector`, `scaling`, `theme-bootstrap`, `tooltips`) with the modules they import. `scaling` puts the phone scale on the page ([Scaling](/1-root/scaling/)); `theme-bootstrap` is the classic script that puts the theme on before the first paint ([Theming](/1-root/theming/#before-the-first-paint)). `text.css` comes with `one.css` or `controls.css`, which import it.
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
