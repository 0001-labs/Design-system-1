import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { api } from "../../../convex/_generated/api";
import "../../../DS1/2-core/ds-badge";
import "../../../DS1/2-core/ds-button";
import "../../../DS1/2-core/ds-empty";
import "../../../DS1/2-core/ds-notice";
import "../../../DS1/3-unit/ds-list";
import "../../../DS1/3-unit/ds-row";
import { Badge } from "../../../DS1/react/badge";
import { Button } from "../../../DS1/react/button";
import { LoadingIndicator } from "../../../DS1/react/loading";
import { Empty } from "../../../DS1/react/empty";
import { Notice } from "../../../DS1/react/notice";
import { libraryTemplate } from "../SystemWorkbench";
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
  const stamped = /\/\* DS1 — version ([^*]+?) \*\//.exec(libraryTemplate);
  return stamped?.[1]?.trim() ?? "components-1";
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
        css: libraryTemplate,
        config: JSON.stringify({ schema: 2 }),
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
        <LoadingIndicator label="Loading your libraries" />
      </main>
    );
  }

  return (
    <main className="dashboard" data-ds-area="Libraries" data-testid="library-list">
      <header className="workbench-header" data-ds-area="Library actions">
        <h1>Your libraries</h1>
        <div className="workbench-header-actions">
          <Button
            primary
            data-testid="create-library"
            disabled={busy}
            onClick={onCreate}
            type="button"
          >
            {busy ? "Creating…" : "New library"}
          </Button>
          <Button secondary onClick={() => void signOut()} type="button">
            Sign out
          </Button>
        </div>
      </header>

      {error ? <Notice tone="danger">{error}</Notice> : null}

      {libraries.length === 0 ? (
        <Empty data-testid="library-list-empty" icon="templates" level={2}>
          A library is a copy of the DS1 semantic stylesheet that you customize and publish. Your
          site then loads it from one link.
        </Empty>
      ) : (
        <ds-list role="list" className="library-grid">
          {libraries.map((library) => (
            <ds-row auto role="listitem" key={library._id}>
              <article className="library-card" data-ds-area="Library" data-testid="library-card">
                <h2>
                  <Link to={`/l/${library._id}`}>{library.name}</Link>
                </h2>

                <Badge className="library-card__state" data-testid="state-pill" data-state={library.state}>
                  {STATE_LABEL[library.state] ?? library.state}
                  {library.publishedVersion === null ? null : ` · v${library.publishedVersion}`}
                </Badge>

                <dl>
                  <dt>Edited</dt>
                  <dd>{new Date(library.draftUpdatedAt).toLocaleString()}</dd>
                  <dt>Size</dt>
                  <dd>{(library.draftBytes / 1024).toFixed(1)} KB</dd>
                </dl>
              </article>
            </ds-row>
          ))}
        </ds-list>
      )}
    </main>
  );
}
