/** Server publication of the same Markdown and closed atoms the editor writes. No browser DOM. */
import { parseBlocks, blockRuns, readColumns, readTabs, tableRows, tableAlignments, exportMarkdown, DEFAULT_ATOMS, type Block, type AtomSyntax } from '../website/src/vendor/aa/parse.js';
import { readBasicContentElement } from './consistency-content';
import { readCarousel } from './consistency-carousel';
import { icons } from '../DS1/2-core/generated/icons-immediate';
import { icons as extraIcons } from '../DS1/2-core/generated/icons-extra';
import metrics from '../DS1/1-root/component-metrics.css?raw';
import tokens from '../DS1/1-root/component-tokens.css?raw';
import appearance from '../DS1/1-root/component-appearance.css?raw';
import card from '../DS1/1-root/card.css?raw';
import controls from '../DS1/1-root/controls.css?raw';
import prose from '../DS1/1-root/prose.css?raw';
import palette from '../DS1/1-root/palette.css?raw';
import native from './consistency-native-content.css?raw';

/** The sheets a region is drawn from, as `composeRegionStyles` takes them; the tests read the same files from disk. */
export interface RegionSheets { tokens: string; palette: string; metrics: string; appearance: string; controls: string; card: string; prose: string; native: string }
const dropImports = (sheet: string) => sheet.replace(/^@import[^;]+;\s*/gm, '');
/**
 * Design system 1's tokens as the page's defaults: on the root with no specificity, so a library's or
 * the site's own `:root` tokens win wherever they are loaded, and a region inherits whichever the page
 * has. Nothing is declared on the region itself, where it would outweigh the root by inheritance.
 */
const pageDefaults = (sheet: string) => dropImports(sheet).replace(/:root((?::lang\([^)]*\))?)/g, ':where(:root$1)');
/** The component metrics are the one thing a region declares for itself: they resolve the inherited base tokens at the region's own scale. */
const regionMetrics = (sheet: string) => dropImports(sheet).replace(/:root\b/g, ':scope');
/**
 * Prose defaults in a region yield to the page's own prose rules: every selector loses its
 * specificity in `:where()`, so a library's `[data-ds-prose] :where(h1, h2)` face reaches the headings
 * in a region, where the scoped rule's proximity would otherwise outweigh it. The order of the rules
 * among themselves is kept, which is all they rely on.
 */
const yielding = (sheet: string) => dropImports(sheet).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\})\s*([^@{}]+?)\s*\{/g, (_all, before: string, selector: string) => `${before}\n:where(${selector.trim().replace(/\s*\n\s*/g, ' ')}) {`);
/** The region stylesheet from its sheets: the page's defaults, then what the region draws for itself, scoped to it. */
export function composeRegionStyles(sheets: RegionSheets): string {
  const defaults = [sheets.tokens, sheets.palette].map(pageDefaults).join('\n');
  const scoped = [regionMetrics(sheets.metrics), dropImports(sheets.appearance), dropImports(sheets.controls), dropImports(sheets.card), yielding(sheets.prose)].join('\n');
  return `${defaults}\n@scope (.c9y-native-region) { ${scoped} }\n${sheets.native}`;
}
export const nativeRegionStyles = composeRegionStyles({ tokens, palette, metrics, appearance, controls, card, prose, native });
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const unit = (value: number) => `calc(${value}px * var(--sf, 1))`;
const fail = (): never => { throw new Error('invalid-native-region'); };
const iconSources: Readonly<Record<string, string>> = { ...icons, ...extraIcons };
/** One of the library's icons as inline SVG in the current colour, or undefined for a name it has not got. */
export const nativeIcon = (name: string): string | undefined => (Object.hasOwn(iconSources, name) ? iconSources[name] : undefined);
const atoms: AtomSyntax[] = [...DEFAULT_ATOMS, { name: 'page-icon', match: (source, at) => /^:icon\[[a-z0-9-]{1,80}\]/.exec(source.slice(at))?.[0].length ?? 0 }];

