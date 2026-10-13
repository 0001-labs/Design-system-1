// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { act, createElement as h, createRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Radio } from "../DS1/react/choice";
import "../DS1/2-core/ds-radio";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => document.body.replaceChildren());

test("radios retain native labels, required forms, group exclusion and reset", async () => {
  document.body.innerHTML = '<form id="choices"><label for="first">First</label><ds-radio><input id="first" name="group" type="radio" value="first" required></ds-radio><ds-radio choice label="Second"><input aria-label="Second" name="group" type="radio" value="second"></ds-radio></form><ds-radio><input form="choices" name="external" type="radio" value="yes" checked></ds-radio>';
  const first = document.querySelector<HTMLInputElement>('#first')!, second = document.querySelector<HTMLInputElement>('input[value="second"]')!;
  await Promise.all([...document.querySelectorAll('ds-radio')].map(el => el.updateComplete));
  expect(first.form!.checkValidity()).toBe(false);
  expect(first.labels![0].textContent).toBe('First');
  first.click(); expect(first.form!.checkValidity()).toBe(true);
  expect(new FormData(first.form!).get('group')).toBe('first');
  second.click(); expect(first.checked).toBe(false); expect(second.checked).toBe(true);
  expect(new FormData(first.form!).get('group')).toBe('second');
  expect(new FormData(first.form!).get('external')).toBe('yes');
  first.form!.reset(); expect(first.checked).toBe(false); expect(second.checked).toBe(false);
  document.querySelector('ds-radio')!.focus(); expect(document.activeElement).toBe(first);
});

test("controlled requests may be accepted or declined; native refs, names and disabled state remain intact", async () => {
  const mount = document.createElement('div'); document.body.append(mount);
  const root = createRoot(mount), ref = createRef<HTMLInputElement>(), requested = vi.fn();
  function Example({ decline = false, disabled = false }) {
    const [value, setValue] = useState('first');
    return h('form', null, ['first','second'].map(label => h(Radio, {
      key: label, name: 'group', value: label, checked: value === label, choice: true, label, disabled,
      ref: label === 'second' ? ref : undefined,
      preview: h('span',null,'Artwork'),
      onChange: () => { requested(label); if (!decline) setValue(label); },
    })));
  }
  try {
    await act(async () => root.render(h(Example,{decline:true})));
    await act(async () => ref.current!.click());
    expect(requested).toHaveBeenCalledWith('second'); expect(ref.current!.checked).toBe(false);
    expect(ref.current!.getAttribute('aria-label')).toBe('second'); expect(ref.current!.form).not.toBeNull();
    await act(async () => root.render(h(Example)));
    await act(async () => ref.current!.click()); expect(ref.current!.checked).toBe(true);
    await act(async () => root.render(h(Example,{disabled:true})));
    requested.mockClear(); await act(async () => ref.current!.click()); expect(requested).not.toHaveBeenCalled();
    const host = ref.current!.parentElement as HTMLElementTagNameMap['ds-radio']; await host.updateComplete;
    expect(host.shadowRoot!.querySelector('.face')!.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('[slot="preview"]')!.getAttribute('aria-hidden')).toBe('true');
    expect(mount.querySelectorAll('input')).toHaveLength(2);
  } finally { await act(async () => root.unmount()); }
});
