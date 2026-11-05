import { deal, makeDeck, shuffle } from './cards'
import { canBeat, classifyPlain } from './rules'
import { simpleConfig } from './config'
import type { Card, Pattern, RuleConfig } from './types'

export type Seat = 0 | 1 | 2 | 3
export type Phase = 'playing' | 'ended'
export interface GuandanPlayer { id: string; hand: Card[]; finishPlace: number | null }
export interface PublicPlay { seat: Seat; cards: Card[]; pattern: Pattern }
export interface GuandanRound {
  players: GuandanPlayer[]
  config: RuleConfig
  phase: Phase
  currentTurn: Seat
  lastPlay: PublicPlay | null
  passedSeats: Seat[]
  finishOrder: Seat[]
  winner: string | null
  version: number
}
export type GameAction = { type: 'play'; cardIds: string[] } | { type: 'pass' }
export interface ActionResult { state: GuandanRound; error?: string }

function nextLive(state: GuandanRound, from: Seat): Seat {
  for (let step = 1; step <= 4; step++) {
    const seat = ((from + step) % 4) as Seat
    if (state.players[seat].hand.length > 0) return seat
  }
  throw new Error('No active player')
}
function team(seat: Seat) { return seat % 2 }

/** Same-team first+second => double-up; otherwise finish after third player. */
function finishIfNeeded(state: GuandanRound): void {
  if (state.finishOrder.length >= 2 && team(state.finishOrder[0]) === team(state.finishOrder[1])) {
    state.phase = 'ended'
  } else if (state.finishOrder.length === 3) {
    const remaining = state.players.findIndex(p => p.hand.length > 0) as Seat
    state.finishOrder.push(remaining)
    state.players[remaining].finishPlace = 4
    state.phase = 'ended'
  }
  if (state.phase === 'ended') state.winner = state.players[state.finishOrder[0]].id
}

/** Strictly single-round simple mode. Classic mode requires a separate complete rules engine. */
export function newSimpleRound(playerIds: string[], random: () => number): GuandanRound {
  if (playerIds.length !== 4 || new Set(playerIds).size !== 4 || playerIds.some(id => !id)) {
    throw new Error('Four unique player IDs required')
  }
  const hands = deal(shuffle(makeDeck(), random))
  return {
    players: playerIds.map((id, i) => ({ id, hand: hands[i], finishPlace: null })),
    config: simpleConfig(), phase: 'playing', currentTurn: 0, lastPlay: null,
    passedSeats: [], finishOrder: [], winner: null, version: 0,
  }
}

/** Pure transition function. Never mutates input on rejected/accepted actions. */
export function applyAction(state: GuandanRound, playerId: string, action: GameAction): ActionResult {
  if (state.phase !== 'playing' || state.config.mode !== 'simple') return { state, error: '游戏模式或阶段不支持此操作' }
  const seat = state.players.findIndex(p => p.id === playerId)
  if (seat < 0 || seat !== state.currentTurn) return { state, error: '不是你的回合' }
  const activeSeat = seat as Seat
  const player = state.players[activeSeat]
  if (player.hand.length === 0) return { state, error: '已出完手牌' }
  if (action.type === 'pass' && !state.lastPlay) return { state, error: '领出者不得过牌' }
  if (action.type === 'play') {
    const ids = action.cardIds
    if (!Array.isArray(ids) || !ids.length || ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length) {
      return { state, error: '非法牌ID' }
    }
    const mine = new Map(player.hand.map(card => [card.id, card]))
    if (ids.some(id => !mine.has(id))) return { state, error: '包含非本人手牌' }
    const cards = ids.map(id => mine.get(id)!)
    const pattern = classifyPlain(cards, state.config)
    if (!pattern || !canBeat(pattern, state.lastPlay?.pattern ?? null)) return { state, error: '牌型不合法或无法压制' }
    const updated: GuandanRound = structuredClone(state)
    const played = new Set(ids)
    updated.players[activeSeat].hand = updated.players[activeSeat].hand.filter(card => !played.has(card.id))
    updated.lastPlay = { seat: activeSeat, cards, pattern }
    updated.passedSeats = []
    updated.version++
    if (!updated.players[activeSeat].hand.length) {
      updated.finishOrder.push(activeSeat)
      updated.players[activeSeat].finishPlace = updated.finishOrder.length
      finishIfNeeded(updated)
    }
    if (updated.phase === 'playing') updated.currentTurn = nextLive(updated, activeSeat)
    return { state: updated }
  }
  const updated: GuandanRound = structuredClone(state)
  if (!updated.passedSeats.includes(activeSeat)) updated.passedSeats.push(activeSeat)
  updated.version++
  const activeOthers = updated.players.map((p, i) => ({ p, i: i as Seat }))
    .filter(({ p, i }) => p.hand.length > 0 && i !== updated.lastPlay!.seat)
  if (activeOthers.every(({ i }) => updated.passedSeats.includes(i))) {
    const owner = updated.lastPlay!.seat
    const partner = ((owner + 2) % 4) as Seat
    const next = updated.players[owner].hand.length > 0 ? owner
      : updated.players[partner].hand.length > 0 ? partner : nextLive(updated, owner)
    updated.lastPlay = null
    updated.passedSeats = []
    updated.currentTurn = next
  } else {
    updated.currentTurn = nextLive(updated, activeSeat)
  }
  return { state: updated }
}

export function clientView(state: GuandanRound, playerId: string) {
  const seat = state.players.findIndex(p => p.id === playerId)
  if (seat < 0) throw new Error('Not a game participant')
  return {
    myPlayerIndex: seat,
    playerIds: state.players.map(p => p.id),
    myHand: state.players[seat].hand,
    otherHandCounts: state.players.map((p, i) => i === seat ? null : p.hand.length),
    mode: state.config.mode,
    phase: state.phase,
    currentTurn: state.currentTurn,
    lastPlay: state.lastPlay,
    finishOrder: state.finishOrder,
    // EndedScreen compares team-based roles when both fields exist.
    myRole: seat % 2 === 0 ? 'teamA' : 'teamB',
    winner: state.winner == null ? null : state.players.findIndex(p => p.id === state.winner) % 2 === 0 ? 'teamA' : 'teamB',
    version: state.version,
  }
}
