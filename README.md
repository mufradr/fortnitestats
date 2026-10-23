# Daily Dive

An independent browser trivia game inspired by Krillion's Daily Dive loop. Original question packs and programmatically drawn pixel ocean artwork. No Fortnite code, data service, API credentials, paid providers, accounts, or build dependencies.

## Play

Seven daily prompts, 25 seconds each. Enter one answer per round. Valid answers score 10–100 points according to curated tiers, each point adding 10 metres of depth. Invalid guesses can be retried while the timer runs. Skips/timeouts score zero. Scores reflect author-assigned obscurity, not measured player popularity. All answers can be explored after finishing.

The UTC date deterministically chooses seven prompts from an original 14-question bank. The bank rotates combinations; it does not produce seven entirely new questions every day. Everyone receives the same selection. First-run progress/results stay in browser local storage, including the active round's absolute deadline. Reloading does not reset the clock; leaving a tab does not pause it. Subsequent runs are labeled practice and never overwrite the first daily result. No global leaderboard or anti-cheat system is claimed. Clearing browser storage resets local records.

Keyboard and touch controls; optional synthesized sound; reduced-motion support; clipboard sharing with a manual-copy fallback. The game uses its own question lists, code, and artwork, not Krillion's servers, assets, daily answers, or branding. Reference projects helped establish the general rules; this is not an exact replica or an affiliated client.

## Develop

```sh
npm start
npm test
```

No npm installation is required. Open the served site; JavaScript modules need HTTP, not a file:// URL. Tests cover daily determinism, answer aliases, scoring, round transitions, and saved state validation.

## Deployment

Pushes to main trigger the included GitHub Pages workflow. It tests and uploads only the public game assets. The existing site remains at https://mufradr.github.io/fortnitestats/; the repository name does not affect the game. No secrets or scheduled data refreshes are used. Older Fortnite work remains recoverable through Git history.
