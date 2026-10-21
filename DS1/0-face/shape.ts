/**
 * Square, rounded or circular: the corners every component draws, chosen once
 * and remembered (Ezo's Shape setting, for every product).
 *
 * The runtime is the second part of `theme-bootstrap.js`, which a page inlines
 * in its <head> so the first paint already has the shape; imported here, it
 * installs itself when the page did not. It marks the root with
 * `data-ds-shape`, which `1-root/component-appearance.css` reads: square
 * corners, rounded ones (squircles where the browser draws them) or pills. A
 * visitor who has chosen nothing sees `shapeDefault` from
 * `window.DS_ONE_PREFERENCES`, or the components' own corners. Offer the
 * choice with `<ds-cycle type="shape">`.
 */
import "./theme-bootstrap.js";

export type Shape = "square" | "rounded" | "circular";
export const SHAPES: readonly Shape[] = ["square", "rounded", "circular"];

/** `window.DS_ONE_SHAPE`, installed by `theme-bootstrap.js`. */
export interface ShapeRuntime {
  /** The shape in effect, or null when none is chosen. */
  shape(): Shape | null;
  /** Choose and remember a shape, and put it on the page. */
  set(shape: Shape): void;
  /** Read the stored choice and the options again, and put them on the page. */
  apply(): Shape | null;
}

declare global {
  interface Window {
    DS_ONE_SHAPE?: ShapeRuntime;
  }
}

/** The shape in effect: the stored choice, else `shapeDefault`, else rounded (the components' own corners). */
export function getShape(): Shape {
  return window.DS_ONE_SHAPE?.shape() ?? "rounded";
}

/** Choose and remember a shape. */
export function setShape(shape: Shape): void {
  window.DS_ONE_SHAPE?.set(shape);
}
