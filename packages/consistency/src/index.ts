import { ResizingLayer } from './resize';
import { TextSpacingLayer } from './text-spacing';
import './text-spacing.css';
import { LitElement, html } from 'lit';
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
import { canStartMarquee, selectionRect, intersects, type SelectionRect } from './marquee';
import { CompositionSettle } from './settle';
import { createPreviewEditorOptions } from './aa';
import type { EditorOptions } from '../../../website/src/vendor/aa/aa';
import { CompositionHistory, removeSourceRanges, pointerGain, initialComposition, dimensionValue, limits, type Dimension } from './model';
defineAaEditor();

/** A reusable, document-owned ghost layer. It never mutates arbitrary page CSS. */
export class ConsistencyEditor extends LitElement {
  static properties = { revision: { state: true }, preview: { state: true }, selected: { state: true }, selectedGap: { state: true }, layers: { state: true }, selection: { state: true }, marquee: { state: true }, editorError: { state: true }, library: { state: true } };
  declare revision: number;
  declare preview: Record<string, number>;
  declare selected: Dimension;
  declare selectedGap: string;
  declare layers: { marquee: boolean; spacing: boolean; boundaries: boolean; reorder: boolean; place: boolean; production: boolean; resizing: boolean };
  declare selection: Set<string>;
  declare marquee: SelectionRect | null;
  declare editorError: string;
  declare library: LibraryId;
  private editorOptions = new Map<string, EditorOptions>();
  private optionsFor(key: string): EditorOptions {
    if (!this.editorOptions.has(key)) {
      const options = createPreviewEditorOptions(
        () => this.querySelector<AaEditorElement>(`aa-editor[data-editor-key="${key}"]`),
        message => { this.editorError = message; },
      );
      options.reordering = this.layers.reorder;
      options.placing = this.layers.place;
      this.editorOptions.set(key, options);
    }
    return this.editorOptions.get(key)!;
  }
  private cancelMarquee?: () => void;
  private onEscape = (event: KeyboardEvent) => { this.deleteSelection(event); if (event.key === 'Escape') { this.cancelMarquee?.(); this.selection = new Set(); this.marquee = null; } };
  connectedCallback() { super.connectedCallback(); window.addEventListener('keydown', this.onEscape); }
  history = new CompositionHistory();
  private sort?: SortableController;
  private spacingDisposers: (() => void)[] = [];
  private spacingBound = false;
  private textSpacing?: TextSpacingLayer;
  private resizing?: ResizingLayer;
  private linkedEditors = new WeakSet<AaEditorElement>();
  private settle = new CompositionSettle();
  private interaction: "pointer" | "keyboard" = "keyboard";
  private cleanups: (() => void)[] = [];
  constructor() { super(); this.revision = 0; this.preview = {}; this.selected = 'gap'; this.selectedGap = 'intro-actions'; this.layers = { marquee: true, spacing: true, boundaries: true, reorder: true, place: true, production: true, resizing: true }; this.selection = new Set(); this.marquee = null; this.editorError = ''; this.library = 'original'; }
  createRenderRoot() { return this; }
  disconnectedCallback() { this.resizing?.destroy(); this.resizing = undefined; this.textSpacing?.destroy(); this.textSpacing = undefined; window.removeEventListener('keydown', this.onEscape); this.cancelMarquee?.(); this.sort?.destroy(); this.spacingDisposers.forEach(dispose => dispose()); this.settle.cancel(); this.cleanups.forEach(fn => fn()); this.cleanups = []; super.disconnectedCallback(); }
  private value(key: Dimension, gap = this.selectedGap) { return this.preview[key === 'gap' ? gap : key] ?? (key === 'gap' ? (this.history.value.gaps[gap] ?? this.textSpacing?.defaultValue(gap) ?? 20) : this.history.value[key]); }
  private commit(key: Dimension, value: number, gap = this.selectedGap) {
    if (key === 'gap') this.history.commit({ gaps: { ...this.history.value.gaps, [gap]: dimensionValue(key, value) } });
    else this.history.commit({ [key]: dimensionValue(key, value) });
    this.preview = {}; this.revision++;
  }
  private enabled(key: Dimension) { return key === 'gap' ? this.layers.spacing : this.layers.boundaries; }
  private toggle(layer: keyof typeof this.layers) {
    this.cancelMarquee?.(); this.sort?.cancel(); this.settle.cancel(); this.preview = {};
    this.spacingDisposers.forEach(dispose => dispose()); this.spacingDisposers = []; this.spacingBound = false;
    this.layers = { ...this.layers, [layer]: !this.layers[layer] };
  }
  private layerToggle(layer: keyof typeof this.layers, label: string) {
    return html`<label class="consistency-layer-toggle"><span>${label}</span><ds-switch><button type="button" role="switch" aria-label=${label} aria-checked=${String(this.layers[layer])} @click=${() => this.toggle(layer)}></button></ds-switch></label>`;
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
    if ((this.layers.reorder && (event.target as Element).closest('[data-sort-group]')) || !this.layers.marquee || !event.isPrimary || event.button !== 0 || !canStartMarquee(event.target as Element)) return;
    event.preventDefault(); (document.activeElement as HTMLElement | null)?.blur?.(); this.cancelMarquee?.();
    const base = event.shiftKey ? new Set(this.selection) : new Set<string>();
    const x = event.clientX, y = event.clientY;
    const move = (next: PointerEvent) => {
      if (next.pointerId !== event.pointerId) return;
      this.marquee = selectionRect(x, y, next.clientX, next.clientY);
      const chosen = new Set(base);
      this.querySelectorAll<HTMLElement>('[data-selectable]').forEach(element => {
        if (element.hidden || element.querySelector('[data-selectable]') || !element.getClientRects().length) return;
        if (intersects(this.marquee!, element.getBoundingClientRect())) chosen.add(element.dataset.selectable!);
      });
      this.selection = chosen;
    };
    const finish = (next?: PointerEvent) => {
      if (next && next.pointerId !== event.pointerId) return;
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', finish); window.removeEventListener('pointercancel', cancel); window.removeEventListener('blur', cancel);
      this.marquee = null; this.cancelMarquee = undefined;
    };
    const cancel = () => { this.selection = base; finish(); };
    this.selection = base; this.cancelMarquee = cancel;
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', finish); window.addEventListener('pointercancel', cancel); window.addEventListener('blur', cancel);
  }
  private finishDrag(update: () => void) {
    const leaves = Array.from(this.querySelectorAll<HTMLElement>('.consistency-text-bounds > aa-editor > .aa-block, .consistency-sample-actions > ds-button, .consistency-projects > ds-card, .consistency-statistics > ds-stat, .consistency-gap, .consistency-text-gap, [data-spacing-active] > .ghost-measure, .ghost-surface--padding .ghost-measure, .ghost-surface--width'));
    void this.settle.run(leaves, async () => { update(); await this.updateComplete; });
  }
  private number(key: Dimension, label: string) {
    return html`<ds-number label=${label} aria-label=${label} .value=${this.value(key)} ?disabled=${!this.enabled(key)}
      .min=${limits[key][0]} .max=${limits[key][1]} .step=${20} .bigStep=${40} .width=${6} unit="px"
      @input=${(e: Event) => { this.preview = { ...this.preview, [key === 'gap' ? this.selectedGap : key]: (e.currentTarget as HTMLInputElement).value as unknown as number }; }}
      @change=${(e: Event) => this.commit(key, Number((e.currentTarget as HTMLInputElement).value))}></ds-number>`;
  }
  private handle(key: Dimension, label: string, gap = '', axis: 'horizontal' | 'vertical' = 'vertical') {
    const value = this.value(key, gap || this.selectedGap);
    return html`<div class="ghost-surface ghost-surface--${key}" data-handle=${key} data-gap=${gap} data-axis=${axis} tabindex=${this.enabled(key) ? 0 : -1} ?hidden=${!this.enabled(key)} aria-disabled=${String(!this.enabled(key))}
      aria-label=${`Adjust ${gap ? gap.replaceAll('-', ' ') : label.toLowerCase()}`} role="slider" aria-valuenow=${Math.round(value)}
      aria-orientation=${key === 'gap' ? axis : 'horizontal'}
      aria-valuemin=${limits[key][0]} aria-valuemax=${limits[key][1]} aria-valuetext=${`${Math.round(value)} pixels`}
      @focus=${() => { this.selected = key; if (gap) this.selectedGap = gap; }}><span class="ghost-measure" aria-hidden="true">${Math.round(value)}</span></div>`;
  }
  private sectionText(key: string, label: string) {
    return html`<div class="consistency-text-bounds" data-ds-area data-selectable=${key}><aa-editor toolbar class=${this.history.value.wrap ? '' : 'consistency-nowrap'} aria-label=${label} data-editor-key=${key}
      .options=${this.optionsFor(key)} .value=${this.history.value.sections[key]}
      @input=${(event: Event) => { this.history.commit({ sections: { ...this.history.value.sections, [key]: (event.currentTarget as AaEditorElement).value } }); this.revision++; }}></aa-editor></div>`;
  }
  private gap(id: string, horizontal = false) {
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
    const contents: Record<string, unknown> = {
      intro: html`<section class="consistency-story-section" id="studio-intro"><div class="consistency-text-bounds" data-ds-area data-selectable="intro"><aa-editor toolbar class=${doc.wrap ? '' : 'consistency-nowrap'} aria-label="Composition text" data-editor-key="intro" .options=${this.optionsFor('intro')} .value=${doc.text}
            @input=${(e: Event) => { this.history.commit({ text: (e.currentTarget as AaEditorElement).value }); this.revision++; }}></aa-editor></div>
          ${this.gap('intro-actions')}
          <div class="consistency-sample-actions"><ds-button data-selectable="explore-action" secondary @click=${() => this.goTo('studio-work')}>Explore the studio</ds-button>${this.gap('actions-columns', true)}<ds-button data-selectable="contact-action-button" @click=${() => this.goTo('studio-contact')}>Get in touch</ds-button></div></section>
          ${this.gap('intro-work')}`,
      work: html`<section class="consistency-story-section" id="studio-work">${this.sectionText('work', 'Selected work text')}
            ${this.gap('work-cards')}<div class="consistency-projects">
              <ds-card data-ds-prose data-selectable="bookshop" tone="sharp-blue" height="14"><span slot="label">An independent bookshop</span><span slot="title">A shelf for every curiosity</span><p>A quieter way to discover a book, meet its maker and find your next read.</p><ds-tag>Identity and website</ds-tag></ds-card>
              ${this.gap('projects-columns', true)}<ds-card data-ds-prose data-selectable="kitchen" tone="apple-green" height="14"><span slot="label">A neighbourhood kitchen</span><span slot="title">Good food, close to home</span><p>A seasonal menu and a welcoming place for the people around the corner.</p><ds-tag>Website and words</ds-tag></ds-card>
            </div>
          </section>${this.gap('work-approach')}`,
      approach: html`<section class="consistency-story-section" id="studio-approach">${this.sectionText('approach', 'How we work text')}
            ${this.gap('approach-stats')}<div class="consistency-statistics"><ds-stat data-selectable="starting-point" literal label="Our starting point" figure="A conversation" caption="Before the first sketch"></ds-stat>${this.gap('stats-columns', true)}<ds-stat data-selectable="next-version" literal label="Our favourite version" figure="The next one" caption="Made better by using it"></ds-stat></div>
          </section>${this.gap('approach-contact')}`,
      contact: html`<section class="consistency-story-section" id="studio-contact">${this.sectionText('contact', 'Contact section text')}
            ${this.gap('contact-card')}<ds-card data-ds-prose data-selectable="contact-note" variant="outlined" height="8"><span slot="label">A note for later</span><span slot="title">What would you like to make?</span><p>This is your page to shape. Edit the words above and leave the thought here.</p></ds-card>
            ${this.gap('contact-action')}<div class="consistency-sample-actions"><ds-button data-selectable="back-action" secondary @click=${() => this.goTo('studio-intro')}>Back to the beginning</ds-button></div>
          </section>`,
    };
    return html`<div data-sort-group=${id} data-selectable=${'group-' + id} class="consistency-group" @pointerdown=${(event: PointerEvent) => { if (this.layers.reorder && canStartMarquee(event.target as Element)) this.selection = new Set(['group-' + id]); }} aria-label=${id === 'intro' ? 'Introduction' : id === 'work' ? 'Selected work' : id === 'approach' ? 'How we work' : 'Contact'}>${contents[id]}</div>`;
  }
  protected firstUpdated() {
    this.setAttribute('data-ds-grid-fit', '');
    if (document.fonts && typeof ResizeObserver !== 'undefined') initGridFit();
  }
  protected updated() {
    this.resizing ??= new ResizingLayer(this, { enabled: () => this.layers.resizing, size: key => this.history.value.sizes[key], commit: (key, size) => { this.history.commit({ sizes: { ...this.history.value.sizes, [key]: size } }); this.revision++; } });
    this.resizing.refresh();
    this.querySelectorAll<HTMLElement>('aa-editor[data-editor-key]').forEach(editor => {
      editor.querySelectorAll<HTMLElement>(':scope > .aa-block').forEach((block, index) => { block.dataset.selectable = `text:${editor.dataset.editorKey}:${index}`; });
    });
    this.querySelectorAll<HTMLElement>('[data-selectable]').forEach(element => { element.hidden = this.history.value.hidden.includes(element.dataset.selectable!); });
    this.textSpacing ??= new TextSpacingLayer(this, {
      value: (id, fallback) => this.preview[id] ?? this.history.value.gaps[id] ?? fallback,
      enabled: () => this.layers.spacing,
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
        onDragEnd: result => {
          if (result.reason === 'DROP' && result.destination && this.layers.reorder) {
            this.moveGroup(result.draggableId, result.destination.index);
            this.performUpdate();
          }
        },
        outOfTheWay: { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
        drop: { minDuration: 150, maxDuration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      });
      this.cleanups.push(this.sort.container({ element: this.querySelector('.consistency-sheet')!, id: 'composition-groups', axis: 'vertical', label: 'Composition sections', isDropDisabled: () => !this.layers.reorder }));
      this.querySelectorAll<HTMLElement>('[data-sort-group]').forEach(element => {
        this.cleanups.push(this.sort!.item({ element, id: element.dataset.sortGroup!,
          canDrag: ({ target }) => this.layers.reorder && !!target && canStartMarquee(target),
          label: element.getAttribute('aria-label')!,
        }));
      });
    }

    this.querySelectorAll<HTMLElement>('[data-sort-group]').forEach(element => element.tabIndex = this.layers.reorder ? 0 : -1);
    this.querySelectorAll<HTMLElement>('[data-selectable]').forEach(element => element.toggleAttribute(element.classList.contains('aa-block') ? 'data-composition-selected' : 'data-selected', (this.layers.marquee || this.layers.reorder) && this.selection.has(element.dataset.selectable!)));
    if (this.spacingBound) return;
    this.spacingBound = true;
    this.querySelectorAll<HTMLElement>('[data-handle]').forEach(host => {
      const key = host.dataset.handle as Dimension;
      const gap = host.dataset.gap || '';
      const previewKey = key === 'gap' ? gap : key;
      this.spacingDisposers.push(bindSpacingHandle(host, () => ({
        value: key === 'gap' ? (this.history.value.gaps[gap] ?? this.textSpacing?.defaultValue(gap) ?? 20) : this.history.value[key], disabled: !this.enabled(key), min: limits[key][0], max: limits[key][1], step: 20, shiftStep: 40,
        axis: key === 'gap' ? host.dataset.axis as 'horizontal' | 'vertical' : 'horizontal', snapPreview: false,
        gain: pointerGain(key, Number(getComputedStyle(this).getPropertyValue('--sf'))),
        onPointerStart: event => { this.settle.cancel(); this.selected = key; if (gap) this.selectedGap = gap; host.focus({ preventScroll: true }); },
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
    const width = this.value('width'), padding = this.value('padding');
    return html`<div class="consistency-shell ${this.layers.spacing ? '' : 'spacing-off'} ${this.layers.boundaries ? '' : 'boundaries-off'} ${this.layers.reorder ? 'reorder-on' : ''} ${this.layers.production ? 'production-on' : ''}">
      <header class="consistency-top"><span class="consistency-name"><span class="consistency-tag">Consistency</span></span><div class="consistency-actions">
        <ds-button ?disabled=${!this.history.canUndo} @click=${() => { this.history.undo(); this.revision++; }}>Undo</ds-button>
        <ds-button ?disabled=${!this.history.canRedo} @click=${() => { this.history.redo(); this.revision++; }}>Redo</ds-button>
        <ds-button @click=${() => { this.history.commit(initialComposition); this.preview = {}; this.revision++; }}>Reset</ds-button>
      </div></header>
      <div class="consistency-bar"><span>Words and the space around them.</span><span class="consistency-muted">Local experiment</span></div>
      <main class="consistency-workspace"><section class="consistency-stage" aria-label="Editable composition" @pointerdown=${this.startMarquee}>
        <div class="consistency-sheet" data-ds-grid-scroll data-ds-surface data-consistency-library=${this.library} style=${styleMap({ ...libraryTokens(this.library), color: 'var(--ds-text-color)', colorScheme: this.library === 'ink' ? 'dark' : this.library === 'blue' ? 'light' : undefined, width: `calc(${width}px * var(--sf))`, padding: `calc(${padding}px * var(--sf))`, '--composition-padding': `calc(${padding}px * var(--sf))`, '--composition-content-width': `calc(${width - padding * 2}px * var(--sf))`, '--composition-card-width': `calc(${Math.max(20, Math.floor((width - padding * 2 - 20) / 40) * 20)}px * var(--sf))` })}>
          <div class="consistency-width">${this.handle('width', 'Width')}</div>
          <div class="consistency-padding">${this.handle('padding', 'Padding')}</div>
          ${repeat(doc.order, id => id, id => this.group(id))}
        </div>
        ${this.marquee ? html`<div class="consistency-marquee" aria-hidden="true" style=${styleMap({ left: `${this.marquee.left}px`, top: `${this.marquee.top}px`, width: `${this.marquee.right - this.marquee.left}px`, height: `${this.marquee.bottom - this.marquee.top}px` })}></div>` : ''}
        <p class="consistency-hint">Edit the words. Drag the space or an edge to make room.</p>
      </section><aside class="consistency-inspector" aria-label="Composition bounds and spacing">
        <h2>Composition</h2><label class="consistency-select-label">Library preset<ds-select><select aria-label="Library preset" .value=${this.library} @change=${(event: Event) => { this.library = (event.target as HTMLSelectElement).value as LibraryId; }}>${LIBRARY_PRESETS.map(preset => html`<option value=${preset.id}>${preset.label}</option>`)}</select></ds-select></label><div class="consistency-layers">${this.layerToggle('marquee', 'Marquee')}${this.layerToggle('spacing', 'Spacing')}${this.layerToggle('boundaries', 'Boundaries')}${this.layerToggle('reorder', 'Reorder')}${this.layerToggle('place', 'Place')}${this.layerToggle('production', 'Production')}${this.layerToggle('resizing', 'Resizing')}</div><p role="status">${this.selection.size} elements selected</p>
        ${this.layers.reorder ? html`<div class="consistency-reorder-actions"><ds-button ?disabled=${!this.selectedGroup() || doc.order.indexOf(this.selectedGroup()) === 0} @click=${() => this.moveGroup(this.selectedGroup(), doc.order.indexOf(this.selectedGroup()) - 1)}>Move up</ds-button><ds-button ?disabled=${!this.selectedGroup() || doc.order.indexOf(this.selectedGroup()) === doc.order.length - 1} @click=${() => this.moveGroup(this.selectedGroup(), doc.order.indexOf(this.selectedGroup()) + 1)}>Move down</ds-button></div><p class="consistency-muted">Select a section, then drag its empty space. Space lifts a focused section; arrows move it.</p>` : ''}<p class="consistency-muted">A live layer over the things you make.</p>
        <div class="consistency-fields">${this.number('width', 'Width')}${this.number('padding', 'Padding')}<span class="consistency-gap-name">${this.selectedGap.replaceAll('-', ' ')}</span>${this.number('gap', 'Gap')}
          <label class="consistency-select-label">Text bounds<ds-select><select aria-label="Text bounds" .value=${doc.wrap ? 'wrap' : 'nowrap'} @change=${(e: Event) => { this.history.commit({ wrap: (e.target as HTMLSelectElement).value === 'wrap' }); this.revision++; }}><option value="wrap">Wrap to bounds</option><option value="nowrap">Keep one line</option></select></ds-select></label>
        </div><div class="consistency-explainer"><span class="consistency-tag">${this.selected === 'gap' ? 'Spacing' : 'Bounds'}</span><p>${this.selected === 'gap' ? 'The gap belongs to the space between the words and their actions.' : 'The outline belongs to the composition. Its content follows the bounds.'}</p><p class="consistency-muted">Arrow keys step 20 px. Shift steps 40 px. Escape cancels a drag.</p></div>
      </aside></main><footer class="consistency-footer" role=${this.editorError ? 'alert' : 'status'} aria-live="polite">${this.editorError || (Object.keys(this.preview).length ? 'Previewing spacing' : 'Changes stay in this page. The canvas scrolls to show its full width.')}${this.editorError ? html`<ds-button @click=${() => { this.editorError = ''; }}>Dismiss</ds-button>` : ''}</footer>
    </div>`;
  }
}
if (!customElements.get('consistency-editor')) customElements.define('consistency-editor', ConsistencyEditor);
