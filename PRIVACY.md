# Privacy Policy for Autopsy

**Last updated:** 2026-10-19

## Overview

Autopsy runs entirely in your browser. It does not collect, transmit or share any data. Nothing leaves your device.

## Data Collection

**Autopsy collects no data.** It does not:
- Send data to any server, including the developer's
- Use analytics, telemetry or crash reporting
- Load remote code, fonts or other resources
- Create accounts or sync data to the cloud
- Share anything with third parties

## Permissions Explained

### tabs
**Why:** To list your tabs with their titles, URLs, favicons and Chrome's "last accessed" time, and to switch to, pin, move, close and reopen tabs when you ask it to.

### tabGroups
**Why:** To show which Chrome tab group a tab belongs to.

### storage
**Why:** To remember when each open tab was opened, so its age survives browser restarts, and to save your preferences.

### webRequest and host permissions (`<all_urls>`)
**Why:** To count, per tab, how many network requests it made, when the last one happened, and how many bytes were received (from the `Content-Length` header). Autopsy observes these events. It does not read request or response bodies, and it never blocks or modifies requests.

## What Is Stored, and Where

| Data | Where | Kept until |
| --- | --- | --- |
| For each **open** tab: its URL, when it was opened, and its window and position | `chrome.storage.local` | The tab closes. Records are kept for about 10 minutes after a browser restart so restored tabs can reclaim their ages, then discarded. |
| Preferences (theme, width, column widths, sort, pinned-tab protection) | `chrome.storage.local` | You change them or remove the extension |
| Per-tab network counters (request count, bytes, timestamps) | `chrome.storage.session` (memory) | The tab closes or the browser restarts |

Autopsy keeps no browsing history. Earlier versions (0.22 and before) kept a timestamp for every URL ever visited; version 0.23 deletes that data on upgrade.

All of this is only accessible to Autopsy and is removed when you uninstall it.

## Exports

CSV and JSON exports are created locally and saved only where you choose.

## Changes to This Policy

Changes are posted in the GitHub repository with an updated "Last updated" date.

## Contact

- **Email:** info@autopsy.tools
- **GitHub Issues:** https://github.com/scttfrdmn/autopsy/issues
- **Source Code:** https://github.com/scttfrdmn/autopsy (MIT License)
