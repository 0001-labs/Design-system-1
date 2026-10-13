// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
const { Input } = await import('../DS1/2-core/ds-input');
const { configureI18n, loadSharedWords, setLanguage } = await import('../DS1/0-face/i18n');
configureI18n({ languages: ['en', 'da'], autoLoad: false, sharedWords: true });
await loadSharedWords();
afterEach(() => { document.body.replaceChildren(); setLanguage('en'); });

async function field(attributes = '') {
  document.body.innerHTML = `<ds-input ${attributes}></ds-input>`;
  const control = document.querySelector('ds-input') as InstanceType<typeof Input>;
  await control.updateComplete;
  return { control, input: control.shadowRoot!.querySelector('input')! };
}

test('typing keeps value and events usable across a shadow boundary', async () => {
  const { control, input } = await field('name="email"');
  const typed = vi.fn(), changed = vi.fn(), detail = vi.fn();
  document.body.addEventListener('input', typed);
  document.body.addEventListener('change', changed);
  control.addEventListener('input-change', detail);
  input.value = 'reader@example.com';
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  expect(control.value).toBe('reader@example.com');
  expect(typed).toHaveBeenCalledTimes(1);
  expect(changed).toHaveBeenCalledTimes(1);
  expect(detail.mock.calls[0][0].detail).toEqual({ name: 'email', value: control.value });
  control.value = 'updated@example.com';
  await control.updateComplete;
  expect(input.value).toBe(control.value);
});

test('constraints, labels and mobile keyboard hints reach the native control', async () => {
  const { control, input } = await field('aria-label="Email code" aria-invalid="true" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required');
  expect(input.getAttribute('aria-label')).toBe('Email code');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(input.inputMode).toBe('numeric');
  expect(input.maxLength).toBe(6);
  expect(input.autocomplete).toBe('one-time-code');
  expect(input.hasAttribute('pattern')).toBe(false);
  expect(control.checkValidity()).toBe(false);
  control.value = '123456';
  await control.updateComplete;
  expect(control.checkValidity()).toBe(true);
  control.error = 'The code has expired';
  await control.updateComplete;
  expect(control.checkValidity()).toBe(false);
  expect(input.getAttribute('aria-describedby')).toBe('error');
  expect(control.validationMessage).toBe('The code has expired');
});

test('labels from a parent shadow root also name the native field', async () => {
  const host = document.createElement('div');
  host.attachShadow({ mode: 'open' }).innerHTML = '<ds-text id="label" text="Password"></ds-text><ds-input aria-labelledby="label"></ds-input>';
  document.body.append(host);
  const control = host.shadowRoot!.querySelector('ds-input')!;
  await control.updateComplete;
  expect(control.shadowRoot!.querySelector('input')!.getAttribute('aria-label')).toBe('Password');
});

test('password visibility preserves type, value and selection without submitting', async () => {
  const { control, input } = await field('type="password" revealable value="example-only"');
  const toggle = control.shadowRoot!.querySelector('button')!;
  const parentKey = vi.fn();
  control.addEventListener('keydown', parentKey);
  input.focus();
  input.setSelectionRange(2, 5);
  toggle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
  expect(parentKey).not.toHaveBeenCalled();
  expect(toggle.type).toBe('button');
  toggle.click();
  await control.updateComplete;
  expect(input.type).toBe('text');
  expect(control.type).toBe('password');
  expect(input.selectionStart).toBe(2);
  expect(input.selectionEnd).toBe(5);
  expect(control.value).toBe('example-only');
  expect(toggle.getAttribute('aria-pressed')).toBe('true');
  expect(toggle.getAttribute('aria-label')).toBe('Hide password');
  setLanguage('da');
  await control.updateComplete;
  expect(toggle.getAttribute('aria-label')).toBe('Skjul adgangskode');
  control.disabled = true;
  await control.updateComplete;
  toggle.click();
  expect(input.type).toBe('text');
  expect(toggle.disabled).toBe(true);
  control.formResetCallback();
  await control.updateComplete;
  expect(input.type).toBe('password');
});

test('form reset, restoration and fieldset disabling retain the public value contract', async () => {
  const { control, input } = await field('value="Initial"');
  control.value = 'Edited';
  await control.updateComplete;
  control.formResetCallback();
  await control.updateComplete;
  expect(input.value).toBe('Initial');
  control.formStateRestoreCallback('Restored');
  await control.updateComplete;
  expect(input.value).toBe('Restored');
  control.formDisabledCallback(true);
  await control.updateComplete;
  expect(input.disabled).toBe(true);
});

test.each(['ds-input', 'ds-textarea'])('a reflected disabled state can re-enable %s after native form reactions', async (tag) => {
  await import('../DS1/2-core/ds-textarea');
  const control = document.createElement(tag) as InstanceType<typeof Input>;
  document.body.append(control);
  await control.updateComplete;
  // Browsers deliver this native reaction synchronously during Lit's attribute
  // reflection. happy-dom does not implement form-associated custom elements.
  const setAttribute = control.setAttribute.bind(control), removeAttribute = control.removeAttribute.bind(control);
  vi.spyOn(control, 'setAttribute').mockImplementation((name, value) => {
    setAttribute(name, value);
    if (name === 'disabled') control.formDisabledCallback(true);
  });
  vi.spyOn(control, 'removeAttribute').mockImplementation(name => {
    removeAttribute(name);
    if (name === 'disabled') control.formDisabledCallback(false);
  });
  const native = control.shadowRoot!.querySelector('input, textarea') as HTMLInputElement;
  control.disabled = true; await control.updateComplete; await control.updateComplete;
  expect(native.disabled).toBe(true);
  control.disabled = false; await control.updateComplete; await control.updateComplete;
  expect(native.disabled).toBe(false);
  control.formDisabledCallback(true); await control.updateComplete; await control.updateComplete;
  expect(native.disabled).toBe(true);
  control.formDisabledCallback(false); await control.updateComplete; await control.updateComplete;
  expect(native.disabled).toBe(false);
});
