import { describe, expect, it } from 'vitest'
import { detectBrand, validEvmAddress } from './src/wallet/providers'

describe('wallet provider detection', () => {
  it('recognizes supported wallet provider names and reverse DNS identifiers', () => {
    expect(detectBrand('Binance Wallet')).toBe('binance')
    expect(detectBrand('OKX Wallet')).toBe('okx')
    expect(detectBrand('TokenPocket')).toBe('tokenpocket')
    expect(detectBrand('Unknown', 'pro.tokenpocket.wallet')).toBe('tokenpocket')
    expect(detectBrand('Some unrelated wallet')).toBeNull()
  })
  it('rejects invalid EVM addresses before account connection', () => {
    expect(validEvmAddress('0x' + '1'.repeat(40))).toBe(true)
    expect(validEvmAddress('0x' + 'A'.repeat(40))).toBe(true)
    expect(validEvmAddress('0x' + 'g'.repeat(40))).toBe(false)
    expect(validEvmAddress('0x123')).toBe(false)
    expect(validEvmAddress(null)).toBe(false)
  })
})
