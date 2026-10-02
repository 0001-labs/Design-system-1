// Named export, not default — @convex-dev/auth 0.0.94 ships only
// `export function Email`. The provider's own docstring still shows a default
// import, and following it produces an opaque esbuild "No matching export".
import { Email } from "@convex-dev/auth/providers/Email";
import {
  convexAuth,
  type EmailConfig,
  type GenericActionCtxWithAuthConfig,
} from "@convex-dev/auth/server";

import { internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import type { DatabaseWriter } from "./_generated/server";
import { renderMagicLinkEmail, resendApiKey, sendEmail } from "./lib/mail";
import { generateMagicLinkToken, normalizeEmail } from "./lib/token";

const TOKEN_TTL_MINUTES = 15;

/**
 * Magic-link sign-in.
 *
 * How the flow actually works in @convex-dev/auth 0.0.94, which is worth
 * spelling out because it is not what you would guess:
 *
 *   1. `signIn("magic-link", { email })` mints a token and calls
 *      `sendVerificationRequest` below.
 *   2. `url` is built from **SITE_URL**, not CONVEX_SITE_URL — see
 *      `implementation/redirects.ts`. The link therefore points at our own app,
 *      carrying `?code=<token>`.
 *   3. The SPA reads that `code` and calls `signIn("magic-link", { code })`.
 *
 * The consequence: **a bare GET of the link consumes nothing.** Verification is
 * an explicit client-side call, so mail scanners and link prefetchers — which
 * do not run our JavaScript — cannot burn the token. The remaining exposure is
 * a scanner that does execute JavaScript, which is why the SPA callback screen
 * requires a click rather than verifying on mount.
 */
interface VerificationRequest {
  identifier: string;
  url: string;
  token: string;
  expires: Date;
}

/**
 * The runtime calls this with `(params, ctx)`, but the published `EmailConfig`
 * type declares a single-argument signature inherited from Auth.js. The library
 * has the same problem internally and carries a `@ts-expect-error` at its own
 * call site (`implementation/signIn.ts`, "Figure out typing for email providers
 * so they can access ctx").
 *
 * So: type both arguments honestly here, and cast once where it is handed to
 * the provider. That keeps the body fully typechecked instead of degrading the
 * whole function to `any`, which is what happens if you let inference fail.
 */
async function sendVerificationRequest(
  { identifier, url, expires }: VerificationRequest,
  ctx: GenericActionCtxWithAuthConfig<DataModel>,
): Promise<void> {
  const email = normalizeEmail(identifier);
  const message = {
    ...renderMagicLinkEmail({ url, expiresMinutes: TOKEN_TTL_MINUTES }),
    to: email,
  };

  // Dev deployments capture the link so the end-to-end test can sign in without
  // a mail server. Opt-in by env var rather than inferred: guessing "am I
  // production?" wrong on this path hands out sessions.
  if (process.env.DEV_LOGIN_LINKS === "1") {
    await ctx.runMutation(internal.devLinks.record, {
      email,
      url,
      expiresAt: expires.getTime(),
    });

    if (!resendApiKey()) {
      console.log(`[auth] magic link for ${email}: ${url}`);
      return;
    }
  }

  await sendEmail(message);
}

const MagicLink = Email({
  id: "magic-link",
  maxAge: TOKEN_TTL_MINUTES * 60,

  // See lib/token.ts: with `authorize` disabled the token is the sole
  // credential, so it must come from a CSPRNG.
  generateVerificationToken: async () => generateMagicLinkToken(),

  // This is what makes it a magic link. The default `authorize` requires the
  // caller to re-supply the email that started the flow; a link click cannot.
  authorize: undefined,

  // The single cast, explained above the function.
  sendVerificationRequest:
    sendVerificationRequest as unknown as EmailConfig["sendVerificationRequest"],
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [MagicLink],

  callbacks: {
    /**
     * Collapse case-variant addresses onto a single user.
     *
     * Convex Auth keys `authAccounts.providerAccountId` on the email string
     * exactly as typed, and normalizes nothing. `normalizeIdentifier` exists in
     * the type declarations but is never referenced by the implementation, so
     * it is not a hook you can use. Verified by running it: signing in as
     * `Tester@Example.COM` and then `tester@example.com` produced two separate
     * rows in `users`, which for this product means two disjoint sets of
     * libraries for one person.
     *
     * The account rows still differ — that is Convex Auth's business — but both
     * now resolve to the same `users` document, which is what `libraries.ownerId`
     * references and therefore what ownership actually means here.
     */
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) return args.existingUserId;

      // The callback hands us a ctx typed against AnyDataModel, so ctx.db knows
      // nothing about our indexes. The runtime database is ours.
      const db = ctx.db as unknown as DatabaseWriter;

      const rawEmail = typeof args.profile.email === "string" ? args.profile.email : undefined;
      if (!rawEmail) return db.insert("users", {});

      const email = normalizeEmail(rawEmail);

      const existing = await db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .first();
      if (existing) return existing._id;

      // Store the normalized form, so the `email` index is the canonical
      // lookup and a later case variant finds this row.
      return db.insert("users", {
        email,
        emailVerificationTime:
          args.type === "verification" || args.type === "email" ? Date.now() : undefined,
      });
    },
  },
});
