import type { ManagedFlag } from './manage';

// The flags matrix: flags across, audiences and accounts down, a check where
// the release rule includes the row and a cross where it leaves it out. System
// and every product's /flags page draw the same matrix; matrix.css styles it.
// The rows read as a release: Off, Owner, the named accounts, a growing share
// of the accounts, then Everyone last.

// Nodes are added with appendChild, which every product's DOM types agree on: Cloudflare's Worker types
// redeclare Element.append for HTMLRewriter, so append(node) fails to type-check where both are loaded.

export type AudienceRow = { kind: 'off' | 'owner' | 'everyone' } | { kind: 'account'; id: string } | { kind: 'percentage'; value: number };

/** The shares of the accounts a flag can be released to, in the order they are offered; index.ts accepts any whole percent. */
export const ROLLOUT_PERCENTAGES = [5, 10, 25, 50, 75] as const;

/** More flags than this are drawn as two tables, one under the other, so the matrix fits without scrolling sideways. */
export const FLAGS_PER_TABLE = 12;

/** Whether the flag's rule includes the row. */
export function selected(flag: ManagedFlag, row: AudienceRow): boolean {
  if (row.kind === 'off') return !flag.enabled;
  if (!flag.enabled) return false;
  if (row.kind === 'account') return flag.audience === 'accounts' && !!flag.accountIds?.includes(row.id);
  if (row.kind === 'percentage') return flag.audience === 'percentage' && flag.percentage === row.value;
  return flag.audience === row.kind;
}

/** The rule after selecting the row's square: an account is added or removed, any other row replaces the rule. */
export function changeRule(flag: ManagedFlag, row: AudienceRow): ManagedFlag {
  if (row.kind === 'off' || selected(flag, row) && row.kind !== 'account') return { ...flag, enabled: false };
  if (row.kind === 'percentage') return { ...flag, enabled: true, audience: 'percentage', percentage: row.value };
  if (row.kind !== 'account') return { ...flag, enabled: true, audience: row.kind };
  const ids = new Set(flag.audience === 'accounts' ? flag.accountIds : []);
  if (flag.enabled && ids.has(row.id)) ids.delete(row.id); else ids.add(row.id);
  return { ...flag, enabled: ids.size > 0, audience: 'accounts', accountIds: [...ids] };
}

/** The rows of the matrix for these accounts, in release order. */
export function audienceRows(accounts: Iterable<string>): [AudienceRow, string][] {
  return [
    [{ kind: 'off' }, 'Off'],
    [{ kind: 'owner' }, 'Owner'],
    ...[...accounts].map(id => [{ kind: 'account', id }, id] as [AudienceRow, string]),
    ...ROLLOUT_PERCENTAGES.map(value => [{ kind: 'percentage', value }, `${value}%`] as [AudienceRow, string]),
    [{ kind: 'everyone' }, 'Everyone'],
  ];
}

/** The flags split into the tables that draw them: one, or two halves when there are many. */
export function tableGroups<T>(flags: T[]): T[][] {
  if (flags.length <= FLAGS_PER_TABLE) return [flags];
  const half = Math.ceil(flags.length / 2);
  return [flags.slice(0, half), flags.slice(half)];
}

/** A matrix square's state: a check when the flag is on for its row, a cross when off. */
export function setToggle(button: HTMLButtonElement, on: boolean): void {
  button.setAttribute('aria-checked', String(on));
  const mark = document.createElement('span');
  mark.className = `ds-icon ds-icon--small ${on ? 'ds-icon-check' : 'ds-icon-close'}`;
  mark.setAttribute('aria-hidden', 'true');
  button.replaceChildren(mark);
}

/**
 * Cut words fade over their last square, never an ellipsis: marks an
 * audience's name `data-cut="end"` while it is wider than its column, and
 * matrix.css fades it only then. The matrix measures its own names, the same
 * way as Design system 1's cut-fade module, since a product draws it without that module.
 */
export function markCut(words: Element): void {
  if (words.scrollWidth > words.clientWidth + 1) { if (words.getAttribute('data-cut') !== 'end') words.setAttribute('data-cut', 'end'); }
  else if (words.hasAttribute('data-cut')) words.removeAttribute('data-cut');
}

/**
 * Draws the matrix of the existing release rules. `call()` reads the flags
 * again and `call(rule)` saves one; the host's transport stays owner-authenticated.
 */
