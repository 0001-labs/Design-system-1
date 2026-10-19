// @vitest-environment happy-dom
import { expect, test } from 'vite-plus/test';
import { connectAppNavigation } from '../website/src/lib/app-navigation';
test('owner navigation expands whole-row links with leading App tags and clears at sign-out', () => {
  const root = document.createElement('section'); root.hidden = true;
  root.innerHTML = '<button id="private-app-toggle" aria-expanded="false"><ds-icon></ds-icon>App</button><div id="private-app-links" hidden></div>';
  const stop = connectAppNavigation(root);
  const report = (authenticated: boolean, appComponents: unknown[] = []) => window.dispatchEvent(new CustomEvent('ds1-navigation-auth', { detail: {authenticated,appComponents} }));
  try {
    report(true); expect(root.hidden).toBe(true);
    report(true, [{ name: 'Keyboard shortcut', href: 'https://dash.designsystem1.com/private-app/#keyboard-shortcut' }]);
    expect(root.hidden).toBe(false);
    const toggle = root.querySelector('button')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect((root.querySelector('#private-app-links') as HTMLElement).hidden).toBe(false);
    const link = root.querySelector('a')!;
    expect(link.firstElementChild?.textContent).toBe('App');
    expect(link.textContent).toBe('AppKeyboard shortcut');
    report(false);
    expect(root.hidden).toBe(true); expect(root.querySelectorAll('a')).toHaveLength(0);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  } finally { stop(); }
});
