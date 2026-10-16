/** Visibility is independent of architecture. Internal means built into an app,
 * not secret: source and API comments remain available to implementers. */
export type ComponentVisibility = "public" | "internal";
export const COMPONENT_VISIBILITY: Readonly<Record<string, ComponentVisibility>> = {
  "spacing-handle": "internal",
  "loading": "internal",
};
export function componentVisibility(name: string): ComponentVisibility {
  return COMPONENT_VISIBILITY[name.replace(/^ds-/, "")] ?? "public";
}
export function isPublicComponent(name: string): boolean {
  return componentVisibility(name) === "public";
}
