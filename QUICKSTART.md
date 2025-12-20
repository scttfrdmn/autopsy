# Autopsy - Quick Start

## Get It Running in 3 Steps

### 1. Install Dependencies
```bash
cd autopsy
npm install
```

### 2. Build
```bash
npm run build
```

### 3. Load in Chrome
1. Open Chrome
2. Go to `chrome://extensions/`
3. Turn on "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the `dist` folder inside the `autopsy` directory

**That's it!** Click the Autopsy icon in your toolbar to analyze your tabs.

## What You'll See

- **Status dots**: 🟢 Active | 🔵 Recent | 🟡 Idle | 🔴 Dead
- **Sortable columns**: Click any header to sort
- **Quick actions**: Click row to focus, × to close
- **Smart stats**: Header shows total tabs, dead tabs, and memory usage

## Tips

- **Dead tabs** (red dot) haven't had network activity in over an hour — safe to close
- **Memory** column highlights heavy tabs (note: memory is grouped by Chrome process)
- **Requests** shows total network activity — high count = actively loading content
- **Click Refresh** to update all metrics

## Development Mode

Want to hack on it?

```bash
npm run dev
```

Load the `dist` folder as usual, and Vite will rebuild on save.

---

**Note**: Some features require Chrome Dev/Canary for full memory API access. On stable Chrome, memory data may be limited but everything else works perfectly!
