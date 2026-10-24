import './booking';
import '../../../DS1/2-core/ds-device-bezel';
import { PointerActivity } from './pointer-activity';
import { ContextActivity } from './context-activity';
import { ColumnSpacingLayer } from './column-spacing';
import { GroupingLayer } from './grouping';
import { ComponentNamesLayer } from './component-names';
import { DEFAULT_EXAMPLE, EXAMPLE_PAGES, exampleComposition } from './examples';
import { SurfaceContextMenu } from './surface-context';
import { StatSpacingLayer } from './stat-spacing';
import { PageContextMenu } from './page-context';
import { CardSpacingLayer } from './card-spacing';
import { ResizingLayer } from './resize';
import { TextSpacingLayer } from './text-spacing';
import './text-spacing.css';
import { LitElement, html, type PropertyValues } from 'lit';
import { initGridFit } from '../../../DS1/0-face/grid-fit';
import { LIBRARY_PRESETS, libraryTokens, type LibraryId } from './libraries';
import { repeat } from 'lit/directives/repeat.js';
import { createSortable, type SortableController } from './vendor/drag/sortable';
import { reorder } from './vendor/drag/util';
import { styleMap } from 'lit/directives/style-map.js';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-number';
import '../../../DS1/2-core/ds-card';
import '../../../DS1/2-core/ds-tag';
import '../../../DS1/2-core/ds-stat';
import '../../../DS1/2-core/ds-switch';
import '../../../DS1/3-unit/ds-select';
import { defineAaEditor, parseBlocks, type AaEditorElement } from '../../../website/src/vendor/aa/aa.js';
import { bindSpacingHandle } from '../../app/src/2-core/spacing-handle';
import { canStartMarquee, beginMarquee, paintCompositionSelection, type SelectionRect } from './marquee';
import { CompositionSettle } from './settle';
import { createPreviewEditorOptions } from './aa';
import type { EditorOptions } from '../../../website/src/vendor/aa/aa';
import { CompositionHistory, removeSourceRanges, pointerGain, initialComposition, dimensionValue, limits, compositionBounds, compositionRange, READABLE_CARD_MIN, READABLE_TEXT_MIN, type Dimension } from './model';
defineAaEditor();

