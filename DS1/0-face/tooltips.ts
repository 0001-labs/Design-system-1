/**
 * One tooltip for a whole page: any element with `data-tooltip="…"` shows its text in Design system 1's tooltip,
 * Ezo's label: 16px high, black with white text (white on black in dark mode), 4px corners, 14px regular, 2.5px at
 * the sides, two pixels above the element, shown at once. `data-tooltip-colour` gives it a colour of its own. The same look as `<ds-tooltip>`, without wrapping each element in a component, so a table of
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
      position: fixed; z-index: 2147483646; top: 0; left: 0; pointer-events: none; visibility: hidden;
      max-width: 320px; min-height: 16px; box-sizing: border-box; padding: 0 2.5px; border-radius: 4px;
      background: var(--ds-tooltip-background, light-dark(#000, #fff));
      color: var(--ds-tooltip-color, light-dark(#fff, #000));
      font-family: var(--typeface-regular, var(--font-regular, system-ui)), sans-serif;
      font-size: 14px; font-weight: 400; line-height: 16px; letter-spacing: 0; white-space: nowrap;
    }
    [data-ds-tooltip].is-wide { white-space: normal; }
    [data-ds-tooltip].is-visible { visibility: visible; }
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
    // A colour of its own, as Ezo's labels take the accent: data-tooltip-colour="#f5aad1", lettered in the ink.
    const colour = target.dataset.tooltipColour;
    bubble.style.setProperty("--ds-tooltip-background", colour || "");
    bubble.style.setProperty("--ds-tooltip-color", colour ? "#1e1e1e" : "");
    if (!colour) { bubble.style.removeProperty("--ds-tooltip-background"); bubble.style.removeProperty("--ds-tooltip-color"); }
    // One line, as Ezo's; a long text wraps at 320px instead of running off the page.
    bubble.classList.remove("is-wide");
    if (bubble.scrollWidth > 320) bubble.classList.add("is-wide");
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
