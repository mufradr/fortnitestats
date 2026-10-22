# Plan to first real functionality

Prepared 2026-10-22. Timelines are engineering estimates, not elapsed-time promises. Authentication, Epic access approval, current API compatibility, and user configuration are external dependencies.

## Milestone 1: independently sourced cup tracker

Acceptance: the public Pages URL opens; real Eval/Division (or other returned) cup sessions load with dates/regions; one or more started sessions show actual Epic rank/points and readable names where available; timestamps and limited coverage are visible; an expired token does not erase the last published good snapshot.

Implemented:

- GitHub Pages site currently responds HTTP 200; GitHub reports build_type=workflow and status=built.
- Direct Epic event/standings adapter, without Osirion.
- Automatic selection of up to three active/recent sessions, avoiding a mandatory manually copied window ID.
- Up to two standings pages per session, duplicate-team removal, and up to 100 account IDs per name-lookup request.
- Per-session standings selection, direct card links, name/team search, and coverage reporting.
- Restoration of the previous public snapshot before a deployment refresh, so a fresh runner can retain valid data when credentials expire.
- Contract tests and browser validation. These use documented fixtures, not evidence of live Epic access.

Remaining:

1. Establish a legitimately authorized Fortnite-capable Epic session; configure EPIC_ACCESS_TOKEN as an Actions secret and EPIC_ACCOUNT_ID as an Actions variable. An arbitrary EOS app token is insufficient. Do not submit passwords/tokens through chat.
2. Exercise an authenticated fetch against current Epic services; correct any schema/access differences based on observed responses.
3. Run the deployed workflow and verify real session IDs, points, names, timestamp, and selected-region coverage in the public site.

Estimate: 1–2 working days after valid authorized Epic access is available, allowing for integration fixes and deployment verification. The existing software could display data sooner if the documented endpoints match, but live functionality cannot be promised before authentication is tested. Waiting for account/API permissions is additional and unbounded.

## Milestone 2: reliable unattended updates

Acceptance: repeated collection succeeds without manually replacing expired tokens, failures are visible, and snapshots/history survive deployments.

Work: choose and validate an authorized token renewal process; securely persist any rotating credential; scheduled collectors with rate-limit/backoff handling; persistent snapshots; credential-expiry monitoring; more regions and pagination as permitted. The current bearer-token adapter does not perform renewal.

Estimate: 2–5 additional working days after a supported renewal method is established. Do not claim permanent automation from a short-lived access token alone.

## Milestone 3: replay-derived analytics

Acceptance: a consenting user's current-season replay is parsed into a verified match report, with documented telemetry coverage.

Work: test an existing independent parser against a real replay; add upload storage and background workers; normalize match events; then add elimination timelines and 2D review. Tournament-wide analysis additionally needs an authorized source of server replays. Local perspective replays cannot be assumed to contain every player's events.

Estimate: 1–2 weeks for a basic upload-and-report prototype after obtaining representative files, if the parser supports the current game version. Broad Osirion-style coverage is a larger multi-week project with ongoing parser maintenance.

## Immediate user action

Confirm whether an authorized Epic session is already available. If yes, configure it securely in repository Actions settings. If no, the next step is evaluating an authorized authentication route and its Fortnite scopes; do not obtain random shared tokens or embed third-party application secrets. See README.md for exact settings.
