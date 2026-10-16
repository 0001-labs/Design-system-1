/** A published library owns appearance; its last published snapshot covers offline starts. */
export function connectLibraryStyles(options: {
  url: string;
  fallback: string;
  document?: Document;
}): () => void {
  const doc = options.document ?? document;
  const fallback = doc.createElement("style");
  fallback.dataset.designLibrary = "fallback";
  fallback.textContent = options.fallback;
  const published = doc.createElement("link");
  published.rel = "stylesheet";
  published.href = options.url;
  published.dataset.designLibrary = "published";
  const loaded = () => {
    // Replace, rather than layer: deleting a library rule must really delete it.
    fallback.disabled = true;
    published.dataset.state = "published";
  };
  const failed = () => {
    fallback.disabled = false;
    published.dataset.state = "fallback";
  };
  published.addEventListener("load", loaded);
  published.addEventListener("error", failed);
  doc.head.append(fallback, published);
  return () => {
    published.removeEventListener("load", loaded);
    published.removeEventListener("error", failed);
    published.remove();
    fallback.remove();
  };
}
