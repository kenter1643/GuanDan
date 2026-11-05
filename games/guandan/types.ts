export type Mode = 'classic' | 'simple'
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14
export type Joker = 'small' | 'big'
export type Card = { id: string; deck: 0 | 1; suit: Suit; rank: Rank } | { id: string; deck: 0 | 1; suit: 'joker'; joker: Joker }
export type PatternName = 'single' | 'pair' | 'triple' | 'triple_pair' | 'straight' | 'three_pairs' | 'two_triples' | 'bomb' | 'straight_flush' | 'four_jokers'
export interface Pattern { name: PatternName; count: number; primary: number; tier: number }
export interface RuleConfig { mode: Mode; level: Rank; wildcards: boolean; tribute: boolean; progression: boolean }
