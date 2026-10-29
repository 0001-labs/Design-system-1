/**
 * Emails, one of an open site's places in Consistency's app, ported from the sites' own editor (deleted 26 October
 * 2026): what the site has sent and to whom, and how each kind looks. Sent and How they look are Design system 1's
 * text tabs. Sent lists every email kept, newest first, fifty at a time with Show more: when, to whom, its kind as a
 * tag and its subject, a failed one in the danger colour; words (an address or a subject) and a kind narrow it. How
 * they look lists every kind the site sends, drawn by the site engine with made up people, in the language chosen.
 *
 * Pressing one opens it in a non-modal drawer beside the list, so another row can be pressed while it is open: its
 * HTML drawn in a frame sandboxed without scripts (`srcdoc`), its plain text under a disclosure, then To, From, when
 * and its status, what it was about, and its attachments by name and size, a gift card's PDF opened through the
 * site's API. Nothing here sends anything. The list is read on entry, on coming back and when the window has the
 * focus again, drawn first from the last read.
 */
import { LitElement, html, nothing } from 'lit';
import '../../../../DS1/3-unit/ds-list';
import '../../../../DS1/3-unit/ds-row';
import '../../../../DS1/3-unit/ds-tabs';
import '../../../../DS1/3-unit/ds-select';
import '../../../../DS1/4-page/ds-overlay';
import '../../../../DS1/2-core/ds-button';
import '../../../../DS1/2-core/ds-input';
import '../../../../DS1/2-core/ds-tag';
import '../../../../DS1/2-core/ds-text';
import '../../../../DS1/2-core/ds-message';
import '../../../../DS1/2-core/ds-empty';
import type { SiteSummary } from '../site-editing';
import { EmailTemplateEditor } from './email-template-editor';
import { siteApi } from './api';
import { kept, readWhenShown } from './fresh';
import { emailDocument, emailsQuery, emailStatusName, kindName, relatedOf, sentAt, sizeName, type EmailDetail, type EmailsView, type EmailSummary, type EmailTemplate } from './emails-view';
import { languagesOf, when, type Language, type PageSummary } from './pages-group';
import './places.css';

interface ListAnswer { kinds?: string[]; emails?: EmailSummary[]; next?: string | null }
interface TemplatesAnswer { lang?: string; from?: string | null; templates?: EmailTemplate[] }
/** What the drawer shows: a sent email (read whole once opened), or a kind drawn with made up people. */
type Shown = { kind: 'sent'; summary: EmailSummary; email?: EmailDetail; problem?: string } | { kind: 'look'; template: EmailTemplate; from: string | null };

const TABS: { view: EmailsView; label: string }[] = [{ view: 'sent', label: 'Sent' }, { view: 'look', label: 'How they look' }];

export class ConsistencyPlaceEmails extends LitElement {
  static properties = {
    kinds: { state: true }, view: { state: true }, emails: { state: true }, next: { state: true }, problem: { state: true }, kind: { state: true }, words: { state: true },
    languages: { state: true }, chosenLang: { state: true }, templates: { state: true }, from: { state: true }, lookProblem: { state: true }, shown: { state: true },
  };
  declare kinds: string[];
  declare view: EmailsView;
  declare emails: EmailSummary[] | null;
  declare next: string | null;
  declare problem: string;
  declare kind: string;
  declare words: string;
  declare languages: Language[];
  declare chosenLang: string | null;
  declare templates: EmailTemplate[] | null;
  declare from: string | null;
  declare lookProblem: string;
  declare shown: Shown | null;
  site!: SiteSummary;
  private stop: (() => void) | null = null;
  private turn = 0;
  private typing = 0;
  private readonly templateEditors = new Map<string, EmailTemplateEditor>();

  constructor(site?: SiteSummary) {
    super();
    if (site) this.site = site;
    this.kinds = []; this.view = 'sent'; this.emails = null; this.next = null; this.problem = ''; this.kind = ''; this.words = '';
    this.languages = []; this.chosenLang = null; this.templates = null; this.from = null; this.lookProblem = ''; this.shown = null;
  }
  protected createRenderRoot() { return this; }

  private get key() { return `consistency-place-emails:${this.site.code}`; }

