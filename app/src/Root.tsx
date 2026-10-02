import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import type { ReactNode } from "react";

import { App } from "./App";
import { AppShell } from "./AppShell";
import { convex } from "./lib/convex";
import { navigate, RouterProvider, useLocation, useRoute } from "./router";
import { LibraryEditor } from "./screens/LibraryEditor";
import { LibraryList } from "./screens/LibraryList";
import { SignIn } from "./screens/SignIn";

/**
 * Route table.
 *
 *   /playground   today's workbench, no account, no persistence
 *   /signin       magic-link request, and the ?code= callback
 *   /libraries    dashboard
 *   /l/:id        editor
 *
 * `/playground` keeps the product's current front door working and gives people
 * something to try before creating an account.
 */
function Routes() {
  const { path, search } = useLocation();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const editor = useRoute("/l/:id");

  // The magic-link callback lands on whatever SITE_URL points at, carrying
  // ?code=. Route it to SignIn wherever it lands rather than assuming a path.
  if (search.has("code")) return <SignIn />;

  if (path === "/" || path === "/playground") return <App />;

  if (isLoading) return <Splash />;

  if (!isAuthenticated) {
    if (path !== "/signin") {
      // Remember where they were headed so sign-in can return them there.
      return <SignIn redirectTo={path === "/" ? "/libraries" : path} />;
    }
    return <SignIn />;
  }

  if (path === "/signin") {
    navigate("/libraries", { replace: true });
    return <Splash />;
  }

  if (path === "/libraries") return <LibraryList />;
  if (editor) return <LibraryEditor libraryId={editor.id} />;

  return <NotFound />;
}

function Splash() {
  return (
    <div className="route-splash" data-testid="route-splash">
      <p>Loading…</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="route-splash">
      <p>That page does not exist.</p>
      <button onClick={() => navigate("/libraries")} type="button">
        Go to your libraries
      </button>
    </div>
  );
}

export function Root({ children }: { children?: ReactNode }) {
  return (
    <ConvexAuthProvider
      client={convex}
      /**
       * Do not let the provider spend the magic-link token on mount.
       *
       * By default ConvexAuthProvider reads `?code=` straight out of the URL,
       * strips it, and verifies it as a side effect of the page loading. That
       * defeats the whole point of the callback screen: anything that merely
       * *renders* the link — a security product that executes JavaScript, an
       * over-eager preview generator — burns the token before the human clicks,
       * and they arrive to "already used".
       *
       * With this off, `screens/SignIn.tsx` verifies on an explicit click and
       * strips the query itself.
       */
      shouldHandleCode={false}
    >
      <RouterProvider><AppShell>{children ?? <Routes />}</AppShell></RouterProvider>
    </ConvexAuthProvider>
  );
}
