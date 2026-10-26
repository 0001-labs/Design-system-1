import { bindSpacingHandle } from '../../app/src/2-core/spacing-handle';
import './sidebar-edge.css';

/**
 * The edge of Consistency's sidebar (Joachim, 26 October 2026): the boundary between the sidebar and the work is the
 * handle. Dragged towards the left it folds the sidebar away and the work takes the whole window inside a one-square
 * margin, as 0001.dev's page stands; dragged back it opens again. Folded, the window's left square shows the sidebar
 * over the work while the pointer (or focus) is on it, without a backdrop, so the next place can be chosen; it goes
 * away when the pointer leaves or a place is chosen. A finger's press on that square shows it too.
 *
 * During a drag nothing is laid out again: the page and the sidebar move by transform alone, the edge under the hand.
 * On release the layout is committed once, open or folded by where the edge is and how fast it was going, and the
 * transforms settle from where they stood to nothing (short and interruptible: a new press takes it from there). The
 * keyboard is immediate. The choice is the viewer's, kept in `localStorage` and drawn on first paint.
 *
 * The pointer, Escape and keyboard lifecycle is the editor's own edge handle's (`bindSpacingHandle`), so this edge
 * behaves as the canvas's spacing and size edges do. Phones keep the page's own drawer; the edge is for wider windows.
 */
export type SidebarState = 'open' | 'collapsed';
export const SIDEBAR_KEY = 'consistency-sidebar';
/** A release faster than this (px per ms) goes the way the hand was going, wherever the edge is. */
export const FLICK = 0.4;
/** The settle after a release or a press, in ms; nothing with reduced motion. */
export const SETTLE_MS = 240;
/** DS1's drawer curve: quick to leave, long to rest. */
const CURVE: [number, number, number, number] = [0.32, 0.72, 0, 1];
/** How long the shown sidebar waits after the pointer leaves before it goes, in ms. */
const LEAVE_MS = 200;

export function storedSidebar(): SidebarState {
  try { return localStorage.getItem(SIDEBAR_KEY) === 'collapsed' ? 'collapsed' : 'open'; } catch { return 'open'; }
}
function storeSidebar(state: SidebarState) {
  try { localStorage.setItem(SIDEBAR_KEY, state); } catch { /* the choice lasts this visit */ }
}

/** Where a release settles: a flick goes its way; otherwise the nearer side, `x` being how far open the edge stands of `travel`. */
export function settleTarget(x: number, travel: number, velocity: number): SidebarState {
  if (Math.abs(velocity) >= FLICK) return velocity > 0 ? 'open' : 'collapsed';
  return x >= travel / 2 ? 'open' : 'collapsed';
}

/** A CSS cubic-bezier as a function of progress, solved for x by Newton's method with bisection behind it. */
export function bezier([x1, y1, x2, y2]: [number, number, number, number]): (t: number) => number {
  const at = (a: number, b: number, t: number) => 3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3;
  const slope = (a: number, b: number, t: number) => 3 * a * (1 - t) ** 2 + 6 * (b - a) * (1 - t) * t + 3 * (1 - b) * t ** 2;
  return progress => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    let t = progress;
    for (let i = 0; i < 6; i++) { const d = slope(x1, x2, t); if (Math.abs(d) < 1e-6) break; t -= (at(x1, x2, t) - progress) / d; }
    if (t < 0 || t > 1 || Math.abs(at(x1, x2, t) - progress) > 1e-4) {
      let low = 0, high = 1; t = progress;
      for (let i = 0; i < 30; i++) { const value = at(x1, x2, t); if (Math.abs(value - progress) < 1e-5) break; if (value < progress) low = t; else high = t; t = (low + high) / 2; }
    }
    return at(y1, y2, t);
  };
}
const ease = bezier(CURVE);

/** What stands where: how far open the work is (`x`, 0 to the travel) and the sidebar's offset from its open place (`nav`). */
type Pose = { x: number; nav: number };

export class SidebarEdge {
  /** The separator on the sidebar's edge, rendered by the home before its page. */
  readonly handle: HTMLDivElement;
  private state: SidebarState;
  private pose: Pose = { x: 0, nav: 0 };
  /** The layout and pose a pointer gesture started from, and whether the shown sidebar stays while the work follows the hand. */
  private gesture: { from: SidebarState; held: boolean; samples: { t: number; x: number }[] } | null = null;
  private frame = 0;
  private leaving = 0;
  /** After a fold by the pointer, the edge shows nothing until the pointer has left it once. */
  private quiet = false;
  private keyboard = false;
  private unbind: (() => void) | null = null;

  constructor(private readonly host: HTMLElement) {
    this.state = storedSidebar();
    const handle = document.createElement('div');
    handle.className = 'home-edge';
    handle.tabIndex = 0;
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', 'vertical');
    handle.setAttribute('aria-label', 'Sidebar');
    handle.setAttribute('aria-controls', 'home-nav');
    handle.setAttribute('aria-valuemin', '0');
    handle.setAttribute('aria-valuemax', '100');
    this.handle = handle;
  }

