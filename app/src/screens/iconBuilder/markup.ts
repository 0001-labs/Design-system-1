import { PRODUCTS, drawingSvg } from '../../../../website/src/lib/icons/studio';
import { FIGMA_ICONS } from '../../../../website/src/lib/icons/gridIconFigma';

// The private host serves only the app shell, so the public favicon files are
// linked from the site itself.
const SITE = 'https://designsystem1.com';
const escape = (value: string) => value.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** A native button inside Design system 1's button face (`ds-button control="slotted"`), as React's `Button` draws it. */
const button = (attributes: string, content: string, host = '') => `<ds-button control="slotted"${host ? ' ' + host : ''}><button type="button" ${attributes}>${content}</button></ds-button>`;
/** A download link drawn as the button, as React's `ButtonLink` draws it. */
const link = (href: string, label: string, download = '') => `<ds-button control="slotted" secondary><a href="${href}" download${download ? `="${download}"` : ''}>${label}<ds-icon type="download" aria-hidden="true"></ds-icon></a></ds-button>`;
const icon = (type: string) => `<ds-icon type="${type}" aria-hidden="true"></ds-icon>`;
const heading = (title: string, aside = '') => `<div class="section-heading"><h2 class="ds-text ds-text--heading">${title}</h2>${aside}</div>`;
const note = (text: string, id = '') => `<p class="ds-text ds-text--small ds-text--muted"${id ? ` id="${id}"` : ''}>${text}</p>`;
const count = (text: string) => `<span class="ds-text ds-text--small ds-text--muted">${text}</span>`;
/** One choice of a segmented control (`ds-tabs role="group"`): the chosen one is `active` and pressed. */
const choice = (attributes: string, label: string, chosen: boolean, tooltip = '') =>
  button(`${attributes} aria-pressed="${chosen}"${tooltip ? ` data-tooltip="${escape(tooltip)}"` : ''}`, label, chosen ? 'active' : '');

