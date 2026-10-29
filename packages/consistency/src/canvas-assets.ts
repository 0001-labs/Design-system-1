/** Component asset directories belong to the viewed site, just like its pictures and styles. */
export function canvasAssetAddress(value: string, files: string, page: string): string {
  if (!value || !files || value.startsWith(files + '/')) return value;
  try {
    const site = new URL(page), asset = new URL(value, site);
    if (asset.origin !== site.origin || !['http:', 'https:'].includes(asset.protocol)) return value;
    return files + asset.pathname + asset.search + asset.hash;
  } catch { return value; }
}
