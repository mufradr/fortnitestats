# Fortnite data sources and integration decisions

Research date: 2026-10-22.

## What could be verified

**Osirion:** the publisher-maintained [`@osirion/api` package](https://www.npmjs.com/package/@osirion/api), version 2.0.1, documents replay uploads, parsed match data, and tournament player statistics derived from server replays. Its README explicitly demonstrates `S34_PerformanceEvaluation_Event1Round1_EU`. Its shipped implementation and TypeScript types define:

- `GET https://api.osirion.gg/fortnite/v1/tournaments` → `{ tournaments: [{ eventId, eventWindowId, startTime, endTime, totalMatches, parsingProgress }] }`.
- `GET https://api.osirion.gg/fortnite/v1/tournaments/stats?eventWindowId=…` → `{ players: […] }`, including `epicId`, `epicUsername`, `matchesPlayed`, `eliminations`, `avgPlacement`, and `damageToPlayers`.
- Authentication: `Authorization: Bearer <API key>`. The account requires API credits; request charges and pricing are controlled by Osirion and may change. Account/API configuration: https://osirion.gg/app/settings. Review https://osirion.gg/legal for permitted publication and usage before enabling.

This is evidence for replay-based statistics, not evidence that Osirion offers complete official points standings, every event, every player, or a complete upcoming calendar. The site therefore calls this a recent replay index and never synthesizes wins, K/D, points, or win rates from unrelated fields.

**Epic Games:** the community-maintained [FortniteEndpointsDocumentation](https://github.com/LeleDerGrasshalmi/FortniteEndpointsDocumentation/tree/6fc50b2c43aac4e0abf39132dbe088555162121e/EpicGames/EventsService) describes Epic's Events Service: event definitions/windows and window leaderboards. Both require scoped authentication. This documents the underlying tournament data model, but does not establish which private integrations Tracker or Osirion use. The same repository documents an unauthenticated Fortnite competitive website events route. That route's current response and availability could not be verified, so it is not integrated as though it were tested.

**Fortnite Tracker:** the historical third-party [`fortnite` npm package](https://www.npmjs.com/package/fortnite) points to https://fortnitetracker.com/site-api and requires a Tracker API key for player statistics. This is historical evidence only; it does not establish present availability, tournament support, or Tracker's internal ingestion architecture. The direct Tracker developer documentation was inaccessible in this environment. No Tracker private web endpoints, scraping, authentication bypass, or unsupported API claims are used here. Player lookup remains an external link.

## Verification limits

Direct requests to Tracker, Osirion, FortniteAPI.io, Fortnite-API, and Fortnite's documentation/websites were denied by this environment's egress proxy. The required domain additions were saved in the environment configuration draft. Public GitHub documentation and the official published Osirion SDK were accessible. No provider key was configured in the machine or environment metadata. Thus the adapter has contract tests based on published SDK fields, but no authenticated live-provider response has been validated. API fields or access may have changed since the published SDK; test a real refresh before relying on production data.

## GitHub Pages architecture

A browser on GitHub Pages cannot safely hold provider secrets. A GitHub Actions job fetches data with the API key, selects only public fields, and includes `data/tournaments.json` in the Pages artifact. No private key is embedded in JavaScript, output JSON, or source control. Refresh failure fails deployment so a previously deployed snapshot stays intact, with its original timestamp. A run without a key publishes the explicit unconfigured state rather than fake results. Snapshots are not committed back to the repository.

One refresh makes one tournament request (first 50 windows in the last 14 days), plus one optional player request (first 100 records for the configured event window). This is bounded coverage, not an exhaustive leaderboard. Eval and Division filters classify provider identifiers; an unrecognized mode or region stays unspecified. The upstream index is replay-driven, so absent Eval/Division sessions cannot be inferred to be cancelled or nonexistent.

Automatic polling is disabled until `OSIRION_SYNC_ENABLED=true` is set in repository Actions variables. With that opt-in, the workflow refreshes approximately every two hours (GitHub schedules can be delayed). Pushes and manual dispatches refresh whenever an API key is configured and may consume credits. Disable recurring polling by removing or setting that variable to `false`. No billable API calls were made during implementation.
