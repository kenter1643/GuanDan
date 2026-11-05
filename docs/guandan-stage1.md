# GuanDan — Stage 1 foundation

Baseline: Tongzhuo (MIT license), `kenter1643/GuanDan`.

## Implemented
- Classic and simple rule-configuration values (no complete mode engine yet)
- Two-deck, 108 uniquely identified physical cards
- Fisher–Yates shuffle with injectable RNG and deterministic testability
- Four 27-card hands
- Preliminary **non-wildcard** combination recognition and comparison
- Vitest unit tests for the initial foundation

## Important limitations
This PR is an incremental foundation, **not a playable Guandan plugin**. It is deliberately not registered in the server or client.
- Classic heart-level wildcards / 逢人配 and configurable interpretations are missing.
- Tribute, anti-tribute, rank progression, over-A and complete official rules need additional validation.
- Full turn state machine, partner lead/接风, finish places and match-ending semantics are missing.
- No GameServerPlugin, GameClientPlugin, React H5 UI, reconnection or gameplay simulation yet.
- Rule details must be audited against the selected competition rules before release.
- Standalone rule matcher accepts only physical card input; the game server must verify player ownership.
- This PR does not add game-level events or modify the original Landlord game.

## Check
From repository root after `npm install`:
```sh
npm -w guandan test
npm run test
npm -w client run build
```
The above tests require a CI or local environment; uploading these files does not itself execute them.

## Follow-up PRs
1. Explicit wildcard substitution, rule-book examples and property-based tests.
2. Stateful server plugin, tribute, scoring, match lifecycle, privacy validation.
3. Responsive game board, client loader registration, four-browser E2E tests.
