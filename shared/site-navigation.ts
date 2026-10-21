/** Destinations shared by the public site and the libraries app. */
export const siteNavigation: readonly { label: string; href: string }[] = [];

export function isNavigationCurrent(href: string, pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if (href === "/app/libraries") {
    return path === "/app/libraries" || path === "/libraries/workspace" || path === "/app" || path === "/app/playground" || path.startsWith("/app/l/") || path === "/libraries/playground";
  }
  if (["/components/", "/icons/", "/colours/", "/start-here/examples/"].includes(href)) return path === href.replace(/\/$/, "");
  if (href === "/") {
    return !path.startsWith("/app") && !path.startsWith("/libraries/playground") && !path.startsWith("/libraries/workspace");
  }
  return path === href;
}
