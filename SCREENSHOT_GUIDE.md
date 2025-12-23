# Screenshot Capture Guide

## Requirements
- **Size:** 1280×800 or 640×400
- **Format:** PNG or JPG
- **Count:** 1-5 screenshots (recommend 4-5)
- **First screenshot** appears in search results and is most important

## Setup

1. **Load the extension:**
   ```bash
   # Make sure extension is loaded in Chrome
   # Go to: chrome://extensions/
   # Enable Developer mode
   # Click "Load unpacked" → select dist/ folder
   ```

2. **Prepare test tabs:**
   - Open 15-20 diverse tabs
   - Include: different domains, ages, statuses
   - Wait a few minutes for varied status indicators
   - Have some pinned tabs, some in groups

## Screenshot 1: Main Interface (MOST IMPORTANT)
**This appears in search results - make it count!**

**Setup:**
- Open Autopsy popup
- Set width to Large (bottom right button)
- Sort by "Age" or "Status" to show variety
- Ensure you have tabs with different status indicators:
  - ● Active (green)
  - ◆ Recent (blue)
  - ■ Idle (yellow)
  - ✕ Dead (red)

**Capture:**
```bash
# macOS: Cmd+Shift+4, then Space, then click popup window
# Or use Chrome DevTools screenshot feature
```

**What to show:**
- Full popup with varied tab list
- Status indicators visible
- Column headers clear
- Memory/network stats showing
- Clean, professional look

## Screenshot 2: Grouping Features

**Setup:**
- Click the group mode button (cycle to "Group by Domain")
- Expand 2-3 domain groups
- Collapse 1-2 domain groups
- Show variety of domains

**Alternative:**
- Use "Group by Status" mode
- Show Active, Recent, Idle, Dead sections

**Capture:**
- Full popup showing collapsed/expanded groups
- Group headers with tab counts visible
- Clear hierarchy

## Screenshot 3: Bulk Operations

**Setup Option A - Selected Tabs:**
- Select 5-7 tabs (checkboxes)
- Show footer buttons: Close, Pin, Unpin, Move to Window

**Setup Option B - Duplicates:**
- Open some duplicate tabs (same URL)
- Click "Close Duplicates" button
- Capture the confirmation dialog if possible

**Capture:**
- Show selected tabs highlighted
- Bulk action buttons visible in footer
- Selection count visible

## Screenshot 4: Export & Features

**Setup:**
- Have export buttons visible in footer
- Show export dropdown or buttons
- Include theme toggle button (top right)
- Show width controls

**Alternative:**
- Side-by-side comparison before exporting
- Or show CSV/JSON output in separate window

## Screenshot 5: Theme Comparison (Optional but impactful)

**Create a split image:**

**Method A - Manual split:**
1. Capture dark theme version
2. Click theme toggle to light mode
3. Capture light theme version
4. Use image editor to create side-by-side

**Method B - Just one theme:**
- Capture either dark OR light
- Show theme toggle button highlighted

## Capture Methods

### Method 1: macOS Screenshot (Recommended)
```bash
# 1. Open Autopsy popup
# 2. Press: Cmd+Shift+4
# 3. Press: Space (cursor becomes camera)
# 4. Click on the popup window
# 5. Screenshot saved to Desktop
```

### Method 2: Chrome DevTools
```bash
# 1. Right-click popup → Inspect
# 2. Open Command Palette: Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
# 3. Type "screenshot"
# 4. Select "Capture screenshot"
```

### Method 3: Chrome Extension Screenshot Tool
```bash
# Use a screenshot extension like:
# - Awesome Screenshot
# - FireShot
```

## After Capturing

### Resize if needed:
```bash
# Using ImageMagick (if installed)
magick mogrify -resize 1280x800 screenshot.png

# Using Preview (macOS):
# Tools → Adjust Size → Width: 1280, Height: 800

# Using GIMP (free):
# Image → Scale Image → 1280 × 800
```

### Check quality:
- Text is readable
- Status indicators are visible
- No pixelation
- Professional appearance
- Shows value of the extension

## Screenshot Checklist

- [ ] Screenshot 1: Main interface with varied status indicators
- [ ] Screenshot 2: Grouping features (domain or status)
- [ ] Screenshot 3: Bulk operations (selected tabs or duplicates)
- [ ] Screenshot 4: Export features or additional functionality
- [ ] Screenshot 5: Theme comparison (optional but recommended)
- [ ] All screenshots are 1280×800 or 640×400
- [ ] All screenshots are PNG or JPG
- [ ] Text is readable at actual size
- [ ] Screenshots saved to `/screenshots/` folder

## Storage

```bash
# Create screenshots folder
mkdir -p screenshots
mv ~/Desktop/Screenshot*.png screenshots/
```

## Tips for Great Screenshots

1. **Clean setup** - Close unnecessary Chrome UI elements
2. **Diverse content** - Show variety of tabs and states
3. **Clear text** - Ensure all text is readable
4. **Professional** - No personal/sensitive information visible
5. **Story** - Each screenshot should show a different feature/use case
6. **Context** - Include enough UI to show where features are located

## Ready to Capture?

1. Load extension in Chrome
2. Open 15-20 diverse tabs
3. Wait 5-10 minutes for status variety
4. Follow capture steps above for each screenshot
5. Save to `screenshots/` folder
6. Proceed to Chrome Web Store submission!
