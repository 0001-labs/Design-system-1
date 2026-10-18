import type { ReleaseRule } from './index';
export type ManagedFlag = ReleaseRule & { key: string; label: string; description?: string; inherited?: boolean };
export type FlagsAdapter = { manage(): Promise<ManagedFlag[]>; set(value: ReleaseRule & { key: string }): Promise<unknown> };
/** Shared management content. The host supplies its authenticated transport and DS1 styles. */
export async function mountFlags(host: HTMLElement, adapter: FlagsAdapter): Promise<() => void> {
  let disposed = false;
  const title = document.createElement('h1'); title.textContent = 'Feature flags';
  const status = document.createElement('p'); status.setAttribute('role', 'status'); status.textContent = 'Loading…';
  const list = document.createElement('div');
  host.replaceChildren(title, status, list);
  try {
    const flags = await adapter.manage();
    if (disposed) return () => {};
    status.textContent = flags.length ? '' : 'No features are waiting for release.';
    for (const flag of flags) {
      const form = document.createElement('form');
      const heading = document.createElement('h2'); heading.textContent = flag.label;
      const description = document.createElement('p'); description.textContent = flag.description ?? flag.key;
      const scopeLabel = document.createElement('label'); scopeLabel.textContent = 'Release to ';
      const scope = document.createElement('select'); scope.className = 'ds-select'; scope.setAttribute('aria-label', `${flag.label}: release to`);
      for (const [value, label] of [['off', 'Off'], ['owner', 'Owner'], ['accounts', 'Selected accounts'], ['everyone', 'Everyone']]) {
        const option = document.createElement('option'); option.value = value; option.textContent = label; scope.appendChild(option);
      }
      scope.value = flag.enabled ? flag.audience : 'off'; scopeLabel.appendChild(scope);
      const accountsLabel = document.createElement('label'); accountsLabel.textContent = ' Account identities ';
      const accounts = document.createElement('textarea'); accounts.className = 'ds-input'; accounts.setAttribute('aria-label', `${flag.label}: account identities`); accounts.value = flag.accountIds?.join('\n') ?? ''; accountsLabel.appendChild(accounts);
      accountsLabel.hidden = scope.value !== 'accounts';
      scope.addEventListener('change', () => { accountsLabel.hidden = scope.value !== 'accounts'; });
      const save = document.createElement('button'); save.type = 'submit'; save.className = 'ds-button'; save.textContent = 'Save';
      const result = document.createElement('span'); result.setAttribute('role', 'status');
      for (const child of [heading, description, scopeLabel, accountsLabel, save, result]) form.appendChild(child);
      form.addEventListener('submit', async event => {
        event.preventDefault(); save.disabled = true; result.textContent = 'Saving…';
        try {
          await adapter.set({ key: flag.key, enabled: scope.value !== 'off', audience: scope.value === 'off' ? 'owner' : scope.value as ReleaseRule['audience'], accountIds: accounts.value.split(/[\n,]/).map(value => value.trim()).filter(Boolean) });
          result.textContent = 'Saved';
        } catch { result.textContent = 'Could not save. Your access or connection may have changed.'; }
        finally { save.disabled = false; }
      });
      list.appendChild(form);
    }
  } catch { if (!disposed) status.textContent = 'Feature flags are available to the product owner. Sign in with the owner account and try again.'; }
  return () => { disposed = true; host.replaceChildren(); };
}
