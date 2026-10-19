/** Switch views without remounting the preview, preserving its interactive state. */
export function wireExampleView(example: HTMLElement, openSource: (source: HTMLElement) => void): void {
  const buttons = example.querySelectorAll<HTMLButtonElement>('[data-example-view-choice]');
  const preview = example.querySelector<HTMLElement>('[data-example-preview]')!;
  const source = example.querySelector<HTMLElement>('[data-example-source]')!;
  buttons.forEach(button => button.addEventListener('click', () => {
    const code = button.dataset.exampleViewChoice === 'code';
    preview.hidden = code;
    source.hidden = !code;
    buttons.forEach(choice => {
      const selected = choice === button;
      choice.setAttribute('aria-pressed', String(selected));
      choice.parentElement!.toggleAttribute('active', selected);
    });
    if (code) openSource(source);
  }));
}
