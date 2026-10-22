# Dropzone — Fortnite tournament statistics

Static Fortnite tournament dashboard, configured for GitHub Pages. Displays recent Osirion-indexed tournament sessions, Eval/Performance Evaluation and Division Cup filters, region/mode filters, browser-local saved sessions, and searchable replay-derived player statistics for a selected event window.

**No fictional results.** Until a provider is configured, the site displays an explicit disconnected state. This integration indexes available replays; it is not a complete upcoming calendar, an official points leaderboard, or an instant live feed. See [source research and limitations](docs/data-sources.md).

## Connect real data

1. Create an [Osirion account](https://osirion.gg/app/settings), review its API terms, generate an API key, and fund API credits. Requests consume credits; current pricing is set by Osirion.
2. In GitHub repository **Settings → Secrets and variables → Actions**, add a repository **secret** named `OSIRION_API_KEY`. Never put the key in source files or chat.
3. Optionally add a repository **variable** `OSIRION_EVENT_WINDOW_ID` with the exact event window you want player stats for (obtain it from the tournament cards after the first refresh). The player table uses this one window. Without it, only the recent tournament index is fetched.
4. Select **GitHub Actions** in **Settings → Pages → Build and deployment**.
5. Run **Actions → Deploy to GitHub Pages → Run workflow**. Verify the refresh succeeds. Each refresh makes one tournament request and optionally one player request; the response is limited to 50 sessions and 100 player rows.
6. For recurring refreshes, explicitly set the repository Actions **variable** `OSIRION_SYNC_ENABLED` to `true`. This enables paid refreshes roughly every two hours. Pushes/manual runs also refresh when the key exists. Remove/disable the variable to stop scheduled requests.

After deployment: https://mufradr.github.io/fortnitestats/. All assets and JSON paths support the Pages project subpath. Only public site assets and the sanitized data snapshot are deployed. Failed data refreshes fail deployment and leave the last deployed site intact. The UI exposes the snapshot timestamp and flags data older than three hours.

## Local development

No dependencies/build required. From the checkout:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
node --test tests/sync-data.test.mjs
node --check app.js
```

For an authenticated refresh, securely provide `OSIRION_API_KEY` in the shell environment, optionally `OSIRION_EVENT_WINDOW_ID`, then run `node scripts/sync-data.mjs`. This consumes API credits and replaces the local public snapshot. Do not commit private/raw provider responses. Browser filters and saved sessions work locally. Font downloads are optional; system fonts are the fallback.

## Data interpretation

- Only sessions indexed by Osirion in a bounded 14-day query are displayed. Eval and Division sessions appear when present in the provider response.
- Identifiers, rather than invented names, identify the tournament and exact session.
- Player statistics reflect parsed replays, not all lifetime Fortnite stats. Eliminations sorting is not official tournament rank. Missing metrics display `—`.
- There is no browser-side API-key form. Arbitrary live player lookup remains an external Fortnite Tracker link.
- No authenticated live-provider fetch was possible during implementation because no key was configured. Provider contracts were verified against Osirion's published SDK; tests mock the documented responses. See the research document for network restrictions and current-access uncertainties.

Independent fan project; not affiliated with Epic Games, Tracker Network, or Osirion.
