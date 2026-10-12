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
 *   /signin       the shared sign-in screen: the email, then the code or the owner's password
 *   /libraries    dashboard
 *   /l/:id        editor
 *
 * `/playground` keeps the product's current front door working and gives people
 * something to try before creating an account.
 */
function Routes() {
  const { path } = useLocation();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const editor = useRoute("/l/:id");

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
    <ConvexAuthProvider client={convex}>
      <RouterProvider><AppShell>{children ?? <Routes />}</AppShell></RouterProvider>
    </ConvexAuthProvider>
  );
}
