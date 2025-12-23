# Privacy Policy for Autopsy

**Last updated:** 2025-12-22

## Overview

Autopsy is committed to protecting your privacy. This extension operates entirely on your local device and does not collect, transmit, or store any personal data outside of your browser.

## Data Collection

**We collect ZERO data.** Autopsy does not:
- Transmit any data to external servers
- Use analytics or telemetry services
- Create user accounts or profiles
- Sync data to the cloud
- Share data with third parties
- Track your browsing history

## Permissions Explained

Autopsy requires the following Chrome permissions to function:

### tabs
**Why:** To read tab information including title, URL, active status, and last accessed time.
**Data:** Used locally to display in the popup interface. Never transmitted externally.

### tabGroups
**Why:** To read tab group information (name, color) for display and organization features.
**Data:** Used locally for grouping functionality.

### processes
**Why:** To read memory usage information per browser process.
**Data:** Used locally to show which tabs consume the most memory.

### storage
**Why:** To store tab creation timestamps locally.
**Data:** Stored in `chrome.storage.local` on your device. Used to track tab age across browser restarts.

### webRequest + host_permissions (<all_urls>)
**Why:** To monitor network activity (request count, bytes transferred, timing) per tab.
**Data:** Aggregated statistics stored in memory in the background service worker. Not persisted to disk.

## Local Data Storage

Autopsy stores minimal data locally using Chrome's storage API:
- Tab creation timestamps
- Per-instance tab metadata (URL, window, position)
- User preferences (theme, popup width)

This data:
- Stays on your device
- Is only accessible by Autopsy
- Can be cleared by removing the extension
- Is automatically cleaned up (30-day TTL for old tabs)

## Security

- All code is open source and auditable on GitHub
- No external network requests are made
- No credentials or authentication required
- No cookies or tracking pixels

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted on the GitHub repository with an updated "Last updated" date.

## Contact

For questions, concerns, or to report issues:
- **Email:** autopsy.tabs@gmail.com
- **GitHub Issues:** https://github.com/scttfrdmn/autopsy/issues
- **Source Code:** https://github.com/scttfrdmn/autopsy

## Open Source

Autopsy is open source software licensed under the MIT License. You can review the complete source code at:
https://github.com/scttfrdmn/autopsy
