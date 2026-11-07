# GuanDan Wallet Login & TapeAPI v3 Integration (Implementation Plan)

## Current delivery

- Wallet connector UI on the existing account login/register page.
- EIP-6963 provider discovery (prioritized) + explicit legacy namespaces for Binance, OKX, TokenPocket.
- User-initiated `eth_requestAccounts`, EVM address validation, chain ID display.
- No approvals, transactions, transfers, private keys, seed phrases or local wallet-address storage.
- **Connection is NOT authentication and does NOT create a user.**

## Compatibility and limits

- Desktop: needs the corresponding injected extension.
- Mobile: works if the wallet's in-app DApp browser injects an EIP-1193 provider.
- Normal iPhone Safari/Chrome without an injected wallet requires future WalletConnect v2 / wallet-deeplink integration (not shipped).
- EIP-6963 `name` / `rdns` are self-attested and cannot authenticate wallet brands.
- Chain 56 (BNB Smart Chain) is planned for TapeAPI reads. Login should not require transactions or a specific chain unless the SIWE domain says so.

## Wallet registration/authentication — security gate (NOT YET IMPLEMENTED)

Implement [EIP-4361 Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361) through a vetted signature-validation library; do **not** implement ad-hoc ECDSA or accept submitted wallet addresses as proof.

1. `POST /api/auth/wallet/challenge` with the intended EVM address and canonical domain. Server generates a CSPRNG nonce, one-time record, issuedAt / expiresAt, URI, chainId, statement and scheme; challenge expires within 5 minutes, bound to origin/domain, address and session. Apply IP+address rate limits.
2. Wallet signs the exact server-issued message with `personal_sign` / a suitable EIP-4361 signing API, with no approval or blockchain transaction.
3. `POST /api/auth/wallet/verify` accepts the exact message + signature, and optionally wallet brand for analytics only.
4. On the server, parse and validate the SIWE message, require exact domain/URI/chain/address/nonce/time, compare the server-issued challenge and atomically mark it spent; validate EOA signatures with a vetted package such as viem and account abstraction signatures via EIP-1271 only if supported.
5. Within one SQLite transaction, resolve a `wallet_accounts(chain_id, address_normalized UNIQUE, user_id REFERENCES users)` mapping. Returning account must correspond to the verified signer. Create a new user only if the address is unbound. Never allow self-service takeover of an existing password account or ambiguous binding.
6. Sign the existing Tongzhuo session token by UserStore and use it for authenticated Socket.IO reconnect and room membership. A wallet address by itself must never become a player/session ID.
7. Implement explicit verified signature flow for **link wallet to existing password user** with separate user session + fresh signature; reject addresses already bound to a different user.
8. Test expired nonce, reused nonce, wrong origin, wrong chain, swapped address, replayed signature, two concurrent requests, invalid EIP-1271, chain/account changes, user logout.
9. Keep username/password login available as a fallback; let users revoke/unlink wallets only after independent verified authentication.
10. Avoid production plaintext sensitive wallet signature logging; wallet address is personal account data and should have retention/deletion policy.

**Dependency gate:** this environment could not fetch npm packages or regenerate `package-lock.json`; adding a signature verifier without its locked dependencies would break `npm ci`. Therefore the wallet registration endpoints must remain disabled until the secure verifier and lockfile are installed and validated in CI.

## TapeAPI 3.0 — separate from login

Source: https://tapeapi.fun/docs/en/
SDK: https://github.com/BruceLanLan/tapeapi
TapeAPI 3.0.0 release (2026-11-06). The public API is a signed/read-only service at https://api.tapeapi.fun/tapeapi/v1, under identity `11.1013.tape` on BNB Chain (chainId 56).

Proposed integration AFTER wallet registration:
- Server-side only `TapeApiService` reads (e.g. public TapeOut chain data) via the pinned `@tapeapi/sdk` **with signature and delegation verification**, not raw fetch trusting an unchecked response.
- A `TapeApiV3Adapter` exposes a narrow `readVerifiedPublicData(method, params)` API. Verification failures are hard errors; no silent fallback to unsigned responses.
- Persist only necessary, non-sensitive receipts and their verification status, with explicit provenance.
- `@tapeapi/passport` is experimental and **read-only** for ERC-8004 agent identities; it is NOT user registration, login, or wallet proof.
- `@tapeapi/interop` visitor grant is experimental and NOT authentication; do not gate gameplay or custodial payments on it.
- Paid methods/escrow are not audited/deployed per TapeAPI docs. No paid calls, spending permissions, wallet approval or token deposit in the game-login flow.
- `BEM` wallet balance display should be a separate opt-in feature, backed by verified API reads, not a side effect of login.

## Acceptance

- UI: wallet buttons discover correct injected providers when multiple are installed.
- Connection prompts only from a user click; rejected permissions show a safe error.
- No extension → display install/in-wallet-browser guidance, no fake login.
- Account registration requires a verified SIWE signature + server nonce, covered by tests.
- TapeAPI read results require verification via the published 3.x SDK.
- Run `npm ci && npm run test && npm -w client run build` and mobile/desktop tests before merge.

## Dependencies and rollout

This PR is **wallet connection only**, intentionally no authentication bypass. Stage 2 (separate PR) introduces verified SIWE registration with a vetted dependency and an updated npm lockfile; Stage 3 adds TapeAPI 3.0 verified read adapter. See existing PR #2 for unrelated Guandan multiplayer fixes.
