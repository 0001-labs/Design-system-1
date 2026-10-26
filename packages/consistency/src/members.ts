import { LitElement, html } from 'lit';
import '../../../DS1/3-unit/ds-list';
import '../../../DS1/3-unit/ds-row';
import '../../../DS1/3-unit/ds-select';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-input';
import '../../../DS1/2-core/ds-message';
import '../../../DS1/2-core/ds-tag';
import '../../../DS1/2-core/ds-icon';

/**
 * Settings → Members: the people invited to the workspace, for its admins and the owner. An invite is sent by
 * email; the person is in once they sign in at consistency.site with that address. The platform decides who may
 * do what; this page shows what it says.
 */
export interface Member { email: string; role: 'admin' | 'editor'; status: 'invited' | 'active' }

const MESSAGES: Record<string, string> = {
  'bad-email': 'That is not an email address.',
  forbidden: 'Only the workspace’s admins can do that.',
  'cannot-remove-yourself': 'You cannot remove yourself.',
  'unknown-member': 'That person is no longer in the workspace.',
};
const ROLE_WORDS: Record<Member['role'], string> = { admin: 'Admin', editor: 'Editor' };

export class ConsistencyMembers extends LitElement {
  static properties = { workspace: { type: String }, members: { state: true }, email: { state: true }, role: { state: true }, error: { state: true }, notice: { state: true }, busy: { state: true } };
  /** The workspace's code. */
  declare workspace: string;
  declare members: Member[] | null;
  declare email: string;
  declare role: Member['role'];
  declare error: string;
  declare notice: string;
  declare busy: boolean;

  constructor() { super(); this.workspace = ''; this.members = null; this.email = ''; this.role = 'editor'; this.error = ''; this.notice = ''; this.busy = false; }
  protected createRenderRoot() { return this; }

  private get api() { return `/api/consistency/workspaces/${this.workspace}/members`; }

  protected updated(changed: Map<string, unknown>) { if (changed.has('workspace') && this.workspace) void this.load(); }

  async load() {
    const response = await fetch(this.api, { cache: 'no-store' }).catch(() => null);
    const body = response?.ok ? await response.json().catch(() => null) as { members?: Member[] } | null : null;
    if (!Array.isArray(body?.members)) { this.error = 'The members could not be read. Try again.'; return; }
    this.members = body.members;
  }

  private async invite(event: Event) {
    event.preventDefault();
    const email = this.email.trim();
    if (this.busy || !email) return;
    this.busy = true; this.error = ''; this.notice = '';
    try {
      const response = await fetch(this.api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role: this.role }) }).catch(() => null);
      const body = response ? await response.json().catch(() => null) as { email?: string; status?: string; sent?: boolean; error?: string } | null : null;
      if (!response?.ok || !body?.email) { this.error = (body?.error && MESSAGES[body.error]) || 'The invite could not be sent. Try again.'; return; }
      this.notice = body.status === 'active' ? `${body.email} is now ${ROLE_WORDS[this.role].toLowerCase()}.` : body.sent ? `Invite sent to ${body.email}.` : `${body.email} is invited, but the email could not be sent. They can sign in at consistency.site.`;
      this.email = '';
      await this.load();
    } finally { this.busy = false; }
  }

  private async removeMember(member: Member) {
    this.error = ''; this.notice = '';
    const response = await fetch(`${this.api}/${encodeURIComponent(member.email)}`, { method: 'DELETE' }).catch(() => null);
    if (!response?.ok) { const body = response ? await response.json().catch(() => null) as { error?: string } | null : null; this.error = (body?.error && MESSAGES[body.error]) || `${member.email} could not be removed. Try again.`; return; }
    this.members = (this.members ?? []).filter(each => each.email !== member.email);
  }

  private row(member: Member) {
    const id = `member-more-${member.email.replace(/[^a-z0-9]/g, '-')}`;
    return html`<ds-row class="member-row" data-status=${member.status}>
      <span class="ds-row__name">${member.email}</span>
      <span class="ds-row__value">${member.status === 'invited' ? html`<ds-tag>Invited</ds-tag>` : ''}<ds-tag>${ROLE_WORDS[member.role]}</ds-tag>
        <ds-button id=${id} icon label=${`More for ${member.email}`}><ds-icon type="more"></ds-icon></ds-button>
        <ds-select for=${id} aria-label=${`Actions for ${member.email}`}><ds-button menu-item role="menuitem" @click=${() => void this.removeMember(member)}>Remove</ds-button></ds-select></span>
    </ds-row>`;
  }

  render() {
    return html`<section class="members" aria-label="Members">
      <form class="members-invite" @submit=${(event: Event) => void this.invite(event)}>
        <ds-input class="members-email" name="email" aria-label="Email" placeholder="name@example.com" autocomplete="off" spellcheck="false" .value=${this.email}
          @input-change=${(event: CustomEvent<{ value: string }>) => { this.email = event.detail.value; }}></ds-input>
        <ds-select class="members-role" aria-label="Role"><select aria-label="Role" .value=${this.role} @change=${(event: Event) => { this.role = (event.target as HTMLSelectElement).value === 'admin' ? 'admin' : 'editor'; }}>
          <option value="editor" ?selected=${this.role === 'editor'}>Editor</option><option value="admin" ?selected=${this.role === 'admin'}>Admin</option>
        </select></ds-select>
        <ds-button primary @click=${(event: Event) => void this.invite(event)} ?disabled=${this.busy || !this.email.trim()}>Invite</ds-button>
      </form>
      ${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : ''}
      ${this.notice ? html`<ds-message role="status" literal text=${this.notice}></ds-message>` : ''}
      ${this.members?.length ? html`<ds-list aria-label="Members">${this.members.map(member => this.row(member))}</ds-list>` : ''}
    </section>`;
  }
}
if (!customElements.get('consistency-members')) customElements.define('consistency-members', ConsistencyMembers);
