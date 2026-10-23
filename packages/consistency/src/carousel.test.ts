// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vite-plus/test';
vi.hoisted(() => { globalThis.fetch = async () => new Response('{}'); });
import { carouselAtom, EMPTY_CAROUSEL, readCarousel, writeCarousel, moveCarouselSlide, safeCarouselSource } from './carousel';
import { createEditor } from '../../../website/src/vendor/aa/aa';
import { ResizingLayer } from './resize';
afterEach(() => document.body.replaceChildren());
const slide = (id: string) => ({ id, src: `https://example.com/${id}.png`, alt: id, fit: 'cover' as const });
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function click(host: ParentNode, label: string) { const button = Array.from(host.querySelectorAll<HTMLElement>('ds-button')).find(item => item.textContent === label); expect(button, label).toBeDefined(); button!.click(); }
function address(host: ParentNode, url: string) { host.querySelector<HTMLElementTagNameMap['ds-input']>('[aria-label="Image address"]')!.value = url; }
it('starts empty, roundtrips closed source and rejects unsafe image input', () => {
 expect(readCarousel(writeCarousel(EMPTY_CAROUSEL))).toEqual(EMPTY_CAROUSEL);
 expect(safeCarouselSource('javascript:alert(1)')).toBe(false); expect(safeCarouselSource('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
 expect(readCarousel(writeCarousel({ kind: 'carousel', height: 280, slides: [slide('same'), slide('same')] }))).toBeNull();
 expect(readCarousel(writeCarousel({ ...EMPTY_CAROUSEL, slides: [{ ...slide('safe'), alt: '``` <script>"' }] }))?.slides[0].alt).toBe('``` <script>"');
 expect(moveCarouselSlide([slide('a'), slide('b')], 0, 1).map(item => item.id)).toEqual(['b','a']);
});
it('edits real carousel images through Aa, navigates, reorders and undoes', async () => {
 const host = document.createElement('div'); document.body.append(host);
 const editor = createEditor(host, { value: writeCarousel(EMPTY_CAROUSEL), atoms: [carouselAtom(() => true, () => host)] });
 expect(host.querySelector('ds-empty')?.getAttribute('heading')).not.toBe('');
 expect(host.querySelectorAll('img')).toHaveLength(0);
 address(host, 'https://example.com/one.png'); click(host, 'Add address'); await tick();
 address(host, 'https://example.com/two.png'); click(host, 'Add address'); await tick();
 expect(readCarousel(editor.value)?.slides.map(item => item.src)).toEqual(['https://example.com/one.png','https://example.com/two.png']);
 click(host, 'Previous'); expect(host.querySelector<HTMLElementTagNameMap['ds-carousel']>('ds-carousel')!.current).toBe(0);
 click(host, 'Next'); expect(host.querySelector<HTMLElementTagNameMap['ds-carousel']>('ds-carousel')!.current).toBe(1);
 const alt = host.querySelector<HTMLElementTagNameMap['ds-input']>('[aria-label="Image description"]')!; alt.value = 'Second image'; alt.dispatchEvent(new Event('change')); await tick();
 expect(readCarousel(editor.value)?.slides[1].alt).toBe('Second image');
 click(host, 'Move left'); await tick(); expect(readCarousel(editor.value)?.slides[0].alt).toBe('Second image');
 click(host, 'Remove image'); await tick(); expect(readCarousel(editor.value)?.slides).toHaveLength(1);
 editor.undo(); expect(readCarousel(editor.value)?.slides).toHaveLength(2);
 editor.undo(); expect(readCarousel(editor.value)?.slides[1].alt).toBe('Second image');
 editor.destroy();
});
it('resizes the actual empty atom with diagonal keyboard control, then Aa undoes the size', async () => {
 const root = document.createElement('div'), host = document.createElement('div'); host.className = 'consistency-sheet'; root.append(host); document.body.append(root);
 const editor = createEditor(host, { value: writeCarousel(EMPTY_CAROUSEL), atoms: [carouselAtom(() => true, () => host)] });
 const frame = host.querySelector<HTMLElement>('.consistency-carousel-frame')!;
 Object.defineProperty(frame.closest('.aa-block')!, 'clientWidth', { value: 640 });
 frame.getBoundingClientRect = () => { const width = frame.style.width === '100%' ? 640 : Number(frame.style.width.match(/[\d.]+/)?.[0]) || 640, height = Number(frame.style.height.match(/[\d.]+/)?.[0]) || 280; return { left: 0, top: 0, width, height, right: width, bottom: height } as DOMRect; };
 const layer = new ResizingLayer(root, { enabled: () => true, size: () => undefined, commit: vi.fn() }); layer.refresh();
 const corner = frame.querySelector<HTMLElement>('[aria-label="Carousel size"]')!; expect(corner).not.toBeNull();
 corner.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })); await tick();
 expect(readCarousel(editor.value)).toMatchObject({ width: 620, height: 260 });
 editor.undo(); expect(readCarousel(editor.value)?.width).toBeUndefined(); expect(readCarousel(editor.value)?.height).toBe(280);
 layer.destroy(); editor.destroy();
});
it('readonly carousel never accepts source changes and exposes no image controls', () => {
 const host = document.createElement('span'); document.body.append(host); const atom = carouselAtom(() => false, () => host), change = vi.fn();
 const dispose = atom.draw!(host, writeCarousel(EMPTY_CAROUSEL)); host.addEventListener('aa-atom-source', change);
 address(host, 'https://example.com/one.png'); click(host, 'Add address');
 expect(change).not.toHaveBeenCalled(); expect(host.querySelector<HTMLElement>('.consistency-carousel-tools')!.hidden).toBe(true); dispose?.();
});
