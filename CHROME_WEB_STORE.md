# Chrome Web Store Publishing Guide

## Store Listing

### Short Description (132 characters max)
```
Postmortem analysis for your tabs. Find what to close with real-time network tracking, bulk operations, and smart grouping.
```

### Detailed Description
```
Autopsy helps you identify which tabs to close through postmortem analysis.

🔍 SMART ANALYSIS
• Real-time network activity tracking — Monitor requests, bytes transferred, and timing
• Intelligent status indicators — Active (●), Recent (◆), Idle (■), Dead (✕)
• Per-instance age tracking — Accurate tab ages that persist across browser restarts
• Memory usage insights — Identify resource-heavy tabs

🎯 BULK OPERATIONS
• Close duplicates — Remove duplicate URLs, automatically keeps newest
• Bulk pin/unpin — Manage multiple tabs at once
• Select by domain — Quick domain-wide selection with one click
• Move to new window — Organize selected tabs across windows

📊 ADVANCED GROUPING
• Group by domain — Organize tabs by website
• Group by window — See tabs per browser window
• Group by status — View by activity level (active, recent, idle, dead)
• Collapsible groups — Clean, organized view

📁 DATA EXPORT
• CSV export — Export to spreadsheet for analysis
• JSON export — Programmatic processing and backup
• Full metrics included — Age, status, network stats, groups

🎨 CUSTOMIZATION
• Dark/Light themes — Respects system preference or manual override
• Responsive width — Small, Medium, Large popup sizes
• Accessible design — WCAG AA compliant with shape variants

⚡ LIGHTWEIGHT DESIGN
• Built with Preact (3KB vs React's 40KB)
• Efficient background worker
• Minimal resource footprint — doesn't contribute to the problem!

PERFECT FOR:
• Tab hoarders who need to identify safe-to-close tabs
• Developers juggling dozens of documentation tabs
• Researchers tracking multiple sources
• Anyone wanting to understand their tab usage patterns

CONTACT & SUPPORT:
Questions or feedback? Email: autopsy.tabs@gmail.com
Issues and feature requests: https://github.com/scttfrdmn/autopsy/issues

PRIVACY & SECURITY:
All data stays local on your device. No cloud sync, no tracking, no telemetry. Autopsy analyzes your tabs entirely within your browser.

OPEN SOURCE:
MIT licensed. Source code available on GitHub: https://github.com/scttfrdmn/autopsy
```

### Category
**Recommended:** Productivity

### Language
English

## Required Assets

### Icons (Already Complete)
- ✅ 16×16: `public/icon16.png`
- ✅ 48×48: `public/icon48.png`
- ✅ 128×128: `public/icon128.png`

### Screenshots (Required: 1-5)
**Recommended size:** 1280×800 (or 640×400)

**Suggested screenshots to create:**

1. **Main Interface** — Overview of tab list with status indicators
   - Show diverse tabs with different statuses (active, recent, idle, dead)
   - Display age, memory, network activity columns
   - Highlight the clean, surgical aesthetic

2. **Grouping Features** — Demonstrate grouping capabilities
   - Show "Group by Domain" mode with multiple collapsed/expanded groups
   - Or cycle through Window/Status grouping modes

3. **Bulk Operations** — Show bulk action buttons in use
   - Multiple tabs selected
   - Bulk action buttons visible in footer
   - Or show duplicate detection dialog

4. **Export Functionality** — Display export options
   - Export buttons visible
   - Maybe show a preview of CSV/JSON output in another window

5. **Theme Support** — Dark vs Light theme side-by-side
   - Split image showing both themes
   - Or separate screenshots for each

**How to capture:**
1. Load extension in Chrome
2. Open popup (click toolbar icon)
3. Use browser screenshot tool or:
   ```bash
   # On macOS
   Cmd+Shift+4, then Space, then click popup window
   ```
4. Resize if needed to 1280×800 or 640×400

### Promotional Images (Optional but Recommended)

#### Small Tile - 440×280 (Required)
- Minimalist design with Autopsy icon
- Tagline: "Postmortem analysis for your tabs"
- Use brand colors (medical/forensic blue/teal)

#### Marquee - 1400×560 (Optional)
- Feature highlights with icons
- Screenshots or mockups
- "Don't let tab hoarding slow you down"

**Design tools:**
- Figma (free tier)
- Canva (free tier)
- Adobe Express (free tier)

## Privacy Policy

**Required?** YES - We use the following permissions that require disclosure:

**Data Collection:** NONE
- No data leaves your device
- No analytics or telemetry
- No user accounts or cloud sync
- No third-party services

**Permissions Used:**
- `tabs` — Read tab information (title, URL, status)
- `tabGroups` — Read tab group information
- `processes` — Read memory usage per process
- `storage` — Store tab creation timestamps locally
- `webRequest` + `<all_urls>` — Track network activity per tab

**Privacy Policy Template:**
```markdown
# Privacy Policy for Autopsy

Last updated: 2025-12-22

## Data Collection
Autopsy does not collect, transmit, or store any personal data outside of your local browser.

## Permissions
Autopsy requires the following permissions:
- **tabs**: To read tab information (title, URL, active status)
- **tabGroups**: To read tab group information
- **processes**: To read memory usage information
- **storage**: To store tab creation times locally in your browser
- **webRequest**: To track network activity per tab

## Data Storage
All data is stored locally using Chrome's storage API. No data is transmitted to external servers.

## Third Parties
Autopsy does not use any third-party services, analytics, or tracking.

## Contact
For questions, visit: https://github.com/scttfrdmn/autopsy/issues
```

**Where to host:**
- Add `PRIVACY.md` to GitHub repo
- Reference in Chrome Web Store: `https://github.com/scttfrdmn/autopsy/blob/main/PRIVACY.md`

## Pre-Submission Checklist

- [ ] Icons present and correct sizes (16, 48, 128)
- [ ] Screenshots captured (1-5 images, 1280×800 or 640×400)
- [ ] Small tile promotional image (440×280)
- [ ] Store listing written (short + detailed description)
- [ ] Privacy policy created and hosted
- [ ] Category selected (Productivity)
- [ ] Version updated to 0.20.0 in manifest.json and package.json
- [ ] Extension built and tested (`npm run build`)
- [ ] Extension packaged as ZIP from `dist/` folder
- [ ] GitHub release created for v0.20.0

## Submission Process

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Create ZIP package:**
   ```bash
   cd dist
   zip -r ../autopsy-v0.20.0.zip .
   cd ..
   ```

3. **Go to Chrome Web Store Developer Dashboard:**
   - https://chrome.google.com/webstore/devconsole
   - (Requires $5 one-time registration fee)

4. **Create New Item:**
   - Upload ZIP
   - Fill in store listing
   - Upload screenshots
   - Upload promotional images
   - Add privacy policy link
   - Select category
   - Submit for review

5. **Review time:** Typically 1-3 business days

## Post-Publication

- Update README.md with Chrome Web Store link
- Add "Available on Chrome Web Store" badge
- Announce on GitHub releases page
- Consider creating a simple landing page