  connectedCallback() {
    super.connectedCallback();
    if (!this.emails) { const last = kept.read<ListAnswer>(this.key); if (Array.isArray(last?.emails)) { this.kinds = last.kinds ?? [...new Set(last.emails.map(email => email.kind))]; this.emails = last.emails; this.next = last.next ?? null; } }
    this.stop = readWhenShown(this, () => void this.read());
    void this.read();
  }
  disconnectedCallback() { super.disconnectedCallback(); this.stop?.(); this.stop = null; window.clearTimeout(this.typing); }

  /** What the tab shows, again: the first page of what was sent, or every kind in the language chosen. */
  read() { return this.view === 'sent' ? this.load(null) : this.look(); }

  /** A page of the emails sent; from the first, it takes the place of what was shown. */
  private async load(after: string | null) {
    const mine = after ? this.turn : ++this.turn;
    try {
      const answer = await siteApi<ListAnswer>(this.site.code, emailsQuery({ kind: this.kind || null, q: this.words, after }));
      if (mine !== this.turn) return;
      const emails = Array.isArray(answer.emails) ? answer.emails : [];
      this.emails = after ? [...(this.emails ?? []), ...emails] : emails;
      this.kinds = answer.kinds ?? [...new Set([...(after ? this.kinds : []), ...emails.map(email => email.kind)])];
      this.next = answer.next ?? null;
      this.problem = '';
      if (!after && !this.kind && !this.words.trim()) kept.write(this.key, { emails, next: this.next, kinds: this.kinds });
    } catch (error) {
      if (mine === this.turn) this.problem = (error as Error).message;
    }
  }

  /** Every kind the site sends, drawn in the language chosen; the site's languages are read from its pages. */
  private async look() {
    if (!this.languages.length) {
      const pages = await siteApi<{ pages?: PageSummary[] }>(this.site.code, 'pages').then(answer => answer.pages ?? [], () => [] as PageSummary[]);
      this.languages = languagesOf(pages);
    }
    const lang = this.chosenLang ?? this.languages[0]?.code ?? 'en';
    try {
      const answer = await siteApi<TemplatesAnswer>(this.site.code, `emails/templates?lang=${encodeURIComponent(lang)}`);
      if ((this.chosenLang ?? this.languages[0]?.code ?? 'en') !== lang) return;
      this.templates = Array.isArray(answer.templates) ? answer.templates : [];
      this.from = answer.from ?? null;
      if (this.shown?.kind === 'look') { const kind = this.shown.template.kind; const template = this.templates.find(template => template.kind === kind); if (template) this.shown = { kind: 'look', template, from: template.from ?? this.from }; }
      this.lookProblem = '';
    } catch (error) {
      this.lookProblem = (error as Error).message;
    }
  }

  private async choose(view: EmailsView) {
    if (view === this.view) return;
    if (!await this.flush()) return;
    this.view = view;
    this.shown = null;
    void this.read();
  }

  /** Narrows the list by the words typed, a quarter of a second after the last key. */
  private search(words: string) {
    this.words = words;
    window.clearTimeout(this.typing);
    this.typing = window.setTimeout(() => void this.load(null), 250);
  }

  /** Opens a sent email in the drawer, read whole. */
  private async open(summary: EmailSummary) {
    if (!await this.flush()) return;
    this.shown = { kind: 'sent', summary };
    try {
      const answer = await siteApi<{ email?: EmailDetail }>(this.site.code, `emails/${encodeURIComponent(summary.id)}`);
      if (this.shown?.kind === 'sent' && this.shown.summary === summary) this.shown = answer.email ? { kind: 'sent', summary, email: answer.email } : { kind: 'sent', summary, problem: 'The site has no such email.' };
    } catch (error) {
      if (this.shown?.kind === 'sent' && this.shown.summary === summary) this.shown = { kind: 'sent', summary, problem: (error as Error).message };
    }
  }

  render() {
    return html`<div class="place place-column place-emails">
      <ds-text class="place-title" role="heading" aria-level="1" literal size="display" text="Emails"></ds-text>
      <ds-tabs text aria-label="Emails">${TABS.map(tab => html`<ds-button control="host" role="tab" ?active=${tab.view === this.view} aria-selected=${String(tab.view === this.view)}
        tabindex=${tab.view === this.view ? 0 : -1} @click=${() => this.choose(tab.view)}>${tab.label}</ds-button>`)}</ds-tabs>
      ${this.view === 'sent' ? this.sent() : this.looks()}
      ${this.drawer()}
    </div>`;
  }

