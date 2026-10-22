# Independent Epic data integration

Updated 2026-10-22. The previous Osirion adapter has been removed at the user's request.

## Data source

The implementation uses Epic's own Events Service:

- `GET https://events-public-service-live.ol.epicgames.com/api/v1/events/Fortnite/download/{accountId}?region=EU&platform=Windows&teamAccountIds={accountId}`: event definitions, sessions, and templates.
- `GET https://events-public-service-live.ol.epicgames.com/api/v1/leaderboards/Fortnite/{eventId}/{eventWindowId}/{accountId}?page=0&showLiveSessions=false&appId=fortnite`: official team standings.

Both require an authorized Epic bearer token with appropriate Fortnite account/profile scopes. Direct Epic access is independent of Osirion, but it is not an unauthenticated public API. Session expiration and access restrictions must be respected. No borrowed application credentials or authentication bypass is implemented.

Community references inspected:

- [Event download schema](https://github.com/LeleDerGrasshalmi/FortniteEndpointsDocumentation/blob/6fc50b2c43aac4e0abf39132dbe088555162121e/EpicGames/EventsService/Events/Data/Download.md).
- [Official-service leaderboard route](https://github.com/LeleDerGrasshalmi/FortniteEndpointsDocumentation/blob/6fc50b2c43aac4e0abf39132dbe088555162121e/EpicGames/EventsService/Events/Leaderboard.md).
- [fnbr.js TournamentManager](https://github.com/fnbrjs/fnbr.js/blob/master/src/managers/TournamentManager.ts) independently uses the download route with the user's Fortnite session.
- [fnbr.js response types](https://github.com/fnbrjs/fnbr.js/blob/master/resources/httpResponses.ts) describe leaderboard ranks, `pointsEarned`, team account IDs, and session history. These are community references, not an Epic guarantee of API stability.

Osirion's published SDK documents replay ingestion and server-replay-derived stats, which explains how it offers match-level analytics beyond standard leaderboard points. This does not prove its entire internal architecture or Tracker's data pipeline. Reproducing such analytics independently would additionally require authorized replay acquisition, replay parsing/version support, storage, and a backend; that infrastructure is not part of this static site. The implemented independent path is Epic tournament metadata and official standings.

## Pages failure diagnosis

[Deployment run 39856218670](https://github.com/mufradr/fortnitestats/actions/runs/39856218670) reports `Get Pages site failed ... Not Found` at Configure Pages. Pages must first be enabled by a repository administrator. The [official action configuration](https://github.com/actions/configure-pages/blob/v5/action.yml) explicitly says initial `enablement` requires a token other than the built-in `GITHUB_TOKEN`. A default workflow cannot fix this repository setting by itself. The workflow supports optional admin-token enablement and otherwise provides the exact Settings link on failure.

## Verified versus blocked

Contract tests exercise documented event/window fields, official points mapping, bearer authentication, invalid selected windows, and failure preserving existing snapshots. Browser checks cover loading/disconnected states, filters, team table, escaped text, saved sessions, and mobile layout. Neither the current authenticated Epic route nor the live Pages URL can be verified from this environment: external destinations are blocked by its egress proxy, GitHub API access is blocked, and no Epic token is configured. Public GitHub action pages were readable and supplied the Pages error above. Required network domains were saved to the environment draft, which does not itself apply network changes.

No data refresh was performed with a real user credential. The site never labels fixtures or missing data as real results. Authentication setup and initial Pages enablement remain explicit external prerequisites.
