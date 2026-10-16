import { useAuthActions } from "@convex-dev/auth/react";
import { useConvex } from "convex/react";
import { useEffect, useRef } from "react";

import { api } from "../../../convex/_generated/api";
import { Link, navigate } from "../router";
import { signInAdapter } from "../signIn/adapter";
import { defineSignInScreen, type SignInScreen as SignInScreenElement } from "../signIn/sign-in";
import "../signIn/sign-in.css";

/**
 * The shared sign-in screen (app/src/signIn, copied from Sign-in): the email, then the code
 * sent to it or the owner's password, with Google and Apple when the backend has them.
 * Signed in, the app goes where the person was headed.
 */
export function SignIn({ redirectTo, fontsOnly = false, dashboardOnly = false, privateTitle }: { redirectTo?: string; fontsOnly?: boolean; dashboardOnly?: boolean; privateTitle?: string } = {}) {
  // A private host takes the owner's email alone, without Google or Apple.
  const ownerOnly = fontsOnly || dashboardOnly || Boolean(privateTitle);
  const { signIn } = useAuthActions();
  const convex = useConvex();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!host.current) return;
    defineSignInScreen();
    const screen = document.createElement("sign-in-screen") as SignInScreenElement;
    screen.adapter = signInAdapter({
      signIn: (provider, params) => {
        if (ownerOnly && (typeof params.email !== "string" || params.email.trim().toLowerCase() !== "jaa90@icloud.com")) throw new Error(privateTitle ? `${privateTitle} is private.` : dashboardOnly ? "This dashboard is private." : "This font workspace is private.");
        return signIn(provider, params as Record<string, string>);
      },
      providers: async () => {
        const available = await convex.query(api.auth.providers, {});
        return ownerOnly ? { ...available, google: false, apple: false } : available;
      },
      passwordSignIn: (email) => convex.query(api.auth.passwordSignIn, { email }),
      redirectTo: () => `${window.location.origin}${window.location.pathname}`,
    });
    screen.addEventListener("signed-in", () => {
      navigate(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/libraries", { replace: true });
    });
    host.current.replaceChildren(screen);
    return () => screen.remove();
  }, [signIn, convex, redirectTo, ownerOnly, privateTitle, dashboardOnly]);

  return (
    <main className="auth-screen" data-ds-area="Sign in" data-testid="signin">
      <h1>{privateTitle ?? (fontsOnly ? "Fonts" : dashboardOnly ? "Component adoption" : "Sign in to Design system 1")}</h1>
      <p className="auth-intro">{privateTitle ? `Sign in to your private ${privateTitle.toLowerCase()}.` : fontsOnly ? "Sign in to your private font workspace." : redirectTo === "/reports/components"
        ? "Sign in with an authorised account to view component reports."
        : "Save, edit and publish your design libraries."}</p>
      <div ref={host} />
      {!ownerOnly && <div className="auth-alternative">
        <p>Just exploring? No account needed.</p>
        <Link to="/playground">Try the editor</Link>
      </div>}
    </main>
  );
}
