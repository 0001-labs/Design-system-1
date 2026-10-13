/**
 * One tooltip for a whole page: any element with `data-tooltip="…"` shows its text in Design system 1's tooltip,
 * a black bubble with white text (white on black in dark mode), 4px corners as Ezo's rounded style, 14px regular, above the element, fading in
 * over 120ms. The same look as `<ds-tooltip>`, without wrapping each element in a component, so a table of
 * hundreds of cells can carry one each. Long text wraps at 320px on 20px lines.
 */
export function initTooltips(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (root.hasAttribute("data-ds-tooltips-ready")) return;
  root.setAttribute("data-ds-tooltips-ready", "");

  const bubble = document.createElement("div");
  bubble.setAttribute("data-ds-tooltip", "");
  bubble.setAttribute("role", "tooltip");
  bubble.id = "ds-tooltip";
  const style = document.createElement("style");
  style.textContent = `
    [data-ds-tooltip] {
      position: fixed; z-index: 2147483646; top: 0; left: 0; pointer-events: none;
      max-width: 320px; min-height: 20px; box-sizing: border-box; padding: 0 4px; border-radius: 4px;
      background: light-dark(var(--black, #2a2a2a), var(--white, #ffffff));
      color: light-dark(var(--white, #ffffff), var(--black, #2a2a2a));
      font-family: var(--typeface-regular, var(--font-regular, -apple-system, BlinkMacSystemFont, sans-serif)), sans-serif;
      font-size: 14px; font-weight: 400; line-height: 20px; letter-spacing: 0;
      opacity: 0; transition: opacity 120ms ease;
    }
    [data-ds-tooltip].is-visible { opacity: 1; }
    @media (prefers-reduced-motion: reduce) { [data-ds-tooltip] { transition: none; } }
    @media print { [data-ds-tooltip] { display: none; } }
  `;
  document.head.append(style);
  document.body.append(bubble);

  let current: HTMLElement | null = null;
  const place = (target: HTMLElement) => {
    const box = target.getBoundingClientRect();
    const width = bubble.offsetWidth;
    const height = bubble.offsetHeight;
    const left = Math.min(Math.max(4, box.left + box.width / 2 - width / 2), window.innerWidth - width - 4);
    // Above the element, two pixels clear; below it when there is no room above.
    const top = box.top - height - 2 >= 4 ? box.top - height - 2 : box.bottom + 2;
    bubble.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  };
  const show = (target: HTMLElement) => {
    const text = target.dataset.tooltip;
    if (!text) return;
    current = target;
    bubble.textContent = text;
    target.setAttribute("aria-describedby", bubble.id);
    place(target);
    bubble.classList.add("is-visible");
  };
  const hide = () => {
    current?.removeAttribute("aria-describedby");
    current = null;
    bubble.classList.remove("is-visible");
  };
  const find = (event: Event) => (event.target as Element | null)?.closest?.<HTMLElement>("[data-tooltip]") ?? null;

  document.addEventListener("pointerover", (event) => {
    const target = find(event);
    if (target !== current) target ? show(target) : hide();
  }, { passive: true });
  document.addEventListener("pointerleave", hide, { passive: true });
  document.addEventListener("focusin", (event) => { const target = find(event); if (target) show(target); });
  document.addEventListener("focusout", hide);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") hide(); });
  window.addEventListener("scroll", hide, { passive: true, capture: true });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initTooltips, { once: true });
  else initTooltips();
}
