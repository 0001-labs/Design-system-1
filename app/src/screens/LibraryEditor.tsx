import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { App, type WorkbenchConfig } from "../App";
import {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_MAX_WAIT_MS,
  backoffMs,
  clearLocalDraft,
  readLocalDraft,
  stashLocalDraft,
  type SaveState,
} from "../lib/autosave";
import { asFailure } from "../lib/convex";
import { PublishPanel } from "./PublishPanel";
import { Link, navigate } from "../router";

const SAVE_LABEL: Record<SaveState, string> = {
  saved: "Saved",
  dirty: "Unsaved changes",
  saving: "Saving…",
  conflict: "Edited elsewhere",
  offline: "Offline — kept on this device",
  error: "Could not save",
};

export function LibraryEditor({ libraryId }: { libraryId: string }) {
  const id = libraryId as Id<"libraries">;
  const library = useQuery(api.libraries.get, { id });
  const saveDraft = useMutation(api.libraries.saveDraft);
  const rename = useMutation(api.libraries.rename);
  const [renaming, setRenaming] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);

  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [serverRev, setServerRev] = useState<number | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  // The CSS currently in the editor, which may be newer than what the server
  // has returned. The publish panel validates against this so its issue list
  // matches what the user is looking at.
  const liveCss = useRef<string | null>(null);

  // Latest editor state, held in a ref so the debounce timer never re-arms on
  // every keystroke and the flush handlers always see current values.
  const pending = useRef<{ css: string; config: string } | null>(null);
  const baseRev = useRef<number | null>(null);
  const lastSavedCss = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempt = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Seed the revision the first time the library arrives.
  useEffect(() => {
    if (library && baseRev.current === null) {
      baseRev.current = library.draftRev;
      lastSavedCss.current = library.draftCss;
    }
  }, [library]);

  const flush = useCallback(async () => {
    const draft = pending.current;
    const rev = baseRev.current;
    if (!draft || rev === null) return;

    // The drag handles emit many byte-identical states; skipping them is what
    // keeps autosave off the mutation-rate ceiling, not a micro-optimization.
    if (draft.css === lastSavedCss.current) {
      pending.current = null;
      if (mounted.current) setSaveState("saved");
      return;
    }

    if (mounted.current) setSaveState("saving");

    try {
      const result = await saveDraft({
        id,
        css: draft.css,
        config: draft.config,
        baseRev: rev,
      });

      baseRev.current = result.draftRev;
      lastSavedCss.current = draft.css;
      pending.current = null;
      attempt.current = 0;
      clearLocalDraft(libraryId);
      if (mounted.current) setSaveState("saved");
    } catch (caught) {
      const failure = asFailure(caught);

      if (failure?.code === "draft_conflict") {
        const details = failure.details as { serverRev?: number } | undefined;
        setServerRev(details?.serverRev ?? null);
        stashLocalDraft(libraryId, { ...draft, baseRev: rev, savedAt: Date.now() });
        if (mounted.current) setSaveState("conflict");
        return;
      }

      // Anything else — offline, a deploy blip — keeps the work on the device
      // and retries. Never drop the user's edits on the floor.
      stashLocalDraft(libraryId, { ...draft, baseRev: rev, savedAt: Date.now() });
      attempt.current += 1;
      if (mounted.current) setSaveState(navigator.onLine ? "error" : "offline");

      setTimeout(() => {
        if (mounted.current && pending.current) void flush();
      }, backoffMs(attempt.current));
    }
  }, [id, libraryId, saveDraft]);

  const onDirty = useCallback(
    ({ css, config }: { css: string; config: WorkbenchConfig }) => {
      liveCss.current = css;

      if (baseRev.current === null) return;
      if (css === lastSavedCss.current && pending.current === null) return;

      pending.current = { css, config: JSON.stringify(config) };
      setSaveState((current) => (current === "conflict" ? current : "dirty"));

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => void flush(), AUTOSAVE_DEBOUNCE_MS);

      // Checkpoint even if the user never pauses.
      if (!maxWaitTimer.current) {
        maxWaitTimer.current = setTimeout(() => {
          maxWaitTimer.current = null;
          void flush();
        }, AUTOSAVE_MAX_WAIT_MS);
      }
    },
    [flush],
  );

  // StrictMode double-invokes effects in dev, so every timer must be cancelled
  // on cleanup and flush must be safe to call twice.
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (maxWaitTimer.current) clearTimeout(maxWaitTimer.current);
    };
  }, []);

  useEffect(() => {
    const onHide = () => {
      if (pending.current) void flush();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("online", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("online", onHide);
    };
  }, [flush]);

  if (library === undefined) {
    return (
      <main className="route-splash" data-testid="editor-loading">
        <p>Loading…</p>
      </main>
    );
  }

  if (library === null) {
    return (
      <main className="route-splash">
        <p>That library does not exist.</p>
        <button onClick={() => navigate("/libraries")} type="button">
          Back to your libraries
        </button>
      </main>
    );
  }

  const local = readLocalDraft(libraryId);

  return (
    <App
      // Remount on library change so state re-seeds from initialCss. This
      // deletes the entire class of "sync props into state" bugs.
      key={libraryId}
      initialCss={library.draftCss}
      initialConfig={parseConfig(library.draftConfig, library.publicId)}
      onDirty={onDirty}
      headerSlot={
        <header className="workbench-header" data-ds-area="Library actions">
          <div>
            <Link to="/libraries">← Libraries</Link>
            {editingName ? (
              <form onSubmit={async (event) => {
                event.preventDefault();
                if (renaming) return;
                setRenaming(true);
                setRenameError(null);
                try {
                  await rename({ id, name: nameInput });
                  setEditingName(false);
                } catch (error) {
                  setRenameError(asFailure(error)?.message ?? "Could not rename the library. Try again.");
                } finally {
                  setRenaming(false);
                }
              }}>
                <input aria-label="Library name" autoFocus maxLength={60} required
                  value={nameInput} disabled={renaming}
                  onChange={(event) => setNameInput(event.target.value)} />
                <button className="action-button" type="submit" disabled={renaming || !nameInput.trim()}>
                  {renaming ? "Saving…" : "Save name"}
                </button>
                <button className="action-button" type="button" disabled={renaming}
                  onClick={() => { setEditingName(false); setRenameError(null); }}>Cancel</button>
              </form>
            ) : <>
              <strong>{library.name}</strong>
              <button className="action-button" type="button" onClick={() => {
                setNameInput(library.name); setEditingName(true); setRenameError(null);
              }}>Rename</button>
            </>}
            {renameError ? <span role="alert">{renameError}</span> : null}
          </div>

          <div className="workbench-header-actions">
            <span data-testid="save-state" data-state={saveState}>
              {SAVE_LABEL[saveState]}
            </span>
            <button
              className="action-button action-button--primary"
              data-testid="open-publish"
              onClick={() => setPublishOpen((open) => !open)}
              type="button"
            >
              {publishOpen ? "Hide publish" : "Publish"}
            </button>
          </div>

          {publishOpen ? (
            <PublishPanel
              css={liveCss.current ?? library.draftCss}
              // Reactive from the Convex query, so it tracks each autosave.
              // Deliberately NOT serverRev, which is only populated during a
              // conflict and would publish against the wrong revision.
              draftRev={library.draftRev}
              installUrl={library.installUrl}
              lastPublishError={library.lastPublishError}
              libraryId={libraryId}
              name={library.name}
              onClose={() => setPublishOpen(false)}
              publicId={library.publicId}
              publishedVersion={library.publishedVersion}
              slug={library.slug}
              state={library.state}
            />
          ) : null}

          {saveState === "conflict" ? (
            <ConflictBar
              libraryId={libraryId}
              serverRev={serverRev}
              onKeepMine={() => {
                if (serverRev !== null) baseRev.current = serverRev;
                setSaveState("dirty");
                void flush();
              }}
              onLoadTheirs={() => {
                clearLocalDraft(libraryId);
                window.location.reload();
              }}
            />
          ) : null}

          {local && saveState !== "conflict" ? (
            <p data-testid="local-draft-notice">
              Unsaved changes from an earlier session are stored on this device.
            </p>
          ) : null}
        </header>
      }
    />
  );
}

