import { type EditorMedia, siteImageSource } from './media';
import { createSurfaceElement } from './editor-surface';
import type { Atom } from '../../../website/src/vendor/aa/aa';
import { applyLibraryTokens } from './libraries';
import '../../../DS1/3-unit/ds-carousel';
import '../../../DS1/2-core/ds-empty';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-input';
import '../../../DS1/3-unit/ds-select';
import './carousel.css';
import { EMPTY_CAROUSEL, safeCarouselSource, readCarousel, writeCarousel, type CarouselSlide, type CarouselContent } from '../../../shared/consistency-carousel';
export { EMPTY_CAROUSEL, safeCarouselSource, readCarousel, writeCarousel, type CarouselSlide, type CarouselContent } from '../../../shared/consistency-carousel';
const MAX_SLIDES = 12, MAX_FILE = 4 * 1024 * 1024, MAX_BATCH = 8 * 1024 * 1024, MAX_DATA = 16 * 1024 * 1024;
export function moveCarouselSlide(slides: readonly CarouselSlide[], from: number, to: number): CarouselSlide[] {
  if (from < 0 || from >= slides.length || to < 0 || to >= slides.length) return [...slides];
  const result = [...slides], [slide] = result.splice(from, 1); result.splice(to, 0, slide); return result;
}
/** One DS1 carousel, one Aa atom and one source change per edit. No parallel text editor. */
export function carouselAtom(canWrite: () => boolean, getHost: () => HTMLElement | null, media?: EditorMedia): Atom {
 return {
  name: 'consistency-carousel', fence: 'c9y-carousel', match: () => 0,
  insert: { label: 'Carousel', icon: 'image', keywords: 'carousel slides slideshow gallery images', source: writeCarousel(EMPTY_CAROUSEL), preview(target) {
    { const owner = getHost()?.closest<HTMLElement>('[data-consistency-library]'); applyLibraryTokens(target, owner?.dataset.consistencyLibrary ?? 'original', owner?.dataset.consistencyFonts); }
    const empty = createSurfaceElement(target.ownerDocument, 'ds-empty'); empty.literal = true; empty.heading = 'An empty carousel'; empty.text = 'Add your own images.'; target.append(empty);
    return () => target.replaceChildren();
  } },
  draw(element, initialSource) {
    let value = readCarousel(initialSource); if (!value) { element.textContent = initialSource; return; }
    let source = initialSource, current = value.current ?? 0, destroyed = false, syncing = false;
    const doc = element.ownerDocument;
    element.classList.add('consistency-content-element', 'consistency-content-carousel'); element.setAttribute('data-aa-interactive', ''); element.setAttribute('role', 'group'); element.setAttribute('aria-label', 'Carousel');
    const frame = doc.createElement('div'); frame.className = 'consistency-carousel-frame';
    const face = createSurfaceElement(doc, 'ds-carousel'); face.literal = true; face.label = 'Your images'; face.buttons = true; face.gap = 0; face.setAttribute('bleed', 'none');
    const empty = createSurfaceElement(doc, 'ds-empty'); empty.literal = true; empty.heading = 'Add your first image'; empty.text = media ? 'Choose an image or add its address.' : 'Upload an image or add its address.';
    frame.append(face, empty); element.append(frame);
    const toolbar = doc.createElement('div'); toolbar.className = 'consistency-carousel-tools'; toolbar.setAttribute('data-aa-interactive', ''); toolbar.setAttribute('role', 'toolbar'); toolbar.setAttribute('aria-label', 'Carousel images'); element.append(toolbar);
    // An outside press wins over :focus-within until a fresh entry or focus.
    const showTools = () => element.removeAttribute('data-tools-dismissed');
    const focusTools = (event: FocusEvent) => { if (toolbar.contains(event.target as Node)) showTools(); };
    const dismissTools = (event: PointerEvent) => {
      if (!event.composedPath().includes(toolbar)) element.setAttribute('data-tools-dismissed', '');
    };
    element.addEventListener('pointerenter', showTools);
    element.addEventListener('focusin', focusTools);
    doc.addEventListener('pointerdown', dismissTools);
    const status = doc.createElement('span'); status.className = 'consistency-carousel-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); toolbar.append(status);
    const actions = doc.createElement('div'); actions.className = 'consistency-carousel-actions'; toolbar.append(actions);
    const button = (label: string, action: () => void) => {
      const control = createSurfaceElement(doc, 'ds-button'); control.textContent = label; control.addEventListener('click', () => { if (canWrite()) action(); }); actions.append(control); return control;
    };
    const picker = doc.createElement('input'); picker.type = 'file'; picker.accept = 'image/png,image/jpeg,image/gif,image/webp,image/avif,image/bmp'; picker.multiple = true; picker.hidden = true; toolbar.append(picker);
    const upload = button(media ? 'Choose image' : 'Upload images', () => { replacing = false; void choose(); });
    let replacing = false;
    const changeFile = button('Change image', () => { replacing = true; void choose(); });
    const previous = button('Previous', () => select(current - 1));
    const next = button('Next', () => select(current + 1));
    const left = button('Move left', () => move(-1));
    const right = button('Move right', () => move(1));
    const remove = button('Remove image', () => {
      const slides = value!.slides.filter((_, index) => index !== current); current = Math.max(0, Math.min(slides.length - 1, current)); update({ ...value!, slides });
    });
    const field = (label: string, placeholder = '') => { const input = createSurfaceElement(doc, 'ds-input'); input.setAttribute('aria-label', label); input.placeholder = placeholder; toolbar.append(input); return input; };
    const address = field('Image address', 'https://example.com/image.jpg');
    const add = button('Add address', () => {
      if (!safeCarouselSource(address.value) || (media && !siteImageSource(address.value))) return error('Use an http or https image address.');
      if (value!.slides.length >= MAX_SLIDES) return error('A carousel holds up to 12 images.');
      current = value!.slides.length; update({ ...value!, slides: [...value!.slides, { id: crypto.randomUUID(), src: address.value.trim(), alt: '', fit: 'cover' }] });
    });
    const changeAddress = button('Change address', () => {
      if (!safeCarouselSource(address.value) || (media && !siteImageSource(address.value))) return error('Use an http or https image address.');
      updateSlide({ src: address.value.trim() });
    });
    const alternative = field('Image description', 'Describe this image');
    alternative.addEventListener('change', () => { if (canWrite()) updateSlide({ alt: alternative.value.slice(0, 500) }); });
    const fit = createSurfaceElement(doc, 'ds-select'), fitSelect = doc.createElement('select'); fitSelect.setAttribute('aria-label', 'Image fit');
    for (const [key, label] of [['cover', 'Fill the slide'], ['contain', 'Show the whole image']]) { const option = doc.createElement('option'); option.value = key; option.textContent = label; fitSelect.append(option); }
    fit.append(fitSelect); toolbar.append(fit);
    fitSelect.addEventListener('change', () => { if (canWrite()) updateSlide({ fit: fitSelect.value as 'cover' | 'contain' }); });
    const error = (message: string) => { status.textContent = message; status.setAttribute('role', 'alert'); };
    const select = (index: number) => { current = Math.max(0, Math.min(value!.slides.length - 1, index)); face.current = current; syncControls(); };
    const updateSlide = (patch: Partial<CarouselSlide>) => { if (!value!.slides[current]) return; const slides = value!.slides.map((slide, index) => index === current ? { ...slide, ...patch } : slide); update({ ...value!, slides }); };
    const move = (direction: number) => { const destination = current + direction; if (destination < 0 || destination >= value!.slides.length) return; const slides = moveCarouselSlide(value!.slides, current, destination); current = destination; update({ ...value!, slides }); };
    const syncControls = () => {
      const slide = value!.slides[current], writable = canWrite();
      status.setAttribute('role', 'status'); status.textContent = slide ? `Image ${current + 1} of ${value!.slides.length}` : 'No images yet';
      address.value = slide?.src.startsWith('data:') ? '' : slide?.src ?? ''; alternative.value = slide?.alt ?? ''; alternative.disabled = !slide || !writable; fitSelect.disabled = !slide || !writable; fitSelect.value = slide?.fit ?? 'cover';
      previous.disabled = !writable || current <= 0; next.disabled = !writable || current >= value!.slides.length - 1;
      left.disabled = !writable || current <= 0; right.disabled = !writable || current >= value!.slides.length - 1;
      remove.disabled = changeFile.disabled = changeAddress.disabled = !writable || !slide;
      upload.disabled = add.disabled = !writable || value!.slides.length >= MAX_SLIDES; address.disabled = !writable;
      toolbar.hidden = !writable; element.tabIndex = writable ? 0 : -1;
    };
    const paint = () => {
      syncing = true;
      frame.style.height = `calc(${value!.height}px * var(--sf))`; frame.style.setProperty('--consistency-carousel-height', `calc(${value!.height}px * var(--sf))`);
      frame.style.width = value!.width ? `calc(${value!.width}px * var(--sf))` : '100%';
      face.hidden = !value!.slides.length; empty.hidden = !!value!.slides.length;
      face.replaceChildren(...value!.slides.map(slide => { const figure = doc.createElement('figure'); figure.className = 'consistency-carousel-slide'; const image = doc.createElement('img'); image.src = slide.src; image.alt = slide.alt; image.draggable = false; image.style.objectFit = slide.fit; image.loading = 'lazy'; figure.append(image); return figure; }));
      face.current = current; syncControls(); syncing = false;
    };
    const update = (nextValue: CarouselContent) => {
      if (!canWrite() || destroyed) return;
      const nextSource = writeCarousel({ ...nextValue, current }); if (nextSource.length > MAX_DATA) return error('These images are too large for this draft. Remove an image or choose a smaller file.');
      value = { ...nextValue, current }; source = nextSource; paint();
      element.dispatchEvent(new CustomEvent('aa-atom-source', { bubbles: true, detail: { source } }));
    };
    const choose = async () => {
      if (!media) { picker.click(); return; }
      if (!canWrite() || destroyed) return;
      const snapshot = source, replace = replacing, index = current;
      try {
        const chosen = await media.chooseImage(element);
        if (!chosen || destroyed || !canWrite() || source !== snapshot) return;
        if (!siteImageSource(chosen.src)) return error('Choose an image from this site or an http or https address.');
        const slide: CarouselSlide = { id:crypto.randomUUID(), src:chosen.src, alt:chosen.alt.slice(0,500), fit:'cover' };
        if (replace && value!.slides[index]) { const slides = [...value!.slides]; slides[index] = { ...slide, id:slides[index].id }; current = index; update({ ...value!, slides }); }
        else if (value!.slides.length < MAX_SLIDES) { current = value!.slides.length; update({ ...value!, slides:[...value!.slides,slide] }); }
      } catch { if (!destroyed) error('The image could not be selected. Try again.'); }
    };
    const files = async () => {
      if (media) { picker.value = ''; return error('Choose an image from this site.'); }
      const selected = Array.from(picker.files ?? []); picker.value = ''; if (!canWrite() || !selected.length) return;
      if ((replacing ? 1 : value!.slides.length + selected.length) > MAX_SLIDES || (replacing && selected.length !== 1)) return error(replacing ? 'Choose one replacement image.' : 'A carousel holds up to 12 images.');
      if (selected.some(file => file.size > MAX_FILE || !/^image\/(png|jpeg|gif|webp|avif|bmp)$/i.test(file.type)) || selected.reduce((sum, file) => sum + file.size, 0) > MAX_BATCH) return error('Choose image files up to 4 MB each, with no more than 8 MB at once.');
      const snapshot = source, replace = replacing, index = current;
      try {
        const slides = await Promise.all(selected.map(async file => ({ id: crypto.randomUUID(), alt: file.name.replace(/\.[^.]+$/, '').slice(0, 500), fit: 'cover' as const, src: await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('The image could not be read.')); reader.readAsDataURL(file); }) })));
        if (destroyed || !canWrite() || source !== snapshot) return;
        if (replace) { const all = [...value!.slides]; all[index] = { ...slides[0], id: all[index].id }; current = index; update({ ...value!, slides: all }); }
        else { current = value!.slides.length; update({ ...value!, slides: [...value!.slides, ...slides] }); }
      } catch { if (!destroyed) error('The image could not be read. Try again.'); }
    };
    picker.addEventListener('change', files);
    const changed = (event: Event) => { if (syncing || event.target !== face || !(event instanceof CustomEvent)) return; current = event.detail.index; syncControls(); };
    face.addEventListener('change', changed);
    const resize = (event: Event) => { const size = (event as CustomEvent<{ width: number; height: number }>).detail; update({ ...value!, width: size.width, height: size.height }); };
    element.addEventListener('consistency-resize', resize);
    const key = (event: KeyboardEvent) => { if (!canWrite() || event.target !== element) return; if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); event.stopPropagation(); element.dispatchEvent(new CustomEvent('aa-atom-source', { bubbles: true, detail: { source: '' } })); } };
    element.addEventListener('keydown', key);
    const observer = new MutationObserver(syncControls);
    queueMicrotask(() => { const block = element.closest('.aa-block'); if (element.isConnected && block) observer.observe(block, { attributes: true, attributeFilter: ['data-readonly'] }); });
    paint();
    return () => { destroyed = true; observer.disconnect(); element.removeEventListener('pointerenter', showTools); element.removeEventListener('focusin', focusTools); doc.removeEventListener('pointerdown', dismissTools); element.removeEventListener('consistency-resize', resize); element.removeEventListener('keydown', key); face.removeEventListener('change', changed); picker.removeEventListener('change', files); };
  },
 };
}
