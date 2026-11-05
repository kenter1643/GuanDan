import type { Card, Pattern, RuleConfig } from './types'

const points = (c: Card, level: number): number => c.suit === 'joker' ? (c.joker === 'big' ? 17 : 16) : c.rank === level ? 15 : c.rank
const seqRank = (c: Card): number => c.suit === 'joker' ? 99 : c.rank

function sequence(ranks: number[], each: number, length: number): number | null {
  if (ranks.length !== length * each) return null
  const freq = new Map<number, number>()
  for (const r of ranks) freq.set(r, (freq.get(r) ?? 0) + 1)
  const distinct = [...freq.keys()].sort((a, b) => a - b)
  if (distinct.length !== length || distinct.some(r => freq.get(r) !== each)) return null
  if (each === 1 && length === 5 && distinct.join(',') === '2,3,4,5,14') return 5
  if (distinct.some(r => r === 2 || r > 14)) return null
  if (distinct[distinct.length - 1] - distinct[0] !== length - 1) return null
  return distinct[distinct.length - 1]
}

/** Only plain combinations. Classic wildcard interpretations are NOT implemented. */
export function classifyPlain(cards: readonly Card[], config: RuleConfig): Pattern | null {
  const n = cards.length
  if (!n || new Set(cards.map(c => c.id)).size !== n) return null
  if (n === 4 && cards.every(c => c.suit === 'joker') &&
    cards.filter(c => c.suit === 'joker' && c.joker === 'big').length === 2 &&
    cards.filter(c => c.suit === 'joker' && c.joker === 'small').length === 2) {
    return { name: 'four_jokers', count: n, primary: 99, tier: 100 }
  }
  const frequency = new Map<number, number>()
  for (const c of cards) {
    const p = points(c, config.level)
    frequency.set(p, (frequency.get(p) ?? 0) + 1)
  }
  const counts = [...frequency.values()].sort((a, b) => b - a)
  const high = Math.max(...frequency.keys())
  const simple = (name: Pattern['name'], primary = high, tier = 0): Pattern => ({ name, count: n, primary, tier })
  if (n >= 4 && n <= 8 && counts.length === 1) return simple('bomb', high, n === 4 ? 10 : n === 5 ? 20 : n * 10)
  if (n === 5 && cards.every(c => c.suit !== 'joker' && c.suit === cards[0].suit)) {
    const p = sequence(cards.map(seqRank), 1, 5)
    if (p !== null) return simple('straight_flush', p, 25)
  }
  if (n === 1) return simple('single')
  if (n === 2 && counts[0] === 2) return simple('pair')
  if (n === 3 && counts[0] === 3) return simple('triple')
  if (n === 5 && counts.join(',') === '3,2') return simple('triple_pair', [...frequency].find(([, v]) => v === 3)![0])
  if (n === 5) { const p = sequence(cards.map(seqRank), 1, 5); if (p !== null) return simple('straight', p) }
  if (n === 6) {
    const arr = cards.map(seqRank)
    const pairs = sequence(arr, 2, 3)
    if (pairs !== null) return simple('three_pairs', pairs)
    const triples = sequence(arr, 3, 2)
    if (triples !== null) return simple('two_triples', triples)
  }
  return null
}

export function canBeat(next: Pattern, previous: Pattern | null): boolean {
  if (!previous) return true
  if (next.tier || previous.tier) {
    if (!next.tier) return false
    if (!previous.tier) return true
    return next.tier > previous.tier || (next.tier === previous.tier && next.primary > previous.primary)
  }
  return next.name === previous.name && next.count === previous.count && next.primary > previous.primary
}
