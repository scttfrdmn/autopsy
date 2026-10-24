# Changelog

All notable changes to Autopsy. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [0.23.1] - 2026-10-23

### Fixed
- Two colour pairs below WCAG AA: accent links in the light theme (4.3:1, now 5.0:1) and the red Close button in the dark theme (4.4:1, now 5.0:1).

### Website
- Rebuilt autopsy.tools:
  - Large product shots and a status legend.
  - How it works, and how tab age is tracked.
  - Privacy facts and an FAQ, including what the "read and change all your data" warning means.
  - Fixed keyboard-shortcut layout, an accurate footer and a social preview image.
  - No JavaScript and no external requests.

## [0.23.0] - 2026-10-19

A rework of how Autopsy measures tabs, a redesigned popup, and a sweep of bug fixes.

### Changed
- **Status now reflects when you last viewed a tab**, using Chrome's `lastAccessed`, which survives restarts. The statuses are Active (showing, or viewed under 10 minutes ago), Recent (under 1 hour), Idle (under 1 day) and **Stale** (over 1 day). "Inactive" and "Dead" are retired.
- **Network activity is a separate signal.** A *Network* column shows the last request, and a pulsing *busy* dot marks background tabs still making requests.
- **Tab age is tracked properly.**
  - The open time is recorded once and no longer resets when a tab navigates, including in-page navigation in single-page apps.
  - Ages carry across browser restarts by matching restored tabs by URL and position, because tab and window IDs change on restart.
  - Tabs opened before Autopsy was installed show a lower bound, such as `≥3d`.
- **Redesigned popup.**
  - Toolbar: one row with search and a ⋯ menu that holds theme, width, export, column reset and help.
  - A filter row with show, age and grouping dropdowns, plus one-click *Select N stale* and *Close N duplicates*.
  - A selection bar that only appears when tabs are selected.
  - Relative times, with exact times on hover.
  - Pinned, audio, asleep and tab-group badges, and a close button on each row.
  - In-app confirm dialogs.
- Popup widths are now S/M/L = 560/680/800px. Chrome caps popups at 800px, so the old 1000px "L" was clipped.
- `chrome://` pages such as New Tab are now listed, since empty New Tab pages are good candidates to close.
- Requires Chrome 121 or later (for `tab.lastAccessed`).

### Fixed
- **Keyboard navigation:**
  - Arrow keys threw an error on first open and then stuck on the first row.
  - Space, Enter and Delete acted on stale state.
  - Esc didn't close the help dialog.
  - The `?` shortcut, documented but missing, now opens help.
  - Fast key presses no longer lose focus.
- Network stats were lost whenever Chrome idled the service worker. They are now kept in session storage.
- Storage grew without bound: a key was written for every URL ever visited. Old keys are removed on upgrade.
- Bulk actions could close tabs you couldn't see: hidden by search or filters, in collapsed groups, or `chrome://` pages.
- Close Duplicates, Close Filtered and Select Stale closed pinned tabs. Pinned tabs are now protected by default.
- Only "Close selected" could be undone. Every close now can, and undo reopens tabs in their original window and position.
- Group by window labelled every window "(Current)".
- The "Updated X ago" timestamp didn't tick, and the "System" theme didn't follow OS changes.
- CSV export didn't escape URLs.
- The popup loaded Google Fonts, an external request, despite the privacy policy. It now uses system fonts.

### Removed
- The screenshot-automation hook in the production service worker. It now exists only in the screenshot build.
- Leftover "memory" claims and the unused `processes` permission justification.

### Development
- Popup split into components and hooks.
- Upgraded Vite 8, TypeScript 5.9, ESLint 9 (flat config with `typescript-eslint` and `react-hooks`), Playwright 1.64 and `@types/chrome` 0.3.
- Added Vitest unit tests and Playwright end-to-end tests, including a real browser-restart test.
- Added `npm run package`, a deterministic screenshot pipeline (`npm run screenshots`) and `npm run promo`.

## [0.22.0] - 2025-12-23
### Added
- Resizable table columns with persistent widths and a reset button.
### Changed
- Removed the unused `processes` permission (2025-12-30).

## [0.21.1] - 2025-12-23
### Fixed
- Screenshot generation and time display bugs.

## [0.21.0] - 2025-12-23
### Added
- Keyboard navigation (arrows, Space, Enter, Escape), a help dialog and WCAG focus indicators.

## [0.20.0] - 2025-12-23
### Changed
- Polish and Chrome Web Store publishing assets.

## [0.19.0] - 2025-12-23
### Added
- CSV and JSON export.

## [0.18.0] - 2025-12-23
### Changed
- Per-instance tab age tracking.

## [0.17.0] - 2025-12-23
### Added
- Dark, light and system themes; responsive width.

## [0.16.0] - 2025-12-23
### Added
- Group by window and status; collapsible groups.

## [0.15.0] - 2025-12-23
### Added
- Bulk pin/unpin, move to new window, close duplicates.

## [0.14.0] - 2025-12-23
### Added
- Domain grouping with collapsible sections.

## [0.13.0] - 2025-12-23
### Added
- Chrome tab group display.

## [0.12.0] - 2025-12-23
### Added
- Status shape variants, contrast improvements, suspended-tab indicator.

## [0.11.0] - 2025-12-22
### Added
- Search, keyboard shortcuts, undo close.

## [0.10.0] - 2025-12-22
### Added
- Select-all, confirmation for bulk closes, auto-refresh, status legend.

## [0.9.0] - 2025-12-20
### Added
- Initial beta: tab list with status, age filter and bulk close.

[0.23.1]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.23.1
[0.23.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.23.0
[0.22.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.22.0
[0.21.1]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.21.1
[0.21.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.21.0
[0.20.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.20.0
[0.19.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.19.0
[0.18.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.18.0
[0.17.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.17.0
[0.16.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.16.0
[0.15.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.15.0
[0.14.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.14.0
[0.13.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.13.0
[0.12.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.12.0
[0.11.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.11.0
[0.10.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.10.0
[0.9.0]: https://github.com/scttfrdmn/autopsy/releases/tag/v0.9.0
