/** Destinations shared by the public site and the libraries app. */
export const siteNavigation: readonly { label: string; href: string }[] = [
  { label: "Docs", href: "/start-here/overview/" },
];

export function isNavigationCurrent(href: string, pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if (href === "/app/libraries") {
    return path === "/app/libraries" || path === "/classless/libraries" || path === "/app" || path === "/app/playground" || path.startsWith("/app/l/") || path === "/classless/editor";
  }
  if (["/components/", "/icons/", "/colours/", "/start-here/examples/"].includes(href)) return path === href.replace(/\/$/, "");
  if (href === "/start-here/overview/") {
    return path !== "/" && !path.startsWith("/app") && !path.startsWith("/classless/editor") && !path.startsWith("/classless/libraries");
  }
  return path === href;
}