/** A reusable, document-owned ghost layer. It never mutates arbitrary page CSS. */
export class ConsistencyEditor extends LitElement {
  static properties = { contextActive: { state: true }, selectedExample: { state: true }, mobilePreview: { state: true }, stageWidth: { state: true }, revision: { state: true }, preview: { state: true }, selected: { state: true }, selectedGap: { state: true }, layers: { state: true }, selection: { state: true }, marquee: { state: true }, editorError: { state: true }, library: { state: true } };
  private contextActivity?: ContextActivity;
  private pointerActivity?: PointerActivity;
  private contextActive = false;
  declare selectedExample: string;
  declare stageWidth: number;
  declare mobilePreview: boolean;
  declare revision: number;
  declare preview: Record<string, number>;
  declare selected: Dimension;
  declare selectedGap: string;
  declare layers: { marquee: boolean; spacing: boolean; boundaries: boolean; reorder: boolean; place: boolean; production: boolean; resizing: boolean; componentNames: boolean; grouping: boolean };
  declare selection: Set<string>;
  declare marquee: SelectionRect | null;
  declare editorError: string;
  declare library: LibraryId;
  private editorOptions = new Map<string, EditorOptions>();
  private optionsFor(key: string): EditorOptions {
    const cacheKey = `${this.selectedExample}:${key}`;
    if (!this.editorOptions.has(cacheKey)) {
      const options = createPreviewEditorOptions(
        () => this.querySelector<AaEditorElement>(`aa-editor[data-editor-key="${key}"]`),
        message => { this.editorError = message; },
      );
      options.reordering = this.layers.reorder;
      options.placing = this.layers.place;
      this.editorOptions.set(cacheKey, options);
    }
    return this.editorOptions.get(cacheKey)!;
  }
  private cancelMarquee?: () => void;
  private onEscape = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !event.defaultPrevented && !event.composedPath().some(target => target instanceof HTMLElement && (target.isContentEditable || target.matches('input,textarea,select')))) { event.preventDefault(); if (event.shiftKey) this.history.redo(); else this.history.undo(); this.revision++; return; } this.deleteSelection(event); if (event.key === 'Escape') { this.cancelMarquee?.(); this.selection = new Set(); this.marquee = null; } };
  connectedCallback() { super.connectedCallback(); window.addEventListener('keydown', this.onEscape); }
  history = new CompositionHistory(exampleComposition(DEFAULT_EXAMPLE));
  private histories = new Map<string, CompositionHistory>([[DEFAULT_EXAMPLE, this.history]]);
  private selectExample(id: string) {
    const example = EXAMPLE_PAGES.find(page => page.id === id); if (!example || id === this.selectedExample) return;
    this.cancelMarquee?.(); this.settle.cancel(); this.sort?.destroy(); this.sort = undefined; this.cleanups.forEach(dispose => dispose()); this.cleanups = [];
    this.spacingDisposers.forEach(dispose => dispose()); this.spacingDisposers = []; this.spacingBound = false;
    this.histories.set(this.selectedExample, this.history); this.history = this.histories.get(id) ?? new CompositionHistory(structuredClone(example.composition)); this.histories.set(id, this.history);
    this.textSpacing?.destroy(); this.textSpacing = undefined; this.columnSpacing?.destroy(); this.columnSpacing = undefined; this.selectedGap = id === 'studio' ? 'intro-actions' : 'section-intro';
    this.selection = new Set(); this.preview = {}; this.selectedExample = id; if (id === 'booking') this.library = 'voyage'; this.revision++;
  }
  private canvasWidth() { return Math.max(280, this.mobilePreview ? Math.min(380, Math.floor((this.stageWidth - 20) / 20) * 20) : this.stageWidth); }
  private sort?: SortableController;
  private spacingDisposers: (() => void)[] = [];
  private spacingBound = false;
  private columnSpacing?: ColumnSpacingLayer;
  private textSpacing?: TextSpacingLayer;
  private resizing?: ResizingLayer;
  private cardSpacing?: CardSpacingLayer;
  private pageContext?: PageContextMenu;
  private componentNames?: ComponentNamesLayer;
  private grouping?: GroupingLayer;
  private statSpacing?: StatSpacingLayer;
  private surfaceContext?: SurfaceContextMenu;
  private boundsObserver?: ResizeObserver;
  private linkedEditors = new WeakSet<AaEditorElement>();
  private settle = new CompositionSettle();
  private interaction: "pointer" | "keyboard" = "keyboard";
  private cleanups: (() => void)[] = [];
  constructor() { super(); this.selectedExample = DEFAULT_EXAMPLE; this.stageWidth = 380; this.mobilePreview = false; this.revision = 0; this.preview = {}; this.selected = 'gap'; this.selectedGap = 'section-intro'; this.layers = { marquee: true, spacing: true, boundaries: true, reorder: true, place: true, production: true, resizing: true, componentNames: false, grouping: false }; this.selection = new Set(); this.marquee = null; this.editorError = ''; this.library = 'original'; }
  createRenderRoot() { return this; }
  disconnectedCallback() { this.pointerActivity?.destroy(); this.pointerActivity = undefined; this.contextActivity?.destroy(); this.contextActivity = undefined; this.columnSpacing?.destroy(); this.columnSpacing = undefined; this.grouping?.destroy(); this.grouping = undefined; this.componentNames?.destroy(); this.componentNames = undefined; this.boundsObserver?.disconnect(); this.statSpacing?.destroy(); this.surfaceContext?.destroy(); this.pageContext?.destroy(); this.pageContext = undefined; this.cardSpacing?.destroy(); this.cardSpacing = undefined; this.resizing?.destroy(); this.resizing = undefined; this.textSpacing?.destroy(); this.textSpacing = undefined; window.removeEventListener('keydown', this.onEscape); this.cancelMarquee?.(); this.sort?.destroy(); this.spacingDisposers.forEach(dispose => dispose()); this.settle.cancel(); this.cleanups.forEach(fn => fn()); this.cleanups = []; super.disconnectedCallback(); }
  private value(key: Dimension, gap = this.selectedGap) { return this.preview[key === 'gap' ? gap : key] ?? (key === 'gap' ? (this.history.value.gaps[gap] ?? this.columnSpacing?.defaultValue(gap) ?? this.textSpacing?.defaultValue(gap) ?? 20) : this.history.value[key]); }
  private commit(key: Dimension, value: number, gap = this.selectedGap) {
    if (key === 'gap') this.history.commit({ gaps: { ...this.history.value.gaps, [gap]: dimensionValue(key, value) } });
    else this.history.commit({ [key]: dimensionValue(key, value) });
    this.preview = {}; this.revision++;
  }
  private range(key: Dimension) { return compositionRange(key, this.canvasWidth(), this.history.value.padding); }
  private stacked(id: string) { const width = this.canvasWidth(); const bounds = compositionBounds(width, this.value('padding'), false, 280); const gap = this.value('gap', id); const minimum = id === 'stats-columns' ? READABLE_TEXT_MIN * 2 : ['bookshop', 'kitchen'].reduce((sum, key) => sum + Math.max(READABLE_CARD_MIN, this.history.value.sizes[key]?.width ?? READABLE_CARD_MIN), 0); return this.mobilePreview || minimum + gap > bounds.width - 2 * bounds.padding; }
  private enabled(key: Dimension) { if (key === 'width' || this.contextActive) return false; return key === 'gap' ? this.layers.spacing : this.layers.boundaries; }
  private toggle(layer: keyof typeof this.layers) {
    this.cancelMarquee?.(); this.sort?.cancel(); this.settle.cancel(); this.preview = {};
    this.spacingDisposers.forEach(dispose => dispose()); this.spacingDisposers = []; this.spacingBound = false;
    this.layers = { ...this.layers, [layer]: !this.layers[layer] };
  }
  private layerToggle(layer: keyof typeof this.layers, label: string) {
    const contextPaused = this.contextActive && ['spacing', 'resizing', 'boundaries'].includes(layer);
    const paused = contextPaused || layer === 'resizing' && this.mobilePreview;
    const descriptions = { marquee: 'Drag to select; Shift adds.', spacing: 'Adjust space between elements.', boundaries: 'Set padding and text wrapping.', reorder: 'Move elements within a group.', place: 'Arrange columns and groups.', production: 'Show guides only when needed.', resizing: 'Drag card and image edges.', componentNames: 'Name each component on the page.', grouping: 'Outline sections and nested groups.' };
    return html`<label class="consistency-layer-toggle"><span>${label}</span><ds-switch compact monochrome><button type="button" role="switch" aria-label=${label} aria-describedby=${`helper-${layer}`} aria-checked=${String(this.layers[layer] && !paused)} ?disabled=${paused} @click=${() => this.toggle(layer)}></button></ds-switch><small id=${`helper-${layer}`} class="consistency-toggle-help">${contextPaused ? 'Paused while a menu is open.' : paused ? 'Resize in desktop preview.' : descriptions[layer]}</small></label>`;
  }
  private deleteSelection(event: KeyboardEvent) {
    if (!['Delete', 'Backspace'].includes(event.key) || !this.selection.size || event.altKey || event.metaKey || event.ctrlKey) return;
    if ((event.target as Element)?.closest?.('aa-editor, input, textarea, select, button, [contenteditable]')) return;
    event.preventDefault();
    const doc = this.history.value, sections = { ...doc.sections };
    let text = doc.text;
    const hidden = new Set(doc.hidden);
    const order = doc.order.filter(id => !this.selection.has('group-' + id));
    for (const key of ['intro', ...Object.keys(sections)]) {
      const source = key === 'intro' ? text : sections[key];
      const blocks = parseBlocks(source);
      const ranges = blocks.flatMap((block, index) => this.selection.has(`text:${key}:${index}`) ? [{ start: block.start, end: blocks[index + 1]?.start ?? source.length }] : []);
      if (!ranges.length) continue;
      const next = removeSourceRanges(source, ranges);
      if (key === 'intro') text = next; else sections[key] = next;
    }
    for (const id of this.selection) if (!id.startsWith('text:') && !id.startsWith('group-') && !['intro', 'work', 'approach', 'contact'].includes(id)) hidden.add(id);
    this.history.commit({ text, sections, order, hidden: [...hidden] });
    this.selection = new Set(); this.revision++;
  }
  private startMarquee(event: PointerEvent) {
    const target = event.target as Element;
    if (event.isPrimary && event.button === 0 && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey && target.closest('aa-editor, ds-card, ds-button, button, input, textarea, select, a') && !target.closest('[role="slider"], .consistency-resize-edge')) this.selection = new Set();
    if ((this.layers.reorder && !event.shiftKey && (event.target as Element).closest('[data-sort-group]')) || !this.layers.marquee || !event.isPrimary || event.button !== 0 || !canStartMarquee(event.target as Element)) return;
    event.preventDefault(); this.cancelMarquee?.(); this.settle.cancel();
    (document.activeElement as HTMLElement | null)?.blur?.();
    this.ownerDocument.getSelection()?.removeAllRanges();
    this.cancelMarquee = beginMarquee(this, event, new Set(this.selection), selection => {
      this.selection = selection; this.cancelMarquee = undefined;
    });
  }

  private finishDrag(update: () => void) {
    const leaves = Array.from(this.querySelectorAll<HTMLElement>('.consistency-text-bounds > aa-editor > .aa-block, .consistency-sample-actions > ds-button, .consistency-projects > ds-card, .consistency-statistics > ds-stat, .consistency-gap, .consistency-text-gap, [data-spacing-active] > .ghost-measure, .ghost-surface--padding .ghost-measure, .ghost-surface--width'));
    void this.settle.run(leaves, async () => { update(); await this.updateComplete; });
  }
  private number(key: Dimension, label: string) {
    return html`<ds-number label=${label} aria-label=${label} .value=${this.value(key)} ?disabled=${!this.enabled(key)}
      .min=${this.range(key)[0]} .max=${this.range(key)[1]} .step=${20} .bigStep=${40} .width=${6} unit="px"
      @input=${(e: Event) => { this.preview = { ...this.preview, [key === 'gap' ? this.selectedGap : key]: (e.currentTarget as HTMLInputElement).value as unknown as number }; }}
      @change=${(e: Event) => this.commit(key, Number((e.currentTarget as HTMLInputElement).value))}></ds-number>`;
  }
  private handle(key: Dimension, label: string, gap = '', axis: 'horizontal' | 'vertical' = 'vertical') {
    const value = this.value(key, gap || this.selectedGap);
    return html`<div class="ghost-surface ghost-surface--${key}" data-handle=${key} data-gap=${gap} data-axis=${axis} tabindex=${this.enabled(key) ? 0 : -1} ?hidden=${!this.enabled(key)} aria-disabled=${String(!this.enabled(key))}
      aria-label=${`Adjust ${gap ? gap.replaceAll('-', ' ') : label.toLowerCase()}`} role="slider" aria-valuenow=${Math.round(value)}
      aria-orientation=${key === 'gap' ? axis : 'horizontal'}
      aria-valuemin=${this.range(key)[0]} aria-valuemax=${this.range(key)[1]} aria-valuetext=${`${Math.round(value)} pixels`}
      @focus=${() => { this.selected = key; if (gap) this.selectedGap = gap; }}><span class="ghost-measure" aria-hidden="true">${Math.round(value)}</span></div>`;
  }
  private sectionText(key: string, label: string) {
    return html`<div class="consistency-text-bounds" data-ds-area data-selectable=${key}><aa-editor toolbar class=${this.mobilePreview || this.history.value.wrap ? '' : 'consistency-nowrap'} aria-label=${label} data-editor-key=${key}
      .options=${this.optionsFor(key)} .value=${key === 'intro' ? this.history.value.text : this.history.value.sections[key]}
      @input=${(event: Event) => { this.history.commit(key === 'intro' ? { text: (event.currentTarget as AaEditorElement).value } : { sections: { ...this.history.value.sections, [key]: (event.currentTarget as AaEditorElement).value } }); this.revision++; }}></aa-editor></div>`;
  }
  private gap(id: string, horizontal = false) {
    if (['projects-columns', 'stats-columns'].includes(id) && this.stacked(id)) horizontal = false;
    const value = this.value('gap', id);
    return html`<div class="consistency-gap ${horizontal ? 'consistency-gap--horizontal' : ''}" style=${styleMap({ [horizontal ? 'width' : 'height']: `calc(${value}px * var(--sf))`, '--composition-gap': `calc(${value}px * var(--sf))` })}>${this.handle('gap', 'Gap', id, horizontal ? 'horizontal' : 'vertical')}</div>`;
  }
  private goTo(id: string) { this.querySelector(`#${id}`)?.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  private selectedGroup() {
    const chosen = Array.from(this.selection)[0] ?? '';
    if (chosen.startsWith('group-')) return chosen.slice(6);
    if (['intro', 'work', 'approach', 'contact'].includes(chosen)) return chosen;
    if (['bookshop', 'kitchen'].includes(chosen)) return 'work';
    if (['starting-point', 'next-version'].includes(chosen)) return 'approach';
    return chosen === 'contact-note' ? 'contact' : '';
  }
  private moveGroup(id: string, index: number) {
    const source = this.history.value.order.indexOf(id);
    if (source < 0 || index < 0 || index >= this.history.value.order.length || source === index) return;
    this.history.commit({ order: reorder({ list: this.history.value.order, startIndex: source, finishIndex: index }) });
    this.selection = new Set(['group-' + id]); this.revision++;
  }
  private group(id: string) {
    const doc = this.history.value;
    if (this.selectedExample === 'booking') return id === 'intro' ? html`<consistency-booking .values=${doc.sections} .library=${this.library} @booking-history=${(event: CustomEvent<'undo' | 'redo'>) => { this.history[event.detail](); this.revision++; }} @booking-change=${(event: CustomEvent<Record<string, string>>) => { this.history.commit({ sections: event.detail }); this.revision++; }}></consistency-booking>` : html``;
    if (this.selectedExample !== 'studio') return html`<div data-sort-group=${id} data-selectable=${'group-' + id} class="consistency-group" @pointerdown=${(event: PointerEvent) => { if (this.layers.reorder && !event.shiftKey && canStartMarquee(event.target as Element)) this.selection = new Set(['group-' + id]); }} aria-label=${id}><section class="consistency-story-section">${this.sectionText(id, `${id} text`)}</section>${doc.order.indexOf(id) < doc.order.length - 1 ? this.gap(`section-${id}`) : ''}</div>`;
    const contents: Record<string, unknown> = {
      intro: html`<section class="consistency-story-section" id="studio-intro"><div class="consistency-text-bounds" data-ds-area data-selectable="intro"><aa-editor toolbar class=${this.mobilePreview || doc.wrap ? '' : 'consistency-nowrap'} aria-label="Composition text" data-editor-key="intro" .options=${this.optionsFor('intro')} .value=${doc.text}
            @input=${(e: Event) => { this.history.commit({ text: (e.currentTarget as AaEditorElement).value }); this.revision++; }}></aa-editor></div>
          ${this.gap('intro-actions')}
          <div class="consistency-sample-actions"><ds-button data-selectable="explore-action" secondary @click=${() => this.goTo('studio-work')}>Explore the studio</ds-button>${this.gap('actions-columns', true)}<ds-button data-selectable="contact-action-button" @click=${() => this.goTo('studio-contact')}>Get in touch</ds-button></div></section>
          ${this.gap('intro-work')}`,
      work: html`<section class="consistency-story-section" id="studio-work">${this.sectionText('work', 'Selected work text')}
            ${this.gap('work-cards')}<div class=${`consistency-projects ${this.stacked('projects-columns') ? 'consistency-stacked' : ''}`}>
              <ds-card data-ds-prose data-selectable="bookshop" tone=${doc.cardDesigns.bookshop?.tone ?? 'sharp-blue'} variant=${doc.cardDesigns.bookshop?.variant ?? 'filled'} height="14"><span slot="label">An independent bookshop</span><span slot="title">A shelf for every curiosity</span><p>A quieter way to discover a book, meet its maker and find your next read.</p><ds-tag>Identity and website</ds-tag></ds-card>
              ${this.gap('projects-columns', true)}<ds-card data-ds-prose data-selectable="kitchen" tone=${doc.cardDesigns.kitchen?.tone ?? 'apple-green'} variant=${doc.cardDesigns.kitchen?.variant ?? 'filled'} height="14"><span slot="label">A neighbourhood kitchen</span><span slot="title">Good food, close to home</span><p>A seasonal menu and a welcoming place for the people around the corner.</p><ds-tag>Website and words</ds-tag></ds-card>
            </div>
          </section>${this.gap('work-approach')}`,
      approach: html`<section class="consistency-story-section" id="studio-approach">${this.sectionText('approach', 'How we work text')}
            ${this.gap('approach-stats')}<div class=${`consistency-statistics ${this.stacked('stats-columns') ? 'consistency-stacked' : ''}`}><ds-stat data-selectable="starting-point" literal label="Our starting point" figure="A conversation" caption="Before the first sketch"></ds-stat>${this.gap('stats-columns', true)}<ds-stat data-selectable="next-version" literal label="Our favourite version" figure="The next one" caption="Made better by using it"></ds-stat></div>
          </section>${this.gap('approach-contact')}`,
      contact: html`<section class="consistency-story-section" id="studio-contact">${this.sectionText('contact', 'Contact section text')}
            ${this.gap('contact-card')}<ds-card data-ds-prose data-selectable="contact-note" tone=${doc.cardDesigns['contact-note']?.tone ?? ''} variant=${doc.cardDesigns['contact-note']?.variant ?? 'outlined'} height="8"><span slot="label">A note for later</span><span slot="title">What would you like to make?</span><p>This is your page to shape. Edit the words above and leave the thought here.</p></ds-card>
            ${this.gap('contact-action')}<div class="consistency-sample-actions"><ds-button data-selectable="back-action" secondary @click=${() => this.goTo('studio-intro')}>Back to the beginning</ds-button></div>
          </section>`,
    };
    return html`<div data-sort-group=${id} data-selectable=${'group-' + id} class="consistency-group" @pointerdown=${(event: PointerEvent) => { if (this.layers.reorder && !event.shiftKey && canStartMarquee(event.target as Element)) this.selection = new Set(['group-' + id]); }} aria-label=${id === 'intro' ? 'Introduction' : id === 'work' ? 'Selected work' : id === 'approach' ? 'How we work' : 'Contact'}>${contents[id]}</div>`;
  }
  protected firstUpdated() {
    this.pointerActivity = new PointerActivity(this);
    this.contextActivity = new ContextActivity(this, active => { this.contextActive = active; if (active) { this.settle.cancel(); this.preview = {}; } });
    this.setAttribute('data-ds-grid-fit', '');
    this.boundsObserver = new ResizeObserver(entries => { const width = entries[0].contentRect.width; if (width !== this.stageWidth) this.stageWidth = width; });
    this.boundsObserver.observe(this.querySelector('.consistency-stage')!);
    if (document.fonts && typeof ResizeObserver !== 'undefined') initGridFit();
  }
  private paintSelection() {
    paintCompositionSelection(this, (this.layers.marquee || this.layers.reorder) ? this.selection : new Set());
  }
  protected updated(changed: PropertyValues) {
    // Selection and focused measures do not change document geometry or layer bindings.
    if (changed.size && Array.from(changed.keys()).every(key => ['selection', 'marquee', 'selected', 'selectedGap'].includes(String(key)))) { this.paintSelection(); return; }
    this.columnSpacing ??= new ColumnSpacingLayer(this, { enabled: () => this.enabled('gap'), value: (id,fallback) => this.preview[id] ?? this.history.value.gaps[id] ?? fallback, select: id => { this.selected = 'gap'; this.selectedGap = id; }, preview: (id,value) => { this.preview = { ...this.preview, [id]:value }; }, commit: (id,value,pointer) => { if(pointer)this.finishDrag(() => this.commit('gap',value,id)); else this.commit('gap',value,id); }, cancel: () => { this.preview = {}; } });
    this.columnSpacing.refresh();
    this.componentNames ??= new ComponentNamesLayer(this, { enabled: () => this.layers.componentNames }); this.componentNames.refresh();
    this.grouping ??= new GroupingLayer(this, () => this.layers.grouping); this.grouping.refresh();
    if (this.history.value.width !== Math.max(280, this.stageWidth)) this.history.value = { ...this.history.value, width: Math.max(280, this.stageWidth) };
    this.statSpacing ??= new StatSpacingLayer(this, { enabled: () => this.enabled('gap'), value: id => this.history.value.gaps[id] ?? 0, commit: (id, value) => { this.history.commit({ gaps: { ...this.history.value.gaps, [id]: value } }); this.revision++; } });
    this.statSpacing.refresh();
    this.surfaceContext ??= new SurfaceContextMenu(this, { stats: () => this.history.value.statDesigns, buttons: () => this.history.value.buttonDesigns, commit: (kind, id, patch) => { const field = kind === 'card' ? 'cardDesigns' : kind === 'stat' ? 'statDesigns' : 'buttonDesigns'; this.history.commit({ [field]: { ...this.history.value[field], [id]: { ...this.history.value[field][id], ...patch } } }); this.revision++; } });
    this.surfaceContext.refresh();
    this.pageContext ??= new PageContextMenu(this, { tone: () => this.history.value.pageTone ?? '', commit: pageTone => { this.history.commit({ pageTone }); this.revision++; } });
    this.pageContext.refresh();
    this.cardSpacing ??= new CardSpacingLayer(this, { consistency: () => this.history.value.consistency, enabled: () => this.enabled('gap'), gaps: id => this.history.value.cardGaps[id] ?? {}, commit: (id, key, value, height) => { const card = this.querySelector<HTMLElement>(`ds-card[data-selectable="${id}"]`); const width = card ? card.getBoundingClientRect().width / (Number.parseFloat(getComputedStyle(card).getPropertyValue('--sf')) || 1) : 280; this.history.commit({ cardGaps: { ...this.history.value.cardGaps, [id]: { ...this.history.value.cardGaps[id], [key]: value } }, sizes: { ...this.history.value.sizes, [id]: { width, height } } }); this.revision++; } });
    this.cardSpacing.refresh();
    this.resizing ??= new ResizingLayer(this, { consistency: () => this.history.value.consistency, enabled: () => this.layers.resizing && !this.mobilePreview && !this.contextActive, size: key => this.history.value.sizes[key], commit: (key, size) => { this.history.commit({ sizes: { ...this.history.value.sizes, [key]: size } }); this.revision++; } });
    this.resizing.refresh();
    this.querySelectorAll<HTMLElement>('aa-editor[data-editor-key]').forEach(editor => {
      editor.querySelectorAll<HTMLElement>(':scope > .aa-block').forEach((block, index) => { block.dataset.selectable = `text:${editor.dataset.editorKey}:${index}`; });
    });
    this.querySelectorAll<HTMLElement>('[data-selectable]').forEach(element => { element.hidden = this.history.value.hidden.includes(element.dataset.selectable!); });
    this.textSpacing ??= new TextSpacingLayer(this, {
      value: (id, fallback) => this.preview[id] ?? this.history.value.gaps[id] ?? fallback,
      enabled: () => this.enabled('gap'),
      select: id => { this.selected = 'gap'; this.selectedGap = id; },
      preview: (id, value) => { this.preview = { ...this.preview, [id]: value }; },
      commit: (id, value, pointer) => { if (pointer) this.finishDrag(() => this.commit('gap', value, id)); else this.commit('gap', value, id); },
      cancel: () => { this.preview = {}; },
    });
    this.textSpacing.refresh();
    this.querySelectorAll<AaEditorElement>('aa-editor').forEach(element => {
      if (element.editor) {
        element.editor.reordering = this.layers.reorder;
        element.editor.placing = this.layers.place;
      }
      if (this.linkedEditors.has(element) || !element.editor) return;
      this.linkedEditors.add(element);
      element.editor.setHistoryProvider({
        undo: () => { const changed = this.history.canUndo; this.history.undo(); this.revision++; return changed; },
        redo: () => { const changed = this.history.canRedo; this.history.redo(); this.revision++; return changed; },
      });
    });
    if (!this.sort) {
      this.sort = createSortable({
        lockAxis: 'y',
        inheritProperties: ['--sf', '--ds-sf', '--u'],
        renderPreview: source => {
          const preview = source.cloneNode(true) as HTMLElement;
          preview.classList.add('consistency-sheet');
          preview.style.padding = '0'; preview.style.margin = '0'; preview.style.outline = 'none';
          const originals = Array.from(source.querySelectorAll<AaEditorElement>('aa-editor'));
          preview.querySelectorAll<AaEditorElement>('aa-editor').forEach((editor, index) => {
            editor.options = { menus: false, toolbar: false }; editor.value = originals[index].value; editor.readOnly = true;
          });
          return preview;
        },
        onDragStart: start => { this.cancelMarquee?.(); this.settle.cancel(); this.selection = new Set(['group-' + start.draggableId]); },
        prepareDrop: result => {
          if (result.reason === 'DROP' && result.destination && this.layers.reorder) {
            this.moveGroup(result.draggableId, result.destination.index);
            this.performUpdate();
          }
          return this.querySelector<HTMLElement>(`[data-sort-group="${CSS.escape(result.draggableId)}"]`);
        },
        outOfTheWay: { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
        drop: { minDuration: 150, maxDuration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      });
      this.cleanups.push(this.sort.container({ element: this.querySelector('.consistency-sheet')!, id: 'composition-groups', axis: 'vertical', label: 'Composition sections', isDropDisabled: () => !this.layers.reorder }));
      this.querySelectorAll<HTMLElement>('[data-sort-group]').forEach(element => {
        this.cleanups.push(this.sort!.item({ element, id: element.dataset.sortGroup!,
          canDrag: ({ target }) => this.layers.reorder && !this.hasAttribute('data-pointer-additive') && !!target && canStartMarquee(target),
          label: element.getAttribute('aria-label')!,
        }));
      });
    }

    this.querySelectorAll<HTMLElement>('[data-sort-group]').forEach(element => element.tabIndex = this.layers.reorder ? 0 : -1);
    this.paintSelection();
    if (this.spacingBound) return;
    this.spacingBound = true;
    this.querySelectorAll<HTMLElement>('[data-handle]').forEach(host => {
      const key = host.dataset.handle as Dimension;
      const gap = host.dataset.gap || '';
      const previewKey = key === 'gap' ? gap : key;
      this.spacingDisposers.push(bindSpacingHandle(host, () => ({
        value: key === 'gap' ? (this.history.value.gaps[gap] ?? this.columnSpacing?.defaultValue(gap) ?? this.textSpacing?.defaultValue(gap) ?? 20) : this.history.value[key], disabled: !this.enabled(key), min: this.range(key)[0], max: this.range(key)[1], step: 20, shiftStep: 40,
        axis: key === 'gap' ? host.dataset.axis as 'horizontal' | 'vertical' : 'horizontal', snapPreview: false,
        gain: pointerGain(key, Number(getComputedStyle(host).getPropertyValue('--sf'))),
        onPointerStart: event => { this.settle.cancel(); this.selected = key; if (gap) this.selectedGap = gap; (host.ownerDocument.activeElement as HTMLElement | null)?.blur?.(); },
        onStart: kind => { host.setAttribute('data-spacing-active', ''); this.interaction = kind; this.selected = key; if (gap) this.selectedGap = gap; },
        onPreview: value => { this.preview = { ...this.preview, [previewKey]: value }; },
        onCommit: value => {
          if (this.interaction === 'pointer') this.finishDrag(() => this.commit(key, value, gap));
          else this.commit(key, value, gap);
        },
        onEnd: cancelled => {
          host.removeAttribute('data-spacing-active');
          if (cancelled && this.interaction === 'pointer') this.finishDrag(() => { this.preview = {}; });
          else this.preview = {};
        },
      })));
    });
  }
  render() {
    const doc = this.history.value;
    const requestedWidth = this.canvasWidth();
    const { width, padding } = compositionBounds(requestedWidth, this.value('padding'), this.mobilePreview, 280);
    return html`<div class="consistency-shell ${this.mobilePreview ? 'consistency-mobile-preview' : ''} ${this.enabled('gap') ? '' : 'spacing-off'} ${this.enabled('padding') ? '' : 'boundaries-off'} ${this.contextActive ? 'context-active' : ''} ${this.layers.reorder ? 'reorder-on' : ''} ${this.layers.production ? 'production-on' : ''}">
      <main class="consistency-workspace"><section class="consistency-stage" aria-label="Editable composition" @pointerdown=${this.startMarquee}>
        <ds-device-bezel class="consistency-device" .frameless=${!this.mobilePreview} responsive asset-base="/examples/visual-kit/" browser="safari" address="preview.example" time="00:01" .appearance=${this.library==='ink'?'dark':'light'}><div class="consistency-sheet" data-ds-grid-scroll data-ds-surface data-consistency-library=${this.library} style=${styleMap({ ...libraryTokens(this.library), color: 'var(--ds-text-color)', colorScheme: this.library === 'ink' ? 'dark' : this.library === 'blue' ? 'light' : undefined, width: '100%', padding: this.selectedExample === 'booking' ? '0' : `calc(${padding}px * var(--sf))`, '--composition-padding': `calc(${padding}px * var(--sf))`, '--composition-content-width': `calc(${width - padding * 2}px * var(--sf))`, '--composition-card-width': `calc(${Math.max(READABLE_CARD_MIN, Math.floor((width - padding * 2 - 20) / 40) * 20)}px * var(--sf))` })}>
          <div class="consistency-padding">${this.handle('padding', 'Padding')}</div>
          ${repeat(doc.order, id => `${this.selectedExample}:${id}`, id => this.group(id))}
        </div></ds-device-bezel>
        ${this.marquee ? html`<div class="consistency-marquee" aria-hidden="true" style=${styleMap({ left: `${this.marquee.left}px`, top: `${this.marquee.top}px`, width: `${this.marquee.right - this.marquee.left}px`, height: `${this.marquee.bottom - this.marquee.top}px` })}></div>` : ''}
      </section><aside class="consistency-inspector" aria-label="Composition bounds and spacing">
        <h2>Composition</h2><a href="/private-consistency/guide/" target="_blank" rel="noopener" title="Opens in a new tab">Editor guide</a><label class="consistency-select-label">Example page<ds-select><select aria-label="Example page" .value=${this.selectedExample} @change=${(event: Event) => this.selectExample((event.target as HTMLSelectElement).value)}>${EXAMPLE_PAGES.map(example => html`<option value=${example.id}>${example.label}</option>`)}</select></ds-select></label><ds-button aria-pressed=${String(this.mobilePreview)} @click=${() => { this.mobilePreview = !this.mobilePreview; this.preview = {}; }}>${this.mobilePreview ? 'Desktop preview' : 'Mobile preview'}</ds-button><label class="consistency-select-label">Library preset<ds-select><select aria-label="Library preset" .value=${this.library} @change=${(event: Event) => { this.library = (event.target as HTMLSelectElement).value as LibraryId; }}>${LIBRARY_PRESETS.map(preset => html`<option value=${preset.id}>${preset.label}</option>`)}</select></ds-select></label><div class="consistency-layers"><label class="consistency-layer-toggle"><span>Consistency</span><ds-switch compact monochrome><button type="button" role="switch" aria-label="Consistency" aria-describedby="helper-consistency" aria-checked=${String(doc.consistency)} @click=${() => { this.history.commit({ consistency: !doc.consistency }); this.revision++; }}></button></ds-switch><small id="helper-consistency" class="consistency-toggle-help">Share design; keep each card’s text.</small></label>${this.layerToggle('marquee', 'Marquee')}${this.layerToggle('spacing', 'Spacing')}${this.layerToggle('boundaries', 'Boundaries')}${this.layerToggle('reorder', 'Reorder')}${this.layerToggle('place', 'Place')}${this.layerToggle('production', 'Production')}${this.layerToggle('resizing', 'Resizing')}${this.layerToggle('componentNames', 'Component names')}${this.layerToggle('grouping', 'Grouping')}</div><p role="status">${this.selection.size} elements selected</p>
        ${this.layers.reorder ? html`<div class="consistency-reorder-actions"><ds-button ?disabled=${!this.selectedGroup() || doc.order.indexOf(this.selectedGroup()) === 0} @click=${() => this.moveGroup(this.selectedGroup(), doc.order.indexOf(this.selectedGroup()) - 1)}>Move up</ds-button><ds-button ?disabled=${!this.selectedGroup() || doc.order.indexOf(this.selectedGroup()) === doc.order.length - 1} @click=${() => this.moveGroup(this.selectedGroup(), doc.order.indexOf(this.selectedGroup()) + 1)}>Move down</ds-button></div><p class="consistency-muted">Select a section, then drag its empty space. Space lifts a focused section; arrows move it.</p>` : ''}
        <div class="consistency-fields">${this.number('padding', 'Padding')}<span class="consistency-gap-name">${this.selectedGap.replaceAll('-', ' ')}</span>${this.number('gap', 'Gap')}
          <label class="consistency-select-label">Text bounds<ds-select><select aria-label="Text bounds" .value=${doc.wrap ? 'wrap' : 'nowrap'} @change=${(e: Event) => { this.history.commit({ wrap: (e.target as HTMLSelectElement).value === 'wrap' }); this.revision++; }}><option value="wrap">Wrap to bounds</option><option value="nowrap">Keep one line</option></select></ds-select></label>
        </div><div class="consistency-explainer"><span class="consistency-tag">${this.selected === 'gap' ? 'Spacing' : 'Bounds'}</span><p>${this.selected === 'gap' ? 'The gap belongs to the space between the words and their actions.' : 'The outline belongs to the composition. Its content follows the bounds.'}</p><p class="consistency-muted">Arrow keys step 20 px. Shift steps 40 px. Escape cancels a drag.</p></div>
      ${this.editorError ? html`<p role="alert">${this.editorError}<ds-button @click=${() => { this.editorError = ''; }}>Dismiss</ds-button></p>` : ''}</aside></main>
    </div>`;
  }
}
if (!customElements.get('consistency-editor')) customElements.define('consistency-editor', ConsistencyEditor);
