# Releasing Autopsy

The whole path from a finished change to the Chrome Web Store.

## One-time setup (already done, 2026-10-19)

| Thing | Value |
| --- | --- |
| Chrome Web Store item | `fmlkjcobafbejgpkjkcgbhfgnlpdkegn` (the ID in the dashboard URL) |
| Publisher ID | `336057e6-06c8-40ef-bc40-8a9385934d59` (individual developer account, `scttfrdmn@gmail.com`) |
| Google Cloud project | `autopsy-publishing` (Chrome Web Store API and IAM Credentials API enabled) |
| Service account | `cws-publisher@autopsy-publishing.iam.gserviceaccount.com`, linked under Dashboard → Account → Service account |
| Auth | `scttfrdmn@gmail.com` has Token Creator on the service account; tokens come from `gcloud` impersonation, so there is no key file |

These IDs are in `scripts/cws.config.json`.

## Each release

1. **Version.** Bump `version` in **both** `package.json` and `public/manifest.json` (semver). The store rejects a version that isn't higher than the published one.
2. **Changelog.** Add a `## [x.y.z] - YYYY-MM-DD` section at the top of `CHANGELOG.md` and a link at the bottom.
3. **Docs.** Update the version badge in `README.md` and the "New in x.y" pill in `docs/index.html`. If features changed, update `README.md`, `STORE_LISTING.md` and, when permissions or storage changed, `PRIVACY.md`.
4. **Check.**
   ```bash
   npm run lint && npm test && npm run test:e2e
   ```
5. **Screenshots** (only if the UI changed):
   ```bash
   npm run screenshots          # → screenshots/ (store, 1280×800) and docs/img/ (website, 2×)
   npm run promo                # only if assets/promo-*.html changed
   ```
6. **Package.**
   ```bash
   npm run package              # → autopsy-vX.Y.Z.zip (fails if versions differ)
   ```
7. **Commit, tag, push, GitHub release.**
   ```bash
   git commit -am "chore: release vX.Y.Z"
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin main vX.Y.Z
   gh release create vX.Y.Z autopsy-vX.Y.Z.zip --title "vX.Y.Z - …" --notes-file <changelog section>
   ```
   Pushing `main` also updates autopsy.tools (GitHub Pages serves `docs/`).
8. **Submit to the store.**
   ```bash
   gcloud auth login            # only if the login has expired
   npm run cws -- submit --dry-run
   npm run cws -- submit        # uploads the zip and submits it for review
   npm run cws -- status        # PENDING_REVIEW → PUBLISHED
   ```
   Add `--staged` to `submit` to hold an approved version until you publish it from the dashboard. Use `npm run cws -- cancel` to withdraw a pending submission.
9. **Dashboard** (only when the listing changed). The API uploads packages only. Description, summary, screenshots (**at most five**; the order is in `STORE_LISTING.md`), promo images and permission justifications are edited by hand at <https://chrome.google.com/webstore/devconsole>. Staged copies of the images live in `../autopsy-store-assets/`.

## Troubleshooting

- **`403 Permission denied` from `npm run cws`.** The item or publisher ID is wrong, or the service account isn't linked in the dashboard (Account section; only one is allowed per publisher). Check the token with:
  `curl "https://oauth2.googleapis.com/tokeninfo?access_token=$(gcloud auth print-access-token --impersonate-service-account=cws-publisher@autopsy-publishing.iam.gserviceaccount.com --scopes=https://www.googleapis.com/auth/chromewebstore)"`
  The token should show the service account's email and the `chromewebstore` scope.
- **`invalid_grant` / `Reauthentication failed`.** Run `gcloud auth login`.
- **`Version … is not newer`.** Bump the version (step 1).
- **`… is already in review`.** Wait for review, or run `npm run cws -- cancel`.