function href(value: string): string {
  if (value.length > 4000 || /[\u0000-\u0020\u007f\\]/.test(value)) return fail();
  if (/^(?:https?:\/\/|mailto:|tel:)/i.test(value) || /^\/(?!\/)/.test(value) || /^#[^<>]*$/.test(value) || (!!value && !/^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith('//') && !/[<>]/.test(value))) return escape(value);
  return fail();
}
function imageSource(value: string, images?: readonly string[]): string {
  if (/^https?:\/\//i.test(value)) return href(value);
  if (!/^\/(?!\/)/.test(value) || (images && !images.includes(value))) return fail();
  return href(value);
}
/** Validate the stored source without rewriting it or losing Aa's offsets/history. */
export function validateNativeRegion(source: unknown, images: readonly string[], gaps?: Record<string, number>, id?: string): string {
  if (typeof source !== 'string' || source.length > 24_000 || source.includes('\0')) return fail();
  renderNativeRegion(source, { images, gaps, id });
  return source;
}
export function renderNativeRegion(source: string, options: { images?: readonly string[]; id?: string; gaps?: Record<string, number> } = {}): string {
  if (typeof source !== 'string' || source.length > 24_000 || source.includes('\0')) return fail();
  const clean = exportMarkdown(source);
  const prefix = options.id && /^[a-zA-Z0-9_-]{1,80}$/.test(options.id) ? options.id : 'content';
  const gaps = options.gaps ?? {};
  if (!gaps || typeof gaps !== 'object' || Array.isArray(gaps) || Object.keys(gaps).length > 600) return fail();
  const gapPattern = new RegExp(`^(?:${prefix}-(?:text-[1-9][0-9]*|nested-[1-9][0-9]*-text-[1-9][0-9]*)|columns:${prefix}:[0-9]+:[0-9]+)$`);
  for (const [key, value] of Object.entries(gaps)) if (!gapPattern.test(key) || typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 2000) return fail();
  let count = 0, serial = 0, containerSerial = 0, columnSerial = 0;
  const inline = (block: Block): string => blockRuns(block, atoms).map(run => {
    if (run.kind === 'syntax') return '';
    if (run.kind === 'break') return '<br>';
    const raw = block.source.slice(run.from, run.to);
    if (run.kind === 'atom') {
      if (run.atom === 'image') {
        const match = /^!\[([^\]\n]*)\]\(([^\s()]+)(?: "w(\d+)")?\)$/.exec(raw);
        if (!match) return fail();
        const width = match[3] ? Math.min(2000, Math.max(20, Number(match[3]) * 20)) : undefined;
        return `<img src="${imageSource(match[2]!, options.images)}" alt="${escape(match[1]!)}"${width ? ` style="width:${unit(width)}"` : ''} loading="lazy">`;
      }
      if (run.atom === 'page-icon') {
        const name = raw.slice(6, -1), svg = iconSources[name];
        if (!svg) return fail();
        return `<span class="c9y-native-icon" role="img" aria-label="${escape(name)}">${svg}</span>`;
      }
      // Equations keep their authored source readable without running page scripts.
      return `<code>${escape(raw)}</code>`;
    }
    let text = escape(raw);
    if (run.code) text = `<code>${text}</code>`;
    if (run.bold) text = `<strong>${text}</strong>`;
    if (run.italic) text = `<em>${text}</em>`;
    if (run.strike) text = `<s>${text}</s>`;
    if (run.underline) text = `<u>${text}</u>`;
    if (run.highlight) text = `<mark>${text}</mark>`;
    if (run.color && ['gray','red','orange','green','blue','purple'].includes(run.color)) text = `<span class="c9y-native-color-${run.color}">${text}</span>`;
    if (run.href) text = `<a href="${href(run.href)}">${text}</a>`;
    return text;
  }).join('');
  const textInline = (source: string) => inline({ kind: 'paragraph', source, prefix: 0 });
  const render = (source: string, depth = 0, container = 0): string => {
    if (depth > 8) return fail();
    const blocks = parseBlocks(source);
    return blocks.map((block, index) => {
      const key = container ? `${prefix}-nested-${container}-text-${index}` : `${prefix}-text-${index}`;
      const content = renderBlock(block);
      return `<div class="c9y-native-block${block.kind === 'heading' ? ' c9y-native-heading' : ''}"${index && gaps[key] !== undefined ? ` style="margin-block-start:${unit(gaps[key]!)}"` : ''}>${content}</div>`;
    }).join('\n');
    function renderBlock(block: Block): string {
      if (++count > 600) return fail();
      if (block.kind === 'columns') {
        const columns = readColumns(block.source);
        if (columns.length > 12) return fail();
        const columnIndex = columnSerial++;
        return `<div class="c9y-native-columns">${columns.map((column,index) => { const gap = index ? gaps[`columns:${prefix}:${columnIndex}:${index - 1}`] ?? 40 : 0; return `<div class="c9y-native-column" style="--c9y-column-gap:${unit(gap)}">${render(column, depth + 1, ++containerSerial)}</div>`; }).join('')}</div>`;
      }
      if (block.kind === 'tabs') {
        const tabs = readTabs(block.source), name = `${prefix}-tabs-${++serial}`;
        if (tabs.length > 24) return fail();
        // Native radio controls work with keyboard and pointer, even on script-free sites.
        return `<div class="c9y-native-tabs" role="group" aria-label="Tabs">${tabs.map((tab, index) => `<input class="c9y-native-tab-choice" type="radio" name="${name}" id="${name}-${index}"${index ? '' : ' checked'}><label for="${name}-${index}">${escape(tab.name || `Tab ${index + 1}`)}</label><div class="c9y-native-tab-panel">${render(tab.content, depth + 1, ++containerSerial)}</div>`).join('')}</div>`;
      }
      if (block.kind === 'table') {
        const rows = tableRows(block.source), alignments = tableAlignments(block.source);
        if (rows.length > 200 || rows.some(row => row.length > 30)) return fail();
        return `<div class="c9y-native-table"><table>${rows.map((row, rowIndex) => `<${rowIndex ? 'tbody' : 'thead'}><tr>${row.map((cell, index) => `<${rowIndex ? 'td' : 'th'}${alignments[index] ? ` style="text-align:${alignments[index]}"` : ''}>${textInline(cell.text)}</${rowIndex ? 'td' : 'th'}>`).join('')}</tr></${rowIndex ? 'tbody' : 'thead'}>`).join('')}</table></div>`;
      }
      if (block.kind === 'code') {
        const component = readBasicContentElement(block.source);
        if (component?.kind === 'button') {
          const body = escape(component.label), cls = `ds-button ds-button--${component.secondary ? 'secondary' : 'primary'} c9y-native-button`;
          return component.action ? `<a class="${cls}" href="${href(component.action.target)}">${body}</a>` : `<button type="button" class="${cls}">${body}</button>`;
        }
        if (component?.kind === 'card') {
          const styles = [`--ds-card-height:${unit(component.height ?? 160)}`, ...(component.width ? [`--ds-card-width:${unit(component.width)}`] : []), ...Object.entries(component.gaps ?? {}).map(([key,value]) => `--ds-card-${key}-gap:${unit(value)}`)];
          return `<article class="ds-card${component.variant !== 'filled' ? ' ds-card--outlined' : ''}"${component.tone ? ` data-tone="${component.tone}"` : ''} style="${styles.join(';')}"><span class="ds-card__label">${escape(component.label)}</span><span class="ds-card__title">${escape(component.title)}</span><div class="ds-card__body">${escape(component.body).replaceAll('\n', '<br>')}</div></article>`;
        }
        const carousel = readCarousel(block.source);
        if (carousel) {
          const name = `${prefix}-carousel-${++serial}`;
          const dimensions = `height:${unit(carousel.height)}${carousel.width ? `;width:${unit(carousel.width)}` : ''}`;
          return `<div class="c9y-native-carousel" role="region" aria-label="Image carousel"><div class="c9y-native-slides" style="${dimensions}">${carousel.slides.map((slide,index) => `<figure id="${name}-${index}"><img src="${imageSource(slide.src, options.images)}" alt="${escape(slide.alt)}" style="object-fit:${slide.fit}" loading="lazy"></figure>`).join('')}</div>${carousel.slides.length > 1 ? `<nav aria-label="Carousel images">${carousel.slides.map((_,index) => `<a href="#${name}-${index}" aria-label="Image ${index + 1}">${index + 1}</a>`).join('')}</nav>` : ''}</div>`;
        }
        if (/^```c9y-image\r?\n\{\}\r?\n```$/.test(block.source)) return '<div class="c9y-native-image-empty" role="img" aria-label="Image"></div>';
        if (/^```c9y-/.test(block.source)) return fail();
        return `<pre><code>${escape(block.source.split('\n').slice(1, -1).join('\n'))}</code></pre>`;
      }
      if (block.kind === 'heading') return `<h${block.level}>${inline(block)}</h${block.level}>`;
      if (block.kind === 'divider') return '<hr>';
      if (block.kind === 'bullet') {
        const checked = block.checked === undefined ? '' : `<input type="checkbox" disabled${block.checked ? ' checked' : ''}>`;
        const tag = block.number === undefined ? 'ul' : 'ol';
        return `<${tag}${block.number === undefined ? '' : ` start="${block.number}"`} class="c9y-native-list" style="margin-inline-start:${unit(Math.min(12, block.depth ?? 0) * 20)}"><li>${checked}${inline(block)}</li></${tag}>`;
      }
      if (block.kind === 'quote' || block.kind === 'callout') return `<blockquote>${inline(block)}</blockquote>`;
      if (block.kind === 'equation') return `<pre>${escape(block.source.replace(/^\$\$\s*\n?|\n?\$\$$/g, ''))}</pre>`;
      if (block.kind === 'toc') return '';
      return `<p>${inline(block)}</p>`;
    }
  };
  return `<div class="c9y-native-region"><div data-ds-prose>${render(clean)}</div></div>`;
}
