# SBM Report

This project can run in two modes:

- `Local server mode`: `node server.js`
- `GitHub Pages mode`: a GitHub Actions workflow downloads the OneDrive workbook, builds a static snapshot, and publishes the site

## GitHub Pages deploy

1. Create a new GitHub repository, preferably with `main` as the default branch.
2. Upload this project to that repository.
3. In the repository, add an Actions secret named `ONEDRIVE_URL`.
4. In `Settings > Pages`, set the source to `GitHub Actions`.
5. Run the `Deploy GitHub Pages Snapshot` workflow once from the `Actions` tab, or push to `main`.
6. Your site URL will be:

```text
https://<github-username>.github.io/<repo-name>/
```

## Important note

GitHub Pages is static hosting, so the published workbook snapshot becomes publicly accessible to anyone with the link. If you need the workbook data to stay private, use a full backend host instead of GitHub Pages.