  private sent() {
    const narrowed = Boolean(this.kind || this.words.trim());
    return html`<div class="place-emails__filters">
        <ds-input class="place-emails__search" type="search" aria-label="Search by address or subject" placeholder="Search by address or subject" autocomplete="off"
          .value=${this.words} @input-change=${(event: CustomEvent<{ value: string }>) => this.search(event.detail.value)}></ds-input>
        <ds-select class="place-emails__kind"><select aria-label="Kind" .value=${this.kind} @change=${(event: Event) => { this.kind = (event.target as HTMLSelectElement).value; void this.load(null); }}>
          <option value="" ?selected=${!this.kind}>Every kind</option>
          ${this.kinds.map(value => html`<option value=${value} ?selected=${value === this.kind}>${kindName(value)}</option>`)}
        </select></ds-select>
      </div>
      ${this.problem ? html`<ds-message role="alert" tone="danger" literal heading="The emails could not be read" text=${this.problem}></ds-message>` : nothing}
      ${!this.emails ? nothing : !this.emails.length ? html`<ds-empty literal heading=${narrowed ? 'No emails like that' : 'No emails yet'}
          text=${narrowed ? 'Nothing sent in the last 180 days matches.' : 'Every email the site sends shows here for 180 days.'}></ds-empty>`
        : html`<ds-list class="place-emails__list" aria-label="Sent emails">${this.emails.map(email => {
          const failed = email.status === 'failed';
          return html`<ds-row interactive class="place-email" ?data-failed=${failed} ?current=${this.shown?.kind === 'sent' && this.shown.summary.id === email.id} label=${`${email.subject}, to ${email.to}`} @click=${() => void this.open(email)}>
            <time class="place-email__when" datetime=${new Date(email.at).toISOString()}>${sentAt(email.at)}</time>
            <ds-text class="place-email__to" literal text=${email.to}></ds-text>
            <ds-tag class="place-email__kind" data-tone=${failed ? 'danger' : 'muted'}>${failed ? 'Failed' : kindName(email.kind)}</ds-tag>
            <span class="ds-row__name place-email__subject">${email.subject}</span>
          </ds-row>`;
        })}</ds-list>
        ${this.next ? html`<div class="place-emails__more"><ds-button secondary @click=${() => void this.load(this.next)}>Show more</ds-button></div>` : nothing}`}`;
  }

  private looks() {
    const lang = this.chosenLang ?? this.languages[0]?.code;
    return html`${this.languages.length > 1 ? html`<ds-tabs text class="place-languages" aria-label="Language">${this.languages.map(each => html`<ds-button control="host" role="tab" lang=${each.code}
        ?active=${each.code === lang} aria-selected=${String(each.code === lang)} tabindex=${each.code === lang ? 0 : -1}
        @click=${async () => { if (!await this.flush()) return; this.chosenLang = each.code; this.shown = null; void this.look(); }}>${each.name}</ds-button>`)}</ds-tabs>` : nothing}
      ${this.lookProblem ? html`<ds-message role="alert" tone="danger" literal heading="The emails could not be drawn" text=${this.lookProblem}></ds-message>` : nothing}
      ${this.templates ? html`<ds-list class="place-emails__list" aria-label="How they look">${this.templates.map(template => html`<ds-row interactive class="place-email" label=${kindName(template.kind)}
        ?current=${this.shown?.kind === 'look' && this.shown.template.kind === template.kind} @click=${async () => { if (!await this.flush()) return; this.shown = { kind: 'look', template, from: template.from ?? this.from }; }}>
        <span class="place-email__kind-name">${kindName(template.kind)}</span>
        <span class="ds-row__name place-email__subject place-muted">${template.subject}</span>
      </ds-row>`)}</ds-list>` : nothing}`;
  }

