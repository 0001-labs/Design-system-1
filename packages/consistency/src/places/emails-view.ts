/**
 * The pure parts of the Emails place: no DOM, so they are tested on their own. Each kind and status in words, a
 * time and a size as the rows write them, the route a page of the list is asked for with, what an email was
 * about, and the document an email's HTML is drawn in. The emails and templates are the site engine's
 * (`worker/emails.ts`); a sign-in code was written out of them before they were kept.
 */

export type EmailsView = 'sent' | 'look';

/** An attachment as it was kept: its name, type and size, never its bytes. */
export interface EmailAttachment { filename: string; contentType: string; size: number }

/** An email as the list answers it. */
export interface EmailSummary {
  id: string; at: number; kind: string; to: string; from: string; subject: string;
  related: string | null; status: 'sent' | 'failed'; error: string | null; attachments: EmailAttachment[];
}

/** An email read whole: its words as they went. */
export interface EmailDetail extends EmailSummary { html: string; text: string }

/** A kind drawn with made up data. */
export interface EmailTemplateSource { subject: string; text: string }
export interface EmailTemplateEditing { build: string; base: string; revision: number; document: EmailTemplateSource; values: Record<string, string> }
export interface EmailTemplate { editing?: EmailTemplateEditing; from?: string; kind: string; to: string; subject: string; text: string; html: string; attachments: EmailAttachment[] }

/** Every kind the site engine sends, in the order the team meets them, with its name. */
export const EMAIL_KIND_NAMES: Record<string, string> = {
  'form-inquiry': 'Form enquiry',
  'sign-in-code': 'Sign-in code',
  'booking-confirmation': 'Booking confirmation',
  'booking-team-note': 'Booking note to the team',
  'booking-cancelled': 'Booking cancelled',
  'gift-card': 'Gift card',
  'gift-card-receipt': 'Gift card receipt',
};

/** A kind in words; one the app does not know yet is shown as the site engine names it. */
export const kindName = (kind: string) => EMAIL_KIND_NAMES[kind] ?? kind;

/** A status in words, and the tone of its tag. */
export const emailStatusName = (status: string): { name: string; tone: 'success' | 'danger' } => (status === 'failed' ? { name: 'Failed', tone: 'danger' } : { name: 'Sent', tone: 'success' });

/** The route a page of the list is asked for with: the kind and words when chosen, and where the last page ended. */
export function emailsQuery(filter: { kind?: string | null; q?: string | null; after?: string | null }): string {
  const query = new URLSearchParams();
  if (filter.kind) query.set('kind', filter.kind);
  const words = filter.q?.trim();
  if (words) query.set('q', words);
  if (filter.after) query.set('after', filter.after);
  const written = query.toString();
  return written ? `emails?${written}` : 'emails';
}

/** A time as a row writes it: "14:05" today, "21 Oct, 14:05" this year, else with the year. */
export function sentAt(at: number, now = Date.now(), timeZone?: string): string {
  const day = (time: number) => new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(time);
  const clock = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' }).format(at);
  if (day(at) === day(now)) return clock;
  const year = (time: number) => new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric' }).format(time);
  const date = new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric', month: 'short', ...(year(at) === year(now) ? {} : { year: 'numeric' }) }).format(at);
  return `${date}, ${clock}`;
}

/** A size as people read it: "820 bytes", "41 KB", "1.2 MB"; empty for none, as a template's attachment has. */
export function sizeName(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1_000) return `${bytes} bytes`;
  if (bytes < 1_000_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/**
 * What an email was about: a booking, or a gift card with its PDF, read through the site's API (`giftcards/<id>/pdf`).
 * The place it belongs to is named so the app can lead there once it has that place.
 */
export function relatedOf(email: Pick<EmailSummary, 'kind' | 'related'>): { name: string; place: 'bookings' | 'giftcards'; id: string; pdf?: string } | null {
  if (!email.related) return null;
  const id = email.related;
  if (email.kind.startsWith('booking-')) return { name: 'A booking', place: 'bookings', id };
  if (email.kind.startsWith('gift-card')) return { name: 'A gift card', place: 'giftcards', id, pdf: `giftcards/${encodeURIComponent(id)}/pdf` };
  return null;
}

/**
 * The document an email's HTML is drawn in, in a frame sandboxed without scripts: on white, as a mail program shows
 * it, its links opening a new tab, and nothing fetched but images.
 */
export function emailDocument(html: string): string {
  return [
    '<!doctype html>',
    '<html><head><meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'">`,
    '<base target="_blank">',
    "<style>html{color-scheme:light}body{margin:16px;background:#fff;color:#1d1d1b;font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;overflow-wrap:anywhere}</style>",
    `</head><body>${html}</body></html>`,
  ].join('');
}

/** Preview uses fictional values, substituted once and escaped as plain text. */
export function templatePreview(source: EmailTemplateSource, values: Record<string, string>): { subject: string; text: string; html: string } {
  const fill = (words: string) => words.replace(/{{\s*([a-zA-Z][\w]{0,31})\s*}}/g, (match, key: string) => values[key] ?? match);
  const text = fill(source.text), subject = fill(source.subject).replace(/[\r\n]+/g, ' ').slice(0, 200);
  return { subject, text, html: `<pre style="white-space:pre-wrap">${text.replace(/[&<>]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[character]!)}</pre>` };
}
