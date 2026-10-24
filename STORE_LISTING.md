# Chrome Web Store listing

This is the text to paste into the developer dashboard. Images are in `screenshots/` (1280×800) and `assets/` (promo tile 440×280, marquee 1400×560). The package is built by `npm run package` → `autopsy-v<version>.zip` and submitted with `npm run cws -- submit` (see RELEASING.md). The text below was last updated for 0.23.

## Item details

- **Name:** Autopsy
- **Category:** Productivity (Tools)
- **Language:** English (United States)
- **Summary** (132 characters max; matches the manifest):
  Postmortem analysis for your tabs. See how old and how stale every tab is, then close what you don't need.

## Description

```
Autopsy shows you, for every open tab, how long it has been open, when you last looked at it, and whether it's still busy in the background. Then it helps you close what you don't need, safely.

NEW IN 0.23
• Status now reflects when you last viewed each tab: Active, Recent, Idle, Stale
• Tab ages that survive navigation and browser restarts
• Redesigned, calmer popup with one-click "Select stale" and "Close duplicates"
• Undo for every close, back into the original window
• Pinned tabs are protected from bulk closes
• Keyboard navigation fixed and extended (press ? for shortcuts)

SEE WHAT'S STALE
• Age: how long each tab has been open
• Viewed: when you last switched to it
• Network: when it last made a request, with a "busy" dot for background tabs still working
• Data: bytes received and requests made
• Status shapes (● ◆ ■ ✕) that never rely on colour alone

CLOSE WITH CONFIDENCE
• Select stale tabs, close duplicates, or close any row
• Pin, unpin, or move selected tabs to a new window
• Bulk actions only touch tabs you can see
• Undo any close for a few seconds (⌘/Ctrl+Z)

FIND AND ORGANIZE
• Search by title or URL
• Filter by status and age; group by site, window or status
• Export visible tabs to CSV or JSON
• Light and dark themes, three popup widths, resizable columns
• Full keyboard control

PRIVATE BY DESIGN
Everything stays on your device. No servers, no accounts, no analytics, no external requests. Open source (MIT).

Support: info@autopsy.tools
Source: https://github.com/scttfrdmn/autopsy
Website: https://autopsy.tools
```

## Single purpose

Help users review their open tabs (age, last viewed, network activity) and close, pin, or move the ones they no longer need.

## Permission justifications

- **tabs:** List open tabs with title, URL, favicon and last-accessed time. Switch to, pin, move, close and reopen tabs at the user's request.
- **tabGroups:** Show which Chrome tab group a tab belongs to.
- **storage:** Persist each open tab's opened-at time (so ages survive restarts) and user preferences. Network counters are kept in session storage.
- **webRequest:** Count network requests and response sizes per tab, to show whether a tab is still active in the background. Observes only; never blocks or modifies requests, never reads bodies.
- **Host permission `<all_urls>`:** Required for `webRequest` to observe requests from tabs on any site.
- **Remote code:** None. All code is bundled in the package.

## Data usage disclosures

- Collects no user data. Nothing is sold, transferred, or used for unrelated purposes.
- Privacy policy: https://github.com/scttfrdmn/autopsy/blob/main/PRIVACY.md

## Other settings

- **Minimum Chrome version:** 121 (set in the manifest)
- **Visibility:** Public · **Distribution:** All regions · **Pricing:** Free

## Screenshots (upload in order; the store allows five)

1. `01-main-interface.png`: main table, sorted stalest first
2. `06-bulk-operations.png`: stale tabs selected, with the selection bar
3. `05-group-by-status.png`: grouped by status
4. `03-help-keyboard-shortcuts.png`: help dialog (status legend, columns, shortcuts)
5. `07-light-theme.png`: light theme

`02`, `04` and `08` are used on the website and in the README only.
