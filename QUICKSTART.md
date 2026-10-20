# Autopsy Quick Start

## Install

From the [Chrome Web Store](https://chromewebstore.google.com/detail/autopsy/mmcbbcemljflnhgkfenmpcidehmaoihk), or from source:

```bash
npm install
npm run build
```

Then open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and select `dist/`.

## Use

1. Click the Autopsy icon in the toolbar.
2. Tabs are sorted stalest first. Status shows how long since you last looked at each tab:
   ● Active · ◆ Recent (under 1h) · ■ Idle (under 1d) · ✕ Stale (over 1d).
3. Click **Select N stale**, check that the selection looks right, then click **Close N** in the bar at the bottom.
4. Changed your mind? Click **Undo** in the toast, or press ⌘/Ctrl+Z.

### Tips

- Click a row to switch to that tab. Hover a row and click × to close just that tab.
- Use the **Show**, **Age** and **Group** dropdowns to narrow things down. Bulk actions only touch tabs you can see.
- **Close N duplicates** keeps the copy of each page you viewed most recently.
- A pulsing dot in the **Network** column marks a background tab that's still making requests.
- Ages like `≥3d` mean the tab was open before Autopsy started tracking it.
- Press `?` for every keyboard shortcut. The ⋯ menu has theme, width, export and pinned-tab protection.
