/** Resolved DS one desktop tokens: 12 columns × 20px, 14px text, 16px controls.
 * Email clients receive ordinary HTML and inline values instead of Lit components.
 */
export const ink = '#2a2a2a'
const green = '#99ff73'
export const font = "'GT-America-Standard-Regular',Arial,Helvetica,sans-serif"
export const emailType = `font-family:${font};font-size:14px;font-weight:400;line-height:20px;mso-line-height-rule:exactly;letter-spacing:-0.4px;color:${ink}`
// A centered 20px tile starts 10px before the container midpoint. Offset it
// so grid strokes begin on the centered 240px content edges.
// Stroke widths remain literal 1px at every scale; avoid half-pixel phase offsets.
// Match page-background.css: 8px paper inset; omit the first horizontal rule.
const gridPosition = 'calc(50% + 10px) 0, 0 28px'
// The ruling is a shade of black, not a grey: on white it is #ededed, and a
// mail app that darkens the letter by itself, without reading the dark styles
// below, turns the paper black but leaves a background image as it is. A
// fixed light grey then stood as bright lines behind light text; a shade of
// black disappears into the dark paper instead.
const rule = 'rgba(0,0,0,0.07)'
const grid =
  `linear-gradient(to right,${rule} 1px,transparent 1px),repeating-linear-gradient(to bottom,${rule} 0 1px,transparent 1px 20px)`

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]!,
  )
}

/** Match the settings row's bottom-aligned 16px text box in a 20px row.
 * Offset the ink only: cell fills and the 20px line rhythm stay on the grid.
 */
export function gridText(content: string): string {
  return `<div class="ds-email-ink" style="display:block;position:relative;top:2px;padding-left:2px">${content}</div>`
}

/** Static equivalent of Ezo’s ezo-button[primary] containing ezo-text.
 * Ezo client/design/2-core/styles/ezo-button.css: 16px control, 0.5px horizontal inset.
 * Ezo client/design/2-core/styles/ezo-text.css: centered 15px line in a 16px text box.
 * Half-pixel vertical padding reproduces that centering without Lit or flexbox.
 */
export function primaryEmailButton(
  label: string,
  href: string,
): string {
  return `<a class="ds-email-action ds-email-type" href="${escapeHtml(href)}" style="${emailType};box-sizing:border-box;height:16px;line-height:15px;font-weight:500;letter-spacing:normal;vertical-align:top;display:inline-block;white-space:nowrap;border:0;border-radius:0;background:${green};padding:0.5px;text-align:left;text-decoration:none"><span class="ds-email-action-label" style="display:block;line-height:15px;mso-line-height-rule:exactly;letter-spacing:normal">${escapeHtml(label)}</span></a>`
}

/** DS one: viewport / 280, clamped to 0.75–2; desktop remains at 1.
 * Compile values into CSS rather than relying on custom properties in inboxes.
 * Width is our email-safe proxy for mobile; a narrow desktop reading pane also scales.
 */
function scaledEmailCss(scale: number | 'fluid'): string {
  const px = (value: number) =>
    scale === 'fluid'
      ? `${Number(((value / 280) * 100).toFixed(6))}vw`
      : `${Number((value * scale).toFixed(4))}px`
  const ruleStart = `calc(${px(20)} + 8px)`
  return `
.ds-email-type {font-size:${px(14)} !important;line-height:${px(20)} !important;letter-spacing:${px(-0.4)} !important;}
.ds-email-paper {min-height:${px(640)} !important;background-image:linear-gradient(to right,${rule} 1px,transparent 1px),repeating-linear-gradient(to bottom,${rule} 0 1px,transparent 1px ${px(20)}) !important;background-size:${px(20)} 100%,100% calc(100% - ${px(20)} - 8px) !important;background-position:calc(50% + ${px(10)}) 0,0 ${ruleStart} !important;}
.ds-email-outer {padding:calc(8px + ${px(20)}) ${px(20)} ${px(20)} !important;}
.ds-email-page {width:${px(240)} !important;}
.ds-email-cell-row {height:${px(20)} !important;}
.ds-email-cell {width:${px(80)} !important;height:${px(20)} !important;}
.ds-email-paragraph {margin-top:${px(20)} !important;}
.ds-email-content p,.ds-email-content h1 {margin-bottom:${px(20)} !important;}
.ds-email-section {margin:0 0 ${px(20)} !important;}
.ds-email-detail {padding-bottom:${px(20)} !important;}
.ds-email-cell-wide {width:${px(160)} !important;}
.ds-email-cell-label {font-size:${px(14)} !important;line-height:${px(20)} !important;font-weight:400 !important;letter-spacing:normal !important;}
.ds-email-ink {top:${px(2)} !important;padding-left:${px(2)} !important;}
.ds-email-cell-ink {padding:0 4px !important;}
.ds-email-gap-one {padding-top:${px(20)} !important;}
.ds-email-gap-two {padding-top:${px(40)} !important;}
.ds-email-company-row {padding-top:${px(100)} !important;}
.ds-email-greeting {padding-top:${px(20)} !important;}
.ds-email-action-row {padding-top:${px(44)} !important;}
.ds-email-action {letter-spacing:normal !important;height:${px(16)} !important;line-height:${px(15)} !important;padding:${px(0.5)} !important;}
.ds-email-action-label {line-height:${px(15)} !important;}`
}

const responsiveStyles = `
@media screen and (max-width:700px) {${scaledEmailCss(2)}}
@media screen and (max-width:559.98px) {${scaledEmailCss('fluid')}}
@media screen and (max-width:209.98px) {${scaledEmailCss(0.75)}}`

