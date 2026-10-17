/** Wiring shared by the documentation's live examples: preview choices and code copying. */
import { copyText } from '../../../DS1/0-face/feedback';

/** Calls back with the chosen value when a `ds-button split` choice changes. */
export function onChoice(host: Element | null, choose: (value: string) => void): void {
  host?.addEventListener('change', event => {
    if (event.target === host) choose((event as CustomEvent<{ value: string }>).detail.value);
  });
}

/** Copies each code block from its own text, and says so in the shared toast. */
export function wireCodeCopy(source: HTMLElement): void {
  source.querySelectorAll<HTMLButtonElement>('button[data-copy]').forEach(button => button.addEventListener('click', () => {
    const code = source.querySelector<HTMLElement>(`code[data-source="${button.dataset.copy}"]`)!;
    void copyText(code.textContent ?? '');
  }));
}
