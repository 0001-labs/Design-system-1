/** Inspect named page areas without changing their size, opacity, or interaction. */
export function createLayoutInspector() {
  const root = document.documentElement;
  const overlay = document.createElement('div');
  overlay.setAttribute('data-ds-layout-overlay', '');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.hidden = true;
  const shadow = overlay.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>
    :host {
      all: initial !important;
      display: block !important;
      position: fixed !important;
      inset: 0 !important;
      z-index: 2147483646 !important;
      pointer-events: none !important;
      color-scheme: inherit !important;
    }
    :host([hidden]) { display: none !important; }
    .veil, .areas { position: absolute; inset: 0; overflow: hidden; }
    .veil { background: color-mix(in srgb, var(--page-background, Canvas) 78%, transparent); }
    .area {
      position: absolute;
      box-sizing: border-box;
      display: grid;
      place-items: center;
      background: color-mix(in srgb, var(--pastel) 40%, transparent);
      border: 1px solid color-mix(in srgb, var(--pastel) 65%, #82718d);
    }
    .name {
      box-sizing: border-box;
      max-width: 100%;
      padding: 3px 8px;
      background: var(--page-background, Canvas);
      color: var(--base-slate, CanvasText);
      font: 400 14px/20px var(--font-regular, var(--typeface-regular, sans-serif));
      text-align: center;
      overflow-wrap: anywhere;
    }
    .area[data-container] {
      background: transparent;
    }
    .area[data-container] > .name {
      position: absolute;
      top: 0;
      left: 0;
    }
    .area[data-compact] .name {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: max-content;
      max-width: none;
      padding: 2px 4px;
      font-size: 12px;
      line-height: 16px;
      white-space: nowrap;
    }
    .dimensions {
      display: block;
      font-size: 12px;
      line-height: 16px;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    @media print { :host { display: none !important; } }
  </style><div class="veil"></div><div class="areas"></div>`;
  document.body.append(overlay);
  const layer = shadow.querySelector<HTMLDivElement>('.areas')!;
  const colors = ['#efc9dc', '#d5c9ef', '#c2d9eb', '#bfe0cd', '#eee3b7', '#efcfb8'];
  let frame = 0;
  let visible = false;
  const observed = new Set<HTMLElement>();
  const observedRoots = new Set<ShadowRoot>();

  const getAreas = () => {
    const named: HTMLElement[] = [];
    const collect = (scope: Document | ShadowRoot | HTMLElement) => {
      named.push(...scope.querySelectorAll<HTMLElement>('[data-ds-area]'));
      scope.querySelectorAll<HTMLElement>('[data-ds-layout-root]').forEach((host) => {
        if (!host.shadowRoot) return;
        if (!observedRoots.has(host.shadowRoot)) {
          mutations.observe(host.shadowRoot, { subtree: true, childList: true, characterData: true });
          observedRoots.add(host.shadowRoot);
        }
        collect(host.shadowRoot);
      });
    };
    collect(document.querySelector<HTMLElement>('[data-ds-inspect-active]') ?? document);
    if (named.length) return named;
    // Semantic fallback for pages that have not supplied their own area names.
    return Array.from(document.querySelectorAll<HTMLElement>('header, main, section, footer, one-footer'))
      .filter((element) => !element.querySelector('section, header, footer, one-footer'));
  };
  const render = () => {
    frame = 0;
    if (!visible) return;
    const areas = getAreas();
    const current = new Set(areas);
    for (const element of observed) {
      if (!current.has(element)) { resize.unobserve(element); observed.delete(element); }
    }
    const fragments = document.createDocumentFragment();
    areas.forEach((element, index) => {
      if (!observed.has(element)) { resize.observe(element); observed.add(element); }
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth) return;
      if (getComputedStyle(element).visibility === 'hidden') return;
      const panel = document.createElement('div');
      panel.className = 'area';
      panel.toggleAttribute('data-container', !!element.shadowRoot?.querySelector('[data-ds-area]'));
      panel.toggleAttribute('data-compact', rect.width < 80 || rect.height < 24);
      panel.style.left = `${rect.left}px`;
      panel.style.top = `${rect.top}px`;
      panel.style.width = `${rect.width}px`;
      panel.style.height = `${rect.height}px`;
      panel.style.setProperty('--pastel', colors[index % colors.length]);
      const label = document.createElement('span');
      label.className = 'name';
      const areaName = element.dataset.dsArea || element.getAttribute('aria-label') ||
        (element.localName === 'one-footer' ? 'footer' : element.localName);
      label.textContent = areaName.replace(/[-_]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
      const dimensions = document.createElement('span');
      dimensions.className = 'dimensions';
      dimensions.textContent = `${Number(rect.width.toFixed(1))} × ${Number(rect.height.toFixed(1))} px`;
      label.append(dimensions);
      const ratio = document.createElement('span');
      ratio.className = 'dimensions';
      // Reduce dimensions measured to a tenth of a CSS pixel; use a decimal
      // for fluid shapes whose exact fraction would be too long to read.
      const width = Math.max(1, Math.round(rect.width * 10));
      const height = Math.max(1, Math.round(rect.height * 10));
      let divisor = width;
      let remainder = height;
      while (remainder) {
        [divisor, remainder] = [remainder, divisor % remainder];
      }
      const horizontal = width / divisor;
      const vertical = height / divisor;
      ratio.textContent = horizontal <= 100 && vertical <= 100
        ? `${horizontal}:${vertical}`
        : `≈ ${Number((rect.width / rect.height).toFixed(2))}:1`;
      label.append(ratio);
      panel.append(label);
      fragments.append(panel);
    });
    layer.replaceChildren(fragments);
  };
  const schedule = () => { if (visible && !frame) frame = requestAnimationFrame(render); };
  const resize = new ResizeObserver(schedule);
  const mutations = new MutationObserver(schedule);
  const setVisible = (next: boolean) => {
    if (next === visible) return;
    visible = next;
    overlay.hidden = !visible;
    root.toggleAttribute('data-ds-layout-visible', visible);
    if (visible) {
      resize.observe(document.body);
      mutations.observe(document.body, { subtree: true, childList: true, characterData: true });
      window.addEventListener('scroll', schedule, { passive: true, capture: true });
      window.addEventListener('resize', schedule);
      window.addEventListener('scaling-changed', schedule);
      window.addEventListener('design-system-layout-sized', schedule);
      window.addEventListener('design-system-layout-ready', schedule);
      schedule();
    } else {
      resize.disconnect();
      observed.clear();
      mutations.disconnect();
      observedRoots.clear();
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scaling-changed', schedule);
      window.removeEventListener('design-system-layout-sized', schedule);
      window.removeEventListener('design-system-layout-ready', schedule);
      cancelAnimationFrame(frame);
      frame = 0;
      layer.replaceChildren();
    }
    window.dispatchEvent(new CustomEvent('design-system-layout-changed', { detail: { visible } }));
  };
  return { toggle: () => setVisible(!visible), hide: () => setVisible(false) };
}
