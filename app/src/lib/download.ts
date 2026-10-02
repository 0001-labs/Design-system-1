/**
 * Trigger a file download from a string.
 *
 * Restores the pattern the workbench used to have, before the export UI was
 * removed — see `git show aec3129:app/src/App.tsx`.
 */
export function downloadCss(css: string, filename: string): void {
  const blob = new Blob([css], { type: "text/css" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
