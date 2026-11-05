import { describe, it, expect } from 'vitest'
import { makeDeck, shuffle, deal } from '../cards'
import { classicConfig, simpleConfig } from '../config'
import { classifyPlain, canBeat } from '../rules'
import type { Card, Rank, Suit } from '../types'

const c = (rank: Rank, suit: Suit = 'spades', deck: 0 | 1 = 0): Card =>
  ({ id: `${deck}-${suit}-${rank}`, deck, suit, rank })

describe('guandan stage 1: plain cards', () => {
  it('creates and deals 108 unique cards', () => {
    const deck = makeDeck()
    expect(deck).toHaveLength(108)
    expect(new Set(deck.map(c => c.id)).size).toBe(108)
    expect(deal(deck).map(h => h.length)).toEqual([27, 27, 27, 27])
  })
  it('shuffle preserves card IDs and is reproducible with a deterministic source', () => {
    const deck = makeDeck()
    const a = shuffle(deck, () => 0.5)
    expect(a).toEqual(shuffle(deck, () => 0.5))
    expect(new Set(a.map(x => x.id))).toEqual(new Set(deck.map(x => x.id)))
  })
  it('recognizes a mixed-suit five-card straight', () => {
    const p = classifyPlain([c(3), c(4, 'hearts'), c(5), c(6), c(7)], simpleConfig())
    expect(p?.name).toBe('straight')
  })
  it('recognizes straight flush separately', () => {
    expect(classifyPlain([c(3), c(4), c(5), c(6), c(7)], simpleConfig())?.name).toBe('straight_flush')
  })
  it('rejects wrapped K-A-2 sequences', () => {
    expect(classifyPlain([c(10), c(11, 'hearts'), c(12), c(13), c(14)], simpleConfig())?.name).toBe('straight')
    expect(classifyPlain([c(11), c(12, 'hearts'), c(13), c(14), c(2)], simpleConfig())).toBeNull()
  })
  it('four jokers outranks any bomb', () => {
    const jokers = makeDeck().filter(x => x.suit === 'joker')
    const four = classifyPlain(jokers, classicConfig())!
    const bomb = classifyPlain([c(8), c(8, 'hearts'), c(8, 'clubs'), c(8, 'diamonds')], classicConfig())!
    expect(canBeat(four, bomb)).toBe(true)
  })
  it('six card bomb beats straight flush; five card bomb loses', () => {
    const deck = makeDeck()
    const six = classifyPlain(deck.filter(x => x.suit !== 'joker' && x.rank === 9).slice(0, 6), simpleConfig())!
    const five = classifyPlain(deck.filter(x => x.suit !== 'joker' && x.rank === 9).slice(0, 5), simpleConfig())!
    const sf = classifyPlain([c(3), c(4), c(5), c(6), c(7)], simpleConfig())!
    expect(sf.name).toBe('straight_flush')
    expect(canBeat(six, sf)).toBe(true)
    expect(canBeat(five, sf)).toBe(false)
  })
  it('rejects duplicate physical IDs', () => {
    expect(classifyPlain([c(8), c(8)], simpleConfig())).toBeNull()
  })
})
