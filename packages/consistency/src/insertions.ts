import type { Atom, Command } from '../../../website/src/vendor/aa/aa';
import { PAGE_INSERTIONS } from '../../../shared/consistency-insertions';
import { icons, deferredIconNames } from '../../../DS1/2-core/generated/icons-immediate';
import '../../../DS1/2-core/ds-icon';
import './insertions.css';
const entry = (id: string) => PAGE_INSERTIONS.find(item => item.id === id)!;
const iconNames = new Set([...Object.keys(icons), ...deferredIconNames]);

/** Aliases complement Aa's existing Table and Tabs commands without replacing either. */
export const pageCommands: Command[] = ['list', 'link'].map(id => ({
  id: `insert-page-${id}`, label: entry(id).label, icon: entry(id).icon,
  run(editor) {
    const block = editor.activeBlock(), empty = !block?.block.source.trim();
    const start = block ? empty ? block.start : block.end : editor.value.length;
    const lead = empty ? '' : '\n\n', source = entry(id).source;
    editor.replace(start, block && empty ? block.end : start, lead + source);
    editor.selectRange(start + lead.length + (id === 'list' ? 2 : 1), start + lead.length + (id === 'list' ? source.length : 5));
  },
}));

/** Only the empty image needs an adapter; uploading replaces it with Aa's normal image Markdown. */
export function pageAtoms(canWrite: () => boolean): Atom[] {
  return [{
    name: 'page-image', fence: 'c9y-image', match: () => 0, insert: entry('image'),
    draw(element) {
      const doc = element.ownerDocument;
      element.classList.add('consistency-image-placeholder'); element.setAttribute('role', 'button');
      element.setAttribute('aria-label', 'Choose an image, or drop one here'); element.tabIndex = canWrite() ? 0 : -1;
      element.textContent = 'Drop an image here';
      const picker = doc.createElement('input'); picker.type = 'file'; picker.accept = 'image/png,image/jpeg,image/gif,image/webp,image/avif'; picker.hidden = true; element.append(picker);
      let reading = false, disposed = false;
      const load = async (file?: File) => {
        if (!file || !canWrite() || reading) return;
        if (!/^image\/(png|jpeg|gif|webp|avif)$/i.test(file.type) || file.size > 4 * 1024 * 1024) { element.firstChild!.textContent = 'Choose an image up to 4 MB'; return; }
        reading = true;
        try {
          const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reader.onabort = reject; reader.readAsDataURL(file); });
          if (disposed || !element.isConnected || !canWrite()) return;
          const alt = file.name.replace(/[\[\]\\\r\n]/g, '');
          element.dispatchEvent(new CustomEvent('aa-atom-source', { bubbles: true, detail: { source: `![${alt}](${url})` } }));
        } catch { if (!disposed) element.firstChild!.textContent = 'Could not read the image. Try again.'; }
        finally { reading = false; }
      };
      const change = () => { void load(picker.files?.[0]); picker.value = ''; };
      const click = (event: MouseEvent) => { if (event.target !== picker && canWrite()) { event.stopPropagation(); picker.click(); } };
      const key = (event: KeyboardEvent) => { if (event.target === element && ['Enter', ' '].includes(event.key) && canWrite()) { event.preventDefault(); event.stopPropagation(); picker.click(); } };
      const over = (event: DragEvent) => { if (canWrite() && event.dataTransfer?.types.includes('Files')) { event.preventDefault(); event.stopPropagation(); } };
      const drop = (event: DragEvent) => { if (!canWrite()) return; event.preventDefault(); event.stopPropagation(); void load(event.dataTransfer?.files[0]); };
      picker.addEventListener('change', change); element.addEventListener('click', click); element.addEventListener('keydown', key); element.addEventListener('dragover', over); element.addEventListener('drop', drop);
      return () => { disposed = true; picker.removeEventListener('change', change); element.removeEventListener('click', click); element.removeEventListener('keydown', key); element.removeEventListener('dragover', over); element.removeEventListener('drop', drop); };
    },
  }, {
    name: 'page-icon', match: (source, at) => /^:icon\[[a-z0-9-]{1,80}\]/.exec(source.slice(at))?.[0].length ?? 0, insert: entry('icon'),
    draw(element, source) {
      const name = source.slice(6, -1), doc = element.ownerDocument;
      const face = doc.createElement('ds-icon'); face.type = name as typeof face.type; element.append(face);
      element.setAttribute('aria-label', `Icon: ${name}. Double-click or press Enter to choose its name.`); element.tabIndex = canWrite() ? 0 : -1;
      let field: HTMLInputElement | undefined;
      const open = () => {
        if (!canWrite() || field) return;
        field = doc.createElement('input'); field.className = 'consistency-icon-name'; field.value = name; field.setAttribute('aria-label', 'Icon name'); field.setAttribute('data-aa-interactive', '');
        const close = (save: boolean) => {
          if (!field) return;
          const next = field.value.trim().toLowerCase();
          if (save && !iconNames.has(next)) { field.setAttribute('aria-invalid', 'true'); return; }
          const previous = field; field = undefined; previous.remove(); face.hidden = false;
          if (save && canWrite() && next !== name) element.dispatchEvent(new CustomEvent('aa-atom-source', { bubbles: true, detail: { source: `:icon[${next}]` } }));
        };
        field.addEventListener('keydown', event => { event.stopPropagation(); if (event.key === 'Enter' || event.key === 'Escape') { event.preventDefault(); close(event.key === 'Enter'); } });
        field.addEventListener('blur', () => close(true)); face.hidden = true; element.append(field); field.focus(); field.select();
      };
      const key = (event: KeyboardEvent) => { if (event.target === element && event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); open(); } };
      element.addEventListener('dblclick', open); element.addEventListener('keydown', key);
      return () => { element.removeEventListener('dblclick', open); element.removeEventListener('keydown', key); };
    },
  }];
}