  /** Open or folded, as the viewer left it. */
  get value(): SidebarState { return this.state; }
  /** Whether the folded sidebar is being shown over the work. */
  get shown(): boolean { return this.host.hasAttribute('data-sidebar-peek'); }

  /** Draws the kept state before the home's first render, and listens. */
  connect() {
    this.draw();
    this.unbind = bindSpacingHandle(this.handle, () => ({
      value: this.pose.x, min: 0, max: this.travel(), step: this.travel(), immediateKeyboard: true, threshold: 3,
      onPointerStart: () => { this.stop(); this.keyboard = false; },
      onStart: kind => { if (kind === 'pointer') this.begin(); },
      onPreview: x => { if (this.gesture) this.follow(x); },
      // The keyboard's arrows, Home and End: at once.
      onCommit: x => { if (!this.gesture) this.set(x > 0 ? 'open' : 'collapsed'); },
      onEnd: cancelled => { if (this.gesture) this.release(cancelled); },
      onTap: event => this.tap(event),
    }));
    this.handle.addEventListener('keydown', this.onKey);
    this.handle.addEventListener('pointerenter', this.onEnter);
    this.handle.addEventListener('pointerleave', this.onHandleLeave);
    this.handle.addEventListener('focus', this.onFocus);
    this.host.addEventListener('pointerover', this.onOver);
    this.host.addEventListener('pointerout', this.onOut);
    this.host.addEventListener('focusout', this.onFocusOut);
    addEventListener('pointerdown', this.onDown, true);
    addEventListener('keydown', this.onAnyKey, true);
  }

  disconnect() {
    this.stop(); clearTimeout(this.leaving);
    this.unbind?.(); this.unbind = null;
    this.handle.removeEventListener('keydown', this.onKey);
    this.handle.removeEventListener('pointerenter', this.onEnter);
    this.handle.removeEventListener('pointerleave', this.onHandleLeave);
    this.handle.removeEventListener('focus', this.onFocus);
    this.host.removeEventListener('pointerover', this.onOver);
    this.host.removeEventListener('pointerout', this.onOut);
    this.host.removeEventListener('focusout', this.onFocusOut);
    removeEventListener('pointerdown', this.onDown, true);
    removeEventListener('keydown', this.onAnyKey, true);
  }

  /** Opens or folds the sidebar at once (the keyboard, or a caller). */
  set(state: SidebarState) {
    this.stop();
    this.state = state;
    if (state === 'open') this.show(false);
    storeSidebar(state);
    this.draw();
  }

  /** A place was chosen: a sidebar shown over the work goes. */
  chosen() { if (this.shown) this.show(false); }

  // The geometry, in px: a square, the sidebar's width (twelve squares) and the gap after it (two), which is how far the work moves.
  // The edge is one square wide when open and a square and a half folded (it covers the window's left square too).
  private unit() { return (this.handle.offsetWidth / (this.host.getAttribute('data-sidebar') === 'collapsed' ? 1.5 : 1)) || 20; }
  private travel() { return 14 * this.unit(); }
  private page() { return this.host.querySelector<HTMLElement>(':scope > ds-page'); }
  private nav() { return this.host.querySelector<HTMLElement>(':scope > ds-page > nav.home-nav'); }
  private rest(state: SidebarState, shown = this.shown): Pose { return state === 'open' ? { x: this.travel(), nav: 0 } : { x: 0, nav: shown ? 0 : -this.travel() }; }

  /** The state as attributes, and every transform taken off: the layout alone says where things stand. */
  private draw() {
    this.host.setAttribute('data-sidebar', this.state);
    this.host.removeAttribute('data-sidebar-moving');
    this.handle.setAttribute('aria-valuenow', this.state === 'open' ? '100' : '0');
    this.handle.setAttribute('aria-valuetext', this.state === 'open' ? 'Sidebar open' : 'Sidebar folded');
    for (const element of [this.page(), this.nav(), this.handle]) element?.style.removeProperty('transform');
    this.pose = this.rest(this.state);
  }

  /**
   * Places everything for a pose against the layout committed now: the page moves by how far the work stands from
   * the layout's own place, the sidebar by the rest of its offset, and the edge stays where the work begins.
   */
  private place(pose: Pose) {
    this.pose = pose;
    const base = this.state === 'open' ? this.travel() : 0;
    const shift = pose.x - base;
    const page = this.page(), nav = this.nav();
    if (page) page.style.transform = `translateX(${shift}px)`;
    if (nav) nav.style.transform = `translateX(${pose.nav - shift}px)`;
    // The edge's line is the frame's own edge, so it moves exactly as the work does.
    this.handle.style.transform = `translateX(${shift}px)`;
  }

  private begin() {
    clearTimeout(this.leaving);
    const from = this.state;
    // Folded with the sidebar shown, the sidebar stays and the work follows the hand; otherwise the sidebar comes with it.
    this.gesture = { from, held: from === 'collapsed' && this.shown, samples: [] };
    this.host.setAttribute('data-sidebar-moving', '');
  }

