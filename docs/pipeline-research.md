# Reconstructing Fortnite data pipelines

Research checked 2026-10-22. This report distinguishes evidence from inference. No private accounts, private application endpoints, or challenge bypasses were used.

## Osirion: directly confirmed

The current https://osirion.gg/faq says:

- Match reports can follow an uploaded replay or a match tracked with the desktop app.
- Analysis runs in the cloud; the desktop app runs in the background.
- Old replay files are supported, subject to parsing compatibility.
- Tournament matches can be tracked regardless of the player's platform.
- Epic account linking grants basic account ID, username, and preferred language access. Linking alone should not be assumed to expose detailed match telemetry.

The publisher's @osirion/api 2.0.1 package (https://www.npmjs.com/package/@osirion/api) confirms this sequence:

1. GET /fortnite/v1/uploads/url produces a signed upload URL and tracking ID.
2. The SDK PUTs replay bytes to that signed URL as application/octet-stream.
3. GET /fortnite/v1/uploads/status?trackingId=... reports parsing status and eventual match ID.
4. Match and match-event endpoints expose structured results.
5. The README calls tournament player statistics “stats from server replays” and gives S34_PerformanceEvaluation_Event1Round1_EU as an example.

Thus replay ingestion and parsing are confirmed. A queue, workers, object storage, database, cache, and aggregations are sensible implementation choices for our own system, not a verified inventory of Osirion's private infrastructure. Exactly how it acquires each tournament server replay, whether it has special publisher agreements, and which undocumented Epic routes it might use were not established. Do not claim those details as discoveries.

## Epic: independently usable source model

Community route references at https://github.com/LeleDerGrasshalmi/FortniteEndpointsDocumentation and the open-source fnbr.js implementation corroborate:

- Events Service event downloads return event IDs, session/window IDs, dates, regions, templates, scoring definitions, and eligibility metadata.
- Events Service window leaderboards return official team rank, pointsEarned, account IDs, and session histories. The internal score is a packed sorting value; it is not the number of displayed tournament points.
- Stats Proxy statsv2 account data returns aggregate statistics keyed by playlist/input/stat. It requires fortnite:stats READ. Private stats can return HTTP 204.
- Account Service resolves display names and Epic account IDs with appropriate authentication.

Example aggregate stats route: https://statsproxy-public-service-live.ol.epicgames.com/statsproxy/api/statsv2/account/{accountId}.

These are authenticated Fortnite services. An unrelated EOS client-credentials token does not establish access. The existing site adapter implements event windows and one standings page, but no valid Epic session was available for an authenticated end-to-end check.

## Fortnite Tracker: narrower evidence

The historical third-party fortnite npm package documents a Tracker API key and calls Tracker's own player API. That proves a historical consumer API existed, not the current internals of its ingestion system. Current requests to fortnitetracker.com/site-api and tracker.gg/developers/docs/titles/fortnite returned HTTP 403 challenge pages.

An Epic-statistics collector plus tournament polling and historical snapshots is a plausible independent architecture for Tracker-like features. This research does not confirm Tracker's exact current endpoints, access agreements, polling intervals, replay usage, ranking formula, or infrastructure.

## Independent implementation path

Phase 1: authorized Epic authentication; region event-window collection; selected-window standings polling; account-ID/display-name resolution; historical snapshots keyed by eventId/eventWindowId/team. Store timestamp and coverage and respect missing/private data. Poll shared events rather than issuing one request per website visitor. GitHub Pages can serve published JSON; tokens stay server-side. Unattended operation still needs authorized session renewal.

Phase 2: collect replay files from consenting users. A Windows uploader can watch %LOCALAPPDATA%/FortniteGame/Saved/Demos and upload newly completed files. Deduplicate using file/match identifiers. Parse in a background worker and aggregate only what the replay actually contains. Local perspective replays may not contain all-player telemetry; do not assume they equal tournament server replays.

Potential independent parsers:

- https://github.com/Shiqan/FortniteReplayDecompressor — MIT-licensed C# parser. Its current README requires .NET 10.0 and documents ReplayReader.ReadReplay. Repository inspected at 76f74c1f640069afdba71b6468e2f819327893c2.
- https://github.com/xNocken/replay-reader — Node alternative linked by the C# project and the fortnite-replay-parser npm package.

Neither parser was installed or tested against a current replay during this research. Evaluate a real, authorized current-season file before choosing one. Replay formats and network schemas change between game updates; parsing support must be tested and maintained.

Phase 3: obtain tournament replay coverage through an authorized source, then add 2D replay views, movement paths, elimination timelines, loot and damage analytics. Replay availability and completeness, parser maintenance, credential renewal, and storage/compute costs are the substantive engineering work. Merely duplicating another website's HTTP frontend will not provide that pipeline.

Reference architecture (a recommendation, not a claim about either company):

Epic events/stats -> authenticated collector -> normalized database -> public API/JSON -> GitHub Pages
User replay files -> upload storage -> parsing workers -> match database -> aggregations -> public API/JSON

No application code was changed as part of this research report.
