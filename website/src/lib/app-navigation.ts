/** Owner data comes only through the authenticated same-origin bridge. */
export function connectAppNavigation(root: HTMLElement) {
  const toggle = root.querySelector<HTMLButtonElement>('#private-app-toggle')!;
  const links = root.querySelector<HTMLElement>('#private-app-links')!;
  let expanded = false;
  const renderExpanded = () => {
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.querySelector('ds-icon')?.setAttribute('type', expanded ? 'chevron-up' : 'chevron-down');
    links.hidden = !expanded;
  };
  const onToggle = () => { expanded = !expanded; renderExpanded(); };
  const onAuth = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    const components = detail?.authenticated === true && Array.isArray(detail.appComponents) ? detail.appComponents : [];
    links.replaceChildren();
    for (const item of components) {
      if (typeof item.name !== 'string' || typeof item.href !== 'string' || !item.href.startsWith('https://dash.designsystem1.com/private-app/#')) continue;
      const link = document.createElement('a');
      link.className = 'ds-row'; link.href = item.href;
      const badge = document.createElement('ds-badge'); badge.textContent = 'App'; badge.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span'); name.textContent = item.name;
      link.append(badge, name); links.append(link);
    }
    root.hidden = links.childElementCount === 0;
    if (root.hidden) expanded = false;
    renderExpanded();
  };
  toggle.addEventListener('click', onToggle);
  window.addEventListener('ds1-navigation-auth', onAuth);
  return () => { toggle.removeEventListener('click', onToggle); window.removeEventListener('ds1-navigation-auth', onAuth); };
}
