/** Inline editing of a site's real email wording, with revisioned automatic persistence. */
import { LitElement, html, nothing } from 'lit';
import { DocumentState } from '../document-state';
import { siteApi } from './api';
import { emailDocument, templatePreview, type EmailTemplate, type EmailTemplateEditing, type EmailTemplateSource } from './emails-view';
import '../../../../DS1/2-core/ds-input';
import '../../../../DS1/2-core/ds-button';
import '../../../../DS1/2-core/ds-text';
import '../../../../DS1/2-core/ds-message';

export class EmailTemplateEditor extends LitElement {
  site = ''; lang = 'en'; template!: EmailTemplate;
  private state?: DocumentState<EmailTemplateSource, EmailTemplateEditing>;
  private problem = '';
  private get key() { return `consistency-email-draft:${this.site}:${this.template.kind}:${this.lang}`; }
  private unload = (event: BeforeUnloadEvent) => { if (this.state?.dirty || this.state?.busy) { event.preventDefault(); event.returnValue = ''; } };
  createRenderRoot() { return this; }
  connectedCallback() { super.connectedCallback(); addEventListener('beforeunload', this.unload); }
  disconnectedCallback() { super.disconnectedCallback(); removeEventListener('beforeunload', this.unload); }
  refresh(template: EmailTemplate) {
    const snapshot = template.editing;
    if (!snapshot || this.state?.dirty || this.state?.busy) return;
    if (this.state && this.state.snapshot.build === snapshot.build && this.state.snapshot.base === snapshot.base && this.state.snapshot.revision >= snapshot.revision) return;
    this.template = template;
    this.state?.destroy();
    this.state = new DocumentState(snapshot, async value => {
      const answer = await siteApi<{ template: EmailTemplate }>(this.site, `emails/templates/${encodeURIComponent(template.kind)}?lang=${encodeURIComponent(this.lang)}`, { method: 'PUT', json: value });
      this.template = answer.template;
      this.dispatchEvent(new CustomEvent('email-template-saved', { detail: answer.template, bubbles: true }));
      return answer.template.editing!;
    }, () => { this.keepDraft(); this.requestUpdate(); });
    try {
      const draft = JSON.parse(sessionStorage.getItem(this.key) ?? 'null') as EmailTemplateEditing | null;
      if (draft?.document && typeof draft.document.subject === 'string' && typeof draft.document.text === 'string') {
        if (draft.base === snapshot.base && draft.build === snapshot.build && draft.revision === snapshot.revision) { this.state.document = draft.document; this.state.error = 'Your unsaved draft is kept. Try again to save it.'; }
        else { this.state.document = draft.document; this.state.error = 'This email changed elsewhere. Your draft is kept. Use the saved version to replace it.'; }
      }
    } catch { /* An unreadable local draft does not replace the site's words. */ }
    this.requestUpdate();
  }
  private keepDraft() {
    if (!this.state) return;
    try {
      if (this.state.dirty) sessionStorage.setItem(this.key, JSON.stringify({ ...this.state.snapshot, document: this.state.document }));
      else sessionStorage.removeItem(this.key);
    } catch { /* Memory still retains the draft and navigation remains guarded. */ }
  }
  private change(field: keyof EmailTemplateSource, value: string) { this.state?.commit({ ...this.state.document, [field]: value }); }
  async flush() { return await this.state?.flush() !== false; }
  private async useSaved() {
    try {
      if (this.state?.busy) await this.state.flush();
      const answer = await siteApi<{ template: EmailTemplate }>(this.site, `emails/templates/${encodeURIComponent(this.template.kind)}?lang=${encodeURIComponent(this.lang)}`);
      this.state?.discard(); sessionStorage.removeItem(this.key); this.state?.destroy(); this.state = undefined; this.problem = ''; this.refresh(answer.template);
      this.dispatchEvent(new CustomEvent('email-template-saved', { detail: answer.template, bubbles: true }));
    } catch (error) { this.problem = (error as Error).message; this.requestUpdate(); }
  }
  render() {
    if (!this.state) return nothing;
    const state = this.state, preview = templatePreview(state.document, state.snapshot.values), error = this.problem || state.error;
    return html`<div class="place-email-editor">
      <ds-input literal label="Subject" aria-label="Email subject" autocomplete="off" .value=${state.document.subject} maxlength="500"
        @input-change=${(event: CustomEvent<{ value: string }>) => this.change('subject', event.detail.value)} @focusout=${() => { if (!this.state?.error) void this.flush(); }}></ds-input>
      <ds-input literal multiline rows="10" max-rows="20" label="Message" aria-label="Email message" .value=${state.document.text} maxlength="16000"
        @input-change=${(event: CustomEvent<{ value: string }>) => this.change('text', event.detail.value)} @focusout=${() => { if (!this.state?.error) void this.flush(); }}></ds-input>
      <ds-text literal wrap tone="muted" text=${`Form fields: ${Object.keys(state.snapshot.values).map(key => `{{${key}}}`).join(', ')}.`}></ds-text>
      ${error ? html`<ds-message role="alert" tone="danger" literal heading="The email could not be saved" text=${error}></ds-message>
        <div class="place-email-editor__actions"><ds-button secondary @click=${() => void this.flush()}>Try again</ds-button><ds-button secondary @click=${() => void this.useSaved()}>Use saved version</ds-button></div>` : nothing}
      <ds-text literal text="Preview"></ds-text>
      <iframe class="place-email__frame" title="Enquiry email preview" sandbox="allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer" .srcdoc=${emailDocument(preview.html)}></iframe>
    </div>`;
  }
}
customElements.define('consistency-email-template-editor', EmailTemplateEditor);