export function mountAudienceMatrix(host: HTMLElement, initial: ManagedFlag[], call: (value?: unknown) => Promise<unknown>): void {
  let flags = initial;
  const accounts = new Set(flags.flatMap(flag => flag.accountIds ?? []));
  let busy = false;
  const status = document.createElement('p'); status.className = 'flags-matrix-status'; status.setAttribute('role', 'status');
  const chart = document.createElement('div'); chart.className = 'flags-matrix matrix-chart';
  const form = document.createElement('form'); form.className = 'flags-matrix-add';
  const label = document.createElement('label'); label.textContent = 'Account identity ';
  const input = document.createElement('input'); input.className = 'ds-input'; input.required = true; input.setAttribute('aria-label', 'Account identity'); label.appendChild(input);
  const add = document.createElement('button'); add.className = 'ds-button'; add.textContent = 'Add row'; add.type = 'submit';
  form.appendChild(label); form.appendChild(add);
  // The names are measured when they are drawn and whenever their box changes (a hidden matrix shown, the page's fonts arriving).
  const cuts = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(entries => { for (const entry of entries) markCut(entry.target); });
  const measure = () => { for (const words of chart.querySelectorAll('.matrix-words')) markCut(words); };
  document.fonts?.ready.then(measure, () => {});
  form.addEventListener('submit', event => { event.preventDefault(); const id = input.value.trim(); if (!id || busy) return; accounts.add(id); input.value = ''; render(); status.textContent = 'Select a flag square to grant access. Adding a row alone changes nothing.'; });
  function render() {
    const groups = tableGroups(flags);
    const tables = groups.map((group, index) => {
      const table = document.createElement('table'); table.className = 'matrix-table';
      if (index === groups.length - 1) {
        const caption = table.createCaption(); caption.className = 'flags-matrix-caption';
        caption.textContent = 'Flags across, audiences and accounts down. A check shows who the release rule includes, a cross who it leaves out. Changes save automatically. Choosing an account replaces Owner, a share or Everyone; multiple accounts can be selected. A share releases to that part of the accounts, the same accounts each time, and a larger share keeps them.';
      }
      const head = table.createTHead().insertRow(); const corner = document.createElement('th'); corner.scope = 'col'; corner.className = 'matrix-corner'; corner.textContent = 'Audience'; head.appendChild(corner);
      for (const flag of group) { const th = document.createElement('th'); th.scope = 'col'; th.className = 'matrix-column'; const span = document.createElement('span'); span.textContent = flag.label; th.title = flag.description || flag.label; th.appendChild(span); head.appendChild(th); }
      const body = table.createTBody();
      for (const [row, name] of audienceRows(accounts)) {
        const tr = body.insertRow(); const th = document.createElement('th'); th.scope = 'row'; th.className = 'matrix-row'; th.title = name; const words = document.createElement('span'); words.className = 'matrix-words'; words.textContent = name; th.appendChild(words); tr.appendChild(th);
        for (const flag of group) {
          const cell = tr.insertCell(); const button = document.createElement('button'); button.type = 'button'; button.className = 'flags-matrix-toggle'; button.setAttribute('role','switch'); button.setAttribute('aria-label',`${name}: ${flag.label}`); button.dataset.audience = row.kind; setToggle(button, selected(flag,row)); button.disabled = busy;
          button.addEventListener('click', async () => {
            if (busy) return; busy = true; render(); status.textContent = `Saving ${flag.label}…`;
            const next = changeRule(flag,row);
            try {
              await call({key:next.key,enabled:next.enabled,audience:next.audience,accountIds:next.accountIds ?? [],...(next.audience === 'percentage' ? {percentage:next.percentage} : {})});
              flags = flags.map(item => item.key === flag.key ? next : item); status.textContent = `${flag.label} saved.`;
            } catch {
              try { flags = await call() as ManagedFlag[]; status.textContent = 'Save interrupted. Current settings refreshed.'; }
              catch { status.textContent = 'Could not confirm the save. Reopen this app’s controls before trying again.'; render(); return; }
            }
            busy = false; render();
            const same = [...chart.querySelectorAll<HTMLButtonElement>('button')].find(item => item.getAttribute('aria-label') === `${name}: ${flag.label}`); same?.focus();
          });
          cell.appendChild(button);
        }
      }
      return table;
    });
    chart.replaceChildren(...tables); input.disabled = busy; add.disabled = busy;
    cuts?.disconnect(); for (const words of chart.querySelectorAll('.matrix-words')) cuts?.observe(words);
    measure();
  }
  host.replaceChildren(chart,form,status);
  if (!flags.length) { host.textContent = 'No features are waiting for release.'; return; }
  render();
}
