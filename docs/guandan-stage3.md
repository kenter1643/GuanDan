# GuanDan H5 stage 3 — Simple multiplayer integration

## Included
- Server plugin registered as `guandan-simple` (four-player room).
- Client lazy-loads the matching H5 plugin.
- Responsive React/CSS four-person table, touch-friendly selection, play/pass controls.
- Client result projects the winning player onto the team role used by the original Tongzhuo end screen.
- `client`, `server` and `guandan` workspace dependencies and lockfile updated.
- Plugin-level automated tests for room metadata, private-state redaction and team victory view.

## Test commands

```bash
npm ci
npm -w guandan test
npm run test
npm -w client run build
npm run dev
```

The first tests and build have **not been run on the complete GitHub checkout** from this environment. The existing isolated TypeScript core smoke test passed; this is not a substitute for the above gates or actual multiplayer E2E tests.

## Playtest steps
1. Start the server and H5 Vite client.
2. Login with four separate accounts or browser profiles.
3. Create a `guandan-simple` room, invite three peers and start after all are ready.
4. Test basic play/pass, card ownership validation, turn rotation, first-finisher partner lead, duplicate cards and team win.
5. Test at iPhone, Android, desktop widths; verify reconnect and private-hand isolation.

## Known limitations — do not call this production ready
- Classic mode is **not** registered; 逢人配/贡还牌/升级/过A remain unimplemented.
- Simple mode's rules remain an MVP subset pending official/reference rule review.
- Team play winner notification requires full end-to-end verification.
- Client shows last public play only, not comprehensive historical tricks.
- No card suggestions, automated timeout handling, match history, spectator mode or tournament features.
- Rate limiting, replay protection, reconnect and persistent match storage require an infrastructure-level audit.
- Mobile Safari, Android Chrome, LAN networking and multi-device synchronization have **not** been verified.
