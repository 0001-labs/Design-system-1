import { convexAuth } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { resendApiKey, sendEmail } from "./lib/mail";
import { normalizeEmail } from "./lib/token";
import { signInProviders } from "./signIn/providers";
import { signInFunctions } from "./signIn/functions";
import { signInRedirect } from "./signIn/redirect";
import { resolveSignInUser } from "./signIn/users";
import { signInCodeEmail } from "./signIn/emails";
import { rememberAppleTokenFromProfile } from "./signIn/appleTokens";

const PRODUCT = "Design system 1";
/** The other names its sign-in goes by: Consistency's app at consistency.site and c9y.site signs people in here. */
const BRANDS = { consistency: "Consistency" };

/**
 * Sign-in is the shared piece in convex/signIn (copied from /Users/joachim/0001/Sign-in
 * by `vp run sync-sign-in`): the emailed code, Google and Apple, and a password for the
 * addresses in SIGN_IN_PASSWORD_EMAILS. The code replaced the magic link: nothing a mail
 * scanner opens can spend it, since the code is typed into the screen that asked for it.
 *
 * The mail goes through lib/mail (escaped, from MAIL_FROM). Dev deployments with
 * DEV_LOGIN_LINKS=1 keep the latest code per address for the end-to-end test
 * (convex/devLinks.ts, the `url` column carrying the code), and send nothing when
 * no Resend key is set.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: signInProviders({
    product: PRODUCT,
    brands: BRANDS,
    password: true,
    // The code goes out under the name the screen asked for (Consistency's), from that name, else Design system 1's.
    async sendCode(ctx, { email, code, product }) {
      const address = normalizeEmail(email);
      if (process.env.DEV_LOGIN_LINKS === "1") {
        await ctx.runMutation(internal.devLinks.record, {
          email: address,
          url: code,
          expiresAt: Date.now() + 10 * 60_000,
        });
        if (!resendApiKey()) {
          console.log(`[auth] sign-in code for ${address}: ${code}`);
          return;
        }
      }
      await sendEmail({ to: address, ...signInCodeEmail({ product, code }) }, product);
    },
  }),
  callbacks: {
    // A returning account's user, else the user with the address when the way in proves
    // it, else a new one; addresses are normalized, so one person is one user.
    createOrUpdateUser: (ctx, args) =>
      resolveSignInUser(ctx as unknown as MutationCtx, args, {
        findByEmail: async (ctx, email) =>
          (
            await ctx.db
              .query("users")
              .withIndex("email", (q) => q.eq("email", email))
              .first()
          )?._id ?? null,
        create: (ctx, user) => ctx.db.insert("users", user),
      }),
    async afterUserCreatedOrUpdated(ctx, { userId, ...args }) {
      await rememberAppleTokenFromProfile(ctx as unknown as MutationCtx, userId, args);
    },
    // Google and Apple may only come back to the app itself.
    async redirect({ redirectTo }) {
      const origins = [
        process.env.SITE_URL ?? "",
        ...(process.env.AUTH_WEB_ORIGINS ?? "").split(","),
      ]
        .map((origin) => origin.trim())
        .filter(Boolean);
      return signInRedirect(redirectTo, { origins, paths: /^\/app(?:\/[^?#]*)?$/ });
    },
  },
});

export const { providers, passwordSignIn, remindAppleSecret } = signInFunctions({
  product: PRODUCT,
  owner: process.env.SIGN_IN_OWNER_EMAIL,
  // The code goes through lib/mail, or into the dev capture: ready when either can take it.
  codeReady: () => process.env.DEV_LOGIN_LINKS === "1" || Boolean(resendApiKey()),
});
