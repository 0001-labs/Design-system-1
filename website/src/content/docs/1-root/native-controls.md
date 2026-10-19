---
title: Native controls
description: The components' look as plain classes on native elements, and the stylesheets pages copy
---

`controls.css` draws the components on native elements for pages without Lit: static pages, single-file tools and forms that must stay native. Each class reads the same `--ds-*` tokens as its element, so the two look alike, and the element keeps its own semantics, labels, form data and events.

| Class | On | Draws |
| --- | --- | --- |
| `ds-button`, with `ds-button--primary`, `--secondary`, `--danger`, `--icon`, `--fixed`, `--wide` | `<button>`, or `<a href>` for a link drawn as a button | The Button: hugs its label, one control high; `fixed` is four squares, `wide` fills its row; `danger` puts a destructive action's words in the danger colour. On a link it never takes the link's underline or colours; a disabled link has no `href` and carries `aria-disabled="true"`. |
| `ds-link` | `<a href>` in text | A [text link](/2-core/link/): the text's ink, a hairline underline that darkens under the pointer, a muted visited ink and the focus ring. |
| `ds-input` | `<input>` | A field one control high. |
| `ds-input` on a `<textarea>` | `<textarea>` | A multiline field of whole rows; `--ds-textarea-rows` sets how many, three by default. |
| `ds-select` | `<select>` | A field with the chevron drawn in its text colour. Without scripts the platform's picker opens; the [Select](/3-unit/select/) element draws its own list. |
| `ds-checkbox`, `ds-radio` | `<input type="checkbox">`, `<input type="radio">` | The `ds-checkbox` and `ds-radio` faces: one square on the field's ground with a 1px line; the checkbox fills with the accent and shows the check, the radio a dot half a square across. |
| `ds-switch`, with `ds-switch--rounded` | `<button role="switch" aria-checked>` | The Switch: two control heights wide, its thumb travelling one. The page toggles `aria-checked`. |
| `ds-range` | `<input type="range">` | A slider one control high on the lower sixteen of its square, eight squares wide: a 1px line across its middle and a thumb one control high and half a control wide in the ink. See [Range](#range). |
| `ds-tabs`, with `ds-tabs--fill` | a row of `.ds-button` | The Tabs row. With `role="group"` it is a segmented control: the choices grey, the chosen one (`aria-pressed`, `aria-selected` or `aria-current`) in the accent. |
| `ds-overlay` | `<dialog>` | The Overlay's frame, a modal: twenty squares wide, a square of padding, a hairline, the paper and a dimmed backdrop. Mark its parts with `data-ds-overlay="header"`, `title`, `description`, `footer` and `close`, as inside the element, and a field with `field`, its label with `label`. The [feedback module](/1-root/feedback/) draws `confirm()`, `prompt()` and `alert()` on it. `ds-overlay--sheet` stands it at the foot of the screen with a handle, `--drawer` (with `--start` for the start side) as a drawer, `--screen` over the whole screen; `bindOverlaySwipe()` from `0-face/overlay-swipe.ts` lets a finger swipe a sheet or drawer away ([Sheets and drawers](/4-page/overlay/#sheets-and-drawers)). From `overlay.css`, which controls.css imports. |
| `ds-menu`, `ds-menu__item` and its parts | a menu a library draws | The face of a [Select](/3-unit/select/)'s menu for a library that draws its own, on whole squares: half a square inside its line on each side, no shadow, entries one square high with nothing between them and a separator one square with its line, so n entries are n + 1 squares high. An item may be a `<button>`, which keeps the row's look; a library's own button or link directly in the menu (or in a `role="group"` in it) is held to one square whatever its styles say. |
| `ds-context`, with `ds-context__item` (`--danger`), `__label`, `__shortcut` and `__separator` | a context menu the page or a library draws | The [Context](/3-unit/context/)'s gap face: black rows with white words in both themes (the slate in dark); rows 19px a pixel apart and groups two (a separator, an `hr` or `role="separator"`, is a gap, never a line, and a first, last or doubled one is quiet); the outer corners rounded as one silhouette; words on the sixteen, an icon or shortcut at the row's end; hover lighter, keyboard focus ringed, danger red, `data-ds-refused` red. The page places it and owns its keys. From `context.css`, which controls.css imports. |
| `ds-table`, in `ds-table-scroll` to scroll sideways | `<table>` | The [Table](/3-unit/table/): rows one square high on hairlines, no box or column lines; `data-sticky`, `data-numeric` and `aria-selected` as there. From `table.css`, which controls.css imports. |
| `ds-empty`, with `ds-empty__icon`, `__title`, `__text`, `__actions` and `ds-empty--centered` | a `<section>` or `<div>`, its parts on native text and a row of buttons | The [Empty state](/2-core/empty/): a title in the medium face and muted text on one-square lines, at most sixteen squares wide, the actions one square below. No box and no picture. From `empty.css`, which controls.css imports. |
| `ds-notice`, with `ds-notice__mark`, `__title`, `__text`, `__actions`, `__dismiss` and `ds-notice--success`, `--warning`, `--danger` | a `<div>` with `role="status"`, or `role="alert"` for danger | The [Notice](/2-core/notice/): a square mark one control high in the tone's colour, the words beside it on one-square lines, the actions below and a `.ds-button--icon` dismiss at the end of the first line; danger words in `--ds-danger-color`. From `notice.css`, which controls.css imports. |
| `ds-header`, with `ds-header__brand`, `__nav`, `__actions`, `__toggle` and `ds-header--sticky` | a `<header>`, its links in a `<nav>` | The [Header](/4-page/header/): one row of one square, the links over the work, folding into a drawer (`dialog.ds-overlay.ds-overlay--screen`, from `drawer.css`) on a narrow screen, opened by the page script `0-face/header.ts`. From `header.css`, which controls.css imports. |
| `ds-footer`, with `ds-footer__brand`, `__mark`, `__tagline`, `__columns`, `__column`, `__heading`, `__links`, `__base`, `__legal`, `__preferences` | a `<footer>` | The [Footer](/4-page/footer/): the brand in twelve squares, columns of eight, the legal line and preferences two squares below. From `footer.css`, which controls.css imports. |
| `ds-document`, with `ds-document__toc`, `__contents`, `__toc-title`, `__toc-list`, `__toc-sub`, `__body`; `ds-definitions` | a `<div>` around a `<nav>` and the writing; a `<dl>` | The [Document](/4-page/document/): contents in twelve squares that stay in view beside a reading column of thirty-two, and the definition table of a legal notice. From `document.css`, which controls.css imports. |
| `ds-carousel`, with `ds-carousel__track`, `__controls`, `__previous`, `__next`, `__status` | a `<section>` or `<div>` around a track of slides and a row of controls | The [Carousel](/3-unit/carousel/): slides that snap sideways, the track's width or `--ds-carousel-slide` wide and `--ds-carousel-gap` apart (one square), the controls one square below in one-square cells. `startCarousels()` from `0-face/carousel.ts` gives it the dots, buttons, keyboard and announcement. From `carousel.css`, which controls.css imports. |
| `ds-pagedots`, with `ds-pagedots__dot` and `data-state` | a `<div role="group">` of `<button>`s | The [Page dots](/2-core/pagedots/): a dot one square each, the current one filled and larger, past and next filled, the rest rings, `end` a ring in the text colour. From `carousel.css`. |
| `ds-stat`, with `ds-stat__label`, `__icon`, `__figure`, `__digit`, `__caption`, `__change`, `ds-stat--danger`, `--warning`, and `ds-stats` around a group | a `<div>` or `<li>`, its parts on native text | The [Stat](/2-core/stat/): a muted label on one square, the figure in tabular numerals on two and a caption on one; a group in columns eight squares wide. From `figures.css`, which controls.css imports. |
| `ds-meter`, with `ds-meter__fill`, `ds-meter--squares` and `ds-meter__square` (`--on`), `ds-meter--over` | a `<span>` with `role="meter"` and its ARIA values | The [Meter](/2-core/meter/): one square high, a bar half a square high filled to `--ds-meter-value`, or the range in squares; over in the danger colour. From `figures.css`. |
| `ds-steps`, with `ds-steps__step` (`--done`, `--current`, `--failed`), `__link`, `__mark`, `__label`, `__state`, `__body` and `ds-steps--vertical` | an `<ol>` of `<li>`, `aria-current="step"` on the current one | The [Steps](/2-core/steps/): numbered marks one control high, each step on whole squares joined by a line, or one to a square. From `figures.css`. |
| `ds-row`, with `ds-row--auto`, `--stacked`, `--nav` and the part `ds-row__target` | any element; `<a href>` or `<button>` for a row a person presses; a `<li>`, `<div>` or `<tr>` holding one `ds-row__target` | The [Row](/3-unit/row/): one square high. On a link or a button the whole row is one press target with the pointer, press, focus ring and `aria-current` states; with a target inside, the target takes the press anywhere on the row and other controls in it stay their own. From `row.css`, which controls.css imports. |
| `ds-sidebar`, with `ds-sidebar__item`, `__disclosure`, `__label` and `__meta` | a `role="tree"` list of flat `role="treeitem"` rows with `aria-level` | The [Sidebar's tree](/3-unit/sidebar/#tree): rows one square high, one square further in per level, the arrow and an icon each on a square. `connectSidebar()` from `0-face/sidebar.ts` gives it the keyboard. From `row.css`, which controls.css imports. |
| `ds-text`, with `ds-text--small`, `--heading`, `--display`, `--strong`, `--muted`, `--title`, `--warning`, `--danger` | native text: `<p>`, `<h1>`–`<h6>`, `<span>`, `<label>` | The [Text](/2-core/text/) element's look, on one-square lines. These come from `text.css`, which `controls.css` and `one.css` import. |
| `ds-field`, with `ds-field--beside` and the parts `ds-field__label`, `ds-field__hint`, `ds-field__error` | a `<div>` or `<label>` around a native control | The label row the [Input](/2-core/input/) draws: the label on a one-square line above the control, or four squares beside it, a muted hint and an error in the danger colour. See [Field](#field). |
| `ds-avatar`, with `ds-avatar--large`, `--square`, `--pair`, `--outlined`, `--pending` | `<span>` holding an initial, and an `<img alt="">` | The [Avatar](/2-core/avatar/): round and one control high, two squares large, or square with a picture's corners. See [Avatar](#avatar). |
| `ds-badge`, with `ds-badge--icon` | `<span>` | The [Badge](/2-core/badge/): a status one square high on the fill, its width rounded up to whole squares where the browser can. See [Badge](#badge). |
| `ds-toggle` | `<button class="ds-button" aria-pressed>` | A toggle button: the secondary face while it is off, the accent while it is on. See [Toggle button](#toggle-button). |
| `ds-icon`, with `ds-icon--small`, `--large` | `<span>`, naming its file in `--ds-icon` | The [Icon](/2-core/icon/): an icon file as a mask in the text colour, 14, 12 or 16px. See [Icon](#icon). |
| `ds-drop`, with `ds-drop--compact`; `ds-button` on a `<label>` | `<label>` around `<input type="file">` | The [File picker](/2-core/file-picker/)'s area, eight squares high (four compact), or its button. See [Drop zone](#drop-zone). |

Writing that stays native, such as an article or a landing page's story, takes the [prose sheet](/1-root/prose/) rather than a class on every element.

```html
<link rel="stylesheet" href="/ds1/controls.css" />

<div class="ds-tabs" role="group" aria-label="View">
  <button class="ds-button" aria-pressed="true">List</button>
  <button class="ds-button" aria-pressed="false">Board</button>
</div>
<button class="ds-switch" role="switch" aria-checked="false" aria-label="Grid"></button>
<textarea class="ds-input" name="description"></textarea>

<div class="ds-notice ds-notice--warning" role="status">
  <span class="ds-notice__mark" aria-hidden="true"></span>
  <p class="ds-notice__text">Unsaved changes are stored on this device.</p>
</div>
<section class="ds-empty">
  <h2 class="ds-empty__title">Nothing here yet</h2>
  <p class="ds-empty__text">Items you add appear here.</p>
</section>
```

## Field

A label row for any native control, as the Input draws its label. Every row is one square high; a control lower than that stands centred on its row, and a text area spans whole rows. The hint is in the muted ink and the error in the danger colour, each on one-square lines.

```html
<div class="ds-field">
  <label class="ds-field__label" for="email">Email</label>
  <input class="ds-input" id="email" type="email" aria-describedby="email-hint email-error" />
  <p class="ds-field__hint" id="email-hint">We send the sign-in code here.</p>
  <p class="ds-field__error" id="email-error" role="status"></p>
</div>

<label class="ds-field ds-field--beside">
  <span class="ds-field__label">Price</span>
  <input class="ds-input" name="price" inputmode="decimal" />
</label>
```

An empty hint or error takes no room, so keep the error in the page and write into it, and set `aria-invalid="true"` on the control while it shows. Point the control's `aria-describedby` at the hint and the error. Words inside a wrapping `<label>` become part of the control's name, so a field with a hint is a `<div>` whose label names the control with `for`. `ds-field--beside` sets the label in a column four squares wide, with the hint and error under the control; `--ds-field-label-width` changes the column and `--ds-field-label-color` the label's ink.

## Avatar

A person's or workspace's mark, one control high, round unless it is square.

```html
<span class="ds-avatar" role="img" aria-label="Ana">A</span>
<span class="ds-avatar ds-avatar--pair" aria-hidden="true">高橋</span>
<span class="ds-avatar ds-avatar--large ds-avatar--square" role="img" aria-label="Studio">
  S<img src="/workspaces/studio.png" alt="" onerror="this.remove()" />
</span>
<span class="ds-avatar ds-avatar--outlined" style="--ds-avatar-background: var(--ds-apple-green); --ds-avatar-color: var(--ds-black)" aria-hidden="true">J</span>
```

A picture goes after the initial and covers it. The initial shows while the picture loads; remove a picture that fails, as the element does, or the browser draws its broken-image mark. `ds-avatar--large` is two squares, `--pair` fits two characters, `--square` takes a picture's corners (`--ds-avatar-radius`), `--outlined` draws the hairline in the avatar's ink and `--pending` greys out someone who has not accepted yet. `--ds-avatar-background` fills it with a colour and `--ds-avatar-color` letters it: on a fill, use `--ds-black` or `--ds-white`, whichever reads (the element works this out from `color`). A mark that stands for someone has `role="img"` and an `aria-label`; one beside the name is `aria-hidden="true"`.

## Badge

A status, not a button: it adds no tab stop.

```html
<span class="ds-badge">Draft</span>
<span class="ds-badge">
  <span class="ds-icon" style="--ds-icon: url(/icons/lock.svg)" aria-hidden="true"></span>Password on
</span>
<span class="ds-badge ds-badge--icon" data-tooltip="Archived">
  <span class="ds-icon" style="--ds-icon: url(/icons/archive.svg)" aria-hidden="true"></span><span>Archived</span>
</span>
```

Its words are cut short with an ellipsis when its row is too narrow. Its width rounds up to whole squares in browsers that can size to content in `calc-size()`; elsewhere it hugs its words. `ds-badge--icon` is one square wide and shows only the icon: keep the words in an element of their own, for assistive technology. `--ds-badge-background` and `--ds-badge-color` give a status a meaningful colour.

## Toggle button

A button that stays pressed until it is pressed again: a panel shown, a mode, a track muted.

```html
<button class="ds-button ds-toggle" type="button" aria-pressed="false">Timeline</button>
<button class="ds-button ds-button--icon ds-toggle" type="button" aria-pressed="true" aria-label="Sound">
  <span class="ds-icon" style="--ds-icon: url(/icons/audio.svg)" aria-hidden="true"></span>
</button>
```

The page flips `aria-pressed` when it is clicked. The words stay the same in both states, so a screen reader says "Timeline, toggle button, pressed". Three controls look alike; pick by what the person is choosing:

| Class | On | Use it for |
| --- | --- | --- |
| `ds-switch` | `<button role="switch" aria-checked>` | A setting that is on or off and takes effect at once: notifications, a public link. |
| `ds-toggle` | `<button class="ds-button" aria-pressed>` | An action that stays on: show the timeline, mute a track, bold. |
| `ds-tabs` with `role="group"` | a row of `.ds-button` with `aria-pressed` | One of two or more choices: list or board; day, week or month. |

The rounded switch is [`<ds-switch rounded>`](/2-core/choice/#rounded): on a page without Lit it is `ds-switch ds-switch--rounded`. The `ds-toggle` class is the toggle button.

## Range

A value picked along a line: a playhead, a size, an amount of blur. The browser keeps the value, the arrow keys, Home and End, the form data and the `input` and `change` events.

```html
<label class="ds-field ds-field--beside">
  <span class="ds-field__label">Blur</span>
  <input class="ds-range" type="range" name="blur" min="0" max="20" step="1" value="4" />
</label>
<input class="ds-range" type="range" min="0" max="240" value="0" aria-label="Playhead" style="--ds-range-width: 100%" />
```

The control is one control high and keeps the square's spare four above it as a margin, so it takes one square on its own and stands on the sixteen in a row. The track is a 1px line through the middle of the control in the title grey; the thumb is one control high, half a control wide, with the shared corners, in the ink. It takes the focus ring and dims to half when disabled, as the other controls do, and nothing in it animates. WebKit and Blink draw it through `::-webkit-slider-*` and Firefox through `::-moz-range-*`, the same in both.

`--ds-range-width` sets its width (eight squares; `100%` fills its row), `--ds-range-track` the line's colour, `--ds-range-thumb` the thumb's and `--ds-range-thumb-width` the thumb's width. Name a range without a visible label with `aria-label`, and give it `aria-valuetext` when its number alone does not say what it means ("1.2 seconds").

## Icon

An icon from the library, painted in the text colour.

```html
<span class="ds-icon" style="--ds-icon: url(/icons/close.svg)" aria-hidden="true"></span>
<span class="ds-icon ds-icon--large" style="--ds-icon: url(/icons/up-right.svg)" aria-hidden="true"></span>
```

`--ds-icon` names the file as Sync 1's `icons` export copies it into the product: a path from the page in a `style` attribute, or from the stylesheet in a rule such as `.icon-close { --ds-icon: url("../icons/close.svg"); }`. It is 14px, 12px with `ds-icon--small` and 16px with `ds-icon--large`, times the scale, like the element's sizes; `--ds-icon-color` paints it another colour. The mask keeps only the drawing's shape, so an icon with colours of its own is an `<img>`. A decorative icon is `aria-hidden="true"`, and an icon alone in a button needs the button's `aria-label`. These rules carry no specificity: a page that already draws its own `.ds-icon` keeps its rule until it removes it.

```json
"icons": { "to": "web/ds1/icons", "icons": ["close", "up-right"] }
```

## Drop zone

The file picker's area on a native file input, or its button.

```html
<label class="ds-drop">
  Drop pictures here, or <span class="ds-button ds-button--primary">choose them</span>
  <input type="file" name="pictures" accept="image/*" multiple />
</label>

<label class="ds-button ds-button--secondary">
  Choose a file
  <input type="file" name="file" />
</label>
```

The input covers the zone unseen, so a click, the keyboard and a file dropped on it all reach the browser's own file input: `required`, `multiple`, `accept`, forms and reset work as always, and its `change` event brings the files. Keyboard focus draws the focus ring, and a disabled input dims the zone. `ds-drop--compact` is four squares high instead of eight. A `.ds-button` on a `<span>` inside draws a button face among the words; it is not a second button, as the whole zone is one. A file input directly inside a `label.ds-button` makes it the file picker's button, one square high.

A page that also takes files dropped on a larger surface marks the zone while files are over it, for the ring and the hover fill:

```js
const zone = document.querySelector('.ds-drop');
zone.addEventListener('dragenter', event => zone.toggleAttribute('data-dragging', event.dataTransfer.types.includes('Files')));
for (const type of ['dragleave', 'drop']) zone.addEventListener(type, () => zone.removeAttribute('data-dragging'));
```

## Copying the stylesheets

Products copy these files with Sync 1, from the exports in `sync.exports.mjs`:

- `tokens` copies the component tokens and the named colours (`palette.css`, the `--one-*` [colour tokens](/colours/#using-the-colours)); `"nativeControls": true` adds `controls.css` with the table, text, empty-state, notice, shortcut, dialog placement, site chrome and figure classes it imports (`table.css`, `text.css`, `empty.css`, `notice.css`, `kbd.css`, `overlay.css`, `header.css`, `drawer.css`, `footer.css`, `document.css`, `figures.css`), `"prose": true` adds the [prose sheet](/1-root/prose/) (`prose.css`), `"classless": true` adds the classless sheet (`one.semantic.css`), `"cjk": true` adds Noto Sans for Japanese and Chinese (`cjk.css`, see [Fonts](/1-root/fonts/#japanese-and-chinese)), and `"bundle": true` writes them all as one `bundle.css` with their imports resolved, for a page that can carry only one stylesheet or inlines its styles.
- `root` copies `one.css` with `grid.css`, the text classes, the component tokens, the faces and typeface tokens (`fonts.css`) and the named colours (`palette.css`) it imports, and the faces it loads into `fonts/`. `"styles"` names the stylesheets to copy when a product loads only some (`["grid.css"]`, `["fonts.css"]` for the faces alone, or `[]` for scripts alone), `"fonts": false` leaves the faces to the product, `"nativeControls": true` adds `controls.css` and the `table.css`, `empty.css`, `notice.css`, `kbd.css`, `overlay.css`, `header.css`, `drawer.css`, `footer.css`, `document.css` and `figures.css` it imports, `"prose": true`, `"classless": true` and `"cjk": true` add `prose.css`, `one.semantic.css` and `cjk.css` (which `"styles"` may also name), and `"modules"` adds page scripts from `0-face/` (`grid`, `grid-fit`, `layout-inspector`, `scaling`, `theme-bootstrap`, `tooltips`, `header`, `keys`, `overlay-swipe`) with the modules they import; `header` starts the [site header](/4-page/header/#without-lit)'s menu, `keys` is the [keyboard helpers](/1-root/keys/) and `overlay-swipe` lets a finger swipe a native sheet or drawer away. `scaling` puts the phone scale on the page ([Scaling](/1-root/scaling/)); `theme-bootstrap` is the classic script that puts the theme on before the first paint ([Theming](/1-root/theming/#before-the-first-paint)). `text.css` comes with `one.css` or `controls.css`, which import it, and `fonts.css` and `palette.css` with `one.css`.
- `fonts` copies named faces, including the root faces such as `GT-America-Standard-Regular.woff2` and `Iosevka-Regular.woff2`; `"stylesheet": true` adds `fonts.css`, pointed at the faces beside it, for a page that does not load `one.css`: with every face it loads, or with the faces `"fonts"` names and always Inter Arrows and Iosevka with their licences.
- `feedback` copies the [feedback module](/1-root/feedback/), toasts, promise dialogs and `copyText`, with everything it imports, by their paths in `DS1/`: plain TypeScript with no language runtime (`languages: true` adds it).

```json
{
  "sources": {
    "Design system 1": {
      "root": { "to": "web/ds1", "nativeControls": true, "prose": true, "modules": ["tooltips"] }
    }
  }
}
```

### Page scripts apart from the stylesheets

`root`'s `"modules"` also takes `theme`: the theme module (`theme.ts`, light, dark and system in signals, for a page without the components) with the head script it runs and its options type; it needs `@lit-labs/signals`. See [Theming](/1-root/theming/#copying-it).

The page scripts land in `0-face/` beside the stylesheets. A product that publishes its stylesheets from one folder and compiles its scripts from another names a second place with `"scriptsTo"`, a path from `"to"`: the scripts go to `<scriptsTo>/0-face/`. Without it, everything lands in one folder, as before.

```json
{
  "sources": {
    "Design system 1": {
      "root": { "to": "public/ds1", "styles": ["one.css", "grid.css"], "modules": ["grid", "scaling"], "scriptsTo": "../../src/ds1" }
    }
  }
}
```

Here the stylesheets and faces are copied to `public/ds1`, and `grid.ts`, `layout-inspector.ts`, `grid-fit.ts` and `scaling.ts` to `src/ds1/0-face`, where the page imports them.
