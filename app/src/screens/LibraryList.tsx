import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { api } from "../../../convex/_generated/api";
import semanticCssTemplate from "../../../DS1/1-root/one.semantic.css?raw";
import { failureCode } from "../lib/convex";
import { Link, navigate } from "../router";

/** Human labels for the states convex/lib/libraryState.ts derives. */
const STATE_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  "unpublished-changes": "Unpublished changes",
  "failed-validation": "Last publish failed",
  publishing: "Publishing…",
  archived: "Archived",
};

/**
 * The template version is stamped per library so a later DS1 upgrade cannot
 * silently change what "new library" means, and so a bad template can be traced
 * to the libraries created from it.
 */
function templateVersion(): string {
  const stamped = /\/\* DS1 — version ([^*]+?) \*\//.exec(semanticCssTemplate);
  return stamped?.[1]?.trim() ?? "unknown";
}

export function LibraryList() {
  const libraries = useQuery(api.libraries.list);
  const create = useMutation(api.libraries.create);
  const { signOut } = useAuthActions();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate() {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const created = await create({
        name: "Untitled library",
        css: semanticCssTemplate,
        config: JSON.stringify({ schema: 1 }),
        templateVersion: templateVersion(),
      });
      navigate(`/l/${created._id}`);
    } catch (caught) {
      const code = failureCode(caught);
      setError(
        code === "quota_exceeded"
          ? "You have reached the library limit. Archive one to make room."
          : "Could not create the library.",
      );
      setBusy(false);
    }
  }

  if (libraries === undefined) {
    return (
      <main className="dashboard" data-ds-area="Libraries" data-testid="library-list-loading">
        <p>Loading your libraries…</p>
      </main>
    );
  }

  return (
    <main className="dashboard" data-ds-area="Libraries" data-testid="library-list">
      <header className="workbench-header" data-ds-area="Library actions">
        <h1>Your libraries</h1>
        <div className="workbench-header-actions">
          <button
            className="action-button action-button--primary"
            data-testid="create-library"
            disabled={busy}
            onClick={onCreate}
            type="button"
          >
            {busy ? "Creating…" : "New library"}
          </button>
          <button className="action-button" onClick={() => void signOut()} type="button">
            Sign out
          </button>
        </div>
      </header>

      {error ? <p role="alert">{error}</p> : null}

      {libraries.length === 0 ? (
        <section data-testid="library-list-empty">
          <h2>Nothing here yet</h2>
          <p>
            A library is a copy of the DS1 semantic stylesheet that you customize and publish. Your
            site then loads it from one link.
          </p>
        </section>
      ) : (
        <ul className="library-grid">
          {libraries.map((library) => (
            <li key={library._id}>
              <article className="library-card" data-ds-area="Library" data-testid="library-card">
                <h2>
                  <Link to={`/l/${library._id}`}>{library.name}</Link>
                </h2>

                <p className="library-card__state" data-testid="state-pill" data-state={library.state}>
                  {STATE_LABEL[library.state] ?? library.state}
                  {library.publishedVersion === null ? null : ` · v${library.publishedVersion}`}
                </p>

                <dl>
                  <dt>Edited</dt>
                  <dd>{new Date(library.draftUpdatedAt).toLocaleString()}</dd>
                  <dt>Size</dt>
                  <dd>{(library.draftBytes / 1024).toFixed(1)} KB</dd>
                </dl>
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
