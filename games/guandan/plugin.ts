import type { GameServerPlugin } from '@tongzhuo/core-shared'
import { randomInt } from 'node:crypto'
import { applyAction, clientView, newSimpleRound } from './engine'
import type { GuandanRound } from './engine'

const cryptographicRandom = () => randomInt(0, 0x100000000) / 0x100000000

/** Intentionally NOT registered until a working H5 game client is provided. */
export const guandanSimpleServerPlugin: GameServerPlugin<GuandanRound> = {
  id: 'guandan-simple',
  name: '简化掼蛋',
  description: '四人两队，两副牌，单副牌简化玩法',
  minPlayers: 4,
  maxPlayers: 4,
  deckConfig: {
    suits: ['spades', 'hearts', 'diamonds', 'clubs'],
    ranks: ['2','3','4','5','6','7','8','9','10','J','Q','K','A'],
    jokers: 2,
  },
  createInitialState(players) { return newSimpleRound(players, cryptographicRandom) },
  handleEvent(state, playerId, event, payload) {
    if (event !== 'play' && event !== 'pass') return { state, error: '未知事件' }
    const input = payload !== null && typeof payload === 'object' ? payload as Record<string, unknown> : {}
    const action = event === 'pass'
      ? { type: 'pass' as const }
      : { type: 'play' as const, cardIds: Array.isArray(input.cardIds) ? input.cardIds : [] }
    return applyAction(state, playerId, action)
  },
  getClientState: clientView,
  checkGameEnd(state) { return state.winner },
  resolveForfeitWinner(state, forfeitingPlayerId) {
    const loserSeat = state.players.findIndex(p => p.id === forfeitingPlayerId)
    if (loserSeat < 0 || state.players.length !== 4) return null
    // Seats 0/2 and 1/3 are partners. The clockwise neighbor is the opposing team.
    return state.players[(loserSeat + 1) % 4].id
  },
}
