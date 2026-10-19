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

/** Embedded examples follow the document appearance, including changes after loading. */
export function followPageTheme(frame: HTMLIFrameElement): void {
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  const send = () => {
    const selected = root.getAttribute('data-theme');
    const dark = selected === 'dark' || (selected !== 'light' && (root.classList.contains('dark-theme') || (!root.classList.contains('light-theme') && system.matches)));
    frame.contentWindow?.postMessage({ type: 'ds1-example-theme', theme: dark ? 'dark' : 'light', scale: parseFloat(getComputedStyle(root).getPropertyValue('--sf')) || 1 }, location.origin);
  };
  frame.addEventListener('load', send);
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === frame.contentWindow && event.data?.type === 'ds1-example-ready') send();
  });
  new MutationObserver(send).observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  system.addEventListener('change', send);
  window.addEventListener('scaling-changed', send);
  window.addEventListener('resize', send);
  send();
}

/**
 * Nothing in the docs scrolls inside itself (Joachim, 19 October 2026): a preview frame is as tall
 * as what it shows, rounded up to whole squares, and follows it as it changes.
 */
export function fitFrame(frame: HTMLIFrameElement): void {
  frame.setAttribute("scrolling", "no");
  const fit = () => {
    const doc = frame.contentDocument;
    if (!doc?.documentElement) return;
    const unit = 20 * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sf")) || 1);
    // A frame fitting its content measures the body alone: the document is never shorter than the frame, so it could only grow.
    const height = frame.dataset.fit === "content" ? (doc.body?.scrollHeight ?? 0) : Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0);
    if (height) frame.style.height = `${Math.ceil(height / unit) * unit}px`;
  };
  const watch = () => {
    fit();
    if (frame.contentDocument?.body) new ResizeObserver(fit).observe(frame.contentDocument.body);
  };
  frame.addEventListener("load", watch);
  if (frame.contentDocument?.readyState === "complete" && frame.contentDocument.URL !== "about:blank") watch();
}
