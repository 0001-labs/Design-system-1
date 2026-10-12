import { useAuthActions } from "@convex-dev/auth/react";
import { useConvex } from "convex/react";
import { useEffect, useRef } from "react";

import { api } from "../../../convex/_generated/api";
import { navigate } from "../router";
import { signInAdapter } from "../signIn/adapter";
import { defineSignInScreen, type SignInScreen as SignInScreenElement } from "../signIn/sign-in";
import "../signIn/sign-in.css";

/**
 * The shared sign-in screen (app/src/signIn, copied from Sign-in): the email, then the code
 * sent to it or the owner's password, with Google and Apple when the backend has them.
 * Signed in, the app goes where the person was headed.
 */
export function SignIn({ redirectTo }: { redirectTo?: string } = {}) {
  const { signIn } = useAuthActions();
  const convex = useConvex();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!host.current) return;
    defineSignInScreen();
    const screen = document.createElement("sign-in-screen") as SignInScreenElement;
    screen.adapter = signInAdapter({
      signIn: (provider, params) => signIn(provider, params as Record<string, string>),
      providers: () => convex.query(api.auth.providers, {}),
      passwordSignIn: (email) => convex.query(api.auth.passwordSignIn, { email }),
      redirectTo: () => `${window.location.origin}${window.location.pathname}`,
    });
    screen.addEventListener("signed-in", () => {
      navigate(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/libraries", { replace: true });
    });
    host.current.replaceChildren(screen);
    return () => screen.remove();
  }, [signIn, convex, redirectTo]);

  return (
    <main className="auth-screen" data-ds-area="Sign in" data-testid="signin">
      <h1>Sign in to Design system 1</h1>
      <div ref={host} />
      <p>
        <a href="/app/playground">Try the workbench without an account</a>
      </p>
    </main>
  );
}
