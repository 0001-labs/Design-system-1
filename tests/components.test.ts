// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';

vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
await import('../DS1/components');

afterEach(() => document.body.replaceChildren());

test('host buttons preserve roles, activate once by keyboard, and block disabled input immediately', async () => {
  const button = document.createElement('ds-button');
  button.control = 'host';
  button.textContent = 'Publish';
  button.setAttribute('role', 'tab');
  button.setAttribute('tabindex', '-1');
  document.body.append(button);
  await button.updateComplete;
  const clicked = vi.fn();
  button.addEventListener('click', clicked);
  button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
  expect(clicked).toHaveBeenCalledTimes(1);
  button.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
  expect(clicked).toHaveBeenCalledTimes(2);
  button.disabled = true;
  button.click();
  button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  expect(clicked).toHaveBeenCalledTimes(2);
  expect(button.getAttribute('aria-disabled')).toBe('true');
  button.disabled = false;
  expect(button.getAttribute('tabindex')).toBe('-1');
  expect(button.getAttribute('role')).toBe('tab');
  expect(button.shadowRoot?.querySelector('button')).toBeNull();
});

test('native buttons retain the shadow control and bubble one click', async () => {
  const button = document.createElement('ds-button');
  button.textContent = 'Save';
  document.body.append(button);
  await button.updateComplete;
  const clicked = vi.fn();
  button.addEventListener('click', clicked);
  button.shadowRoot!.querySelector('button')!.click();
  expect(clicked).toHaveBeenCalledTimes(1);
  button.disabled = true;
  button.shadowRoot!.querySelector('button')!.click();
  expect(clicked).toHaveBeenCalledTimes(1);
});

test('literal text leaves renderer-owned children intact and accepts later updates', async () => {
  const text = document.createElement('ds-text');
  text.literal = true;
  const label = document.createTextNode('First');
  text.append(label);
  document.body.append(text);
  await text.updateComplete;
  expect(text.firstChild).toBe(label);
  expect(text.shadowRoot!.querySelector('slot')).not.toBeNull();
  label.data = 'Updated';
  expect(text.textContent).toBe('Updated');
  text.text = 'Home';
  await text.updateComplete;
  expect(text.shadowRoot!.textContent).toContain('Home');
});

test('menus move through enabled host controls and panels retain their named slots', async () => {
  const menu = document.createElement('ds-menu');
  const choices = ['First', 'Disabled', 'Last'].map(label => {
    const choice = document.createElement('ds-button');
    choice.control = 'host';
    choice.setAttribute('role', 'option');
    choice.textContent = label;
    return choice;
  });
  choices[1].disabled = true;
  menu.append(...choices);
  document.body.append(menu);
  await Promise.all([menu.updateComplete, ...choices.map(choice => choice.updateComplete)]);
  choices[0].focus();
  choices[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  expect(document.activeElement).toBe(choices[2]);
  choices[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  expect(document.activeElement).toBe(choices[0]);
  const panel = document.createElement('ds-panel');
  document.body.append(panel);
  await panel.updateComplete;
  expect(panel.shadowRoot!.querySelector('slot[name="header"]')).not.toBeNull();
  expect(panel.shadowRoot!.querySelector('slot[name="footer"]')).not.toBeNull();
});

test('a column list supports arbitrary positive column counts', async () => {
  const list = document.createElement('ds-list');
  list.columns = 5;
  document.body.append(list);
  await list.updateComplete;
  expect(list.style.getPropertyValue('--ds-list-columns')).toBe('5');
  list.columns = undefined;
  await list.updateComplete;
  expect(list.style.getPropertyValue('--ds-list-columns')).toBe('');
});

test('shared icons preserve coloured artwork while monochrome drawings follow the text', async () => {
  const icons = ['close', 'block-table'].map(type => {
    const icon = document.createElement('ds-icon');
    icon.type = type as typeof icon.type;
    document.body.append(icon);
    return icon;
  });
  await Promise.all(icons.map(icon => icon.updateComplete));
  expect(icons[0].shadowRoot!.innerHTML).toContain('currentColor');
  expect(icons[1].shadowRoot!.innerHTML).toMatch(/#1e1e1e/i);
});
