# Chrome Web Store Submission Checklist

## ✅ Pre-Submission Complete

Everything is ready for submission! Here's what has been prepared:

### Package
- ✅ **Extension package:** `autopsy-v0.20.0.zip` (34 KB)
- ✅ **Version:** 0.20.0
- ✅ **Built and tested:** Production build successful

### Screenshots
- ✅ **5 screenshots captured** in `screenshots/` folder:
  1. `01-main-interface.png` — Main interface with status indicators (1280×800)
  2. `02-group-by-domain.png` — Domain grouping feature (1280×800)
  3. `03-group-by-status.png` — Status grouping feature (1280×800)
  4. `04-bulk-operations.png` — Bulk operations with selections (1463×800)
  5. `05-light-theme.png` — Light theme variant (1280×800)

### Store Listing Content
- ✅ **Short description** (132 chars)
- ✅ **Detailed description** (full features list)
- ✅ **Privacy policy:** `PRIVACY.md` (hosted on GitHub)

### Documentation
- ✅ **Publishing guide:** `CHROME_WEB_STORE.md`
- ✅ **Privacy policy:** `PRIVACY.md`
- ✅ **README updated** with badges and features

---

## 🚀 Submission Steps

### 1. Go to Chrome Web Store Developer Dashboard
Visit: https://chrome.google.com/webstore/devconsole

### 2. Create New Item

Click **"New Item"** button

### 3. Upload Package

**Upload:** `autopsy-v0.20.0.zip`

The dashboard will validate your extension. Wait for upload to complete.

### 4. Fill Store Listing

#### **Product details**

**Name:**
```
Autopsy
```

**Summary:** (132 characters maximum)
```
Postmortem analysis for your tabs. Find what to close with real-time network tracking, bulk operations, and smart grouping.
```

**Category:**
```
Productivity
```

**Language:**
```
English (United States)
```

#### **Detailed description:**

Copy from `CHROME_WEB_STORE.md` starting with:

```
Autopsy helps you identify which tabs to close through postmortem analysis.

🔍 SMART ANALYSIS
• Real-time network activity tracking — Monitor requests, bytes transferred, and timing
• Intelligent status indicators — Active (●), Recent (◆), Idle (■), Dead (✕)
...
(full content in CHROME_WEB_STORE.md)
```

### 5. Upload Screenshots

Click **"Upload screenshots"**

Upload in this order (first screenshot appears in search results):
1. `screenshots/01-main-interface.png` ⭐ (Most important)
2. `screenshots/02-group-by-domain.png`
3. `screenshots/03-group-by-status.png`
4. `screenshots/04-bulk-operations.png`
5. `screenshots/05-light-theme.png`

### 6. Promotional Images (Optional but Recommended)

**Small tile (440×280):**
- Not created yet - you can skip for now or create later
- Can be added after initial publication

**Marquee (1400×560):**
- Optional
- Can be added after initial publication

### 7. Privacy Practices

**Privacy policy URL:**
```
https://github.com/scttfrdmn/autopsy/blob/main/PRIVACY.md
```

**Single purpose description:**
```
Analyze and manage browser tabs by displaying their activity, age, memory usage, and network statistics.
```

**Permissions justification:**

For each permission, explain why it's needed:

**tabs:**
```
Required to read tab information (title, URL, active status, last accessed time) for display in the extension popup.
```

**tabGroups:**
```
Required to read tab group information (name, color) for the grouping and organization features.
```

**processes:**
```
Required to read memory usage information per browser process to show which tabs consume the most memory.
```

**storage:**
```
Required to store tab creation timestamps locally for accurate tab age tracking across browser restarts.
```

**webRequest:**
```
Required to monitor network activity (request count, bytes transferred, timing) per tab to identify truly idle tabs.
```

**host_permissions ("<all_urls>"):**
```
Required to track network requests across all domains to provide accurate activity status for each tab.
```

**Data usage:**

Select: **This extension does not collect or transmit user data**

### 8. Pricing & Distribution

**Pricing:**
```
Free
```

**Visibility:**
```
Public
```

**Distribution:**
```
All countries (or select specific countries)
```

### 9. Review & Submit

1. **Preview** your store listing
2. **Review** all information
3. **Submit for review**
4. **Wait** for Google review (typically 1-3 business days)

---

## 📧 After Submission

### You'll receive email notifications:
1. **Submission received** — Immediately
2. **Under review** — Within 1-2 days
3. **Published** OR **Rejected with feedback** — Within 1-3 days

### If rejected:
- Read the rejection reason carefully
- Make requested changes
- Resubmit

### If approved:
- Your extension will be live on Chrome Web Store
- You'll get a permanent URL like: `https://chrome.google.com/webstore/detail/[extension-id]`

---

## 🎉 Post-Publication

### Update README.md

Add Chrome Web Store badge:
```markdown
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/[YOUR-EXTENSION-ID].svg)](https://chrome.google.com/webstore/detail/[YOUR-EXTENSION-ID])
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/[YOUR-EXTENSION-ID].svg)](https://chrome.google.com/webstore/detail/[YOUR-EXTENSION-ID])
[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/[YOUR-EXTENSION-ID].svg)](https://chrome.google.com/webstore/detail/[YOUR-EXTENSION-ID])
```

### Announce

- Update GitHub README with Chrome Web Store link
- Create announcement in GitHub Discussions or Releases
- Share on social media if desired

### Monitor

- Watch for user reviews and feedback
- Respond to issues reported on GitHub
- Plan future updates based on user needs

---

## 🆘 Troubleshooting

### Common rejection reasons:

**1. Permissions too broad**
- ✅ Already justified each permission clearly

**2. Privacy policy unclear**
- ✅ Already created comprehensive privacy policy

**3. Functionality not clear from description**
- ✅ Already created detailed description with features

**4. Screenshots don't show key features**
- ✅ Already captured diverse screenshots

### If you need help:
- **Extension Support:** autopsy.tabs@gmail.com
- **Chrome Web Store Support:** https://support.google.com/chrome_webstore
- **Developer Program Policies:** https://developer.chrome.com/docs/webstore/program-policies/
- **GitHub Issues:** https://github.com/scttfrdmn/autopsy/issues

---

## 📋 Quick Reference

**Developer Dashboard:** https://chrome.google.com/webstore/devconsole
**Package:** `autopsy-v0.20.0.zip`
**Screenshots:** `screenshots/` folder (5 files)
**Privacy Policy:** https://github.com/scttfrdmn/autopsy/blob/main/PRIVACY.md
**Version:** 0.20.0
**Category:** Productivity

---

**You're all set! Good luck with your submission! 🚀**
