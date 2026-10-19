import './src/index';

// The private guide's controlled example; applications supply their own state.
if (typeof document !== 'undefined') {
  const handle = document.querySelector<import('./src/2-core/ds-spacing-handle').SpacingHandle>('ds-spacing-handle');
  if (handle) {
    const update = (value: number) => { handle.options = { ...handle.options, value }; };
    handle.options = { value: 20, min: 0, max: 100, step: 10, onPreview: update, onCommit: update };
  }
}
