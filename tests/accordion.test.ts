// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';

vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
const { loadTranslations, setLanguage } = await import('../DS1/0-face/i18n');
await import('../DS1/3-unit/ds-accordion');

afterEach(() => {
  document.body.replaceChildren();
  setLanguage('en');
});

const texts = async (accordion: HTMLElement) => {
  await (accordion as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
  const parts = [...accordion.shadowRoot!.querySelectorAll('ds-text')];
  await Promise.all(parts.map(part => part.updateComplete));
  return parts;
};

test('a literal accordion shows what someone wrote and never translates it', async () => {
  loadTranslations('da', { Home: 'Hjem', Notes: 'Noter' });
  setLanguage('da');
  const accordion = document.createElement('ds-accordion');
  accordion.setAttribute('literal', '');
  accordion.summary = 'Home';
  accordion.details = 'Notes';
  document.body.append(accordion);
  const [summary, details] = await texts(accordion);
  expect(accordion.literal).toBe(true);
  expect(summary!.literal).toBe(true);
  expect(details!.literal).toBe(true);
  expect(summary!.shadowRoot!.textContent).toContain('Home');
  expect(summary!.shadowRoot!.textContent).not.toContain('Hjem');
  expect(details!.shadowRoot!.textContent).toContain('Notes');
});

test('without literal the summary and details stay translation keys', async () => {
  loadTranslations('da', { Home: 'Hjem', Notes: 'Noter' });
  setLanguage('da');
  const accordion = document.createElement('ds-accordion');
  accordion.summary = 'Home';
  accordion.details = 'Notes';
  document.body.append(accordion);
  const [summary, details] = await texts(accordion);
  expect(accordion.hasAttribute('literal')).toBe(false);
  expect(summary!.literal).toBe(false);
  expect(summary!.shadowRoot!.textContent).toContain('Hjem');
  expect(details!.shadowRoot!.textContent).toContain('Noter');
});

test('the summary carries the library chevron at its end, never a drawn one', async () => {
  const accordion = document.createElement('ds-accordion');
  accordion.summary = 'Notes';
  document.body.append(accordion);
  await texts(accordion);
  const root = accordion.shadowRoot!;
  const chevron = root.querySelector('summary .chevron')!;
  expect(chevron.getAttribute('type')).toBe('chevron-down');
  expect(chevron.getAttribute('size')).toBe('large');
  expect(root.querySelector('svg')).toBeNull();
  expect(root.querySelector('[centered]')).toBeNull();
  // The words first, the chevron last.
  expect([...root.querySelector('.summaryRow')!.children].map(child => child.className)).toEqual(['summaryText', 'chevron']);
});
