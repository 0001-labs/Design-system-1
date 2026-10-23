// @vitest-environment happy-dom
import { expect, it } from 'vite-plus/test';
import { componentName, visibleComponentBox, ComponentNamesLayer } from './component-names';
it('names actual inserted units and native text without a duplicate adapter label', () => {
 const node = document.createElement('div'); node.innerHTML = '<div class="aa-block" data-kind="heading" data-level="2">Heading</div><div class="aa-block" data-kind="table"></div><span class="aa-atom" data-atom="columns"></span><span class="aa-atom" data-atom="image"></span><span class="aa-atom" data-atom="consistency-card"><ds-card></ds-card></span><div class="aa-plain"><div class="aa-block">Card title</div></div>';
 expect(componentName(node.children[0] as HTMLElement)).toBe('Heading 2'); expect(componentName(node.children[1] as HTMLElement)).toBe('Table'); expect(componentName(node.children[2] as HTMLElement)).toBe('Columns'); expect(componentName(node.children[3] as HTMLElement)).toBe('Image'); expect(componentName(node.children[4] as HTMLElement)).toBeNull(); expect(componentName(node.querySelector('ds-card')!)).toBe('Card'); expect(componentName(node.querySelector('.aa-plain .aa-block')!)).toBeNull();
});
it('names empty carousels but excludes editing controls from the component layer', () => {
 const node = document.createElement('div'); node.innerHTML = '<div class="consistency-carousel-frame"></div><div class="consistency-carousel-tools"><ds-button>Upload images</ds-button></div>';
 expect(componentName(node.firstElementChild as HTMLElement)).toBe('Carousel');
 expect(componentName(node.querySelector('ds-button')!)).toBeNull();
});
it('clips wide/offscreen components to the visible canvas without extending the document', () => {
 expect(visibleComponentBox({ left: -20, top: 20, right: 900, bottom: 140 }, [{ left: 0, top: 0, right: 390, bottom: 100 }])).toEqual({ left: 0, top: 20, width: 390, height: 80 });
 expect(visibleComponentBox({ left: 500, top: 0, right: 600, bottom: 20 }, [{ left: 0, top: 0, right: 390, bottom: 100 }])).toBeNull();
});
it('keeps its presentation outside the editor and removes it on cleanup', () => {
 const root = document.createElement('div'); root.innerHTML = '<div class="consistency-stage"><div class="consistency-sheet"><ds-card></ds-card></div></div>'; document.body.append(root); const before = root.innerHTML;
 const layer = new ComponentNamesLayer(root, { enabled: () => true }); layer.refresh(); expect(root.innerHTML).toBe(before); expect(document.body.querySelector('.consistency-component-names')?.getAttribute('aria-hidden')).toBe('true');
 layer.destroy(); expect(document.querySelector('.consistency-component-names')).toBeNull(); root.remove();
});