function darkGrid(cell: string): string {
  return `.ds-email-paper {background-image:linear-gradient(to right,#202020 1px,transparent 1px),repeating-linear-gradient(to bottom,#202020 0 1px,transparent 1px ${cell}) !important;}`
}

const darkStyles = `
:root {color-scheme:light dark;supported-color-schemes:light dark;}
@media (prefers-color-scheme:dark) {
  body.ds-email-type,.ds-email-paper {background-color:#000000 !important;}
  .ds-email-type {color:#eeeeee !important;}
  .ds-email-company {color:#383838 !important;}
  .ds-email-cell {background-color:#3c3c3c !important;color:#b8b8b8 !important;}
  .ds-email-action {background-color:#99ff73 !important;color:#2a2a2a !important;}
  ${darkGrid('20px')}
}
@media screen and (prefers-color-scheme:dark) and (max-width:700px) {${darkGrid('40px')}}
@media screen and (prefers-color-scheme:dark) and (max-width:559.98px) {${darkGrid('7.142857vw')}}
@media screen and (prefers-color-scheme:dark) and (max-width:209.98px) {${darkGrid('15px')}}`

export interface EmailFrameOptions {
  product: string
  homeUrl: string
  title: string
  preheader?: string
  language?: string
  fontUrl?: string
  wideLabel?: boolean
  /** Trusted HTML from a template renderer, never raw user input. */
  headerHtml?: string
  beforeHeaderHtml?: string
  /** Trusted CSS from the product's validated branding tokens. */
  brandStyles?: string
}

/** Rows are trusted template HTML. Escape every interpolated user value. */
export function emailFrame(options: EmailFrameOptions, body: string): string {
  const { product, homeUrl, title, preheader = '', language = 'en', fontUrl, wideLabel = false, headerHtml, beforeHeaderHtml = '', brandStyles = '' } = options
  return `<!doctype html>
<html lang="${escapeHtml(language)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${escapeHtml(title)}</title>
<style>
${responsiveStyles}
${darkStyles}
${fontUrl ? `@font-face { font-family:'GT-America-Standard-Regular'; src:url('${escapeHtml(fontUrl)}') format('woff2'); font-weight:400; font-style:normal; mso-font-alt:Arial; }` : ''}
${brandStyles}
</style>
<!--[if mso]><style>body,table,td,a,p {font-family:Arial,Helvetica,sans-serif !important;}</style><![endif]-->
</head>
<body class="ds-email-type" style="margin:0;padding:0;background-color:#ffffff;${emailType};-webkit-text-size-adjust:100%">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escapeHtml(preheader)}</div>` : ''}
<table class="ds-email-paper ds-email-type" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-height:640px;background-color:#ffffff;background-image:${grid};background-size:20px 100%,100% calc(100% - 28px);background-position:${gridPosition};background-repeat:repeat-x,no-repeat;${emailType}"><tr><td class="ds-email-outer" align="center" valign="top" style="padding:28px 20px 20px">
<table class="ds-email-page ds-email-type" role="presentation" width="240" cellpadding="0" cellspacing="0" style="width:240px;table-layout:fixed;border-collapse:collapse;${emailType}">
${beforeHeaderHtml}
${headerHtml ?? `<tr><td class="ds-email-cell-row" align="right" height="20" style="height:20px;padding:0;font-size:0;line-height:0"><a href="${escapeHtml(homeUrl)}" class="ds-email-cell ds-email-cell-label${wideLabel ? ' ds-email-cell-wide' : ''}" style="text-decoration:none;position:relative;display:block;margin-left:auto;box-sizing:border-box;width:${wideLabel ? 160 : 80}px;height:20px;border:0;background:#e6e6e6;font-family:${font};font-size:14px;line-height:20px;mso-line-height-rule:exactly;font-weight:400;letter-spacing:normal;color:#797979;text-align:left"><span class="ds-email-cell-ink" style="display:block;box-sizing:border-box;padding:0 4px;white-space:nowrap;overflow:hidden">${escapeHtml(product)}</span></a></td></tr>`}
${body}

</table></td></tr></table></body></html>`
}

/** One paragraph on the email grid. html must already be escaped/rendered. */
export function emailRow(html: string, gap: 0 | 20 | 40 = 20): string {
  const gapClass = gap === 40 ? ' ds-email-gap-two' : gap === 20 ? ' ds-email-gap-one' : ''
  return `<tr><td class="ds-email-type${gapClass}" style="padding:${gap}px 0 0;${emailType};overflow-wrap:anywhere;word-break:break-word">${gridText(html)}</td></tr>`
}

export function emailAction(label: string, href: string): string {
  return `<tr><td class="ds-email-action-row" style="padding:44px 0 0;font-size:0;line-height:0">${primaryEmailButton(label, href)}</td></tr>`
}

export function emailMessage(options: EmailFrameOptions & { paragraphs: string[]; action?: { label: string; href: string }; footer?: string }) {
  const { paragraphs, action, footer } = options
  const html = emailFrame(options,
    emailRow(`<h1 style="margin:0;font:inherit;letter-spacing:inherit">${escapeHtml(options.title)}</h1>`, 40) +
    paragraphs.map(p => emailRow(escapeHtml(p).replace(/\n/g, '<br>'))).join('') +
    (action ? emailAction(action.label, action.href) : '') +
    (footer ? emailRow(escapeHtml(footer), 40) : ''))
  const text = [options.product, options.title, ...paragraphs, action ? `${action.label}: ${action.href}` : '', footer].filter(Boolean).join('\n\n')
  return { subject: options.title, html, text }
}
