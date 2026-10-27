/**
 * consistency.site's legal pages: the five documents the legacy Pages project served from
 * functions/api/routes/legal.ts, copied verbatim (they are legal text; do not reword them here).
 */

const PRIVACY_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Privacy Policy · Consistency</title>
    <meta name="robots" content="noindex" />
    <style>
      :root { --fg:#111; --muted:#666; --border:#e6e6e6; --link:#0b57d0; }
      * { box-sizing: border-box; }
      body {
        margin: 0; padding: 48px 18px;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: var(--fg);
        background: linear-gradient(180deg, #fafafa 0%, #fff 100%);
      }
      .wrap { max-width: 820px; margin: 0 auto; background:#fff; border:1px solid var(--border); border-radius:14px; padding:28px; }
      h1 { margin: 0 0 6px; font-size: 28px; letter-spacing: -0.6px; }
      .meta { margin: 0 0 18px; color: var(--muted); font-size: 13px; }
      h2 { margin: 20px 0 8px; font-size: 16px; letter-spacing: -0.2px; }
      p, li { line-height: 1.55; font-size: 14px; color:#1a1a1a; }
      a { color: var(--link); text-decoration: none; }
      a:hover { text-decoration: underline; }
      .muted { color: var(--muted); }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>Privacy Policy</h1>
      <p class="meta">Last updated: February 8, 2026</p>

      <p>This Privacy Policy explains how Consistency (the "Service") collects, uses, and shares information when you use Consistency.</p>

      <h2>Information We Collect</h2>
      <ul>
        <li><strong>Account information:</strong> email address used to sign in.</li>
        <li><strong>Content you create:</strong> site pages, blocks, and related settings you create or import.</li>
        <li><strong>Notion connection data (optional):</strong> if you connect Notion, we store an OAuth access token for your Notion workspace. We store this token encrypted at rest.</li>
        <li><strong>Usage and diagnostics:</strong> basic technical logs required to operate and secure the Service.</li>
      </ul>

      <h2>How We Use Information</h2>
      <ul>
        <li>To provide and operate the Service (builder, publishing, domains).</li>
        <li>To authenticate you and secure accounts.</li>
        <li>To import content from Notion when you request it (we only access pages you explicitly share with the Notion integration).</li>
        <li>To prevent abuse, enforce rate limits, and debug issues.</li>
      </ul>

      <h2>Notion Integration</h2>
      <p>If you choose to connect Notion, Consistency uses the Notion API to search for and import content from pages you have shared with the integration. We do not expose your Notion access token to the browser.</p>
      <p>Imported content becomes part of your Consistency site content (the blocks on your canvas) and is stored so we can render and publish your site.</p>

      <h2>Sharing and Service Providers</h2>
      <p>We may share information with service providers that help us run the Service (for example hosting, database, and payments). These providers process information on our behalf and subject to their terms.</p>

      <h2>Data Retention</h2>
      <p>We retain your account and site data for as long as your account is active. If you disconnect Notion, we delete your stored Notion connection token data.</p>

      <h2>Contact</h2>
      <p>Questions? Contact us at <a href="mailto:support@consistency.site">support@consistency.site</a>.</p>

      <p class="muted">This document is a general template and should be reviewed to ensure it matches your business and legal requirements.</p>
    </main>
  </body>
</html>`;

const TERMS_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Terms of Use · Consistency</title>
    <meta name="robots" content="noindex" />
    <style>
      :root { --fg:#111; --muted:#666; --border:#e6e6e6; --link:#0b57d0; }
      * { box-sizing: border-box; }
      body {
        margin: 0; padding: 48px 18px;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: var(--fg);
        background: linear-gradient(180deg, #fafafa 0%, #fff 100%);
      }
      .wrap { max-width: 820px; margin: 0 auto; background:#fff; border:1px solid var(--border); border-radius:14px; padding:28px; }
      h1 { margin: 0 0 6px; font-size: 28px; letter-spacing: -0.6px; }
      .meta { margin: 0 0 18px; color: var(--muted); font-size: 13px; }
      h2 { margin: 20px 0 8px; font-size: 16px; letter-spacing: -0.2px; }
      p, li { line-height: 1.55; font-size: 14px; color:#1a1a1a; }
      a { color: var(--link); text-decoration: none; }
      a:hover { text-decoration: underline; }
      .muted { color: var(--muted); }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>Terms of Use</h1>
      <p class="meta">Last updated: February 8, 2026</p>

      <p>These Terms of Use govern your access to and use of Consistency (the "Service"). By using the Service, you agree to these Terms.</p>

      <h2>Accounts</h2>
      <ul>
        <li>You are responsible for maintaining the security of your account.</li>
        <li>You may not use the Service for unlawful, harmful, or abusive purposes.</li>
      </ul>

      <h2>Your Content</h2>
      <ul>
        <li>You own the content you create or import into your Consistency sites.</li>
        <li>You grant us a limited license to host, process, and display your content solely to provide the Service (editing, rendering, publishing).</li>
      </ul>

      <h2>Notion Import</h2>
      <p>If you connect Notion, you authorize the Service to access Notion pages you explicitly share with the integration and to import that content into your Consistency sites at your direction.</p>

      <h2>Acceptable Use</h2>
      <ul>
        <li>No attempting to bypass rate limits or security controls.</li>
        <li>No uploading malware or content that infringes others’ rights.</li>
        <li>No interfering with other users’ access to the Service.</li>
      </ul>

      <h2>Disclaimer</h2>
      <p>The Service is provided "as is" and "as available" without warranties of any kind, to the maximum extent permitted by law.</p>

      <h2>Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.</p>

      <h2>Changes</h2>
      <p>We may update these Terms from time to time. Continued use of the Service after changes means you accept the updated Terms.</p>

      <h2>Contact</h2>
      <p>Questions? Contact us at <a href="mailto:support@consistency.site">support@consistency.site</a>.</p>

      <p class="muted">This document is a general template and should be reviewed to ensure it matches your business and legal requirements.</p>
    </main>
  </body>
</html>`;

const TOKUSHOHO_HTML = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>特定商取引法に基づく表記 · Consistency</title>
    <meta name="robots" content="noindex" />
    <style>
      :root { --fg:#111; --muted:#666; --border:#e6e6e6; --link:#0b57d0; }
      * { box-sizing: border-box; }
      body {
        margin: 0; padding: 48px 18px;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: var(--fg);
        background: linear-gradient(180deg, #fafafa 0%, #fff 100%);
      }
      .wrap { max-width: 820px; margin: 0 auto; background:#fff; border:1px solid var(--border); border-radius:14px; padding:28px; }
      h1 { margin: 0 0 6px; font-size: 28px; letter-spacing: -0.6px; }
      .meta { margin: 0 0 18px; color: var(--muted); font-size: 13px; }
      h2 { margin: 20px 0 8px; font-size: 16px; letter-spacing: -0.2px; }
      p, li { line-height: 1.55; font-size: 14px; color:#1a1a1a; }
      a { color: var(--link); text-decoration: none; }
      a:hover { text-decoration: underline; }
      .muted { color: var(--muted); }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>特定商取引法に基づく表記（通信販売に関する表示事項）</h1>
      <p class="meta">最終更新日: 2026年3月10日</p>

      <p class="muted">本ページは特定商取引法およびStripeの表示要件に基づく開示ページです。</p>

      <h2>事業者情報</h2>
      <ul>
        <li><strong>販売業者:</strong> 0001</li>
        <li><strong>代表者（運営統括責任者）:</strong> Joachim Aaløkke Sørensen</li>
        <li><strong>所在地:</strong> 請求があったら遅滞なく開示します</li>
        <li><strong>電話番号:</strong> 請求があったら遅滞なく開示します</li>
        <li><strong>サポート受付時間:</strong> 平日 10:00-17:00（JST、土日祝を除く）</li>
        <li><strong>メールアドレス:</strong> <!--email_off--><a href="mailto:support@consistency.site">support@consistency.site</a><!--/email_off--></li>
        <li><strong>URL:</strong> <a href="https://consistency.site">https://consistency.site</a></li>
      </ul>

      <h2>販売価格・販売数量</h2>
      <ul>
        <li><strong>Free:</strong> 無料</li>
        <li><strong>Plus:</strong> USD 15 / 月 から（選択した課金マーケットに応じた現地通貨価格を表示）</li>
        <li><strong>Business:</strong> USD 35 / 月 から（選択した課金マーケットに応じた現地通貨価格を表示）</li>
        <li><strong>現在のセルフサーブ決済対応通貨:</strong> USD, JPY, DKK</li>
        <li><strong>追加マーケット:</strong> 一部の追加マーケットはアプリ内に表示される場合がありますが、決済設定が完了するまで購入できません</li>
        <li><strong>販売数量:</strong> 1契約（1アカウント）単位</li>
        <li><strong>消費税:</strong> 税込価格・税額は決済時の最終確認画面に表示されます</li>
      </ul>

      <h2>商品代金以外の必要料金</h2>
      <ul>
        <li>追加手数料はありません。</li>
        <li>インターネット接続料金・通信料金はお客様のご負担となります。</li>
      </ul>

      <h2>支払方法・支払時期</h2>
      <ul>
        <li><strong>支払方法:</strong> Stripeを利用したクレジットカード決済</li>
        <li><strong>支払時期:</strong> 申込時に初回課金。以後、月額で自動更新・自動課金</li>
      </ul>

      <h2>サービス提供時期</h2>
      <p>サブスクリプションの有効化後、直ちに利用できます。</p>

      <h2>契約期間・更新</h2>
      <p>月額契約です。解約されるまで1か月ごとに自動更新されます。</p>

      <h2>返品・交換・キャンセル</h2>
      <ul>
        <li><strong>お客様都合の解約:</strong> いつでも解約できますが、請求期間途中の解約による日割り返金は行いません。</li>
        <li><strong>不具合時の対応:</strong> 当社起因の重大な不具合で利用不能となった場合は、内容を確認のうえ返金またはサービスクレジット付与で対応します。まずは <!--email_off--><a href="mailto:support@consistency.site">support@consistency.site</a><!--/email_off--> までご連絡ください。</li>
      </ul>

      <h2>申込有効期限</h2>
      <p>特別な定めがある場合を除き、申込期限はありません。期間限定キャンペーンは各ページに表示します。</p>

      <h2>動作環境</h2>
      <p>最新版の主要ブラウザ（Chrome、Safari、Firefox、Edge）に対応しています。</p>

      <h2>English Translation</h2>
      <p class="meta">For reference only. The Japanese text controls in case of conflict.</p>

      <h2>Business Information</h2>
      <ul>
        <li><strong>Seller (Legal Name):</strong> 0001</li>
        <li><strong>Head of Operations:</strong> Joachim Aaløkke Sørensen</li>
        <li><strong>Address:</strong> Will be disclosed without delay upon request.</li>
        <li><strong>Phone Number:</strong> Will be disclosed without delay upon request.</li>
        <li><strong>Support Hours:</strong> Weekdays 10:00-17:00 JST (excluding weekends and holidays)</li>
        <li><strong>Email:</strong> <!--email_off--><a href="mailto:support@consistency.site">support@consistency.site</a><!--/email_off--></li>
        <li><strong>URL:</strong> <a href="https://consistency.site">https://consistency.site</a></li>
      </ul>

      <h2>Pricing and Quantity</h2>
      <ul>
        <li><strong>Free:</strong> Free</li>
        <li><strong>Plus:</strong> From USD 15 / month, or local market equivalent shown in-product</li>
        <li><strong>Business:</strong> From USD 35 / month, or local market equivalent shown in-product</li>
        <li><strong>Self-serve checkout currencies currently enabled:</strong> USD, JPY, DKK</li>
        <li><strong>Additional billing markets:</strong> Some extra markets may appear in-product before checkout is enabled for purchase</li>
        <li><strong>Quantity:</strong> 1 subscription (1 account) per contract</li>
        <li><strong>Tax:</strong> Tax-inclusive amount and tax details are shown on the final checkout page</li>
      </ul>

      <h2>Additional Fees</h2>
      <ul>
        <li>No additional service fees.</li>
        <li>Internet access and telecom charges are borne by the customer.</li>
      </ul>

      <h2>Payment Method and Timing</h2>
      <ul>
        <li><strong>Payment method:</strong> Credit card via Stripe</li>
        <li><strong>Payment timing:</strong> First charge at subscription start, then billed monthly with auto-renewal</li>
      </ul>

      <h2>Service Delivery Timing</h2>
      <p>Service is provided immediately after subscription activation.</p>

      <h2>Contract Term and Renewal</h2>
      <p>Monthly contract, automatically renewed every month until canceled.</p>

      <h2>Returns, Exchanges, and Cancellations</h2>
      <ul>
        <li><strong>Customer-initiated cancellation:</strong> You may cancel anytime. No prorated refunds for partial billing periods.</li>
        <li><strong>Defects or service issues:</strong> If a material issue caused by us prevents normal use, we review the case and provide a refund or service credit as appropriate. Please contact <!--email_off--><a href="mailto:support@consistency.site">support@consistency.site</a><!--/email_off--> first.</li>
      </ul>

      <h2>Offer Period</h2>
      <p>No application deadline unless specifically stated. Time-limited offers are shown on each relevant page.</p>

      <h2>System Requirements</h2>
      <p>Latest versions of major browsers: Chrome, Safari, Firefox, and Edge.</p>
    </main>
  </body>
</html>`;

const COOKIES_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cookie Policy · Consistency</title>
    <meta name="robots" content="noindex" />
    <style>
      :root { --fg:#111; --muted:#666; --border:#e6e6e6; --link:#0b57d0; }
      * { box-sizing: border-box; }
      body {
        margin: 0; padding: 48px 18px;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: var(--fg);
        background: linear-gradient(180deg, #fafafa 0%, #fff 100%);
      }
      .wrap { max-width: 820px; margin: 0 auto; background:#fff; border:1px solid var(--border); border-radius:14px; padding:28px; }
      h1 { margin: 0 0 6px; font-size: 28px; letter-spacing: -0.6px; }
      .meta { margin: 0 0 18px; color: var(--muted); font-size: 13px; }
      h2 { margin: 20px 0 8px; font-size: 16px; letter-spacing: -0.2px; }
      p, li { line-height: 1.55; font-size: 14px; color:#1a1a1a; }
      a { color: var(--link); text-decoration: none; }
      a:hover { text-decoration: underline; }
      .muted { color: var(--muted); }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>Cookie Policy</h1>
      <p class="meta">Last updated: May 17, 2026</p>

      <p>This Cookie Policy explains how Consistency uses cookies and similar browser storage.</p>

      <h2>Necessary cookies</h2>
      <p>Necessary cookies support sign-in, security, edit sessions, password-gated published pages, billing state, and user preferences. The Service cannot operate correctly without them.</p>

      <h2>Optional cookies</h2>
      <p>Analytics and marketing cookies are optional. They remain disabled unless you consent through the in-app cookie banner.</p>

      <h2>Managing choices</h2>
      <p>You can accept all optional cookies, keep only necessary cookies, or customize analytics and marketing choices. Your selection is stored in your browser and can be reset by clearing site data.</p>

      <h2>Contact</h2>
      <p>Questions? Contact us at <a href="mailto:support@consistency.site">support@consistency.site</a>.</p>

      <p class="muted">This document is a general template and should be reviewed to ensure it matches your business and legal requirements.</p>
    </main>
  </body>
</html>`;

const ACCEPTABLE_USE_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Acceptable Use Policy · Consistency</title>
    <meta name="robots" content="noindex" />
    <style>
      :root { --fg:#111; --muted:#666; --border:#e6e6e6; --link:#0b57d0; }
      * { box-sizing: border-box; }
      body {
        margin: 0; padding: 48px 18px;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: var(--fg);
        background: linear-gradient(180deg, #fafafa 0%, #fff 100%);
      }
      .wrap { max-width: 820px; margin: 0 auto; background:#fff; border:1px solid var(--border); border-radius:14px; padding:28px; }
      h1 { margin: 0 0 6px; font-size: 28px; letter-spacing: -0.6px; }
      .meta { margin: 0 0 18px; color: var(--muted); font-size: 13px; }
      h2 { margin: 20px 0 8px; font-size: 16px; letter-spacing: -0.2px; }
      p, li { line-height: 1.55; font-size: 14px; color:#1a1a1a; }
      a { color: var(--link); text-decoration: none; }
      a:hover { text-decoration: underline; }
      .muted { color: var(--muted); }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>Acceptable Use Policy</h1>
      <p class="meta">Last updated: May 17, 2026</p>

      <p>This Acceptable Use Policy applies to sites, pages, files, forms, and other content created, imported, hosted, or published through Consistency.</p>

      <h2>Prohibited content and conduct</h2>
      <ul>
        <li>No unlawful, abusive, deceptive, or harmful activity.</li>
        <li>No malware, credential theft, phishing, spam, or attempts to bypass security controls.</li>
        <li>No content that infringes intellectual property or privacy rights.</li>
        <li>No harassment, threats, or content that promotes violence or exploitation.</li>
        <li>No use that disrupts the Service or other users' sites.</li>
      </ul>

      <h2>Published sites</h2>
      <p>You are responsible for the content you publish on c9y.site subdomains, consistency.site pages, and custom domains connected to the Service.</p>

      <h2>Enforcement</h2>
      <p>We may remove content, restrict publishing, suspend accounts, or take other protective action when we believe this policy has been violated.</p>

      <h2>Contact</h2>
      <p>Report abuse or policy questions to <a href="mailto:support@consistency.site">support@consistency.site</a>.</p>

      <p class="muted">This document is a general template and should be reviewed to ensure it matches your business and legal requirements.</p>
    </main>
  </body>
</html>`;

const LEGAL_PAGES: Record<string, string> = {
  '/privacy': PRIVACY_HTML,
  '/terms': TERMS_HTML,
  '/cookies': COOKIES_HTML,
  '/acceptable-use': ACCEPTABLE_USE_HTML,
  '/tokushoho': TOKUSHOHO_HTML,
};

export const LEGAL_PATHS = Object.keys(LEGAL_PAGES);
export const isLegalPath = (path: string) => Object.hasOwn(LEGAL_PAGES, path);

/** A legal page's answer: the document for GET and HEAD, 405 for every other method, as the legacy routes answered. */
export function legalPage(request: Request): Response {
  const html = LEGAL_PAGES[new URL(request.url).pathname];
  if (html === undefined) return new Response(null, { status: 404 });
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  return new Response(request.method === 'HEAD' ? null : html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
