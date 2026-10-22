# Dropzone — Fortnite competitive hub

A responsive, static Fortnite dashboard built with HTML, CSS, and JavaScript. Includes region and mode filters, saved tournaments (browser local storage), searchable sample player rankings, sortable wins, and external Fortnite Tracker player lookup.

**Data is illustrative:** every displayed event and player is fictional. This application does not fetch live statistics. The lookup form opens Fortnite Tracker in a new tab; it does not import or verify their data. Saved events remain on the current browser and are not synced.

## Develop

No dependencies or build step. From this checkout:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Open the site through your development environment. Google Fonts is optional; system fonts provide a fallback. No API keys are required.

## GitHub Pages

1. Push these files to `main` on `mufradr/fortnitestats`.
2. In repository **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source.
3. The included `Deploy to GitHub Pages` workflow deploys on each push to `main`, or via **Actions → Run workflow**.
4. After a successful deployment, the site is available at `https://mufradr.github.io/fortnitestats/`.

All application assets use relative paths so the project Pages subpath works. Only the three public application files are uploaded. Deployment requires repository Pages permissions and is not performed by local development.

For real tournament schedules and player stats, integrate a licensed data provider through a backend or scheduled server-side job that publishes sanitized public JSON. Never embed private API keys in this static site or Pages assets. Epic Games and Fortnite are trademarks of their respective owners; this is an independent fan project.
