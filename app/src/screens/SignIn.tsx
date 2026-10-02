import { useAuthActions } from "@convex-dev/auth/react";
import { useState, type FormEvent } from "react";

import { navigate, replaceSearch, useLocation } from "../router";

type Stage = "form" | "sent" | "error";

export function SignIn({ redirectTo }: { redirectTo?: string } = {}) {
  const { search } = useLocation();
  const code = search.get("code");

  return code ? (
    <Callback code={code} next={search.get("next") ?? "/libraries"} />
  ) : (
    <RequestLink redirectTo={redirectTo} />
  );
}

/**
 * In development the deployment captures the magic link (DEV_LOGIN_LINKS=1),
 * so the sign-in screen can show it directly instead of requiring a mail
 * provider. Stripped from production builds by the import.meta.env.DEV guard,
 * and the endpoint 404s on any deployment without the flag anyway.
 */
async function fetchDevLink(email: string): Promise<string | null> {
  if (!import.meta.env.DEV) return null;

  const site = import.meta.env.VITE_CONVEX_SITE_URL as string | undefined;
  if (!site) return null;

  try {
    const response = await fetch(`${site}/auth/_dev/last-link?email=${encodeURIComponent(email)}`);
    if (!response.ok) return null;
    const { url } = (await response.json()) as { url: string };
    return url;
  } catch {
    return null;
  }
}

function RequestLink({ redirectTo }: { redirectTo?: string }) {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [devLink, setDevLink] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    try {
      // Convex Auth builds the link as SITE_URL + redirectTo + "?code=...", so
      // redirectTo must name a route that actually serves the app.
      //
      // It cannot be left to default to SITE_URL alone: with Vite's base of
      // "/app/", a bare "/app?code=..." is a 404 — the dev server only serves
      // "/app/", and the redirect that would add the slash drops the query.
      // Pointing straight at /app/signin sidesteps that entirely.
      const next = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : "";

      await signIn("magic-link", {
        email: email.trim(),
        redirectTo: `/app/signin${next}`,
      });
      setDevLink(await fetchDevLink(email.trim()));
      setStage("sent");
    } catch (error) {
      setStage("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "sent") {
    return (
      <main className="auth-screen" data-ds-area="Sign in" data-testid="signin-sent">
        <h1>Check your email</h1>
        <p>
          If an account can be created for <strong>{email.trim()}</strong>, a sign-in link is on
          its way. It expires in 15 minutes and works once.
        </p>

        {devLink ? (
          <p data-testid="dev-magic-link">
            <strong>Development only.</strong> No mail provider is configured, so here is the link:{" "}
            <a href={devLink}>Open sign-in link</a>
          </p>
        ) : null}

        <button onClick={() => setStage("form")} type="button" className="action-button">
          Use a different address
        </button>
      </main>
    );
  }

  return (
    <main className="auth-screen" data-ds-area="Sign in" data-testid="signin">
      <h1>Sign in to Design system 1</h1>
      <p>We email you a link. No password to remember.</p>

      <form onSubmit={onSubmit}>
        <label htmlFor="signin-email">Email</label>
        <input
          autoComplete="email"
          autoFocus
          data-testid="signin-email"
          id="signin-email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
        <button
          className="action-button action-button--primary"
          data-testid="signin-submit"
          disabled={busy || email.trim() === ""}
          type="submit"
        >
          {busy ? "Sending…" : "Email me a link"}
        </button>
      </form>

      {stage === "error" ? <p role="alert">{message}</p> : null}

      <p>
        <a href="/app/playground">Try the workbench without an account</a>
      </p>
    </main>
  );
}

/**
 * The magic-link callback.
 *
 * Verification happens on an explicit click, never on mount.
 *
 * A plain GET of the link already consumes nothing — Convex Auth points the
 * link at SITE_URL and the token is only spent by this client-side call — so
 * ordinary mail scanners and prefetchers cannot burn it. The button closes the
 * remaining gap: a security product that renders pages *and executes their
 * JavaScript* would otherwise consume the token before the human ever clicks,
 * and they would arrive to a dead link.
 */
function Callback({ code, next }: { code: string; next: string }) {
  const { signIn } = useAuthActions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      await signIn("magic-link", { code });
      // Drop ?code= so a reload or a shared URL cannot replay a spent token.
      replaceSearch("");
      // `next` came off our own URL, and navigate() always prefixes the app
      // base, so it cannot be turned into an off-site redirect.
      navigate(next.startsWith("/") ? next : "/libraries", { replace: true });
    } catch {
      setError("That link has expired or was already used. Request a new one.");
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen" data-ds-area="Sign in" data-testid="signin-callback">
      <h1>Sign in to Design system 1</h1>

      {error ? (
        <>
          <p role="alert">{error}</p>
          <button
            className="action-button action-button--primary"
            onClick={() => {
              replaceSearch("");
              navigate("/signin", { replace: true });
            }}
            type="button"
          >
            Request a new link
          </button>
        </>
      ) : (
        <>
          <p>You opened a sign-in link. Continue to finish signing in.</p>
          <button
            className="action-button action-button--primary"
            data-testid="signin-continue"
            disabled={busy}
            onClick={verify}
            type="button"
          >
            {busy ? "Signing in…" : "Continue"}
          </button>
        </>
      )}
    </main>
  );
}
