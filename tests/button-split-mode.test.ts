// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { Button } from '../DS1/2-core/ds-button';
import '../DS1/2-core/ds-split';
afterEach(() => document.body.replaceChildren());
test('Button split mode retains cancelable choice events, actions, focus and disabled state', async () => {
  const button = new Button(); button.split = true; button.options = 'day:Day,week:Week'; button.value = 'day';
  document.body.append(button); await button.updateComplete;
  expect(button.getAttribute('role')).toBe('group');
  const controls=()=>[...button.shadowRoot!.querySelectorAll('button')];
  const changed=vi.fn();button.addEventListener('change',changed);
  controls()[1].click();await button.updateComplete;expect(button.value).toBe('week');expect(changed).toHaveBeenCalledOnce();
  button.addEventListener('change',event=>event.preventDefault());controls()[0].click();expect(button.value).toBe('week');
  button.focus();expect(button.shadowRoot!.activeElement).toBe(controls()[1]);
  button.actions=true;const pressed=vi.fn();button.addEventListener('press',pressed);await button.updateComplete;
  controls()[0].click();controls()[0].click();expect(pressed).toHaveBeenCalledTimes(2);
  button.formDisabledCallback(true);await button.updateComplete;expect(controls().every(control=>control.disabled)).toBe(true);
  button.formDisabledCallback(false);button.split=false;await button.updateComplete;
  expect(controls()).toHaveLength(1);expect(button.hasAttribute('role')).toBe(false);expect(controls()[0].getAttribute('part')).toBe('control');
});

test('a split is a group as soon as it is connected, before its first render', () => {
  const split = document.createElement('ds-split');
  document.body.append(split);
  expect(split.getAttribute('role')).toBe('group');
  const button = new Button(); button.split = true;
  document.body.append(button);
  expect(button.getAttribute('role')).toBe('group');
});
