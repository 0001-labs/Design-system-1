/** Product artwork is retained for existing consumers, outside the shared icon overview. */
export function isSharedInterfaceIcon(key: string): boolean {
  return !key.startsWith('badge-') && key !== 'ezo-logo';
}
