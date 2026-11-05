import type { Card, Rank, Suit } from './types'
const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
export function makeDeck(): Card[] {
  const result: Card[] = []
  for (const deck of [0, 1] as const) {
    for (const suit of suits) for (let value = 2; value <= 14; value++) {
      result.push({ id: `${deck}-${suit}-${value}`, deck, suit, rank: value as Rank })
    }
    for (const joker of ['small', 'big'] as const) result.push({ id: `${deck}-joker-${joker}`, deck, suit: 'joker', joker })
  }
  return result
}
/** Fisher-Yates: pass a cryptographically secure RNG for production. */
export function shuffle(cards: readonly Card[], random: () => number): Card[] {
  const out = [...cards]
  for (let i = out.length - 1; i > 0; i--) {
    const x = random()
    if (!Number.isFinite(x) || x < 0 || x >= 1) throw new Error('RNG must return a number in [0,1)')
    const j = Math.floor(x * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
export function deal(cards: readonly Card[]): [Card[], Card[], Card[], Card[]] {
  if (cards.length !== 108 || new Set(cards.map(c => c.id)).size !== 108) throw new Error('Expected 108 unique cards')
  return [cards.slice(0, 27), cards.slice(27, 54), cards.slice(54, 81), cards.slice(81, 108)]
}
