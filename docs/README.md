# Autopsy Landing Page

This directory contains the landing page for autopsy.tools, hosted via GitHub Pages.

## Setup GitHub Pages

1. **Push to GitHub:**
   ```bash
   git add docs/
   git commit -m "Add landing page for autopsy.tools"
   git push
   ```

2. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` → `/docs` folder
   - Click Save

3. **Configure Custom Domain:**
   - In Settings → Pages → Custom domain, enter: `autopsy.tools`
   - GitHub will create/update the CNAME file (already included)

4. **Update DNS Settings at your domain registrar:**
   Add these DNS records for autopsy.tools:

   ```
   Type: A
   Name: @
   Value: 185.199.108.153

   Type: A
   Name: @
   Value: 185.199.109.153

   Type: A
   Name: @
   Value: 185.199.110.153

   Type: A
   Name: @
   Value: 185.199.111.153

   Type: CNAME
   Name: www
   Value: scttfrdmn.github.io
   ```

5. **Wait for DNS propagation** (can take up to 24 hours, usually faster)

6. **Enable HTTPS:**
   - Once DNS is configured, GitHub will offer HTTPS option
   - Check "Enforce HTTPS" in Settings → Pages

## Images

`img/popup-*.png` are 2× popup captures written by `npm run screenshots`; `img/og.png` is the social preview (a copy of `assets/promo-marquee-1400x560.png`).

## Chrome Web Store link

Both install buttons in `index.html` link to the store listing for extension ID `fmlkjcobafbejgpkjkcgbhfgnlpdkegn` (the ID in the Developer Dashboard URL, also in `scripts/cws.config.json`).

## Local Development

Open `index.html` in a browser to preview:
```bash
open docs/index.html
```

Or use a local server:
```bash
cd docs
python -m http.server 8000
# Visit http://localhost:8000
```

## Structure

```
docs/
├── index.html          # The landing page (static, no JavaScript)
├── style.css           # Styles (system fonts, no external requests)
├── icon48.png          # Favicon and nav logo
├── icon128.png         # Larger icon
├── CNAME               # Custom domain config
├── img/                # popup-*.png (2x captures) and og.png (social preview)
└── README.md          # This file
```
