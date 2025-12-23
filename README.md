# Autopsy

[![Version](https://img.shields.io/badge/version-0.20.0-blue.svg)](https://github.com/scttfrdmn/autopsy/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![ESLint](https://img.shields.io/badge/ESLint-passing-brightgreen.svg)](eslint.config.js)
[![Code Style](https://img.shields.io/badge/code%20style-prettier-ff69b4.svg)](https://prettier.io/)

> Surgical precision tab analysis — find what to close

A lightweight, professional Chrome extension that helps you identify which tabs to close by analyzing:
- Last accessed time
- Tab age (when opened)
- Network activity patterns
- Memory usage
- Request count

## Features

### 🔍 Smart Analysis
- **Real-time network activity tracking** — Monitor requests, bytes, and timing
- **Intelligent status indicators** — Active (●), Recent (◆), Idle (■), Dead (✕)
- **Per-instance age tracking** — Accurate tab ages across browser restarts
- **Memory usage insights** — Identify resource-heavy tabs

### 🎯 Bulk Operations
- **Close duplicates** — Remove duplicate URLs, keep newest
- **Bulk pin/unpin** — Manage multiple tabs at once
- **Select by domain** — Quick domain-wide selection
- **Move to new window** — Organize tabs across windows

### 📊 Advanced Grouping
- **Group by domain** — Organize tabs by website
- **Group by window** — See tabs per browser window
- **Group by status** — View by activity level
- **Collapsible groups** — Clean, organized view

### 📁 Data Export
- **CSV export** — Spreadsheet analysis
- **JSON export** — Programmatic processing
- **Full metrics** — Age, status, network stats, groups

### 🎨 Customization
- **Dark/Light themes** — System preference support
- **Responsive width** — Small, Medium, Large sizes
- **Accessible design** — WCAG AA compliant, shape variants

### ⚡ Lightweight Design
- Built with Preact (3KB vs React's 40KB)
- Efficient background worker
- Minimal resource footprint — doesn't contribute to the problem!

## Installation

### Development Mode

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

3. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

### Development with Hot Reload

```bash
npm run dev
```

Then load the `dist` folder as an unpacked extension. Vite will rebuild on changes.

## Usage

1. Click the Autopsy icon in your Chrome toolbar
2. View your tabs sorted by various metrics
3. Click column headers to sort
4. Click a row to focus that tab
5. Click the × button to close a tab
6. Use the status indicators:
   - 🟢 **Active** — Network activity in last 10 seconds
   - 🔵 **Recent** — Active in last 5 minutes
   - 🟡 **Idle** — Active in last hour
   - 🔴 **Dead** — No activity for over an hour

## Architecture

### Background Worker (`src/background/worker.ts`)
- Tracks tab creation times
- Monitors network requests (count, timing, bytes)
- Lightweight in-memory storage
- Cleans up when tabs close

### Popup UI (`src/popup.tsx`)
- Preact-based interface (minimal bundle size)
- Aggregates data from tabs API, processes API, and background worker
- Smart sorting and filtering
- Professional surgical/diagnostic aesthetic

### Type Safety
Full TypeScript support with Chrome extension types.

## Technical Details

**Bundle Size:**
- Preact: ~3KB gzipped
- Total extension: <50KB

**Memory Tracking:**
- Uses Chrome's `processes` API
- Note: Memory is grouped by process, not always 1:1 with tabs
- Useful for identifying high-memory processes

**Network Tracking:**
- Tracks request count, bytes received, and timing
- Lightweight — only stores aggregated stats
- Identifies truly idle vs. background-active tabs

## Permissions

- `tabs` — Read tab information
- `processes` — Get memory usage
- `storage` — Store tab creation times
- `webRequest` + `<all_urls>` — Track network activity

## Development

Built with:
- TypeScript
- Preact
- Vite
- Chrome Extension Manifest V3

## License

MIT

---

**Don't let tab hoarding slow you down. Perform the autopsy.**
