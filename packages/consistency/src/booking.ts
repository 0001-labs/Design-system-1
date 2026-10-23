import { LIBRARY_BRANDS } from '../../../website/src/lib/library-brands';
import voyage from '../../../website/public/examples/libraries/voyage.css?raw';
import { createPlainEditor } from '../../../website/src/vendor/aa/aa';
import '../../../DS1/2-core/ds-text';
import '../../../DS1/2-core/ds-image';
import '../../../DS1/2-core/ds-avatar';
import '../../../DS1/2-core/ds-checkbox';
import '../../../DS1/3-unit/ds-calendar';
import '../../../DS1/3-unit/ds-bento';
import '../../../DS1/3-unit/ds-carousel';
import '../../../DS1/4-page/ds-page';
import '../../../DS1/4-page/ds-footer';

/** The authored page, including its real DS1 components. Demo scripts never run in the editor. */
export class BookingExample extends HTMLElement {
  private editors: ReturnType<typeof createPlainEditor>[] = [];
  private fields: Record<string, string> = {};
  private voyageStyle?: HTMLStyleElement;
  set values(value: Record<string, string>) {
    this.fields = value;
    this.editors.forEach((editor, index) => {
      const text = value[`booking:${index}`] ?? this.defaults[index];
      if (editor.value !== text) editor.value = text;
    });
  }
  private defaults: string[] = [];
  set library(value: string) { if (this.voyageStyle) this.voyageStyle.disabled = value !== 'voyage'; }
  connectedCallback() {
    if (this.childNodes.length) return;
    this.classList.add('consistency-booking');
    const template = document.createElement('template');
    template.innerHTML = LIBRARY_BRANDS.booking.html;
    template.content.querySelectorAll('style').forEach(style => { style.textContent = `@scope (.consistency-booking) { ${style.textContent?.replaceAll('@media(max-width:', '@container(max-width:')} }`; });
    template.content.querySelectorAll('[src]').forEach(node => {
      const src = node.getAttribute('src')!;
      if (src.startsWith('/')) node.setAttribute('src', `https://designsystem1.com${src}`);
    });
    this.append(template.content);
    this.querySelectorAll('ds-button').forEach(button => {
      for (const node of [...button.childNodes]) if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        const label = document.createElement('span'); label.dataset.bookingLabel = ''; node.replaceWith(label); label.textContent = node.textContent;
      }
    });
    this.voyageStyle = document.createElement('style');
    this.voyageStyle.textContent = `@scope (.consistency-booking) { ${voyage.replace(/:root|:host\b|\bhtml(?=\s*\{)/g, ':scope')} }`;
    this.prepend(this.voyageStyle);
    const nodes = [...this.querySelectorAll<HTMLElement>('ds-text:not(:empty), span[slot="title"], span[slot="label"], [data-booking-label]')];
    nodes.forEach((node, index) => {
      const initial = node.textContent ?? '';
      this.defaults[index] = initial;
      const field = document.createElement('span'); node.replaceChildren(field);
      const editor = createPlainEditor(field, { value: this.fields[`booking:${index}`] ?? initial, onChange: value => {
        this.fields = { ...this.fields, [`booking:${index}`]: value };
        this.dispatchEvent(new CustomEvent('booking-change', { detail: this.fields, bubbles: true }));
      } });
      editor.element.setAttribute('aria-label', `Edit ${initial}`);
      this.editors.push(editor);
    });
    this.addEventListener('click', this.preventNavigation);
    this.addEventListener('submit', this.preventSubmit); this.addEventListener('keydown', this.historyKey, true);
  }
  private historyKey = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault(); event.stopImmediatePropagation();
      this.dispatchEvent(new CustomEvent('booking-history', { detail: event.shiftKey ? 'redo' : 'undo', bubbles: true }));
    }
  };
  private preventNavigation = (event: Event) => { if ((event.target as Element).closest('a,[href]')) event.preventDefault(); };
  private preventSubmit = (event: Event) => event.preventDefault();
  disconnectedCallback() { this.editors.forEach(editor => editor.destroy()); this.editors = []; this.replaceChildren(); this.removeEventListener('click', this.preventNavigation); this.removeEventListener('submit', this.preventSubmit); this.removeEventListener('keydown', this.historyKey, true); }
}
customElements.define('consistency-booking', BookingExample);
