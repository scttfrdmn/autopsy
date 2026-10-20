# Autopsy Roadmap

What has shipped is in [CHANGELOG.md](CHANGELOG.md). This file tracks what's next.

**Mission:** make it effortless to see which tabs are worth keeping, and to close the rest safely.

## Shipped highlights (through 0.23)

- Status from last-viewed time, with network activity as a separate "busy" signal
- Tab age that survives navigation and browser restarts
- Search, status and age filters; grouping by site, window or status
- Bulk pin/unpin/move/close with undo for every close; protected pinned tabs; close duplicates
- Keyboard-first navigation, accessible status shapes, light and dark themes
- CSV and JSON export; resizable columns
- Unit and end-to-end tests, including a real browser-restart test

## Next (0.24)

- [ ] **Side panel / full-page view.** Open Autopsy in Chrome's side panel or a tab for large tab counts; the popup is capped at 800×600.
- [ ] **Configurable thresholds** for Recent, Idle and Stale.
- [ ] **Never-close list.** Domains that are excluded from bulk closes, like pinned tabs.
- [ ] **Restore tab groups on undo.** Undo currently reopens tabs but not their group.
- [ ] **Better data counting.** Use the `PerformanceResourceTiming` sizes where `Content-Length` is missing (needs a content script, so weigh the permission cost).

## Later

- [ ] Virtualized table for 1,000+ tabs
- [ ] Optional auto-close rules ("close tabs stale for over 2 weeks"), off by default, with a review step
- [ ] Save a selection as a bookmark folder before closing
- [ ] Tab-count badge on the toolbar icon
- [ ] Localization

## Known Limitations

- **Tab age for pre-existing tabs is a lower bound.** Chrome doesn't expose creation times, so tabs opened before Autopsy was installed show `≥` their minimum age.
- **Restart matching is heuristic.** It matches by URL, then position. If several restored tabs share a URL and were reordered, their ages may swap.
- **Data is approximate.** It counts only responses with a `Content-Length` header that weren't served from cache, and resets when the browser restarts.
- **The popup is capped at 800×600** by Chrome.

## Technical Debt

- [ ] Component tests for the popup (currently covered end-to-end)
- [ ] CI workflow running lint, unit and e2e tests on pull requests
