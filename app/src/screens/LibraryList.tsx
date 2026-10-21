import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { api } from "../../../convex/_generated/api";
import "../../../DS1/2-core/ds-badge";
import "../../../DS1/2-core/ds-button";
import "../../../DS1/2-core/ds-empty";
import "../../../DS1/2-core/ds-notice";
import "../../../DS1/3-unit/ds-list";
import "../../../DS1/3-unit/ds-row";
import { formatDateTime } from "../../../DS1/0-face/format";
import "../../../DS1/2-core/ds-input";
import { Button } from "../../../DS1/react/button";
import { LoadingIndicator } from "../../../packages/app/src/react/loading";
import { Empty } from "../../../DS1/react/empty";
import { Notice } from "../../../DS1/react/notice";
import { libraryTemplate, templateVersion } from "../lib/libraryTemplate";
import { failureCode } from "../lib/convex";
import { LibraryPreview } from "./LibraryPreview";
import "../../../DS1/1-root/card.css";
import "./library-cards.css";
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

export function LibraryList() {
  const libraries = useQuery(api.libraries.list);
  const create = useMutation(api.libraries.create);

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

        </div>
      </header>



      {error ? <Notice tone="danger">{error}</Notice> : null}

      <div role="list" className="library-grid library-preview-grid">
        <div role="listitem">
          <a className="ds-card library-preview-card" href="/"
            target={document.documentElement.hasAttribute("data-docs-embed") ? "_top" : undefined}>
            <span className="ds-card__label">Built-in</span>
            <h2 className="ds-card__title">Design system 1</h2>
            <LibraryPreview />
            <span className="library-preview-card__foot">The foundation · Components, colours and type</span>
          </a>
        </div>
        {libraries.map(library => <div role="listitem" key={library._id}>
          <Link to={`/l/${library._id}`} className="ds-card library-preview-card" data-testid="library-card">
            <span className="ds-card__label" data-testid="state-pill" data-state={library.state}>
              {STATE_LABEL[library.state] ?? library.state}{library.publishedVersion === null ? null : ` · v${library.publishedVersion}`}
            </span>
            <h2 className="ds-card__title">{library.name}</h2>
            <LibraryPreview id={library._id} />
            <span className="library-preview-card__foot">Edited {formatDateTime(library.draftUpdatedAt)} · {(library.draftBytes / 1024).toFixed(1)} KB</span>
          </Link>
        </div>)}
      </div>
      {libraries.length === 0 ? <Empty data-testid="library-list-empty" icon="templates" level={2}>
        Start with Design system 1, or create a library with your own colours and components.
      </Empty> : null}

    </main>
  );
}