  async flush(): Promise<boolean> {
    const answers = await Promise.all([...this.templateEditors.values()].map(editor => editor.flush()));
    return answers.every(Boolean);
  }
  private async close() { if (await this.flush()) this.shown = null; }
  private editTemplate(template: EmailTemplate) {
    const lang = this.chosenLang ?? this.languages[0]?.code ?? 'en', key = `${template.kind}:${lang}`;
    let editor = this.templateEditors.get(key);
    if (!editor) {
      editor = new EmailTemplateEditor(); editor.site = this.site.code; editor.lang = lang; editor.template = template;
      editor.addEventListener('email-template-saved', (event: Event) => {
        const saved = (event as CustomEvent<EmailTemplate>).detail;
        this.templates = this.templates?.map(each => each.kind === saved.kind ? saved : each) ?? null;
        if (this.shown?.kind === 'look' && this.shown.template.kind === saved.kind) this.shown = { ...this.shown, template: saved };
      });
      this.templateEditors.set(key, editor);
    }
    editor.refresh(template);
    return editor;
  }
  /** The drawer beside the list: one email, drawn as it went, or as its kind looks. */
  private drawer() {
    const shown = this.shown;
    const group = (label: string, rows: unknown) => html`<div class="place-drawer__group"><ds-list heading=${label}>${rows}</ds-list></div>`;
    const line = (name: unknown, value?: unknown) => html`<ds-row><span class="ds-row__name">${name}</span>${value === undefined ? nothing : html`<span class="ds-row__value">${value}</span>`}</ds-row>`;
    const drawn = (email: { subject: string; html: string; text: string }) => html`
      <iframe class="place-email__frame" title=${`The email: ${email.subject}`} sandbox="allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer" .srcdoc=${emailDocument(email.html)}></iframe>
      <details class="place-email__text"><summary class="ds-row"><span class="ds-row__name">Plain text</span></summary><pre class="place-email__plain">${email.text}</pre></details>`;
    const attachments = (files: EmailDetail['attachments'], pdf?: string) => files.length ? group('Attachments', files.map(file => line(
      pdf && file.contentType === 'application/pdf' ? html`<a class="ds-link" href=${`/api/consistency/sites/${encodeURIComponent(this.site.code)}/api/${pdf}`} target="_blank" rel="noopener">${file.filename}</a>` : file.filename,
      html`<span class="place-muted">${sizeName(file.size) || file.contentType}</span>`))) : nothing;
    let title = '', description = '', body: unknown = nothing;
    if (shown?.kind === 'sent') {
      const email = shown.email, summary = shown.summary;
      title = summary.subject; description = `${kindName(summary.kind)} · ${sentAt(summary.at)}`;
      if (shown.problem) body = html`<ds-message role="alert" tone="danger" literal heading="The email could not be read" text=${shown.problem}></ds-message>`;
      else if (email) {
        const status = emailStatusName(email.status), related = relatedOf(email);
        body = html`${drawn(email)}
          ${group('Sent', html`${line('To', email.to)}${line('From', email.from || html`<span class="place-muted">No sender</span>`)}
            ${line('When', html`<time datetime=${new Date(email.at).toISOString()} title=${when(email.at)}>${sentAt(email.at)}</time>`)}
            ${line('Status', html`<ds-tag data-tone=${status.tone}>${status.name}</ds-tag>`)}
            ${related ? line('About', related.name) : nothing}`)}
          ${email.error ? html`<ds-message role="alert" tone="danger" literal text=${email.error}></ds-message>` : nothing}
          ${attachments(email.attachments, related?.pdf)}`;
      }
    } else if (shown?.kind === 'look') {
      const template = shown.template;
      title = template.subject; description = `${kindName(template.kind)}, drawn with made up people. Nothing is sent.`;
      body = html`${template.editing ? this.editTemplate(template) : drawn(template)}${group('Sent', html`${line('To', template.to)}${line('From', shown.from || html`<span class="place-muted">The site's address</span>`)}`)}${attachments(template.attachments)}`;
    }
    return html`<ds-overlay type="drawer" .nonModal=${true} .holdScroll=${false} .blockOutside=${false} .open=${!!shown}
      @ds-close-request=${(event: Event) => { if (event.target === event.currentTarget) { event.preventDefault(); void this.close(); } }}>
      <dialog class="place-drawer place-email-drawer" aria-labelledby="place-email-title">
        <div data-ds-overlay="header"><h2 data-ds-overlay="title" id="place-email-title">${title}</h2><p data-ds-overlay="description">${description}</p></div>
        ${body}
        <div data-ds-overlay="footer"><ds-button secondary @click=${() => void this.close()}>Close</ds-button></div>
      </dialog>
    </ds-overlay>`;
  }
}
if (!customElements.get('consistency-place-emails')) customElements.define('consistency-place-emails', ConsistencyPlaceEmails);
