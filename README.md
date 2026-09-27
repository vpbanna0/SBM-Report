# SBM Report — Google Drive Edition

Swachh Bharat Mission (Gramin) GP-wise report dashboard. Data source is a
Google Drive `.xlsm` workbook (OneDrive integration has been fully removed).

## Data flow

1. `scripts/build-static-data.js` downloads the workbook from Google Drive,
   verifies its ZIP magic header (`PK\x03\x04`) so an HTML error/virus-scan
   page never corrupts the output, parses the `Census`, `Ration HH`,
   `All IHHL Data` and `CSC Status` sheets, and writes
   `public/data/workbook.json` (with an IST `lastUpdated` timestamp).
2. `public/data-handler.js` fetches that JSON with cache-busting
   (`?t=timestamp`, `cache: 'no-store'`) so the browser never shows a stale
   cached copy.
3. `public/app.js` renders the dashboard and drives the client-side PDF
   export (html2canvas + jsPDF — no server-side Puppeteer needed).

## Run locally

```bash
cp .env.example .env   # optional: override GOOGLE_DRIVE_FILE_ID / PORT
npm install
npm run build:data     # one-off snapshot
npm start               # Express server: serves /public, background auto-sync
```

- `GET/POST /api/refresh` — force an immediate re-sync from Google Drive.
- `GET /api/status` — last sync status/metadata.
- Background sync runs automatically every `SYNC_INTERVAL_MINUTES`
  (clamped to 15–30 minutes, default 20).

## GitHub Pages (always-on) deploy

`.github/workflows/deploy.yml` runs hourly (`cron: '0 * * * *'`), on every
push to `main`, and on manual `workflow_dispatch`. Each run:

1. Rebuilds `public/data/workbook.json` from Google Drive.
2. Commits it back to the repo if the data changed (keeps the schedule
   alive past GitHub's 60-day inactive-repo cron cutoff).
3. Deploys `./public` to GitHub Pages.

Steps to set up:

1. Push this project to a GitHub repository (`main` as default branch).
2. In `Settings > Pages`, set the source to **GitHub Actions**.
3. (Optional) In `Settings > Secrets and variables > Actions > Variables`,
   add `GOOGLE_DRIVE_FILE_ID` to override the default file ID without
   touching code.
4. Run the workflow once manually from the **Actions** tab (or push to
   `main`).
5. Site URL: `https://<github-username>.github.io/<repo-name>/`

### Important

- The Google Drive file's sharing setting must be **"Anyone with the
  link" (Viewer)** or the download will fail.
- GitHub Pages is static hosting, so the published `workbook.json` is
  publicly accessible to anyone with the link.
