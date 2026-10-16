/** Destinations shared by the public site and the libraries app. */
export const siteNavigation = [
  { label: "Docs", href: "/start-here/overview/" },
  { label: "Examples", href: "/start-here/examples/" },
  { label: "Components", href: "/components/" },
  { label: "Icons", href: "/icons/" },
  { label: "Colours", href: "/colours/" },
  { label: "My libraries", href: "/app/libraries" },
  { label: "Reports", href: "/app/reports/components" },
] as const;

export function isNavigationCurrent(href: string, pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if (href === "/app/libraries") {
    return path === "/app/libraries" || path === "/classless/libraries" || path === "/app" || path === "/app/playground" || path.startsWith("/app/l/") || path === "/classless/editor";
  }
  if (["/components/", "/icons/", "/colours/", "/start-here/examples/"].includes(href)) return path === href.replace(/\/$/, "");
  if (href === "/start-here/overview/") {
    return path !== "/" && !path.startsWith("/app") && !["/components", "/icons", "/colours", "/start-here/examples"].includes(path) && !path.startsWith("/classless/editor") && !path.startsWith("/classless/libraries");
  }
  return path === href;
}
