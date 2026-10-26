import { LitElement, html } from 'lit';
import '../../../DS1/3-unit/ds-list';
import '../../../DS1/3-unit/ds-row';
import '../../../DS1/3-unit/ds-select';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-input';
import '../../../DS1/2-core/ds-message';
import '../../../DS1/2-core/ds-tag';
import '../../../DS1/2-core/ds-icon';
import '../../../DS1/2-core/ds-avatar';
import '../../../DS1/2-core/ds-empty';

/**
 * The people in the workspace, in Settings → People and in the people panel a site card's avatars open. Everyone
 * in the workspace sees them; its admins and the owner (`manage`) invite and remove them. An invite is sent by
 * email, and sent again from an invited person's menu; the person is in once they sign in at consistency.site with
 * that address. The platform decides who may
 * do what; this shows what it says, and tells the page when the people change (`members-change`).
 */
export interface Member { email: string; role: 'admin' | 'editor'; status: 'invited' | 'active' }
/** A person's avatar letter: their address's first letter. */
export const personInitial = (email: string) => (email.trim()[0] ?? '?').toUpperCase();
export const MEMBERS_CHANGE = 'members-change';

const MESSAGES: Record<string, string> = {
  'bad-email': 'That is not an email address.',
  forbidden: 'Only the workspace’s admins can do that.',
  'cannot-remove-yourself': 'You cannot remove yourself.',
  'unknown-member': 'That person is no longer in the workspace.',
};
const ROLE_WORDS: Record<Member['role'], string> = { admin: 'Admin', editor: 'Editor' };

export class ConsistencyMembers extends LitElement {
  static properties = { workspace: { type: String }, manage: { type: Boolean }, members: { state: true }, email: { state: true }, role: { state: true }, error: { state: true }, notice: { state: true }, busy: { state: true } };
  /** The workspace's code. */
  declare workspace: string;
  /** Whether this person may invite and remove people. */
  declare manage: boolean;
  declare members: Member[] | null;
  declare email: string;
  declare role: Member['role'];
  declare error: string;
  declare notice: string;
  declare busy: boolean;

  constructor() { super(); this.workspace = ''; this.manage = true; this.members = null; this.email = ''; this.role = 'editor'; this.error = ''; this.notice = ''; this.busy = false; }
  protected createRenderRoot() { return this; }

  private get api() { return `/api/consistency/workspaces/${this.workspace}/members`; }

  protected updated(changed: Map<string, unknown>) { if (changed.has('workspace') && this.workspace) void this.load(); }

  async load() {
    const response = await fetch(this.api, { cache: 'no-store' }).catch(() => null);
    const body = response?.ok ? await response.json().catch(() => null) as { members?: Member[] } | null : null;
    if (!Array.isArray(body?.members)) { this.error = 'The members could not be read. Try again.'; return; }
    this.members = body.members;
    this.changed();
  }

  private changed() { this.dispatchEvent(new CustomEvent(MEMBERS_CHANGE, { bubbles: true, detail: { workspace: this.workspace, members: this.members ?? [] } })); }

  private async invite(event: Event) {
    event.preventDefault();
    const email = this.email.trim();
    if (this.busy || !email) return;
    if (await this.send(email, this.role)) this.email = '';
  }

  /** Invites the address, or sends a waiting invite again: the platform emails it to anyone not yet in. */
  private async send(email: string, role: Member['role'], again = false): Promise<boolean> {
    this.busy = true; this.error = ''; this.notice = '';
    try {
      const response = await fetch(this.api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) }).catch(() => null);
      const body = response ? await response.json().catch(() => null) as { email?: string; status?: string; sent?: boolean; error?: string } | null : null;
      if (!response?.ok || !body?.email) { this.error = (body?.error && MESSAGES[body.error]) || 'The invite could not be sent. Try again.'; return false; }
      this.notice = body.status === 'active' ? (again ? `${body.email} is already in.` : `${body.email} is now ${ROLE_WORDS[role].toLowerCase()}.`) : body.sent ? `Invite sent ${again ? 'again ' : ''}to ${body.email}.` : `${body.email} is invited, but the email could not be sent. They can sign in at consistency.site.`;
      await this.load();
      return true;
    } finally { this.busy = false; }
  }

  private async removeMember(member: Member) {
    this.error = ''; this.notice = '';
    const response = await fetch(`${this.api}/${encodeURIComponent(member.email)}`, { method: 'DELETE' }).catch(() => null);
    if (!response?.ok) { const body = response ? await response.json().catch(() => null) as { error?: string } | null : null; this.error = (body?.error && MESSAGES[body.error]) || `${member.email} could not be removed. Try again.`; return; }
    this.members = (this.members ?? []).filter(each => each.email !== member.email);
    this.changed();
  }

  private row(member: Member) {
    const id = `member-more-${member.email.replace(/[^a-z0-9]/g, '-')}`;
    return html`<ds-row class="member-row" data-status=${member.status}>
      <ds-avatar class="ds-row__picture" initial=${personInitial(member.email)} outlined ?pending=${member.status === 'invited'} aria-hidden="true"></ds-avatar>
      <span class="ds-row__name">${member.email}</span>
      <span class="ds-row__value">${member.status === 'invited' ? html`<ds-tag>Invited</ds-tag>` : ''}<ds-tag>${ROLE_WORDS[member.role]}</ds-tag>
        ${this.manage ? html`<ds-button id=${id} icon label=${`More for ${member.email}`}><ds-icon type="more"></ds-icon></ds-button>
        <ds-select for=${id} aria-label=${`Actions for ${member.email}`}>${member.status === 'invited' ? html`<ds-button menu-item role="menuitem" ?disabled=${this.busy} @click=${() => void this.send(member.email, member.role, true)}>Send the invite again</ds-button>` : ''}<ds-button menu-item role="menuitem" @click=${() => void this.removeMember(member)}>Remove</ds-button></ds-select>` : ''}</span>
    </ds-row>`;
  }

  render() {
    return html`<section class="members" aria-label="People">
      ${this.manage ? html`<form class="members-invite" @submit=${(event: Event) => void this.invite(event)}>
        <ds-input class="members-email" name="email" aria-label="Email" placeholder="name@example.com" autocomplete="off" spellcheck="false" .value=${this.email}
          @input-change=${(event: CustomEvent<{ value: string }>) => { this.email = event.detail.value; }}></ds-input>
        <ds-select class="members-role" aria-label="Role"><select aria-label="Role" .value=${this.role} @change=${(event: Event) => { this.role = (event.target as HTMLSelectElement).value === 'admin' ? 'admin' : 'editor'; }}>
          <option value="editor" ?selected=${this.role === 'editor'}>Editor</option><option value="admin" ?selected=${this.role === 'admin'}>Admin</option>
        </select></ds-select>
        <ds-button primary @click=${(event: Event) => void this.invite(event)} ?disabled=${this.busy || !this.email.trim()}>Invite</ds-button>
      </form>` : ''}
      ${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : ''}
      ${this.notice ? html`<ds-message role="status" literal text=${this.notice}></ds-message>` : ''}
      ${this.members?.length ? html`<ds-list aria-label="People">${this.members.map(member => this.row(member))}</ds-list>` : this.members ? html`<ds-empty literal heading="No one is invited yet"></ds-empty>` : ''}
    </section>`;
  }
}
if (!customElements.get('consistency-members')) customElements.define('consistency-members', ConsistencyMembers);
