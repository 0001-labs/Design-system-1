/** Also printed as each showcase's copyable, standalone setup. No live data is used. */
export function mountShowcase(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-showcase-props]').forEach(element => {
    const props = JSON.parse(element.dataset.showcaseProps!);
    Object.assign(element, props);
    if (element.localName === 'ds-sidebar') {
      let items = props.items;
      const render = () => {
        let collapsedDepth: number | undefined;
        const visible = items.filter((item: { depth?: number; expanded?: boolean }) => {
          const depth = item.depth ?? 0;
          if (collapsedDepth !== undefined && depth > collapsedDepth) return false;
          collapsedDepth = item.expanded === false ? depth : undefined;
          return true;
        });
        Object.assign(element, { items: visible });
      };
      element.addEventListener('sidebar-activate', event => {
        const id = (event as CustomEvent).detail.id;
        items = items.map((item: { id: string }) => ({ ...item, current: item.id === id }));
        render();
      });
      element.addEventListener('sidebar-toggle', event => {
        const { id, expanded } = (event as CustomEvent).detail;
        items = items.map((item: { id: string }) => item.id === id ? { ...item, expanded } : item);
        render();
      });
    }
  });
  root.querySelectorAll('ds-token-field').forEach(field => {
    field.addEventListener('ds-token-commit', event => {
      const { text } = (event as CustomEvent<{ text: string }>).detail;
      const input = field.querySelector('input');
      if (!input || !text.trim()) return;
      const token = document.createElement('ds-token');
      token.setAttribute('value', text.trim());
      token.setAttribute('label', text.trim());
      token.setAttribute('remove-label', `Remove ${text.trim()}`);
      field.insertBefore(token, input);
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    field.addEventListener('ds-token-remove' , event => {
      const token = event.target;
      if (token instanceof Element && token.localName === 'ds-token') token.remove();
    });
  });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'ds1-example-theme') return;
    requestAnimationFrame(() => root.querySelectorAll('ds-chart, ds-spark, ds-bars').forEach(chart => {
      (chart as HTMLElement & { refreshTheme?: () => void }).refreshTheme?.();
    }));
  });

}
