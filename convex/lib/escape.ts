/**
 * HTML-escape a value before interpolating it into an email body.
 *
 * The sibling Consistency repo interpolates `title`, `subtitle`, `bodyHtml` and
 * `cta.url` unescaped in `renderEmailHtml`, and does the same with `siteName`
 * and `fromEmail` in its transfer mails. A magic-link email interpolates a
 * user-supplied email address, so this is not theoretical here.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape a URL for an `href`.
 *
 * Only http(s) survives. A `javascript:` or `data:` URL reaching an anchor in
 * an email that we generate would mean the link builder had been fed hostile
 * input, so it fails closed to "#" rather than rendering something clickable.
 */
export function escapeHref(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "#";
    return escapeHtml(parsed.toString());
  } catch {
    return "#";
  }
}
