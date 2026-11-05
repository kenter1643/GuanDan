# GuanDan Stage 2: Simple-mode server engine

This PR adds an independent four-player, two-team **single-round** state machine.

Implemented:
- 2-v-2 opposing seat pairs 0/2 vs. 1/3, four 27-card hands.
- Pure play/pass transitions, ownership/turn validation, finish order, double-up detection.
- Pass-loop resetting and partner lead after a finished last-player (接风).
- Per-player client-state redaction.
- Guandan simple server plugin (not yet registered until an H5 UI exists).
- Vitest tests for turn validation, privacy and selected trick completion rules.

Not production-ready:
- Classic wildcard substitution, tribute/anti-tribute, rank progression and over-A are unimplemented.
- No H5 renderer or four-browser E2E test.
- The existing platform end screen judges a single winner player ID; team victory UX needs adaptation.
- Action idempotency, state version checks and cross-room authentication require integration-level audit.
- Tests require GitHub CI/local full project run; local standalone TypeScript core compiler and smoke test were performed separately.

Verification commands:
```sh
npm install
npm -w guandan test
npm run test
npm -w client run build
```
