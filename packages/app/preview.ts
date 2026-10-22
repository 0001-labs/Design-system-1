import '../../website/src/styles/custom.css';
import '../../website/src/styles/component-example.css';
import '../../website/src/styles/example-code.css';
import '../../DS1/2-core/ds-button';
import { wireExampleView } from '../../website/src/lib/example-view';
import { mountCodeEditors } from '../../website/src/lib/example-code-editor';
import { wireCodeCopy } from '../../website/src/lib/example-controls';
import './src/index';
import '../../DS1/1-root/prose.css';

// The private guide's controlled example; applications supply their own state.
export function mountPrivateExamples(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.preview').forEach((preview, index) => {
    const section = document.createElement('section');
    section.className = 'component-example';
    section.setAttribute('data-ds-not-prose', '');
    section.setAttribute('data-example-view', '');
    const sample = [...preview.children].map(child => child.outerHTML).join('\n');
    section.innerHTML = `<div class="example-toolbar"><span>Example</span><div class="example-view-toggle" role="group" aria-label="Example view"><ds-button control="slotted" choice active><button type="button" data-example-view-choice="example" aria-pressed="true">Example</button></ds-button><ds-button control="slotted" choice><button type="button" data-example-view-choice="code" aria-pressed="false">Code</button></ds-button></div></div><div data-example-preview></div><div data-example-source hidden><div class="example-code-source" data-example-code><div class="example-code-block"><ds-button control="slotted"><button type="button" data-copy="html">Copy HTML</button></ds-button><div class="example-code-editor" data-code-editor aria-label="HTML source"></div><pre><code data-source="html"></code></pre></div></div></div>`;
    section.querySelector('code')!.textContent = sample;
    preview.replaceWith(section);
    section.querySelector('[data-example-preview]')!.append(preview);
    wireExampleView(section, mountCodeEditors);
    wireCodeCopy(section.querySelector('[data-example-code]')!);
  });
  const handle = root.querySelector<import('./src/2-core/ds-spacing-handle').SpacingHandle>('ds-spacing-handle');
  if (handle) {
    const update = (value: number) => { handle.options = { ...handle.options, value }; };
    handle.options = { value: 20, min: 0, max: 100, step: 10, onPreview: update, onCommit: update };
  }
}

if (typeof document !== 'undefined' && location.pathname.startsWith('/private-app/')) {
  mountPrivateExamples();
  const component = document.documentElement.dataset.component ?? 'keyboard-shortcut';
  if (window.parent === window) location.replace(`https://designsystem1.com/libraries/workspace/?internal=${encodeURIComponent(component)}`);
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== 'ds1:docs-theme') return;
    const scale = Number(event.data.scale);
    if (Number.isFinite(scale) && scale > 0 && scale <= 4) {
      document.documentElement.style.setProperty('--sf', String(scale));
      document.documentElement.style.setProperty('--ds-sf', String(scale));
    }
    const dark = event.data.theme === 'dark';
    document.documentElement.classList.toggle('dark-theme', dark);
    document.documentElement.classList.toggle('light-theme', !dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.documentElement.style.setProperty('--lightningcss-light', dark ? ' ' : 'initial');
    document.documentElement.style.setProperty('--lightningcss-dark', dark ? 'initial' : ' ');
  });
}
