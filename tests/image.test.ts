// @vitest-environment happy-dom
import { afterEach, expect, test } from 'vite-plus/test';
import '../DS1/2-core/ds-image';
afterEach(() => document.body.replaceChildren());
test('keeps native alt text, responsive sources and intrinsic dimensions', async () => {
  document.body.innerHTML = '<ds-image src="photo.jpg" alt="Forest" width="1200" height="800" srcset="small.jpg 600w, photo.jpg 1200w" sizes="100vw" caption="Morning"></ds-image>';
  const element = document.querySelector('ds-image')!; await element.updateComplete;
  const img = element.shadowRoot!.querySelector('img')!;
  expect(img.alt).toBe('Forest'); expect(img.width).toBe(1200); expect(img.height).toBe(800);
  expect(img.getAttribute('loading')).toBe('lazy'); expect(img.srcset).toContain('600w');
  expect(element.shadowRoot!.querySelector('figcaption')!.textContent).toBe('Morning');
  element.alt = ''; element.caption = ''; element.loading = 'eager'; element.fit = 'contain'; element.ratio = '1';
  await element.updateComplete;
  expect(img.alt).toBe(''); expect(img.getAttribute('loading')).toBe('eager');
  expect(img.style.objectFit).toBe('contain'); expect(img.style.height).toBe('100%');
  expect(element.shadowRoot!.querySelector('figcaption')).toBeNull();
});
test('an empty source does not request the document URL', async () => {
  const element = document.createElement('ds-image'); document.body.append(element); await element.updateComplete;
  expect(element.shadowRoot!.querySelector('img')!.hasAttribute('src')).toBe(false);
});