  private follow(x: number) {
    const gesture = this.gesture!;
    const now = performance.now();
    gesture.samples.push({ t: now, x });
    while (gesture.samples.length > 2 && now - gesture.samples[0].t > 80) gesture.samples.shift();
    this.place({ x, nav: gesture.held ? 0 : x - this.travel() });
  }

  private release(cancelled: boolean) {
    const gesture = this.gesture!;
    this.gesture = null;
    const first = gesture.samples[0], last = gesture.samples.at(-1);
    const velocity = first && last && last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0;
    const target = cancelled ? gesture.from : settleTarget(this.pose.x, this.travel(), velocity);
    // A fold by the hand leaves the pointer on the edge: it shows nothing until the pointer has left.
    if (target === 'collapsed' && gesture.from === 'open') this.quiet = true;
    this.settle(target, target === 'collapsed' && gesture.held);
  }

  /** Commits the layout once, then moves what stood where it was to its place in it. */
  private settle(target: SidebarState, shown: boolean) {
    this.stop();
    const from = { ...this.pose };
    this.state = target;
    storeSidebar(target);
    this.host.setAttribute('data-sidebar', target);
    this.host.toggleAttribute('data-sidebar-peek', target === 'collapsed' && shown);
    this.handle.setAttribute('aria-valuenow', target === 'open' ? '100' : '0');
    this.handle.setAttribute('aria-valuetext', target === 'open' ? 'Sidebar open' : 'Sidebar folded');
    const to = this.rest(target, shown);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || (from.x === to.x && from.nav === to.nav)) { this.draw(); return; }
    this.host.setAttribute('data-sidebar-moving', '');
    this.place(from);
    const start = performance.now();
    const step = (now: number) => {
      const progress = ease(Math.min(1, (now - start) / SETTLE_MS));
      this.place({ x: from.x + (to.x - from.x) * progress, nav: from.nav + (to.nav - from.nav) * progress });
      if (progress < 1) this.frame = requestAnimationFrame(step);
      else { this.frame = 0; this.draw(); }
    };
    this.frame = requestAnimationFrame(step);
  }

  /** Stops a settle where it stands, so a new press takes it from there. */
  private stop() { if (this.frame) { cancelAnimationFrame(this.frame); this.frame = 0; } }

  /** A press without a drag: a finger shows the folded sidebar; a mouse or pen opens or folds it. */
  private tap(event: PointerEvent) {
    if (event.pointerType === 'touch' && this.state === 'collapsed') { this.settle('collapsed', true); return; }
    const target = this.state === 'open' ? 'collapsed' : 'open';
    if (target === 'collapsed') this.quiet = true;
    this.settle(target, false);
  }

  /** Shows or hides the folded sidebar over the work, by its own transition. */
  private show(on: boolean) {
    clearTimeout(this.leaving);
    if (on && (this.state !== 'collapsed' || this.gesture || this.frame)) return;
    this.host.toggleAttribute('data-sidebar-peek', on);
    if (this.state === 'collapsed') this.pose = this.rest('collapsed', on);
  }

  /** The shown sidebar goes a moment after the pointer leaves, unless the pointer, a menu of its or the keyboard is still in it. */
  private leaveSoon() {
    clearTimeout(this.leaving);
    if (!this.shown) return;
    this.leaving = window.setTimeout(() => {
      const nav = this.nav();
      if (this.gesture || this.handle.matches(':hover') || nav?.matches(':hover') || nav?.querySelector('[aria-expanded="true"]')) return;
      if (this.keyboard && (nav?.contains(document.activeElement) || document.activeElement === this.handle)) return;
      this.show(false);
    }, LEAVE_MS);
  }

  private inside(node: EventTarget | null) { return node instanceof Node && (this.handle.contains(node) || Boolean(this.nav()?.contains(node))); }

  private readonly onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.set(this.state === 'open' ? 'collapsed' : 'open');
  };
  private readonly onEnter = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || this.quiet || event.buttons) return;
    this.show(true);
  };
  private readonly onHandleLeave = () => { this.quiet = false; this.leaveSoon(); };
  private readonly onFocus = () => { if (this.keyboard) this.show(true); };
  private readonly onOver = (event: PointerEvent) => { if (this.shown && this.inside(event.target)) clearTimeout(this.leaving); };
  private readonly onOut = (event: PointerEvent) => { if (this.shown && this.inside(event.target) && !this.inside(event.relatedTarget)) this.leaveSoon(); };
  private readonly onFocusOut = (event: FocusEvent) => { if (this.shown && this.keyboard && !this.inside(event.relatedTarget)) this.leaveSoon(); };
  /** A press anywhere but the sidebar and its edge puts the shown sidebar away. */
  private readonly onDown = (event: PointerEvent) => {
    this.keyboard = false;
    if (this.shown && !event.composedPath().some(node => node === this.handle || node === this.nav())) this.show(false);
  };
  private readonly onAnyKey = (event: KeyboardEvent) => {
    this.keyboard = true;
    if (event.key === 'Escape' && this.shown && !this.gesture && !this.nav()?.querySelector('[aria-expanded="true"]')) {
      const within = this.nav()?.contains(document.activeElement);
      this.show(false);
      if (within) this.handle.focus();
    }
  };
}
