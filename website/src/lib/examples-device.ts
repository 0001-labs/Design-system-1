/** One device choice controls every embedded page in the Examples gallery. */
export function setExamplesDevice(root: HTMLElement, device: string): void {
  if (!['computer', 'mobile', 'tablet'].includes(device)) return;
  root.dataset.globalExampleDevice = device;
  root.querySelectorAll<HTMLElement>('.example-device').forEach(preview => {
    const container = preview.closest<HTMLElement>('[data-layout-example]') ?? preview.parentElement!;
    container.toggleAttribute('data-phone', device === 'mobile');
    container.toggleAttribute('data-tablet', device === 'tablet');
    container.dispatchEvent(new CustomEvent('example-device-change'));
  });
}
