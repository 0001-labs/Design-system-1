// @vitest-environment happy-dom
import { expect, it } from 'vite-plus/test';
import { setExamplesDevice } from '../website/src/lib/examples-device';

it('switches layout and HTML previews together and clears the previous device', () => {
  const gallery = document.createElement('main');
  gallery.innerHTML = '<section data-layout-example="shop"><div class="example-device"></div></section><section><div class="example-device"></div></section>';
  let changes = 0;
  gallery.firstElementChild!.addEventListener('example-device-change', () => changes++);
  setExamplesDevice(gallery, 'mobile');
  expect(gallery.querySelectorAll('[data-phone]')).toHaveLength(2);
  setExamplesDevice(gallery, 'tablet');
  expect(gallery.querySelectorAll('[data-phone]')).toHaveLength(0);
  expect(gallery.querySelectorAll('[data-tablet]')).toHaveLength(2);
  setExamplesDevice(gallery, 'computer');
  expect(gallery.querySelectorAll('[data-phone], [data-tablet]')).toHaveLength(0);
  expect(changes).toBe(3);
  setExamplesDevice(gallery, 'invalid');
  expect(gallery.dataset.globalExampleDevice).toBe('computer');
});
