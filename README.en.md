[简体中文](README.md) | **English**

# Tape Games | Multiplayer Card & Board Games

**Tape Games** (Chinese: Tape 棋牌) is an extensible multiplayer card and board game platform built on the open-source [Tongzhuo](https://github.com/NFraw/Tongzhuo) codebase. It targets web/H5 mobile browsers and Electron desktop clients through a **TypeScript monorepo, server-authoritative game plugins, and Socket.IO real-time transport**.

> **Status:** Active development. A merged feature is not necessarily verified in a full build or multi-device E2E test. Simplified Guandan is integrated but still needs verified four-player browser/mobile acceptance; classic Guandan remains incomplete. Binance, OKX, and TokenPocket have injected-wallet **connection UI only**, wallet-signature signup/login is under development but not yet verified or enabled. TapeAPI 3.0 is planned, **not integrated**.

## Games and product modules

| Module | Status | Details |
| --- | --- | --- |
| Multiplayer lobby | Implemented, E2E pending | Room creation, join links, ready/start, reconnect |
| Landlord (Dou Di Zhu) | Existing plugin | Three-player Chinese card game with PixiJS rendering |
| Guandan Simple | Integrated, E2E pending | Four-player 2v2, 108 cards, 27 cards per player, play/pass, partner lead and single-round result |
| Guandan Classic | Planned | Wildcard heart level cards, tribute/return, upgrades and passing Ace are not complete |
| Huiming | Existing plugin | 2–4 player strategic card game |
| Nimmt! | Existing plugin | Multiplayer strategy card game |
| Account/password | Existing backend | SQLite user store, scrypt password hash, HMAC login tokens |
| Binance / OKX / TokenPocket | Connect UI implemented | EIP-6963 and injected EIP-1193 wallets; no wallet login |
| TapeAPI 3.0 | Design only | Future signed/verified read-only service adapter |
| Wallet registration | In development, not deployed | EIP-4361 challenge and account mapping; verifier dependency and acceptance tests pending |

## Technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Web/H5 | React 19, TypeScript, Vite 6 | Lobby and responsive gameplay |
| Visuals | PixiJS 8, GSAP 3, CSS | Canvas game visuals and animation, React/CSS for Guandan Simple |
| Real-time | Socket.IO 4 | Rooms, game actions, state fan-out, reconnection |
| Backend | Node.js, Express, TypeScript | REST endpoints and game lifecycle |
| Storage | SQLite, better-sqlite3, WAL | Users and account-related records; most live game states remain in server memory |
| Desktop | Electron 35, electron-builder | Optional desktop shell |
| Engineering | npm workspaces, Vitest 3, GitHub Actions | Monorepo, rule tests and build checks |
| Wallet connect | EIP-1193, EIP-6963 | Provider discovery and address/chain connection |
| Wallet authentication (planned) | EIP-4361 SIWE | Signed one-time challenges and account binding |
| Tape services (planned) | TapeAPI 3.0 | Verified, read-only API responses; **not implemented** |

## Architecture

```text
   React H5 / mobile web        Electron desktop
               \                 /
             Client app / lobby / wallet connect
                           |
                    HTTP + Socket.IO
                           |
                    Node.js / Express
           +---------------+-----------------+
        UserStore       RoomManager       PluginLoader
      SQLite / auth     Room sessions     Game registry
                                              |
                                     GameServerPlugin
                              +---------------+------------+
                            Landlord        Guandan      Other games
                                              |
                              Per-player sanitized state
                                              |
                                 game:stateUpdate (private)
```

The client emits `game:action`. The server verifies the player and room, delegates game validation to `GameServerPlugin.handleEvent`, and publishes **player-specific** state via `getClientState`, hiding opponents' hands. The `GameClientPlugin` supplies a React game component and may provide an optional PixiJS renderer.

The existing game stack is game-agnostic, with one authoritative game state per room and browser clients consuming filtered snapshots. Disconnection and team-forfeit paths still require full network acceptance testing.

## Repository layout

```text
GuanDan/
├── packages/core/
│   ├── shared/             # Types and game plugin interfaces
│   ├── server/             # REST auth, Socket.IO, rooms
│   └── client/             # Hooks, socket client and canvas infrastructure
├── games/
│   ├── guandan/            # Four-player engine, rules, H5 game and tests
│   ├── landlord/
│   ├── huiming/
│   └── nimmt/
├── client/
│   └── src/wallet/        # Binance, OKX and TokenPocket connector UI
├── server/                 # Node entry point
├── desktop/                # Electron app
├── docs/
└── .github/workflows/
```

## Development

Use Node.js 24 (the version selected by the repository CI) with npm:

```bash
git clone https://github.com/kenter1643/GuanDan.git
cd GuanDan
npm ci
npm run dev
```

The API/Socket.IO server defaults to port **3000** and the Vite frontend to **5173**. Open `http://localhost:5173`. For mobile LAN tests, expose the development server appropriately and verify routing to the backend. Use HTTPS/WSS in production.

```bash
npm run dev:server
npm run dev:client
npm run test
npm -w client run build
npm run build
npm run server
```

The project cannot be called production-ready until `npm ci`, `npm run test`, and the frontend build pass, followed by a real four-user E2E test on desktop and mobile, including reconnect, turn validation, privacy and team results. A CI workflow file alone does not establish that checks have passed.

## Wallet connection, registration and TapeAPI 3.0

The three wallet buttons connect to injected EVM providers. Some mobile environments require the wallet's in-app DApp browser; WalletConnect/deep-link support for ordinary mobile browsers is not yet implemented. **Connecting an address is not an authenticated login. Verified signature signup is under development and is not available until the server verifier is installed and tested.** Password-based accounts remain the available login flow.

Secure wallet signup will require server-issued, short-lived, single-use EIP-4361 (SIWE) challenges; verified signatures, origin/domain/chain/address matching; and atomic SQLite account binding. Never ask for seed phrases, private keys, token approvals, or payments for login.

TapeAPI 3.0 is a separate future integration for verified service responses and on-chain information. It does not replace game session authentication, and no automatic paid API call is part of wallet connection.

See [wallet & TapeAPI 3.0 design](docs/wallet-tapeapi-v3.md).

## Additional documentation

- [Architecture](docs/architecture.md)
- [Guandan: Stage 1](docs/guandan-stage1.md)
- [Guandan: Stage 2](docs/guandan-stage2.md)
- [Guandan: Stage 3](docs/guandan-stage3.md)
- [Guandan: Multiplayer acceptance plan](docs/guandan-validation.md)
- [Wallet & TapeAPI 3.0 design](docs/wallet-tapeapi-v3.md)

## License and attribution

Tape Games builds on [Tongzhuo](https://github.com/NFraw/Tongzhuo) and preserves its [MIT license](LICENSE) and copyright notice. Third-party audio and artwork must be properly licensed before distribution.

**Product branding:** Tape Games (Tape 棋牌). The GitHub repository name `GuanDan` and existing internal `@tongzhuo/*` workspace package names remain unchanged to avoid breaking imports and links.
