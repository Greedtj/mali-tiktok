# Mali TikTok Studio

Static landing page for TikTok Developer setup and review.

The site explains the app purpose, TikTok API permissions, privacy policy, terms of use, data deletion flow, and owner contact details for a short-video automation project that creates 5-10 second slow-life vlog content and uploads approved videos to TikTok.

## Local preview

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

## GitHub Pages

This repository includes a GitHub Actions workflow that publishes the static site to GitHub Pages from the `main` branch.

After pushing to GitHub:

1. Open repository settings.
2. Go to Pages.
3. Set Source to GitHub Actions.
4. Wait for the `Deploy static site to GitHub Pages` workflow.

The public URL will be:

```text
https://<owner>.github.io/<repo>/
```
