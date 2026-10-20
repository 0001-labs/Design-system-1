import './src/index';
import '../../DS1/1-root/prose.css';
import { startScaling } from '../../DS1/0-face/scaling';

// The private guide's controlled example; applications supply their own state.
if (typeof document !== 'undefined') {
  startScaling({ surface: true });
  const component = document.documentElement.dataset.component ?? 'keyboard-shortcut';
  if (window.parent === window) location.replace(`https://designsystem1.com/libraries/workspace/?internal=${encodeURIComponent(component)}`);
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== 'ds1:docs-theme') return;
    const dark = event.data.theme === 'dark';
    document.documentElement.classList.toggle('dark-theme', dark);
    document.documentElement.classList.toggle('light-theme', !dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.documentElement.style.setProperty('--lightningcss-light', dark ? ' ' : 'initial');
    document.documentElement.style.setProperty('--lightningcss-dark', dark ? 'initial' : ' ');
  });
  const handle = document.querySelector<import('./src/2-core/ds-spacing-handle').SpacingHandle>('ds-spacing-handle');
  if (handle) {
    const update = (value: number) => { handle.options = { ...handle.options, value }; };
    handle.options = { value: 20, min: 0, max: 100, step: 10, onPreview: update, onCommit: update };
  }
}
