# Dropzone — independent Fortnite tournament tracker

Static site with a direct Epic Games Events Service adapter. No Osirion, paid provider, or fabricated tournament data is used. It supports event windows (including Eval and Division Cups returned by Epic), region/mode/type filtering, saved sessions, and bounded official team standings for active/recent sessions.

## GitHub Pages

Pages is enabled and the public URL has been verified to return HTTP 200. The workflow publishes the static site and collected data. For a new repository, configure it as follows:

1. Open https://github.com/mufradr/fortnitestats/settings/pages.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open **Actions → Deploy to GitHub Pages** and rerun the latest workflow.
4. After a successful deployment, visit https://mufradr.github.io/fortnitestats/.

This setting requires repository administrator access. The default workflow `GITHUB_TOKEN` cannot perform initial enablement. If you prefer automated enablement, a securely configured Actions secret `PAGES_ADMIN_TOKEN` with the required Pages/repository administrative permission enables the supported configure-pages option. Do not put tokens in source or chat. No custom domain is needed. Project-relative asset and JSON paths are used.

Site deployment is independent of Epic authentication: missing/expired data credentials do not prevent HTML and assets from deploying. Without data credentials, the site explicitly says data is disconnected.

## Connect directly to Epic

Epic provides tournament metadata and leaderboard data through its authenticated Events Service. An arbitrary Epic Online Services application token does **not** automatically grant access to Fortnite player/tournament services. You need a legitimately obtained Epic user session authorized for the Fortnite scopes, and its account ID. No third-party client secrets or extracted credentials are bundled here.

In repository **Settings → Secrets and variables → Actions**:

- Secret `EPIC_ACCESS_TOKEN`: an authorized, unexpired Epic bearer access token. Never share the token in chat or browser code.
- Variable `EPIC_ACCOUNT_ID`: the matching 32-character Epic account ID.
- Optional variable `EPIC_REGION`: `EU` (default), `NAC`, `NAE`, `NAW`, `ASIA`, `OCE`, `BR`, or `ME`.
- Optional variable `EPIC_EVENT_WINDOW_ID`: an exact session ID from a tournament card to override automatic selection. By default, up to three active/recent sessions are selected, with up to two pages each.
- Optional variable `EPIC_SYNC_ENABLED=true`: enables approximately two-hour scheduled refreshes. This alone does not renew tokens.

Run the Pages workflow manually after setting credentials. Access tokens expire: replace them through your own authorized Epic authentication process. Unattended token renewal is **not implemented**. This adapter is ready to accept a valid session, but no authenticated live response has been validated in the development environment. See [research and limitations](docs/data-sources.md).

## Development and tests

No dependency installation or build step is required:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
node --check app.js
node --test tests/sync-data.test.mjs
```

For an authorized local data refresh, securely inject the variables above and run `node --use-env-proxy scripts/sync-data.mjs` with Node 24 in this managed environment. The script requests Epic directly, selects public fields, and atomically writes `data/tournaments.json`. It never publishes the token or account authentication response. Failed refreshes preserve the existing file. Actions first restores the last valid published snapshot. If refresh fails, it republishes that snapshot with its original timestamp, or the disconnected state when none exists.

## Coverage

The event list reflects the configured region, account eligibility, and Epic's available public event windows. Up to two pages for each of three selected sessions are fetched, with page coverage shown. Account names are resolved in batches; inaccessible names fall back to IDs. Rows are teams ranked by Epic's `rank`; points use `pointsEarned`, never the packed internal `score`. Lifetime player statistics are not yet implemented. Missing metrics remain blank (`—`). This is a periodic snapshot, not instant live updates or a guarantee of every tournament.

Independent fan project, not affiliated with Epic Games.

See [implementation plan and timeline](docs/implementation-plan.md) for milestones and the remaining authentication prerequisite.