/** The badge and favicon builder's page; `editor.ts` wires it by element ID. */
export function builderMarkup(): string {
  const products = PRODUCTS.map((preset, index) => button(
    `data-product="${preset.key}" aria-pressed="${index === 0}"`,
    `<span class="product-image">${drawingSvg(preset, 16, 'product-' + preset.key)}</span><span class="product-name">${escape(preset.name)}</span><span class="product-kind">${preset.key === 'fan' ? 'Original' : preset.key === 'design-system-1' ? 'Mosaic' : 'Concept'}</span>`,
    `choice class="product"${index === 0 ? ' active' : ''}`,
  )).join('');
  const originals = FIGMA_ICONS.map(preset => button(
    `data-original="${preset.key}" aria-pressed="false" aria-label="Edit ${escape(preset.name)}" data-tooltip="${escape(preset.name)}"`,
    drawingSvg({ name: preset.name, icon: preset.icon, radius: 0, padding: 0 }, 32, 'original-' + preset.key),
    'choice icon class="drawing-choice"',
  )).join('');
  const favicons = ['light', 'dark'].map(theme => `<div class="company-favicon"><img src="${SITE}/icons/0001-${theme}.svg" width="40" height="40" alt="0001 ${theme} favicon" /><span class="ds-text">${theme === 'light' ? 'Light' : 'Dark'}</span>${link(`${SITE}/icons/0001-${theme}.svg`, 'SVG')}${link(`${SITE}/icons/0001-${theme}.ico`, 'ICO')}</div>`).join('');
  return `<div class="docs-tool"><div id="icon-studio" class="icon-tool">
  <section class="company-favicons" aria-label="0001 favicons">
    <div><h2 class="ds-text ds-text--heading">0001</h2><p class="ds-text ds-text--muted">The original 1. Light and dark.</p></div>
    ${link(`${SITE}/icons/0001.svg`, 'Automatic SVG', '0001.svg')}
    ${favicons}
  </section>
  <div class="workspace">
    <aside class="library" aria-label="Icon library">
      ${heading('Starting points', count(`${PRODUCTS.length} concepts`))}
      <div class="products" id="products">${products}</div>
      ${heading('Original collection', count(`${FIGMA_ICONS.length} icons`))}
      ${note('The original shapes. Ready to refine.')}
      <div class="collection" id="collection">${originals}</div>
      ${button('id="new-drawing"', `${icon('plus')}Start with an empty canvas`)}
      ${heading('Your shelf', button('id="save-drawing"', `${icon('plus')}Save`))}
      <div id="shelf" class="collection"></div>${note('Keep a few favourites in this browser.', 'shelf-note')}
    </aside>
    <section class="editor" aria-label="Icon editor">
      <div class="editor-heading"><ds-input id="drawing-name" variant="plain" aria-label="Icon name" value="Design System 1" maxlength="80"></ds-input><span id="save-state" class="ds-text ds-text--small ds-text--muted">Saved locally</span></div>
      <div class="toolbar" aria-label="Drawing tools">
        <ds-tabs role="group" id="tools" aria-label="Tool">${choice('data-tool="paint"', 'Paint', true, 'Paint · P')}${choice('data-tool="triangle"', 'Triangle', false, 'Triangle · T')}${choice('data-tool="erase"', 'Erase', false, 'Erase · E')}</ds-tabs>
        <ds-button split actions id="history" aria-label="History" data-tooltip="Undo ⌘Z · Redo ⇧⌘Z"></ds-button>
      </div>
      <div class="drawing-space">
        <div class="ruler ds-text ds-text--small ds-text--muted" aria-hidden="true"><span>0</span><span>4</span><span>8</span><span>12</span><span>16</span></div>
        <div id="canvas" tabindex="0" role="application" aria-label="16 by 16 icon drawing grid" aria-describedby="canvas-help"><div id="artwork"></div><svg id="overlay" viewBox="0 0 16 16" aria-hidden="true"></svg></div>
        ${note('Drag to draw. Arrow keys and Space work too. Padding appears below.', 'canvas-help')}
      </div>
      <div class="canvas-footer">
        <label class="ds-text"><ds-checkbox><input type="checkbox" id="show-grid" checked /></ds-checkbox>Grid</label>
        <label class="ds-text">Brush <ds-select><select id="brush"><option value="1">1 × 1</option><option value="2" selected>2 × 2</option><option value="4">4 × 4</option><option value="8">8 × 8</option></select></ds-select></label>
        <div class="canvas-actions">${button('id="rotate" aria-label="Rotate" data-tooltip="Rotate"', icon('rotate'), 'icon')}${button('id="flip" aria-label="Flip" data-tooltip="Flip"', icon('flip'), 'icon')}</div>
      </div>
      ${note('The square colour mosaic from the packaging.', 'drawing-description')}
    </section>
    <aside class="inspector" aria-label="Icon settings and export">
      ${heading('Make it yours', count('16 × 16'))}
      <fieldset><legend class="ds-text ds-text--muted">Inks</legend>
        <div id="inks" class="inks"></div>
        <div class="ink-edit"><ds-color><input type="color" id="ink-color" value="#b6ff60" aria-label="Selected ink colour" /></ds-color><ds-input id="ink-hex" aria-label="Hex colour" value="#b6ff60" maxlength="9" spellcheck="false"></ds-input>${button('id="add-ink" aria-label="Add ink" data-tooltip="Add ink"', icon('plus'), 'icon')}${button('id="remove-ink" aria-label="Remove selected ink" data-tooltip="Remove selected ink"', icon('minus'), 'icon')}</div>
        <div id="palette" class="palette"></div>
      </fieldset>
      <fieldset><legend class="ds-text ds-text--muted">Shape</legend>
        <ds-tabs role="group" id="masks" aria-label="Shape" fill>${choice('data-mask="square"', 'Square', true)}${choice('data-mask="circle"', 'Circle', false)}</ds-tabs>
        <label class="range-label ds-text ds-text--muted" for="radius">Corners <output id="radius-value">2</output></label><input type="range" id="radius" min="0" max="8" step="0.5" value="2" />
        <label class="range-label ds-text ds-text--muted" for="padding">Breathing room <output id="padding-value">0</output></label><input type="range" id="padding" min="0" max="4" step="0.5" value="0" />
      </fieldset>
      <fieldset><legend class="ds-text ds-text--muted">Pattern</legend>
        <div class="pattern-row"><ds-select><select id="pattern" aria-label="Pattern"><option value="">Choose a pattern…</option></select></ds-select>${button('id="recolor" aria-label="Try another palette" data-tooltip="Try another palette"', icon('refresh'), 'icon')}</div>
      </fieldset>
      <div class="export">${heading('Take it with you')}
        ${button('id="download-svg"', `${icon('download')}Download SVG`, 'primary')}
        <div class="export-row">${button('id="download-png"', 'PNG · 512', 'secondary')}${button('id="download-ico"', 'Favicon .ico', 'secondary')}</div>
        <div class="export-row">${button('id="copy-svg"', 'Copy SVG')}${button('id="download-json"', 'Save file')}<ds-file-picker label="Open file"><input type="file" id="file-input" accept="application/json,.json" aria-label="Open file" /></ds-file-picker></div>
        ${note('Vector, high resolution, or 16–256 px favicon.')}
      </div>
    </aside>
  </div>
  <section class="preview-section" aria-label="Icon previews">${heading('The small details matter', count('Actual size previews'))}<div class="previews"><div class="size-card" id="light-preview"></div><div class="size-card dark-preview" id="dark-preview"></div><div class="browser-preview"><div class="browser-tab ds-text"><span id="tab-icon"></span><span id="tab-title">Design System 1</span>${icon('close')}</div><div class="browser-address ds-text ds-text--muted">your-website.com</div>${note('A little identity. Everywhere you open it.')}</div></div></section>
</div></div>`;
}
