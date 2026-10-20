// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { Button } from '../DS1/2-core/ds-button';
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
  const button = new Button(); button.split = true;
  document.body.append(button);
  expect(button.getAttribute('role')).toBe('group');
});

test('a labelled split writes each segment\'s words after its icon, and an unlabelled one names it by them', async () => {
  const button = new Button(); button.split = true; button.literal = true;
  button.options = 'private:@eye-off:Private,public:@globe:Public'; button.value = 'private';
  document.body.append(button); await button.updateComplete;
  const first = () => button.shadowRoot!.querySelector('button')!;
  expect(first().getAttribute('aria-label')).toBe('Private');
  expect(first().querySelector('ds-text')).toBeNull();
  button.labelled = true; await button.updateComplete;
  expect(first().hasAttribute('aria-label')).toBe(false);
  expect(first().hasAttribute('data-icon-words')).toBe(true);
  expect(first().querySelector('ds-icon')!.getAttribute('type')).toBe('eye-off');
  expect((first().querySelector('ds-text') as HTMLElement & { text: string }).text).toBe('Private');
});
