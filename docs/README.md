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

## Update Chrome Web Store URL

After extension is published, update the install button URLs in `index.html`:

```javascript
const chromeWebStoreUrl = 'https://chromewebstore.google.com/detail/autopsy/YOUR_EXTENSION_ID';
```

Replace `YOUR_EXTENSION_ID` with actual extension ID from Chrome Web Store.

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
├── index.html          # Main landing page
├── style.css           # Styles
├── icon48.png          # Favicon
├── icon128.png         # Hero icon
├── CNAME               # Custom domain config
├── screenshots/        # Screenshots for carousel
│   └── 01-main-interface.png
└── README.md          # This file
```
