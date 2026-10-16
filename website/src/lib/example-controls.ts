/** Wiring shared by the documentation's live examples: preview choices and code copying. */

/** Calls back with the chosen value when a `ds-button split` choice changes. */
export function onChoice(host: Element | null, choose: (value: string) => void): void {
  host?.addEventListener('change', event => {
    if (event.target === host) choose((event as CustomEvent<{ value: string }>).detail.value);
  });
}

/** Copies each code block from its own text, and says so in the block's status. */
export function wireCodeCopy(source: HTMLElement): void {
  const status = source.querySelector<HTMLElement>('[data-copy-status]')!;
  source.querySelectorAll<HTMLButtonElement>('button[data-copy]').forEach(button => button.addEventListener('click', async () => {
    const code = source.querySelector<HTMLElement>(`code[data-source="${button.dataset.copy}"]`)!;
    try {
      await navigator.clipboard.writeText(code.textContent ?? '');
      status.textContent = 'Copied';
    } catch { status.textContent = 'Select the code to copy it.'; }
  }));
}
