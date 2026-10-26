import { escapeHref, escapeHtml } from "./escape";

/**
 * Resend over plain `fetch`, no SDK — the same approach as the sibling
 * Consistency repo, with three deliberate changes:
 *
 *   1. The From address is a parameter, not a literal repeated at every call
 *      site.
 *   2. Everything interpolated into the HTML is escaped.
 *   3. There is exactly one no-key policy. Consistency has four different ones
 *      across four call sites — crash, 503, throw, and silent no-op.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface Email {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function resendApiKey(): string | undefined {
  return process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY;
}

/** MAIL_FROM, or its address under another name when one is given (a product the sign-in serves). */
export function mailFrom(name?: string): string {
  const from = process.env.MAIL_FROM ?? "Design system 1 <login@mail.dsone.dev>";
  if (!name) return from;
  const address = /<([^<>]+)>\s*$/.exec(from)?.[1] ?? from.trim();
  return `${name.replace(/[<>"\r\n]/g, "").trim()} <${address}>`;
}

export async function sendEmail(email: Email, fromName?: string): Promise<void> {
  const key = resendApiKey();
  if (!key) {
    // The one no-key policy: never silently succeed in a way that looks like
    // delivery. The caller is responsible for the dev fallback.
    throw new Error("AUTH_RESEND_KEY is not configured.");
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: mailFrom(fromName), ...email }),
  });

  if (!response.ok) {
    throw new Error(`Resend returned ${response.status}: ${await response.text()}`);
  }
}

export function renderMagicLinkEmail(args: { url: string; expiresMinutes: number }): Email {
  const href = escapeHref(args.url);
  const minutes = Math.max(1, Math.round(args.expiresMinutes));

  // escapeHref collapses anything that is not http(s) to "#". That should be
  // unreachable — we generate this URL — but if it ever happens, do not also
  // print the raw value under "paste this into your browser". Telling someone
  // to paste a javascript: URL is worse than showing them nothing, and some
  // mail clients auto-linkify bare text.
  const usable = href !== "#";

  const fallback = usable
    ? `<p style="margin:0;font-size:13px;line-height:1.5;color:#797979">
          If the button does not work, paste this into your browser:<br>
          <span style="word-break:break-all">${escapeHtml(args.url)}</span>
        </p>`
    : "";

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:32px;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#1e1e1e">
    <table role="presentation" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #d8d8d5;border-radius:8px">
      <tr><td style="padding:32px">
        <p style="margin:0 0 8px;font-size:18px;font-weight:500">Sign in to Design system 1</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#555">
          This link expires in ${minutes} minutes and can be used once.
        </p>
        <p style="margin:0 0 24px">
          <a href="${href}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#2c2c2c;color:#f5f5f5;text-decoration:none;font-size:15px">Sign in</a>
        </p>
        ${fallback}
        <p style="margin:24px 0 0;font-size:13px;color:#797979">
          If you did not request this, you can ignore this email.
        </p>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    "Sign in to Design system 1",
    "",
    ...(usable ? [args.url, ""] : []),
    `This link expires in ${minutes} minutes and can be used once.`,
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  return { to: "", subject: "Sign in to Design system 1", html, text };
}
