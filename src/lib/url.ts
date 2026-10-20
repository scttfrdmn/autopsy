/** Display host for a tab URL; never throws. */
export function getHostname(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.hostname;
    if (parsed.protocol === 'file:') return 'Local file';
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return url;
  }
}

/**
 * Tabs Autopsy doesn't list: its own pages, devtools, blank pages, and tabs with no URL yet.
 * Browser pages such as chrome://newtab stay visible — empty New Tab pages are prime candidates to close.
 */
export function isHiddenUrl(url: string, ownOrigin: string): boolean {
  return (
    !url || url === 'about:blank' || url.startsWith(ownOrigin) || url.startsWith('devtools://')
  );
}