function ConflictBar({
  serverRev,
  onKeepMine,
  onLoadTheirs,
}: {
  libraryId: string;
  serverRev: number | null;
  onKeepMine: () => void;
  onLoadTheirs: () => void;
}) {
  return (
    <div className="conflict-bar" data-testid="conflict-bar" role="alert">
      <p>
        This library was edited somewhere else{serverRev === null ? "" : ` (revision ${serverRev})`}.
        Your changes are safe on this device.
      </p>
      {/* Never auto-merge CSS text — the user decides. */}
      <button className="action-button" onClick={onKeepMine} type="button">
        Keep mine
      </button>
      <button className="action-button" onClick={onLoadTheirs} type="button">
        Load theirs
      </button>
    </div>
  );
}

/**
 * `draftConfig` is advisory. If it is unparseable or from a future schema, the
 * editor still opens — the stylesheet text is what actually matters, and
 * App.tsx re-derives the controls from it.
 */
function parseConfig(raw: string, label: string): WorkbenchConfig | undefined {
  try {
    const parsed = JSON.parse(raw) as Partial<WorkbenchConfig>;
    if (parsed?.schema !== 1 || !parsed.configs || typeof parsed.accent !== "string") {
      return undefined;
    }
    return parsed as WorkbenchConfig;
  } catch {
    console.warn(`[editor] ignoring unreadable draftConfig for ${label}`);
    return undefined;
  }
}
