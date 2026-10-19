import { copyText } from '../../../DS1/0-face/copy-text';

/** Keep the code renderer's exact source, but use DS1's success/error message. */
export function connectCodeCopy(root: Document = document): () => void {
  const copy = (event: MouseEvent) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('.expressive-code .copy button[data-code]') : null;
    if (!button) return;
    // The renderer attaches its own bubbling handler and green feedback popup.
    // Handle this gesture once through DS1, including clipboard fallback/errors.
    event.preventDefault();
    event.stopImmediatePropagation();
    void copyText((button.dataset.code ?? '').replace(/\u007f/g, '\n'));
  };
  root.addEventListener('click', copy, true);
  return () => root.removeEventListener('click', copy, true);
}
