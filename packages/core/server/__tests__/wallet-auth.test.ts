import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { WalletAuth } from '../wallet-auth'
import { UserStore } from '../user-store'

const ADDR = '0x1111111111111111111111111111111111111111'
const ORIGIN = 'http://localhost:5173'
let db: Database.Database
let wallet: WalletAuth

describe('wallet challenge and signup security gates', () => {
  beforeEach(() => {
    db = new Database(':memory:')
    db.exec(`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_id INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 1000,
      created_at INTEGER NOT NULL
    )`)
    wallet = new WalletAuth(db, new UserStore(db, 'test-secret'))
  })
  afterEach(() => db.close())

  it('creates unpredictable, distinct and short-lived signed messages', () => {
    const first = wallet.challenge(ADDR, 56, ORIGIN)
    const second = wallet.challenge(ADDR, 56, ORIGIN)
    expect(first.challengeId).not.toBe(second.challengeId)
    expect(first.message).toContain(ADDR)
    expect(first.message).toContain('Chain ID: 56')
    expect(first.message).toContain('localhost:5173 wants you to sign in')
    expect(first.message).toContain('Expiration Time:')
  })

  it('rejects origin confusion, invalid address, unsafe HTTP and non-numeric chains', () => {
    expect(() => wallet.challenge('0x123', 56, ORIGIN)).toThrow()
    expect(() => wallet.challenge(ADDR, '56', ORIGIN)).toThrow()
    expect(() => wallet.challenge(ADDR, 56, 'http://example.com')).toThrow()
    expect(() => wallet.challenge(ADDR, 56, 'https://example.com/path')).toThrow()
  })

  it('never issues a session merely because an address is connected', async () => {
    const { challengeId } = wallet.challenge(ADDR, 56, ORIGIN)
    await expect(wallet.verify(challengeId, '0x1234', ORIGIN)).rejects.toThrow('INVALID_SIGNATURE')
    await expect(wallet.verify(challengeId, '0x' + 'a'.repeat(130), 'https://phishing.site'))
      .rejects.toThrow('ORIGIN_MISMATCH')
  })

  it('rejects replayed and expired challenges before signature verification', async () => {
    const { challengeId } = wallet.challenge(ADDR, 56, ORIGIN)
    db.prepare('UPDATE wallet_challenges SET used_at = ? WHERE id = ?').run(Date.now(), challengeId)
    await expect(wallet.verify(challengeId, '0x' + 'a'.repeat(130), ORIGIN))
      .rejects.toThrow('CHALLENGE_EXPIRED')
    const next = wallet.challenge(ADDR, 56, ORIGIN)
    db.prepare('UPDATE wallet_challenges SET expires_at = ? WHERE id = ?').run(1, next.challengeId)
    await expect(wallet.verify(next.challengeId, '0x' + 'a'.repeat(130), ORIGIN))
      .rejects.toThrow('CHALLENGE_EXPIRED')
  })
})
