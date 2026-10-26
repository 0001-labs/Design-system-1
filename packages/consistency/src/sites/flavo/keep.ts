/**
 * Keeping a place's data current with no reload button (Design system 1): read on entry, again when the app shows
 * the place after another (it hides a place it leaves, never taking it out of the page), when the window has the
 * focus again and when the tab is visible again. A read asked for while one runs follows it once; a failed read is
 * tried again on its own after a while. Writes are never replayed.
 */
import type { ReactiveController, ReactiveControllerHost } from "lit";

/** How long a failed read waits before it is tried again on its own. */
export const RETRY = 15_000;

export class KeepCurrent implements ReactiveController {
  private running: Promise<void> | null = null;
  private again = false;
  private retry: ReturnType<typeof setTimeout> | undefined;
  private readonly seen = new MutationObserver(() => { if (!this.host.hidden) void this.run(); });
  private readonly onFocus = () => { if (this.host.isConnected && !this.host.hidden && document.visibilityState === "visible") void this.run(); };
  constructor(private readonly host: ReactiveControllerHost & HTMLElement, private readonly read: () => Promise<boolean>) { host.addController(this); }
  hostConnected() {
    this.seen.observe(this.host, { attributes: true, attributeFilter: ["hidden"] });
    addEventListener("focus", this.onFocus);
    document.addEventListener("visibilitychange", this.onFocus);
    void this.run();
  }
  hostDisconnected() {
    this.seen.disconnect();
    removeEventListener("focus", this.onFocus);
    document.removeEventListener("visibilitychange", this.onFocus);
    clearTimeout(this.retry);
  }
  run(): Promise<void> {
    if (this.running) { this.again = true; return this.running; }
    clearTimeout(this.retry);
    this.running = this.read().catch(() => false).then(read => {
      this.running = null;
      if (this.again) { this.again = false; void this.run(); }
      else if (!read && this.host.isConnected) this.retry = setTimeout(this.onFocus, RETRY);
    });
    return this.running;
  }
}
