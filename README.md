# Autopsy

> Surgical precision tab analysis — find what to close

A lightweight, professional Chrome extension that helps you identify which tabs to close by analyzing:
- Last accessed time
- Tab age (when opened)
- Network activity patterns
- Memory usage
- Request count

## Features

🔍 **Smart Analysis**
- Real-time network activity tracking
- Memory usage per tab (when available)
- Intelligent status indicators (active, recent, idle, dead)

⚡ **Lightweight Design**
- Built with Preact (3KB vs React's 40KB)
- Efficient background worker
- Minimal resource footprint — doesn't contribute to the problem!

💎 **Professional UI**
- Clean, surgical aesthetic
- Sortable columns
- Click to focus tabs
- One-click tab closing

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
